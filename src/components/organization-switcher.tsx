"use client"

import * as React from "react"
import { Building2 } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { User } from "@/types/auth"

export function OrganizationSwitcher() {
  const [mounted, setMounted] = React.useState(false)
  const { user: currentUser } = useAuth()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until mounted (client-side only)
  if (!mounted) {
    return null
  }

  // Show loading state only if no user data at all
  if (!currentUser) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-6 items-center justify-center rounded-lg">
              <Building2 className="size-3" />
            </div>
            <div className="grid flex-1 text-left text-xs leading-tight">
              <span className="truncate font-medium">Loading...</span>
              <span className="truncate text-xs text-muted-foreground">Please wait</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const organizationName = currentUser.organization?.name || "Organization"
  const organizationPlan = "Professional" // You can customize this based on your API

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-6 items-center justify-center rounded-lg">
            <Building2 className="size-3" />
          </div>
          <div className="grid flex-1 text-left text-xs leading-tight">
            <span className="truncate font-medium">{organizationName}</span>
            <span className="truncate text-xs text-muted-foreground">{organizationPlan}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
