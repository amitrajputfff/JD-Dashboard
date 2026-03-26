"use client"

import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

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
import { truncateForCard } from "@/lib/utils/text-utils"
import { getCardAvatarProps } from "@/lib/utils/avatar-utils"

interface AgentsCardViewProps {
  agents: Agent[]
  onDelete: (agent: Agent) => void
  onView: (agent: Agent) => void
  onClone: (agent: Agent) => void
  onTest?: (agent: Agent) => void
  onSaveDraft?: (agent: Agent) => void
  onPublish?: (agent: Agent) => void
}

export function AgentsCardView({ 
  agents, 
  onDelete, 
  onView, 
  onClone,
  onTest,
  onSaveDraft,
  onPublish
}: AgentsCardViewProps) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map((agent) => (
        <Card key={agent.id} className="relative hover:shadow-lg hover:border-primary/20 transition-all duration-200 border-border/60 cursor-pointer" onClick={() => onView(agent)}>
          <CardHeader className="p-2">
            <div className="flex items-start gap-3">
              <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                {(() => {
                  const avatarProps = getCardAvatarProps(agent.name);
                  return (
                    <Avatar className={avatarProps.className}>
                      <AvatarFallback className={`text-sm font-semibold ${avatarProps.colorClass}`}>
                        {avatarProps.initials}
                      </AvatarFallback>
                    </Avatar>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base leading-tight truncate mb-1.5">
                    {agent.name}
                  </h3>
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
                  {agent.status?.toLowerCase() === 'active' && onTest && (
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
          </CardHeader>

          <CardContent className="px-6">
            {/* Last Updated */}
            <div className="pt-3 border-t border-border/50 text-xs text-muted-foreground font-medium">
              Last updated:{' '}
              <span className="text-foreground">
                {dateUtils.safeFormatDistanceToNow(agent.updated_at || agent.updatedAt, { addSuffix: true })}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
