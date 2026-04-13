"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { useFormatBuilder } from '../format-builder-context'

// ─── Shape type options matching the editor's decoration system ───
const SHAPE_TYPES = [
  { label: 'Rectangle',  value: 'rectangle' },
  { label: 'Circle',     value: 'circle' },
  { label: 'Triangle',   value: 'triangle' },
  { label: 'Star',       value: 'star' },
  { label: 'Hexagon',    value: 'hexagon' },
  { label: 'Pentagon',   value: 'pentagon' },
  { label: 'Diamond',    value: 'diamond-shape' },
  { label: 'Heart',      value: 'heart' },
  { label: 'Cloud',      value: 'cloud' },
  { label: 'Polygon',    value: 'polygon' },
  { label: 'Dot',        value: 'dot' },
  { label: 'Checkmark',  value: 'checkmark' },
  { label: 'Crossmark',  value: 'crossmark' },
  { label: 'Text Callout', value: 'text-callout' },
]

const LINE_TYPES = [
  { label: 'Line',          value: 'line' },
  { label: 'Arrow',         value: 'arrow' },
  { label: 'Double Arrow',  value: 'double-arrow' },
]

const CONNECTOR_TYPES = [
  { label: 'Connected Lines', value: 'connected-lines' },
  { label: 'Cloud Line',      value: 'cloud-line' },
  { label: 'Freehand',        value: 'freehand' },
]

const ICON_TYPES = [
  // Emojis
  { group: 'Emoji', items: [
    { label: '⭐ Star',     value: 'emoji-star' },
    { label: '🔥 Fire',     value: 'emoji-fire' },
    { label: '❤️ Heart',    value: 'emoji-heart' },
    { label: '👍 Thumb',    value: 'emoji-thumb' },
    { label: '💡 Idea',     value: 'emoji-idea' },
    { label: '✅ Check',    value: 'emoji-check' },
    { label: '❌ Cross',    value: 'emoji-cross' },
    { label: '😊 Smile',    value: 'emoji-smile' },
    { label: '🚀 Rocket',   value: 'emoji-rocket' },
    { label: '🎯 Target',   value: 'emoji-target' },
    { label: '👏 Clap',     value: 'emoji-clap' },
    { label: '✨ Sparkles', value: 'emoji-sparkles' },
    { label: '🎉 Party',    value: 'emoji-party' },
    { label: '🧠 Brain',    value: 'emoji-brain' },
    { label: '💪 Muscle',   value: 'emoji-muscle' },
    { label: '👑 Crown',    value: 'emoji-crown' },
    { label: '💎 Diamond',  value: 'emoji-diamond' },
    { label: '🏅 Medal',    value: 'emoji-medal' },
    { label: '⏰ Clock',    value: 'emoji-clock' },
    { label: '🔒 Lock',     value: 'emoji-lock' },
    { label: '☂️ Umbrella',  value: 'emoji-umbrella' },
  ]},
  // Symbols
  { group: 'Symbols', items: [
    { label: '! Exclamation', value: 'exclamation' },
    { label: '? Question',    value: 'question' },
    { label: '📌 Pushpin',   value: 'pushpin' },
    { label: '🎯 Bullseye',  value: 'bullseye' },
  ]},
  // Number markers
  { group: 'Numbers', items: [
    { label: '0',  value: 'num-0' },
    { label: '1',  value: 'num-1' },
    { label: '2',  value: 'num-2' },
    { label: '3',  value: 'num-3' },
    { label: '4',  value: 'num-4' },
    { label: '5',  value: 'num-5' },
    { label: '6',  value: 'num-6' },
    { label: '7',  value: 'num-7' },
    { label: '8',  value: 'num-8' },
    { label: '9',  value: 'num-9' },
  ]},
]

export function DecorationZoneStyles() {
  const { selectedZone, updateZoneStyle } = useFormatBuilder()
  if (!selectedZone || selectedZone.type !== 'decoration') return null

  const zone = selectedZone as any
  const s = zone.style || {}
  const subtype = zone.subtype
  const update = (u: Record<string, any>) => updateZoneStyle(selectedZone.id, u)

  return (
    <div className="space-y-2">
      <label className="text-[10px] text-gray-500 uppercase block border-b border-gray-800 pb-1">
        {subtype} Properties
      </label>

      {/* ═══ SHAPE ═══ */}
      {subtype === 'shape' && (
        <>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Shape Type</label>
            <div className="grid grid-cols-3 gap-1">
              {SHAPE_TYPES.map(st => (
                <button
                  key={st.value}
                  onClick={() => update({ shapeType: st.value })}
                  className={`px-1.5 py-1 rounded text-[9px] border transition-colors ${
                    s.shapeType === st.value
                      ? 'bg-pink-500/20 text-pink-400 border-pink-500/40'
                      : 'bg-gray-800/50 text-gray-500 border-gray-700/50 hover:border-gray-600 hover:text-gray-300'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 block">Fill Color</label>
              <div className="flex items-center gap-1">
                <input type="color" value={s.shapeColor || '#f59e0b'} onChange={e => update({ shapeColor: e.target.value })} className="w-6 h-6 rounded border border-gray-700 cursor-pointer bg-transparent" />
                <span className="text-[8px] text-gray-600 font-mono">{s.shapeColor}</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block">Opacity</label>
              <Input type="number" step="0.05" min="0" max="1" value={s.shapeOpacity ?? 0.2} onChange={e => update({ shapeOpacity: parseFloat(e.target.value) })} className="h-6 text-[10px] bg-gray-900 border-gray-700 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 block">Stroke Color</label>
              <input type="color" value={s.strokeColor || '#3b82f6'} onChange={e => update({ strokeColor: e.target.value })} className="w-full h-6 rounded border border-gray-700 cursor-pointer bg-transparent" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block">Stroke Width</label>
              <Input type="number" value={s.strokeWidth || 0} onChange={e => update({ strokeWidth: parseInt(e.target.value) || 0 })} className="h-6 text-[10px] bg-gray-900 border-gray-700 text-white" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block">Stroke Style</label>
            <select value={s.strokeStyle || 'solid'} onChange={e => update({ strokeStyle: e.target.value })} className="w-full h-6 text-[10px] bg-gray-900 border border-gray-700 rounded text-white">
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block">Border Radius</label>
            <Input type="number" value={s.borderRadius || 0} onChange={e => update({ borderRadius: parseInt(e.target.value) || 0 })} className="h-6 text-[10px] bg-gray-900 border-gray-700 text-white" />
          </div>
        </>
      )}

      {/* ═══ LINE / ARROW ═══ */}
      {subtype === 'line' && (
        <>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Line Type</label>
            <div className="flex gap-1 flex-wrap">
              {LINE_TYPES.map(lt => (
                <button
                  key={lt.value}
                  onClick={() => update({ lineType: lt.value })}
                  className={`px-2 py-1 rounded text-[9px] border transition-colors ${
                    s.lineType === lt.value
                      ? 'bg-pink-500/20 text-pink-400 border-pink-500/40'
                      : 'bg-gray-800/50 text-gray-500 border-gray-700/50 hover:border-gray-600 hover:text-gray-300'
                  }`}
                >
                  {lt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 block">Color</label>
              <input type="color" value={s.lineColor || '#3b82f6'} onChange={e => update({ lineColor: e.target.value })} className="w-full h-6 rounded border border-gray-700 cursor-pointer bg-transparent" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block">Thickness</label>
              <Input type="number" value={s.lineThickness || 2} onChange={e => update({ lineThickness: parseInt(e.target.value) || 2 })} className="h-6 text-[10px] bg-gray-900 border-gray-700 text-white" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block">Style</label>
            <select value={s.lineStyle || 'solid'} onChange={e => update({ lineStyle: e.target.value })} className="w-full h-6 text-[10px] bg-gray-900 border border-gray-700 rounded text-white">
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
        </>
      )}

      {/* ═══ CONNECTOR ═══ */}
      {subtype === 'connector' && (
        <>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Connector Type</label>
            <div className="flex gap-1 flex-wrap">
              {CONNECTOR_TYPES.map(ct => (
                <button
                  key={ct.value}
                  onClick={() => update({ lineType: ct.value })}
                  className={`px-2 py-1 rounded text-[9px] border transition-colors ${
                    s.lineType === ct.value
                      ? 'bg-pink-500/20 text-pink-400 border-pink-500/40'
                      : 'bg-gray-800/50 text-gray-500 border-gray-700/50 hover:border-gray-600 hover:text-gray-300'
                  }`}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 block">Color</label>
              <input type="color" value={s.lineColor || '#3b82f6'} onChange={e => update({ lineColor: e.target.value })} className="w-full h-6 rounded border border-gray-700 cursor-pointer bg-transparent" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block">Thickness</label>
              <Input type="number" value={s.lineThickness || 2} onChange={e => update({ lineThickness: parseInt(e.target.value) || 2 })} className="h-6 text-[10px] bg-gray-900 border-gray-700 text-white" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block">Style</label>
            <select value={s.lineStyle || 'solid'} onChange={e => update({ lineStyle: e.target.value })} className="w-full h-6 text-[10px] bg-gray-900 border border-gray-700 rounded text-white">
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
        </>
      )}

      {/* ═══ ICON / EMOJI ═══ */}
      {subtype === 'icon' && (
        <>
          {ICON_TYPES.map(group => (
            <div key={group.group}>
              <label className="text-[10px] text-gray-500 uppercase block mb-1">{group.group}</label>
              <div className="grid grid-cols-4 gap-0.5">
                {group.items.map(item => (
                  <button
                    key={item.value}
                    onClick={() => update({ iconType: item.value })}
                    className={`px-1 py-1 rounded text-[8px] border transition-colors text-center ${
                      s.iconType === item.value
                        ? 'bg-pink-500/20 text-pink-400 border-pink-500/40'
                        : 'bg-gray-800/50 text-gray-500 border-gray-700/50 hover:border-gray-600 hover:text-gray-300'
                    }`}
                    title={item.label}
                  >
                    {item.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 block">Color</label>
              <input type="color" value={s.iconColor || '#f59e0b'} onChange={e => update({ iconColor: e.target.value })} className="w-full h-6 rounded border border-gray-700 cursor-pointer bg-transparent" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block">Size</label>
              <Input type="number" value={s.iconSize || 48} onChange={e => update({ iconSize: parseInt(e.target.value) || 48 })} className="h-6 text-[10px] bg-gray-900 border-gray-700 text-white" />
            </div>
          </div>
        </>
      )}

      {/* ═══ IMAGE ═══ */}
      {subtype === 'image' && (
        <>
          <div>
            <label className="text-[10px] text-gray-500 block">Image URL</label>
            <Input
              value={s.imageUrl || ''}
              onChange={e => update({ imageUrl: e.target.value })}
              placeholder="https://… or paste data URI"
              className="h-7 text-[10px] bg-gray-900 border-gray-700 text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Upload Image</label>
            <label className="flex items-center justify-center gap-1 px-3 py-2 rounded-md border border-dashed border-gray-600 text-[10px] text-gray-400 hover:border-gray-500 hover:text-gray-300 cursor-pointer transition-colors">
              <span>Choose file or drop here</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    update({ imageUrl: ev.target?.result as string })
                  }
                  reader.readAsDataURL(file)
                }}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 block">Fit</label>
              <select value={s.imageFit || 'cover'} onChange={e => update({ imageFit: e.target.value })} className="w-full h-6 text-[10px] bg-gray-900 border border-gray-700 rounded text-white">
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block">Radius</label>
              <Input type="number" value={s.imageBorderRadius || 0} onChange={e => update({ imageBorderRadius: parseInt(e.target.value) || 0 })} className="h-6 text-[10px] bg-gray-900 border-gray-700 text-white" />
            </div>
          </div>
          {s.imageUrl && (
            <div className="mt-1 rounded overflow-hidden border border-gray-700">
              <img src={s.imageUrl} alt="preview" className="w-full h-16 object-cover" />
            </div>
          )}
        </>
      )}

      {/* ═══ SVG UPLOAD ═══ */}
      {subtype === 'svg-upload' && (
        <>
          <div>
            <label className="text-[10px] text-gray-500 block">Upload SVG File</label>
            <label className="flex items-center justify-center gap-1 px-3 py-2 rounded-md border border-dashed border-gray-600 text-[10px] text-gray-400 hover:border-gray-500 hover:text-gray-300 cursor-pointer transition-colors mt-1">
              <span>Choose .svg file</span>
              <input
                type="file"
                accept=".svg,image/svg+xml"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    update({ svgContent: ev.target?.result as string })
                  }
                  reader.readAsText(file)
                }}
              />
            </label>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mt-2">Or paste SVG markup</label>
            <textarea
              value={s.svgContent || ''}
              onChange={e => update({ svgContent: e.target.value })}
              placeholder="<svg>...</svg>"
              rows={4}
              className="w-full text-[10px] bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white placeholder:text-gray-600 resize-none focus:outline-none focus:border-gray-500 font-mono mt-0.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 block">Color Override</label>
              <input type="color" value={s.svgColor || '#3b82f6'} onChange={e => update({ svgColor: e.target.value })} className="w-full h-6 rounded border border-gray-700 cursor-pointer bg-transparent" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block">Opacity</label>
              <Input type="number" step="0.1" min="0" max="1" value={s.svgOpacity ?? 1} onChange={e => update({ svgOpacity: parseFloat(e.target.value) })} className="h-6 text-[10px] bg-gray-900 border-gray-700 text-white" />
            </div>
          </div>
          {s.svgContent && (
            <div className="mt-1 p-2 rounded border border-gray-700 bg-gray-900/50 max-h-20 overflow-hidden">
              <p className="text-[8px] text-gray-600 truncate">{s.svgContent.substring(0, 100)}…</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
