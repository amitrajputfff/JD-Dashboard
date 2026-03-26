"use client"

import * as React from "react"
import { Building2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface NoOrganizationProps {
  title?: string
  message?: string
  showRetry?: boolean
  onRetry?: () => void
  className?: string
}

export function NoOrganization({
  title = "No Organization Mapped",
  message = "Your account is not associated with any organization. Please contact your administrator to get access to an organization.",
  showRetry = true,
  onRetry,
  className
}: NoOrganizationProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      // Refresh the page to retry
      window.location.reload()
    }
  }

  return (
    <div className={className}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <Building2 className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-center">{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>This usually happens when your account hasn't been assigned to an organization yet.</span>
          </div>
          
          {showRetry && (
            <div className="flex justify-center">
              <Button onClick={handleRetry} variant="outline">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
