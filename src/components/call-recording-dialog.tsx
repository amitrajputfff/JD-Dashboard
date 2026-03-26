"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Clock,
  Phone,
  Calendar,
  User,
  Headphones,
  Globe
} from "lucide-react"
import { CallLog } from "@/types/call"
import { AdvancedAudioPlayer } from "@/components/ui/advanced-audio-player"
import { useAssistantsMapping } from "@/hooks/use-assistants-mapping"
import { useAuth } from "@/hooks/use-auth"

interface CallRecordingDialogProps {
  call: CallLog | null
  isOpen: boolean
  onClose: () => void
}

export function CallRecordingDialog({ call, isOpen, onClose }: CallRecordingDialogProps) {
  const { user } = useAuth()
  
  // Fetch assistants for mapping to calls
  const { assistantsMap } = useAssistantsMapping({
    organizationId: user?.organization_id || '',
    enabled: !!user?.organization_id,
  })

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "00:00:00"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  // Get agent name from assistant_id
  const getAgentName = (assistantId: string) => {
    const agent = assistantsMap.get(assistantId)
    return agent?.name || 'Unknown Agent'
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) {
      return (
        <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium bg-gray-50 text-gray-700 border-gray-200">
          Unknown
        </Badge>
      )
    }

    const variants: Record<string, { variant: "default" | "secondary" | "destructive", color: string }> = {
      completed: { variant: "default" as const, color: "bg-green-50 text-green-700 border-green-200" },
      missed: { variant: "secondary" as const, color: "bg-red-50 text-red-700 border-red-200" },
      busy: { variant: "secondary" as const, color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      failed: { variant: "destructive" as const, color: "bg-red-50 text-red-700 border-red-200" }
    }

    const statusConfig = variants[status] || { variant: "default" as const, color: "bg-gray-50 text-gray-700 border-gray-200" }

    return (
      <Badge variant="outline" className={`text-xs px-2 py-0.5 font-medium ${statusConfig.color}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (!call) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] w-full sm:!max-w-[800px] lg:!max-w-[900px] max-h-[90vh] p-0 flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b bg-muted/20 flex-shrink-0">
          <DialogHeader className="space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                <Headphones className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">Call Recording</DialogTitle>
                <DialogDescription className="mt-1 text-sm">
                  Play and download the call recording
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Call Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(() => {
                  // Check if it's a web call
                  const isWebCall = call.meta_data?.source === 'web' || 
                                  call.meta_data?.source === 'widget' ||
                                  call.from_number?.toLowerCase().includes('web') ||
                                  call.to_number?.toLowerCase().includes('web') ||
                                  call.from_number?.toLowerCase().includes('widget') ||
                                  call.to_number?.toLowerCase().includes('widget') ||
                                  call.call_type === 'webcall';
                  
                  if (isWebCall) {
                    return (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {getAgentName(call.assistant_id)}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Web</span>
                      </div>
                    );
                  }
                  
                  // Regular phone call
                  return (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">
                        {call.from_number} → {call.to_number}
                      </span>
                    </div>
                  );
                })()}
              </div>
              {getStatusBadge(call.status)}
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(call.duration_seconds)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatTimestamp(call.start_time)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Audio Player */}
          <div className="space-y-4">
            {call.recording_link ? (
              <AdvancedAudioPlayer
                src={call.recording_link}
                duration={call.duration_seconds}
                keyEvents={call.key_events || []}
                className="w-full"
              />
            ) : (
              <div className="text-center py-8">
                <Headphones className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 mb-2">
                  No Recording Available
                </Badge>
                <p className="text-sm text-muted-foreground">The recording for this call is not available</p>
              </div>
            )}
          </div>


          {/* Summary */}
          {call.summary && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Call Summary</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{call.summary}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
