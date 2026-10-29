"use client"

import React, { createContext, useContext, useState } from "react"

export type SidebarView = 'tools' | 'recents'

interface EditorSidebarContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
  leftSidebarCollapsed: boolean
  setLeftSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  sidebarView: SidebarView
  setSidebarView: React.Dispatch<React.SetStateAction<SidebarView>>
}

const EditorSidebarContext = createContext<EditorSidebarContextType | undefined>(undefined)

export function EditorSidebarProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("types_toggles")
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)
  const [sidebarView, setSidebarView] = useState<SidebarView>("tools")

  return (
    <EditorSidebarContext.Provider
      value={{
        activeTab,
        setActiveTab,
        leftSidebarCollapsed,
        setLeftSidebarCollapsed,
        sidebarView,
        setSidebarView,
      }}
    >
      {children}
    </EditorSidebarContext.Provider>
  )
}

export function useEditorSidebarContext() {
  const context = useContext(EditorSidebarContext)
  if (context === undefined) {
    return {
      activeTab: "types_toggles",
      setActiveTab: () => {},
      leftSidebarCollapsed: false,
      setLeftSidebarCollapsed: () => {},
      sidebarView: "tools" as SidebarView,
      setSidebarView: () => {},
    }
  }
  return context
}
