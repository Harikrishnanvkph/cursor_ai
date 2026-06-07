"use client"

import React, { useState } from 'react'
import {
  Layers, Trash2, Copy, ChevronUp, ChevronDown, MessageSquare,
  Sparkles, Filter, ChevronDown as ChevronDownIcon
} from 'lucide-react'
import { useFormatBuilder } from '../format-builder-context'
import { useDecorationStore } from '@/lib/stores/decoration-store'
import { ZONE_COLORS, ZONE_ICONS, getZoneLabel } from '../format-builder-utils'
import { PanelSection } from './panel-section'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { BaseZone } from '@/lib/format-types'

export type ObjectFilter = 'all' | 'zone' | 'decoration'

export function ZoneListPanel() {
  const {
    skeleton, setSkeleton, selectedZoneId, setSelectedZoneId,
    deleteZone, duplicateZone, moveZoneOrder,
  } = useFormatBuilder()

  const {
    shapes, selectedShapeId, setSelectedShapeId,
    removeShape, clearShapes, duplicateShape
  } = useDecorationStore()

  const [filter, setFilter] = useState<ObjectFilter>('all')

  const zones = skeleton.zones || []
  const hasItems = zones.length > 0 || shapes.length > 0

  // Combine items
  const allItems = [
    ...zones.map(z => ({
      type: 'zone' as const,
      id: z.id,
      label: getZoneLabel(z),
      icon: ZONE_ICONS[z.type],
      colors: ZONE_COLORS[z.type] || ZONE_COLORS.decoration,
      isSelected: selectedZoneId === z.id,
      rawZone: z
    })),
    ...shapes.map(s => ({
      type: 'decoration' as const,
      id: s.id,
      label: `${s.type.replace(/-/g, ' ')}${s.text ? `: ${s.text}` : ''}`,
      icon: <Sparkles className="w-3.5 h-3.5 text-pink-400" />,
      colors: { accent: '#ec4899', bg: '', border: '', label: '' },
      isSelected: selectedShapeId === s.id,
      rawShape: s
    }))
  ]

  const filteredItems = allItems.filter(item => filter === 'all' || item.type === filter)

  const handleSelect = (item: typeof allItems[0]) => {
    if (item.type === 'zone') {
      setSelectedZoneId(item.id)
      setSelectedShapeId(null)
    } else {
      setSelectedShapeId(item.id)
      setSelectedZoneId(null)
    }
  }

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear the selected category?")) {
      if (filter === 'all' || filter === 'zone') {
        setSkeleton(prev => ({ ...prev, zones: [] }))
        setSelectedZoneId(null)
      }
      if (filter === 'all' || filter === 'decoration') {
        clearShapes()
        setSelectedShapeId(null)
      }
    }
  }

  return (
    <PanelSection
      title={`Zones & Decorations (${zones.length + shapes.length})`}
      icon={<Layers className="w-3.5 h-3.5" />}
      defaultOpen
    >
      <div className="space-y-3">
        {/* Toolbar: Filter + Clear */}
        <div className="flex justify-between items-center gap-2">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-gray-800 hover:bg-gray-700 rounded transition-colors focus:outline-none">
              <Filter className="w-3 h-3 text-gray-500" />
              {filter === 'all' ? 'All Items' : filter === 'zone' ? 'Zones Only' : 'Decorations Only'}
              <ChevronDownIcon className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[140px] text-xs">
              <DropdownMenuItem onClick={() => setFilter('all')}>All Items</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('zone')}>Zones Only</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('decoration')}>Decorations Only</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Button */}
          <button
            disabled={!hasItems || filteredItems.length === 0}
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-red-400 bg-red-950/20 hover:bg-red-900/40 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        </div>

        {/* List of items */}
        <div className="space-y-0.5 max-h-[350px] overflow-y-auto pr-1">
          {filteredItems.map((item) => {
            const isSelected = item.isSelected

            return (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelect(item)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-all text-xs group ${
                  isSelected
                    ? 'bg-gray-800 border border-gray-600'
                    : 'hover:bg-gray-800/50 border border-transparent'
                }`}
              >
                {/* Icon */}
                <span style={{ color: item.colors.accent }} className="shrink-0 flex items-center justify-center w-4 h-4">
                  {item.icon}
                </span>

                {/* Label */}
                <span className="capitalize truncate text-gray-300 flex-1 min-w-0">{item.label}</span>

                {/* Message indicator */}
                {item.type === 'zone' && (item.rawZone as BaseZone).message && (
                  <MessageSquare className="w-3 h-3 text-orange-400/60 shrink-0" />
                )}

                {/* Actions (visible on hover / selected) */}
                {item.type === 'zone' ? (
                  <div className={`flex items-center gap-0 shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    <button
                      onClick={e => { e.stopPropagation(); moveZoneOrder(item.id, 'up') }}
                      className="p-0.5 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 disabled:opacity-20"
                      title="Move up (back)"
                      disabled={zones.findIndex(z => z.id === item.id) === 0}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); moveZoneOrder(item.id, 'down') }}
                      className="p-0.5 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 disabled:opacity-20"
                      title="Move down (front)"
                      disabled={zones.findIndex(z => z.id === item.id) === zones.length - 1}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); duplicateZone(item.id) }}
                      className="p-0.5 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300"
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteZone(item.id) }}
                      className="p-0.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className={`flex items-center gap-0.5 shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    <button
                      onClick={e => { e.stopPropagation(); duplicateShape(item.id) }}
                      className="p-0.5 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300"
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); removeShape(item.id) }}
                      className="p-0.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {filteredItems.length === 0 && (
            <p className="text-[11px] text-gray-650 text-center py-6">
              No items match your filter.
            </p>
          )}
        </div>
      </div>
    </PanelSection>
  )
}
