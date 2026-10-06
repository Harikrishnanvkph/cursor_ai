import { create } from 'zustand'

interface LoupeState {
  isLoupeActive: boolean
  zoomLevel: number // Magnification multiplier, default 2.5x
  toggleLoupe: () => void
  setLoupeActive: (active: boolean) => void
  setZoomLevel: (level: number) => void
}

export const useLoupeStore = create<LoupeState>((set) => ({
  isLoupeActive: false,
  zoomLevel: 2.5,
  toggleLoupe: () => set((state) => ({ isLoupeActive: !state.isLoupeActive })),
  setLoupeActive: (active: boolean) => set({ isLoupeActive: active }),
  setZoomLevel: (level: number) => set({ zoomLevel: level }),
}))
