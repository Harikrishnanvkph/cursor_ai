import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ShapeType } from '@/lib/types/overlay'

interface UIStore {
    // Sidebar State
    isSidebarCollapsed: boolean
    toggleSidebar: () => void
    setSidebarCollapsed: (collapsed: boolean) => void

    // Config Panel State
    activeSidebarTab: 'general' | 'datasets' | 'templates'
    setActiveSidebarTab: (tab: 'general' | 'datasets' | 'templates') => void

    // Grouped Mode Settings Filter
    // These track which group/dataset the user is targeting in Design, Labels, Advanced tabs
    settingsGroupId: string | null   // null = use activeGroupId from chart store
    settingsDatasetId: string | null // null or 'all' = apply to all datasets in the group
    setSettingsGroupId: (id: string | null) => void
    setSettingsDatasetId: (id: string | null) => void

    // Selection State (Migrated from ChartStore)
    selectedImageId: string | null
    selectedTextId: string | null
    selectedShapeId: string | null
    setSelectedImageId: (id: string | null) => void
    setSelectedTextId: (id: string | null) => void
    setSelectedShapeId: (id: string | null) => void
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

            // Grouped Mode Settings Filter
            settingsGroupId: null,
            settingsDatasetId: null,
            setSettingsGroupId: (id) => set({ settingsGroupId: id, settingsDatasetId: null }),
            setSettingsDatasetId: (id) => set({ settingsDatasetId: id }),

            // Selection
            selectedImageId: null,
            selectedTextId: null,
            selectedShapeId: null,
            setSelectedImageId: (id) => set({ selectedImageId: id }),
            setSelectedTextId: (id) => set({ selectedTextId: id }),
            setSelectedShapeId: (id) => set({ selectedShapeId: id }),
        }),
        {
            name: 'ui-store',
            // Only persist sidebar state and tab preference, not selection
            partialize: (state) => ({
                isSidebarCollapsed: state.isSidebarCollapsed,
                activeSidebarTab: state.activeSidebarTab,
            }),
        }
    )
)
