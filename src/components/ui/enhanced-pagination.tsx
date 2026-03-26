"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  MoreHorizontal,
  Search,
  ArrowLeft,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EnhancedPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
  itemsPerPageOptions?: number[]
  showItemsPerPage?: boolean
  showQuickJump?: boolean
  showItemInfo?: boolean
  compact?: boolean
  className?: string
}

export function EnhancedPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 20, 50, 100],
  showItemsPerPage = true,
  showQuickJump = true,
  showItemInfo = true,
  compact = false,
  className
}: EnhancedPaginationProps) {
  const [jumpToPage, setJumpToPage] = React.useState("")
  const [showJumpInput, setShowJumpInput] = React.useState(false)

  const startIndex = (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems)

  // Generate page numbers with smart ellipsis
  const getVisiblePages = React.useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | string)[] = []
    
    if (currentPage <= 4) {
      // Show first 5 pages, then ellipsis, then last page
      pages.push(1, 2, 3, 4, 5)
      if (totalPages > 6) pages.push("...")
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 3) {
      // Show first page, ellipsis, then last 5 pages
      pages.push(1)
      if (totalPages > 6) pages.push("...")
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first page, ellipsis, current page area, ellipsis, last page
      pages.push(1, "...")
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i)
      }
      pages.push("...", totalPages)
    }

    return pages
  }, [currentPage, totalPages])

  const handleJumpToPage = () => {
    const page = parseInt(jumpToPage)
    if (page >= 1 && page <= totalPages) {
      onPageChange(page)
      setJumpToPage("")
      setShowJumpInput(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage()
    } else if (e.key === 'Escape') {
      setJumpToPage("")
      setShowJumpInput(false)
    }
  }

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      
      if (e.key === 'ArrowLeft' && currentPage > 1) {
        onPageChange(currentPage - 1)
      } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
        onPageChange(currentPage + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, totalPages, onPageChange])

  if (totalPages <= 1) {
    if (!showItemInfo) return null
    return (
      <div className={cn("flex items-center justify-center py-4", className)}>
        <div className="text-sm text-muted-foreground">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className={cn("flex items-center justify-between gap-2", className)}>
        {showItemInfo && (
          <div className="text-sm text-muted-foreground hidden sm:block">
            {startIndex}-{endIndex} of {totalItems}
          </div>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            className="h-8 w-8 p-0 hidden sm:flex"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 px-2 bg-muted/50 rounded border">
            <span className="text-sm font-medium">{currentPage}</span>
            <span className="text-sm text-muted-foreground">of {totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 p-0 hidden sm:flex"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", className)}>
      {/* Left side - Items info and per page selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        {showItemInfo && (
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{startIndex}</span> to{" "}
            <span className="font-medium text-foreground">{endIndex}</span> of{" "}
            <span className="font-medium text-foreground">{totalItems}</span> results
          </div>
        )}
        
        {showItemsPerPage && onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Show</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => onItemsPerPageChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {itemsPerPageOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>
        )}
      </div>

      {/* Right side - Pagination controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2">
        {/* Quick jump to page */}
        {showQuickJump && (
          <div className="flex items-center gap-2 order-2 sm:order-1">
            {showJumpInput ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={jumpToPage}
                  onChange={(e) => setJumpToPage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onBlur={() => {
                    if (!jumpToPage) setShowJumpInput(false)
                  }}
                  placeholder={`1-${totalPages}`}
                  className="h-8 w-16 text-center"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleJumpToPage}
                  disabled={!jumpToPage || parseInt(jumpToPage) < 1 || parseInt(jumpToPage) > totalPages}
                  className="h-8 px-2"
                >
                  Go
                </Button>
              </div>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowJumpInput(true)}
                      className="h-8 w-8 p-0 hidden sm:flex"
                    >
                      <Search className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Jump to page</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center gap-1 order-1 sm:order-2">
          {/* First page */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(1)}
                  disabled={currentPage <= 1}
                  className="h-8 w-8 p-0 hidden md:flex"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>First page</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Previous page */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Previous page (←)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Page numbers - More condensed on mobile */}
          <div className="flex items-center gap-1">
            {/* Mobile: Show only current page and adjacent pages */}
            <div className="flex items-center gap-1 sm:hidden">
              {currentPage > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  className="h-8 w-8 p-0"
                >
                  {currentPage - 1}
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                className="h-8 w-8 p-0 bg-primary text-primary-foreground"
              >
                {currentPage}
              </Button>
              {currentPage < totalPages && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  className="h-8 w-8 p-0"
                >
                  {currentPage + 1}
                </Button>
              )}
            </div>
            
            {/* Desktop: Show full page range */}
            <div className="hidden sm:flex items-center gap-1">
              {getVisiblePages.map((page, index) => (
                <React.Fragment key={index}>
                  {page === "..." ? (
                    <div className="flex items-center justify-center h-8 w-8">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ) : (
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(page as number)}
                      className={cn(
                        "h-8 w-8 p-0",
                        currentPage === page && "bg-primary text-primary-foreground"
                      )}
                    >
                      {page}
                    </Button>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Next page */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Next page (→)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Last page */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(totalPages)}
                  disabled={currentPage >= totalPages}
                  className="h-8 w-8 p-0 hidden md:flex"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Last page</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Page info badge */}
        <Badge variant="secondary" className="text-xs order-3 sm:order-3">
          {currentPage} / {totalPages}
        </Badge>
      </div>
    </div>
  )
}
