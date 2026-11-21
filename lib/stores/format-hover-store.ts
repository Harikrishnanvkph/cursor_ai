"use client"

import { create } from 'zustand'

interface FormatHoverState {
  hoveredZoneId: string | null
  setHoveredZoneId: (id: string | null) => void
}

/**
 * Ephemeral non-persisted hover state for format zones.
 * Kept isolated from useFormatGalleryStore so hovering over zones never wakes
 * unrelated format-gallery subscribers or storage persistence middleware.
 */
export const useFormatHoverStore = create<FormatHoverState>((set) => ({
  hoveredZoneId: null,
  setHoveredZoneId: (id) => set({ hoveredZoneId: id }),
}))
