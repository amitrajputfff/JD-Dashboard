"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Kbd } from "@/components/ui/kbd"
import { 
  Bot, 
  Wand2, 
  FileText, 
  Code2,
  ArrowRight,
  Sparkles,
  Clock
} from "lucide-react"
import { useRouter } from "next/navigation"
import { TemplateSelectionDialog } from "./template-selection-dialog"
import { AIAssistantCreatorDialog } from "./ai-assistant-creator-dialog"

interface CreateAgentDialogProps {
  children: React.ReactNode
}

export function CreateAgentDialog({ children }: CreateAgentDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = React.useState(false)
  const [showAIDialog, setShowAIDialog] = React.useState(false)
  const router = useRouter()

  const handleCreateWithAI = React.useCallback(() => {
    setOpen(false)
    setShowAIDialog(true)
  }, [])

  const handleCreateFromScratch = React.useCallback(() => {
    setOpen(false)
    router.push("/agents/create")
  }, [router])

  const handleUseTemplate = React.useCallback(() => {
    setOpen(false)
    setShowTemplateDialog(true)
  }, [])

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when dialog is open
      if (!open) return
      
      // Don't trigger shortcuts if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.closest('[contenteditable="true"]')
      ) {
        return
      }

      // Handle Command/Ctrl + number keys 1, 2, 3
      const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const isModifierPressed = isMac ? event.metaKey : event.ctrlKey
      
      if (isModifierPressed) {
        switch (event.key) {
          case '1':
            event.preventDefault()
            handleCreateWithAI()
            break
          case '2':
            event.preventDefault()
            handleCreateFromScratch()
            break
          case '3':
            event.preventDefault()
            handleUseTemplate()
            break
        }
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleCreateWithAI, handleCreateFromScratch, handleUseTemplate])

  const creationOptions = [
    {
      id: "ai",
      title: "Create with AI",
      description: "AI-guided setup with smart defaults",
      icon: Wand2,
      badge: "Recommended",
      estimatedTime: "3-5 min",
      shortcut: "⌘1",
      onClick: handleCreateWithAI,
    },
    {
      id: "scratch",
      title: "Start from Scratch",
      description: "Full control over configuration",
      icon: Code2,
      badge: "Advanced",
      estimatedTime: "10-15 min",
      shortcut: "⌘2",
      onClick: handleCreateFromScratch,
    },
    {
      id: "template",
      title: "Use Template",
      description: "Quick start with pre-built options",
      icon: FileText,
      badge: "Quick Start",
      estimatedTime: "2-3 min",
      shortcut: "⌘3",
      onClick: handleUseTemplate,
    }
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      <DialogContent className="!max-w-[90vw] w-full p-0 sm:!max-w-[700px] lg:!max-w-[800px]" data-tutorial="creation-dialog">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted/50 rounded-lg">
              <Bot className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Create New AI Agent</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Choose your preferred creation method
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="px-6 pb-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creationOptions.map((option) => {
              const IconComponent = option.icon
              return (
                <Card 
                  key={option.id} 
                  className="relative cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 border group h-full flex flex-col bg-card"
                  onClick={option.onClick}
                  data-tutorial={option.id === 'scratch' ? 'start-from-scratch-card' : undefined}
                >
                  <CardHeader className="pb-4 flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-lg bg-muted/50">
                        <IconComponent className="h-5 w-5 text-foreground" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-medium">
                          {option.badge}
                        </Badge>
                        <Kbd className="text-[9px] font-mono">
                          {option.shortcut}
                        </Kbd>
                      </div>
                    </div>
                    <CardTitle className="text-base font-semibold mb-2">
                      {option.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {option.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0 flex-1 flex flex-col justify-end">
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {option.estimatedTime}
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          
          <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                New to AI agents? Start with <strong>Create with AI</strong> for guided setup.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    
    <TemplateSelectionDialog 
      open={showTemplateDialog} 
      onOpenChange={setShowTemplateDialog} 
    />
    
    <AIAssistantCreatorDialog 
      open={showAIDialog} 
      onOpenChange={setShowAIDialog} 
    />
  </>
  )
}
