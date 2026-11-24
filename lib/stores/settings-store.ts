import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type EditorInterface = 'default' | 'modern'

interface SettingsState {
  showModeChangeNotification: boolean
  setShowModeChangeNotification: (val: boolean) => void
  editorInterface: EditorInterface
  setEditorInterface: (val: EditorInterface) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      showModeChangeNotification: true,
      setShowModeChangeNotification: (val) => set({ showModeChangeNotification: val }),
      editorInterface: 'default',
      setEditorInterface: (val) => set({ editorInterface: val }),
    }),
    {
      name: 'chartography-settings',
    }
  )
)
