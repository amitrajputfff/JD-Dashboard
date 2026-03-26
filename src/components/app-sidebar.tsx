"use client"

import * as React from "react"
import {
  BarChart3Icon,
  BotIcon,
  PhoneIcon,
  HeadphonesIcon,
  SettingsIcon,
  ShieldIcon,
  ActivityIcon,
  MicIcon,
  Building2Icon,
} from "lucide-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { useAuth } from "@/hooks/use-auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <BarChart3Icon />,
    },
    {
      title: "AI Agents",
      url: "/agents",
      icon: <BotIcon />,
    },
    {
      title: "Call Logs",
      url: "/calls",
      icon: <PhoneIcon />,
    },
    {
      title: "Phone Numbers",
      url: "/phone-numbers",
      icon: <HeadphonesIcon />,
    },
    {
      title: "Providers",
      url: "/providers",
      icon: <SettingsIcon />,
    },
  ],
  navQuickLinks: [
    {
      name: "Recordings",
      url: "/recordings",
      icon: <MicIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Audit Logs",
      url: "/audit-logs",
      icon: <ShieldIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const orgName = user?.organization?.name ?? "JustDial"

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/dashboard">
                <Building2Icon className="size-5!" />
                <span className="text-base font-semibold">{orgName}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.navQuickLinks} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
