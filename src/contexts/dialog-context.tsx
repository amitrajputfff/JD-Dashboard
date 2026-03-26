"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

interface DialogContextType {
  // Phone Number Dialog
  isAddPhoneNumberDialogOpen: boolean
  openAddPhoneNumberDialog: () => void
  closeAddPhoneNumberDialog: () => void
  
  // Knowledge Base Upload Dialog
  isUploadFilesDialogOpen: boolean
  openUploadFilesDialog: () => void
  closeUploadFilesDialog: () => void
  
  // Agent Creation Dialog (if needed)
  isCreateAgentDialogOpen: boolean
  openCreateAgentDialog: () => void
  closeCreateAgentDialog: () => void
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [isAddPhoneNumberDialogOpen, setIsAddPhoneNumberDialogOpen] = useState(false)
  const [isUploadFilesDialogOpen, setIsUploadFilesDialogOpen] = useState(false)
  const [isCreateAgentDialogOpen, setIsCreateAgentDialogOpen] = useState(false)

  const openAddPhoneNumberDialog = useCallback(() => {
    setIsAddPhoneNumberDialogOpen(true)
  }, [])

  const closeAddPhoneNumberDialog = useCallback(() => {
    setIsAddPhoneNumberDialogOpen(false)
  }, [])

  const openUploadFilesDialog = useCallback(() => {
    setIsUploadFilesDialogOpen(true)
  }, [])

  const closeUploadFilesDialog = useCallback(() => {
    setIsUploadFilesDialogOpen(false)
  }, [])

  const openCreateAgentDialog = useCallback(() => {
    setIsCreateAgentDialogOpen(true)
  }, [])

  const closeCreateAgentDialog = useCallback(() => {
    setIsCreateAgentDialogOpen(false)
  }, [])

  const value: DialogContextType = {
    isAddPhoneNumberDialogOpen,
    openAddPhoneNumberDialog,
    closeAddPhoneNumberDialog,
    isUploadFilesDialogOpen,
    openUploadFilesDialog,
    closeUploadFilesDialog,
    isCreateAgentDialogOpen,
    openCreateAgentDialog,
    closeCreateAgentDialog,
  }

  return (
    <DialogContext.Provider value={value}>
      {children}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider')
  }
  return context
}
