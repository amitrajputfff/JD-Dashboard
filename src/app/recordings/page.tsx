"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { EnhancedPagination } from "@/components/ui/enhanced-pagination"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Download,
  Play,
  Pause,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  ChevronDown,
  ChevronRight,
  Calendar,
  SkipBack,
  SkipForward,
  Headphones,
  Globe,
  User,
  Info
} from "lucide-react"
import { useCallLogs } from "@/hooks/use-call-logs"
import { useAuth } from "@/hooks/use-auth"
import { useAssistantsMapping } from "@/hooks/use-assistants-mapping"
import { CallLog } from "@/types/call"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"


export default function RecordingsPage() {
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage] = React.useState(10) // Fixed at 10 items per page
  const [expandedRecording, setExpandedRecording] = React.useState<string | null>(null)
  const [playingRecording, setPlayingRecording] = React.useState<string | null>(null)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [audioElement, setAudioElement] = React.useState<HTMLAudioElement | null>(null)

  // Fetch assistants for mapping to calls
  const { assistantsMap } = useAssistantsMapping({
    organizationId: user?.organization_id || '',
    enabled: !!user?.organization_id,
  })


  // Fetch call logs with real API - only calls with recordings
  const { 
    callLogs, 
    total, 
    isLoading, 
    error 
  } = useCallLogs({
    organizationId: user?.organization_id || '',
    skip: (currentPage - 1) * itemsPerPage,
    limit: itemsPerPage,
    autoFetch: !!user?.organization_id,
  })

  // Filter to only show calls with recordings
  const recordingsWithAudio = React.useMemo(() => {
    return callLogs.filter(call => call.recording_link)
  }, [callLogs])

  const totalPages = Math.ceil(total / itemsPerPage)
  const totalItems = total

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Get agent name from assistant_id
  const getAgentName = (assistantId: string) => {
    const agent = assistantsMap.get(assistantId)
    return agent?.name || 'Unknown Agent'
  }

  const getStatusBadge = (outcome: string | null) => {
    if (!outcome) {
      return (
        <Badge variant="outline" className="text-xs px-3 py-1 font-medium bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 transition-colors">
          Unknown
        </Badge>
      )
    }

    const variants: Record<string, { variant: "default" | "secondary" | "destructive", color: string }> = {
      completed: { variant: "default" as const, color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
      missed: { variant: "secondary" as const, color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
      busy: { variant: "secondary" as const, color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
      failed: { variant: "destructive" as const, color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
      "no_resolution": { variant: "secondary" as const, color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" },
      "information_provided": { variant: "default" as const, color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" }
    }

    const statusConfig = variants[outcome.toLowerCase()] || { variant: "default" as const, color: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100" }
    
    return (
      <Badge variant="outline" className={`text-xs px-3 py-1 font-medium transition-colors ${statusConfig.color}`}>
        {outcome.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    )
  }

  const getSentimentBadge = (sentiment: string) => {
    const variants = {
      positive: { 
        variant: "default" as const, 
        color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
      },
      neutral: { 
        variant: "secondary" as const, 
        color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" 
      },
      negative: { 
        variant: "destructive" as const, 
        color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" 
      }
    }
    
    const config = variants[sentiment as keyof typeof variants] || variants.neutral
    
    return (
      <Badge variant="outline" className={`text-xs px-3 py-1 font-medium transition-colors ${config.color}`}>
        {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
      </Badge>
    )
  }

  const getQualityIndicator = (quality: any) => {
    // Extract quality score from quality metrics or use a default
    const qualityScore = quality?.callQualityScore || quality?.clarity || 0
    let qualityLevel = "medium"
    
    if (qualityScore >= 80) qualityLevel = "high"
    else if (qualityScore >= 60) qualityLevel = "medium"
    else qualityLevel = "low"

    const colors = {
      high: "bg-green-500",
      medium: "bg-yellow-500", 
      low: "bg-red-500"
    }

    const qualityDescriptions = {
      high: "Excellent audio quality with clear speech and minimal background noise",
      medium: "Good audio quality with some minor issues or background noise",
      low: "Poor audio quality with significant issues, noise, or low volume"
    }
    
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="flex items-center gap-1 cursor-help">
            <div className={`w-2 h-2 rounded-full ${colors[qualityLevel as keyof typeof colors]}`} />
            <span className="text-xs text-muted-foreground capitalize">{qualityLevel}</span>
            <Info className="h-3 w-3 text-muted-foreground/60" />
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${colors[qualityLevel as keyof typeof colors]}`} />
              <h4 className="font-medium text-sm capitalize">{qualityLevel} Quality</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {qualityDescriptions[qualityLevel as keyof typeof qualityDescriptions]}
            </p>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>Quality Score:</strong> {qualityScore}/100
              </p>
              <div className="mt-1 text-xs text-muted-foreground">
                <div>🟢 High: 80-100 (Excellent)</div>
                <div>🟡 Medium: 60-79 (Good)</div>
                <div>🔴 Low: 0-59 (Poor)</div>
              </div>
            </div>
      </div>
        </HoverCardContent>
      </HoverCard>
    )
  }

  const getCallTypeIcon = (call: CallLog) => {
    // Check if it's a web call
    const isWebCall = call.meta_data?.source === 'web' || 
                    call.meta_data?.source === 'widget' ||
                    call.from_number?.toLowerCase().includes('web') ||
                    call.to_number?.toLowerCase().includes('web') ||
                    call.from_number?.toLowerCase().includes('widget') ||
                    call.to_number?.toLowerCase().includes('widget');
    
    if (isWebCall) {
      return <Globe className="h-3 w-3 text-blue-600" />
    }
    
    return call.call_type === "inbound" ? (
      <PhoneIncoming className="h-3 w-3 text-blue-600" />
    ) : (
      <PhoneOutgoing className="h-3 w-3 text-green-600" />
    )
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString() + " " + 
           new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "00:00"
    
    // Fix floating point precision issues by rounding to nearest integer
    const totalSeconds = Math.round(seconds)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const toggleRecording = (recordingId: string) => {
    if (expandedRecording === recordingId) {
      setExpandedRecording(null)
      setPlayingRecording(null)
      setIsPlaying(false)
    } else {
      setExpandedRecording(recordingId)
    }
  }

  // Initialize audio element
  React.useEffect(() => {
    const audio = new Audio()
    audio.preload = 'metadata'
    
    // Update current time as audio plays
    const updateTime = () => setCurrentTime(Math.round(audio.currentTime))
    audio.addEventListener('timeupdate', updateTime)
    
    // Handle audio end
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }
    audio.addEventListener('ended', handleEnded)
    
    // Handle audio load
    const handleLoadedMetadata = () => {
      setCurrentTime(0)
    }
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    
    setAudioElement(audio)
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.pause()
      audio.src = ''
    }
  }, [])

  const togglePlayback = async (recordingId: string, recordingUrl: string) => {
    if (!audioElement) return

    try {
    if (playingRecording === recordingId && isPlaying) {
        // Pause current recording
        audioElement.pause()
      setIsPlaying(false)
    } else {
        // Stop any currently playing recording
        if (playingRecording && playingRecording !== recordingId) {
          audioElement.pause()
          audioElement.currentTime = 0
        }
        
        // Load and play new recording
        audioElement.src = recordingUrl
        await audioElement.play()
      setPlayingRecording(recordingId)
      setIsPlaying(true)
      }
    } catch (error) {
      console.error('Error playing audio:', error)
      setIsPlaying(false)
    }
  }

  const handleSeek = (newTime: number) => {
    if (audioElement) {
      const roundedTime = Math.round(newTime)
      audioElement.currentTime = roundedTime
      setCurrentTime(roundedTime)
    }
  }

  const handleSkipBack = () => {
    if (audioElement) {
      const newTime = Math.max(0, Math.round(audioElement.currentTime) - 10)
      audioElement.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleSkipForward = () => {
    if (audioElement && audioElement.duration) {
      const newTime = Math.min(Math.round(audioElement.duration), Math.round(audioElement.currentTime) + 10)
      audioElement.currentTime = newTime
      setCurrentTime(newTime)
    }
  }


  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-8">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    JustDial
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Recordings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          {/* Header with Filters */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Call Recordings</h1>
              <p className="text-sm text-muted-foreground">
                Listen to and manage your call recordings
              </p>
          </div>

          </div>

          {/* Recordings List */}
          <div className="rounded-lg">
            <div className="space-y-2 p-0">
            {isLoading ? (
              // Skeleton loader for recordings
              Array.from({ length: itemsPerPage }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-3 mb-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-6 w-20 rounded" />
                            <Skeleton className="h-6 w-16 rounded" />
                          </div>
                          <div className="flex items-center gap-4">
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-3 w-28" />
                            <div className="flex items-center gap-1">
                              <Skeleton className="h-3 w-3" />
                              <Skeleton className="h-3 w-12" />
                            </div>
                            <div className="flex items-center gap-1">
                              <Skeleton className="h-3 w-3" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Skeleton className="h-2 w-2 rounded-full" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            ) : error ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Headphones className="h-12 w-12 mx-auto mb-4 text-red-500" />
                  <p className="text-red-600 font-medium">Error loading recordings</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </CardContent>
              </Card>
            ) : recordingsWithAudio.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Headphones className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No recordings found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Call recordings will appear here once calls are made with recording enabled.
                  </p>
                </CardContent>
              </Card>
            ) : (
              recordingsWithAudio.map((call) => (
                <Collapsible
                  key={call.id}
                  open={expandedRecording === call.id.toString()}
                  onOpenChange={() => toggleRecording(call.id.toString())}
                >
                  <Card className="overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-3 pt-4 cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {expandedRecording === call.id.toString() ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              {getCallTypeIcon(call)}
                            </div>
                            
                            <div className="flex flex-col">
                              <div className="flex items-center gap-3 mb-0.5">
                                <span className="font-medium">
                                  {(() => {
                                    // Check if it's a web call
                                    const isWebCall = call.meta_data?.source === 'web' || 
                                                    call.meta_data?.source === 'widget' ||
                                                    call.from_number?.toLowerCase().includes('web') ||
                                                    call.to_number?.toLowerCase().includes('web') ||
                                                    call.from_number?.toLowerCase().includes('widget') ||
                                                    call.to_number?.toLowerCase().includes('widget');
                                    
                                    if (isWebCall) {
                                      return getAgentName(call.assistant_id)
                                    }
                                    
                                    return call.from_number || call.to_number || 'Unknown'
                                  })()}
                                </span>
                                {getStatusBadge(call.outcome)}
                                {getSentimentBadge(call.sentiment)}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="font-mono">
                                  {(() => {
                                    const isWebCall = call.meta_data?.source === 'web' || 
                                                    call.meta_data?.source === 'widget' ||
                                                    call.from_number?.toLowerCase().includes('web') ||
                                                    call.to_number?.toLowerCase().includes('web') ||
                                                    call.from_number?.toLowerCase().includes('widget') ||
                                                    call.to_number?.toLowerCase().includes('widget');
                                    
                                    if (isWebCall) {
                                      return 'Web'
                                    }
                                    
                                    return call.from_number || call.to_number || 'Unknown'
                                  })()}
                                </span>
                                <span>{getAgentName(call.assistant_id)}</span>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatDuration(call.duration_seconds)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatTimestamp(call.start_time)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {getQualityIndicator(call.quality)}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (call.recording_link) {
                                  togglePlayback(call.id.toString(), call.recording_link)
                                }
                              }}
                              className="h-8 w-8 p-0"
                              disabled={!call.recording_link}
                            >
                              {playingRecording === call.id.toString() && isPlaying ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <Separator className="mb-3" />
                        
                        {/* Audio Player */}
                        <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-4 mb-4 border border-border/50">
                          <div className="flex items-center gap-4 mb-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (call.recording_link) {
                                  togglePlayback(call.id.toString(), call.recording_link)
                                }
                              }}
                              disabled={!call.recording_link}
                              className="bg-background hover:bg-muted"
                            >
                              {playingRecording === call.id.toString() && isPlaying ? (
                                <Pause className="h-4 w-4 mr-2" />
                              ) : (
                                <Play className="h-4 w-4 mr-2" />
                              )}
                              {playingRecording === call.id.toString() && isPlaying ? "Pause" : "Play"}
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={handleSkipBack}
                              disabled={!call.recording_link}
                              className="hover:bg-muted/50"
                            >
                              <SkipBack className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={handleSkipForward}
                              disabled={!call.recording_link}
                              className="hover:bg-muted/50"
                            >
                              <SkipForward className="h-4 w-4" />
                            </Button>

                            <div className="flex-1" />

                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                if (call.recording_link) {
                                  const link = document.createElement('a')
                                  link.href = call.recording_link
                                  link.download = `call-recording-${call.id}.mp3`
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                }
                              }}
                              disabled={!call.recording_link}
                              className="bg-background hover:bg-muted"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{formatDuration(currentTime)}</span>
                              <span>{formatDuration(call.duration_seconds)}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 cursor-pointer" onClick={(e) => {
                              if (audioElement && audioElement.duration) {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const clickX = e.clientX - rect.left
                                const percentage = clickX / rect.width
                                const newTime = percentage * audioElement.duration
                                handleSeek(newTime)
                              }
                            }}>
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300 hover:bg-primary/80" 
                                style={{ 
                                  width: audioElement && audioElement.duration 
                                    ? `${(currentTime / audioElement.duration) * 100}%` 
                                    : "0%" 
                                }} 
                              />
                            </div>
                          </div>
                        </div>

                        {/* Call Details */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium mb-2">Call Summary</h4>
                              <p className="text-sm text-muted-foreground">
                                {call.summary || "No summary available"}
                              </p>
                            </div>

                            {call.transcripts && call.transcripts.length > 0 && call.transcripts[0].text && (
                            <div>
                              <h4 className="font-medium mb-2">Transcript Preview</h4>
                                                             <p className="text-sm text-muted-foreground italic">
                                  &quot;{call.transcripts[0].text}&quot;
                               </p>
                            </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium mb-2">Tags</h4>
                              <div className="flex flex-wrap gap-1">
                                {call.tags && call.tags.length > 0 ? (
                                  call.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                  ))
                                ) : (
                                  <span className="text-sm text-muted-foreground">No tags</span>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Call Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Agent:</span>
                                  <span>{getAgentName(call.assistant_id)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Type:</span>
                                  <span className="capitalize">{call.call_type}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Status:</span>
                                  <span className="capitalize">{call.status}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Outcome:</span>
                                  <span>{call.outcome || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Sentiment:</span>
                                  <span className="capitalize">{call.sentiment}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))
            )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <EnhancedPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              showItemsPerPage={false}
              showQuickJump={true}
              showItemInfo={true}
              compact={false}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
