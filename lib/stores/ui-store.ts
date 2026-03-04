import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
    // Sidebar State
    isSidebarCollapsed: boolean
    toggleSidebar: () => void
    setSidebarCollapsed: (collapsed: boolean) => void

    // Config Panel State
    activeSidebarTab: 'general' | 'datasets' | 'templates'
    setActiveSidebarTab: (tab: 'general' | 'datasets' | 'templates') => void

    // Selection State (Migrated from ChartStore)
    selectedImageId: string | null
    selectedTextId: string | null
    selectedShapeId: string | null
    setSelectedImageId: (id: string | null) => void
    setSelectedTextId: (id: string | null) => void
    setSelectedShapeId: (id: string | null) => void

    // Freehand Drawing State
    isDrawingMode: boolean
    setDrawingMode: (active: boolean) => void
    defaultDrawingColor: string
    setDefaultDrawingColor: (color: string) => void
    defaultDrawingThickness: number
    setDefaultDrawingThickness: (thickness: number) => void
    defaultDrawingStyle: 'solid' | 'dashed' | 'dotted'
    setDefaultDrawingStyle: (style: 'solid' | 'dashed' | 'dotted') => void
}

export const useUIStore = create<UIStore>()(
    persist(
        (set) => ({
            // Sidebar
            isSidebarCollapsed: false,
            toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
            setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

            // Config Panel
            activeSidebarTab: 'general',
            setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),

            // Selection
            selectedImageId: null,
            selectedTextId: null,
            selectedShapeId: null,
            setSelectedImageId: (id) => set({ selectedImageId: id }),
            setSelectedTextId: (id) => set({ selectedTextId: id }),
            setSelectedShapeId: (id) => set({ selectedShapeId: id }),

            // Freehand Drawing
            isDrawingMode: false,
            setDrawingMode: (active) => set({ isDrawingMode: active, selectedImageId: null, selectedTextId: null, selectedShapeId: null }),
            defaultDrawingColor: '#007acc',
            setDefaultDrawingColor: (color) => set({ defaultDrawingColor: color }),
            defaultDrawingThickness: 2,
            setDefaultDrawingThickness: (thickness) => set({ defaultDrawingThickness: thickness }),
            defaultDrawingStyle: 'solid',
            setDefaultDrawingStyle: (style) => set({ defaultDrawingStyle: style }),
        }),
        {
            name: 'ui-store',
            // Only persist sidebar state and tab preference, not selection
            partialize: (state) => ({
                isSidebarCollapsed: state.isSidebarCollapsed,
                activeSidebarTab: state.activeSidebarTab,
                defaultDrawingColor: state.defaultDrawingColor,
                defaultDrawingThickness: state.defaultDrawingThickness,
                defaultDrawingStyle: state.defaultDrawingStyle
            }),
        }
    )
)
