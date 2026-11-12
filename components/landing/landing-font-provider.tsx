"use client"

import React, { useEffect } from "react"
import { GeistSans } from "geist/font/sans"

/**
 * LandingFontProvider manages font synchronization for the Landing page.
 * It applies GeistSans variables and classes to document.documentElement and document.body
 * so that all elements within the page and all portaled popups (Radix Dialog, Popover,
 * DropdownMenu, Sheet, Tooltip, Sonner Toaster, custom modal overlays, etc.)
 * seamlessly inherit and use GeistSans.
 */
export function LandingFontProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const htmlEl = document.documentElement
    const bodyEl = document.body

    htmlEl.classList.add(GeistSans.variable)
    bodyEl.classList.add("landing-page-active", GeistSans.variable, GeistSans.className)

    return () => {
      htmlEl.classList.remove(GeistSans.variable)
      bodyEl.classList.remove("landing-page-active", GeistSans.variable, GeistSans.className)
    }
  }, [])

  return <>{children}</>
}
