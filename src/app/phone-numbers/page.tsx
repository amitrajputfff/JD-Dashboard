"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PhoneInput } from "@/components/ui/phone-input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EnhancedPagination } from "@/components/ui/enhanced-pagination"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { useProviders } from "@/hooks/use-providers"
import { usePhoneNumbers } from "@/lib/hooks/use-phone-numbers"
import { authStorage } from "@/lib/auth-storage"
import { PhoneNumber } from "@/types/phone-number"
import { ExportDataDialog } from "@/components/export-data-dialog"
import {
  Search,
  Plus,
  Phone as PhoneIcon,
  MoreHorizontal,
  Trash2,
  Edit,
  Copy,
  Settings,
  Eye,
} from "lucide-react"
import { toast } from "sonner"

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

const DEFAULT_FORM_STATE: PhoneNumberFormState = {
  name: "",
  description: "",
  type: "inbound",
  country_code: "+1",
  phone_number: "",
  provider_id: "",
  is_active: true,
  include_country_code: true,
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

export default function PhoneNumbersPage() {
  const router = useRouter()
  const [organizationId, setOrganizationId] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [providerFilter, setProviderFilter] = React.useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false)
  const [createForm, setCreateForm] = React.useState<PhoneNumberFormState>(DEFAULT_FORM_STATE)
  const [editForm, setEditForm] = React.useState<PhoneNumberFormState>(DEFAULT_FORM_STATE)
  const [selectedPhone, setSelectedPhone] = React.useState<PhoneNumber | null>(null)
  const [itemsPerPage, setItemsPerPage] = React.useState(10)
  const [isCreating, setIsCreating] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)

  const {
    phoneNumbers,
    pagination,
    loading,
    fetchPhoneNumbers,
    createPhoneNumber,
    updatePhoneNumber,
    deletePhoneNumber,
    assignAssistant,
    updateParams,
  } = usePhoneNumbers({ 
    organizationId: organizationId || undefined,
    skip: 0,
    limit: itemsPerPage,
    search: searchQuery,
    is_active: statusFilter === "all" ? undefined : statusFilter === "active",
    provider_id: providerFilter === "all" ? undefined : providerFilter
  })

  const { providers, loading: providersLoading, error: providersError } = useProviders("phone_provider")

  const providerMap = React.useMemo(() => {
    return new Map(providers.map((provider) => [provider.id, provider.display_name]))
  }, [providers])

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const user = authStorage.getUser()
    if (user?.organization_id) {
      setOrganizationId(user.organization_id)
    } else {
      toast.error("Organization not found for current user")
    }
  }, [])


  React.useEffect(() => {
    if (providersError) {
      toast.error(`Failed to load providers: ${providersError}`)
    }
  }, [providersError])

  // Update API params when filters change
  React.useEffect(() => {
    updateParams({
      organizationId: organizationId || undefined,
      search: searchQuery,
      is_active: statusFilter === "all" ? undefined : statusFilter === "active",
      provider_id: providerFilter === "all" ? undefined : providerFilter,
      skip: 0, // Reset to first page when filters change
      limit: itemsPerPage,
    })
  }, [searchQuery, statusFilter, providerFilter, organizationId, itemsPerPage, updateParams])


  // Use phone numbers directly from API (filtering is done server-side)
  const filteredNumbers = phoneNumbers

  // Use API pagination instead of client-side pagination
  const currentPage = pagination?.page || 1
  const totalPages = Math.ceil((pagination?.total || 0) / itemsPerPage)
  const totalItems = pagination?.total || 0
  const paginatedNumbers = filteredNumbers


  const goToPage = React.useCallback((page: number) => {
    updateParams({
      skip: (page - 1) * itemsPerPage,
      limit: itemsPerPage,
    })
  }, [updateParams, itemsPerPage])

  React.useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      goToPage(totalPages)
    } else if (totalPages === 0 && currentPage !== 1) {
      goToPage(1)
    }
  }, [currentPage, totalPages, goToPage])

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value)
    updateParams({
      skip: 0,
      limit: value,
    })
  }

  const resetForms = () => {
    setCreateForm(DEFAULT_FORM_STATE)
    setEditForm(DEFAULT_FORM_STATE)
    setSelectedPhone(null)
  }

  const handleNumberInput = (value: string, setter: (value: string) => void) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '')
    setter(numericValue)
  }

  const handleOpenAddDialog = () => {
    resetForms()
    setIsAddDialogOpen(true)
  }

  const handleCreatePhoneNumber = async () => {
    if (!organizationId) {
      toast.error("Organization is required to create phone numbers")
      return
    }

    if (!createForm.phone_number.trim()) {
      toast.error("Phone number is required")
      return
    }

    if (!createForm.provider_id) {
      toast.error("Please select a provider")
      return
    }

    setIsCreating(true)
    try {
        const finalPhoneNumber = createForm.include_country_code 
          ? `${createForm.country_code}${createForm.phone_number.trim()}`
          : createForm.phone_number.trim()
        
        await createPhoneNumber({
          phone_number: finalPhoneNumber,
          provider_id: Number(createForm.provider_id),
          organization_id: organizationId,
          is_active: createForm.is_active,
          name: createForm.name.trim() || null,
          description: createForm.description.trim() || null,
          type: createForm.type,
        })
      setIsAddDialogOpen(false)
      resetForms()
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditClick = (phone: PhoneNumber) => {
    setSelectedPhone(phone)
    
    // Debug logging
    console.log("Original phone number:", phone.phone_number)
    
    // Parse phone number to extract country code and number
    const phoneNumber = phone.phone_number
    let countryCode = "+1" // Default fallback
    let number = phoneNumber
    
    // Extract country code if present
    if (phoneNumber && phoneNumber.startsWith("+")) {
      console.log("Phone number starts with +, extracting...")
      
      // Try to match common country code patterns (be more specific with country codes)
      const patterns = [
        /^(\+1)(\d+)$/, // US/Canada: +1 followed by any digits
        /^(\+44)(\d+)$/, // UK: +44...
        /^(\+33)(\d+)$/, // France: +33...
        /^(\+49)(\d+)$/, // Germany: +49...
        /^(\+39)(\d+)$/, // Italy: +39...
        /^(\+34)(\d+)$/, // Spain: +34...
        /^(\+55)(\d+)$/, // Brazil: +55...
        /^(\+81)(\d+)$/, // Japan: +81...
        /^(\+86)(\d+)$/, // China: +86...
        /^(\+91)(\d+)$/, // India: +91...
        /^(\+\d{1,3})(\d+)$/, // Generic fallback (moved to end)
      ]
      
      for (const pattern of patterns) {
        const match = phoneNumber.match(pattern)
        if (match) {
          countryCode = match[1]
          number = match[2]
          console.log("Pattern matched:", pattern, "Country code:", countryCode, "Number:", number)
          break
        }
      }
      
      // If no pattern matched, try a more flexible approach
      if (number === phoneNumber) {
        const match = phoneNumber.match(/^(\+\d{1,3})(.*)$/)
        if (match) {
          countryCode = match[1]
          number = match[2].replace(/\D/g, '') // Remove all non-numeric characters
          console.log("Flexible match - Country code:", countryCode, "Number:", number)
        }
      }
    } else if (phoneNumber) {
      // If no country code, assume it's just the number part
      number = phoneNumber.replace(/\D/g, '')
      console.log("No + prefix, using as number:", number)
    }
    
    console.log("Final values - Country code:", countryCode, "Number:", number)
    
    setEditForm({
      name: phone.name ?? "",
      description: phone.description ?? "",
      type: phone.type ?? "inbound",
      country_code: countryCode,
      phone_number: number,
      provider_id: phone.provider_id ? phone.provider_id.toString() : "",
      is_active: phone.is_active,
      include_country_code: phoneNumber?.startsWith("+") ?? true,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdatePhoneNumber = async () => {
    if (!selectedPhone) return

    if (!organizationId) {
      toast.error("Organization is required to update phone numbers")
      return
    }

    if (!editForm.provider_id) {
      toast.error("Please select a provider")
      return
    }

    setIsUpdating(true)
    try {
        await updatePhoneNumber(selectedPhone.id, {
          provider_id: Number(editForm.provider_id),
          organization_id: organizationId,
          is_active: editForm.is_active,
          name: editForm.name.trim() || null,
          description: editForm.description.trim() || null,
          type: editForm.type,
        })
      setIsEditDialogOpen(false)
      resetForms()
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeletePhoneNumber = async (phone: PhoneNumber) => {
    const confirmed = window.confirm(`Delete phone number ${phone.phone_number}?`)
    if (!confirmed) return

    try {
      await deletePhoneNumber(phone.id)
    } catch (error: any) {
      if (error?.message?.includes("Cannot delete phone number that is assigned to an assistant")) {
        toast.error("Cannot delete phone number that is assigned to an assistant. Please unassign the assistant first.")
      } else {
        toast.error(error?.message || "Failed to delete phone number")
      }
    }
  }

  const handleCopyNumber = (value: string) => {
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success("Phone number copied"))
      .catch(() => toast.error("Failed to copy phone number"))
  }

  const handleConfigureClick = (phone: PhoneNumber) => {
    router.push(`/phone-numbers/${phone.id}/configure`)
  }

  const handleViewDetails = (phone: PhoneNumber) => {
    setSelectedPhone(phone)
    setIsViewDialogOpen(true)
  }

  const renderTableContent = () => {
        if (loading) {
          return Array.from({ length: itemsPerPage }).map((_, index) => (
            <TableRow key={index} className="border-b border-border/50">
              <TableCell className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-[140px]" />
                    <Skeleton className="h-3 w-[120px]" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4 py-4">
                <Skeleton className="h-3 w-16" />
              </TableCell>
              <TableCell className="px-4 py-4">
                <Skeleton className="h-5 w-12 rounded" />
              </TableCell>
              <TableCell className="px-4 py-4">
                <Skeleton className="h-3 w-20" />
              </TableCell>
              <TableCell className="px-4 py-4">
                <Skeleton className="h-3 w-16" />
              </TableCell>
              <TableCell className="text-right px-6 py-4">
                <Skeleton className="h-8 w-8 rounded" />
              </TableCell>
            </TableRow>
          ))
        }

    if (!loading && paginatedNumbers.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6}>
            <div className="flex items-center justify-center h-[400px] border rounded-lg bg-muted/50">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No phone numbers found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters, or create a new phone number.
                </p>
                <Button size="default" onClick={handleOpenAddDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Phone Number
                </Button>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )
    }

    return paginatedNumbers.map((phone) => {
      const providerName = providerMap.get(phone.provider_id) ?? "Unknown"

      return (
        <TableRow key={phone.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleConfigureClick(phone)}>
          <TableCell className="px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900">
                <PhoneIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-semibold text-xs truncate">
                    {phone.phone_number}
                  </div>
                </div>
                {phone.name && (
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {phone.name}
                  </div>
                )}
              </div>
            </div>
          </TableCell>
          <TableCell className="px-4 py-4 align-top">
            <div className="text-xs font-medium">
              {providerName}
            </div>
          </TableCell>
          <TableCell className="px-4 py-4 align-top">
            <Badge variant={phone.is_active ? "default" : "secondary"} className="text-xs">
              {phone.is_active ? "Active" : "Inactive"}
            </Badge>
          </TableCell>
          <TableCell className="px-4 py-4 align-top">
            {phone.mapped_assistant ? (
              <div className="text-xs font-medium">
                {phone.mapped_assistant.name}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground font-medium">
                Not assigned
              </div>
            )}
          </TableCell>
          <TableCell className="px-4 py-4 align-top">
            <div className="text-xs font-medium">
              {dateFormatter.format(new Date(phone.created_at))}
            </div>
          </TableCell>
          <TableCell className="text-right px-6 py-4 align-top">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-9 w-9 p-0 hover:bg-muted/50 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  handleViewDetails(phone)
                }}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  handleCopyNumber(phone.phone_number)
                }}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy number
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  handleEditClick(phone)
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  handleConfigureClick(phone)
                }}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeletePhoneNumber(phone)
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      )
    })
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
                  <BreadcrumbPage>Phone Numbers</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary rounded-lg p-2">
                  <PhoneIcon className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Phone Numbers</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage phone numbers and assign them to your AI agents
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {totalItems} total
                    </span>
                    <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
                      {phoneNumbers.filter(p => p.is_active).length} active
                    </span>
                    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                      {phoneNumbers.filter(p => !p.is_active).length} inactive
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ExportDataDialog defaultExportType="phone_numbers">
                  <Button variant="outline" size="sm">
                    Export Data
                  </Button>
                </ExportDataDialog>
                <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                  setIsAddDialogOpen(open)
                  if (!open) resetForms()
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="default" onClick={handleOpenAddDialog}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Phone Number
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add Phone Number</DialogTitle>
                      <DialogDescription>
                        Create a new phone number and assign it a provider
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="create-phone-number">Phone number</Label>
                        {createForm.include_country_code ? (
                          <PhoneInput
                            id="create-phone-number"
                            value={`${createForm.country_code}${createForm.phone_number}`}
                            onChange={(value) => {
                              // Parse the full value to extract country code and number
                              const match = value.match(/^(\+\d{1,3})(.*)$/)
                              if (match) {
                                setCreateForm(prev => ({
                                  ...prev,
                                  country_code: match[1],
                                  phone_number: match[2].replace(/\D/g, '')
                                }))
                              }
                            }}
                            placeholder="5551234567"
                          />
                        ) : (
                          <Input
                            id="create-phone-number"
                            value={createForm.phone_number}
                            onChange={(e) => {
                              const numericValue = e.target.value.replace(/\D/g, '')
                              setCreateForm(prev => ({ ...prev, phone_number: numericValue }))
                            }}
                            placeholder="5551234567"
                          />
                        )}
                        <div className="flex items-center space-x-2 pt-1">
                          <Switch
                            id="create-include-country-code"
                            checked={createForm.include_country_code}
                            onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, include_country_code: checked }))}
                          />
                          <Label htmlFor="create-include-country-code" className="text-sm font-normal text-muted-foreground">
                            Include country code
                          </Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="create-provider">Provider</Label>
                        <Select
                          value={createForm.provider_id}
                          onValueChange={(value) => setCreateForm((prev) => ({ ...prev, provider_id: value }))}
                        >
                          <SelectTrigger id="create-provider">
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            {providersLoading ? (
                              <SelectItem value="loading" disabled>Loading providers...</SelectItem>
                            ) : providers.length === 0 ? (
                              <SelectItem value="no-providers" disabled>No providers available</SelectItem>
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
                      <div className="space-y-2">
                        <Label htmlFor="create-name">Name</Label>
                        <Input
                          id="create-name"
                          value={createForm.name}
                          onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                          placeholder="Enter phone number name (optional)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="create-description">Description</Label>
                        <Textarea
                          id="create-description"
                          value={createForm.description}
                          onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                          placeholder="Enter description (optional)"
                          className="resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="create-type">Type</Label>
                        <Select
                          value={createForm.type}
                          onValueChange={(value) => setCreateForm((prev) => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger id="create-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inbound">Inbound</SelectItem>
                            <SelectItem value="outbound">Outbound</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div className="space-y-0.5">
                          <Label htmlFor="create-active">Active</Label>
                          <p className="text-xs text-muted-foreground">
                            New numbers are active by default.
                          </p>
                        </div>
                        <Switch
                          id="create-active"
                          checked={createForm.is_active}
                          onCheckedChange={(checked) => setCreateForm((prev) => ({ ...prev, is_active: checked }))}
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => {
                          setIsAddDialogOpen(false)
                          resetForms()
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreatePhoneNumber} disabled={isCreating}>
                          {isCreating ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search phone numbers by name or number..."
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value)
                    }}
                    className="pl-9 h-9"
                  />
                </div>
                
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value)
            }}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
                
                <Select value={providerFilter} onValueChange={(value) => {
                  setProviderFilter(value)
                }}>
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All providers</SelectItem>
                    {providersLoading ? (
                      <SelectItem value="loading" disabled>Loading providers...</SelectItem>
                    ) : providers.length === 0 ? (
                      <SelectItem value="no-providers" disabled>No providers available</SelectItem>
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
              
              {(searchQuery || statusFilter !== "all" || providerFilter !== "all") && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
                setProviderFilter("all")
              }}
              className="h-9"
            >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1">
            {loading ? (
              // Skeleton loader
              <div className="rounded-lg border">
                <div className="border-b bg-muted/50 p-4">
                  <div className="grid grid-cols-6 gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
                <div className="divide-y">
                  {Array.from({ length: itemsPerPage }).map((_, index) => (
                    <div key={index} className="p-4">
                      <div className="grid grid-cols-6 gap-4 items-center">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[140px]" />
                            <Skeleton className="h-3 w-[200px]" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="space-y-1">
                          <Skeleton className="h-5 w-12 rounded" />
                        </div>
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex justify-end">
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !loading && phoneNumbers.length === 0 ? (
              <Empty className="h-[400px] bg-muted/50">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <PhoneIcon className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>No phone numbers found</EmptyTitle>
                  <EmptyDescription>
                    {searchQuery || statusFilter !== "all" || providerFilter !== "all"
                      ? "Try adjusting your search or filters to find the phone numbers you're looking for."
                      : "Get started by adding your first phone number to receive calls."}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  {searchQuery || statusFilter !== "all" || providerFilter !== "all" ? (
                    <Button variant="outline" onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setProviderFilter("all");
                    }}>
                      Clear Filters
                    </Button>
                  ) : (
                    <Button size="default" onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Phone Number
                    </Button>
                  )}
                </EmptyContent>
              </Empty>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b bg-muted/50">
                      <TableHead className="w-[320px] px-6 py-3 text-xs font-semibold">Phone Number</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold">Provider</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold">Status</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold">Assigned Assistant</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold">Created</TableHead>
                      <TableHead className="text-right px-6 py-3 text-xs font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{renderTableContent()}</TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <EnhancedPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={goToPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              showItemsPerPage={false}
              showQuickJump={true}
              showItemInfo={true}
              compact={false}
            />
          )}
        </div>

        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open)
            if (!open) resetForms()
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Phone Number</DialogTitle>
              <DialogDescription>Update the phone number configuration.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone-number">Phone number</Label>
                <div className="flex gap-2">
                  <Select
                    value={editForm.country_code}
                    onValueChange={(value) => setEditForm((prev) => ({ ...prev, country_code: value }))}
                    disabled
                  >
                    <SelectTrigger className="w-24 bg-muted text-muted-foreground cursor-not-allowed">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+1">+1</SelectItem>
                      <SelectItem value="+44">+44</SelectItem>
                      <SelectItem value="+33">+33</SelectItem>
                      <SelectItem value="+49">+49</SelectItem>
                      <SelectItem value="+39">+39</SelectItem>
                      <SelectItem value="+34">+34</SelectItem>
                      <SelectItem value="+55">+55</SelectItem>
                      <SelectItem value="+81">+81</SelectItem>
                      <SelectItem value="+86">+86</SelectItem>
                      <SelectItem value="+91">+91</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="edit-phone-number"
                    value={editForm.phone_number}
                    onChange={(event) => handleNumberInput(event.target.value, (value) => setEditForm((prev) => ({ ...prev, phone_number: value })))}
                    placeholder="5551234567"
                    className="flex-1 bg-muted text-muted-foreground cursor-not-allowed"
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Phone number cannot be changed after creation
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-provider">Provider</Label>
                <Select
                  value={editForm.provider_id}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, provider_id: value }))}
                >
                  <SelectTrigger id="edit-provider">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providersLoading ? (
                      <SelectItem value="loading" disabled>Loading providers...</SelectItem>
                    ) : providers.length === 0 ? (
                      <SelectItem value="no-providers" disabled>No providers available</SelectItem>
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
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input 
                  id="edit-name" 
                  value={editForm.name} 
                  onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Enter phone number name (optional)" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Enter description (optional)"
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={editForm.type}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-active">Active</Label>
                  <p className="text-xs text-muted-foreground">Deactivate to temporarily disable the number.</p>
                </div>
                <Switch
                  id="edit-active"
                  checked={editForm.is_active}
                  onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, is_active: checked }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    resetForms()
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdatePhoneNumber} disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog
          open={isViewDialogOpen}
          onOpenChange={(open) => {
            setIsViewDialogOpen(open)
            if (!open) setSelectedPhone(null)
          }}
        >
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Phone Number Details</DialogTitle>
              <DialogDescription>
                View detailed information about this phone number.
              </DialogDescription>
            </DialogHeader>
            {selectedPhone && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Phone Number</Label>
                    <p className="text-sm font-medium">{selectedPhone.phone_number}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Provider</Label>
                    <p className="text-sm font-medium">{providerMap.get(selectedPhone.provider_id) ?? "Unknown"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <p className="text-sm font-medium capitalize">{selectedPhone.type || "Inbound"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge variant={selectedPhone.is_active ? "default" : "secondary"} className="text-xs">
                        {selectedPhone.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Name and Description */}
                {(selectedPhone.name || selectedPhone.description) && (
                  <div className="space-y-4">
                    {selectedPhone.name && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Name</Label>
                        <p className="text-sm font-medium">{selectedPhone.name}</p>
                      </div>
                    )}
                    {selectedPhone.description && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <p className="text-sm">{selectedPhone.description}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Assistant Assignment */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Assigned Assistant</Label>
                  {selectedPhone.mapped_assistant ? (
                    <div className="p-3 rounded-md border bg-muted/50">
                      <div className="text-sm font-medium">{selectedPhone.mapped_assistant.name}</div>
                      <div className="text-xs text-muted-foreground">{selectedPhone.mapped_assistant.status}</div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No assistant assigned</p>
                  )}
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Created</Label>
                    <p className="text-sm font-medium">
                      {dateFormatter.format(new Date(selectedPhone.created_at))}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Last Updated</Label>
                    <p className="text-sm font-medium">
                      {dateFormatter.format(new Date(selectedPhone.updated_at))}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button onClick={() => {
                    setIsViewDialogOpen(false)
                    handleConfigureClick(selectedPhone)
                  }}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
