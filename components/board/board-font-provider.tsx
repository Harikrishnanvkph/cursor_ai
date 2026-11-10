"use client"

import React, { useEffect } from "react"
import { GeistSans } from "geist/font/sans"

/**
 * BoardFontProvider manages font synchronization for the Board page.
 * It applies GeistSans variables and classes to document.documentElement and document.body
 * so that all elements within the page and all portaled popups (Radix Dialog, Popover,
 * DropdownMenu, Sheet, Tooltip, Sonner Toaster) seamlessly inherit and use GeistSans.
 */
export function BoardFontProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const htmlEl = document.documentElement
    const bodyEl = document.body

    htmlEl.classList.add(GeistSans.variable)
    bodyEl.classList.add("board-page-active", GeistSans.variable, GeistSans.className)

    return () => {
      htmlEl.classList.remove(GeistSans.variable)
      bodyEl.classList.remove("board-page-active", GeistSans.variable, GeistSans.className)
    }
  }, [])

  return <>{children}</>
}
