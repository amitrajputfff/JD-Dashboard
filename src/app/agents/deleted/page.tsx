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
import { Input } from "@/components/ui/input"
import { DeletedAgentsCardView, DeletedAgentsTable } from "@/components/agents"
import { Toggle } from "@/components/ui/toggle"
import { Agent } from "@/types/agent"
import { Loader } from "@/components/ui/loader"
import { useRouter } from "next/navigation"
import { usePagination } from "@/hooks/use-pagination"
import { useAgentsApi } from "@/lib/hooks/use-agents-api"
import { useAgentsComprehensive } from "@/lib/hooks/use-agents-comprehensive"
import { mapApiAgentToAgent } from "@/lib/utils/agent-mapper"
import { authUtils } from "@/lib/auth-utils"
import { agentsApi } from "@/lib/api/agents"
import { NoOrganization } from "@/components/no-organization"
import { EnhancedPagination } from "@/components/ui/enhanced-pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { 
  Search, 
  Trash2, 
  ArrowLeft,
  LayoutGrid, 
  List,
  RotateCcw
} from "lucide-react"
import { toast } from "sonner"
import { SortControl } from "@/components/ui/sort-control"
import { TagsFilter } from "@/components/agents"

const mapDeletedSortByToApi = (sortBy: string): string => {
  switch (sortBy) {
    case "deletedAt":
      return "deleted_until"
    case "name":
      return "name"
    case "calls":
      return "calls"
    default:
      return "updated_at"
  }
}

export default function DeletedAgentsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [itemsPerPage] = React.useState(10) // Fixed at 10 items per page
  const [currentPage, setCurrentPage] = React.useState(1)
  const [sortBy, setSortBy] = React.useState<string>("deletedAt")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = React.useState<"table" | "cards">("table")
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  const [allTags, setAllTags] = React.useState<string[]>([])
  const sortOptions = React.useMemo(() => ([
    { value: "deletedAt", label: "Removal Date" },
    { value: "name", label: "Name" },
    { value: "calls", label: "Total Calls" },
  ]), [])

  const handleSortChange = React.useCallback((newSortBy: string, newSortOrder: "asc" | "desc") => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    setCurrentPage(1)
  }, [])

  const handleTagToggle = React.useCallback((tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
    setCurrentPage(1)
  }, [])
  
  // Confirmation dialog states
  const [restoreDialogOpen, setRestoreDialogOpen] = React.useState(false)
  const [selectedAgentForAction, setSelectedAgentForAction] = React.useState<Agent | null>(null)
  const [isActionLoading, setIsActionLoading] = React.useState(false)

  // Check if user has organization ID (client-side only)
  const [organizationId, setOrganizationId] = React.useState<string | null>(null)
  const [isCheckingOrg, setIsCheckingOrg] = React.useState(true)

  // API integration for deleted agents
  const {
    agents: apiAgents,
    total,
    loading: isLoading,
    error,
    updateParams,
    refetch
  } = useAgentsApi({
    skip: (currentPage - 1) * itemsPerPage,
    limit: itemsPerPage,
    organization_id: organizationId || undefined,
    is_deleted: true, // Only get deleted agents
    search: searchQuery || undefined,
    sort_by: mapDeletedSortByToApi(sortBy),
    sort_order: sortOrder,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    enabled: !!organizationId, // Only enable when we have an organization ID
  })

  // API integration for counts (to refresh main page counts) - DISABLED to avoid duplicate calls
  const {
    refetchAll
  } = useAgentsComprehensive({
    organization_id: organizationId || undefined,
    enabled: false, // DISABLED - we don't need counts on deleted page
    fetchDeleted: false, // Don't fetch deleted count
    fetchDrafts: false, // Don't fetch drafts on deleted page
  })

  // Map API agents to expected format
  const deletedAgents = React.useMemo(() => {
    return apiAgents.map(mapApiAgentToAgent)
  }, [apiAgents])


  // Show error if API call fails
  React.useEffect(() => {
    if (error) {
      toast.error(`Failed to load deleted agents: ${error}`)
    }
  }, [error])

  const fetchAllTags = React.useCallback(async () => {
    if (!organizationId) return

    try {
      const response = await agentsApi.getAgents({
        organization_id: organizationId,
        is_deleted: true,
      })

      const tags = (response.assistants || [])
        .flatMap((assistant: { tags?: string[] }) => assistant.tags || [])
        .filter((tag): tag is string => Boolean(tag))

      setAllTags(Array.from(new Set(tags)))
    } catch (err) {
      console.error("Failed to fetch deleted agent tags:", err)
    }
  }, [organizationId])

  React.useEffect(() => {
    fetchAllTags()
  }, [fetchAllTags])

  // Update API params when filters change
  React.useEffect(() => {
    updateParams({
      skip: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage,
      search: searchQuery || undefined,
      sort_by: mapDeletedSortByToApi(sortBy),
      sort_order: sortOrder,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    })
  }, [currentPage, itemsPerPage, searchQuery, sortBy, sortOrder, selectedTags, updateParams])

  // Calculate pagination values
  const totalPages = Math.ceil(total / itemsPerPage)
  const filteredDeletedAgents = deletedAgents
  const paginatedAgents = filteredDeletedAgents

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Items per page is fixed at 10, no need for handler

  // Handle search with debouncing
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1) // Reset to first page when searching
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleRestore = (agent: Agent) => {
    setSelectedAgentForAction(agent)
    setRestoreDialogOpen(true)
  }

  const confirmRestore = async () => {
    if (!selectedAgentForAction) return
    
    setIsActionLoading(true)
    try {
      // Use the original assistant_id field for API calls
      const assistantId = String(selectedAgentForAction.assistant_id)
      
      if (!assistantId || assistantId === 'undefined') {
        throw new Error('Invalid assistant ID')
      }
      
      await agentsApi.restoreAgent(assistantId)
      toast.success(`${selectedAgentForAction.name} restored successfully`)
      // Refresh both the deleted agents list and the main page counts
      await Promise.all([refetch(), refetchAll(), fetchAllTags()])
    } catch (error: any) {
      toast.error(error?.message || `Failed to restore ${selectedAgentForAction.name}`)
    } finally {
      setIsActionLoading(false)
    }
  }


  const handleView = (agent: Agent) => {
    // Navigate to agent detail page (you might want to create a read-only view)
    router.push(`/agents/${agent.id}`)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSortBy("deletedAt")
    setSortOrder("desc")
    setSelectedTags([])
    setCurrentPage(1)
  }



  React.useEffect(() => {
    const orgId = authUtils.getOrganizationId()
    setOrganizationId(orgId)
    setIsCheckingOrg(false)
  }, [])

  // Show loading state while checking organization ID
  if (isCheckingOrg) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center min-h-[400px] w-full">
            <Loader text="Loading..." />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Show no organization message if no org ID (but continue with normal flow)
  if (!organizationId && !isCheckingOrg) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex items-center justify-center min-h-screen">
          <NoOrganization />
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <>
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
                  <BreadcrumbLink href="/agents">
                    AI Agents
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Recently Deleted</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Recently Deleted Agents</h1>
                <p className="text-sm text-muted-foreground">
                  Deleted agents are automatically removed after 7 days. You can restore them to bring them back to active status.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push('/agents')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Agents
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search deleted agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <TagsFilter
                  allTags={allTags}
                  selectedTags={selectedTags}
                  onTagToggle={handleTagToggle}
                  onClearTags={() => {
                    setSelectedTags([])
                    setCurrentPage(1)
                  }}
                />
                <SortControl
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortChange={handleSortChange}
                  options={sortOptions}
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-md">
                  <Toggle
                    pressed={viewMode === "table"}
                    onPressedChange={() => setViewMode("table")}
                    size="sm"
                    className="rounded-r-none h-9 w-9"
                  >
                    <List className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    pressed={viewMode === "cards"}
                    onPressedChange={() => setViewMode("cards")}
                    size="sm"
                    className="rounded-l-none h-9 w-9"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Toggle>
                </div>
                {(searchQuery || selectedTags.length > 0 || sortBy !== "deletedAt" || sortOrder !== "desc") && (
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
            {isLoading ? (
              // Skeleton loader
              viewMode === "table" ? (
                <div className="space-y-3">
                  {Array.from({ length: itemsPerPage }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[300px]" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[80px]" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: itemsPerPage }).map((_, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-[150px]" />
                          <Skeleton className="h-3 w-[100px]" />
                        </div>
                      </div>
                      <Skeleton className="h-3 w-full" />
                      <div className="flex space-x-2">
                        <Skeleton className="h-6 w-16 rounded" />
                        <Skeleton className="h-6 w-20 rounded" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-8 w-20 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : filteredDeletedAgents.length === 0 ? (
              <Empty className="h-[400px] bg-muted/50">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Trash2 className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>No deleted agents found</EmptyTitle>
                  <EmptyDescription>
                    {searchQuery 
                      ? "Try adjusting your search criteria to find deleted agents."
                      : "Deleted agents will appear here for 7 days before being permanently removed."}
                  </EmptyDescription>
                </EmptyHeader>
                {searchQuery && (
                  <EmptyContent>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Search
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            ) : viewMode === "table" ? (
              <DeletedAgentsTable
                agents={paginatedAgents}
                onRestore={handleRestore}
                onView={handleView}
              />
            ) : (
              <DeletedAgentsCardView
                agents={paginatedAgents}
                onRestore={handleRestore}
                onView={handleView}
              />
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <EnhancedPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              showItemsPerPage={false}
              showQuickJump={true}
              showItemInfo={true}
              compact={false}
            />
          )}
        </div>

        {/* Confirmation Dialogs */}
        <ConfirmationDialog
          open={restoreDialogOpen}
          onOpenChange={setRestoreDialogOpen}
          title="Restore Agent"
          description={`Bring "${selectedAgentForAction?.name}" back to active assistants?`}
          confirmText="Confirm Restore"
          cancelText="Cancel"
          variant="default"
          onConfirm={confirmRestore}
          isLoading={isActionLoading}
          icon={<RotateCcw className="h-4 w-4" />}
        />
      </SidebarInset>
    </SidebarProvider>
    </>
  )
}
