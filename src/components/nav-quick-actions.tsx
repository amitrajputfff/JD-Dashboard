"use client"

import * as React from "react"
import { type LucideIcon } from "lucide-react"
import { ChevronRight } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import { useDialog } from "@/contexts/dialog-context"

export interface QuickAction {
  name: string
  url: string
  icon: LucideIcon
  actions: {
    title: string
    description: string
    action: string
    shortcut?: string
  }[]
}

export function NavQuickActions({
  quickActions,
}: {
  quickActions: QuickAction[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { openAddPhoneNumberDialog, openUploadFilesDialog } = useDialog()

  const handleAction = (action: string, url: string) => {
    // Show appropriate toast message
    const actionMessages: Record<string, string> = {
      "create-agent": "Opening agent creator...",
      "view-agents": "Opening agents page...",
      "add-number": "Opening add phone number dialog...",
      "manage-numbers": "Opening phone numbers...",
      "upload-files": "Opening upload files dialog...",
      "manage-files": "Opening knowledge base...",
    }

    const alreadyOnPageMessages: Record<string, string> = {
      "create-agent": "Already on agent creator page",
      "view-agents": "Already on agents page",
      "manage-numbers": "Already on phone numbers page",
      "manage-files": "Already on knowledge base page",
    }

    switch (action) {
      case "create-agent":
        if (pathname === "/agents/create") {
          toast.info(alreadyOnPageMessages[action])
          return
        }
        router.push("/agents/create")
        toast.success(actionMessages[action])
        break
      case "view-agents":
        if (pathname === "/agents") {
          toast.info(alreadyOnPageMessages[action])
          return
        }
        router.push("/agents")
        toast.success(actionMessages[action])
        break
      case "add-number":
        openAddPhoneNumberDialog()
        toast.success(actionMessages[action])
        break
      case "manage-numbers":
        if (pathname === "/phone-numbers") {
          toast.info(alreadyOnPageMessages[action])
          return
        }
        router.push("/phone-numbers")
        toast.success(actionMessages[action])
        break
      case "upload-files":
        openUploadFilesDialog()
        toast.success(actionMessages[action])
        break
      case "manage-files":
        if (pathname === "/knowledge") {
          toast.info(alreadyOnPageMessages[action])
          return
        }
        router.push("/knowledge")
        toast.success(actionMessages[action])
        break
      default:
        router.push(url)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
      <SidebarMenu>
        {quickActions.map((item) => (
          <SidebarMenuItem key={item.name}>
            <Popover>
              <PopoverTrigger asChild>
                <SidebarMenuButton 
                  tooltip={item.name}
                  className="group/menu-button data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                  <ChevronRight className="ml-auto h-3 w-3 transition-transform duration-200 group-data-[state=open]/menu-button:rotate-90" />
                </SidebarMenuButton>
              </PopoverTrigger>
              <PopoverContent 
                side="right" 
                align="start" 
                className="w-56 p-1.5"
                sideOffset={8}
              >
                <div className="space-y-0.5">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {item.name}
                  </div>
                  {item.actions.map((action) => (
                    <Button
                      key={action.action}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-auto p-2 flex-col items-start hover:bg-accent"
                      onClick={() => handleAction(action.action, item.url)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="font-medium text-xs">{action.title}</div>
                        {action.shortcut && (
                          <Kbd>{action.shortcut}</Kbd>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                        {action.description}
                      </div>
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
