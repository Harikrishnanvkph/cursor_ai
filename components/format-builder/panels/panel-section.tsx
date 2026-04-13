"use client"

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function PanelSection({
  title, icon, accentColor, defaultOpen = true, children
}: {
  title: string
  icon?: React.ReactNode
  accentColor?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-800/50">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
      >
        <span style={{ color: accentColor }}>{icon}</span>
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown className={`w-3 h-3 text-gray-600 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  )
}
