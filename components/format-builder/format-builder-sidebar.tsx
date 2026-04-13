"use client"

import React from 'react'
import { DimensionsPanel } from './panels/dimensions-panel'
import { MetadataPanel } from './panels/metadata-panel'
import { AddZonePanel } from './panels/add-zone-panel'
import { ZoneListPanel } from './panels/zone-list-panel'
import { ZonePropertiesPanel } from './panels/zone-properties-panel'
import { PalettePanel } from './panels/palette-panel'
import { CanvasToolsPanel } from './panels/canvas-tools-panel'
import { ObjectHistoryPanel } from './panels/object-list-panel'
import { DecorationsPanel } from './panels/decorations-panel'

export function FormatBuilderSidebar() {
  return (
    <div className="w-[300px] border-l border-gray-800 bg-gray-900/50 flex flex-col overflow-hidden shrink-0">
      <div className="flex-1 overflow-y-auto">
        <DimensionsPanel />
        <MetadataPanel />
        <ObjectHistoryPanel />
        <AddZonePanel />
        <ZoneListPanel />
        <ZonePropertiesPanel />
        {/* Decorations — separate visual layer */}
        <DecorationsPanel />
        <CanvasToolsPanel />
        <PalettePanel />
      </div>
    </div>
  )
}
