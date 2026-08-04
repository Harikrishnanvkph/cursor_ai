"use client"

import React, { useState } from 'react'
import { Sliders, Sparkles, ChevronDown } from 'lucide-react'
import { useFormatBuilder } from '../format-builder-context'
import { getZoneLabel } from '../format-builder-utils'
import { ZonePropertiesContent } from './zone-properties-panel'
import type { BaseZone } from '@/lib/format-types'

export function EditZoneSectionPanel({
  onNavigateToInstruct,
}: {
  onNavigateToInstruct?: () => void
}) {
  const {
    skeleton,
    selectedZoneId,
    setSelectedZoneId,
    selectedZone,
    updateZone,
  } = useFormatBuilder()

  // INDEPENDENT OPEN STATE — DEFAULTS TO OPEN (TRUE) UNLESS CLOSED BY USER
  const [isOpen, setIsOpen] = useState<boolean>(true)

  const zones = skeleton.zones
  const zone = selectedZone
  const baseZone = zone as BaseZone | null

  // Default mode is 'static' unless explicitly set to 'ai'
  const mode = baseZone
    ? ((baseZone as any).contentMode || (baseZone.message && baseZone.message.trim().length > 0 ? 'ai' : 'static'))
    : 'static'

  const handleSelectAiMode = () => {
    if (!baseZone) return
    updateZone(baseZone.id, { contentMode: 'ai' } as any)
    if (onNavigateToInstruct) {
      onNavigateToInstruct()
    }
  }

  const handleSelectStaticMode = () => {
    if (!baseZone) return
    updateZone(baseZone.id, { contentMode: 'static', message: '' } as any)
  }

  return (
    <div className="border-b border-gray-800/50">
      {/* Accordion Header — Independent toggle */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
      >
        <Sliders className="w-3.5 h-3.5 text-orange-400 shrink-0" />
        <span className="flex-1 text-left">Edit Zone</span>
        {baseZone && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
            mode === 'static' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
          }`}>
            {mode === 'static' ? 'Static' : 'AI'}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 text-gray-600 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="px-3 pb-3 space-y-3">
          {/* Zone Selector Dropdown */}
          {zones.length > 0 ? (
            <div>
              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Select Zone to Edit
              </label>
              <select
                value={selectedZoneId || ''}
                onChange={(e) => setSelectedZoneId(e.target.value || null)}
                className="w-full h-7 text-[11px] bg-gray-950 border border-gray-800 rounded px-2 text-gray-200 focus:outline-none focus:border-orange-500/40 cursor-pointer font-medium"
              >
                <option value="" disabled>Select a zone...</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {getZoneLabel(z).toUpperCase()} ({z.type})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-[10px] text-gray-500 py-1">No zones created yet.</p>
          )}

          {/* Zone Properties & Controls */}
          {baseZone ? (
            mode === 'static' ? (
              /* ──── STATIC / PRESET ACTIVE MODE ──── */
              <div className="pt-1">
                <ZonePropertiesContent showContentControls={true} />
              </div>
            ) : (
              /* ──── AI GENERATED ACTIVE MODE (DETACHED STATIC CONTROLS) ──── */
              <div className="p-4 rounded-lg border border-gray-800 bg-[#0c0c14]/90 text-center space-y-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto text-orange-400 border border-orange-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-gray-200 uppercase tracking-wider">AI Generated Active</h4>
                  <p className="text-[10px] text-gray-400 leading-snug">
                    This zone is set to generate content using AI. Static preset settings are detached while AI mode is active.
                  </p>
                </div>
                <button
                  onClick={handleSelectStaticMode}
                  className="w-full py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-[10px] font-bold rounded uppercase tracking-wider transition-all shadow-sm shadow-orange-500/10 flex items-center justify-center gap-1"
                >
                  <Sliders className="w-3 h-3 shrink-0" />
                  <span>Select Static to Edit</span>
                </button>
              </div>
            )
          ) : (
            <p className="text-[10px] text-gray-500 text-center py-3">
              Select a zone above or inside Zones &amp; Decorations to edit properties.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
