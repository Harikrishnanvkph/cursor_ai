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

    // Grouped Mode Settings Filter
    // These track which group/dataset the user is targeting in Design, Labels, Advanced tabs
    settingsGroupId: string | null   // null = use activeGroupId from chart store
    settingsDatasetId: string | null // null or 'all' = apply to all datasets in the group
    setSettingsGroupId: (id: string | null) => void
    setSettingsDatasetId: (id: string | null) => void

    // Single Mode Slice Filter
    // Tracks which slice the user is targeting in the Labels/Styling panel
    settingsSliceIndex: number | null // null = "All Slices"
    setSettingsSliceIndex: (index: number | null) => void

    // Canvas pan-area background (NOT chart background — purely a preview area preference)
    canvasBgType: 'color' | 'transparent'
    canvasBgColor: string
    setCanvasBg: (type: 'color' | 'transparent', color?: string) => void

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

            // Slice Filter
            settingsSliceIndex: null,
            setSettingsSliceIndex: (index) => set({ settingsSliceIndex: index }),

            // Canvas pan-area background
            canvasBgType: 'color',
            canvasBgColor: '#ffffff', // default white
            setCanvasBg: (type, color) => set((state) => ({
                canvasBgType: type,
                canvasBgColor: type === 'color' ? (color ?? state.canvasBgColor) : state.canvasBgColor,
            })),


        }),
        {
            name: 'ui-store',
            // Only persist sidebar state and tab preference, not selection
            partialize: (state) => ({
                isSidebarCollapsed: state.isSidebarCollapsed,
                activeSidebarTab: state.activeSidebarTab,
                canvasBgType: state.canvasBgType,
                canvasBgColor: state.canvasBgColor,
            }),
        }
    )
)
