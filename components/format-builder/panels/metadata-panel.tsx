"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Layers } from 'lucide-react'
import { useFormatBuilder } from '../format-builder-context'
import { CATEGORY_OPTIONS } from '../format-builder-utils'
import { PanelSection } from './panel-section'
import type { FormatCategory } from '@/lib/format-types'

export function MetadataPanel() {
  const { formatDesc, setFormatDesc, category, setCategory, tagsInput, setTagsInput, sortOrder, setSortOrder } = useFormatBuilder()

  return (
    <PanelSection title="Format Info" icon={<Layers className="w-3.5 h-3.5" />}>
      <div className="space-y-2">
        <div>
          <label className="text-[10px] text-gray-500 uppercase mb-0.5 block">Description</label>
          <textarea
            value={formatDesc}
            onChange={e => setFormatDesc(e.target.value)}
            placeholder="Brief description…"
            rows={2}
            className="w-full text-xs bg-gray-900 border border-gray-700 rounded-md px-2 py-1.5 text-white placeholder:text-gray-600 resize-none focus:outline-none focus:border-gray-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 uppercase mb-0.5 block">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as FormatCategory)}
            className="w-full h-7 text-xs bg-gray-900 border border-gray-700 rounded-md px-2 text-white focus:outline-none focus:border-gray-500"
          >
            {CATEGORY_OPTIONS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 uppercase mb-0.5 block">Tags (comma-separated)</label>
          <Input
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            placeholder="dark, stats, minimal"
            className="h-7 text-xs bg-gray-900 border-gray-700 text-white placeholder:text-gray-600"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 uppercase mb-0.5 block">Sort Order</label>
          <Input
            type="number"
            value={sortOrder}
            onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
            className="h-7 text-xs bg-gray-900 border-gray-700 text-white w-20"
          />
        </div>
      </div>
    </PanelSection>
  )
}
