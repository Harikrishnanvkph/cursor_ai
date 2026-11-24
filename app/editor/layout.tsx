"use client"

import React, { useState, useEffect } from "react"
import { EditorSidebarProvider } from "@/components/editor/editor-sidebar-context"
import { EditorLeftSidebar } from "@/components/editor/editor-left-sidebar"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { useSettingsStore } from "@/lib/stores/settings-store"
import { usePathname } from "next/navigation"

/**
 * Editor Layout — App Shell Architecture
 * 
 * The left sidebar lives here in the layout so it:
 * 1. Renders instantly and stays interactive during page transitions/reloads
 * 2. Is NOT replaced by loading.tsx (only the {children} slot is)
 * 3. Maintains its state across navigations
 * 
 * Tablet/mobile layouts have their own inline navigation, 
 * so we only render the persistent layout on desktop.
 */
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const editorInterface = useSettingsStore(s => s.editorInterface)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isFullScreenPage = pathname === "/editor/custom-format" || pathname === "/editor/custom-template"

  if (isFullScreenPage) {
    return (
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <EditorSidebarProvider>
        <div className="fixed inset-0 flex bg-white overflow-hidden">
          {/* Persistent Interactive Left Sidebar (Default interface only) - Hidden on mobile/tablet (<1024px) */}
          {mounted && editorInterface === "default" && (
            <div className="hidden lg:flex flex-shrink-0 z-50 h-full w-auto">
              <EditorLeftSidebar />
            </div>
          )}

          {/* Content Area — remains at stable tree position across interface switches */}
          <div className="flex-1 flex min-w-0 overflow-hidden">
            {children}
          </div>
        </div>
      </EditorSidebarProvider>
    </ProtectedRoute>
  )
}
