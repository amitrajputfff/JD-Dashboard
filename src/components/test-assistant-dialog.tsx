"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  MessageSquare,
  Bot,
  User,
  Clock,
  Globe,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { InlineLoader } from "@/components/ui/loader"
import { WebRTCConnection, WebRTCConfig, WebRTCEventHandlers, TranscriptMessage as WebRTCTranscriptMessage } from "@/lib/webrtc-connection"

interface TestAssistantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assistant?: {
    id: string
    name: string
    description: string
    status: "active" | "inactive"
  }
}

interface ConversationMessage {
  id: string
  role: "user" | "assistant"
  message: string
  timestamp: Date
}


export function TestAssistantDialog({
  open,
  onOpenChange,
  assistant = {
    id: "test-assistant-1",
    name: "Customer Support Assistant",
    description: "A helpful AI assistant that can answer customer questions and provide support",
    status: "active"
  }
}: TestAssistantDialogProps) {
  // WebRTC connection state
  const webrtcRef = useRef<WebRTCConnection | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected')
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>(['Ready to connect...'])
  
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(80)
  const [callDuration, setCallDuration] = useState(0)
  const [activeTab, setActiveTab] = useState("call")
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [transcript, setTranscript] = useState<ConversationMessage[]>([])
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [isInCooldown, setIsInCooldown] = useState(false)
  
  // Refs for auto-scrolling
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Simulate call duration timer
  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isCallActive])

  // Cooldown timer after call ends
  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (isInCooldown && cooldownRemaining > 0) {
      interval = setInterval(() => {
        setCooldownRemaining(prev => {
          if (prev <= 1) {
            setIsInCooldown(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isInCooldown, cooldownRemaining])

  // WebRTC event handlers
  const webrtcEventHandlers: WebRTCEventHandlers = React.useMemo(() => ({
    onConnectionStateChange: (state) => {
      if (state === 'connected') {
        setConnectionStatus('connected')
        setIsCallActive(true)
        setConnectionError(null)
      } else if (state === 'disconnected' || state === 'failed') {
        setConnectionStatus('failed')
        setIsCallActive(false)
      }
    },
    onIceConnectionStateChange: () => {
      // ICE connection state changes
    },
    onTrack: (stream) => {
      // Create and attach audio element dynamically like in working HTML
      if (!audioRef.current) {
        audioRef.current = document.createElement('audio')
        audioRef.current.autoplay = true
        audioRef.current.controls = false
        document.body.appendChild(audioRef.current)
      }
      
      audioRef.current.srcObject = stream
      audioRef.current.volume = volume / 100
      
      // Explicitly play the audio
      audioRef.current.play().catch(() => {
        // Try again after user interaction
        const playAudio = () => {
          audioRef.current?.play().then(() => {
            document.removeEventListener('click', playAudio)
          })
        }
        document.addEventListener('click', playAudio, { once: true })
      })
    },
    onDataChannelOpen: () => {
      // Data channel opened
    },
    onTranscript: (transcript: WebRTCTranscriptMessage) => {
      // Add transcript message to the conversation with deduplication
      setTranscript(prev => {
        // Create a unique ID based on content and timestamp to prevent duplicates
        const messageId = `${transcript.role}-${transcript.text}-${Date.now()}`
        
        // Check if this exact message already exists
        const isDuplicate = prev.some(msg => 
          msg.role === transcript.role && 
          msg.message === transcript.text &&
          Math.abs(msg.timestamp.getTime() - Date.now()) < 1000 // Within 1 second
        )
        
        if (isDuplicate) {
          return prev // Don't add duplicate
        }
        
        return [...prev, {
          id: messageId,
          role: transcript.role,
          message: transcript.text,
          timestamp: new Date()
        }]
      })
    },
    onUserSpeaking: (speaking: boolean) => {
      // Visual feedback when VAD detects user speaking
      setIsUserSpeaking(speaking)
    },
    onDataChannelMessage: () => {
      // Raw message handler - can be used for non-JSON messages or logging
      // The structured handlers (onTranscript, onUserSpeaking) will handle parsed messages
    },
    onLog: (message) => {
      setLogs(prev => [...prev.slice(-49), message]) // Keep last 50 logs
    },
    onError: (error) => {
      setConnectionError(error.message)
      setConnectionStatus('failed')
      setIsCallActive(false)
    }
  }), [volume])

  // Initialize WebRTC connection
  const initializeWebRTC = React.useCallback(() => {
    if (!assistant?.id) {
      setConnectionError('No assistant ID provided')
      return
    }

    const config: WebRTCConfig = {
      serverUrl: '',
      assistantId: assistant.id,
      turnHost: '13.204.190.15',
      turnUsername: 'botuser',
      turnPassword: 'supersecret'
    }

    webrtcRef.current = new WebRTCConnection(config, webrtcEventHandlers)
  }, [assistant?.id, webrtcEventHandlers])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.endCall()
      }
      
      // Clean up audio elements on unmount
      if (audioRef.current) {
        audioRef.current.srcObject = null
        if (audioRef.current.parentNode) {
          audioRef.current.parentNode.removeChild(audioRef.current)
        }
        audioRef.current = null
      }
    }
  }, [])

  // Initialize WebRTC when dialog opens
  useEffect(() => {
    if (open && assistant?.id) {
      initializeWebRTC()
    } else if (open && !assistant?.id) {
      setConnectionError('No assistant ID provided. Please select an assistant to test.')
    }
  }, [open, assistant?.id, initializeWebRTC])

  // Handle dialog closing - end call if active
  useEffect(() => {
    if (!open && isCallActive) {
      handleEndCall()
    }
  }, [open, isCallActive])

  // Update audio volume when volume state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  // Auto-scroll transcript to bottom when new messages arrive
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [transcript])

  // Auto-scroll logs to bottom when new logs arrive
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartCall = async () => {
    // Prevent starting a new call if in cooldown period
    if (isInCooldown) {
      setConnectionError(`Please wait ${cooldownRemaining} seconds before starting a new call`)
      return
    }

    if (!webrtcRef.current) {
      setConnectionError('WebRTC connection not initialized')
      return
    }

    try {
      setConnectionStatus('connecting')
      setConnectionError(null)
      setCallDuration(0)
      setTranscript([]) // Clear previous transcript
      setLogs(['Ready to connect...']) // Clear previous logs
      setIsUserSpeaking(false) // Reset user speaking state
      await webrtcRef.current.startCall()
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to start call')
      setConnectionStatus('failed')
    }
  }

  const handleEndCall = async () => {
    if (webrtcRef.current) {
      try {
        await webrtcRef.current.endCall()
      } catch {
        // Handle error silently
      }
    }
    
    // Clean up audio elements like in working HTML
    if (audioRef.current) {
      audioRef.current.srcObject = null
      if (audioRef.current.parentNode) {
        audioRef.current.parentNode.removeChild(audioRef.current)
      }
      audioRef.current = null
    }
    
    setIsCallActive(false)
    setCallDuration(0)
    setConnectionStatus('disconnected')
    setConnectionError(null)
    setIsUserSpeaking(false)
    setIsMuted(false) // Reset mute state
    
    // Clear transcript and logs when call ends
    setTranscript([])
    setLogs(['Ready to connect...'])
    
    // Start 5-second cooldown period
    setIsInCooldown(true)
    setCooldownRemaining(5)
  }

  const toggleMute = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    
    // Use the WebRTC connection's mute method
    if (webrtcRef.current) {
      webrtcRef.current.setMuted(newMutedState)
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    
    // Update the audio element volume immediately if it exists
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100
    }
  }

  const getVolumeIcon = () => {
    if (volume === 0) return VolumeX
    if (volume < 50) return Volume1
    return Volume2
  }

  const VolumeIcon = getVolumeIcon()

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isCallActive) {
      // End call before closing dialog
      handleEndCall()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!max-w-[90vw] w-full p-0 sm:!max-w-[700px] lg:!max-w-[70vw] max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-background to-muted/20">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-lg">
              <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                {assistant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <DialogTitle className="text-sm font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {assistant.name}
                </DialogTitle>
                <Badge 
                  variant={assistant.status === "active" ? "default" : "secondary"}
                  className="text-xs px-2 py-1 font-medium"
                >
                  {assistant.status}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                {assistant.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Connection Status */}
        {connectionError && (
          <div className="px-6 py-3">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {connectionError}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Connection Status Indicator */}
        <div className={`px-6 py-2 border-b transition-colors ${isUserSpeaking ? 'border-red-400 bg-red-50/50 dark:bg-red-900/10' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' && (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Connected</span>
                  {isUserSpeaking && (
                    <Badge variant="outline" className="text-xs border-red-400 text-red-600 bg-red-50 dark:bg-red-900/20">
                      🗣️ Speaking - Bot will interrupt
                    </Badge>
                  )}
                </>
              )}
              {connectionStatus === 'connecting' && (
                <>
                  <InlineLoader size="sm" className="text-blue-600" />
                  <span className="text-sm text-blue-600 font-medium">Connecting...</span>
                </>
              )}
              {connectionStatus === 'disconnected' && !isInCooldown && (
                <>
                  <AlertCircle className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500 font-medium">Disconnected</span>
                </>
              )}
              {isInCooldown && (
                <>
                  <InlineLoader size="sm" className="text-orange-600" />
                  <span className="text-sm text-orange-600 font-medium">
                    Cooldown - Wait {cooldownRemaining}s before next call
                  </span>
                </>
              )}
              {connectionStatus === 'failed' && !isInCooldown && (
                <>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600 font-medium">Connection Failed</span>
                </>
              )}
            </div>
            {isCallActive && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(callDuration)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b">
          <div className="flex flex-row items-center gap-3 justify-start relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full mb-4">
            {[
              { title: "Call", value: "call", icon: Phone },
              { title: "Transcript", value: "transcript", icon: MessageSquare },
              { title: "Logs", value: "logs", icon: Globe },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`relative px-3 py-1.5 rounded-full transition-colors flex items-center gap-2 text-xs ${
                  activeTab === tab.value
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                <tab.icon className="h-3 w-3" />
                {tab.title}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeTab === 'call' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Live Transcript Area */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-6 pb-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Voice Call
                    </span>
                    {isCallActive && (
                      <div className="flex items-center gap-1 ml-auto">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatDuration(callDuration)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto px-6 pb-4">
                  <div className="space-y-4">
                    {transcript.length === 0 && !isCallActive && (
                      <div className="text-center py-12">
                        <MessageSquare className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">No conversation yet</p>
                        {isInCooldown ? (
                          <p className="text-xs text-orange-600 mt-1 font-medium">
                            Cooldown active - Wait {cooldownRemaining}s before starting a new call
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">Start a call to see the live transcript</p>
                        )}
                      </div>
                    )}
                    {transcript.map((message, index) => (
                      <div
                        key={`${message.id}-${index}`}
                        className={`flex gap-3 ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <Avatar className="h-8 w-8 border border-border/50 shadow-sm">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                              <Bot className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-3 shadow-sm ${
                            message.role === "user"
                              ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground"
                              : "bg-gradient-to-r from-muted to-muted/80 text-foreground border border-border/50"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                        
                        {message.role === "user" && (
                          <Avatar className="h-8 w-8 border border-border/50 shadow-sm">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-secondary/10 to-secondary/5 text-secondary-foreground">
                              <User className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    
                    {isCallActive && (
                      <div className="flex gap-3 justify-start">
                        <Avatar className="h-8 w-8 border border-border/50 shadow-sm">
                          <AvatarFallback className="text-xs bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                            <Bot className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="max-w-[70%] rounded-lg px-4 py-3 bg-gradient-to-r from-muted/50 to-muted/30 text-muted-foreground border border-border/30">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                            <span className="text-xs">Assistant is speaking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Auto-scroll target for transcript */}
                    <div ref={transcriptEndRef} />
                  </div>
                </div>
              </div>
            </div>
          )}


          {activeTab === 'transcript' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-6 pb-3">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Conversation Transcript
                  </span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 pb-4">
                <div className="space-y-4">
                  {transcript.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">No conversation yet</p>
                      {isInCooldown ? (
                        <p className="text-xs text-orange-600 mt-1 font-medium">
                          Cooldown active - Wait {cooldownRemaining}s before starting a new call
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">Start a call to see the live transcript</p>
                      )}
                    </div>
                  ) : (
                    transcript.map((message, index) => (
                      <div
                        key={`transcript-${message.id}-${index}`}
                        className={`flex gap-3 ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {message.role === "assistant" && (
                        <Avatar className="h-8 w-8 border border-border/50 shadow-sm">
                          <AvatarFallback className="text-xs bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                            <Bot className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-3 shadow-sm ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.message}</p>
                        <p className={`text-xs mt-2 ${
                          message.role === "user" 
                            ? "text-primary-foreground/70" 
                            : "text-muted-foreground"
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      
                      {message.role === "user" && (
                        <Avatar className="h-8 w-8 border border-border/50 shadow-sm">
                          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500/10 to-blue-500/5 text-blue-600">
                            <User className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))
                  )}
                  
                  {/* Auto-scroll target for transcript tab */}
                  <div ref={transcriptEndRef} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-6 pb-3">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Connection Logs
                  </span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 pb-4">
                <div className="space-y-2">
                  {logs.length === 0 ? (
                    <div className="text-center py-8">
                      <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">No logs yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Connection logs will appear here</p>
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="text-xs font-mono text-muted-foreground bg-muted/30 rounded px-3 py-2">
                        {log}
                      </div>
                    ))
                  )}
                  
                  {/* Auto-scroll target for logs */}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Call Controls */}
        <DialogFooter className="p-6 pt-4 border-t bg-gradient-to-r from-muted/30 to-background">
          <div className="flex items-center justify-center w-full">
            <div className="flex items-center gap-3">
              {/* Mute Button */}
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="icon"
                onClick={toggleMute}
                disabled={!isCallActive}
                className="h-10 w-10 shadow-sm"
                title={isMuted ? "Unmute microphone" : "Mute microphone"}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              {/* Volume Button with Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shadow-sm"
                  >
                    <VolumeIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4" align="center">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Volume</Label>
                      <span className="text-xs text-muted-foreground">{volume}%</span>
                    </div>
                    <Slider
                      value={[volume]}
                      onValueChange={([value]) => handleVolumeChange(value)}
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Main Call Button */}
              <Button
                variant={isCallActive ? "destructive" : "default"}
                size="default"
                onClick={isCallActive ? handleEndCall : handleStartCall}
                disabled={isInCooldown && !isCallActive}
                className="h-12 px-6 shadow-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
              >
                {isCallActive ? (
                  <>
                    <PhoneOff className="h-4 w-4 mr-2" />
                    End Call
                  </>
                ) : isInCooldown ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Wait {cooldownRemaining}s
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-2" />
                    Talk to {assistant.name}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
