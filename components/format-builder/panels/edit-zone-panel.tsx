"use client"

import React from 'react'
import { Sliders, Sparkles, Check, ChevronRight } from 'lucide-react'
import { useFormatBuilder } from '../format-builder-context'
import { getZoneLabel } from '../format-builder-utils'
import { ZonePropertiesContent } from './zone-properties-panel'
import type { BaseZone } from '@/lib/format-types'

export function EditZonePanel({ onNavigateToInstruct }: { onNavigateToInstruct?: () => void }) {
  const {
    skeleton,
    selectedZoneId,
    setSelectedZoneId,
    selectedZone,
    updateZone,
  } = useFormatBuilder()

  const zones = skeleton.zones
  const zone = selectedZone
  const baseZone = zone as BaseZone | null

  // Default mode is 'static' for all zones unless explicitly set to 'ai'
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
    <div className="flex flex-col h-full overflow-hidden bg-gray-900/30">
      {/* Top Header: Select Zone Dropdown */}
      <div className="p-3 border-b border-gray-800 bg-gray-950/60 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-orange-400" />
            <span>Edit Zone</span>
          </div>
          {baseZone && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider shadow-sm select-none border ${
              mode === 'static'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
            }`}>
              <Check className="w-2.5 h-2.5 shrink-0" />
              <span>{mode === 'static' ? 'Static Active' : 'AI Active'}</span>
            </div>
          )}
        </div>

        {/* Zone Selector Dropdown */}
        {zones.length > 0 ? (
          <select
            value={selectedZoneId || ''}
            onChange={(e) => setSelectedZoneId(e.target.value || null)}
            className="w-full h-8 text-xs bg-gray-950 border border-gray-800 rounded-md px-2.5 text-gray-200 focus:outline-none focus:border-orange-500/40 cursor-pointer font-medium"
          >
            <option value="" disabled>Select a zone to edit...</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {getZoneLabel(z).toUpperCase()} ({z.type})
              </option>
            ))}
          </select>
        ) : (
          <p className="text-[11px] text-gray-500">No zones created yet. Go to &apos;Add Zones&apos; tab to add one.</p>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3">
        {baseZone ? (
          mode === 'static' ? (
            /* ──── STATIC / PRESET ACTIVE MODE ──── */
            <div className="space-y-4">
              {/* Header switch banner to AI mode */}
              <div className="p-3 rounded-lg border border-gray-800 bg-[#0e0e1a]/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Content Source: Static / Preset
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Static controls are currently active. Adjust properties and styling below.
                </p>
                <button
                  onClick={handleSelectAiMode}
                  className="w-full py-1.5 px-3 bg-gray-800 hover:bg-orange-500/20 hover:text-orange-300 text-gray-300 text-[10px] font-bold rounded-md uppercase tracking-wider transition-all border border-gray-700 hover:border-orange-500/40 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span>Select AI Generated to Instruct</span>
                  <ChevronRight className="w-3 h-3 opacity-60 ml-auto" />
                </button>
              </div>

              {/* Full Zone Properties & Styles Controls */}
              <div className="p-3 rounded-lg border border-gray-800 bg-gray-950/20">
                <ZonePropertiesContent showContentControls={true} />
              </div>
            </div>
          ) : (
            /* ──── AI GENERATED ACTIVE MODE (DETACHED / DISABLED STATIC CONTROLS) ──── */
            <div className="p-5 rounded-xl border border-gray-800 bg-[#0c0c14]/90 text-center space-y-4 shadow-xl backdrop-blur-sm mt-2">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto text-orange-400 border border-orange-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">AI Generated Active</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed max-w-[220px] mx-auto">
                  This zone is set to generate content using AI. Static preset settings are detached while AI mode is active.
                </p>
              </div>
              <button
                onClick={handleSelectStaticMode}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 shrink-0" />
                <span>Select Static to Edit</span>
              </button>
            </div>
          )
        ) : (
          <div className="p-6 text-center text-gray-600 flex flex-col items-center justify-center h-full space-y-2">
            <Sliders className="w-8 h-8 text-gray-700" />
            <p className="text-xs text-gray-500">
              Select a zone above or on the canvas<br />to edit its properties.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
