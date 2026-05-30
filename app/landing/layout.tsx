"use client"

import React, { useState, useEffect } from "react"
import { LandingSidebar } from "@/components/landing/landing-sidebar"
import { SidebarProvider, useSidebarContext } from "@/components/landing/sidebar-context"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

/**
 * Landing Layout — App Shell Architecture
 * 
 * The sidebar lives here in the layout so it:
 * 1. Renders instantly and stays interactive during page transitions
 * 2. Is NOT replaced by loading.tsx (only the {children} slot is)
 * 3. Maintains its scroll position and state across navigations
 * 
 * Tablet/mobile layouts don't use this sidebar — they have their own
 * inline navigation, so we only render it on desktop.
 */
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <LandingLayoutInner>{children}</LandingLayoutInner>
      </SidebarProvider>
    </ProtectedRoute>
  )
}

function LandingLayoutInner({ children }: { children: React.ReactNode }) {
  const { leftSidebarOpen, setLeftSidebarOpen } = useSidebarContext()
  const [isDesktop, setIsDesktop] = useState(true) // Optimistic: SSR assumes desktop for instant sidebar

  useEffect(() => {
    const width = window.innerWidth
    setIsDesktop(width > 1024)
    const handleResize = () => setIsDesktop(window.innerWidth > 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // On tablet/mobile, the page handles its own layout (inline headers, bottom bars, etc.)
  // Only desktop gets the persistent sidebar shell.
  if (!isDesktop) {
    return <>{children}</>
  }

  // Desktop: App Shell — sidebar is persistent, children swap on navigation
  return (
    <div className="flex h-screen w-screen bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/20 blur-[100px]"></div>
        <div className="absolute top-1/3 right-0 w-[350px] h-[350px] rounded-full bg-purple-500/10 dark:bg-purple-600/20 blur-[100px]"></div>
        <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full bg-cyan-400/10 dark:bg-cyan-500/15 blur-[100px]"></div>
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            backgroundImage: `linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        ></div>
      </div>

      {/* Persistent Interactive Sidebar */}
      <LandingSidebar
        leftSidebarOpen={leftSidebarOpen}
        setLeftSidebarOpen={setLeftSidebarOpen}
      />

      {/* Content Area — this is replaced by loading.tsx during page transitions */}
      <div className="flex-1 relative z-10 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
