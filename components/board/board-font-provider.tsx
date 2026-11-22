"use client"

import React from "react"

/**
 * BoardFontProvider provides font synchronization for the Board page.
 * GeistSans is provided globally at RootLayout and inherited through standard CSS cascade.
 */
export function BoardFontProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
