"use client"

import React from "react"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { LayoutGrid, Type, Hash, BarChart3, Image, Sparkles } from "lucide-react"

const ZONE_TYPE_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  text:       { icon: <Type className="h-3.5 w-3.5" />, color: 'bg-green-100 text-green-700 border-green-200', label: 'Text' },
  stat:       { icon: <Hash className="h-3.5 w-3.5" />, color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Stat' },
  chart:      { icon: <BarChart3 className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Chart' },
  background: { icon: <Image className="h-3.5 w-3.5" />, color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Background' },
  decoration: { icon: <Sparkles className="h-3.5 w-3.5" />, color: 'bg-pink-100 text-pink-700 border-pink-200', label: 'Decoration' },
}

export function FormatZonesPanel() {
  const { selectedFormatId, contentPackage, setContentPackage, formats, selectedZoneId, setSelectedZoneId } = useFormatGalleryStore()

  if (!selectedFormatId) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>No format selected.</p>
        <p className="text-xs mt-1 text-gray-400">Select a format from the Templates tab.</p>
      </div>
    )
  }

  const format = formats.find(f => f.id === selectedFormatId)
  if (!format) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>Format not found.</p>
      </div>
    )
  }

  const skeleton = format.skeleton as any
  const zones = skeleton?.zones || []

  if (zones.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>This format has no editable zones.</p>
      </div>
    )
  }

  // Group zones by type
  const groupedZones: Record<string, any[]> = {}
  zones.forEach((zone: any) => {
    const type = zone.type || 'unknown'
    if (!groupedZones[type]) groupedZones[type] = []
    groupedZones[type].push(zone)
  })

  const handleContentPackageChange = (key: string, value: any) => {
    if (!contentPackage) return
    setContentPackage({
      ...contentPackage,
      [key]: value,
    })
  }

  const getStatIndex = (role: string) => {
    switch(role) {
      case 'highlight': return 0;
      case 'secondary': return 1;
      case 'tertiary': return 2;
      default: return 0;
    }
  }

  const getStatValue = (role: string, field: 'value' | 'label') => {
    if (!contentPackage?.stats) return ''
    const idx = getStatIndex(role)
    return contentPackage.stats[idx]?.[field] || ''
  }

  const handleStatChange = (role: string, field: 'value' | 'label', val: string) => {
    if (!contentPackage) return
    const stats = [...(contentPackage.stats || [])]
    const idx = getStatIndex(role)
    // Fill empty stats if necessary
    while (stats.length <= idx) {
      stats.push({ value: '', label: '' })
    }
    stats[idx] = { ...stats[idx], [field]: val }
    setContentPackage({ ...contentPackage, stats })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <LayoutGrid className="h-4 w-4 text-purple-600" />
        Format Zones ({zones.length})
      </h3>

      {/* Format Info */}
      <div className="bg-gray-50 rounded-lg p-2.5 text-xs border border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-700">{format.name}</span>
          <span className="text-gray-400">{format.dimensions.width}×{format.dimensions.height}</span>
        </div>
        <p className="text-gray-500 text-[10px] leading-relaxed">{format.description || 'No description'}</p>
      </div>

      {/* Zone Groups */}
      {Object.entries(groupedZones).map(([type, typeZones]) => {
        const meta = ZONE_TYPE_META[type] || { icon: null, color: 'bg-gray-100 text-gray-700', label: type }
        return (
          <div key={type} className="space-y-2">
            <div className="flex items-center gap-2 mt-4 mb-2">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${meta.color}`}>
                {meta.icon}
                {meta.label}
              </span>
              <span className="text-[10px] text-gray-400">({typeZones.length})</span>
            </div>

            {typeZones.map((zone: any, idx: number) => {
              const zoneLabel = zone.role || zone.id || `${meta.label} ${idx + 1}`
              
              return (
                <div
                  key={zone.id || `${type}-${idx}`}
                  className={`border rounded-lg p-2.5 bg-white text-xs space-y-2 shadow-sm cursor-pointer transition-all ${
                    selectedZoneId === zone.id
                      ? 'border-blue-400 ring-2 ring-blue-200 bg-blue-50/30'
                      : 'border-gray-200 hover:border-blue-200 hover:shadow-md'
                  }`}
                  onClick={() => zone.id && setSelectedZoneId(zone.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700 uppercase tracking-wider text-[10px]">
                      {zoneLabel}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {Math.round(zone.bounds?.width || 0)} × {Math.round(zone.bounds?.height || 0)}
                    </span>
                  </div>

                  {/* Editable fields based on zone type */}
                  {type === 'text' && (
                    <div>
                      <textarea
                        value={(contentPackage as any)?.[zone.role] || ''}
                        onChange={(e) => handleContentPackageChange(zone.role, e.target.value)}
                        placeholder={`Enter ${zone.role}...`}
                        className="w-full min-h-[40px] text-[12px] border border-gray-200 rounded p-2 resize-y bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-300"
                        rows={zone.role === 'body' ? 3 : 1}
                      />
                    </div>
                  )}

                  {type === 'stat' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-gray-400 mb-0.5">Metric / Value</Label>
                        <Input
                          value={getStatValue(zone.role, 'value')}
                          onChange={(e) => handleStatChange(zone.role, 'value', e.target.value)}
                          placeholder="e.g. 50%"
                          className="h-8 text-[12px] bg-white border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-400 mb-0.5">Description / Label</Label>
                        <Input
                          value={getStatValue(zone.role, 'label')}
                          onChange={(e) => handleStatChange(zone.role, 'label', e.target.value)}
                          placeholder="e.g. Growth Rate"
                          className="h-8 text-[12px] bg-white border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {type === 'background' && zone.style?.imageUrl && (
                    <div className="mt-2">
                      <Label className="text-[10px] text-gray-400 mb-1">Background Image</Label>
                      <div
                        className="h-16 rounded border border-gray-200 bg-cover bg-center overflow-hidden"
                        style={{ backgroundImage: `url(${zone.style.imageUrl})` }}
                      />
                    </div>
                  )}
                  
                  {type === 'chart' && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50/50 rounded text-blue-700/80 border border-blue-100">
                      <BarChart3 className="h-4 w-4" />
                      <span className="text-[11px]">Chart driven by active Dataset</span>
                    </div>
                  )}
                  
                  {type === 'decoration' && (
                     <div className="flex items-center gap-2 p-2 bg-pink-50/50 rounded text-pink-700/80 border border-pink-100">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-[11px]">Static decoration graphic</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
