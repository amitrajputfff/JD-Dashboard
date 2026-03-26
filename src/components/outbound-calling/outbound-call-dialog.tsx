"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PhoneInput } from "@/components/ui/phone-input"
import { Phone, PhoneCall, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { usePhoneNumbers } from "@/lib/hooks/use-phone-numbers"
import { removeCountryCode } from "@/lib/utils"
import { campaignsApi } from "@/lib/api/campaigns"

interface OutboundCallDialogProps {
  children: React.ReactNode
}

interface OutboundCallData {
  phoneNumber: string
  callerId: string
}

export function OutboundCallDialog({ children }: OutboundCallDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [isCalling, setIsCalling] = React.useState(false)
  const [callData, setCallData] = React.useState<OutboundCallData>({
    phoneNumber: "",
    callerId: ""
  })

  const { phoneNumbers, loading: phoneNumbersLoading, fetchPhoneNumbers } = usePhoneNumbers({
    is_active: true,
    limit: 1000 // Fetch more phone numbers
  })

  // Fetch phone numbers when dialog opens
  React.useEffect(() => {
    if (open) {
      fetchPhoneNumbers({ is_active: true, limit: 1000 })
    }
  }, [open, fetchPhoneNumbers])

  const handleCall = async () => {
    if (!callData.phoneNumber || !callData.callerId) {
      toast.error("Please enter both phone number and select caller ID")
      return
    }

    setIsCalling(true)
    try {
      const response = await campaignsApi.makeCall({
        phone_num: removeCountryCode(callData.phoneNumber), // Remove country code and non-digits
        callerid: removeCountryCode(callData.callerId), // Remove country code and non-digits
      })

      toast.success("Outbound call initiated successfully!")
      setOpen(false)
      setCallData({ phoneNumber: "", callerId: "" })
    } catch (error) {
      console.error('Outbound call error:', error)
      const message = error instanceof Error ? error.message : "Failed to initiate call. Please try again."
      toast.error(message)
    } finally {
      setIsCalling(false)
    }
  }

  const handlePhoneNumberChange = (value: string) => {
    setCallData(prev => ({ ...prev, phoneNumber: value }))
  }

  const handleCallerIdChange = (value: string) => {
    setCallData(prev => ({ ...prev, callerId: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Make Outbound Call</DialogTitle>
          <DialogDescription>
            Enter the phone number you want to call and select which number to call from.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone-number">Phone Number to Call</Label>
            <PhoneInput
              id="phone-number"
              placeholder="+1 (555) 000-0000"
              value={callData.phoneNumber}
              onChange={handlePhoneNumberChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="caller-id">Call From</Label>
            <Select value={callData.callerId} onValueChange={handleCallerIdChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select phone number">
                  {callData.callerId && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">{callData.callerId}</span>
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

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCall} 
              disabled={isCalling || !callData.phoneNumber || !callData.callerId}
            >
              {isCalling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calling...
                </>
              ) : (
                <>
                  <PhoneCall className="mr-2 h-4 w-4" />
                  Make Call
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
