"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

import { X, Filter, Search } from "lucide-react"

interface TagsFilterProps {
  allTags: string[]
  selectedTags: string[]
  onTagToggle: (tag: string) => void
  onClearTags: () => void
}

export function TagsFilter({ 
  allTags = [], 
  selectedTags, 
  onTagToggle, 
  onClearTags 
}: TagsFilterProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredTags = React.useMemo(() => {
    if (!allTags || allTags.length === 0) return []
    if (!searchQuery) return allTags
    return allTags.filter(tag => 
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [allTags, searchQuery])

  const handleTagToggle = (tag: string) => {
    onTagToggle(tag)
  }

  const handleClearAll = () => {
    onClearTags()
    setOpen(false)
  }

  // Don't render if no tags are available
  if (!allTags || allTags.length === 0) {
    return null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="default">
          <Filter className="mr-2 h-4 w-4" />
          Tags
          {selectedTags.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs px-1.5">
              {selectedTags.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm">Filter by Tags</h4>
            {selectedTags.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearAll}
                className="h-7 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="p-3 border-b bg-muted/30">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Selected ({selectedTags.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedTags.map(tag => (
                <Badge
                  key={tag}
                  variant="default"
                  className="text-xs px-2 py-1 cursor-pointer hover:bg-primary/80"
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Available Tags */}
        <div className="p-3 max-h-64 overflow-y-auto">
          {filteredTags.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              {searchQuery ? "No tags found" : "No tags available"}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Available Tags
              </div>
              {filteredTags.map(tag => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag}`}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => handleTagToggle(tag)}
                  />
                  <label
                    htmlFor={`tag-${tag}`}
                    className="text-sm leading-none cursor-pointer flex-1 hover:text-foreground"
                  >
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </label>
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    {/* Count could be added here */}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
