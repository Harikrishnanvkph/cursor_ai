"use client"

import React from "react"

/**
 * LandingFontProvider provides font synchronization for the Landing page.
 * GeistSans is provided globally at RootLayout and inherited through standard CSS cascade.
 */
export function LandingFontProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
