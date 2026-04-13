"use client"

import React from 'react'
import { Layers, Trash2, Copy, ChevronUp, ChevronDown, MessageSquare } from 'lucide-react'
import { useFormatBuilder } from '../format-builder-context'
import { ZONE_COLORS, ZONE_ICONS, getZoneLabel } from '../format-builder-utils'
import { PanelSection } from './panel-section'
import type { BaseZone } from '@/lib/format-types'

export function ZoneListPanel() {
  const {
    skeleton, selectedZoneId, setSelectedZoneId,
    deleteZone, duplicateZone, moveZoneOrder,
  } = useFormatBuilder()

  const zones = skeleton.zones

  return (
    <PanelSection title={`Zones (${zones.length})`} icon={<Layers className="w-3.5 h-3.5" />} defaultOpen>
      <div className="space-y-0.5">
        {zones.map((zone, i) => {
          const colors = ZONE_COLORS[zone.type] || ZONE_COLORS.decoration
          const isSelected = selectedZoneId === zone.id
          const label = getZoneLabel(zone)

          return (
            <div
              key={zone.id}
              onClick={() => setSelectedZoneId(zone.id)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-all text-xs group ${
                isSelected
                  ? 'bg-gray-800 border border-gray-600'
                  : 'hover:bg-gray-800/50 border border-transparent'
              }`}
            >
              {/* Icon */}
              <span style={{ color: colors.accent }} className="shrink-0">
                {ZONE_ICONS[zone.type]}
              </span>

              {/* Label */}
              <span className="capitalize truncate text-gray-300 flex-1 min-w-0">{label}</span>

              {/* Message indicator */}
              {(zone as BaseZone).message && (
                <MessageSquare className="w-3 h-3 text-orange-400/60 shrink-0" />
              )}

              {/* Actions (visible on hover / selected) */}
              <div className={`flex items-center gap-0 shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                <button
                  onClick={e => { e.stopPropagation(); moveZoneOrder(zone.id, 'up') }}
                  className="p-0.5 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300"
                  title="Move up (back)"
                  disabled={i === 0}
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); moveZoneOrder(zone.id, 'down') }}
                  className="p-0.5 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300"
                  title="Move down (front)"
                  disabled={i === zones.length - 1}
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); duplicateZone(zone.id) }}
                  className="p-0.5 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300"
                  title="Duplicate"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); deleteZone(zone.id) }}
                  className="p-0.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )
        })}
        {zones.length === 0 && (
          <p className="text-[11px] text-gray-600 text-center py-3">No zones yet. Add one above.</p>
        )}
      </div>
    </PanelSection>
  )
}
