"use client"

import React from 'react'
import { UndoRedoButtons } from '@/components/ui/undo-redo-buttons'

export function UndoDemo() {
  return (
    <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
      <UndoRedoButtons variant="default" size="sm" />
    </div>
  )
}

