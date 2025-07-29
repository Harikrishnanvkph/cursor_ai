"use client"

import React, { useEffect, useRef } from 'react'
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

  // Calculate intelligent positioning
  const calculatePosition = () => {
    const menuWidth = 140
    const menuHeight = 120
    const padding = 20
    const offset = 10 // Distance from click point
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    let finalX = x
    let finalY = y
    
    // Try to position below and to the right of the click point first
    let preferredX = x + offset
    let preferredY = y + offset
    
    // Check if preferred position works
    if (preferredX + menuWidth <= viewportWidth - padding && preferredY + menuHeight <= viewportHeight - padding) {
      // Position below and to the right
      finalX = preferredX
      finalY = preferredY
    } else if (x - menuWidth - offset >= padding && y + menuHeight <= viewportHeight - padding) {
      // Position below and to the left
      finalX = x - menuWidth - offset
      finalY = y + offset
    } else if (y - menuHeight - offset >= padding) {
      // Position above
      finalX = x + offset
      finalY = y - menuHeight - offset
    } else if (y + menuHeight + offset <= viewportHeight - padding) {
      // Position below
      finalX = x + offset
      finalY = y + offset
    } else {
      // Fallback: center on screen
      finalX = Math.max(padding, Math.min(viewportWidth - menuWidth - padding, x - menuWidth / 2))
      finalY = Math.max(padding, Math.min(viewportHeight - menuHeight - padding, y - menuHeight / 2))
    }
    
    return { x: finalX, y: finalY }
  }
  
  const position = calculatePosition()

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]"
      style={{
        left: position.x,
        top: position.y,
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
} 