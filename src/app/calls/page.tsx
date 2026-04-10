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
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EnhancedPagination } from "@/components/ui/enhanced-pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { ExportDataDialog } from "@/components/export-data-dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Phone,
  Search,
  Download,
  Play,
  MoreHorizontal,
  Clock,
  PhoneIncoming,
  PhoneOutgoing,
  Calendar,
  Globe,
  User
} from "lucide-react"
import { useCallLogs } from "@/hooks/use-call-logs"
import { useAuth } from "@/hooks/use-auth"
import { CallRecordingDialog } from "@/components/call-recording-dialog"
import { CallbackDialog } from "@/components/callback-dialog"
import { useAssistantsMapping } from "@/hooks/use-assistants-mapping"


export default function CallsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [callTypeFilter, setCallTypeFilter] = React.useState("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage] = React.useState(10) // Fixed at 10 items per page
  const [selectedCall, setSelectedCall] = React.useState<any>(null)
  const [showRecordingDialog, setShowRecordingDialog] = React.useState(false)
  const [showCallbackDialog, setShowCallbackDialog] = React.useState(false)

  // Fetch assistants for mapping to calls
  const { assistantsMap } = useAssistantsMapping({
    organizationId: user?.organization_id || '',
    enabled: !!user?.organization_id,
  })

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch call logs with real API
  const { 
    callLogs, 
    total, 
    isLoading, 
    error 
  } = useCallLogs({
    organizationId: user?.organization_id || '',
    skip: (currentPage - 1) * itemsPerPage,
    limit: itemsPerPage,
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    callType: callTypeFilter !== "all" ? callTypeFilter : undefined,
    autoFetch: !!user?.organization_id,
  })

  // No need for client-side filtering since API now supports call_type filtering
  const filteredCalls = callLogs

  const totalPages = Math.ceil(total / itemsPerPage)
  const totalItems = total

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Format duration from seconds to HH:MM:SS
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "00:00:00"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
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

  const getCallTypeBadge = (callType: string) => {
    const variants = {
      inbound: { icon: PhoneIncoming, color: "bg-blue-50 text-blue-700 border-blue-200" },
      outbound: { icon: PhoneOutgoing, color: "bg-purple-50 text-purple-700 border-purple-200" },
      webcall: { icon: Globe, color: "bg-green-50 text-green-700 border-green-200" },
    }

    const config = variants[callType as keyof typeof variants]
    const Icon = config?.icon || PhoneIncoming

    return (
      <Badge variant="outline" className={`text-xs px-2 py-0.5 font-medium ${config?.color || "bg-gray-50 text-gray-700 border-gray-200"}`}>
        <Icon className="h-3 w-3 mr-1" />
        {callType.charAt(0).toUpperCase() + callType.slice(1)}
      </Badge>
    )
  }

  // Handle recording dialog
  const handlePlayRecording = (call: any) => {
    setSelectedCall(call)
    setShowRecordingDialog(true)
  }

  // Handle download recording
  const handleDownloadRecording = (call: any) => {
    if (!call.recording_link) return
    
    const link = document.createElement('a')
    link.href = call.recording_link
    link.download = `call-recording-${call.id}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle callback
  const handleCallback = (call: any) => {
    setSelectedCall(call)
    setShowCallbackDialog(true)
  }


  // Get agent name from assistant_id
  const getAgentName = (assistantId: string) => {
    const agent = assistantsMap.get(assistantId)
    return agent?.name || 'Unknown Agent'
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
                  <BreadcrumbPage>Call Logs</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          {/* Header with Filters */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Call Logs</h1>
                <p className="text-sm text-muted-foreground">
                  Monitor and analyze your voice assistant calls
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ExportDataDialog defaultExportType="call_logs">
                  <Button variant="outline" size="default">
                    Export Data
                  </Button>
                </ExportDataDialog>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search phone numbers or summaries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={callTypeFilter} onValueChange={setCallTypeFilter}>
                  <SelectTrigger className="w-32 h-9">
                    <SelectValue placeholder="Call Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="webcall">Web Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Call Logs Table */}
          <div className="rounded-lg border">
            {isLoading ? (
              // Skeleton loader for table
              <div className="p-4 space-y-3">
                {Array.from({ length: itemsPerPage }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded" />
                    <Skeleton className="h-6 w-24 rounded" />
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-muted/50">
                    <TableHead className="px-4 py-3 text-xs font-semibold">Phone Number</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold">Type</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold">Status</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold">Duration</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold">Date & Time</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold">Summary</TableHead>
                    <TableHead className="w-8 px-4 py-3"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {error ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Empty className="h-[300px] border-0">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <Phone className="size-6" />
                            </EmptyMedia>
                            <EmptyTitle className="text-red-600">Error Loading Call Logs</EmptyTitle>
                            <EmptyDescription>
                              {error}
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  ) : filteredCalls.length === 0 && !isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Empty className="h-[300px] border-0">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <Phone className="size-6" />
                            </EmptyMedia>
                            <EmptyTitle>No call logs found</EmptyTitle>
                            <EmptyDescription>
                              {searchTerm || statusFilter !== "all" || callTypeFilter !== "all"
                                ? "Try adjusting your search or filters to find the call logs you're looking for."
                                : "Call logs will appear here once you start making or receiving calls."}
                            </EmptyDescription>
                          </EmptyHeader>
                          {(searchTerm || statusFilter !== "all" || callTypeFilter !== "all") && (
                            <EmptyContent>
                              <Button variant="outline" onClick={() => {
                                setSearchTerm("");
                                setStatusFilter("all");
                                setCallTypeFilter("all");
                              }}>
                                Clear Filters
                              </Button>
                            </EmptyContent>
                          )}
                        </Empty>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCalls.map((call) => (
                      <TableRow 
                        key={call.id} 
                        className="border-b hover:bg-muted/50 transition-colors cursor-pointer" 
                        onClick={() => {
                          // Store current page in sessionStorage for back navigation
                          sessionStorage.setItem('previousPage', window.location.pathname);
                          router.push(`/calls/${call.id}`);
                        }}
                      >
                      <TableCell className="px-4 py-4">
                        {(() => {
                          // Check if it's a web call first
                          const isWebCall = call.meta_data?.source === 'web' || 
                                          call.meta_data?.source === 'widget' ||
                                          call.from_number?.toLowerCase().includes('web') ||
                                          call.to_number?.toLowerCase().includes('web') ||
                                          call.from_number?.toLowerCase().includes('widget') ||
                                          call.to_number?.toLowerCase().includes('widget') ||
                                          call.call_type === 'webcall';
                          
                          if (isWebCall) {
                            return (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs font-medium">
                                    {getAgentName(call.assistant_id)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Globe className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">Web</span>
                                </div>
                              </div>
                            );
                          }
                          
                          // If not a web call but no phone numbers available
                          if (!call.from_number && !call.to_number) {
                            return (
                              <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">
                                Not Available
                              </Badge>
                            );
                          }
                          
                          // Regular phone call
                          return (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="font-mono text-xs font-medium">
                                {call.from_number || <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">N/A</Badge>} 
                                {' → '} 
                                {call.to_number || <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">N/A</Badge>}
                              </span>
                            </div>
                          );
                        })()}
                      </TableCell>
                        <TableCell className="px-4 py-4">
                          {getCallTypeBadge(call.call_type)}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          {getStatusBadge(call.status)}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          {call.duration_seconds ? (
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="font-mono text-xs font-medium">{formatDuration(call.duration_seconds)}</span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">
                              Not Available
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{formatTimestamp(call.start_time)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          {call.summary ? (
                            <span className="text-xs text-muted-foreground max-w-48 truncate block">
                              {call.summary}
                            </span>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">
                              Not Available
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* Always show View Details option */}
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                handlePlayRecording(call)
                              }}>
                                <Play className="mr-2 h-4 w-4" />
                                {call.recording_link ? 'Play Recording' : 'View Details'}
                              </DropdownMenuItem>
                              
                              {/* Show download option only if recording exists */}
                              {call.recording_link && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  handleDownloadRecording(call)
                                }}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                              )}
                              
                              {/* Show callback option for phone calls */}
                              {(call.call_type === 'inbound' || call.call_type === 'outbound') && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  handleCallback(call)
                                }}>
                                  <Phone className="mr-2 h-4 w-4" />
                                  Call Back
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
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
      
      {/* Recording Dialog */}
      <CallRecordingDialog
        call={selectedCall}
        isOpen={showRecordingDialog}
        onClose={() => {
          setShowRecordingDialog(false)
          setSelectedCall(null)
        }}
      />
      
      {/* Callback Dialog */}
      <CallbackDialog
        call={selectedCall}
        isOpen={showCallbackDialog}
        onClose={() => {
          setShowCallbackDialog(false)
          setSelectedCall(null)
        }}
      />
    </SidebarProvider>
  )
}