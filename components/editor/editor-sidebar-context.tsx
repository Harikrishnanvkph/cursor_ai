"use client"

import React, { createContext, useContext, useState } from "react"

interface EditorSidebarContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
  leftSidebarCollapsed: boolean
  setLeftSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}

const EditorSidebarContext = createContext<EditorSidebarContextType | undefined>(undefined)

export function EditorSidebarProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("types_toggles")
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)

  return (
    <EditorSidebarContext.Provider
      value={{
        activeTab,
        setActiveTab,
        leftSidebarCollapsed,
        setLeftSidebarCollapsed,
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
    }
  }
  return context
}
