"use client"

import React, { useState, useMemo } from "react"
import { useChartStore } from "@/lib/chart-store"
import { extractPresetFromCurrentChart } from "@/lib/chart-style-engine"
import { dataService } from "@/lib/data-service"
import type { PresetCategory, PresetPublishData, ColorMode } from "@/lib/chart-style-types"
import type { SupportedChartType } from "@/lib/chart-defaults"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Palette, Upload, Loader2, AlertTriangle, Eye, Tag } from "lucide-react"
import { toast } from "sonner"

const CATEGORY_OPTIONS: { label: string; value: PresetCategory; color: string }[] = [
  { label: 'Minimal', value: 'minimal', color: 'bg-slate-100 text-slate-600 border-slate-300' },
  { label: 'Bold', value: 'bold', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { label: 'Pastel', value: 'pastel', color: 'bg-pink-100 text-pink-600 border-pink-300' },
  { label: 'Dark', value: 'dark', color: 'bg-gray-800 text-gray-100 border-gray-600' },
  { label: 'Professional', value: 'professional', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { label: '3D', value: '3d', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { label: 'Earthy', value: 'earthy', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { label: 'Gradient', value: 'gradient', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
]

const VISIBILITY_OPTIONS = [
  { label: 'Official (all users)', value: 'official', desc: 'Visible to every user in the gallery' },
  { label: 'My Library', value: 'private', desc: 'Only visible to you' },
]

interface PublishStyleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PublishStyleDialog({ open, onOpenChange }: PublishStyleDialogProps) {
  const { chartType, chartData, chartConfig, hasJSON } = useChartStore()
  const hasChartData = hasJSON && chartData?.datasets?.length > 0

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<PresetCategory>('minimal')
  const [tags, setTags] = useState('')
  const [visibility, setVisibility] = useState<'official' | 'private'>('official')
  const [isPublishing, setIsPublishing] = useState(false)

  // Preview of extracted colors
  const previewColors = useMemo(() => {
    if (!hasChartData) return []
    const ds = chartData.datasets[0]
    if (!ds) return []
    const bg = ds.backgroundColor
    if (Array.isArray(bg)) return bg.slice(0, 8) as string[]
    if (typeof bg === 'string') return [bg]
    return []
  }, [hasChartData, chartData])

  const handlePublish = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name for this style')
      return
    }
    if (!hasChartData) {
      toast.error('No chart data to extract style from')
      return
    }

    setIsPublishing(true)
    try {
      // Build the publish data
      const tagList = tags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean)

      const publishData: PresetPublishData = {
        name: name.trim(),
        description: description.trim() || '',
        category,
        tags: tagList,
        colorMode: (chartData.datasets[0] as any)?.datasetColorMode === 'single' ? 'single' : 'slice',
        isOfficial: visibility === 'official',
        applyDimensions: true, // Always capture dimensions from the current chart
      }

      // Extract the preset using the engine
      const preset = extractPresetFromCurrentChart(
        chartType as SupportedChartType,
        chartData,
        chartConfig,
        publishData
      )

      // Send to backend
      const response = await dataService.createChartStylePreset({
        name: preset.name,
        description: preset.description,
        chartType: preset.chartType,
        colorStrategy: preset.colorStrategy,
        configSnapshot: preset.configSnapshot,
        datasetStyle: preset.datasetStyle,
        dimensions: preset.dimensions,
        category: preset.category,
        tags: preset.tags,
        isOfficial: visibility === 'official',
        isPublic: visibility === 'official',
        sortOrder: 100,
      })

      if (response.error) {
        throw new Error(response.error)
      }

      toast.success(`Style "${name}" published successfully!`)
      onOpenChange(false)

      // Reset form
      setName('')
      setDescription('')
      setCategory('minimal')
      setTags('')
      setVisibility('official')
    } catch (error: any) {
      console.error('Failed to publish style:', error)
      toast.error(error.message || 'Failed to publish style preset')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
              <Palette className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg">Publish as Chart Style</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Extract visual rules from your current chart and publish as a reusable preset.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!hasChartData ? (
          <div className="py-8 flex flex-col items-center gap-3 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-400" />
            <p className="text-sm font-medium text-gray-700">No chart data available</p>
            <p className="text-xs text-gray-400">Create and style a chart first, then come back to publish it.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Color Preview Strip */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Eye className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex gap-1 flex-1">
                {previewColors.map((c, i) => (
                  <div
                    key={i}
                    className="flex-1 h-6 rounded-sm first:rounded-l-md last:rounded-r-md"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-medium text-gray-400 flex-shrink-0 uppercase">
                {chartType}
              </span>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="preset-name" className="text-xs font-semibold text-gray-700">
                Style Name *
              </Label>
              <Input
                id="preset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Neon Dark Bar"
                className="h-9 text-sm"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="preset-desc" className="text-xs font-semibold text-gray-700">
                Description
              </Label>
              <Textarea
                id="preset-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Dark background with vibrant neon accent colors..."
                className="text-sm min-h-[60px] resize-none"
                rows={2}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Category</Label>
              <div className="flex gap-1.5 flex-wrap">
                {CATEGORY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategory(opt.value)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                      category === opt.value
                        ? opt.color + ' shadow-sm'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label htmlFor="preset-tags" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Tag className="w-3 h-3" />
                Tags
              </Label>
              <Input
                id="preset-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="dark, neon, modern (comma-separated)"
                className="h-9 text-sm"
              />
            </div>

            {/* Visibility */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Visibility</Label>
              <div className="grid grid-cols-2 gap-2">
                {VISIBILITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisibility(opt.value as any)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      visibility === opt.value
                        ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-200'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className={`text-xs font-semibold ${visibility === opt.value ? 'text-violet-700' : 'text-gray-700'}`}>
                      {opt.label}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={!hasChartData || !name.trim() || isPublishing}
            className="h-9 text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-md"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Publish Style
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
