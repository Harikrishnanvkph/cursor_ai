"use client"

import React, { useState } from 'react'
import { Plus, BarChart3, Type, Hash, Image, ChevronRight } from 'lucide-react'
import { useFormatBuilder } from '../format-builder-context'
import { TEXT_ROLES, STAT_ROLES } from '../format-builder-utils'
import { PanelSection } from './panel-section'
import type { ZoneType } from '@/lib/format-types'

/**
 * "Add Zone" panel — content slots only.
 * Zones are semantic placeholders (text, chart, stat, background)
 * that get filled by AI at render time.
 *
 * Decorations (shapes, lines, icons, images) are in a SEPARATE panel.
 */
export function AddZonePanel() {
  const { addZone } = useFormatBuilder()
  const [expandedType, setExpandedType] = useState<ZoneType | null>(null)

  const toggleExpand = (type: ZoneType) => {
    setExpandedType(prev => prev === type ? null : type)
  }

  return (
    <PanelSection title="Add Content Zone" icon={<Plus className="w-3.5 h-3.5" />} defaultOpen>
      <p className="text-[9px] text-gray-600 mb-1.5 -mt-1">Content slots filled by AI at render time</p>
      <div className="space-y-1">
        {/* Text — expands to show roles */}
        <ZoneTypeRow
          icon={<Type className="w-3.5 h-3.5" />}
          label="Text"
          color="emerald"
          expanded={expandedType === 'text'}
          hasSubMenu
          onClick={() => toggleExpand('text')}
        />
        {expandedType === 'text' && (
          <div className="pl-5 space-y-0.5">
            {TEXT_ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => { addZone('text', { role: r.value }); setExpandedType(null) }}
                className="w-full text-left px-2.5 py-1.5 rounded text-[11px] text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        {/* Chart — direct add */}
        <ZoneTypeRow
          icon={<BarChart3 className="w-3.5 h-3.5" />}
          label="Chart"
          color="blue"
          onClick={() => addZone('chart')}
        />

        {/* Stat — expands to show roles */}
        <ZoneTypeRow
          icon={<Hash className="w-3.5 h-3.5" />}
          label="Stat"
          color="amber"
          expanded={expandedType === 'stat'}
          hasSubMenu
          onClick={() => toggleExpand('stat')}
        />
        {expandedType === 'stat' && (
          <div className="pl-5 space-y-0.5">
            {STAT_ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => { addZone('stat', { role: r.value }); setExpandedType(null) }}
                className="w-full text-left px-2.5 py-1.5 rounded text-[11px] text-gray-400 hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        {/* Background — direct add */}
        <ZoneTypeRow
          icon={<Image className="w-3.5 h-3.5" />}
          label="Background"
          color="purple"
          onClick={() => addZone('background')}
        />
      </div>
    </PanelSection>
  )
}

function ZoneTypeRow({
  icon, label, color, expanded, hasSubMenu, onClick
}: {
  icon: React.ReactNode
  label: string
  color: string
  expanded?: boolean
  hasSubMenu?: boolean
  onClick: () => void
}) {
  const colorMap: Record<string, string> = {
    emerald: 'hover:bg-emerald-500/10 text-emerald-400',
    blue: 'hover:bg-blue-500/10 text-blue-400',
    amber: 'hover:bg-amber-500/10 text-amber-400',
    purple: 'hover:bg-purple-500/10 text-purple-400',
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${colorMap[color] || ''} ${expanded ? `bg-${color}-500/10` : ''}`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {hasSubMenu && (
        <ChevronRight className={`w-3 h-3 text-gray-600 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      )}
    </button>
  )
}
