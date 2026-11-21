"use client"

import React, { createContext, useContext, useMemo, useRef, useState } from "react"

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

const SidebarInputDispatchContext = createContext<(value: string) => void>(() => {})

export function useSidebarContext() {
  return useContext(SidebarContext)
}

export function useSidebarInputContext() {
  return useContext(SidebarInputContext)
}

export function useSidebarInputDispatch() {
  return useContext(SidebarInputDispatchContext)
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [chatInput, setChatInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const sidebarValue = useMemo(
    () => ({ leftSidebarOpen, setLeftSidebarOpen, textareaRef }),
    [leftSidebarOpen]
  )

  const inputValue = useMemo(
    () => ({ chatInput, setChatInput }),
    [chatInput]
  )

  return (
    <SidebarContext.Provider value={sidebarValue}>
      <SidebarInputDispatchContext.Provider value={setChatInput}>
        <SidebarInputContext.Provider value={inputValue}>
          {children}
        </SidebarInputContext.Provider>
      </SidebarInputDispatchContext.Provider>
    </SidebarContext.Provider>
  )
}
