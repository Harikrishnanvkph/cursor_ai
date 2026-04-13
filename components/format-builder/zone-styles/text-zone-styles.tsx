"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { useFormatBuilder } from '../format-builder-context'

export function TextZoneStyles() {
  const { selectedZone, updateZoneStyle } = useFormatBuilder()
  if (!selectedZone || selectedZone.type !== 'text') return null

  const s = (selectedZone as any).style || {}
  const update = (u: Record<string, any>) => updateZoneStyle(selectedZone.id, u)

  return (
    <div className="space-y-2">
      <label className="text-[10px] text-gray-500 uppercase block border-b border-gray-800 pb-1">Text Style</label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 block">Font Size</label>
          <Input type="number" value={s.fontSize || 16} onChange={e => update({ fontSize: parseInt(e.target.value) || 16 })} className="h-6 text-[10px] bg-gray-900 border-gray-700 text-white" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block">Weight</label>
          <select value={s.fontWeight || '400'} onChange={e => update({ fontWeight: e.target.value })} className="w-full h-6 text-[10px] bg-gray-900 border border-gray-700 rounded text-white">
            <option value="300">Light</option>
            <option value="400">Regular</option>
            <option value="500">Medium</option>
            <option value="600">SemiBold</option>
            <option value="700">Bold</option>
            <option value="800">ExtraBold</option>
            <option value="900">Black</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 block">Color</label>
          <div className="flex items-center gap-1">
            <input type="color" value={s.color || '#ffffff'} onChange={e => update({ color: e.target.value })} className="w-6 h-6 rounded border border-gray-700 cursor-pointer bg-transparent" />
            <span className="text-[9px] text-gray-600 font-mono">{s.color || '#fff'}</span>
          </div>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block">Align</label>
          <select value={s.textAlign || 'left'} onChange={e => update({ textAlign: e.target.value })} className="w-full h-6 text-[10px] bg-gray-900 border border-gray-700 rounded text-white">
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 block">Line Height</label>
          <Input type="number" step="0.1" value={s.lineHeight || 1.3} onChange={e => update({ lineHeight: parseFloat(e.target.value) || 1.3 })} className="h-6 text-[10px] bg-gray-900 border-gray-700 text-white" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block">Transform</label>
          <select value={s.textTransform || 'none'} onChange={e => update({ textTransform: e.target.value })} className="w-full h-6 text-[10px] bg-gray-900 border border-gray-700 rounded text-white">
            <option value="none">None</option>
            <option value="uppercase">UPPER</option>
            <option value="lowercase">lower</option>
            <option value="capitalize">Title</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-[10px] text-gray-500 block">Font Family</label>
        <Input value={s.fontFamily || 'Inter, sans-serif'} onChange={e => update({ fontFamily: e.target.value })} className="h-6 text-[10px] bg-gray-900 border-gray-700 text-white" />
      </div>
    </div>
  )
}
