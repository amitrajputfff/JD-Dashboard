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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Agent } from "@/types/agent"
import { 
  MoreHorizontal, 
  RotateCcw, 
  Eye,
  Clock
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { truncateForTable } from "@/lib/utils/text-utils"
import { getDeletedAvatarProps } from "@/lib/utils/avatar-utils"

interface DeletedAgentsTableProps {
  agents: Agent[]
  onRestore: (agent: Agent) => void
  onView: (agent: Agent) => void
}

export function DeletedAgentsTable({ 
  agents, 
  onRestore, 
  onView
}: DeletedAgentsTableProps) {

  const formatCallDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }



  return (
    <div className="rounded-lg border border-orange-200">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
            <TableHead className="w-[320px] px-6 py-3 text-xs font-semibold">Agent</TableHead>
            <TableHead className="px-4 py-3 text-xs font-semibold">Calls Today</TableHead>
            <TableHead className="px-4 py-3 text-xs font-semibold">Avg Duration</TableHead>
            <TableHead className="px-4 py-3 text-xs font-semibold">Removal Date</TableHead>
            <TableHead className="text-right px-6 py-3 text-xs font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <TableRow key={agent.id} className="border-b border-orange-200/50 hover:bg-orange-50/30 dark:hover:bg-orange-950/10 transition-colors cursor-pointer" onClick={() => onView(agent)}>
              <TableCell className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const avatarProps = getDeletedAvatarProps(agent.name, 'sm');
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
                      <div className="font-semibold text-xs truncate">{agent.name}</div>
                      <Badge variant="outline" className="text-xs border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400">
                        Deleted
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed mb-1.5">
                      {truncateForTable(agent.description)}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {agent.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs px-1.5 py-0.5 font-normal border-orange-200/60"
                        >
                          {tag.charAt(0).toUpperCase() + tag.slice(1)}
                        </Badge>
                      ))}
                      {agent.tags.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0.5 font-normal border-orange-200/60 text-muted-foreground"
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
                    {agent.deletedAt ? new Date(agent.deletedAt).toLocaleDateString() : 'Unknown'}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {agent.deletedAt ? new Date(agent.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
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
                      onView(agent)
                    }}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      onRestore(agent)
                    }}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restore Agent
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
