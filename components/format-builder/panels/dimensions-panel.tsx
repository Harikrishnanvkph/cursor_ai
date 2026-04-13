"use client"

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Maximize2 } from 'lucide-react'
import { useFormatBuilder } from '../format-builder-context'
import { DIMENSION_PRESETS } from '../format-builder-utils'
import { PanelSection } from './panel-section'

export function DimensionsPanel() {
  const { skeleton, setDimensions } = useFormatBuilder()
  const dims = skeleton.dimensions

  // Local input state for proper editing
  const [widthInput, setWidthInput] = useState(String(dims.width))
  const [heightInput, setHeightInput] = useState(String(dims.height))
  const [error, setError] = useState('')

  // Sync when dims change externally (e.g., preset click)
  React.useEffect(() => {
    setWidthInput(String(dims.width))
    setHeightInput(String(dims.height))
  }, [dims.width, dims.height])

  const commitWidth = () => {
    const v = parseInt(widthInput)
    if (isNaN(v) || v < 200) {
      setError('Width must be ≥ 200px')
      setWidthInput(String(dims.width))
      setTimeout(() => setError(''), 2500)
      return
    }
    if (v > 4000) {
      setError('Width cannot exceed 4000px')
      setWidthInput(String(dims.width))
      setTimeout(() => setError(''), 2500)
      return
    }
    setError('')
    const aspect = `${v}:${dims.height}`
    setDimensions(v, dims.height, aspect, 'Custom')
  }

  const commitHeight = () => {
    const v = parseInt(heightInput)
    if (isNaN(v) || v < 200) {
      setError('Height must be ≥ 200px')
      setHeightInput(String(dims.height))
      setTimeout(() => setError(''), 2500)
      return
    }
    if (v > 4000) {
      setError('Height cannot exceed 4000px')
      setHeightInput(String(dims.height))
      setTimeout(() => setError(''), 2500)
      return
    }
    setError('')
    const aspect = `${dims.width}:${v}`
    setDimensions(dims.width, v, aspect, 'Custom')
  }

  return (
    <PanelSection title="Canvas Size" icon={<Maximize2 className="w-3.5 h-3.5" />} defaultOpen>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="text-[10px] text-gray-500 uppercase mb-0.5 block">Width (px)</label>
          <Input
            type="number"
            value={widthInput}
            onChange={e => setWidthInput(e.target.value)}
            onBlur={commitWidth}
            onKeyDown={e => e.key === 'Enter' && commitWidth()}
            className="h-7 text-xs bg-gray-900 border-gray-700 text-white"
            min={200} max={4000}
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 uppercase mb-0.5 block">Height (px)</label>
          <Input
            type="number"
            value={heightInput}
            onChange={e => setHeightInput(e.target.value)}
            onBlur={commitHeight}
            onKeyDown={e => e.key === 'Enter' && commitHeight()}
            className="h-7 text-xs bg-gray-900 border-gray-700 text-white"
            min={200} max={4000}
          />
        </div>
      </div>

      {error && (
        <p className="text-[10px] text-red-400 mb-1.5">{error}</p>
      )}

      {/* Presets */}
      <div className="flex gap-1 flex-wrap">
        {DIMENSION_PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => setDimensions(p.width, p.height, p.aspect, p.label)}
            className={`px-2 py-1 rounded text-[10px] font-medium border transition-all ${
              dims.width === p.width && dims.height === p.height
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                : 'bg-gray-800/50 text-gray-500 border-gray-700/50 hover:border-gray-600 hover:text-gray-300'
            }`}
            title={`${p.width}×${p.height}`}
          >
            {p.tag}
          </button>
        ))}
      </div>
    </PanelSection>
  )
}
