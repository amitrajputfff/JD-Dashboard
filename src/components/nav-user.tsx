"use client"

import * as React from "react"
import {
  ChevronsUpDown,
  LogOut,
  Sparkles,
  CheckCircle,
  CreditCard,
  Bell,
} from "lucide-react"
import { User } from "@/types/auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"

export function NavUser() {
  const [mounted, setMounted] = React.useState(false)
  const { isMobile } = useSidebar()
  const { user: currentUser, logout } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const onLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      // Force redirect even if logout fails
      router.push('/login')
    }
  }

  // Don't render anything until mounted (client-side only)
  if (!mounted) {
    return null
  }

  // If no user data at all, show loading state
  if (!currentUser) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">...</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-xs leading-tight">
              <span className="truncate font-semibold">Loading...</span>
              <span className="truncate text-xs">Please wait</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Get user initials for fallback avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {getInitials(currentUser.name || currentUser.email)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-semibold">{currentUser.name || 'User'}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {currentUser.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-3" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-xs">
                <Avatar className="h-6 w-6 rounded-lg">
                  <AvatarFallback className="rounded-lg text-xs">
                    {getInitials(currentUser.name || currentUser.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="truncate font-semibold">{currentUser.name || 'User'}</span>
                  {currentUser.organization && (
                    <span className="truncate text-xs text-muted-foreground">
                      {currentUser.organization.name}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-xs">
              <Sparkles className="mr-2 h-3 w-3" />
              Upgrade to Pro
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer text-xs"
              onClick={() => router.push('/account')}
            >
              <CheckCircle className="mr-2 h-3 w-3" />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-xs">
              <CreditCard className="mr-2 h-3 w-3" />
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-xs">
              <Bell className="mr-2 h-3 w-3" />
              Notifications
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-xs">
              <LogOut className="mr-2 h-3 w-3" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
