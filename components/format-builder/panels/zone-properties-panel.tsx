"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { useFormatBuilder } from '../format-builder-context'
import { ZONE_COLORS, ZONE_ICONS } from '../format-builder-utils'
import { PanelSection } from './panel-section'
import { TextZoneStyles } from '../zone-styles/text-zone-styles'
import { StatZoneStyles } from '../zone-styles/stat-zone-styles'
import { ChartZoneStyles } from '../zone-styles/chart-zone-styles'
import { BackgroundZoneStyles } from '../zone-styles/background-zone-styles'
import { DecorationZoneStyles } from '../zone-styles/decoration-zone-styles'
import { ImageZoneStyles } from '../zone-styles/image-zone-styles'
import type { BaseZone } from '@/lib/format-types'

export function ZonePropertiesContent({ showContentControls = true }: { showContentControls?: boolean }) {
  const { selectedZone, updateZone } = useFormatBuilder()

  if (!selectedZone) return null

  const zone = selectedZone

  return (
    <div className="space-y-3">
      {/* ── Position ── */}
      {zone.position && (
        <div className="bg-[#0e0e1a]/30 p-2.5 rounded-lg border border-gray-800 space-y-2">
          <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Position & Size</label>
          <div className="grid grid-cols-4 gap-2">
            {(['x', 'y', 'width', 'height'] as const).map(prop => (
              <PositionInput
                key={prop}
                label={prop === 'width' ? 'W' : prop === 'height' ? 'H' : prop.toUpperCase()}
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
      {zone.type === 'background' && <BackgroundZoneStyles showContentControls={showContentControls} />}
      {zone.type === 'decoration' && <DecorationZoneStyles />}
      {zone.type === 'image' && <ImageZoneStyles showContentControls={showContentControls} />}
    </div>
  )
}

export function ZonePropertiesPanel() {
  const { selectedZone } = useFormatBuilder()

  if (!selectedZone) return null

  const zone = selectedZone
  const colors = ZONE_COLORS[zone.type] || ZONE_COLORS.decoration

  return (
    <PanelSection
      title={`${zone.type} Properties`}
      icon={ZONE_ICONS[zone.type]}
      accentColor={colors.accent}
      defaultOpen
    >
      <ZonePropertiesContent />
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
    <div className="space-y-0.5">
      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">{label}</label>
      <Input
        type="number"
        value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => e.key === 'Enter' && commit()}
        className="h-7 text-[11px] bg-gray-950 border-gray-800 text-white px-2 focus:outline-none focus:border-orange-500/40 rounded-md transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  )
}
