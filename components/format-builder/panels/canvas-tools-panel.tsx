"use client"

import React from 'react'
import {
  AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  Wrench,
} from 'lucide-react'
import { useFormatBuilder } from '../format-builder-context'
import { PanelSection } from './panel-section'

export function CanvasToolsPanel() {
  const { selectedZoneId, alignZone } = useFormatBuilder()
  const disabled = !selectedZoneId

  return (
    <PanelSection title="Canvas Tools" icon={<Wrench className="w-3.5 h-3.5" />}>
      <div className="space-y-2">
        {/* Align */}
        <div>
          <label className="text-[10px] text-gray-500 uppercase mb-1 block">
            Align to Canvas {disabled && <span className="text-gray-600">(select a zone)</span>}
          </label>
          <div className="flex gap-1">
            {([
              { key: 'left',     icon: AlignHorizontalJustifyStart, title: 'Align Left' },
              { key: 'center-h', icon: AlignHorizontalJustifyCenter, title: 'Center Horizontal' },
              { key: 'right',    icon: AlignHorizontalJustifyEnd, title: 'Align Right' },
              { key: 'top',      icon: AlignVerticalJustifyStart, title: 'Align Top' },
              { key: 'center-v', icon: AlignVerticalJustifyCenter, title: 'Center Vertical' },
              { key: 'bottom',   icon: AlignVerticalJustifyEnd, title: 'Align Bottom' },
            ] as const).map(({ key, icon: Icon, title }) => (
              <button
                key={key}
                onClick={() => alignZone(key)}
                disabled={disabled}
                className={`p-1.5 rounded border transition-colors ${
                  disabled
                    ? 'border-gray-800 text-gray-700 cursor-not-allowed'
                    : 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white hover:border-gray-600'
                }`}
                title={title}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </PanelSection>
  )
}
