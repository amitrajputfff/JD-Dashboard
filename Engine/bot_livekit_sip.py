#!/usr/bin/env python3
"""Pipecat bot with LiveKit transport and SIP metadata handling.

Runs as a LiveKit Agent Worker — no room name needed.
LiveKit dispatches inbound SIP calls automatically.

Required environment variables:
    LIVEKIT_URL         - LiveKit server WebSocket URL (wss://...)
    LIVEKIT_API_KEY     - LiveKit API key
    LIVEKIT_API_SECRET  - LiveKit API secret
    SARVAM_API_KEY      - Sarvam STT key
    CARTESIA_API_KEY    - Cartesia TTS key
    CEREBRAS_API_KEY    - Cerebras API key
    CEREBRAS_MODEL      - Cerebras model (default: llama3.1-8b)

Run::

    python bot_livekit_sip.py start
"""

import asyncio
import json
import os
import time
import wave
import struct
from datetime import date as _date
from datetime import datetime
from pathlib import Path

import aiohttp

from dotenv import load_dotenv
from livekit.agents import JobContext, WorkerOptions, cli
from livekit.api import DeleteRoomRequest, LiveKitAPI
from loguru import logger

logger.info("Loading pipeline components...")
from pipecat.frames.frames import (
    LLMFullResponseEndFrame,
    LLMRunFrame,
    TTSStoppedFrame,
    TTSTextFrame,
    TextFrame,
    TranscriptionFrame,
)
from pipecat.processors.audio.audio_buffer_processor import AudioBufferProcessor
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
)
from pipecat.runner.livekit import generate_token_with_agent
from pipecat.audio.filters.rnnoise_filter import RNNoiseFilter
from pipecat.services.google.gemini_live.llm import GeminiLiveLLMService, GeminiModalities, GeminiVADParams
from pipecat.transcriptions.language import Language
from pipecat.transports.livekit.transport import LiveKitParams, LiveKitTransport
from google.genai.types import HttpOptions

load_dotenv(override=True)

MIS_API_BASE = "http://192.168.14.101:3006"
CALLBACK_API_URL = "http://192.168.14.101:3006/leads/ai-lead-qualify/callback"
CATEGORY_CHANGE_API = "http://192.168.20.105:1080/services/abd/abd_beta.php"

# Shared HTTP session — reuse across calls to avoid per-request socket + memory overhead.
# Initialized lazily on first use; aiohttp connector pools connections automatically.
_http_session: aiohttp.ClientSession | None = None


def _get_http_session() -> aiohttp.ClientSession:
    global _http_session
    if _http_session is None or _http_session.closed:
        _http_session = aiohttp.ClientSession()
    return _http_session

# Language code string → pipecat Language enum (for STT _settings.language)
_LANG_CODE_TO_ENUM: dict[str, Language] = {
    "hi-IN": Language.HI_IN,
    "ml-IN": Language.ML_IN,
    "kn-IN": Language.KN_IN,
    "ta-IN": Language.TA_IN,
    "en-IN": Language.EN_IN,
    "mr-IN": Language.MR_IN,
}

# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------

def normalize_mobile(number: str) -> str:
    """Strip country code prefix, return 10-digit mobile number."""
    n = number.strip().replace(" ", "").replace("-", "")
    if n.startswith("+91"):
        n = n[3:]
    elif n.startswith("91") and len(n) == 12:
        n = n[2:]
    if n.startswith("0") and len(n) == 11:
        n = n[1:]
    return n


async def fetch_lead(lead_id: str = "", mobile: str = "") -> dict | None:
    """Fetch lead from MIS API.

    Tries ``lead_id`` first (passed via room metadata by the call orchestrator),
    then falls back to ``buyer_number`` (caller mobile).  Uses ``limit=1`` so
    only the single most-recent matching record is returned — avoids fetching
    the full 50-record page and keeps call-start latency minimal.
    """
    today = _date.today().strftime("%Y-%m-%d")
    if lead_id:
        params = f"lead_id={lead_id}&page=1&limit=1&inhouse=1&fromdate={today}&todate={today}"
    elif mobile:
        params = f"mobile={mobile}&page=1&limit=1&inhouse=1&fromdate={today}&todate={today}"
    else:
        logger.warning("[API FETCH] fetch_lead: no lead_id or mobile provided")
        return None

    url = f"{MIS_API_BASE}/leads/ai-lead-qualify/mis?{params}"
    logger.info(f"[API FETCH] GET {url}")
    try:
        session = _get_http_session()
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
            status_code = resp.status
            data = await resp.json()
            results = data.get("results", {})
            records = results.get("data", [])
            if records:
                record = records[0]
                logger.info(
                    f"[API FETCH] {status_code} OK — "
                    f"lead_id={record.get('_id')} | call_id={record.get('call_id')} | "
                    f"catname={record.get('catname')} | "
                    f"buyer={record.get('buyer_details', {}).get('buyer_name')} | "
                    f"city={record.get('buyer_details', {}).get('buyer_city')}"
                )
                return record
            logger.warning(
                f"[API FETCH] {status_code} — no lead for params={params!r} | "
                f"total={results.get('total_counts', 0)}"
            )
    except Exception as e:
        logger.error(f"[API FETCH] fetch_lead failed: {e}")
    return None


async def fetch_category_schema(srchterm: str) -> dict | None:
    """Fetch new qualification schema when buyer requests a product category change.

    Called mid-call (fire-and-forget via create_task) so it never blocks frame flow.
    """
    url = f"{CATEGORY_CHANGE_API}?v=1&chatbot=1&pos_change=1&srchterm={srchterm}"
    logger.info(f"[CATEGORY API] GET {url}")
    try:
        session = _get_http_session()
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
            # Server returns valid JSON but with Content-Type: text/html — parse manually
            data = json.loads(await resp.text())
            if data.get("error", {}).get("code") == 0:
                results = data.get("results", {})
                schema = results.get("qualification_schema", results)
                logger.info(
                    f"[CATEGORY API] OK — "
                    f"catname={schema.get('catname')} | "
                    f"questions={schema.get('total_questions', 0)}"
                )
                return schema
            logger.warning(f"[CATEGORY API] error: {data.get('error')}")
    except Exception as e:
        logger.error(f"[CATEGORY API] fetch_category_schema failed for term={srchterm!r}: {e}")
    return None


async def send_callback(payload: dict):
    """POST call results to the AI lead qualify callback API."""
    logger.info(
        f"[CALLBACK] POST {CALLBACK_API_URL} — "
        f"call_id={payload.get('call_id')} | lead_id={payload.get('lead_id')} | "
        f"outcome={payload.get('call_outcome')}"
    )
    try:
        session = _get_http_session()
        async with session.post(
            CALLBACK_API_URL,
            json=payload,
            timeout=aiohttp.ClientTimeout(total=10),
        ) as resp:
            status_code = resp.status
            body = await resp.text()
            logger.info(f"[CALLBACK] {status_code} — {body[:300]}")
    except Exception as e:
        logger.error(f"[CALLBACK] send_callback failed: {e}")


# ---------------------------------------------------------------------------
# Language configuration
# ---------------------------------------------------------------------------

LANG_CONFIGS = {
    "malayalam": {
        "stt_language": "ml-IN",
        "tts_language": "ml-IN",
        "tts_voice": "simran",
        "tts_pace": 1.1,
        "tts_temperature": 0.7,
        "stt_mode": "codemix",
        "name": "Malayalam",
        "lang_notes": (
            "LANGUAGE NOTES — MALAYALAM\n\n"
            "FILLERS — use one in ~2 of every 3 responses:\n"
            '- "അല്ലെ," (meaning "right?")\n'
            '- "ശരി," (meaning "okay/right")\n'
            '- "ഒന്ന്," (brief hesitation)\n'
            '- "അത്," (meaning "um/that")\n'
            '- "ആ," (acknowledgement, like "ah")\n\n'
            "Never repeat the same filler twice in a row. Never force it.\n"
            'Micro-correction (once per 5–6 turns max): "എത്ര, ഏകദേശം എത്ര budget?"\n\n'
            "BUDGET: If user mentions budget: 'ശരി, budget note ചെയ്തു. Price sellers നിങ്ങളെ contact ചെയ്ത് പറയും.'\n\n"
            "CLOSE: 'സമയം നൽകിയതിന് നന്ദി. ബന്ധപ്പെട്ട sellers ഉടൻ നിങ്ങളെ contact ചെയ്യും. നിങ്ങൾക്ക് നല്ല ദിവസം.'"
        ),
        "greeting_tts": "ഹലോ, ഞാൻ Justdial-ൽ നിന്ന് വിളിക്കുകയാണ്. നിങ്ങളിൽ നിന്ന് {product}-നായി ഒരു enquiry ലഭിച്ചിരുന്നു, അത് ഇപ്പോഴും ആവശ്യമുണ്ടോ?",
        "lang_examples": (
            "\n\n--- EXAMPLE CONVERSATIONS (match this style exactly) ---\n\n"
            "Customer: ഹലോ\n"
            "You: ഹലോ, ഞാൻ Justdial-ൽ നിന്ന് വിളിക്കുകയാണ്. നിങ്ങളിൽ നിന്ന് washing machine-നായി ഒരു enquiry ലഭിച്ചിരുന്നു, അത് ഇപ്പോഴും ആവശ്യമുണ്ടോ?\n\n"
            "Customer: ഉവ്വ്, ആവശ്യമുണ്ട്\n"
            "You: ശരി, കുറച്ച് വിവരങ്ങൾ ചോദിക്കട്ടെ. fully automatic ആണോ semi automatic ആണോ വേണ്ടത്?\n"
        ),
    },
    "kannada": {
        "stt_language": "kn-IN",
        "tts_language": "kn-IN",
        "tts_voice": "roopa",
        "tts_pace": 0.9,

        "tts_temperature": 0.6,
        "stt_mode": "codemix",
        "name": "Kannada",
        "greeting_tts": "ಹಲೋ, ನಾನು Justdial-ನಿಂದ call ಮಾಡುತ್ತಿದ್ದೇನೆ. ನಿಮ್ಮ {product} enquiry ಬಗ್ಗೆ ತಿಳಿಯಬೇಕಿತ್ತು. ಈಗಲೂ ಬೇಕಾ?",
        "lang_examples": (
            "\n\n--- EXAMPLE CONVERSATIONS (match this style exactly) ---\n\n"
            "Customer: ಹಲೋ\n"
            "You: ಹಲೋ, ನಾನು Justdial-ನಿಂದ call ಮಾಡುತ್ತಿದ್ದೇನೆ. ನಿಮ್ಮ enquiry ಬಗ್ಗೆ ತಿಳಿಯಬೇಕಿತ್ತು. ಈಗಲೂ machine ಬೇಕಾ?\n\n"
            "Customer: ಹೌದು, ಒಂದು AC ಬೇಕು\n"
            "You: ಸರಿ, AC, ಎಷ್ಟು ton ಬೇಕು ನಿಮಗೆ?\n"
        ),
    },
    "tamil": {
        "stt_language": "ta-IN",
        "tts_language": "ta-IN",
        "tts_voice": "roopa",
        "tts_pace": 0.9,

        "tts_temperature": 0.6,
        "stt_mode": "codemix",
        "name": "Tamil",
        "greeting_tts": "ஹலோ, நான் Justdial-லிருந்து call பண்றேன். உங்க {product} enquiry பத்தி தெரிஞ்சுக்கணும். இப்பவும் வேணுமா?",
        "lang_examples": (
            "\n\n--- EXAMPLE CONVERSATIONS (match this style exactly) ---\n\n"
            "Customer: ஹலோ\n"
            "You: ஹலோ, நான் Justdial-லிருந்து call பண்றேன். உங்க enquiry பத்தி தெரிஞ்சுக்கணும். இப்பவும் machine வேணுமா?\n\n"
            "Customer: ஆமா, washing machine வேணும்\n"
            "You: சரி, washing machine, எந்த type வேணும் உங்களுக்கு?\n"
        ),
    },
    "hindi": {
        "stt_language": "hi-IN",
        "tts_language": "hi-IN",
        "tts_voice": "simran",
        "tts_pace": 1.0,
        "tts_temperature": 0.55,
        "stt_mode": "codemix",
        "name": "Hindi",
        "greeting_tts": "हेलो, मैं Tanya बोल रही हूँ Justdial से — आपको {product} की requirement है ना?",
        "lang_notes": (
            "LANGUAGE NOTES — HINDI (READ CAREFULLY)\n\n"
            "CRITICAL: NEVER output Malayalam, Tamil, Kannada, Marathi, or any other language. Hindi only.\n"
            "If you find yourself writing ക, ശ, ர, ಸ, or any non-Devanagari/non-English script → STOP and rewrite in Hindi.\n\n"
            "STYLE: Natural spoken Hinglish. NOT formal. NOT literary. Like a real call center agent.\n"
            "  RIGHT: 'हाँ जी', 'अच्छा', 'ठीक है'\n"
            "  WRONG: 'आपकी बात सुनकर खुशी हुई', 'मैं आपकी सहायता के लिए यहाँ हूँ'\n\n"
            "ADDITIONAL ALLOWED ENGLISH WORDS (for Hindi calls):\n"
            "bedroom, living room, hall, office, install, floor\n\n"
            "FORBIDDEN WORDS — these are too literary/formal. Use the casual alternative:\n"
            "  शयनकक्ष → bedroom\n"
            "  बैठक कक्ष → living room\n"
            "  कार्यालय → office\n"
            "  स्थापित → install\n"
            "  पर्याप्त → काफी है / ठीक रहेगा / sahi rahega\n"
            "  उपयुक्त → सही\n"
            "  सूचित → बताना\n"
            "  उचित → सही / ठीक\n"
            "  सुविधाजनक → convenient / comfortable\n"
            "GENERAL RULE: if a Hindi word sounds like something from a textbook or a government notice, do NOT use it. Use the simplest, most everyday word instead. When in doubt, use English.\n\n"
            "NUMBER PRONUNCIATION (CRITICAL for TTS):\n"
            "  NEVER write '1.5 ton' → write 'डेढ़ ton'\n"
            "  NEVER write '2.5 ton' → write 'ढाई ton'\n"
            "  '1 ton', '2 ton' are fine as-is\n\n"
            "OPTION PHRASING — NEVER list options robotically:\n"
            "  WRONG: 'Split AC, Window AC, Portable AC में से कौन सा?'\n"
            "  RIGHT: 'split AC चाहिए, या window AC?'\n"
            "  WRONG: '1 Ton, 1.5 Ton, या 2 Ton?'\n"
            "  RIGHT: '1 ton सोच रहे हैं, या डेढ़ ton?'\n"
            "  For 3 options: mention the most common 2, then add 'या कुछ और?'\n\n"
            "FILLERS — use ONE in ~2 of every 3 responses (mandatory for natural sound):\n"
            '- "अच्छा," — acknowledgement, like "oh I see"\n'
            '- "हाँ," — light agreement filler\n'
            '- "जी," — respectful filler\n'
            '- "तो," — connecting thought ("so...")\n'
            '- "ठीक है," — soft okay\n\n'
            "FUMBLES — once every 3-4 turns:\n"
            '- "split, मतलब split AC है ना?"\n'
            '- "कितना, कितने ton का सोच रहे हैं?"\n\n'
            "CLOSE: 'ठीक है जी, details मिल गई. जल्द ही relevant sellers आपसे contact करेंगे. आपका समय देने के लिए धन्यवाद.'\n\n"
            "NEVER use: शयनकक्ष, बैठक कक्ष, कार्यालय, स्थापित, आवश्यकता, पर्याप्त, उपयुक्त, उचित, सूचित, प्राप्त, विवरण, अनुसार, सुविधाजनक"
        ),
        "lang_examples": (
            "\n\n--- EXAMPLE CONVERSATIONS (match this style EXACTLY — same casual tone, same phrasing) ---\n\n"
            "Customer: हेलो\n"
            "You: हेलो, मैं Tanya बोल रही हूँ Justdial से — आपको AC की requirement है ना?\n\n"
            "Customer: हाँ जी\n"
            "You: अच्छा, तो आपसे कुछ details लेनी हैं ताकि सही sellers से connect करा सकें. किस type का AC चाहिए — split, window, या portable?\n\n"
            "Customer: split\n"
            "You: जी, split. capacity कितनी चाहिए — 1 ton, या डेढ़ ton?\n\n"
            "Customer: डेढ़ ton\n"
            "You: ठीक है. कोई brand preference है, या कुछ भी चलेगा?\n\n"
            "Customer: कोई भी चलेगा\n"
            "You: अच्छा. budget roughly कितना है?\n\n"
            "Customer: 5 रुपये\n"
            "You: sorry, मतलब कितना — जैसे 30,000 या 35,000?\n\n"
            "Customer: 35 हजार\n"
            "You: जी, 35,000. कहाँ install करना है — bedroom में?\n\n"
            "Customer: bedroom में\n"
            "You: ठीक है जी, details मिल गई. जल्द ही relevant sellers आपसे contact करेंगे. आपका समय देने के लिए धन्यवाद.\n"
        ),
    },
    "english": {
        "stt_language": "en-IN",
        "tts_language": "en-IN",
        "tts_voice": "priya",
        "tts_pace": 0.9,

        "tts_temperature": 0.6,
        "stt_mode": "transcribe",
        "name": "English",
        "greeting_tts": "Hello, I am calling from Justdial regarding your {product} enquiry. Are you still looking for it?",
        "lang_examples": (
            "\n\n--- EXAMPLE CONVERSATIONS (match this style exactly) ---\n\n"
            "Customer: Hello\n"
            "You: Hello, I am calling from Justdial regarding your enquiry. Are you still looking for this product?\n\n"
            "Customer: Yes, I need a washing machine\n"
            "You: Okay, washing machine. What type are you looking for, fully automatic or semi automatic?\n"
        ),
    },
    "marathi": {
        "stt_language": "mr-IN",
        "tts_language": "mr-IN",
        "tts_voice": "simran",
        "tts_pace": 0.9,

        "tts_temperature": 0.6,
        "stt_mode": "codemix",
        "name": "Marathi",
        "greeting_tts": "हेलो, मी Justdial-मधून call करत आहे. तुमच्या {product} enquiry बद्दल जाणून घ्यायचे होते. अजूनही हवे आहे का?",
        "lang_examples": (
            "\n\n--- EXAMPLE CONVERSATIONS (match this style exactly) ---\n\n"
            "Customer: हेलो\n"
            "You: हेलो, मी Justdial-मधून call करत आहे. तुमच्या enquiry बद्दल जाणून घ्यायचे होते. अजूनही machine हवे आहे का?\n\n"
            "Customer: हो, washing machine हवे\n"
            "You: बरे, washing machine, कोणत्या type चे हवे तुम्हाला?\n"
        ),
    },
}

def get_lang_config() -> dict:
    """Return the active language config based on BOT_LANGUAGE env var."""
    lang = os.environ.get("BOT_LANGUAGE", "english").lower()
    if lang not in LANG_CONFIGS:
        logger.warning(f"Unknown BOT_LANGUAGE={lang!r}, falling back to english")
        lang = "english"
    return LANG_CONFIGS[lang]


def build_greeting_text(lang_cfg: dict, product: str) -> str:
    """Build the hardcoded TTS greeting string with the product name filled in.

    Uses the per-language greeting_tts template from LANG_CONFIGS.
    Falls back to a generic English sentence if the template is missing.
    """
    template = lang_cfg.get(
        "greeting_tts",
        "Hello, I am calling from Justdial regarding your {product} enquiry. Are you still looking for it?",
    )
    return template.format(product=product or "product")



# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """
ROLE
You are Tanya, a product qualification agent calling on behalf of Justdial. The customer recently searched for a product on Justdial. Your only job is to ask them a fixed set of qualification questions — one at a time, in order — so Justdial can connect them with the right sellers.

You are not a salesperson. You do not recommend, compare, or evaluate products. You do not answer anything outside this qualification task.

LANGUAGE

{script_rule}

Allowed English terms — use exactly as written, do not transliterate:
AC, machine, washing machine, split, window, ton, kg, fully automatic, semi automatic,
top load, front load, brand, model, type, budget, capacity, inverter, Justdial.

When in doubt about a {language_name} word, use English. Never use formal or literary words.

TONE

Speak like a warm, professional call center agent — natural, brief, and efficient. Not robotic, not overly formal.
Every response: 1 acknowledgement + 1 question. Maximum 15 words total.
Always end with a question mark.
Rotate acknowledgements — never repeat the same one twice in a row:
"अच्छा जी,", "ठीक है,", "जी,", "हाँ जी,", "समझ गई,", "ओके जी,"
Add a natural filler or slight fumble once every 3 turns to sound human:
"हाँ — मतलब,", "अच्छा, एक second,", "जी, तो —"

CONVERSATION FLOW

Step 1 — Opening (CONFIRMATION REQUIRED — do NOT skip)
Deliver the greeting from the call context exactly. Then STOP. Wait for the customer to respond.
Do NOT say the bridging sentence. Do NOT ask Question 1. Do NOT proceed until the customer has responded.

Customer says YES (हाँ, yes, haan, bilkul, theek hai, sahi hai, chahiye, etc.):
→ Say exactly: "अच्छा जी, आपको सही sellers से connect कराने के लिए मुझे आपसे कुछ details लेनी होंगी."
→ Then ask Question 1.

Customer says NO (nahi, nahi chahiye, nahi tha, cancel, etc.):
→ Ask: "जी, तो क्या आप कोई और product देख रहे हैं?"
→ If they name a different product: treat as a product change and proceed with new product.
→ If they confirm they don't need anything: "ठीक है जी, कोई बात नहीं. आपका दिन शुभ हो." End the call.

Customer says something else (unclear, asks a question, changes topic, gives partial info):
→ Understand their intent first.
→ If they seem interested but unclear: re-confirm — "जी, तो क्या आपको [product] की ज़रूरत है?"
→ If they are clearly interested and start answering proactively: say the bridging sentence, then ask Question 1.
→ If reluctant or confused: address briefly, then re-ask the confirmation.

HARD RULE: Question 1 must NOT be asked until the customer has explicitly confirmed they still need the product.

Step 2 — Questions
Ask every question from the CALL CONTEXT below, strictly in the listed order.
One question per turn. No skipping, combining, or reordering.
No questions outside the schema list.

Step 3 — Closing
After all questions are answered:
"ठीक है जी, सारी details मिल गईं. जल्द ही relevant sellers आपसे contact करेंगे. आपका समय देने के लिए शुक्रिया."
End the call.

HANDLING RADIO QUESTIONS (questions with fixed options)

When a question has listed options, state ALL options every time you ask it.
Format: "[topic] kya chahiye — [opt 1], [opt 2], ya [opt 3]?"

When the user answers a radio question:

Case 1 — Answer clearly matches a listed option, or is an obvious equivalent
(example: "डेढ़ ton" = 1.5 Ton, "15 हज़ार" is a valid budget amount):
Accept it. Acknowledge. Ask the next question.

Case 2 — Answer does not match any listed option
Do not accept it. Respond:
"जी, इस product के लिए हमारे पास यही options हैं — [list ALL options again]. आप इनमें से कौन सा चाहते हैं?"
Wait for a valid answer. Do not move on until they pick from the list.
Only exception: "कुछ भी चलेगा" or "no preference" for a preference-type question — accept and move on.

Case 3 — User asks for an explanation (example: "split और window में क्या फ़र्क है?")
Answer in one sentence only. Do not recommend anything.
Immediately re-ask the same question with all options.
Example: "जी, split AC दो units में आता है — indoor और outdoor. window AC एक unit में होती है. तो आप कौन सा चाहते हैं — split, window, या centralised?"

HANDLING SIDE QUESTIONS AND DIVERSIONS

User gives an off-topic answer (answers something different from the current question):
Acknowledge briefly. Clarify if required, and then re-ask the current question with options after clarification.
"जी, समझ गई. तो [current question with all options]?"

User asks a side question related to the product (example: "1 ton काफी रहेगा?", "कौन सा brand अच्छा है?"):
Answer in one sentence — no recommendation.
Re-ask the same current schema question immediately after.
Never advance to the next question until the current one is directly answered.

User asks an irrelevant question (weather, personal details, jokes, anything off-topic):
Formally decline: "माफ कीजिए जी, मैं इस बारे में बात नहीं कर सकती. मुझे सिर्फ आपकी product requirement note करनी है."
Re-ask the current question immediately after.

User mentions a different product mid-call (example: says "microwave chahiye" when the original enquiry was for AC):
Ask for clarification without judgment: "जी, आपको AC चाहिए या microwave?"
Wait for their answer before continuing.

If a user is mentioning specific details about the product while answering the question, kindly let them know that this call is just a brief screening, and that they can discuss details with sellers directly.

SPECIFIC SITUATIONS

Budget question:
Accept a realistic amount depending on the product being discussed. Say: "जी, budget note कर लिया. Price के लिए sellers आपसे directly contact करेंगे."
Move to the next question.

Did not catch the answer:
"माफ़ कीजिए जी, ज़रा दोबारा बताइए?"
Always rephrase the question differently from the previous time.

Correction or misunderstanding:
Use an apologetic opener instead of a positive acknowledgement:
"माफ कीजिए,", "sorry,", "माफ करें,"
Never combine an apology with a positive acknowledgement.
Right: "माफ कीजिए, मैं समझ नहीं पाई — [re-ask question]?"
Wrong: "समझ गई, माफ कीजिए — [re-ask question]?"

Not interested or rejection:
"ठीक है जी, कोई बात नहीं. आपका दिन शुभ हो." End the call.

Rude or wants to hang up:
"ठीक है जी, धन्यवाद. आपका दिन शुभ हो" End immediately.

Reschedule:
"ठीक है जी, [time] पर बात करेंगे." End the call.

HARD RULES

One question per response — no exceptions.
Never advance past the current question until the user has directly answered it.
Never recommend a product, brand, or option.
Never give prices, cost estimates, or budget judgments.
Never ask questions outside the schema.
Number format: write "डेढ़" not "1.5". Write "ढाई" not "2.5".
Forbidden formal words — never use: शयनकक्ष, बैठक कक्ष, कार्यालय, स्थापित, पर्याप्त, उचित, उपयुक्त, सूचित, प्राप्त, विवरण.

PRE-RESPONSE CHECKLIST

Is there exactly one question?
Is it in {language_name} with only the allowed English terms?
Is the total response under 20 words?
Did I acknowledge the user first?
If it is a radio question: did I list ALL options?
Am I following all HARD RULES?
"""

# SAMPLE_LEAD is used ONLY when the MIS API returns no record (local dev / testing).
# It mirrors the exact structure of a real API response so the full code path
# (question IDs, qualification_schema, buyer_details) works without a live lead.
SAMPLE_LEAD = {
    "_id": "sample_lead_007",
    "call_id": "SAMPLE_CALL_006",
    "buyer_details": {
        "buyer_name": "Neha",
        "buyer_number": "9444444444",
        "buyer_city": "Delhi",
        "is_business": 0,
    },
    "search_context": {
        "searched_keyword": "camera",
        "searched_product": {
            "product_name": "Camera",
            "product_id": "PDP-30001",
            "attributes": {},
        },
    },
    "catname": "Cameras",
    "qualification_schema": {
        "catname": "Cameras",
        "total_questions": 4,
        "question": [
            {
                "id": "Q001",
                "catname": "Cameras",
                "text": "What will you use it for",
                "type": "radio",
                "option": [
                    {"id": "O001", "text": "Photography"},
                    {"id": "O002", "text": "Videography"},
                    {"id": "O003", "text": "Both"},
                ],
            },
            {
                "id": "Q002",
                "catname": "Cameras",
                "text": "Camera type",
                "type": "radio",
                "option": [
                    {"id": "O004", "text": "DSLR"},
                    {"id": "O005", "text": "Mirrorless"},
                    {"id": "O006", "text": "Digital"},
                    {"id": "O007", "text": "Compact"},
                ],
            },
            {
                "id": "Q003",
                "catname": "Cameras",
                "text": "Budget",
                "type": "text",
                "option": "",
            },
            {
                "id": "Q004",
                "catname": "Cameras",
                "text": "Brand preference",
                "type": "text",
                "option": "",
            },
        ],
    },
}


def build_question_phrase_rules(questions: list[dict], language_name: str = "Hindi") -> str:
    """Dynamically generate QUESTION PHRASE RULES from schema questions."""
    if not questions:
        return ""

    lines = [
        "QUESTION PHRASE RULES (STRICT — DO NOT DEVIATE)",
        "",
        f"Ask each question naturally in {language_name}. The English text below is the meaning — express it in {language_name} as a short spoken question.",
        "",
    ]
    for i, q in enumerate(questions, 1):
        text = q.get("text", "").strip().rstrip(":")
        q_type = q.get("type", "")
        opts = [o.get("text", "") for o in (q.get("option") or []) if o.get("text")]
        units = q.get("quantity_unit") or [] if q_type == "quantity" else None
        lines.append(f'{i}. Meaning: "{text}"')
        if opts:
            lines.append(f'   Options: {", ".join(opts)}')
        if units:
            lines.append(f'   Units: {", ".join(units)}')
        lines.append("")

    lines += [
        "RULE:",
        f"- Ask in {language_name} only — NEVER use the English text verbatim",
        "- Keep it short and conversational",
        "- DO NOT combine questions",
        "- DO NOT add new questions",
    ]
    return "\n".join(lines)


def build_questions_text(schema: dict) -> str:
    """Convert qualification_schema into a plain-text question list."""
    questions = schema.get("question", [])
    if not questions:
        return "No specific questions — gather general requirements naturally."

    lines = []
    for i, q in enumerate(questions, 1):
        text = q.get("text", "").strip().rstrip(":")
        q_type = q.get("type", "")
        if q_type == "radio":
            opts = [o.get("text", "") for o in (q.get("option") or []) if o.get("text")]
            lines.append(f"{i}. {text}")
            if opts:
                lines.append(f"   Options: {', '.join(opts)}")
        elif q_type == "quantity":
            units = q.get("quantity_unit") or []
            lines.append(f"{i}. {text}")
            lines.append(f"   Ask for amount and unit ({', '.join(units) if units else 'any unit'})")
        else:
            lines.append(f"{i}. {text}")

    return "\n".join(lines)


_PROMPT_FILE = Path(__file__).parent / "system_prompt.txt"
_CONFIG_FILE = Path(__file__).parent / "prompt_config.json"


def _load_prompt_config() -> dict:
    if _CONFIG_FILE.exists():
        try:
            return json.loads(_CONFIG_FILE.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def build_system_prompt(record: dict, lang_key: str | None = None) -> str:
    base_prompt = _PROMPT_FILE.read_text(encoding="utf-8") if _PROMPT_FILE.exists() else SYSTEM_PROMPT
    cfg = _load_prompt_config()
    lang = lang_key or "malayalam"

    language_name = cfg.get("language_name") or LANG_CONFIGS.get(lang, LANG_CONFIGS["malayalam"])["name"]

    if cfg.get("script_rule"):
        script_rule = cfg["script_rule"]
    elif lang == "english":
        script_rule = "Use only English."
    else:
        script_rule = f"Every word MUST be in {language_name} script ONLY."

    if not record or not record.get("buyer_details"):
        logger.info("[Prompt] No lead found — using sample lead for simulation")
        record = SAMPLE_LEAD

    buyer = record.get("buyer_details", {})
    search = record.get("search_context", {})
    schema = record.get("qualification_schema", {})
    product = search.get("searched_product", {})

    name = buyer.get("buyer_name", "customer")
    keyword = search.get("searched_keyword", "")
    product_name = product.get("product_name", "") or keyword

    questions = schema.get("question", [])

    # 🔒 STRICT QUESTION CONTROL (ID-based)
    structured_questions = []
    for i, q in enumerate(questions, 1):
        structured_questions.append(f"{i}. {q.get('text')}")

    questions_block = "\n".join(structured_questions)

    mapping_block = "\n" + build_question_phrase_rules(questions, language_name) + "\n"

    opening_instruction = cfg.get("opening_instruction") or "Greet करें, confirm करें कि product अभी भी चाहिए।"
    closing_instruction = cfg.get("closing_instruction") or "सभी questions के बाद warmly close करें।"

    lead_section = f"""
━━━ इस CALL का CONTEXT ━━━

Customer: {name}
Product search: {keyword}
Product: {product_name}

━━━ CALL FLOW ━━━

Step 1 — Opening:
{opening_instruction}

Step 2 — Questions (इसी order में, एक-एक करके):
{questions_block}

Step 3 — Closing:
{closing_instruction}

एक turn में एक question — हमेशा।
"""

    runtime_enforcement = f"""
RUNTIME ENFORCEMENT (CRITICAL)

If you ask more than one question → INVALID

If you ask a question in English instead of {language_name} → INVALID

If you add new question → INVALID

If you mix {language_name} + English incorrectly → INVALID

Correct: Ask ONE question in {language_name} per turn.
Wrong: Ask in English or ask multiple questions at once.

NUMBER OUTPUT — ZERO TOLERANCE:
NEVER write "1.5" anywhere in your response. Always write "डेढ़" instead.
NEVER write "2.5" anywhere in your response. Always write "ढाई" instead.
This applies everywhere — questions, acknowledgements, confirmations, everywhere. No exceptions.
"""
    lang_notes = LANG_CONFIGS.get(lang, {}).get("lang_notes", "")
    lang_notes_block = f"\n\nLANGUAGE NOTES\n\n{lang_notes}\n" if lang_notes else ""

    return (
        base_prompt.replace("{script_rule}", script_rule).replace("{language_name}", language_name)
        + lang_notes_block
        + lead_section
        + mapping_block
        + runtime_enforcement
    )


def build_transcript(context: LLMContext) -> list[dict]:
    """Convert LLM context messages into a clean vendor/agent transcript.

    Skips system messages and the synthetic kickoff message. Maps roles to
    human-readable labels: user→vendor, assistant→agent.
    """
    transcript = []
    ROLE_MAP = {"user": "buyer", "assistant": "agent"}

    for msg in context.messages:
        role = msg.get("role", "unknown")
        if role == "system":
            continue
        content = msg.get("content", "")
        if isinstance(content, str):
            text = content.strip()
            if not text or text.startswith("Call connected."):
                continue
            transcript.append({"role": ROLE_MAP.get(role, role), "text": text})
        elif isinstance(content, list):
            parts = [
                p.get("text", "")
                for p in content
                if isinstance(p, dict) and p.get("type") == "text"
            ]
            text = " ".join(parts).strip()
            if not text or text.startswith("Call connected."):
                continue
            transcript.append({"role": ROLE_MAP.get(role, role), "text": text})
    return transcript


# Disposition registry: outcome → description (used in Gemini prompt + callback payload)
DISPOSITION_MAP: dict[str, str] = {
    "Voicemail":                        "The call went to the recipient's voicemail instead of connecting directly.",
    "Wrong Number":                     "The number dialed does not belong to the intended customer.",
    "Approved":                         "The customer confirmed the product and all the specs.",
    "Enriched":                         "The customer confirmed the product and at least one spec.",
    "Product Confirmed":                "The customer only confirmed the product and not the specs.",
    "Could Not Confirm":                "The customer did not confirm the product requirement.",
    "Alternate Number":                 "The customer provided a different or alternate contact number.",
    "Already Spoken":                   "The customer has already discussed or interacted about the requirement with JD or the seller.",
    "Will do it Myself":                "The customer prefers to take action on their own, declining further assistance.",
    "Call Rescheduled":                 "The customer asked to call at a specific date and time.",
    "Abruptly disconnected and not Receiving": "The customer disconnected the call abruptly before concluding the call.",
    "Abusive Lead":                     "The recipient exhibited abusive or inappropriate behavior during the call.",
    "DNC Client : Don't Call Further":  "The customer explicitly requested not to be contacted again.",
    "Other Cases":                      "The call outcome does not fit into any predefined categories and is handled as an exception.",
    "Technical Issue - Call Connected": "The call connected but was disrupted by technical issues.",
    "Language Issue":                   "Communication was not possible due to a language mismatch between the agent/bot and customer.",
}

_VALID_OUTCOMES = set(DISPOSITION_MAP.keys())


def _status_to_outcome(status: str) -> str:
    """Map internal call status to a valid disposition when no transcript is available."""
    return {
        "completed": "Could Not Confirm",
        "disconnected": "Abruptly disconnected and not Receiving",
    }.get(status, "Abruptly disconnected and not Receiving")


async def generate_call_analysis(transcript: list[dict], base_status: str, schema: dict) -> dict:
    """Call Gemini to extract structured call data for the callback payload.

    Returns a dict with keys:
      call_outcome, call_outcome_description, call_summary, is_business,
      qna (list of id/quest/answ dicts), product_change (dict or {}),
      rescheduled_to (str "YYYY-MM-DD : HH:MM:SS" or "").
    All Gemini work is post-call so it never adds latency to the conversation.
    """
    if not transcript:
        fallback = _status_to_outcome(base_status)
        return {
            "call_outcome": fallback,
            "call_outcome_description": DISPOSITION_MAP.get(fallback, ""),
            "call_summary": "",
            "is_business": "",
            "qna": [],
            "product_change": {},
            "rescheduled_to": "",
        }

    questions = schema.get("question", []) if schema else []
    q_list = json.dumps(
        [{"id": q.get("id", ""), "text": q.get("text", "")} for q in questions],
        ensure_ascii=False,
    )
    lines = "\n".join(f"{t['role'].upper()}: {t['text']}" for t in transcript)
    cut_note = (
        "\nNote: The buyer disconnected before the conversation was complete."
        if base_status == "disconnected"
        else ""
    )

    disposition_options = "\n".join(
        f'  "{k}": {v}' for k, v in DISPOSITION_MAP.items()
    )

    from datetime import datetime as _dt
    current_dt_str = _dt.now().strftime("%Y-%m-%d %H:%M:%S")

    prompt = f"""Analyze this JustDial AI product qualification call between an AI agent and a buyer.{cut_note}
Current date and time (use this to resolve relative reschedule expressions like "tomorrow", "after 2 hours", "next Monday"): {current_dt_str}

Transcript:
{lines}

Qualification questions that were to be covered (extract answers if the buyer mentioned them):
{q_list}

Choose the BEST matching call_outcome from ONLY these exact values (pick exactly one):
{disposition_options}

Selection rules (apply in order — use the first that matches):
1. Voicemail — call went to voicemail, no live person answered
2. Wrong Number — buyer said this is not their enquiry / wrong person
3. Abusive Lead — buyer was abusive or used inappropriate language
4. DNC Client : Don't Call Further — buyer explicitly said do not call again
5. Language Issue — call failed because of language mismatch
6. Technical Issue - Call Connected — call connected but dropped due to technical problem
7. Already Spoken — buyer said they already spoke with JD or a seller about this
8. Will do it Myself — buyer said they will handle it themselves and declined help
9. Alternate Number — buyer gave a different contact number to call
10. Call Rescheduled — buyer asked to be called back at a specific date/time
11. Abruptly disconnected and not Receiving — buyer hung up abruptly without a conclusion
12. Approved — buyer confirmed both the product AND all qualification specs (type, capacity, budget, etc.)
13. Enriched — buyer confirmed the product AND at least one spec, but not all
14. Product Confirmed — buyer confirmed they still need the product but gave no spec details
15. Could Not Confirm — buyer could not confirm whether they still need the product
16. Other Cases — none of the above apply

Return a single JSON object with exactly these keys:
- "call_outcome": one of the exact strings listed above
- "call_outcome_description": the corresponding description string from the list above
- "call_summary": 1-2 sentence English summary of what was collected and the outcome
- "is_business": "True" if buyer is purchasing for a business, "False" if personal, "" if not determined
- "qna": array of objects for each question that received an answer. Each object: {{"id": <qid string>, "quest": <question text>, "answ": <answer given by buyer>}}. Omit unanswered questions entirely.
- "product_change": object with "old_product" and "new_product" strings if the buyer changed their requirement mid-call, else {{}}
- "rescheduled_to": if call_outcome is "Call Rescheduled", the absolute datetime for the callback as a string in format "YYYY-MM-DD : HH:MM:SS". Rules: (1) resolve relative expressions like "tomorrow at 5pm", "after 2 hours", "next Monday morning" using the current date/time above. (2) If the buyer said they are busy but gave NO specific time (just "later", "not now", "call again", etc.), default to the same time tomorrow (add exactly 24 hours to the current date/time). (3) Use "" only if call_outcome is not "Call Rescheduled".

Return ONLY the JSON — no markdown, no explanation."""

    try:
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-2.5-flash:generateContent?key={os.getenv('GEMINI_API_KEY')}"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0.1},
        }
        session = _get_http_session()
        async with session.post(
            url, json=payload, timeout=aiohttp.ClientTimeout(total=10)
        ) as resp:
            data = await resp.json()
            if "candidates" not in data or not data["candidates"]:
                # Gemini returned an error (rate limit, quota, safety block, etc.)
                err = data.get("error") or data.get("promptFeedback") or data
                logger.error(f"[ANALYSIS] Gemini no candidates — response: {err}")
                raise ValueError(f"No candidates: {err}")
            raw = data["candidates"][0]["content"]["parts"][0]["text"]
            result = json.loads(raw)
            # Validate outcome — fall back if Gemini returned something not in the list
            outcome = result.get("call_outcome", "")
            if outcome not in _VALID_OUTCOMES:
                logger.warning(f"[ANALYSIS] Invalid outcome from Gemini: {outcome!r} — falling back")
                outcome = _status_to_outcome(base_status)
                result["call_outcome"] = outcome
            # Always ensure description matches the outcome
            result["call_outcome_description"] = DISPOSITION_MAP.get(outcome, "")
            result.setdefault("qna", [])
            result.setdefault("product_change", {})
            result.setdefault("rescheduled_to", "")
            return result
    except Exception as e:
        logger.error(f"[ANALYSIS] LLM analysis failed: {e}")
        fallback = _status_to_outcome(base_status)
        return {
            "call_outcome": fallback,
            "call_outcome_description": DISPOSITION_MAP.get(fallback, ""),
            "call_summary": "",
            "is_business": "",
            "qna": [],
            "product_change": {},
            "rescheduled_to": "",
        }


# ---------------------------------------------------------------------------
# Frame processors
# ---------------------------------------------------------------------------

class CallEndDetector(FrameProcessor):
    """Detect closing utterances and end the call after TTS playback completes.

    Buffers bot TTSTextFrames / LLMTextFrames (pushed downstream by Gemini Live
    output transcription).  When a TTSStoppedFrame or LLMFullResponseEndFrame
    arrives after a closing phrase, schedules call termination with a short delay
    to allow audio to finish on the participant's end.

    TranscriptionFrames (user speech) are explicitly excluded from the buffer —
    they are TextFrame subclasses and would otherwise pollute close detection.
    """

    _CLOSE_MARKERS = (
        # English
        "thank you for your time",
        "have a nice day",
        "have a great day",
        "goodbye",
        "good bye",
        # Hindi (Devanagari)
        "धन्यवाद",
        "शुक्रिया",
        "आपका दिन शुभ हो",   # rejection / hang-up close in system prompt
        "दिन शुभ हो",
        "दिन अच्छा हो",
        # Hindi (Roman — Gemini output transcription may romanise)
        "dhanyavaad",
        "dhanyawad",
        "shukriya",
        "shubh ho",
        # Hinglish close phrases from system prompt
        "sellers आपसे contact",
        "sellers contact करेंगे",
        # Marathi
        "दिवस चांगला",
        "धन्यवाद",
        # Malayalam (Devanagari not used; script below)
        "നന്ദി",
        "nanni",
        # Tamil
        "நன்றி",
        # Kannada
        "ಧನ್ಯವಾದ",
        # Universal English (model may mix in)
        "sellers will contact you",
        "relevant sellers will contact you",
        "relevant businesses will contact you",
    )

    def __init__(self, on_close, **kwargs):
        super().__init__(**kwargs)
        self._on_close = on_close
        self._buffer = ""
        self._triggered = False

    def _is_closing(self, text: str) -> bool:
        text_lower = (text or "").lower()
        return any(marker.lower() in text_lower for marker in self._CLOSE_MARKERS)

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)

        # Accumulate bot text only. TranscriptionFrame is a TextFrame subclass but
        # carries user speech — exclude it to keep the buffer bot-only.
        if (
            isinstance(frame, (TTSTextFrame, TextFrame))
            and not isinstance(frame, TranscriptionFrame)
            and direction == FrameDirection.DOWNSTREAM
        ):
            self._buffer += frame.text

        # Gemini Live emits LLMFullResponseEndFrame; traditional TTS emits TTSStoppedFrame.
        elif isinstance(frame, (TTSStoppedFrame, LLMFullResponseEndFrame)) and direction == FrameDirection.DOWNSTREAM:
            snippet = self._buffer[:120].replace("\n", " ")
            if self._is_closing(self._buffer) and not self._triggered:
                self._triggered = True
                logger.info(f"[CLOSE DETECT] Closing phrase matched — buffer: '{snippet}' — ending call")
                self.create_task(self._delayed_end(), "call-end-timer")
            else:
                logger.debug(f"[CLOSE DETECT] No match (triggered={self._triggered}) — buffer: '{snippet or '<empty>'}'")
            self._buffer = ""

        await self.push_frame(frame, direction)

    async def _delayed_end(self):
        try:
            # 7 s gives the SIP network time to deliver the last audio packet
            # before the room is deleted.
            await asyncio.sleep(2)
            await self._on_close()
        except asyncio.CancelledError:
            pass  # Pipeline already shutting down


class ProductChangeWatcher(FrameProcessor):
    """Detect mid-call product category change and fetch new qualification schema.

    Watches user TranscriptionFrames for change-signal words. When detected,
    calls on_product_change(new_keyword) via create_task so it NEVER blocks
    frame flow — zero latency impact on the live conversation.

    Placed in pipeline right after stt_probe.  original_keyword is read
    lazily from call_state["lead_record"] so it is always current even though
    the frame processor is instantiated before the lead is fetched.
    """

    # Phrases that signal the buyer wants a DIFFERENT product (true product-change intent)
    _CHANGE_SIGNALS = frozenset([
        # English
        "actually", "not that", "different", "change", "instead",
        # Hindi
        "nahi", "alag", "badlo", "dusra",
        # Malayalam — "different / another" only, NOT rejection words
        "വേറെ", "മറ്റൊരു", "വ്യത്യസ്ത",
        # Kannada
        "ಬೇರೆ", "ಮತ್ತೊಂದು",
        # Tamil
        "வேற", "மாத்து",
        # Hindi (Devanagari)
        "अलग", "दूसरा",
    ])

    # Rejection / negative-intent phrases — if any of these appear, skip product-change detection
    _REJECTION_SIGNALS = frozenset([
        # Malayalam
        "ആവശ്യമില്ല", "വേണ്ട", "ഇപ്പോൾ വേണ്ട", "പിന്നീട്", "നോക്കിക്കോളാം",
        "താൽപ്പര്യമില്ല", "ശരിയാകും", "നിർത്തൂ",
        # Hindi
        "नहीं चाहिए", "अभी नहीं", "बाद में", "ज़रूरत नहीं", "रहने दो",
        # Kannada
        "ಬೇಡ", "ಈಗ ಬೇಡ", "ನಂತರ", "ಅಗತ್ಯವಿಲ್ಲ",
        # Tamil
        "வேண்டாம்", "இப்போ வேண்டாம்", "பிறகு", "தேவையில்லை",
        # English
        "not interested", "no thanks", "don't need", "not now", "later",
        "will manage", "manage myself", "do it myself",
    ])

    # Pronouns, time words, and function words that are never valid product names
    _NON_PRODUCT_TOKENS = frozenset([
        # Malayalam pronouns / time / function words
        "എനിക്ക്", "എനിക്കിപ്പോൾ", "ഞാൻ", "ഇപ്പോൾ", "ഇത്", "അത്", "ഇവിടെ",
        "അങ്ങനെ", "ഇനി", "ഇല്ല", "ഉണ്ട്", "ആ", "ആണ്", "ഒരു",
        # Hindi
        "मैं", "अभी", "यह", "वह", "यहाँ",
        # English
        "actually", "want", "need", "that", "this", "some", "have", "like",
        "from", "now", "later", "just", "okay", "yes", "no",
    ])

    # Allowlist of known product/category keywords (lower-cased substrings)
    _KNOWN_PRODUCTS = frozenset([
        "washing machine", "ac", "air conditioner", "refrigerator", "fridge",
        "tv", "television", "laptop", "mobile", "phone", "sofa", "bed", "table",
        "fan", "cooler", "heater", "geyser", "microwave", "oven", "mixer",
        "grinder", "water purifier", "ro", "inverter", "generator",
        "bike", "car", "scooter", "furniture", "mattress", "chair",
        # Malayalam product keywords
        "washing machine", "മെഷീൻ", "ഫ്രിഡ്ജ്", "ടിവി", "ഫോൺ",
        # Hindi
        "मशीन", "फ्रिज", "टीवी", "फोन",
    ])

    def __init__(self, call_state: dict, on_product_change, **kwargs):
        super().__init__(**kwargs)
        self._call_state = call_state
        self._on_product_change = on_product_change
        self._triggered = False

    def _has_rejection_intent(self, text: str) -> bool:
        """Return True if the utterance is clearly a rejection / not-interested signal."""
        tl = text.lower()
        return any(sig in tl for sig in self._REJECTION_SIGNALS)

    def _is_valid_product(self, token: str) -> bool:
        """Return True if token looks like a real product name, not a pronoun/function word."""
        tl = token.lower().strip(",.?!")
        if tl in self._NON_PRODUCT_TOKENS:
            return False
        # Must be at least 4 chars and not a pure digit string
        if len(tl) < 4 or tl.isdigit():
            return False
        # Accept if it matches a known product keyword
        if any(prod in tl or tl in prod for prod in self._KNOWN_PRODUCTS):
            return True
        # Reject Malayalam/Devanagari function words: single-morpheme tokens
        # (heuristic: if the word contains only common script chars and is short, skip)
        if len(tl) < 5:
            return False
        return True

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)

        if (
            not self._triggered
            and isinstance(frame, TranscriptionFrame)
            and direction == FrameDirection.DOWNSTREAM
        ):
            record = self._call_state.get("lead_record")
            if record:
                original = (
                    (record.get("search_context") or {}).get("searched_keyword", "")
                    or record.get("catname", "")
                ).lower()
                text = frame.text
                text_lower = text.lower()

                # Gate 1: skip if this is a rejection utterance
                if self._has_rejection_intent(text):
                    logger.debug(
                        f"[PRODUCT CHANGE] Skipped — rejection intent detected: '{text[:60]}'"
                    )
                    await self.push_frame(frame, direction)
                    return

                # Gate 2: must contain a genuine change signal
                if not (original and original not in text_lower
                        and any(sig in text_lower for sig in self._CHANGE_SIGNALS)):
                    await self.push_frame(frame, direction)
                    return

                # Gate 3: extract a valid product candidate
                # Try multi-word known products first (longest match wins), then
                # fall back to single-token extraction.  Slugify with hyphens so
                # the srchterm format matches what the API expects (e.g. "washing-machine").
                new_keyword = None
                for prod in sorted(self._KNOWN_PRODUCTS, key=len, reverse=True):
                    if prod in text_lower:
                        new_keyword = prod.replace(" ", "-")
                        break
                if not new_keyword:
                    words = [w.strip(",.?!") for w in text.split()]
                    candidates = [w for w in words if self._is_valid_product(w)]
                    if candidates:
                        new_keyword = candidates[0].replace(" ", "-")

                if new_keyword:
                    self._triggered = True
                    logger.info(
                        f"[PRODUCT CHANGE] Detected in: '{text[:60]}' "
                        f"— original={original!r} new={new_keyword!r}"
                    )
                    self.create_task(self._on_product_change(new_keyword), "product-change")
                else:
                    logger.debug(
                        f"[PRODUCT CHANGE] Change signal found but no valid product candidate "
                        f"in: '{text[:60]}'"
                    )

        await self.push_frame(frame, direction)


class TranscriptRecorder(FrameProcessor):
    """Save call transcript to JSON.

    Audio recording is handled separately by AudioBufferProcessor.
    Transcript saved to: call_records/transcript_<session>_<timestamp>.json

    Transcript format:
        [{"role": "user"|"agent", "text": "...", "ts": "HH:MM:SS"}, ...]
    """

    def __init__(self, session_id: str | None = None, **kwargs):
        super().__init__(**kwargs)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        sid = (session_id or ts)[:20]
        out_dir = Path("call_records")
        out_dir.mkdir(exist_ok=True)
        self._transcript_path = out_dir / f"transcript_{sid}_{ts}.json"
        self._transcript: list[dict] = []
        self._agent_buf: list[str] = []
        logger.info(f"[Recorder] Transcript → {self._transcript_path}")

    def _save_transcript(self):
        try:
            self._transcript_path.write_text(
                json.dumps(self._transcript, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        except Exception as e:
            logger.warning(f"[Recorder] Failed to save transcript: {e}")

    def _flush_agent_buf(self):
        text = "".join(self._agent_buf).strip()
        self._agent_buf.clear()
        if text:
            self._transcript.append({
                "role": "agent",
                "text": text,
                "ts": datetime.now().strftime("%H:%M:%S"),
            })
            self._save_transcript()

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)

        if isinstance(frame, TranscriptionFrame) and frame.text.strip():
            self._flush_agent_buf()
            self._transcript.append({
                "role": "user",
                "text": frame.text.strip(),
                "ts": datetime.now().strftime("%H:%M:%S"),
            })
            self._save_transcript()

        elif isinstance(frame, TextFrame) and direction == FrameDirection.DOWNSTREAM:
            if frame.text.strip():
                self._agent_buf.append(frame.text)

        elif isinstance(frame, LLMFullResponseEndFrame):
            self._flush_agent_buf()

        await self.push_frame(frame, direction)

    async def cleanup(self):
        self._flush_agent_buf()
        self._save_transcript()
        logger.info(f"[Recorder] Transcript saved: {self._transcript_path} ({len(self._transcript)} turns)")
        await super().cleanup()


# ---------------------------------------------------------------------------
# Langfuse tracing
# ---------------------------------------------------------------------------

def setup_langfuse_tracing() -> bool:
    """Configure Pipecat's OpenTelemetry tracing to export to Langfuse.

    Uses LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY from the environment to
    build the Basic-auth header required by Langfuse's OTLP endpoint.

    Returns True if tracing was enabled successfully, False otherwise.
    """
    pub = os.getenv("LANGFUSE_PUBLIC_KEY", "")
    sec = os.getenv("LANGFUSE_SECRET_KEY", "")
    if not pub or not sec:
        logger.warning("[Langfuse] LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY not set — tracing disabled")
        return False

    try:
        import base64
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
        from pipecat.utils.tracing.setup import setup_tracing

        base_url = os.getenv("LANGFUSE_BASE_URL", "https://cloud.langfuse.com")
        otlp_endpoint = f"{base_url.rstrip('/')}/api/public/otel"

        token = base64.b64encode(f"{pub}:{sec}".encode()).decode()
        exporter = OTLPSpanExporter(
            endpoint=f"{otlp_endpoint}/v1/traces",
            headers={
                "Authorization": f"Basic {token}",
                "x-langfuse-ingestion-version": "4",
            },
        )

        ok = setup_tracing(service_name="voicebot", exporter=exporter)
        if ok:
            logger.info(f"[Langfuse] OTEL tracing → {otlp_endpoint}")
        return ok
    except Exception as e:
        logger.warning(f"[Langfuse] Could not set up OTEL tracing: {e}")
        return False


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

async def entrypoint(ctx: JobContext):
    room_name = ctx.job.room.name
    # Required by livekit.agents JobContext lifecycle; ensures the room is connected.
    await ctx.connect()
    # Wait for the SIP caller to join before setting up the pipeline.
    await ctx.wait_for_participant()
    url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    if not api_key or not api_secret:
        raise RuntimeError(
            "LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set. "
            "Without them generate_token_with_agent raises inside _jws.encode()."
        )
    token = generate_token_with_agent(room_name, "Pipecat Agent", api_key, api_secret)

    logger.info(f"Connecting to LiveKit room: {room_name} at {url}")

    transport = LiveKitTransport(
        url=url,
        token=token,
        room_name=room_name,
        params=LiveKitParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            audio_in_filter=RNNoiseFilter(),
        ),
    )

    # SIP metadata populated on first participant join
    sip_info = {
        "caller_number": "Unknown",
        "dialed_number": "Unknown",
    }

    # API state for this call
    call_state = {
        "record_id": None,       # lead _id for callback (lead_id field)
        # Prefer room_name as a stable fallback when MIS doesn't provide call_id.
        "call_id": room_name,    # call_id from MIS record / room metadata
        "lead_record": None,     # full MIS record — used for schema + product change
        "product_change": {},    # populated if buyer changed product mid-call
        "ended_naturally": False,
        "save_done": False,
        "call_start_time": None, # set when first participant joins
    }

    _session_id = os.environ.get("CALL_SESSION_ID", f"session-{int(time.time())}")
    _tracing_enabled = setup_langfuse_tracing()

    # Gemini Live: STT + LLM + TTS all-in-one, Hindi.
    # System instruction is initialized with SAMPLE_LEAD; the real lead context
    # is injected as the first user message in on_first_participant_joined.
    logger.info("[Lang] Hindi | Gemini Live gemini-3.1-flash-live-preview | voice=Aoede")
    llm = GeminiLiveLLMService(
        api_key=os.getenv("GEMINI_API_KEY"),
        system_instruction=build_system_prompt(SAMPLE_LEAD, lang_key="hindi"),
        http_options=HttpOptions(api_version="v1alpha"),
        settings=GeminiLiveLLMService.Settings(
            model="models/gemini-3.1-flash-live-preview",
            voice="Aoede",
            language=Language.HI_IN,
            modalities=GeminiModalities.AUDIO,
            temperature=0.4,
            vad=GeminiVADParams(
                start_sensitivity="START_SENSITIVITY_LOW",   # don't trigger on background noise
                end_sensitivity="END_SENSITIVITY_HIGH",      # quickly detect end of speech
                prefix_padding_ms=100,                       # minimal buffer, keeps latency low
                silence_duration_ms=800,                     # balanced — not too slow to respond
            ),
        ),
    )

    context = LLMContext()
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(context)

    async def save_call_data(status: str):
        """Analyze transcript and send callback payload. Idempotent.

        All work here is post-call — no latency impact on the conversation.
        """
        if call_state["save_done"]:
            return
        call_state["save_done"] = True

        lead_id = call_state.get("record_id")
        if not lead_id:
            logger.info("No lead_id — skipping callback")
            return

        transcript = build_transcript(context)
        logger.info(f"Analyzing {len(transcript)} transcript turns | status={status}")

        schema = (call_state.get("lead_record") or {}).get("qualification_schema", {})
        analysis = await generate_call_analysis(transcript, status, schema)
        logger.info(
            f"[ANALYSIS] outcome={analysis.get('call_outcome')} | "
            f"description={analysis.get('call_outcome_description')} | "
            f"is_business={analysis.get('is_business')} | "
            f"qna_count={len(analysis.get('qna', []))}"
        )

        # Build callback payload — spec_ques_N from answered Q&A pairs
        _start = call_state.get("call_start_time")
        _duration = round(time.time() - _start, 1) if _start else 0.0
        outcome = analysis.get("call_outcome", _status_to_outcome(status))
        callback_payload: dict = {
            "call_id": call_state.get("call_id", ""),
            "lead_id": lead_id,
            "is_business": analysis.get("is_business", ""),
            "inhouse": 1,
            "call_outcome": outcome,
            "call_outcome_desc": analysis.get("call_outcome_description", DISPOSITION_MAP.get(outcome, "")),
            "call_summary": analysis.get("call_summary", ""),
            "product_change": call_state.get("product_change") or analysis.get("product_change") or {},
            "call_duration": _duration,
            "call_recording": str(_recording_path),
        }
        rescheduled_to = analysis.get("rescheduled_to", "")
        if rescheduled_to:
            callback_payload["rescheduled_to"] = rescheduled_to
        # Max 4 spec_ques entries; skip entries with no answer
        spec_count = 0
        for qa in analysis.get("qna", []):
            if spec_count >= 4:
                break
            if qa.get("answ"):
                spec_count += 1
                callback_payload[f"spec_ques_{spec_count}"] = {
                    "Qid": qa.get("id", ""),
                    "Quest": qa.get("quest", ""),
                    "Answ": qa.get("answ", ""),
                }

        await send_callback(callback_payload)

    async def on_close():
        """Called by CallEndDetector after the closing phrase has been spoken."""
        call_state["ended_naturally"] = True
        # Cancel the 5-minute timeout timer if it's still running
        _t = call_state.get("_timeout_task")
        if _t and not _t.done():
            _t.cancel()
        await save_call_data("completed")
        # Delete the LiveKit room to terminate the SIP call (hang up)
        try:
            lkapi = LiveKitAPI()
            await lkapi.room.delete_room(DeleteRoomRequest(room=room_name))
            await lkapi.aclose()
            logger.info(f"Room {room_name} deleted — SIP call terminated")
        except Exception as e:
            logger.error(f"Failed to delete room {room_name}: {e}")
        await task.cancel()

    async def on_product_change(new_keyword: str):
        """Fetch new qualification schema and restart the flow for the new product.

        Runs via create_task inside ProductChangeWatcher — never on the hot path.
        With Gemini Live, system_instruction cannot be changed mid-session, so we
        wipe all accumulated conversation history and inject a fresh context message
        so the LLM starts from Question 1 of the new schema with no memory of past answers.
        """
        schema = await fetch_category_schema(new_keyword)
        if not schema:
            return
        call_state["product_change"] = {
            "old": (call_state.get("lead_record") or {}).get("catname", ""),
            "new": new_keyword,
        }
        new_questions = build_questions_text(schema)
        # Wipe all accumulated Q&A so past answers for the old product are discarded,
        # then inject a clean starting context for the new product and trigger the LLM
        # to ask Question 1 immediately.
        context.set_messages([])
        context.add_message({
            "role": "user",
            "content": (
                f"[PRODUCT CHANGE] The buyer now wants: {new_keyword}. "
                f"All previous answers are discarded. "
                f"Briefly acknowledge the change (one sentence), then immediately ask "
                f"Question 1 from the new schema below — do not skip it.\n\n"
                f"New questions to ask in order:\n{new_questions}"
            ),
        })
        await task.queue_frames([LLMRunFrame()])
        logger.info(f"[PRODUCT CHANGE] Context reset and restarted for new_keyword={new_keyword!r}")

    product_watcher = ProductChangeWatcher(call_state=call_state, on_product_change=on_product_change)

    buyer_name_slug = "unknown"
    transcript_recorder = TranscriptRecorder(session_id=buyer_name_slug)

    ts_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_dir = Path("call_records")
    out_dir.mkdir(exist_ok=True)
    _recording_path = out_dir / f"recording_{buyer_name_slug}_{ts_str}.wav"

    audiobuffer = AudioBufferProcessor(num_channels=1)

    @audiobuffer.event_handler("on_audio_data")
    async def on_audio_data(buffer, audio, sample_rate, num_channels):
        with wave.open(str(_recording_path), "wb") as wf:
            wf.setnchannels(num_channels)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            wf.writeframes(audio)
        logger.info(f"[Recorder] Joint recording saved: {_recording_path}")

    # Gemini Live handles STT + LLM + TTS internally — no separate stt/tts processors
    pipeline = Pipeline(
        [
            transport.input(),
            user_aggregator,
            llm,                              # GeminiLiveLLMService (all-in-one)
            transcript_recorder,
            CallEndDetector(on_close=on_close),
            transport.output(),
            audiobuffer,
            assistant_aggregator,
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
        enable_tracing=_tracing_enabled,
        conversation_id=_session_id,
    )

    @transport.event_handler("on_first_participant_joined")
    async def on_first_participant_joined(transport, participant_id):
        call_state["call_start_time"] = time.time()
        await audiobuffer.start_recording()

        # ── Step 1: extract SIP info (in-memory, no network) ──────────────────
        participant = next(
            (p for p in transport._client.room.remote_participants.values()
             if p.sid == participant_id),
            None,
        )
        if participant:
            attrs = dict(participant.attributes or {})
            if "sip.phoneNumber" in attrs or "sip.trunkPhoneNumber" in attrs:
                sip_info["caller_number"] = attrs.get("sip.phoneNumber", "Unknown")
                sip_info["dialed_number"] = attrs.get("sip.trunkPhoneNumber", "Unknown")
            else:
                identity = participant.identity or ""
                if identity.lower().startswith("sip_"):
                    sip_info["caller_number"] = identity[4:]
        else:
            logger.warning(f"Participant {participant_id} not found in remote_participants")

        room_meta: dict = {}
        try:
            room_meta = json.loads(ctx.job.room.metadata or "{}")
        except (json.JSONDecodeError, TypeError):
            pass
        lead_id_meta = room_meta.get("lead_id", "")
        call_id_meta = room_meta.get("call_id", "")
        caller = sip_info["caller_number"]
        mobile = normalize_mobile(caller) if caller != "Unknown" else ""

        # Gemini Live is configured for Hindi — use Hindi LANG_CONFIGS always.
        lang_cfg = LANG_CONFIGS["hindi"]

        # ── Step 2: fetch lead so product name is known for the greeting ────
        record = None
        if lead_id_meta or mobile:
            record = await fetch_lead(lead_id=lead_id_meta, mobile=mobile)

        if record:
            call_state["record_id"] = record.get("_id") or record.get("ref_id")
            call_state["call_id"] = call_id_meta or record.get("call_id", "") or room_name
            call_state["lead_record"] = record
            city = (record.get("buyer_details") or {}).get("buyer_city", "?")
            logger.info(
                f"[CALL SETUP] lead_id={call_state['record_id']} | "
                f"call_id={call_state['call_id']} | city={city!r} | lang=hindi"
            )
        else:
            record = SAMPLE_LEAD
            call_state["record_id"] = SAMPLE_LEAD.get("_id") or SAMPLE_LEAD.get("ref_id")
            call_state["call_id"] = call_id_meta or room_name
            call_state["lead_record"] = SAMPLE_LEAD
            logger.info(
                f"[CALL SETUP] MIS lead not found — using SAMPLE_LEAD | "
                f"call_id={call_state['call_id']}"
            )

        # Extract product name from the fetched lead for use in greeting.
        _search = (record or {}).get("search_context", {})
        _product = _search.get("searched_product", {})
        _keyword = _search.get("searched_keyword", "")
        greeting_product = _product.get("product_name", "") or _keyword
        buyer_name = (record.get("buyer_details") or {}).get("buyer_name", "customer")

        # ── Step 3: trigger Gemini Live greeting via LLMRunFrame ─────────────
        # Inject real call context (lead name, product, questions) as a user
        # message, then fire LLMRunFrame so Gemini Live speaks its first response.
        greeting_text = build_greeting_text(lang_cfg, greeting_product)
        new_questions = build_questions_text(
            (record.get("qualification_schema") or {})
        )
        context.add_message({
            "role": "user",
            "content": (
                f"Call connected. Customer: {buyer_name}. "
                f"Product they searched for: {greeting_product}. "
                f"Questions to ask in order:\n{new_questions}\n"
                f"Start with exactly this greeting: \"{greeting_text}\""
            ),
        })
        await task.queue_frames([LLMRunFrame()])

        # ── 5-minute call time limit ─────────────────────────────────────────
        _DEFAULT_TIMEOUT_MSG = (
            "जी, मुझे सिर्फ 5 मिनट तक बात करने की permission है. "
            "जो भी details मिली हैं, sellers जल्द ही आपसे contact करेंगे. "
            "आपका समय देने के लिए धन्यवाद. अलविदा!"
        )

        async def _call_timeout():
            await asyncio.sleep(300)  # 5 minutes
            if call_state.get("ended_naturally") or call_state.get("save_done"):
                return
            logger.info("[TIMEOUT] 5-minute call limit reached — requesting goodbye")
            cfg = _load_prompt_config()
            timeout_msg = cfg.get("timeout_message", "").strip() or _DEFAULT_TIMEOUT_MSG
            context.add_message({
                "role": "user",
                "content": (
                    "SYSTEM INSTRUCTION: The maximum allowed call duration of 5 minutes has been reached. "
                    f"You must end the call immediately. Say exactly: \"{timeout_msg}\""
                ),
            })
            await task.queue_frames([LLMRunFrame()])

        call_state["_timeout_task"] = asyncio.ensure_future(_call_timeout())


    @transport.event_handler("on_participant_disconnected")
    async def on_participant_disconnected(transport, participant_id):
        logger.info(f"Participant disconnected: {participant_id}")
        # Cancel the 5-minute timeout timer if it's still running
        _t = call_state.get("_timeout_task")
        if _t and not _t.done():
            _t.cancel()
        # If the bot already ended the call naturally, save_call_data is a no-op
        status = "completed" if call_state["ended_naturally"] else "disconnected"
        await save_call_data(status)
        await task.cancel()

    runner = PipelineRunner(handle_sigint=True)
    await runner.run(task)


if __name__ == "__main__":
    import argparse
    import sys

    _choices = list(LANG_CONFIGS.keys())
    _pre = argparse.ArgumentParser(add_help=False)
    _pre.add_argument(
        "--lang",
        default=os.environ.get("BOT_LANGUAGE", "english"),
        choices=_choices,
        metavar=f"{{{','.join(_choices)}}}",
        help="Language for STT/TTS/prompt (default: english)",
    )
    _pre_args, _remaining = _pre.parse_known_args()
    os.environ["BOT_LANGUAGE"] = _pre_args.lang
    sys.argv = [sys.argv[0]] + _remaining

    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name="voice-bot-justdial",
            # Each idle worker loads Silero + RNNoise models (~720 MB each).
            # Keep only 1 warm process — new ones spin up on demand within ~5 s.
            num_idle_processes=1,
        )
    )
