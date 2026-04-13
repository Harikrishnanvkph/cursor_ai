"use client"

import React from 'react'
import { FormatBuilderProvider } from './format-builder-context'
import { FormatBuilderToolbar } from './format-builder-toolbar'
import { FormatBuilderCanvas } from './format-builder-canvas'
import { FormatBuilderSidebar } from './format-builder-sidebar'
import type { FormatBuilderProps } from './format-builder-types'

/**
 * Format Builder — Admin tool for creating and editing format skeletons.
 *
 * This is a skeleton builder, not a content editor. Admin defines:
 * - Canvas dimensions (size, aspect ratio)
 * - Zone layout (position, size of text/chart/stat/decoration/background zones)
 * - Zone styling (fonts, colors, alignment for when content is placed)
 * - AI Messages (instructions for content generation per zone)
 * - Color palette (applied to data visualization at render time)
 *
 * Architecture:
 *  index.tsx (this file) — Thin orchestrator
 *  format-builder-context.tsx — State management via React Context
 *  format-builder-toolbar.tsx — Top bar (zoom, grid, save)
 *  format-builder-canvas.tsx — Visual canvas with DraggableResizable zones
 *  format-builder-sidebar.tsx — Right panel with panels/
 *  panels/ — Individual sidebar sections
 *  zone-styles/ — Per-zone-type style controls
 *  format-builder-utils.ts — Constants, factories, helpers
 *  format-builder-types.ts — Builder-specific types
 */
export function FormatBuilder({ adminMode = false, editFormat = null }: FormatBuilderProps) {
  return (
    <FormatBuilderProvider editFormat={editFormat}>
      <div className="flex h-full bg-gray-950 text-gray-100">
        {/* Canvas area (toolbar + canvas) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <FormatBuilderToolbar />
          <FormatBuilderCanvas />
        </div>
        {/* Right sidebar */}
        <FormatBuilderSidebar />
      </div>
    </FormatBuilderProvider>
  )
}

export default FormatBuilder
