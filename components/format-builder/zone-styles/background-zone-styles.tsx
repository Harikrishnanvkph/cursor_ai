"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { useFormatBuilder } from '../format-builder-context'

export function BackgroundZoneStyles() {
  const { selectedZone, updateZoneStyle } = useFormatBuilder()
  if (!selectedZone || selectedZone.type !== 'background') return null

  const s = (selectedZone as any).style || {}
  const update = (u: Record<string, any>) => updateZoneStyle(selectedZone.id, u)

  return (
    <div className="space-y-2">
      <label className="text-[10px] text-gray-500 uppercase block border-b border-gray-800 pb-1">Background Style</label>
      <div>
        <label className="text-[10px] text-gray-500 block">Type</label>
        <select value={s.type || 'gradient'} onChange={e => update({ type: e.target.value })} className="w-full h-6 text-[10px] bg-gray-900 border border-gray-700 rounded text-white">
          <option value="solid">Solid Color</option>
          <option value="gradient">Gradient</option>
          <option value="image">Image</option>
          <option value="pattern">Pattern</option>
        </select>
      </div>

      {s.type === 'solid' && (
        <div>
          <label className="text-[10px] text-gray-500 block">Color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={s.color || '#0f172a'} onChange={e => update({ color: e.target.value })} className="w-7 h-7 rounded border border-gray-700 cursor-pointer bg-transparent" />
            <span className="text-[9px] text-gray-600 font-mono">{s.color || '#0f172a'}</span>
          </div>
        </div>
      )}

      {s.type === 'gradient' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 block">Color 1</label>
              <input type="color" value={s.gradientColor1 || '#0f172a'} onChange={e => update({ gradientColor1: e.target.value })} className="w-full h-6 rounded border border-gray-700 cursor-pointer bg-transparent" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block">Color 2</label>
              <input type="color" value={s.gradientColor2 || '#1e293b'} onChange={e => update({ gradientColor2: e.target.value })} className="w-full h-6 rounded border border-gray-700 cursor-pointer bg-transparent" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block">Direction</label>
            <select value={s.gradientDirection || '135deg'} onChange={e => update({ gradientDirection: e.target.value })} className="w-full h-6 text-[10px] bg-gray-900 border border-gray-700 rounded text-white">
              <option value="0deg">Top → Bottom</option>
              <option value="90deg">Left → Right</option>
              <option value="135deg">Diagonal ↘</option>
              <option value="180deg">Bottom → Top</option>
              <option value="270deg">Right → Left</option>
              <option value="45deg">Diagonal ↗</option>
            </select>
          </div>
        </>
      )}

      {s.type === 'image' && (
        <>
          <div>
            <label className="text-[10px] text-gray-500 block">Image URL</label>
            <Input value={s.imageUrl || ''} onChange={e => update({ imageUrl: e.target.value })} className="h-6 text-[10px] bg-gray-900 border-gray-700 text-white" placeholder="https://…" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block">Fit</label>
            <select value={s.imageFit || 'cover'} onChange={e => update({ imageFit: e.target.value })} className="w-full h-6 text-[10px] bg-gray-900 border border-gray-700 rounded text-white">
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block">Overlay</label>
            <Input value={s.overlay || ''} onChange={e => update({ overlay: e.target.value })} className="h-6 text-[10px] bg-gray-900 border-gray-700 text-white" placeholder="rgba(0,0,0,0.5)" />
          </div>
        </>
      )}

      {s.type === 'pattern' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500 block">Pattern</label>
            <select value={s.patternType || 'dots'} onChange={e => update({ patternType: e.target.value })} className="w-full h-6 text-[10px] bg-gray-900 border border-gray-700 rounded text-white">
              <option value="dots">Dots</option>
              <option value="lines">Lines</option>
              <option value="grid">Grid</option>
              <option value="diagonal">Diagonal</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block">Opacity</label>
            <Input type="number" step="0.1" min="0" max="1" value={s.patternOpacity ?? 0.3} onChange={e => update({ patternOpacity: parseFloat(e.target.value) })} className="h-6 text-[10px] bg-gray-900 border-gray-700 text-white" />
          </div>
        </div>
      )}
    </div>
  )
}
