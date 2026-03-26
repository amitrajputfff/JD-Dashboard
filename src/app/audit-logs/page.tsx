"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { TutorialOverlay } from "@/components/tutorial"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useOrganizations } from "@/hooks/use-organizations"
import { AuditLog } from "@/types/audit"
import { auditApi } from "@/lib/api/audit"
import { EnhancedPagination } from "@/components/ui/enhanced-pagination"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { withAuditLogsGuard } from "@/components/route-guard"
import { toast } from "sonner"
import { 
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Settings,
  Bot,
  Phone,
  Database,
  AlertTriangle,
  Clock,
  User,
  Building2,
  ScrollText
} from "lucide-react"

const actionLabels: Record<string, { label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string }> = {
  "CREATE": { label: "Created", icon: CheckCircle, color: "text-green-600" },
  "UPDATE": { label: "Updated", icon: Settings, color: "text-blue-600" },
  "DELETE": { label: "Deleted", icon: XCircle, color: "text-red-600" },
  "agent.created": { label: "Agent Created", icon: Bot, color: "text-green-600" },
  "agent.updated": { label: "Agent Updated", icon: Bot, color: "text-blue-600" },
  "agent.deleted": { label: "Agent Deleted", icon: Bot, color: "text-red-600" },
  "login.success": { label: "Login Success", icon: CheckCircle, color: "text-green-600" },
  "login.failed": { label: "Login Failed", icon: XCircle, color: "text-red-600" },
  "settings.updated": { label: "Settings Updated", icon: Settings, color: "text-blue-600" },
  "call.completed": { label: "Call Completed", icon: Phone, color: "text-green-600" },
  "knowledge.uploaded": { label: "Document Uploaded", icon: Database, color: "text-blue-600" },
  "phone.assigned": { label: "Phone Assigned", icon: Phone, color: "text-blue-600" },
  "provider.configured": { label: "Provider Configured", icon: Settings, color: "text-purple-600" }
}

const resourceLabels: Record<string, { label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string }> = {
  "assistants": { label: "Assistant", icon: Bot, color: "text-blue-600" },
  "knowledge_base_file": { label: "Knowledge Base", icon: Database, color: "text-green-600" },
  "phone_numbers": { label: "Phone Number", icon: Phone, color: "text-purple-600" },
  "users": { label: "User", icon: User, color: "text-orange-600" },
  "organizations": { label: "Organization", icon: Building2, color: "text-indigo-600" }
}

const severityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
}

const statusColors = {
  success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  failure: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
}

function AuditLogsPageContent() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [itemsPerPage] = React.useState(10) // Fixed at 10 items per page
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedAction, setSelectedAction] = React.useState<string>("all")
  const [selectedSeverity, setSelectedSeverity] = React.useState<string>("all")
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all")
  const [selectedUser, setSelectedUser] = React.useState<string>("all")
  const [selectedOrganization, setSelectedOrganization] = React.useState<string>("all")
  const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null)

  // Use organizations hook for dynamic organization data
  const {
    getOrganizationName,
    fetchOrganizations
  } = useOrganizations()

  // State for audit logs data
  const [allLogs, setAllLogs] = React.useState<AuditLog[]>([]) // All fetched logs (up to 1000)
  const [filteredLogs, setFilteredLogs] = React.useState<AuditLog[]>([]) // Logs after filtering
  const [logsLoading, setLogsLoading] = React.useState(false)
  const [currentPage, setCurrentPage] = React.useState(1)

  // Get unique values for filters
  const uniqueActions = React.useMemo(() => 
    Array.from(new Set(allLogs.map(log => log.action))), [allLogs]
  )
  const uniqueOrganizations = React.useMemo(() => 
    Array.from(new Set(allLogs.map(log => log.organizationId))), [allLogs]
  )

  // Fetch organization data when logs are loaded
  React.useEffect(() => {
    if (uniqueOrganizations.length > 0) {
      fetchOrganizations(uniqueOrganizations)
    }
  }, [uniqueOrganizations, fetchOrganizations])

  // Fetch all audit logs (up to 1000) once
  const fetchAuditLogs = React.useCallback(async () => {
    setLogsLoading(true)

    try {
      const response = await auditApi.getAllOrganizationsAuditLogs({
        limit: 1000, // Always fetch up to 1000 logs
        skip: 0
      })

      setAllLogs(response.data)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      toast.error('Failed to fetch audit logs')
    } finally {
      setLogsLoading(false)
    }
  }, [])

  // Fetch logs on initial load
  React.useEffect(() => {
    fetchAuditLogs()
  }, [fetchAuditLogs])

  // Client-side filtering
  React.useEffect(() => {
    let filtered = [...allLogs]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(log => 
        log.user.name.toLowerCase().includes(query) ||
        log.user.email.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query) ||
        log.resource.toLowerCase().includes(query)
      )
    }

    // Apply action filter
    if (selectedAction !== "all") {
      filtered = filtered.filter(log => log.action === selectedAction)
    }

    // Apply severity filter
    if (selectedSeverity !== "all") {
      filtered = filtered.filter(log => log.severity === selectedSeverity)
    }

    // Apply status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(log => log.status === selectedStatus)
    }

    // Apply user filter
    if (selectedUser !== "all") {
      filtered = filtered.filter(log => log.user.id === selectedUser)
    }

    // Apply organization filter
    if (selectedOrganization !== "all") {
      filtered = filtered.filter(log => log.organizationId === selectedOrganization)
    }

    setFilteredLogs(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [allLogs, searchQuery, selectedAction, selectedSeverity, selectedStatus, selectedUser, selectedOrganization])

  // Calculate pagination for filtered logs
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Items per page is fixed at 10, no need for handler

  const handleView = (log: AuditLog) => {
    setSelectedLog(log)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedAction("all")
    setSelectedSeverity("all")
    setSelectedStatus("all")
    setSelectedUser("all")
    setSelectedOrganization("all")
    // Filtering will be handled by the useEffect
  }


  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const getActionInfo = (action: string) => {
    return actionLabels[action] || { label: action, icon: Settings, color: "text-gray-600" }
  }

  const getResourceInfo = (resource: string) => {
    return resourceLabels[resource] || { label: resource, icon: Settings, color: "text-gray-600" }
  }

  return (
    <>
      <TutorialOverlay />
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
                  <BreadcrumbPage>Audit Logs</BreadcrumbPage>
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
                <h1 className="text-xl font-semibold tracking-tight">Audit Logs</h1>
                  <p className="text-sm text-muted-foreground">
                  Monitor system activity and user actions across all organizations (showing up to 1000 most recent logs)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => toast.info("Export functionality coming soon")}>
                    <Download className="mr-2 h-4 w-4" />
                  Export Data
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                    placeholder="Search logs by user, action, or details..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>

                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger className="w-32 h-9">
                      <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      {uniqueActions.map(action => (
                        <SelectItem key={action} value={action}>
                        {getActionInfo(action).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                    <SelectTrigger className="w-32 h-9">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-32 h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failure">Failure</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  {(searchQuery || selectedAction !== "all" || selectedSeverity !== "all" || selectedStatus !== "all" || selectedUser !== "all" || selectedOrganization !== "all") && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearFilters}
                    className="h-9"
                  >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>

          {/* Main content */}
          <div className="flex-1">
            {logsLoading ? (
                    // Skeleton loader for table
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">Timestamp</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">User</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">Action</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">Resource</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">Severity</TableHead>
                      <TableHead className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      {Array.from({ length: itemsPerPage }).map((_, index) => (
                      <TableRow key={index} className="border-b">
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-3 w-3 rounded" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="space-y-1">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-3 w-3 rounded" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-3 w-3 rounded" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Skeleton className="h-5 w-12 rounded-full" />
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <Skeleton className="h-6 w-6 rounded" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : filteredLogs.length === 0 ? (
              <Empty className="h-[400px] bg-muted/50">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ScrollText className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>No audit logs found</EmptyTitle>
                  <EmptyDescription>
                    {searchQuery || selectedAction !== "all" || selectedSeverity !== "all" || selectedStatus !== "all" || selectedUser !== "all" || selectedOrganization !== "all"
                      ? "Try adjusting your search or filters to find the audit logs you're looking for."
                      : "Audit logs will appear here once actions are performed in your organization."}
                  </EmptyDescription>
                </EmptyHeader>
                {(searchQuery || selectedAction !== "all" || selectedSeverity !== "all" || selectedStatus !== "all" || selectedUser !== "all" || selectedOrganization !== "all") && (
                  <EmptyContent>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
                  ) : (
              <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">Timestamp</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">User</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">Action</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">Resource</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">Severity</TableHead>
                      <TableHead className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                    {paginatedLogs.map((log) => {
                      const actionInfo = getActionInfo(log.action)
                      const ActionIcon = actionInfo.icon
                          
                          return (
                        <TableRow key={log.id} className="border-b hover:bg-muted/50 transition-colors">
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-medium">
                                {formatTimestamp(log.timestamp)}
                                  </span>
                                </div>
                              </TableCell>
                          <TableCell className="px-4 py-3">
                                <div>
                              <p className="font-medium text-xs">{log.user.name}</p>
                                  <p className="text-xs text-muted-foreground">{log.user.role}</p>
                                </div>
                              </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <ActionIcon className={`h-3 w-3 ${actionInfo.color}`} />
                              <span className="text-xs font-medium">{actionInfo.label}</span>
                                </div>
                              </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const resourceInfo = getResourceInfo(log.resource)
                                const ResourceIcon = resourceInfo.icon
                                return (
                                  <>
                                    <ResourceIcon className={`h-3 w-3 ${resourceInfo.color}`} />
                                    <span className="text-xs font-medium">{resourceInfo.label}</span>
                                  </>
                                )
                              })()}
                                </div>
                              </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge className={`${statusColors[log.status]} text-xs`}>
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge className={`${severityColors[log.severity]} text-xs`}>
                              {log.severity}
                                </Badge>
                              </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                              onClick={() => handleView(log)}
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <EnhancedPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredLogs.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              showItemsPerPage={false}
              showQuickJump={true}
              showItemInfo={true}
              compact={false}
            />
          )}
        </div>

        {/* Log Details Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="!max-w-[50rem] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-3 border-b">
              <DialogTitle className="text-lg font-medium flex items-center gap-2">
                                      <Eye className="h-4 w-4" />
                Audit Log Details
              </DialogTitle>
                                    </DialogHeader>
                                    {selectedLog && (
              <div className="space-y-4 py-3">
                {/* Header Section */}
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded border">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const actionInfo = getActionInfo(selectedLog.action)
                      const ActionIcon = actionInfo.icon
                      return (
                        <>
                          <ActionIcon className={`h-4 w-4 ${actionInfo.color}`} />
                          <span className="text-sm font-medium">{actionInfo.label}</span>
                          <span className="text-xs text-muted-foreground">on</span>
                          <span className="text-sm">{getResourceInfo(selectedLog.resource).label}</span>
                        </>
                      )
                    })()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className={`${statusColors[selectedLog.status]} text-xs px-2 py-0.5`}>
                      {selectedLog.status}
                    </Badge>
                    <Badge className={`${severityColors[selectedLog.severity]} text-xs px-2 py-0.5`}>
                      {selectedLog.severity}
                    </Badge>
                  </div>
                </div>

                {/* Main Grid - 3 columns */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Column 1: Event Info */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Event</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Timestamp</p>
                        <p className="text-xs font-medium">{formatTimestamp(selectedLog.timestamp)}</p>
                      </div>
                                          <div>
                        <p className="text-xs text-muted-foreground">Organization</p>
                        <p className="text-xs font-medium">{getOrganizationName(selectedLog.organizationId)}</p>
                      </div>
                                            </div>
                  </div>

                  {/* Column 2: User Info */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">User</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="text-xs font-medium">{selectedLog.user.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-xs font-medium">{selectedLog.user.email}</p>
                                          </div>
                                          <div>
                        <p className="text-xs text-muted-foreground">Role</p>
                        <p className="text-xs font-medium">{selectedLog.user.role}</p>
                                            </div>
                                          </div>
                                        </div>

                  {/* Column 3: Technical Info */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Technical</h4>
                    <div className="space-y-2">
                                        <div>
                        <p className="text-xs text-muted-foreground">IP Address</p>
                        <p className="text-xs font-mono font-medium">{selectedLog.ipAddress}</p>
                                        </div>
                                        <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="text-xs font-medium">{selectedLog.location}</p>
                                        </div>
                                          <div>
                        <p className="text-xs text-muted-foreground">Device</p>
                        <p className="text-xs font-medium">{selectedLog.device}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Details</h4>
                  <div className="p-3 bg-muted/20 rounded border text-xs">
                    {selectedLog.details}
                  </div>
                </div>

                {/* User Agent Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">User Agent</h4>
                  <div className="p-2 bg-muted/20 rounded border">
                    <p className="text-xs font-mono break-all text-muted-foreground">{selectedLog.userAgent}</p>
                  </div>
                                          </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}

// Apply route protection to the page
const ProtectedAuditLogsPageContent = withAuditLogsGuard(AuditLogsPageContent);

export default function AuditLogsPage() {
  return <ProtectedAuditLogsPageContent />
}