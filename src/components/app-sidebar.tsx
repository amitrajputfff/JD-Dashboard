"use client"

import * as React from "react"
import {
  BarChart3,
  Bot,
  Phone,
  Headphones,
  Shield,
  Settings,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { OrganizationSwitcher } from "@/components/organization-switcher"
import { TemplateSelectionDialog } from "@/components/agents/template-selection-dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart3,
      items: [
        { title: "Overview", url: "/dashboard" },
        { title: "Analytics", url: "/dashboard/analytics" },
        { title: "Real-time", url: "/dashboard/realtime" },
      ],
    },
    {
      title: "AI Agents",
      url: "/agents",
      icon: Bot,
      items: [
        { title: "All Agents", url: "/agents" },
        { title: "Create Agent", url: "/agents/create" },
        {
          title: "Templates",
          url: "/agents/templates",
          action: "open-template-dialog",
        },
      ],
    },
    {
      title: "Call Logs",
      url: "/calls",
      icon: Phone,
      items: [
        { title: "All Calls", url: "/calls" },
        { title: "Recordings", url: "/recordings" },
      ],
    },
    {
      title: "Phone Numbers",
      url: "/phone-numbers",
      icon: Headphones,
      items: [
        { title: "All Numbers", url: "/phone-numbers" },
        { title: "Add Number", url: "/phone-numbers/add" },
      ],
    },
    {
      title: "Providers",
      url: "/providers",
      icon: Settings,
      items: [
        { title: "STT Providers", url: "/providers/stt" },
        { title: "TTS Providers", url: "/providers/tts" },
        { title: "LLM Providers", url: "/providers/llm" },
        { title: "Telephony Providers", url: "/providers/telephony" },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Audit Logs",
      url: "/audit-logs",
      icon: Shield,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = React.useState(false)

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <OrganizationSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} onTemplateDialogOpen={() => setIsTemplateDialogOpen(true)} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <TemplateSelectionDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
      />
    </Sidebar>
  )
}
