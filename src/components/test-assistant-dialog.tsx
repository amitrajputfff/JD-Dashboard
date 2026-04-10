"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Volume1,
  MessageSquareText,
  Bot,
  AlertCircle,
  Clock,
} from "lucide-react"
import { InlineLoader } from "@/components/ui/loader"
import { WebRTCConnection, WebRTCConfig, WebRTCEventHandlers, TranscriptMessage as WebRTCTranscriptMessage } from "@/lib/webrtc-connection"
import { AgentAudioVisualizerAura } from "@/components/agents-ui/agent-audio-visualizer-aura"
import { cn } from "@/lib/utils"
import type { AgentState } from "@livekit/components-react"
import { useTheme } from "next-themes"

interface TestAssistantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assistant?: {
    id: string
    name: string
    description: string
    status: "active" | "inactive"
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  functions?: any[]
}

interface FunctionQueryGroup {
  functionName: string
  params: { key: string; value: string }[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectQueryParamGroups(functions: any[]): FunctionQueryGroup[] {
  const groups: FunctionQueryGroup[] = []
  for (const fn of functions) {
    const params = fn.query_params
    if (!params || typeof params !== "object") continue
    const entries = Object.entries(params as Record<string, string>).filter(([k]) => k.trim() !== "")
    if (entries.length === 0) continue
    groups.push({
      functionName: fn.name || fn.url || "Unnamed Function",
      params: entries.map(([key, value]) => ({ key, value: value || "" })),
    })
  }
  return groups
}

interface ConversationMessage {
  id: string
  role: "user" | "assistant"
  message: string
  timestamp: Date
}

// -----------------------------------------------------------------
// State derivation — four real states + connecting/disconnected
// -----------------------------------------------------------------
type CallPhase = "connecting" | "listening" | "thinking" | "speaking" | "idle"

function deriveCallPhase(
  connectionStatus: "disconnected" | "connecting" | "connected" | "failed",
  isCallActive: boolean,
  isUserSpeaking: boolean,
  isBotSpeaking: boolean,
): CallPhase {
  if (connectionStatus === "connecting") return "connecting"
  if (!isCallActive) return "idle"
  if (isUserSpeaking) return "listening"
  if (isBotSpeaking) return "speaking"
  return "thinking"
}

function toAgentState(phase: CallPhase): AgentState {
  switch (phase) {
    case "connecting": return "connecting"
    case "listening":  return "listening"
    case "speaking":   return "speaking"
    case "thinking":   return "thinking"
    default:           return "disconnected" as AgentState
  }
}

const STATE_LABELS: Record<CallPhase, string> = {
  connecting: "Connecting…",
  listening:  "Listening",
  thinking:   "Thinking…",
  speaking:   "Speaking",
  idle:       "Ready",
}

const STATE_COLORS: Record<CallPhase, string> = {
  connecting: "text-blue-500",
  listening:  "text-emerald-500",
  thinking:   "text-amber-500",
  speaking:   "text-cyan-500",
  idle:       "text-muted-foreground",
}

// -----------------------------------------------------------------
// Web-Audio bot-speech detector
// Emits true when RMS power of the bot audio stream exceeds threshold.
// -----------------------------------------------------------------
const BOT_SPEECH_THRESHOLD = 0.008   // RMS; tweak if too sensitive
const BOT_SPEECH_RELEASE_MS = 400    // hold "speaking" for this long after silence

function useBotAudioLevel(
  stream: MediaStream | null,
  onBotSpeaking: (speaking: boolean) => void,
) {
  const rafRef = useRef<number | null>(null)
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSpeakingRef = useRef(false)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!stream) return

    const ctx = new AudioContext()
    ctxRef.current = ctx
    const src = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.4
    src.connect(analyser)
    analyserRef.current = analyser

    const buf = new Float32Array(analyser.fftSize)

    const tick = () => {
      analyser.getFloatTimeDomainData(buf)
      let sum = 0
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
      const rms = Math.sqrt(sum / buf.length)

      if (rms > BOT_SPEECH_THRESHOLD) {
        if (releaseTimerRef.current) { clearTimeout(releaseTimerRef.current); releaseTimerRef.current = null }
        if (!isSpeakingRef.current) { isSpeakingRef.current = true; onBotSpeaking(true) }
      } else if (isSpeakingRef.current && !releaseTimerRef.current) {
        releaseTimerRef.current = setTimeout(() => {
          isSpeakingRef.current = false
          releaseTimerRef.current = null
          onBotSpeaking(false)
        }, BOT_SPEECH_RELEASE_MS)
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current)
      analyser.disconnect()
      src.disconnect()
      ctx.close()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream])
}

// =================================================================
// Main component
// =================================================================
export function TestAssistantDialog({
  open,
  onOpenChange,
  assistant = {
    id: "test-assistant-1",
    name: "Customer Support Assistant",
    description: "A helpful AI assistant that can answer customer questions and provide support",
    status: "active",
  },
  functions = [],
}: TestAssistantDialogProps) {
  const webrtcRef = useRef<WebRTCConnection | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "failed">("disconnected")
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>(["Ready to connect..."])

  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(80)
  const [callDuration, setCallDuration] = useState(0)
  const [showTranscript, setShowTranscript] = useState(false)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [isBotSpeaking, setIsBotSpeaking] = useState(false)
  const [botStream, setBotStream] = useState<MediaStream | null>(null)
  const [transcript, setTranscript] = useState<ConversationMessage[]>([])
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [isInCooldown, setIsInCooldown] = useState(false)

  const [showVarDialog, setShowVarDialog] = useState(false)
  const [queryGroups, setQueryGroups] = useState<FunctionQueryGroup[]>([])
  const [queryValues, setQueryValues] = useState<Record<string, string>>({})
  const [sampleProduct, setSampleProduct] = useState("")
  const [sampleBuyerName, setSampleBuyerName] = useState("")

  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()

  // Bot speech detection via Web Audio API
  useBotAudioLevel(botStream, setIsBotSpeaking)

  const callPhase = useMemo(
    () => deriveCallPhase(connectionStatus, isCallActive, isUserSpeaking, isBotSpeaking),
    [connectionStatus, isCallActive, isUserSpeaking, isBotSpeaking],
  )
  const agentState = useMemo(() => toAgentState(callPhase), [callPhase])

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isCallActive) {
      interval = setInterval(() => setCallDuration((prev) => prev + 1), 1000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [isCallActive])

  // Cooldown timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isInCooldown && cooldownRemaining > 0) {
      interval = setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev <= 1) { setIsInCooldown(false); return 0 }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [isInCooldown, cooldownRemaining])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [transcript])

  const webrtcEventHandlers: WebRTCEventHandlers = useMemo(() => ({
    onConnectionStateChange: (state) => {
      if (state === "connected") {
        setConnectionStatus("connected")
        setIsCallActive(true)
        setConnectionError(null)
      } else if (state === "disconnected" || state === "failed") {
        setConnectionStatus("failed")
        setIsCallActive(false)
        setBotStream(null)
        setIsBotSpeaking(false)
      }
    },
    onIceConnectionStateChange: () => {},
    onTrack: (stream) => {
      // Attach to <audio> for playback
      if (!audioRef.current) {
        audioRef.current = document.createElement("audio")
        audioRef.current.autoplay = true
        audioRef.current.controls = false
        document.body.appendChild(audioRef.current)
      }
      audioRef.current.srcObject = stream
      audioRef.current.volume = volume / 100
      audioRef.current.play().catch(() => {
        const playAudio = () => {
          audioRef.current?.play().then(() => {
            document.removeEventListener("click", playAudio)
          })
        }
        document.addEventListener("click", playAudio, { once: true })
      })
      // Share stream for Web Audio analysis
      setBotStream(stream)
    },
    onDataChannelOpen: () => {},
    onTranscript: (t: WebRTCTranscriptMessage) => {
      setTranscript((prev) => {
        const isDuplicate = prev.some(
          (msg) =>
            msg.role === t.role &&
            msg.message === t.text &&
            Math.abs(msg.timestamp.getTime() - Date.now()) < 1000,
        )
        if (isDuplicate) return prev
        const messageId = `${t.role}-${t.text}-${Date.now()}`
        return [...prev, { id: messageId, role: t.role, message: t.text, timestamp: new Date() }]
      })
    },
    onUserSpeaking: (speaking: boolean) => setIsUserSpeaking(speaking),
    onDataChannelMessage: () => {},
    onLog: (message) => setLogs((prev) => [...prev.slice(-49), message]),
    onError: (error) => {
      setConnectionError(error.message)
      setConnectionStatus("failed")
      setIsCallActive(false)
      setBotStream(null)
      setIsBotSpeaking(false)
    },
  }), [volume])

  const initializeWebRTC = useCallback(() => {
    if (!assistant?.id) { setConnectionError("No assistant ID provided"); return }
    const config: WebRTCConfig = {
      serverUrl: "",
      assistantId: assistant.id,
      turnHost: "13.204.190.15",
      turnUsername: "botuser",
      turnPassword: "supersecret",
    }
    webrtcRef.current = new WebRTCConnection(config, webrtcEventHandlers)
  }, [assistant?.id, webrtcEventHandlers])

  useEffect(() => {
    return () => {
      webrtcRef.current?.endCall()
      if (audioRef.current) {
        audioRef.current.srcObject = null
        audioRef.current.parentNode?.removeChild(audioRef.current)
        audioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (open && assistant?.id) {
      initializeWebRTC()
    } else if (open && !assistant?.id) {
      setConnectionError("No assistant ID provided. Please select an assistant to test.")
    }
  }, [open, assistant?.id, initializeWebRTC])

  useEffect(() => {
    if (!open && isCallActive) handleEndCall()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isCallActive])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100
  }, [volume])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleStartCall = async (query_params?: Record<string, any>) => {
    if (isInCooldown) {
      setConnectionError(`Please wait ${cooldownRemaining} seconds before starting a new call`)
      return
    }
    if (!webrtcRef.current) { setConnectionError("WebRTC connection not initialized"); return }
    try {
      setConnectionStatus("connecting")
      setConnectionError(null)
      setCallDuration(0)
      setTranscript([])
      setLogs(["Ready to connect..."])
      setIsUserSpeaking(false)
      setIsBotSpeaking(false)
      setBotStream(null)
      await webrtcRef.current.startCall(query_params)
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "Failed to start call")
      setConnectionStatus("failed")
    }
  }

  const handleStartCallClick = () => {
    // Always show the pre-call params dialog so the user can fill in query params
    const groups = collectQueryParamGroups(functions)
    const initial: Record<string, string> = {}
    groups.forEach((g) => {
      g.params.forEach(({ key, value }) => {
        const flatKey = `${g.functionName}||${key}`
        initial[flatKey] = queryValues[flatKey] ?? value
      })
    })
    setQueryGroups(groups)
    setQueryValues(initial)
    setShowVarDialog(true)
  }

  const handleVarDialogSubmit = () => {
    setShowVarDialog(false)
    // Build flat params: "FnName||key" → pass as flat key/value to the bot
    const params: Record<string, string> = {}
    Object.entries(queryValues).forEach(([flatKey, val]) => {
      const sep = flatKey.indexOf("||")
      const paramKey = sep !== -1 ? flatKey.slice(sep + 2) : flatKey
      if (val.trim()) params[paramKey] = val.trim()
    })
    // Sample lead fields — only used when no real lead_id / mobile is provided
    if (sampleProduct.trim()) params["srchterm"] = sampleProduct.trim()
    if (sampleBuyerName.trim()) params["buyer_name"] = sampleBuyerName.trim()
    handleStartCall(Object.keys(params).length > 0 ? params : undefined)
  }

  const handleEndCall = async () => {
    try { await webrtcRef.current?.endCall() } catch { /* silent */ }
    if (audioRef.current) {
      audioRef.current.srcObject = null
      audioRef.current.parentNode?.removeChild(audioRef.current)
      audioRef.current = null
    }
    setIsCallActive(false)
    setCallDuration(0)
    setConnectionStatus("disconnected")
    setConnectionError(null)
    setIsUserSpeaking(false)
    setIsBotSpeaking(false)
    setBotStream(null)
    setIsMuted(false)
    setTranscript([])
    setLogs(["Ready to connect..."])
    setIsInCooldown(true)
    setCooldownRemaining(5)
  }

  const toggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    webrtcRef.current?.setMuted(next)
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    if (audioRef.current) audioRef.current.volume = newVolume / 100
  }

  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isCallActive) handleEndCall()
    onOpenChange(newOpen)
  }

  const initials = assistant.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!max-w-[90vw] w-full p-0 sm:!max-w-[640px] lg:!max-w-[680px] max-h-[90vh] flex flex-col overflow-hidden gap-0">

        {/* ── Header bar ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                  assistant.status === "active" ? "bg-green-500" : "bg-muted-foreground",
                )}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold leading-tight truncate">{assistant.name}</span>
                <Badge
                  variant={assistant.status === "active" ? "default" : "secondary"}
                  className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                >
                  {assistant.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[320px]">
                {assistant.description}
              </p>
            </div>
          </div>
        </div>

        {/* ── Error alert ─────────────────────────────────────────────── */}
        {connectionError && (
          <div className="px-5 pt-3 shrink-0">
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs">{connectionError}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* ── Main content ────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-[320px] relative">

          {/* Visualizer panel */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300",
              showTranscript ? "opacity-0 pointer-events-none" : "opacity-100",
            )}
          >
            <div className="flex flex-col items-center justify-center gap-6 px-6 py-6 h-full">

              {/* Aura */}
              <div className="relative flex items-center justify-center w-48 h-48">
                <AgentAudioVisualizerAura
                  size="xl"
                  color="#1FD5F9"
                  colorShift={0.3}
                  state={agentState}
                  themeMode={resolvedTheme === "dark" ? "dark" : "light"}
                  className="aspect-square w-full h-full"
                />
                {/* Initials when idle */}
                {callPhase === "idle" && connectionStatus !== "connecting" && (
                  <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-primary/40 pointer-events-none select-none">
                    {initials}
                  </span>
                )}
              </div>

              {/* State pill + timer */}
              <div className="flex flex-col items-center gap-2">
                {isCallActive && (
                  <div className="flex items-center gap-2">
                    {/* Animated dot */}
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        callPhase === "listening" && "bg-emerald-500 animate-pulse",
                        callPhase === "thinking"  && "bg-amber-500 animate-bounce",
                        callPhase === "speaking"  && "bg-cyan-500 animate-pulse",
                      )}
                    />
                    <span className={cn("text-sm font-semibold tabular-nums", STATE_COLORS[callPhase])}>
                      {STATE_LABELS[callPhase]}
                    </span>
                    <span className="text-sm font-mono text-muted-foreground tabular-nums">
                      {formatDuration(callDuration)}
                    </span>
                  </div>
                )}

                {callPhase === "connecting" && (
                  <div className="flex items-center gap-2 text-blue-500">
                    <InlineLoader size="sm" />
                    <span className="text-sm font-medium">Connecting…</span>
                  </div>
                )}

                {callPhase === "idle" && !isInCooldown && connectionStatus !== "failed" && (
                  <span className="text-sm text-muted-foreground">
                    Press <strong>Start Call</strong> to begin
                  </span>
                )}

                {isInCooldown && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-sm font-medium">Please wait {cooldownRemaining}s</span>
                  </div>
                )}

                {connectionStatus === "failed" && !isInCooldown && (
                  <span className="text-sm text-destructive font-medium">Connection failed — try again</span>
                )}
              </div>
            </div>
          </div>

          {/* Transcript panel */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col transition-opacity duration-300 overflow-hidden",
              showTranscript ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {transcript.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-center py-12">
                  <MessageSquareText className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground/70">
                    {isCallActive ? "Start speaking to see the transcript" : "Start a call to see the live transcript"}
                  </p>
                </div>
              ) : (
                transcript.map((msg, idx) => {
                  const isUser = msg.role === "user"
                  return (
                    <div
                      key={`${msg.id}-${idx}`}
                      className={cn("flex w-full max-w-[95%] flex-col gap-1", isUser ? "ml-auto items-end" : "items-start")}
                    >
                      <div
                        className={cn(
                          "w-fit max-w-full rounded-lg px-4 py-2.5 text-sm leading-relaxed",
                          isUser
                            ? "bg-secondary text-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm",
                        )}
                      >
                        {msg.message}
                      </div>
                      <span className="text-[10px] text-muted-foreground px-1">
                        {msg.timestamp.toLocaleTimeString(undefined, { timeStyle: "short" })}
                      </span>
                    </div>
                  )
                })
              )}

              {/* Thinking dots in transcript view */}
              {isCallActive && callPhase === "thinking" && (
                <div className="flex items-start gap-2">
                  <div className="bg-muted rounded-lg rounded-bl-sm px-4 py-2.5">
                    <div className="flex gap-1 items-center h-4">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        </div>

        {/* ── Control bar ─────────────────────────────────────────────── */}
        <div className="shrink-0 px-5 pb-5 pt-3 border-t bg-background">
          <div
            className="flex items-center gap-1.5 p-2 rounded-[31px] border border-border/50 bg-background drop-shadow-sm w-fit mx-auto"
            aria-label="Voice assistant controls"
          >
            {/* Mute */}
            <button
              onClick={toggleMute}
              disabled={!isCallActive}
              title={isMuted ? "Unmute microphone" : "Mute microphone"}
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center border transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                isMuted
                  ? "bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20"
                  : "bg-accent border-border text-foreground hover:bg-foreground/10",
              )}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            {/* Volume */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center border transition-colors",
                    "bg-accent border-border text-foreground hover:bg-foreground/10",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                  title="Adjust volume"
                >
                  <VolumeIcon className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-4" align="center" side="top">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Volume</Label>
                    <span className="text-xs text-muted-foreground tabular-nums">{volume}%</span>
                  </div>
                  <Slider
                    value={[volume]}
                    onValueChange={([v]) => handleVolumeChange(v)}
                    max={100}
                    min={0}
                    step={1}
                  />
                </div>
              </PopoverContent>
            </Popover>

            {/* Transcript toggle */}
            <button
              onClick={() => setShowTranscript((v) => !v)}
              title={showTranscript ? "Hide transcript" : "Show transcript"}
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center border transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                showTranscript
                  ? "bg-blue-500/20 border-blue-700/10 text-blue-700 hover:bg-blue-500/30 dark:text-blue-300"
                  : "bg-accent border-border text-foreground hover:bg-foreground/10",
              )}
            >
              <MessageSquareText className="h-4 w-4" />
            </button>

            <div className="w-px h-6 bg-border mx-0.5" />

            {/* End / Start call */}
            {isCallActive ? (
              <button
                onClick={handleEndCall}
                className={cn(
                  "h-10 px-4 rounded-full flex items-center gap-2 border transition-colors",
                  "bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30",
                  "font-mono text-xs font-bold tracking-wider",
                )}
              >
                <PhoneOff className="h-4 w-4" />
                <span className="hidden sm:inline">END CALL</span>
                <span className="inline sm:hidden">END</span>
              </button>
            ) : (
              <button
                onClick={handleStartCallClick}
                disabled={isInCooldown || connectionStatus === "connecting"}
                className={cn(
                  "h-10 px-4 rounded-full flex items-center gap-2 border transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  "font-mono text-xs font-bold tracking-wider",
                  isInCooldown || connectionStatus === "connecting"
                    ? "bg-muted border-border text-muted-foreground cursor-not-allowed opacity-60"
                    : "bg-primary text-primary-foreground border-primary hover:bg-primary/90",
                )}
              >
                {connectionStatus === "connecting" ? (
                  <>
                    <InlineLoader size="sm" />
                    <span>CONNECTING</span>
                  </>
                ) : isInCooldown ? (
                  <>
                    <Clock className="h-4 w-4" />
                    <span>WAIT {cooldownRemaining}s</span>
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4" />
                    <span className="hidden sm:inline">START CALL</span>
                    <span className="inline sm:hidden">CALL</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </DialogContent>
    </Dialog>

    {/* Pre-call query params dialog — always shown before starting */}
    <Dialog open={showVarDialog} onOpenChange={setShowVarDialog}>
      <DialogContent className="sm:max-w-[460px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Test Call Parameters</DialogTitle>
          <DialogDescription>
            Fill in the query parameters for your API functions before starting the call.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-2 pr-1">

          {/* ── Sample Lead ─────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">
                Sample Lead
              </p>
              <div className="h-px flex-1 bg-border" />
            </div>
            <p className="text-xs text-muted-foreground">
              Used when no <code className="bg-muted px-1 rounded">lead_id</code> or <code className="bg-muted px-1 rounded">mobile</code> is provided. Leave empty for the default sample.
            </p>
            <div className="flex items-center gap-3">
              <Label className="w-28 shrink-0 text-sm font-mono text-muted-foreground">product</Label>
              <Input
                placeholder="e.g. washing machine, cctv, refrigerator…"
                value={sampleProduct}
                onChange={(e) => setSampleProduct(e.target.value)}
                className="text-sm h-9"
              />
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-28 shrink-0 text-sm font-mono text-muted-foreground">buyer_name</Label>
              <Input
                placeholder="e.g. Rahul"
                value={sampleBuyerName}
                onChange={(e) => setSampleBuyerName(e.target.value)}
                className="text-sm h-9"
              />
            </div>
          </div>

          {/* ── API Function Parameters ──────────────────────────────── */}
          {queryGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
              <p className="text-sm text-muted-foreground">No API query parameters configured.</p>
              <p className="text-xs text-muted-foreground/70">
                Add an API function with query params in the agent&apos;s <strong>Advanced</strong> tab to pass values like <code className="bg-muted px-1 rounded">lead_id</code> or <code className="bg-muted px-1 rounded">mobile</code> here.
              </p>
            </div>
          ) : (
            queryGroups.map((group) => (
              <div key={group.functionName} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate shrink-0">
                    {group.functionName}
                  </p>
                  <div className="h-px flex-1 bg-border" />
                </div>
                {group.params.map(({ key }) => {
                  const flatKey = `${group.functionName}||${key}`
                  return (
                    <div key={flatKey} className="flex items-center gap-3">
                      <Label htmlFor={flatKey} className="w-28 shrink-0 text-sm font-mono truncate text-muted-foreground" title={key}>
                        {key}
                      </Label>
                      <Input
                        id={flatKey}
                        placeholder={`Enter ${key}…`}
                        value={queryValues[flatKey] ?? ""}
                        onChange={(e) =>
                          setQueryValues((prev) => ({ ...prev, [flatKey]: e.target.value }))
                        }
                        className="text-sm h-9"
                      />
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-3 border-t">
          <Button variant="outline" size="sm" onClick={() => { setShowVarDialog(false); handleStartCall() }}>
            Skip
          </Button>
          <Button size="sm" onClick={handleVarDialogSubmit}>
            <Phone className="h-3.5 w-3.5 mr-1.5" />
            Start Call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  )
}
