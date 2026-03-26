"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Bot,
  Phone,
  Save,
  CheckCircle
} from "lucide-react"
import { toast } from "sonner"

import { assistantsApi } from "@/lib/api/assistants"
import { usePhoneNumbers } from "@/lib/hooks/use-phone-numbers"

interface Assistant {
  id: string
  name: string
  description: string
  status: "active" | "draft"
  type: "sales" | "support" | "general"
}

interface PhoneConfiguration {
  id: string
  phoneNumber: string
  label?: string
  assignedAssistant?: string
  isActive: boolean
}

export default function PhoneConfigurePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const phoneId = params?.id ?? ""

  const {
    currentNumber,
    detailLoading,
    fetchPhoneNumber,
    assignAssistant,
    unassignAssistant,
  } = usePhoneNumbers()

  const [assistants, setAssistants] = React.useState<Assistant[]>([])

  const [config, setConfig] = React.useState<PhoneConfiguration>({
    id: phoneId,
    phoneNumber: "+1 (555) 123-4567",
    label: "Customer Support Line",
    assignedAssistant: "",
    isActive: true
  })

  const [activeTab, setActiveTab] = React.useState("assistant")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!phoneId) return

    const phoneIdNum = Number(phoneId)
    if (Number.isNaN(phoneIdNum)) {
      toast.error("Invalid phone number identifier")
      return
    }

    fetchPhoneNumber(phoneIdNum).catch(() => undefined)
  }, [phoneId, fetchPhoneNumber])

  // Populate config when phone number data loads
  React.useEffect(() => {
    if (currentNumber) {
      setConfig(prev => ({
        ...prev,
        id: phoneId,
        phoneNumber: currentNumber.phone_number,
        label: currentNumber.name || "Phone Number",
        assignedAssistant: currentNumber.mapped_assistant?.assistant_id || "",
        isActive: currentNumber.is_active,
      }))
    }
  }, [currentNumber, phoneId])


  React.useEffect(() => {
    const loadAssistants = async () => {
      try {
        const response = await assistantsApi.getAssistants(undefined, 0, 100, false)
        const normalized = ((response.assistants ?? []) as unknown[])
          .map((assistant: unknown) => {
            const assistantData = assistant as Record<string, unknown>
            const assistantId = assistantData.assistant_id ?? assistantData.id
            if (!assistantId) {
              return null
            }
            return {
              id: String(assistantId),
              name: (assistantData.name as string) ?? "Unnamed assistant",
              description: (assistantData.description as string) ?? "AI Assistant",
              status: ((assistantData.status as string) ?? ((assistantData.is_active as boolean) ? "active" : "draft")) as "active" | "draft",
              type: "general" as "sales" | "support" | "general",
            } as Assistant
          })
          .filter((value): value is Assistant => Boolean(value))

        setAssistants(normalized)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load assistants"
        toast.error(message)
      }
    }

    loadAssistants()
  }, [])

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      // Save assistant assignment if phoneId is available
      if (phoneId && config.assignedAssistant !== currentNumber?.mapped_assistant?.assistant_id) {
        const currentAssistantId = currentNumber?.mapped_assistant?.assistant_id
        const newAssistantId = config.assignedAssistant
        
        // Check if we're unassigning (selecting "No assistant selected")
        if (!newAssistantId || newAssistantId === "") {
          // Unassign the current assistant if one exists
          if (currentAssistantId) {
            await unassignAssistant(Number(phoneId), currentAssistantId)
          }
        } else {
          // Assign the new assistant
          await assignAssistant(Number(phoneId), newAssistantId)
        }
        
        // Refresh phone number data to get updated assistant info
        await fetchPhoneNumber(Number(phoneId))
      }
      
      // Here you would call other APIs to save other configurations
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success("Phone number configuration saved successfully!")
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save configuration"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateConfig = (path: string, value: unknown) => {
    setConfig(prev => {
      const keys = path.split('.')
      const newConfig = { ...prev }
      let current: Record<string, unknown> = newConfig
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...(current[keys[i]] as Record<string, unknown>) }
        current = current[keys[i]] as Record<string, unknown>
      }
      
      current[keys[keys.length - 1]] = value
      return newConfig
    })
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "assistant":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Assistant Assignment
                </CardTitle>
                <CardDescription>
                  Choose which AI assistant will handle calls to this number
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base">Assigned Assistant</Label>
                  <Select 
                    value={config.assignedAssistant && config.assignedAssistant !== "" ? config.assignedAssistant : "none"} 
                    onValueChange={async (value) => {
                      const newAssistantId = value === "none" ? "" : value
                      const currentAssistantId = currentNumber?.mapped_assistant?.assistant_id
                      updateConfig('assignedAssistant', newAssistantId)
                      
                      // Auto-save assistant assignment
                      if (phoneId) {
                        try {
                          // Check if we're unassigning (selecting "No assistant selected")
                          if (value === "none" || newAssistantId === "") {
                            // Unassign the current assistant if one exists
                            if (currentAssistantId) {
                              await unassignAssistant(Number(phoneId), currentAssistantId)
                              toast.success("Assistant unassigned successfully!")
                            }
                          } else {
                            // Assign the new assistant
                            await assignAssistant(Number(phoneId), newAssistantId)
                            toast.success("Assistant assigned successfully!")
                          }
                          
                          // Refresh phone number data to get updated assistant info
                          await fetchPhoneNumber(Number(phoneId))
                        } catch (error: unknown) {
                          const message = error instanceof Error ? error.message : "Failed to update assistant assignment"
                          toast.error(message)
                          // Revert the change on error
                          updateConfig('assignedAssistant', config.assignedAssistant)
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No assistant selected" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No assistant selected</SelectItem>
                      {/* Show assigned assistant even if not in current list */}
                      {config.assignedAssistant && config.assignedAssistant !== "" && !assistants.some(a => a.id === config.assignedAssistant) && (
                        <SelectItem value={config.assignedAssistant}>
                          <div className="flex items-center gap-2">
                            <span>{currentNumber?.mapped_assistant?.name || "Unknown Assistant"}</span>
                            <Badge variant="secondary" className="text-xs">
                              Assigned
                            </Badge>
                          </div>
                        </SelectItem>
                      )}
                      {assistants.map((assistant) => (
                        <SelectItem key={assistant.id} value={assistant.id}>
                          <div className="flex items-center gap-2">
                            <span>{assistant.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {assistant.type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {config.assignedAssistant && config.assignedAssistant !== "" && (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    {(() => {
                      const assistant = assistants.find(a => a.id === config.assignedAssistant)
                      const mappedAssistant = currentNumber?.mapped_assistant
                      
                      if (assistant) {
                        // Assistant found in current list
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="font-medium">{assistant.name}</span>
                              <Badge variant={assistant.status === 'active' ? 'default' : 'secondary'}>
                                {assistant.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{assistant.description}</p>
                          </div>
                        )
                      } else if (mappedAssistant) {
                        // Assistant not in current list but we have mapped assistant data
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="font-medium">{mappedAssistant.name}</span>
                              <Badge variant={mappedAssistant.status === 'Active' ? 'default' : 'secondary'}>
                                {mappedAssistant.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              This assistant is currently assigned but may not be available in the current list.
                            </p>
                          </div>
                        )
                      } else {
                        // No assistant data available
                        return (
                          <p className="text-sm text-muted-foreground">Assistant details not available</p>
                        )
                      }
                    })()}
                  </div>
                )}

              </CardContent>
            </Card>
          </div>
        )


      default:
        return null
    }
  }

  if (detailLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-1 flex-col gap-6 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mb-6"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!currentNumber) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-1 flex-col gap-6 p-6">
            <Card>
              <CardHeader>
                <CardTitle>Phone number not found</CardTitle>
                <CardDescription>The requested phone number could not be located.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/phone-numbers")}>Back to list</Button>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
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
                  <BreadcrumbLink href="/phone-numbers">
                    Phone Numbers
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Configure</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.back()}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex flex-col gap-1">
                <h1 className="text-xl font-semibold tracking-tight">Phone Configuration</h1>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-mono">{config.phoneNumber}</span>
                  {config.label && <Badge variant="outline">{config.label}</Badge>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="w-full">
            <div className="flex flex-row items-center gap-3 justify-start relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full mb-6">
              {[
                { title: "Assistant", value: "assistant", icon: Bot },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`relative px-4 py-2 rounded-full transition-colors flex items-center gap-2 text-sm ${
                    activeTab === tab.value
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.title}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {renderTabContent()}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
