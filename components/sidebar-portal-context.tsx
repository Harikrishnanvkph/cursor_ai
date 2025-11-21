"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface SidebarPortalContextType {
  sidebarContainer: HTMLElement | null
  setSidebarContainer: (container: HTMLElement | null) => void
}

export const SidebarPortalContext = createContext<SidebarPortalContextType | undefined>(undefined)

export function SidebarPortalProvider({ children }: { children: ReactNode }) {
  const [sidebarContainer, setSidebarContainer] = useState<HTMLElement | null>(null)

  return (
    <SidebarPortalContext.Provider value={{ sidebarContainer, setSidebarContainer }}>
      {children}
    </SidebarPortalContext.Provider>
  )
}

export function useSidebarPortal() {
  const context = useContext(SidebarPortalContext)
  // Return null if context not available (for non-fullscreen usage)
  if (context === undefined) {
    return { sidebarContainer: null }
  }
  return { sidebarContainer: context.sidebarContainer }
}

