"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { useFormatBuilder } from '../format-builder-context'

export function ChartZoneStyles() {
  const { selectedZone, updateZone } = useFormatBuilder()
  if (!selectedZone || selectedZone.type !== 'chart') return null

  const cfg = (selectedZone as any).chartConfig || {}
  const update = (u: any) => updateZone(selectedZone.id, { chartConfig: { ...cfg, ...u } } as any)

  const types = (cfg.preferredChartTypes || []).join(', ')

  return (
    <div className="space-y-2">
      <label className="text-[10px] text-gray-500 uppercase block border-b border-gray-800 pb-1">Chart Config</label>
      <div>
        <label className="text-[10px] text-gray-500 block">Preferred Types</label>
        <Input
          value={types}
          onChange={e => {
            const arr = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
            update({ preferredChartTypes: arr })
          }}
          placeholder="bar, pie, line"
          className="h-6 text-[10px] bg-gray-900 border-gray-700 text-white"
        />
        <p className="text-[8px] text-gray-600 mt-0.5">Comma-separated chart types</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 block">Legend</label>
          <select value={cfg.legendPosition || 'bottom'} onChange={e => update({ legendPosition: e.target.value })} className="w-full h-6 text-[10px] bg-gray-900 border border-gray-700 rounded text-white">
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="none">Hidden</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block">Background</label>
          <Input value={cfg.backgroundColor || 'transparent'} onChange={e => update({ backgroundColor: e.target.value })} className="h-6 text-[10px] bg-gray-900 border-gray-700 text-white" placeholder="transparent" />
        </div>
      </div>
    </div>
  )
}
