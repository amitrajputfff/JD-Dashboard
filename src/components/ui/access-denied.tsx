"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldX, RefreshCw, ArrowLeft } from "lucide-react"

interface AccessDeniedProps {
  title?: string
  message?: string
  showRetry?: boolean
  showGoBack?: boolean
  onRetry?: () => void
  onGoBack?: () => void
  className?: string
}

export function AccessDenied({
  title = "Access Denied",
  message = "You don't have permission to access this resource. Please contact your administrator if you believe this is an error.",
  showRetry = true,
  showGoBack = true,
  onRetry,
  onGoBack,
  className
}: AccessDeniedProps) {
  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack()
    } else {
      window.history.back()
    }
  }

  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-center">{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <ShieldX className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-medium text-destructive">Insufficient Permissions</h4>
                <p className="text-sm text-destructive/80 mt-1">
                  This action requires elevated permissions that your account doesn't currently have.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {showRetry && (
              <Button 
                variant="outline" 
                onClick={onRetry}
                className="flex-1"
                disabled={!onRetry}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            {showGoBack && (
              <Button 
                variant="default" 
                onClick={handleGoBack}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Inline variant for use within existing layouts
export function AccessDeniedInline({
  title = "Access Denied",
  message = "You don't have permission to access this resource.",
  showRetry = true,
  onRetry,
  className
}: Pick<AccessDeniedProps, 'title' | 'message' | 'showRetry' | 'onRetry' | 'className'>) {
  return (
    <div className={`rounded-lg border border-destructive/20 bg-destructive/10 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <ShieldX className="h-5 w-5 text-destructive mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-destructive">{title}</h4>
          <p className="text-sm text-destructive/80 mt-1">
            {message}
          </p>
          {showRetry && onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="mt-3"
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
