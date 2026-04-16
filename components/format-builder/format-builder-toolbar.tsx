"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ZoomIn, ZoomOut, Eye, EyeOff, Maximize2,
  Grid3X3, ArrowLeft, Save, X,
} from 'lucide-react'
import { useFormatBuilder } from './format-builder-context'
import { useRouter } from 'next/navigation'
import { dataService } from '@/lib/data-service'
import { toast } from 'sonner'

export function FormatBuilderToolbar() {
  const router = useRouter()
  const {
    skeleton, formatName, setFormatName, formatDesc, category,
    tagsInput, sortOrder,
    zoom, setZoom, showGuides, setShowGuides,
    gridSize, setGridSize,
    isEditing, editFormat,
    adminMode,
  } = useFormatBuilder()

  const [isBusy, setIsBusy] = React.useState(false)
  const dims = skeleton.dimensions

  const handleSave = async () => {
    if (!formatName.trim()) {
      toast.error('Please enter a format name')
      return
    }
    setIsBusy(true)
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
      const finalSkeleton = {
        ...skeleton,
        name: formatName,
        description: formatDesc,
        category,
        tags,
        sortOrder,
        isOfficial: adminMode,
        isPublic: adminMode,
      }
      const payload = {
        name: formatName,
        description: formatDesc,
        category,
        skeleton: finalSkeleton,
        dimensions: skeleton.dimensions,
        tags,
        isOfficial: adminMode,
        isPublic: adminMode,
        sortOrder,
      }
      const res = isEditing && editFormat?.id
        ? await dataService.updateFormat(editFormat.id, payload)
        : await dataService.createFormat(payload)
      if (res.error) throw new Error(res.error)
      toast.success(isEditing ? 'Format updated!' : 'Format created!')
      router.push(adminMode ? '/admin/formats' : '/editor')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setIsBusy(false)
    }
  }

  const handleCancel = () => router.push(adminMode ? '/admin/formats' : '/editor')

  return (
    <>
      {/* Busy overlay */}
      {isBusy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
          <div className="flex items-center gap-3 rounded-xl bg-gray-900 px-6 py-4 shadow-2xl border border-gray-700">
            <div className="h-5 w-5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            <span className="text-sm font-medium text-gray-200">
              {isEditing ? 'Updating…' : 'Creating…'}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm shrink-0">
        {/* Left: Nav + Zoom + Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCancel}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title="Back to Formats"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-gray-800 mx-1" />

          {/* Zoom */}
          <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(0.15, z - 0.05))} className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-gray-800">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[10px] text-gray-500 w-9 text-center font-mono select-none">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(1.5, z + 0.05))} className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-gray-800">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-5 bg-gray-800 mx-1" />

          {/* Guides */}
          <Button variant="ghost" size="sm" onClick={() => setShowGuides(g => !g)} className={`h-7 w-7 p-0 ${showGuides ? 'text-blue-400' : 'text-gray-500'} hover:text-white hover:bg-gray-800`} title={showGuides ? 'Hide guides' : 'Show guides'}>
            {showGuides ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </Button>

          {/* Grid size */}
          <div className="flex items-center gap-1 ml-1">
            <Grid3X3 className="h-3 w-3 text-gray-500" />
            <select
              value={gridSize}
              onChange={e => setGridSize(parseInt(e.target.value))}
              className="h-6 text-[10px] bg-transparent border border-gray-700 rounded px-1 text-gray-400 focus:outline-none"
              title="Grid snap size"
            >
              <option value="0">Off</option>
              <option value="5">5px</option>
              <option value="10">10px</option>
              <option value="20">20px</option>
              <option value="50">50px</option>
            </select>
          </div>

          {/* Fit to view */}
          <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(0.8, 600 / Math.max(dims.width, dims.height)))} className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-gray-800" title="Fit to view">
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Right: Name + Actions */}
        <div className="flex items-center gap-2">
          <Input
            value={formatName}
            onChange={e => setFormatName(e.target.value)}
            placeholder="Format name"
            className="h-8 w-[200px] text-sm bg-gray-900 border-gray-700 text-white placeholder:text-gray-600"
            disabled={isBusy}
          />
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isBusy} className="h-8 text-xs text-gray-400 hover:text-white hover:bg-gray-800">
            <X className="h-3.5 w-3.5 mr-1" /> Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isBusy} className="h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white">
            <Save className="h-3.5 w-3.5 mr-1" /> {isEditing ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </>
  )
}
