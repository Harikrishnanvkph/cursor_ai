"use client"

import React, { useState, useEffect } from "react"
import { useChartStore } from "@/lib/chart-store"
import { extractPresetFromCurrentChart } from "@/lib/chart-style-engine"
import { dataService } from "@/lib/data-service"
import type { PresetCategory, PresetPublishData } from "@/lib/chart-style-types"
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
import { Palette, Save, Loader2, Tag } from "lucide-react"
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

interface UpdatePresetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  presetId: string
  initialData: {
    name: string
    description: string
    category: PresetCategory
    tags: string[]
    isOfficial: boolean
  } | null
  /** When true, this is a built-in preset not yet in the DB — will CREATE instead of UPDATE */
  isBuiltIn?: boolean
  onSuccess?: (newDbId?: string) => void
}

export function UpdatePresetDialog({ open, onOpenChange, presetId, initialData, isBuiltIn = false, onSuccess }: UpdatePresetDialogProps) {
  const { chartType, chartData, chartConfig } = useChartStore()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<PresetCategory>('minimal')
  const [tags, setTags] = useState('')
  const [isOfficial, setIsOfficial] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // Sync state when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setDescription(initialData.description || '')
      setCategory(initialData.category || 'minimal')
      setTags(initialData.tags ? initialData.tags.join(', ') : '')
      setIsOfficial(initialData.isOfficial !== false)
    }
  }, [initialData])

  const handleUpdate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name for this style')
      return
    }

    setIsUpdating(true)
    try {
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
        isOfficial: isOfficial,
        applyDimensions: true,
      }

      // Extract preset style properties from editor state
      const preset = extractPresetFromCurrentChart(
        chartType as SupportedChartType,
        chartData,
        chartConfig,
        publishData
      )

      if (isBuiltIn) {
        // CREATE a new DB entry for this built-in preset
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
          isOfficial: isOfficial,
          isPublic: isOfficial,
        })

        if (response.error) {
          throw new Error(response.error)
        }

        const newId = response.data?.id || response.data?.[0]?.id
        toast.success(`Built-in preset "${name}" saved to database!`)
        onOpenChange(false)
        onSuccess?.(newId)
      } else {
        // UPDATE existing DB entry
        const response = await dataService.updateChartStylePreset(presetId, {
          name: preset.name,
          description: preset.description,
          chartType: preset.chartType,
          colorStrategy: preset.colorStrategy,
          configSnapshot: preset.configSnapshot,
          datasetStyle: preset.datasetStyle,
          dimensions: preset.dimensions,
          category: preset.category,
          tags: preset.tags,
          isOfficial: isOfficial,
          isPublic: isOfficial,
        })

        if (response.error) {
          throw new Error(response.error)
        }

        toast.success(`Preset "${name}" updated successfully!`)
        onOpenChange(false)
        onSuccess?.()
      }
    } catch (error: any) {
      console.error('Failed to save style preset:', error)
      toast.error(error.message || 'Failed to save preset')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Palette className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg">{isBuiltIn ? 'Save Built-in Preset to Database' : 'Update Style Preset'}</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {isBuiltIn
                  ? 'This is a built-in preset. Saving will create a new database entry that you can manage.'
                  : 'Save the current design configuration back to the original preset database record.'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
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

          {/* Official Toggle (Always true or custom for admin editing) */}
          <div className="flex items-center justify-between p-3 border border-gray-200 bg-gray-50 rounded-lg">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-700">Official Global Preset</span>
              <p className="text-[10px] text-gray-400">Available to all users in the gallery.</p>
            </div>
            <input
              type="checkbox"
              checked={isOfficial}
              onChange={(e) => setIsOfficial(e.target.checked)}
              className="h-4.5 w-4.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={!name.trim() || isUpdating}
            className="h-9 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-750 hover:to-indigo-750 text-white shadow-md"
          >
             {isUpdating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                {isBuiltIn ? 'Saving...' : 'Updating...'}
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {isBuiltIn ? 'Save to Database' : 'Update Preset'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
