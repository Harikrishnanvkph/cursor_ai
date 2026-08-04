"use client"

import React, { useState } from 'react'
import { PlusSquare, Sparkles } from 'lucide-react'
import { DimensionsPanel } from './panels/dimensions-panel'
import { AddZonePanel } from './panels/add-zone-panel'
import { ZoneListPanel } from './panels/zone-list-panel'
import { PalettePanel } from './panels/palette-panel'
import { CanvasToolsPanel } from './panels/canvas-tools-panel'
import { DecorationsPanel } from './panels/decorations-panel'
import { AiInstructionsPanel } from './panels/ai-instructions-panel'
import { EditZoneSectionPanel } from './panels/edit-zone-section-panel'

export function FormatBuilderSidebar() {
  const [activeTab, setActiveTab] = useState<'zones' | 'ai'>('zones')
  const [openSection, setOpenSection] = useState<string | null>('add-zone')

  const handleToggleSection = (section: string) => {
    setOpenSection(prev => prev === section ? null : section)
  }

  const handleSwitchToAi = () => {
    setActiveTab('ai')
  }

  return (
    <div className="w-[310px] h-full border-l border-gray-800 bg-gray-900/50 flex flex-col overflow-hidden shrink-0">
      {/* Tab Switcher */}
      <div className="flex border-b border-gray-800 bg-gray-950 p-2 gap-1.5 shrink-0 select-none">
        <button
          onClick={() => setActiveTab('zones')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-center text-xs font-semibold rounded-md border transition-all focus:outline-none ${
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
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-center text-xs font-semibold rounded-md border transition-all focus:outline-none ${
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
            <DimensionsPanel
              isOpen={openSection === 'dimensions'}
              onToggle={() => handleToggleSection('dimensions')}
            />
            <AddZonePanel
              isOpen={openSection === 'add-zone'}
              onToggle={() => handleToggleSection('add-zone')}
            />
            {/* Decorations — separate visual layer */}
            <DecorationsPanel
              isOpen={openSection === 'decorations'}
              onToggle={() => handleToggleSection('decorations')}
            />
            <ZoneListPanel
              isOpen={openSection === 'zones-decorations'}
              onToggle={() => handleToggleSection('zones-decorations')}
            />
            <CanvasToolsPanel
              isOpen={openSection === 'alignment'}
              onToggle={() => handleToggleSection('alignment')}
            />
            <PalettePanel
              isOpen={openSection === 'palette'}
              onToggle={() => handleToggleSection('palette')}
            />
            {/* Edit Zone Section — Placed LAST in list & OPEN BY DEFAULT independently */}
            <EditZoneSectionPanel
              onNavigateToInstruct={handleSwitchToAi}
            />
          </>
        ) : (
          <AiInstructionsPanel />
        )}
      </div>
    </div>
  )
}
