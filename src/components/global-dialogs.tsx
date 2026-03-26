"use client"

import React, { useState } from 'react'
import { toast } from 'sonner'
import { useDialog } from '@/contexts/dialog-context'
import { useProviders } from '@/hooks/use-providers'
import { usePhoneNumbers } from '@/lib/hooks/use-phone-numbers'
import { authStorage } from '@/lib/auth-storage'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PhoneInput } from '@/components/ui/phone-input'

interface PhoneNumberFormState {
  name: string
  description: string
  type: string
  country_code: string
  phone_number: string
  provider_id: string
  is_active: boolean
  include_country_code: boolean
}

const DEFAULT_PHONE_FORM_STATE: PhoneNumberFormState = {
  name: "",
  description: "",
  type: "inbound",
  country_code: "+1",
  phone_number: "",
  provider_id: "",
  is_active: true,
  include_country_code: true,
}

export function GlobalDialogs() {
  const {
    isAddPhoneNumberDialogOpen,
    closeAddPhoneNumberDialog,
  } = useDialog()

  const [phoneForm, setPhoneForm] = useState<PhoneNumberFormState>(DEFAULT_PHONE_FORM_STATE)
  const [isCreatingPhone, setIsCreatingPhone] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  const { createPhoneNumber } = usePhoneNumbers({
    organizationId: organizationId || undefined,
  })

  const { providers, loading: providersLoading } = useProviders("telephony")

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const organization = authStorage.getOrganization()
      setOrganizationId(organization?.id || null)
    }
  }, [])

  const resetPhoneForm = () => setPhoneForm(DEFAULT_PHONE_FORM_STATE)

  const handleCreatePhoneNumber = async () => {
    if (!organizationId) {
      toast.error("Organization is required to create phone numbers")
      return
    }
    if (!phoneForm.phone_number.trim()) {
      toast.error("Phone number is required")
      return
    }
    if (!phoneForm.provider_id) {
      toast.error("Please select a provider")
      return
    }

    setIsCreatingPhone(true)
    try {
      const finalPhoneNumber = phoneForm.include_country_code
        ? `${phoneForm.country_code}${phoneForm.phone_number.trim()}`
        : phoneForm.phone_number.trim()

      await createPhoneNumber({
        phone_number: finalPhoneNumber,
        provider_id: Number(phoneForm.provider_id),
        organization_id: organizationId,
        is_active: phoneForm.is_active,
        name: phoneForm.name.trim() || null,
        description: phoneForm.description.trim() || null,
        type: phoneForm.type,
      })
      closeAddPhoneNumberDialog()
      resetPhoneForm()
      toast.success("Phone number created successfully!")
    } catch (error: any) {
      toast.error(error?.message || "Failed to create phone number")
    } finally {
      setIsCreatingPhone(false)
    }
  }

  return (
    <>
      <Dialog
        open={isAddPhoneNumberDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeAddPhoneNumberDialog()
            resetPhoneForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Phone Number</DialogTitle>
            <DialogDescription>
              Purchase and configure a new phone number for your AI agents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Customer Support"
                  value={phoneForm.name}
                  onChange={(e) => setPhoneForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={phoneForm.type}
                  onValueChange={(value) => setPhoneForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description"
                value={phoneForm.description}
                onChange={(e) => setPhoneForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              {phoneForm.include_country_code ? (
                <PhoneInput
                  id="phone_number"
                  value={`${phoneForm.country_code}${phoneForm.phone_number}`}
                  onChange={(value) => {
                    const match = value.match(/^(\+\d{1,3})(.*)$/)
                    if (match) {
                      setPhoneForm(prev => ({
                        ...prev,
                        country_code: match[1],
                        phone_number: match[2].replace(/\D/g, ''),
                      }))
                    }
                  }}
                  placeholder="1234567890"
                />
              ) : (
                <Input
                  id="phone_number"
                  value={phoneForm.phone_number}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, '')
                    setPhoneForm(prev => ({ ...prev, phone_number: numericValue }))
                  }}
                  placeholder="1234567890"
                />
              )}
              <div className="flex items-center space-x-2 pt-1">
                <Switch
                  id="include_country_code"
                  checked={phoneForm.include_country_code}
                  onCheckedChange={(checked) => setPhoneForm(prev => ({ ...prev, include_country_code: checked }))}
                />
                <Label htmlFor="include_country_code" className="text-sm font-normal text-muted-foreground">
                  Include country code
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={phoneForm.provider_id}
                onValueChange={(value) => setPhoneForm(prev => ({ ...prev, provider_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providersLoading ? (
                    <SelectItem value="" disabled>Loading providers...</SelectItem>
                  ) : (
                    providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id.toString()}>
                        {provider.display_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={phoneForm.is_active}
                onCheckedChange={(checked) => setPhoneForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                closeAddPhoneNumberDialog()
                resetPhoneForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePhoneNumber} disabled={isCreatingPhone}>
              {isCreatingPhone ? "Creating..." : "Create Number"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
