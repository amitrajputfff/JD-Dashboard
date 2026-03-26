"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SortOption {
  value: string
  label: string
}

interface SortControlProps {
  sortBy: string
  sortOrder: "asc" | "desc"
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void
  options: SortOption[]
  className?: string
}

export function SortControl({
  sortBy,
  sortOrder,
  onSortChange,
  options,
  className
}: SortControlProps) {
  const currentOption = options.find(option => option.value === sortBy) || options[0]

  const handleSortByChange = (newSortBy: string) => {
    onSortChange(newSortBy, sortOrder)
  }

  const handleSortOrderToggle = () => {
    onSortChange(sortBy, sortOrder === "asc" ? "desc" : "asc")
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 gap-2 bg-background border-border hover:bg-accent"
          >
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{currentOption.label}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSortByChange(option.value)}
              className={cn(
                "cursor-pointer",
                option.value === sortBy && "bg-accent"
              )}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleSortOrderToggle}
        className="h-9 w-9 p-0"
        title={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
      >
        {sortOrder === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
