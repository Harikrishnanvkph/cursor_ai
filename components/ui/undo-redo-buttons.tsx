"use client"

import React, { useEffect } from 'react'
import { Undo, Redo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/lib/chat-store'

interface UndoRedoButtonsProps {
  variant?: 'default' | 'compact' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  className?: string
}

export function UndoRedoButtons({ 
  variant = 'default', 
  size = 'sm', 
  showLabels = true,
  className = '' 
}: UndoRedoButtonsProps) {
  const { canUndo, canRedo, undo, redo } = useChatStore()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              redo() // Ctrl+Shift+Z (alternative redo)
            } else {
              undo() // Ctrl+Z
            }
            break
          case 'y':
            e.preventDefault()
            redo() // Ctrl+Y
            break
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  const getButtonVariant = () => {
    switch (variant) {
      case 'compact':
        return 'ghost'
      case 'ghost':
        return 'ghost'
      default:
        return 'outline'
    }
  }

  const getButtonSize = () => {
    switch (size) {
      case 'lg':
        return 'default'
      case 'md':
        return 'sm'
      default:
        return 'sm'
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'lg':
        return 'h-5 w-5'
      case 'md':
        return 'h-4 w-4'
      default:
        return 'h-4 w-4'
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Undo Button */}
      <Button
        variant={getButtonVariant()}
        size={getButtonSize()}
        onClick={() => undo()}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        className={`transition-all duration-200 ${
          canUndo 
            ? 'opacity-100 hover:scale-105' 
            : 'opacity-50 cursor-not-allowed'
        }`}
      >
        <Undo className={`${getIconSize()} ${showLabels ? 'mr-2' : ''}`} />
        {showLabels && <span className="hidden sm:inline">Undo</span>}
      </Button>
      
      {/* Redo Button */}
      <Button
        variant={getButtonVariant()}
        size={getButtonSize()}
        onClick={() => redo()}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        className={`transition-all duration-200 ${
          canRedo 
            ? 'opacity-100 hover:scale-105' 
            : 'opacity-50 cursor-not-allowed'
        }`}
      >
        <Redo className={`${getIconSize()} ${showLabels ? 'mr-2' : ''}`} />
        {showLabels && <span className="hidden sm:inline">Redo</span>}
      </Button>
    </div>
  )
}

