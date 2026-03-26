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

import { Toggle } from "@/components/ui/toggle"
import { AgentsTable } from "@/components/agents/agents-table"
import { AgentsCardView } from "@/components/agents/agents-card-view"
import { TagsFilter } from "@/components/agents/tags-filter"
import { CreateAgentDialog } from "@/components/agents/create-agent-dialog"
import { TestAssistantDialog } from "@/components/test-assistant-dialog"
import { ExportDataDialog } from "@/components/export-data-dialog"

import { Agent } from "@/types/agent"
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
import { SortControl } from "@/components/ui/sort-control"
import { Loader } from "@/components/ui/loader"
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
  Plus, 
  LayoutGrid, 
  List, 
  Download,
  ArrowUpDown,
  Trash2,
  Copy,
  AlertTriangle,
  Bot
} from "lucide-react"
import { toast } from "sonner"

// Helper function to map sort options to API parameters
const mapSortByToApi = (sortBy: string): string => {
  switch (sortBy) {
    case "name":
      return "name"
    case "lastUpdated":
      return "updated_at"
    case "callsToday":
      return "calls_today"
    default:
      return "name"
  }
}

export default function AgentsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [itemsPerPage] = React.useState(10) // Fixed at 10 items per page
  const [currentPage, setCurrentPage] = React.useState(1)

  const [sortBy, setSortBy] = React.useState<string>("lastUpdated")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = React.useState<"table" | "cards">("table")
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  const [showDrafts, setShowDrafts] = React.useState<boolean>(false)
  const [showTestDialog, setShowTestDialog] = React.useState<boolean>(false)
  const [selectedAgentForTest, setSelectedAgentForTest] = React.useState<Agent | null>(null)
  const [allTags, setAllTags] = React.useState<string[]>([])
  
  // Confirmation dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [cloneDialogOpen, setCloneDialogOpen] = React.useState(false)
  const [selectedAgentForAction, setSelectedAgentForAction] = React.useState<Agent | null>(null)
  const [isActionLoading, setIsActionLoading] = React.useState(false)

  // Debounced search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState(searchQuery)
  const [isSearching, setIsSearching] = React.useState(false)

  // Check if user has organization ID (client-side only)
  const [organizationId, setOrganizationId] = React.useState<string | null>(null)
  const [isCheckingOrg, setIsCheckingOrg] = React.useState(true)

  // API integration for paginated data
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
    is_deleted: false,
    search: debouncedSearchQuery || undefined,
    sort_by: mapSortByToApi(sortBy),
    sort_order: sortOrder,
    status: showDrafts ? "Draft" : "Active",
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    enabled: !!organizationId, // Only enable when we have an organization ID
  })

  
  // API integration for counts only (no pagination needed for counts)
  const {
    counts,
    refetchAll
  } = useAgentsComprehensive({
    organization_id: organizationId || undefined,
    enabled: !!organizationId, // Only enable when we have an organization ID
    fetchDeleted: true, // Only fetch deleted count for the badge
    fetchDrafts: true, // Always fetch drafts count for the badge
    skipNormalCount: !showDrafts, // Skip normal count when main hook is fetching the same data
  })

  // Map API agents to expected format
  const agents = React.useMemo(() => {
    return apiAgents.map(mapApiAgentToAgent)
  }, [apiAgents])

  // Show error if API call fails
  React.useEffect(() => {
    if (error) {
      toast.error(`Failed to load agents: ${error}`)
    }
  }, [error])

  // Fetch all tags independently so pagination does not affect filters
  const fetchAllTags = React.useCallback(async () => {
    if (!organizationId) return

    try {
      const response = await agentsApi.getAgents({
        organization_id: organizationId,
        is_deleted: false,
        status: showDrafts ? "Draft" : "Active",
      })

      const tags = (response.assistants || [])
        .flatMap((assistant: { tags?: string[] }) => assistant.tags || [])
        .filter((tag): tag is string => Boolean(tag))

      setAllTags(Array.from(new Set(tags)))
    } catch (err) {
      console.error("Failed to fetch agent tags:", err)
    }
  }, [organizationId, showDrafts])

  React.useEffect(() => {
    fetchAllTags()
  }, [fetchAllTags])

  // Update API params when filters change
  React.useEffect(() => {
    updateParams({
      skip: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage,
      organization_id: organizationId || undefined,
      search: debouncedSearchQuery || undefined,
      sort_by: mapSortByToApi(sortBy),
      sort_order: sortOrder,
      status: showDrafts ? "Draft" : "Active",
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    })
  }, [
    currentPage,
    itemsPerPage,
    debouncedSearchQuery,
    sortBy,
    sortOrder,
    showDrafts,
    organizationId,
    selectedTags,
    updateParams
  ])

  // Calculate pagination values
  const totalPages = Math.ceil(total / itemsPerPage)

  const paginatedAgents = agents

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Items per page is fixed at 10, no need for handler

  // Handle search with debouncing
  React.useEffect(() => {
    if (searchQuery !== debouncedSearchQuery) {
      setIsSearching(true)
    }
    
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1) // Reset to first page when searching
      setIsSearching(false)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, debouncedSearchQuery])





  // Get real counts from comprehensive hook
  const draftCount = counts.drafts
  const deletedCount = counts.deleted

  const handleDelete = (agent: Agent) => {
    setSelectedAgentForAction(agent)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedAgentForAction) return
    
    setIsActionLoading(true)
    try {
      // Use the original assistant_id field for API calls
      const assistantId = String(selectedAgentForAction.assistant_id)
      
      
      if (!assistantId || assistantId === 'undefined') {
        throw new Error('Invalid assistant ID')
      }
      
      await agentsApi.deleteAgent(assistantId)
      toast.success(`${selectedAgentForAction.name} moved to recently deleted`)
      // Refresh both the main list, counts, and available tags
      await Promise.all([refetch(), refetchAll(), fetchAllTags()])
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      toast.error(error?.message || `Failed to delete ${selectedAgentForAction.name}`)
    } finally {
      setIsActionLoading(false)
    }
  }



  const handleView = (agent: Agent) => {
    // Use assistant_id for navigation to match what the detail page expects
    router.push(`/agents/${agent.assistant_id}`)
  }

  const handleClone = (agent: Agent) => {
    setSelectedAgentForAction(agent)
    setCloneDialogOpen(true)
  }

  const handleSaveDraft = (agent: Agent) => {
    // Navigate to the agent edit page for saving draft
    router.push(`/agents/${agent.id}`)
  }

  const handlePublish = (agent: Agent) => {
    // Navigate to the agent edit page for publishing
    router.push(`/agents/${agent.id}`)
  }

  const confirmClone = async () => {
    if (!selectedAgentForAction) return
    
    setIsActionLoading(true)
    try {
      // Use the original assistant_id field for API calls
      const assistantId = String(selectedAgentForAction.assistant_id)
      
      
      if (!assistantId || assistantId === 'undefined') {
        throw new Error('Invalid assistant ID')
      }
      
      await agentsApi.cloneAgent(assistantId, `${selectedAgentForAction.name} (Copy)`)
      toast.success(`${selectedAgentForAction.name} cloned successfully`)
      // Refresh both the main list, counts, and available tags
      await Promise.all([refetch(), refetchAll(), fetchAllTags()])
    } catch (error: any) {
      console.error('❌ Clone error:', error);
      toast.error(error?.message || `Failed to clone ${selectedAgentForAction.name}`)
    } finally {
      setIsActionLoading(false)
    }
  }


  const handleTest = (agent: Agent) => {
    setSelectedAgentForTest(agent)
    setShowTestDialog(true)
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedTags([])
    setSortBy("lastUpdated")
    setSortOrder("desc")
    setShowDrafts(false)
    setCurrentPage(1) // Reset to first page when clearing filters
  }

  React.useEffect(() => {
    const orgId = authUtils.getOrganizationId()
    setOrganizationId(orgId)
    setIsCheckingOrg(false)
  }, [])

  // Show loading state while checking organization ID
  const sidebarStyle = { '--sidebar-width': 'calc(var(--spacing) * 72)', '--header-height': 'calc(var(--spacing) * 12)' } as React.CSSProperties

  if (isCheckingOrg) {
    return (
      <SidebarProvider style={sidebarStyle}>
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
      <SidebarProvider style={sidebarStyle}>
        <AppSidebar />
        <SidebarInset className="flex items-center justify-center min-h-screen">
          <NoOrganization />
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <>
      <TutorialOverlay />
      <SidebarProvider style={sidebarStyle}>
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
                  <BreadcrumbPage>AI Agents</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          {/* Header with Filters */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary rounded-lg p-2">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">AI Agents</h1>
                  <p className="text-sm text-muted-foreground">
                    {showDrafts
                      ? "Draft Agents - Click to edit and configure"
                      : "Manage your intelligent voice agents"
                    }
                    {showDrafts && (
                      <span className="ml-2 px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">
                        Draft mode
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
              <ExportDataDialog defaultExportType="assistants">
                  <Button size="default" variant="outline">
                    Export Data
                  </Button>
                </ExportDataDialog>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => router.push('/agents/deleted')}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Recently Deleted
                  {deletedCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full">
                      {deletedCount}
                    </span>
                  )}
                </Button>
                <Button size="default" variant="default" data-tutorial="create-agent-button-header" onClick={() => router.push('/agents/create')}>
                  <Bot className="mr-2 h-4 w-4" />
                  Create Agent
                </Button>
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 mb-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search agents by name, description, or tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>

                  <Separator orientation="vertical" className="h-6" />

                  <TagsFilter
                    allTags={allTags}
                    selectedTags={selectedTags}
                    onTagToggle={handleTagToggle}
                    onClearTags={() => setSelectedTags([])}
                  />

                  <SortControl
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={(newSortBy, newSortOrder) => {
                      setSortBy(newSortBy)
                      setSortOrder(newSortOrder)
                    }}
                    options={[
                      { value: "name", label: "Name" },
                      { value: "lastUpdated", label: "Last Updated" },
                      { value: "callsToday", label: "Calls Today" }
                    ]}
                  />
                </div>
                <div className="flex items-center h-full gap-2">
                <Button
                    variant={showDrafts ? "default" : "outline"}
                    size="sm"
                    className="h-9"
                    onClick={() => setShowDrafts(!showDrafts)}
                  >
                    Show Drafts Only
                    {!showDrafts && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                        {draftCount}
                      </span>
                    )}
                  </Button>
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
                  {(searchQuery || selectedTags.length > 0 || showDrafts) && (
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
          </div>



          {/* Main content */}
          <div className="flex-1">
            {isLoading ? (
              // Skeleton loader
              viewMode === "table" ? (
                <div className="rounded-lg border">
                  <div className="border-b bg-muted/50 p-4">
                    <div className="grid grid-cols-5 gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                  <div className="divide-y">
                    {Array.from({ length: itemsPerPage }).map((_, index) => (
                      <div key={index} className="p-4">
                        <div className="grid grid-cols-5 gap-4 items-center">
                          <div className="flex items-center space-x-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-[140px]" />
                              <Skeleton className="h-3 w-[200px]" />
                              <div className="flex gap-1">
                                <Skeleton className="h-5 w-12 rounded" />
                                <Skeleton className="h-5 w-16 rounded" />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-8" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-3 w-14" />
                          </div>
                          <div className="flex justify-end">
                            <Skeleton className="h-8 w-8 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: Math.min(itemsPerPage, 9) }).map((_, index) => (
                    <div key={index} className="border rounded-lg border-border/60">
                      <div className="p-2">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                            <Skeleton className="h-11 w-11 rounded-full" />
                            <div className="flex-1 min-w-0 space-y-2">
                              <Skeleton className="h-4 w-[120px]" />
                              <Skeleton className="h-3 w-[180px]" />
                              <Skeleton className="h-3 w-[140px]" />
                            </div>
                          </div>
                          <Skeleton className="h-9 w-9 rounded shrink-0" />
                        </div>
                      </div>
                      <div className="px-6 pb-6">
                        <div className="pt-3 border-t border-border/50">
                          <Skeleton className="h-3 w-[100px]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : paginatedAgents.length === 0 ? (
              <Empty className="h-[400px] bg-muted/50">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Bot className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>No agents found</EmptyTitle>
                  <EmptyDescription>
                    {searchQuery || selectedTags.length > 0
                      ? "Try adjusting your search or filters to find the agents you're looking for."
                      : "Get started by creating your first AI agent to handle conversations."}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  {searchQuery || selectedTags.length > 0 ? (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  ) : (
                    <Button size="default" data-tutorial="create-agent-button" onClick={() => router.push('/agents/create')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Agent
                    </Button>
                  )}
                </EmptyContent>
              </Empty>
            ) : viewMode === "table" ? (
              <AgentsTable
                agents={paginatedAgents}
                onDelete={handleDelete}
                onView={handleView}
                onClone={handleClone}
                onTest={handleTest}
                onSaveDraft={handleSaveDraft}
                onPublish={handlePublish}
              />
            ) : (
              <AgentsCardView
                agents={paginatedAgents}
                onDelete={handleDelete}
                onView={handleView}
                onClone={handleClone}
                onTest={handleTest}
                onSaveDraft={handleSaveDraft}
                onPublish={handlePublish}
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
          {/* Test Assistant Dialog */}
          <TestAssistantDialog 
            open={showTestDialog}
            onOpenChange={setShowTestDialog}
            assistant={selectedAgentForTest ? {
              id: selectedAgentForTest.assistant_id || String(selectedAgentForTest.id),
              name: selectedAgentForTest.name,
              description: selectedAgentForTest.description || "No description available",
              status: selectedAgentForTest.status as "active" | "inactive"
            } : undefined}
          />

          {/* Delete Confirmation Dialog */}
          <ConfirmationDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title="Delete Agent"
            description={`This will move "${selectedAgentForAction?.name}" to recently deleted. You can restore it within 7 days.`}
            confirmText="Confirm Delete"
            cancelText="Cancel"
            variant="destructive"
            onConfirm={confirmDelete}
            isLoading={isActionLoading}
            icon={<Trash2 className="h-4 w-4" />}
          />

          {/* Clone Confirmation Dialog */}
          <ConfirmationDialog
            open={cloneDialogOpen}
            onOpenChange={setCloneDialogOpen}
            title="Clone Agent"
            description={`Create a copy of "${selectedAgentForAction?.name}" with the same configuration?`}
            confirmText="Confirm Clone"
            cancelText="Cancel"
            variant="default"
            onConfirm={confirmClone}
            isLoading={isActionLoading}
            icon={<Copy className="h-4 w-4" />}
          />
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
