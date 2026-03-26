"use client"

import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Agent } from "@/types/agent"
import { 
  MoreHorizontal, 
  RotateCcw, 
  Eye,
  Clock
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { truncateForCard } from "@/lib/utils/text-utils"
import { getDeletedAvatarProps } from "@/lib/utils/avatar-utils"

interface DeletedAgentsCardViewProps {
  agents: Agent[]
  onRestore: (agent: Agent) => void
  onView: (agent: Agent) => void
}

export function DeletedAgentsCardView({ 
  agents, 
  onRestore, 
  onView
}: DeletedAgentsCardViewProps) {



  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map((agent) => (
        <Card key={agent.id} className="relative hover:shadow-lg hover:border-orange-300/20 transition-all duration-200 border-orange-200/60 cursor-pointer" onClick={() => onView(agent)}>
          <CardHeader className="p-2">
            <div className="flex items-start gap-3">
              <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                {(() => {
                  const avatarProps = getDeletedAvatarProps(agent.name, 'md');
                  return (
                    <Avatar className={avatarProps.className}>
                      <AvatarFallback className={`text-sm font-semibold ${avatarProps.colorClass}`}>
                        {avatarProps.initials}
                      </AvatarFallback>
                    </Avatar>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-semibold text-base leading-tight truncate">
                      {agent.name}
                    </h3>
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400">
                      Deleted
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {truncateForCard(agent.description)}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-muted/50 transition-colors shrink-0" onClick={(e) => e.stopPropagation()}>
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
            </div>
          </CardHeader>

          <CardContent className="px-6">
            {/* Deleted Time */}
            <div className="pt-3 border-t border-orange-200/50 text-xs text-muted-foreground font-medium">
              Removal on:{' '}
              <span className="text-foreground">
                {agent.deletedAt ? new Date(agent.deletedAt).toLocaleDateString() : 'Unknown'}
              </span>
              {agent.deletedAt && (
                <span className="text-muted-foreground ml-1">
                  at {new Date(agent.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
