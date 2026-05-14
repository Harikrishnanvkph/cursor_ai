"use client"

import React, { createContext, useContext, useRef, useState } from "react"

interface SidebarContextType {
  leftSidebarOpen: boolean
  setLeftSidebarOpen: (open: boolean) => void
  /** Shared chat input draft — written by PromptTemplate, read by LandingSidebar */
  chatInput: string
  setChatInput: (value: string) => void
  /** Ref to the sidebar textarea so external code can focus it */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

const SidebarContext = createContext<SidebarContextType>({
  leftSidebarOpen: true,
  setLeftSidebarOpen: () => {},
  chatInput: "",
  setChatInput: () => {},
  textareaRef: { current: null },
})

export function useSidebarContext() {
  return useContext(SidebarContext)
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [chatInput, setChatInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  return (
    <SidebarContext.Provider value={{ leftSidebarOpen, setLeftSidebarOpen, chatInput, setChatInput, textareaRef }}>
      {children}
    </SidebarContext.Provider>
  )
}
