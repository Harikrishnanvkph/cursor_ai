"use client"

import React, { createContext, useContext, useRef, useState } from "react"

interface SidebarContextType {
  leftSidebarOpen: boolean
  setLeftSidebarOpen: (open: boolean) => void
  /** Ref to the sidebar textarea so external code can focus it */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

interface SidebarInputContextType {
  /** Shared chat input draft — written by PromptTemplate, read by LandingSidebar */
  chatInput: string
  setChatInput: (value: string) => void
}

const SidebarContext = createContext<SidebarContextType>({
  leftSidebarOpen: true,
  setLeftSidebarOpen: () => {},
  textareaRef: { current: null },
})

const SidebarInputContext = createContext<SidebarInputContextType>({
  chatInput: "",
  setChatInput: () => {},
})

export function useSidebarContext() {
  return useContext(SidebarContext)
}

export function useSidebarInputContext() {
  return useContext(SidebarInputContext)
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [chatInput, setChatInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  return (
    <SidebarContext.Provider value={{ leftSidebarOpen, setLeftSidebarOpen, textareaRef }}>
      <SidebarInputContext.Provider value={{ chatInput, setChatInput }}>
        {children}
      </SidebarInputContext.Provider>
    </SidebarContext.Provider>
  )
}
