"use client"

import React, { useState } from 'react'
import { History, Trash2, BoxSelect, Sparkles, Filter, ChevronDown } from 'lucide-react'
import { useFormatBuilder } from '../format-builder-context'
import { useDecorationStore } from '@/lib/stores/decoration-store'
import { PanelSection } from './panel-section'
import { getZoneLabel, ZONE_ICONS } from '../format-builder-utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export type ObjectFilter = 'all' | 'zone' | 'decoration'

export function ObjectHistoryPanel() {
  const { skeleton, selectedZoneId, setSelectedZoneId, deleteZone, setSkeleton } = useFormatBuilder()
  const { shapes, selectedShapeId, setSelectedShapeId, removeShape, clearShapes } = useDecorationStore()

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
      isSelected: selectedZoneId === z.id
    })),
    ...shapes.map(s => ({
      type: 'decoration' as const,
      id: s.id,
      label: `${s.type.replace(/-/g, ' ')}${s.text ? `: ${s.text}` : ''}`,
      icon: <Sparkles className="w-3.5 h-3.5 text-pink-400" />,
      isSelected: selectedShapeId === s.id
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

  const handleDelete = (e: React.MouseEvent, item: typeof allItems[0]) => {
    e.stopPropagation()
    if (item.type === 'zone') {
      deleteZone(item.id)
    } else {
      removeShape(item.id)
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
    <PanelSection title="Object History" icon={<History className="w-3.5 h-3.5" />} defaultOpen={false}>
      <div className="space-y-3">
        {/* Header toolbar */}
        <div className="flex justify-between items-center gap-2">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-gray-800 hover:bg-gray-700 rounded transition-colors">
              <Filter className="w-3 h-3" />
              {filter === 'all' ? 'All Items' : filter === 'zone' ? 'Zones Only' : 'Decorations Only'}
              <ChevronDown className="w-3 h-3" />
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
            className="flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-red-400 bg-red-950/30 hover:bg-red-900/50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        </div>

        {/* List */}
        <div className="max-h-[300px] overflow-y-auto space-y-0.5 border border-gray-800 rounded-md bg-gray-950/20 p-1">
          {filteredItems.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-600">
              No items match your filter.
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelect(item)}
                className={`flex justify-between items-center px-2 py-1.5 rounded-sm cursor-pointer transition-colors group text-xs ${
                  item.isSelected
                    ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30'
                    : 'bg-transparent text-gray-300 hover:bg-gray-800 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 flex items-center justify-center w-4">
                    {item.type === 'zone' ? (
                      <span className="scale-75 text-emerald-400">{item.icon}</span>
                    ) : (
                      item.icon
                    )}
                  </span>
                  <span className="truncate capitalize">{item.label}</span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                  <button
                    onClick={(e) => handleDelete(e, item)}
                    className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Footer info */}
        <div className="text-[10px] text-gray-600 flex justify-between px-1">
          <span>{zones.length} Zones</span>
          <span>{shapes.length} Decorations</span>
        </div>
      </div>
    </PanelSection>
  )
}
