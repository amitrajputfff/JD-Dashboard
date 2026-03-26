"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Agent } from "@/types/agent"
import { 
  MoreHorizontal, 
  Copy, 
  Trash2, 
  Eye,
  Play,
  Save,
  Rocket
} from "lucide-react"
import { dateUtils } from "@/lib/utils/date-utils"
import { truncateForTable } from "@/lib/utils/text-utils"
import { getTableAvatarProps } from "@/lib/utils/avatar-utils"

interface AgentsTableProps {
  agents: Agent[]
  onDelete: (agent: Agent) => void
  onView: (agent: Agent) => void
  onClone: (agent: Agent) => void
  onTest?: (agent: Agent) => void
  onSaveDraft?: (agent: Agent) => void
  onPublish?: (agent: Agent) => void
}

export function AgentsTable({ 
  agents, 
  onDelete, 
  onView, 
  onClone,
  onTest,
  onSaveDraft,
  onPublish
}: AgentsTableProps) {

  const formatCallDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }



  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="border-b bg-muted/50">
            <TableHead className="w-[320px] px-6 py-3 text-xs font-semibold">Agent</TableHead>
            <TableHead className="px-4 py-3 text-xs font-semibold">Calls Today</TableHead>
            <TableHead className="px-4 py-3 text-xs font-semibold">Avg Duration</TableHead>
            <TableHead className="px-4 py-3 text-xs font-semibold">Last Updated</TableHead>
            <TableHead className="text-right px-6 py-3 text-xs font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <TableRow key={agent.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => onView(agent)}>
              <TableCell className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const avatarProps = getTableAvatarProps(agent.name);
                    return (
                      <Avatar className={avatarProps.className}>
                        <AvatarFallback className={`text-xs font-semibold ${avatarProps.colorClass}`}>
                          {avatarProps.initials}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-semibold text-xs truncate">
                        {agent.name}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed mb-1.5">
                      {truncateForTable(agent.description)}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {agent.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs px-1.5 py-0.5 font-normal border-border/60"
                        >
                          {tag.charAt(0).toUpperCase() + tag.slice(1)}
                        </Badge>
                      ))}
                      {agent.tags.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0.5 font-normal border-border/60 text-muted-foreground"
                        >
                          +{agent.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4 py-4 align-top">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold tabular-nums">
                    {agent.metrics.callsToday}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    calls today
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4 py-4 align-top">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium tabular-nums">
                    {formatCallDuration(agent.metrics.avgCallDuration)}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    average duration
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4 py-4 align-top">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium">
                    {dateUtils.safeFormatDistanceToNow(agent.updated_at || agent.updatedAt, { addSuffix: true })}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    last updated
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right px-6 py-4 align-top">
                <div className="flex items-center gap-2 justify-end">
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
                      onView(agent)
                    }}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {agent.status === 'active' && onTest && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onTest(agent)
                      }}>
                        <Play className="mr-2 h-4 w-4" />
                        Test Agent
                      </DropdownMenuItem>
                    )}
                    {agent.status === 'draft' && onSaveDraft && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onSaveDraft(agent)
                      }}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Draft
                      </DropdownMenuItem>
                    )}
                    {agent.status === 'draft' && onPublish && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onPublish(agent)
                      }}>
                        <Rocket className="mr-2 h-4 w-4" />
                        Publish Assistant
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      onClone(agent)
                    }}>
                      <Copy className="mr-2 h-4 w-4" />
                      Clone Agent
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(agent)
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
