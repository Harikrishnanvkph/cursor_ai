"use client"

import React from "react"

/**
 * AiChatFontProvider provides font synchronization for the AI Chat page.
 * GeistSans is provided globally at RootLayout and inherited through standard CSS cascade.
 */
export function AiChatFontProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
