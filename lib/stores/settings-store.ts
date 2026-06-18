import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  showModeChangeNotification: boolean
  setShowModeChangeNotification: (val: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      showModeChangeNotification: true,
      setShowModeChangeNotification: (val) => set({ showModeChangeNotification: val }),
    }),
    {
      name: 'chartography-settings',
    }
  )
)
