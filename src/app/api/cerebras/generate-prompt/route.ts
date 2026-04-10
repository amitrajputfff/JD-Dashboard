import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { instruction, currentPrompt } = await request.json();

  if (!instruction?.trim()) {
    return NextResponse.json({ error: 'Instruction is required' }, { status: 400 });
  }

  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'CEREBRAS_API_KEY not configured on server' }, { status: 500 });
  }

  const systemMessage = `You are an expert AI prompt engineer specialising in voice AI agents for phone calls.
Generate clear, concise, production-ready system prompts.
Return ONLY the prompt text — no explanations, no markdown fences, no preamble.`;

  const userMessage = currentPrompt?.trim()
    ? `Instruction: "${instruction}"\n\nUpdate the following system prompt based on the instruction above. Keep everything that is still relevant:\n\n${currentPrompt}`
    : `Create a system prompt for a voice AI agent that: ${instruction}`;

  try {
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-3-235b-a22b-instruct-2507',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Cerebras API error:', err);
      return NextResponse.json({ error: 'Cerebras API request failed' }, { status: 502 });
    }

    const data = await response.json();
    const prompt = data.choices?.[0]?.message?.content?.trim() || '';

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('generate-prompt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
