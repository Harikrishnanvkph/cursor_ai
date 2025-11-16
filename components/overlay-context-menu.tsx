"use client"

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Trash2, Eye, EyeOff, X } from 'lucide-react'

interface OverlayContextMenuProps {
  isOpen: boolean
  x: number
  y: number
  type: 'image' | 'text'
  id: string
  data: any
  onClose: () => void
  onDelete: (id: string) => void
  onHide: (id: string) => void
  onUnselect: () => void
}

export function OverlayContextMenu({
  isOpen,
  x,
  y,
  type,
  id,
  data,
  onClose,
  onDelete,
  onHide,
  onUnselect
}: OverlayContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Use coordinates directly - they should be event.clientX/clientY (viewport coordinates)
  // Fixed positioning works with viewport coordinates
  const menuWidth = 140
  const menuHeight = 120
  const offset = 5 // Very small offset from click point
  
  // Simple positioning - just offset from click point
  let finalX = x + offset
  let finalY = y + offset
  
  // Only adjust if it would go off-screen
  if (finalX + menuWidth > window.innerWidth) {
    finalX = x - menuWidth - offset
  }
  if (finalY + menuHeight > window.innerHeight) {
    finalY = y - menuHeight - offset
  }
  
  // Ensure it stays on screen
  finalX = Math.max(5, Math.min(finalX, window.innerWidth - menuWidth - 5))
  finalY = Math.max(5, Math.min(finalY, window.innerHeight - menuHeight - 5))

  const menuContent = (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]"
      style={{
        left: `${finalX}px`,
        top: `${finalY}px`,
      }}
    >
      <div className="py-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start px-3 py-2 h-auto text-sm text-gray-700 hover:bg-gray-100"
          onClick={() => {
            onUnselect()
            onClose()
          }}
        >
          <X className="h-4 w-4 mr-2" />
          Unselect
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start px-3 py-2 h-auto text-sm text-gray-700 hover:bg-gray-100"
          onClick={() => {
            onHide(id)
            onClose()
          }}
        >
          {data.visible !== false ? (
            <EyeOff className="h-4 w-4 mr-2" />
          ) : (
            <Eye className="h-4 w-4 mr-2" />
          )}
          {data.visible !== false ? 'Hide' : 'Show'}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start px-3 py-2 h-auto text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => {
            onDelete(id)
            onClose()
          }}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  )

  // Render using portal to document body to avoid transform issues
  if (typeof window !== 'undefined') {
    return createPortal(menuContent, document.body)
  }
  
  return null
} 