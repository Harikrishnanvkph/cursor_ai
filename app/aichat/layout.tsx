"use client"

import React, { useState, useEffect } from "react"
import { AiChatSidebar } from "@/components/aichat/aichat-sidebar"
import { SidebarProvider, useSidebarContext } from "@/components/aichat/sidebar-context"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { GeistSans } from "geist/font/sans"
import { AiChatFontProvider } from "@/components/aichat/aichat-font-provider"
import { useSettingsStore } from "@/lib/stores/settings-store"

/**
 * AI Chat Layout — App Shell Architecture
 * 
 * The sidebar lives here in the layout so it:
 * 1. Renders instantly and stays interactive during page transitions
 * 2. Is NOT replaced by loading.tsx (only the {children} slot is)
 * 3. Maintains its scroll position and state across navigations
 * 
 * Tablet/mobile layouts don't use this sidebar — they have their own
 * inline navigation, so we only render it on desktop.
 */
export default function AiChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AiChatFontProvider>
        <SidebarProvider>
          <AiChatLayoutInner>{children}</AiChatLayoutInner>
        </SidebarProvider>
      </AiChatFontProvider>
    </ProtectedRoute>
  )
}

function AiChatLayoutInner({ children }: { children: React.ReactNode }) {
  const { leftSidebarOpen, setLeftSidebarOpen } = useSidebarContext()
  const editorInterface = useSettingsStore(s => s.editorInterface)
  const [mounted, setMounted] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia("(min-width: 1024px)").matches
    }
    return false
  })

  useEffect(() => {
    setMounted(true)
    const mediaQuery = window.matchMedia("(min-width: 1024px)")
    const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    
    setIsDesktop(mediaQuery.matches)
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const isDefaultInterface = !mounted || editorInterface === "default"

  // Single consistent outer wrapper keeps {children} at a fixed tree position
  // across viewport resizes and Default <-> Modern interface switches.
  return (
    <div className={`aichat-page-container ${GeistSans.variable} ${GeistSans.className} font-sans flex h-screen w-screen bg-white dark:bg-slate-950 relative overflow-hidden`}>
      {/* Crisp Grid Background (Default interface only) */}
      {isDefaultInterface && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(148, 163, 184, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.045) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          ></div>
        </div>
      )}

      {/* Persistent Interactive Sidebar (Default desktop interface only) */}
      {mounted && isDesktop && editorInterface === "default" && (
        <AiChatSidebar
          leftSidebarOpen={leftSidebarOpen}
          setLeftSidebarOpen={setLeftSidebarOpen}
        />
      )}

      {/* Content Area — this is replaced by loading.tsx during page transitions */}
      <div className="flex-1 relative z-10 flex flex-col overflow-hidden min-w-0">
        {children}
      </div>
    </div>
  )
}
