"use client"

import React, { useEffect, useCallback } from 'react'
import { useStore } from 'zustand'
import { Undo, Redo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useChartStore } from '@/lib/chart-store'

interface UndoRedoButtonsProps {
  variant?: 'default' | 'compact' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  className?: string
  buttonClassName?: string
}



export function UndoRedoButtons({
  variant = 'default',
  size = 'sm',
  showLabels = true,
  className = '',
  buttonClassName = ''
}: UndoRedoButtonsProps) {
  const { undo: temporalUndo, redo: temporalRedo, pastStates, futureStates } = useStore(useChartStore.temporal)
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  const handleUndo = useCallback(() => {
    temporalUndo()
  }, [temporalUndo])

  const handleRedo = useCallback(() => {
    temporalRedo()
  }, [temporalRedo])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              handleRedo()
            } else {
              handleUndo()
            }
            break
          case 'y':
            e.preventDefault()
            handleRedo()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

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
    <div className={cn("flex items-center gap-0.5", className)}>
      {/* Undo Button */}
      <Button
        variant={getButtonVariant()}
        size={getButtonSize()}
        onClick={handleUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        className={cn(
          "transition-all duration-200",
          buttonClassName,
          canUndo ? "opacity-100 hover:scale-105" : "opacity-50 cursor-not-allowed"
        )}
      >
        <Undo className={cn(getIconSize(), showLabels ? "mr-2" : "")} />
        {showLabels && <span className="hidden sm:inline">Undo</span>}
      </Button>

      {/* Redo Button */}
      <Button
        variant={getButtonVariant()}
        size={getButtonSize()}
        onClick={handleRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        className={cn(
          "transition-all duration-200",
          buttonClassName,
          canRedo ? "opacity-100 hover:scale-105" : "opacity-50 cursor-not-allowed"
        )}
      >
        <Redo className={cn(getIconSize(), showLabels ? "mr-2" : "")} />
        {showLabels && <span className="hidden sm:inline">Redo</span>}
      </Button>
    </div>
  )
}
