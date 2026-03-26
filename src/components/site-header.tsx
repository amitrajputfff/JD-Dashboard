"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard"
  if (pathname.startsWith("/dashboard/analytics")) return "Analytics"
  if (pathname.startsWith("/dashboard/realtime")) return "Real-time"
  if (pathname.startsWith("/agents/create")) return "Create Agent"
  if (pathname.startsWith("/agents")) return "AI Agents"
  if (pathname.startsWith("/calls")) return "Call Logs"
  if (pathname.startsWith("/phone-numbers")) return "Phone Numbers"
  if (pathname.startsWith("/providers")) return "Providers"
  if (pathname.startsWith("/recordings")) return "Recordings"
  if (pathname.startsWith("/audit-logs")) return "Audit Logs"
  if (pathname.startsWith("/account")) return "Account"
  return "JustDial"
}

export function SiteHeader() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  )
}
