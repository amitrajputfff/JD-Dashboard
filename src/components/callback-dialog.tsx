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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Phone, 
  PhoneCall,
  Clock,
  User,
  MessageSquare,
  Loader2
} from "lucide-react"
import { CallLog } from "@/types/call"
import { usePhoneNumbers } from "@/lib/hooks/use-phone-numbers"
import { removeCountryCode } from "@/lib/utils"
import { toast } from "sonner"

interface CallbackDialogProps {
  call: CallLog | null
  isOpen: boolean
  onClose: () => void
}

export function CallbackDialog({ call, isOpen, onClose }: CallbackDialogProps) {
  const [phoneNumber, setPhoneNumber] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [callerId, setCallerId] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const { phoneNumbers, loading: phoneNumbersLoading, fetchPhoneNumbers } = usePhoneNumbers({
    is_active: true,
    limit: 1000
  })

  // Fetch phone numbers when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      fetchPhoneNumbers({ is_active: true, limit: 1000 })
    }
  }, [isOpen, fetchPhoneNumbers])

  // Reset form when dialog opens/closes or call changes
  React.useEffect(() => {
    if (isOpen && call) {
      // Determine which number to call back based on call type
      if (call.call_type === 'inbound') {
        // For inbound calls, call back the caller (from_number)
        setPhoneNumber(call.from_number || "")
      } else if (call.call_type === 'outbound') {
        // For outbound calls, call back the recipient (to_number)
        setPhoneNumber(call.to_number || "")
      }
      setNotes("")
      setCallerId("")
    } else {
      setPhoneNumber("")
      setNotes("")
      setCallerId("")
    }
  }, [isOpen, call])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneNumber.trim() || !callerId.trim()) {
      toast.error("Please enter phone number and select caller ID")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('https://3neysomt18.execute-api.us-east-1.amazonaws.com/dev/clicktobot', {
        method: 'POST',
        headers: {
          'X-CLIENT': 'czadmin',
          'X-API-KEY': 'VQ2LOCjXVV4LSY7OQseLT204sa9GfYTSa3un4YAa',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_id: "CTI_BOT_DIAL",
          phone_num: removeCountryCode(phoneNumber.trim()),
          uniqueid: `callback_${Date.now()}`,
          callerid: removeCountryCode(callerId.trim()),
          uuid: `client-uuid-${Date.now()}`,
          custom_param: { 
            "callback_notes": notes.trim() || "",
            "original_call_id": call?.id || "",
            "callback_type": "manual"
          },
          resFormat: 3
        })
      })

      if (response.ok) {
        toast.success("Callback initiated successfully!")
        onClose()
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.message || "Failed to initiate callback")
      }
    } catch (error) {
      console.error('Callback error:', error)
      toast.error("Failed to initiate callback. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "00:00:00"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  if (!call) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5" />
            Initiate Callback
          </DialogTitle>
          <DialogDescription>
            Call back the customer from the previous call
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Call Info */}
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">
                  {call.from_number} → {call.to_number}
                </span>
              </div>
              <span className="text-xs text-muted-foreground capitalize">
                {call.call_type}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(call.duration_seconds)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{formatTimestamp(call.start_time)}</span>
              </div>
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="pl-9"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {call.call_type === 'inbound' 
                ? "This will call back the original caller"
                : "This will call back the original recipient"
              }
            </p>
          </div>

          {/* Caller ID */}
          <div className="space-y-2">
            <Label htmlFor="caller-id">Call From</Label>
            <Select value={callerId} onValueChange={setCallerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select phone number">
                  {callerId && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">{callerId}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {phoneNumbersLoading ? (
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading phone numbers...
                  </div>
                ) : phoneNumbers.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No phone numbers available
                  </div>
                ) : (
                  phoneNumbers.map((phone) => (
                    <SelectItem key={phone.id} value={phone.phone_number}>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{phone.phone_number}</div>
                          {phone.name && (
                            <div className="text-xs text-muted-foreground">{phone.name}</div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="notes"
                placeholder="Add any notes for this callback..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="pl-9 min-h-[80px] resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!phoneNumber.trim() || !callerId.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Initiating...
                </>
              ) : (
                <>
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Call Back
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
