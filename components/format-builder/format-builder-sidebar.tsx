"use client"

import React, { useState } from 'react'
import { PlusSquare, Sparkles } from 'lucide-react'
import { DimensionsPanel } from './panels/dimensions-panel'
import { MetadataPanel } from './panels/metadata-panel'
import { AddZonePanel } from './panels/add-zone-panel'
import { ZoneListPanel } from './panels/zone-list-panel'
import { PalettePanel } from './panels/palette-panel'
import { CanvasToolsPanel } from './panels/canvas-tools-panel'
import { DecorationsPanel } from './panels/decorations-panel'
import { AiInstructionsPanel } from './panels/ai-instructions-panel'

export function FormatBuilderSidebar() {
  const [activeTab, setActiveTab] = useState<'zones' | 'ai'>('zones')

  return (
    <div className="w-[300px] h-full border-l border-gray-800 bg-gray-900/50 flex flex-col overflow-hidden shrink-0">
      {/* Tab Switcher */}
      <div className="flex border-b border-gray-800 bg-gray-950 p-2 gap-1.5 shrink-0 select-none">
        <button
          onClick={() => setActiveTab('zones')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-center text-xs font-semibold rounded-md border transition-all ${
            activeTab === 'zones'
              ? 'bg-gray-800 text-orange-400 border-gray-700/80 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 bg-transparent border-transparent hover:bg-gray-800/20'
          }`}
        >
          <PlusSquare className="w-3.5 h-3.5 shrink-0" />
          <span>Add Zones</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-center text-xs font-semibold rounded-md border transition-all ${
            activeTab === 'ai'
              ? 'bg-gray-800 text-orange-400 border-gray-700/80 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 bg-transparent border-transparent hover:bg-gray-800/20'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Instruct Zone</span>
        </button>
      </div>

      {/* Sidebar Content */}
      <div className={`flex-1 min-h-0 ${activeTab === 'zones' ? 'overflow-y-auto' : 'overflow-hidden flex flex-col'}`}>
        {activeTab === 'zones' ? (
          <>
            <DimensionsPanel />
            <MetadataPanel />
            <AddZonePanel />
            {/* Decorations — separate visual layer */}
            <DecorationsPanel />
            <ZoneListPanel />
            <CanvasToolsPanel />
            <PalettePanel />
          </>
        ) : (
          <AiInstructionsPanel />
        )}
      </div>
    </div>
  )
}

