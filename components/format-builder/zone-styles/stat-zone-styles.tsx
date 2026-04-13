"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { useFormatBuilder } from '../format-builder-context'

export function StatZoneStyles() {
  const { selectedZone, updateZoneStyle } = useFormatBuilder()
  if (!selectedZone || selectedZone.type !== 'stat') return null

  const s = (selectedZone as any).style || {}
  const update = (u: Record<string, any>) => updateZoneStyle(selectedZone.id, u)

  return (
    <div className="space-y-2">
      <label className="text-[10px] text-gray-500 uppercase block border-b border-gray-800 pb-1">Stat Style</label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 block">Value Size</label>
          <Input type="number" value={s.valueSize || 48} onChange={e => update({ valueSize: parseInt(e.target.value) || 48 })} className="h-6 text-[10px] bg-gray-900 border-gray-700 text-white" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block">Label Size</label>
          <Input type="number" value={s.labelSize || 14} onChange={e => update({ labelSize: parseInt(e.target.value) || 14 })} className="h-6 text-[10px] bg-gray-900 border-gray-700 text-white" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 block">Value Color</label>
          <input type="color" value={s.valueColor || '#3b82f6'} onChange={e => update({ valueColor: e.target.value })} className="w-full h-6 rounded border border-gray-700 cursor-pointer bg-transparent" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block">Label Color</label>
          <input type="color" value={s.labelColor || '#999999'} onChange={e => update({ labelColor: e.target.value })} className="w-full h-6 rounded border border-gray-700 cursor-pointer bg-transparent" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 block">Weight</label>
          <select value={s.valueFontWeight || '800'} onChange={e => update({ valueFontWeight: e.target.value })} className="w-full h-6 text-[10px] bg-gray-900 border border-gray-700 rounded text-white">
            <option value="400">Regular</option>
            <option value="600">SemiBold</option>
            <option value="700">Bold</option>
            <option value="800">ExtraBold</option>
            <option value="900">Black</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block">Layout</label>
          <select value={s.layout || 'vertical'} onChange={e => update({ layout: e.target.value })} className="w-full h-6 text-[10px] bg-gray-900 border border-gray-700 rounded text-white">
            <option value="vertical">Vertical</option>
            <option value="horizontal">Horizontal</option>
          </select>
        </div>
      </div>
    </div>
  )
}
