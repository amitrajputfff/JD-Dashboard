"use client"

import React from 'react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { SupportedFileType } from '@/lib/api/knowledge-base'

interface FileFormatsHoverProps {
  fileTypes: SupportedFileType[]
  isLoading?: boolean
  maxFileSize?: string
  maxFileCount?: number
  className?: string
}

export function FileFormatsHover({ 
  fileTypes, 
  isLoading = false, 
  maxFileSize = "50MB",
  maxFileCount,
  className = ""
}: FileFormatsHoverProps) {
  // Helper function to get common file type names
  const getCommonTypeNames = () => {
    const commonTypes = fileTypes.filter(type => 
      type.mime_type.includes('pdf') || 
      type.mime_type.includes('word') || 
      type.mime_type.includes('text/plain') ||
      type.mime_type.includes('csv')
    )
    
    if (commonTypes.length === 0) return ['PDF', 'DOC', 'DOCX', 'TXT']
    
    const names = commonTypes.map(type => {
      if (type.mime_type.includes('pdf')) return 'PDF'
      if (type.mime_type.includes('word')) return 'Word'
      if (type.mime_type.includes('text/plain')) return 'TXT'
      if (type.mime_type.includes('csv')) return 'CSV'
      return type.description
    })
    
    return names
  }

  // Get all file type names for the hover card
  const getAllTypeNames = () => {
    return fileTypes.map(type => {
      // Extract extension from mime type or use description
      if (type.mime_type.includes('pdf')) return 'PDF'
      if (type.mime_type.includes('word')) return 'Word'
      if (type.mime_type.includes('text/plain')) return 'TXT'
      if (type.mime_type.includes('csv')) return 'CSV'
      if (type.mime_type.includes('json')) return 'JSON'
      if (type.mime_type.includes('markdown')) return 'Markdown'
      if (type.mime_type.includes('html')) return 'HTML'
      if (type.mime_type.includes('xml')) return 'XML'
      if (type.mime_type.includes('excel') || type.mime_type.includes('spreadsheet')) return 'Excel'
      if (type.mime_type.includes('powerpoint') || type.mime_type.includes('presentation')) return 'PowerPoint'
      if (type.mime_type.includes('rtf')) return 'RTF'
      if (type.mime_type.includes('odt')) return 'OpenDocument Text'
      if (type.mime_type.includes('ods')) return 'OpenDocument Spreadsheet'
      if (type.mime_type.includes('odp')) return 'OpenDocument Presentation'
      
      // Fallback to description or extension
      return type.description || type.extensions[0]?.toUpperCase().replace('.', '') || 'Unknown'
    })
  }

  const commonTypes = getCommonTypeNames()
  const allTypes = getAllTypeNames()
  const remainingCount = allTypes.length - commonTypes.length

  if (isLoading) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        Supported formats: Loading...
      </div>
    )
  }

  if (remainingCount <= 0) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        Supported formats: {commonTypes.join(', ')}
      </div>
    )
  }

  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      Supported formats: {commonTypes.join(', ')}{' '}
      <HoverCard>
        <HoverCardTrigger asChild>
          <span className="text-blue-600 hover:text-blue-800 cursor-pointer underline">
            +{remainingCount} more
          </span>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">All Supported File Formats</h4>
            <div className="grid grid-cols-2 gap-2">
              {allTypes.map((type, index) => (
                <div key={index} className="text-xs bg-gray-50 px-2 py-1 rounded">
                  {type}
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
              <div>Maximum file size: {maxFileSize} per file</div>
              {maxFileCount && (
                <div>Maximum files: {maxFileCount} files at once</div>
              )}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}
