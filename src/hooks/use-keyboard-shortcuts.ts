"use client"

import { useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { useDialog } from '@/contexts/dialog-context'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  action: () => void
  description: string
}

const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

export function useKeyboardShortcuts() {
  const router = useRouter()
  const pathname = usePathname()
  const { openAddPhoneNumberDialog } = useDialog()

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'a',
      metaKey: isMac,
      ctrlKey: !isMac,
      action: () => {
        if (pathname === '/agents/create') {
          toast.info('Already on agent creator page')
          return
        }
        router.push('/agents/create')
        toast.success('Opening agent creator...')
      },
      description: `Create new agent (${isMac ? 'Cmd' : 'Ctrl'}+A)`
    },
    {
      key: 'A',
      metaKey: isMac,
      ctrlKey: !isMac,
      shiftKey: true,
      action: () => {
        if (pathname === '/agents') {
          toast.info('Already on agents page')
          return
        }
        router.push('/agents')
        toast.success('Opening agents page...')
      },
      description: `View all agents (${isMac ? 'Cmd' : 'Ctrl'}+Shift+A)`
    },
    {
      key: 'p',
      metaKey: isMac,
      ctrlKey: !isMac,
      action: () => {
        openAddPhoneNumberDialog()
        toast.success('Opening add phone number dialog...')
      },
      description: `Add phone number (${isMac ? 'Cmd' : 'Ctrl'}+P)`
    },
    {
      key: 'P',
      metaKey: isMac,
      ctrlKey: !isMac,
      shiftKey: true,
      action: () => {
        if (pathname === '/phone-numbers') {
          toast.info('Already on phone numbers page')
          return
        }
        router.push('/phone-numbers')
        toast.success('Opening phone numbers...')
      },
      description: `Manage phone numbers (${isMac ? 'Cmd' : 'Ctrl'}+Shift+P)`
    },
  ]

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.closest('[contenteditable="true"]')
    ) {
      return
    }

    for (const shortcut of shortcuts) {
      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase()
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey
      const metaMatches = !!shortcut.metaKey === event.metaKey
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey

      if (keyMatches && ctrlMatches && metaMatches && shiftMatches) {
        event.preventDefault()
        shortcut.action()
        break
      }
    }
  }, [shortcuts, pathname])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return shortcuts
}
