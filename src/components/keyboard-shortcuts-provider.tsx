"use client"

import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  // This hook will handle all keyboard shortcuts
  useKeyboardShortcuts()
  
  return <>{children}</>
}
