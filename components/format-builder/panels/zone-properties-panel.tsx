"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { MessageSquare } from 'lucide-react'
import { useFormatBuilder } from '../format-builder-context'
import { ZONE_COLORS, ZONE_ICONS, getPresetKey, MESSAGE_PRESETS } from '../format-builder-utils'
import { PanelSection } from './panel-section'
import { TextZoneStyles } from '../zone-styles/text-zone-styles'
import { StatZoneStyles } from '../zone-styles/stat-zone-styles'
import { ChartZoneStyles } from '../zone-styles/chart-zone-styles'
import { BackgroundZoneStyles } from '../zone-styles/background-zone-styles'
import { DecorationZoneStyles } from '../zone-styles/decoration-zone-styles'
import type { BaseZone } from '@/lib/format-types'

export function ZonePropertiesPanel() {
  const { selectedZone, updateZone, updateZoneStyle } = useFormatBuilder()

  if (!selectedZone) return null

  const zone = selectedZone
  const baseZone = zone as BaseZone
  const colors = ZONE_COLORS[zone.type] || ZONE_COLORS.decoration
  const presetKey = getPresetKey(zone)

  return (
    <PanelSection
      title={`${zone.type} Properties`}
      icon={ZONE_ICONS[zone.type]}
      accentColor={colors.accent}
      defaultOpen
    >
      <div className="space-y-3">
        {/* ── AI Message ── */}
        <div className="p-2 rounded-lg border border-orange-500/20 bg-orange-500/5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <MessageSquare className="w-3 h-3 text-orange-400" />
            <span className="text-[10px] font-semibold text-orange-400 uppercase">AI Message</span>
          </div>
          <textarea
            value={baseZone.message || ''}
            onChange={e => updateZone(zone.id, { message: e.target.value } as any)}
            placeholder="Instructions for AI content generation…"
            rows={2}
            className="w-full text-[11px] bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-white placeholder:text-gray-600 resize-none focus:outline-none focus:border-orange-500/40"
          />
          {/* Presets */}
          {MESSAGE_PRESETS[presetKey] && (
            <div className="mt-1 flex flex-col gap-0.5">
              {MESSAGE_PRESETS[presetKey].map((preset, i) => (
                <button
                  key={i}
                  onClick={() => updateZone(zone.id, { message: preset } as any)}
                  className="text-left text-[9px] text-gray-500 hover:text-orange-400 transition-colors truncate px-1 py-0.5 rounded hover:bg-orange-500/10"
                >
                  💡 {preset}
                </button>
              ))}
            </div>
          )}
          {/* Message type */}
          <div className="mt-1.5">
            <select
              value={baseZone.messageType || 'auto'}
              onChange={e => updateZone(zone.id, { messageType: e.target.value } as any)}
              className="w-full h-6 text-[10px] bg-gray-900 border border-gray-700 rounded px-1.5 text-gray-400 focus:outline-none"
            >
              <option value="auto">Auto detect</option>
              <option value="text">Plain text</option>
              <option value="html">HTML content</option>
              <option value="image">Image URL</option>
              <option value="data">Data / JSON</option>
            </select>
          </div>
        </div>

        {/* ── Position ── */}
        {zone.position && (
          <div>
            <label className="text-[10px] text-gray-500 uppercase mb-1 block">Position & Size</label>
            <div className="grid grid-cols-4 gap-1">
              {(['x', 'y', 'width', 'height'] as const).map(prop => (
                <PositionInput
                  key={prop}
                  label={prop.toUpperCase()}
                  value={zone.position![prop]}
                  onChange={v => updateZone(zone.id, { position: { ...zone.position!, [prop]: v } } as any)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Type-specific style panels ── */}
        {zone.type === 'text' && <TextZoneStyles />}
        {zone.type === 'stat' && <StatZoneStyles />}
        {zone.type === 'chart' && <ChartZoneStyles />}
        {zone.type === 'background' && <BackgroundZoneStyles />}
        {zone.type === 'decoration' && <DecorationZoneStyles />}
      </div>
    </PanelSection>
  )
}

function PositionInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [local, setLocal] = React.useState(String(value))

  React.useEffect(() => { setLocal(String(value)) }, [value])

  const commit = () => {
    const v = parseInt(local)
    if (!isNaN(v) && v >= 0) onChange(v)
    else setLocal(String(value))
  }

  return (
    <div>
      <label className="text-[8px] text-gray-600 block">{label}</label>
      <Input
        type="number"
        value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => e.key === 'Enter' && commit()}
        className="h-6 text-[10px] bg-gray-900 border-gray-700 text-white px-1"
      />
    </div>
  )
}
