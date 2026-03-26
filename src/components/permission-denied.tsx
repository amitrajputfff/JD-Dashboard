"use client"

import { Shield, ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface PermissionDeniedProps {
  title?: string
  message?: string
  requiredPermissions?: string[]
  requiredRoles?: string[]
  showBackButton?: boolean
  showHomeButton?: boolean
}

// Map permission codes to user-friendly names
const PERMISSION_DISPLAY_NAMES: Record<string, string> = {
  // System permissions
  "system.admin": "System Administration",
  "system.audit": "View Audit Logs",
  
  // Organization permissions
  "organization.create": "Create Organization",
  "organization.read": "View Organization",
  "organization.update": "Update Organization",
  "organization.delete": "Delete Organization",
  
  // User permissions
  "user.create": "Create User",
  "user.read": "View User",
  "user.update": "Update User",
  "user.delete": "Delete User",
  
  // Assistant permissions
  "assistant.create": "Create Assistant",
  "assistant.read": "View Assistant",
  "assistant.update": "Update Assistant",
  "assistant.delete": "Delete Agent",
  "assistant.deploy": "Deploy Assistant",
  "assistant.test": "Test Assistant",
  
  // Call permissions
  "call.read": "View Calls",
  "call.export": "Export Calls",
  "call.analytics": "View Call Analytics",
  
  // Phone permissions
  "phone.create": "Create Phone Number",
  "phone.read": "View Phone Number",
  "phone.update": "Update Phone Number",
  "phone.delete": "Delete Phone Number",
  
  // Prompt permissions
  "prompt.create": "Create Prompt",
  "prompt.read": "View Prompt",
  "prompt.update": "Update Prompt",
  "prompt.delete": "Delete Prompt",
}

// Map role codes to user-friendly names
const ROLE_DISPLAY_NAMES: Record<string, string> = {
  "super_admin": "Super Administrator",
  "org_admin": "Organization Administrator",
  "assistant_manager": "Assistant Manager",
  "call_analyst": "Call Analyst",
  "support_agent": "Support Agent",
}

// Helper function to get display name for permission
const getPermissionDisplayName = (permission: string): string => {
  return PERMISSION_DISPLAY_NAMES[permission] || permission
}

// Helper function to get display name for role
const getRoleDisplayName = (role: string): string => {
  return ROLE_DISPLAY_NAMES[role] || role
}

export function PermissionDenied({
  title = "Oops! Access Denied 🚫",
  message = "Looks like you're trying to sneak into the VIP area! Are you a hacker or just really curious? 🕵️‍♂️",
  requiredPermissions = [],
  requiredRoles = [],
  showBackButton = true,
  showHomeButton = true
}: PermissionDeniedProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription className="text-base mt-1">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show required permissions if provided */}
          {requiredPermissions.length > 0 && (
            <div className="rounded-lg bg-muted p-3">
              <h4 className="text-xs font-semibold mb-2 text-foreground">Nice try! But you need one of these superpowers first:</h4>
              <ul className="space-y-1.5">
                {requiredPermissions.map((permission) => (
                  <li key={permission} className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2 flex-shrink-0" />
                    <span className="text-xs font-medium text-foreground">
                      {getPermissionDisplayName(permission)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Show required roles if provided */}
          {requiredRoles.length > 0 && (
            <div className="rounded-lg bg-muted p-3">
              <h4 className="text-xs font-semibold mb-2 text-foreground">Or maybe you need to level up to one of these fancy titles:</h4>
              <ul className="space-y-1.5">
                {requiredRoles.map((role) => (
                  <li key={role} className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2 flex-shrink-0" />
                    <span className="text-xs font-medium text-foreground">
                      {getRoleDisplayName(role)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col space-y-2 pt-1">
            {showHomeButton && (
              <Button 
                onClick={() => router.push('/dashboard')}
                className="w-full h-9"
                size="sm"
              >
                <Home className="mr-2 h-3.5 w-3.5" />
                Take me back to safety! 🏠
              </Button>
            )}
            {showBackButton && (
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="w-full h-9"
                size="sm"
              >
                <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                Retreat! Retreat! 🏃‍♂️
              </Button>
            )}
          </div>

          {/* Contact support */}
          <div className="text-center text-xs text-muted-foreground pt-3 border-t">
            Stuck? Beg your admin for mercy or cry to our{" "}
            <span
              onClick={() => {
                const subject = "Help! I'm Locked Out! 🔒";
                const body = `Dear Support Heroes,

I tried to access a page but got rejected like a bad pickup line! 😅

Can you please grant me the magical permissions I need?

Thanks for saving me from this digital embarrassment!

Best regards,
Your Helpless User`;
                
                // Open Gmail in browser with pre-filled email
                const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=admin@justdial.com&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.open(gmailUrl, '_blank');
              }}
              className="text-xs underline text-primary hover:text-primary/80 cursor-pointer font-medium"
            >
              support heroes
            </span>{" "}
            🦸‍♀️
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Full page component for use in page routes
export function PermissionDeniedPage(props: PermissionDeniedProps) {
  return <PermissionDenied {...props} />
}
