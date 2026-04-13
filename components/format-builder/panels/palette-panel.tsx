"use client"

import React from 'react'
import { Plus, Palette } from 'lucide-react'
import { useFormatBuilder } from '../format-builder-context'
import { PanelSection } from './panel-section'

export function PalettePanel() {
  const { skeleton, setPalette } = useFormatBuilder()
  const palette = skeleton.colorPalette

  return (
    <PanelSection title="Color Palette" icon={<Palette className="w-3.5 h-3.5" />}>
      <div className="space-y-2">
        {([
          { key: 'primary',    label: 'Primary' },
          { key: 'secondary',  label: 'Secondary' },
          { key: 'accent',     label: 'Accent' },
          { key: 'text',       label: 'Text' },
          { key: 'background', label: 'Background' },
        ] as const).map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <input
              type="color"
              value={palette[key]}
              onChange={e => setPalette({ [key]: e.target.value })}
              className="w-7 h-7 rounded border border-gray-700 cursor-pointer bg-transparent shrink-0"
            />
            <span className="text-[10px] text-gray-400 flex-1">{label}</span>
            <span className="text-[10px] text-gray-600 font-mono">{palette[key]}</span>
          </div>
        ))}
      </div>
      {/* Chart colors */}
      <div className="mt-3 pt-2 border-t border-gray-800">
        <label className="text-[10px] text-gray-500 uppercase mb-1 block">Chart Colors</label>
        <div className="flex gap-1 flex-wrap">
          {(palette.chartColors || []).map((color, i) => (
            <div key={i} className="relative group">
              <input
                type="color"
                value={color}
                onChange={e => {
                  const arr = [...(palette.chartColors || [])]
                  arr[i] = e.target.value
                  setPalette({ chartColors: arr })
                }}
                className="w-6 h-6 rounded border border-gray-700 cursor-pointer bg-transparent"
              />
              {/* Remove on right-click */}
              <button
                onClick={() => {
                  const arr = [...(palette.chartColors || [])]
                  arr.splice(i, 1)
                  setPalette({ chartColors: arr })
                }}
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 text-white text-[7px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => setPalette({ chartColors: [...(palette.chartColors || []), '#6366f1'] })}
            className="w-6 h-6 rounded border border-dashed border-gray-700 text-gray-600 flex items-center justify-center hover:border-gray-500 hover:text-gray-400 transition-colors"
            title="Add chart color"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    </PanelSection>
  )
}
