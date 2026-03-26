"use client"

import * as React from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  onTemplateDialogOpen,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
      action?: string
    }[]
  }[]
  onTemplateDialogOpen?: () => void
}) {
  const pathname = usePathname()
  
  // Determine which item should be open based on current pathname
  const getActiveItem = React.useMemo(() => {
    return items.find((item) => {
      // Check if current pathname matches the main item URL
      if (pathname === item.url) return true
      
      // Check if current pathname matches any sub-item URL
      if (item.items) {
        return item.items.some(subItem => pathname === subItem.url)
      }
      
      return false
    })?.title ?? null
  }, [items, pathname])

  const [openItem, setOpenItem] = React.useState<string | null>(getActiveItem)

  // Update open item when pathname changes
  React.useEffect(() => {
    if (getActiveItem && getActiveItem !== openItem) {
      setOpenItem(getActiveItem)
    }
  }, [getActiveItem, openItem])

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            open={openItem === item.title}
            onOpenChange={(open) => setOpenItem(open ? item.title : null)}
          >
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction 
                      className="data-[state=open]:rotate-90"
                      onClick={(e) => {
                        e.preventDefault()
                        setOpenItem(openItem === item.title ? null : item.title)
                      }}
                    >
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton 
                            asChild={!subItem.action}
                            onClick={subItem.action === 'open-template-dialog' ? (e) => {
                              e.preventDefault()
                              onTemplateDialogOpen?.()
                            } : undefined}
                          >
                            {subItem.action === 'open-template-dialog' ? (
                              <button>
                                <span>{subItem.title}</span>
                              </button>
                            ) : (
                              <a href={subItem.url}>
                                <span>{subItem.title}</span>
                              </a>
                            )}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
