"use client"

import React, { useState, useEffect } from "react"
import { EditorSidebarProvider } from "@/components/editor/editor-sidebar-context"
import { EditorLeftSidebar } from "@/components/editor/editor-left-sidebar"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

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
  return (
    <ProtectedRoute>
      <EditorSidebarProvider>
        <div className="fixed inset-0 flex bg-gray-50 overflow-hidden">
          {/* Persistent Interactive Left Sidebar - Hidden on mobile/tablet (<=1024px) */}
          <div className="hidden lap1025:flex flex-shrink-0 z-50 h-full w-16 xl:w-auto">
            <EditorLeftSidebar />
          </div>

          {/* Content Area — this is replaced by loading.tsx during page transitions */}
          <div className="flex-1 flex min-w-0 overflow-hidden">
            {children}
          </div>
        </div>
      </EditorSidebarProvider>
    </ProtectedRoute>
  )
}
