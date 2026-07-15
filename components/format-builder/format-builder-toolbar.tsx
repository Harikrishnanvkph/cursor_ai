"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ZoomIn, ZoomOut, Hand,
  Grid3X3, ArrowLeft, Save, X, Search, Info,
} from 'lucide-react'
import { useFormatBuilder } from './format-builder-context'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Slider } from '@/components/ui/slider'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { CATEGORY_OPTIONS } from './format-builder-utils'
import type { FormatCategory } from '@/lib/format-types'

const ZOOM_VALUES: number[] = (() => {
  let values: number[] = [];
  for (let i = 10; i <= 50; i += 1) values.push(i);
  for (let i = 52; i <= 100; i += 2) values.push(i);
  for (let i = 103; i <= 160; i += 3) values.push(i);
  for (let i = 165; i <= 210; i += 5) values.push(i);
  for (let i = 216; i <= 300; i += 6) values.push(i);
  for (let i = 310; i <= 380; i += 10) values.push(i);
  for (let i = 392; i <= 500; i += 12) values.push(i);
  return values;
})();
import { useRouter } from 'next/navigation'
import { dataService } from '@/lib/data-service'
import { toast } from 'sonner'
import { useDecorationStore } from '@/lib/stores/decoration-store'
import { useFormatGalleryStore } from '@/lib/stores/format-gallery-store'
import { decorationFileRegistry } from '@/lib/stores/decoration-file-registry'

export function FormatBuilderToolbar() {
  const router = useRouter()
  const {
    skeleton, formatName, setFormatName,
    formatDesc, setFormatDesc,
    category, setCategory,
    tagsInput, setTagsInput,
    sortOrder, setSortOrder,
    zoom, setZoom, showGuides, setShowGuides,
    gridSize, setGridSize,
    panMode, setPanMode,
    setPanOffset,
    isEditing, editFormat,
    adminMode,
    blobRegistry,
  } = useFormatBuilder()

  const [isBusy, setIsBusy] = React.useState(false)
  const [busyMessage, setBusyMessage] = React.useState('')
  const dims = skeleton.dimensions

  const currentZoomPct = Math.round(zoom * 100)

  let closestIndex = 0
  let minDiff = Infinity
  for (let i = 0; i < ZOOM_VALUES.length; i++) {
    const diff = Math.abs(ZOOM_VALUES[i] - currentZoomPct)
    if (diff < minDiff) {
      minDiff = diff
      closestIndex = i
    }
  }

  const handleSliderChange = React.useCallback((value: number[]) => {
    const newZoomPct = ZOOM_VALUES[value[0]]
    setZoom(newZoomPct / 100)
  }, [setZoom])

  const handleZoomIn = React.useCallback(() => {
    setZoom(prev => Math.min(prev + 0.1, 5))
  }, [setZoom])

  const handleZoomOut = React.useCallback(() => {
    setZoom(prev => Math.max(prev - 0.1, 0.1))
  }, [setZoom])

  const handleFitToView = React.useCallback(() => {
    let fitScale = 0.5
    if (typeof window !== 'undefined') {
      const wrapper = document.querySelector('.canvas-wrapper')
      // p-3 padding is 12px on all sides (total 24px horizontal and vertical padding offset)
      const padding = 12
      // Safety buffer of 8px (4px on each side) to prevent rounding/subpixel scrollbars
      const safetyBuffer = 8
      const totalPadding = (padding * 2) + safetyBuffer

      let width = window.innerWidth - 300 // default fallback (300px right sidebar)
      let height = window.innerHeight - 49 // default fallback (49px top toolbar)

      if (wrapper) {
        width = wrapper.clientWidth
        height = wrapper.clientHeight
      }

      const availableWidth = Math.max(10, width - totalPadding)
      const availableHeight = Math.max(10, height - totalPadding)

      const scaleX = availableWidth / dims.width
      const scaleY = availableHeight / dims.height
      fitScale = Math.min(scaleX, scaleY, 1.0)
    } else {
      fitScale = Math.min(0.85, 600 / Math.max(dims.width, dims.height))
    }
    setZoom(fitScale)
    setPanOffset({ x: 0, y: 0 })
  }, [dims.width, dims.height, setZoom, setPanOffset])

  const handleFullDimension = React.useCallback(() => {
    setZoom(1.0)
    setPanOffset({ x: 0, y: 0 })
  }, [setZoom, setPanOffset])

  // Auto-fit on initial mount to ensure canvas fits perfectly on the screen
  const hasAutoFitted = React.useRef(false)
  React.useEffect(() => {
    if (!hasAutoFitted.current && dims.width > 0 && dims.height > 0) {
      hasAutoFitted.current = true
      // Use setTimeout to let the DOM layout settle
      const timer = setTimeout(() => {
        handleFitToView()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [dims.width, dims.height, handleFitToView])

  // Convert a File object to a base64 data URI (one-time conversion at save time)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Check if a URL is a local image (blob or base64) that needs uploading
  const isLocalImage = (url: string | undefined): boolean => {
    return !!url && (url.startsWith('data:image/') || url.startsWith('blob:'))
  }

  // Resolve a local image URL to base64 for upload
  const resolveLocalImage = async (url: string): Promise<string> => {
    if (url.startsWith('blob:')) {
      let file = blobRegistry.current?.get(url)
      if (!file) {
        file = decorationFileRegistry.get(url)
      }
      if (!file) throw new Error('Blob URL not found in registry — the file may have been revoked')
      return await fileToBase64(file)
    }
    return url // already base64
  }

  const uploadLocalImagesInSkeleton = async (skel: any): Promise<any> => {
    // Deep clone to avoid mutating local state
    const cleanSkeleton = JSON.parse(JSON.stringify(skel))

    // 1. Process zones
    if (cleanSkeleton.zones && Array.isArray(cleanSkeleton.zones)) {
      for (const zone of cleanSkeleton.zones) {
        // Background zone
        if (zone.type === 'background' && zone.style?.type === 'image' && isLocalImage(zone.style?.imageUrl)) {
          const base64 = await resolveLocalImage(zone.style.imageUrl)
          const res = await dataService.uploadImage(base64)
          if (res.data?.publicUrl) {
            zone.style.imageUrl = res.data.publicUrl
          } else {
            throw new Error(res.error || 'Failed to upload background image')
          }
        }
        // Image zone
        if (zone.type === 'image' && isLocalImage(zone.imageUrl)) {
          const base64 = await resolveLocalImage(zone.imageUrl)
          const res = await dataService.uploadImage(base64)
          if (res.data?.publicUrl) {
            zone.imageUrl = res.data.publicUrl
          } else {
            throw new Error(res.error || 'Failed to upload image zone file')
          }
        }
      }
    }

    // 2. Process decorations
    if (cleanSkeleton.decorations && Array.isArray(cleanSkeleton.decorations)) {
      for (const deco of cleanSkeleton.decorations) {
        if (isLocalImage(deco.imageUrl)) {
          const base64 = await resolveLocalImage(deco.imageUrl)
          const res = await dataService.uploadImage(base64)
          if (res.data?.publicUrl) {
            deco.imageUrl = res.data.publicUrl
          } else {
            throw new Error(res.error || 'Failed to upload decoration image')
          }
        }
      }
    }

    return cleanSkeleton
  }

  const handleSave = async () => {
    if (!formatName.trim()) {
      toast.error('Please enter a format name')
      return
    }
    setIsBusy(true)
    setBusyMessage('Uploading images to storage...')
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
      const initialSkeleton = {
        ...skeleton,
        decorations: useDecorationStore.getState().shapes,
        name: formatName,
        description: formatDesc,
        category,
        tags,
        sortOrder,
        isOfficial: adminMode,
        isPublic: adminMode,
      }
      
      const finalSkeleton = await uploadLocalImagesInSkeleton(initialSkeleton)

      setBusyMessage(isEditing ? 'Updating format blueprint...' : 'Creating format blueprint...')

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

      // Force reload the format gallery store cache to fetch the newly created/updated format
      try {
        await useFormatGalleryStore.getState().loadFormats(true)
      } catch (galleryErr) {
        console.error('Failed to reload format gallery store cache:', galleryErr)
      }

      toast.success(isEditing ? 'Format updated!' : 'Format created!')
      router.push(adminMode ? '/admin/formats' : '/editor')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setIsBusy(false)
      setBusyMessage('')
    }
  }

  const handleCancel = () => router.push(adminMode ? '/admin/formats' : '/editor')

  return (
    <>
      {/* Busy overlay */}
      {isBusy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
          <div className="flex items-center gap-3 rounded-xl bg-gray-900 px-6 py-4 shadow-2xl border border-gray-700">
            <div className="h-5 w-5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            <span className="text-sm font-medium text-gray-200">
              {busyMessage || (isEditing ? 'Updating…' : 'Creating…')}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-950 shrink-0">
        {/* Left: Nav + Zoom + Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCancel}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-0 focus-visible:ring-0"
            title="Back to Formats"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-gray-800 mx-1" />

          {/* Custom Zoom Dropdown */}
          <div className="flex items-center flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] font-semibold text-gray-400 hover:text-white hover:bg-gray-800 select-none justify-start gap-1 rounded flex-shrink-0 transition-colors [&_svg]:size-3.5 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                  <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span className="font-mono tabular-nums">{currentZoomPct}%</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 p-2 z-[150] bg-gray-900 border-gray-800 text-gray-200" onCloseAutoFocus={(e) => e.preventDefault()}>
                <DropdownMenuItem onClick={handleFitToView} className="text-xs py-1.5 cursor-pointer font-medium text-gray-300 hover:text-white focus:bg-gray-800 focus:text-white">
                  <span className="flex-1">100% (Fit to View)</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleFullDimension} className="text-xs py-1.5 cursor-pointer font-medium text-gray-300 hover:text-white focus:bg-gray-800 focus:text-white">
                  <span className="flex-1">Full Dimension</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 border-gray-800" />

                <div className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <Slider
                    min={0}
                    max={ZOOM_VALUES.length - 1}
                    step={1}
                    value={[closestIndex]}
                    onValueChange={handleSliderChange}
                    className="cursor-pointer"
                  />
                </div>

                <DropdownMenuSeparator className="my-1 border-gray-800" />
                <div className="flex items-center justify-between gap-1 px-1">
                  <DropdownMenuItem
                    onSelect={(e) => { e.preventDefault(); handleZoomOut(); }}
                    className="flex-1 flex items-center justify-center py-2 cursor-pointer focus:bg-gray-800 text-gray-400 hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </DropdownMenuItem>
                  <div className="w-[1px] h-4 bg-gray-800" />
                  <DropdownMenuItem
                    onSelect={(e) => { e.preventDefault(); handleZoomIn(); }}
                    className="flex-1 flex items-center justify-center py-2 cursor-pointer focus:bg-gray-800 text-gray-400 hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="w-px h-5 bg-gray-800 mx-1" />

          {/* Grid Visibility & Snap size */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGuides(g => !g)}
              className={`h-7 w-7 p-0 ${showGuides ? 'text-blue-400 bg-gray-800' : 'text-gray-500'} hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0`}
              title={showGuides ? 'Hide grid' : 'Show grid'}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <select
              value={gridSize}
              onChange={e => setGridSize(parseInt(e.target.value))}
              className="h-6 text-[10px] bg-transparent border border-gray-700 rounded px-1 text-gray-400 focus:outline-none focus:ring-0 focus-visible:ring-0"
              title="Grid snap size"
            >
              <option value="0">Off</option>
              <option value="5">5px</option>
              <option value="10">10px</option>
              <option value="20">20px</option>
              <option value="50">50px</option>
            </select>
          </div>

          <div className="w-px h-5 bg-gray-800 mx-1" />

          {/* Pan Tool */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPanMode(prev => {
                const next = !prev
                if (next) {
                  useDecorationStore.setState({ drawingMode: null })
                }
                return next
              })
            }}
            className={`h-7 w-7 p-0 ${panMode ? 'text-blue-400 bg-gray-800' : 'text-gray-500'} hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0`}
            title={panMode ? 'Disable pan tool' : 'Enable pan tool'}
          >
            <Hand className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Right: Name + Actions */}
        <div className="flex items-center gap-2">
          {/* Format Info Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 bg-gray-900 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 rounded focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex items-center gap-1.5 text-xs font-medium"
                title="Format Info"
              >
                <Info className="h-3.5 w-3.5" />
                <span>Info</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-4 bg-gray-900 border-gray-800 text-gray-200 z-[150] shadow-2xl rounded-lg">
              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wider">Format Info</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase mb-1 block">Description</label>
                  <textarea
                    value={formatDesc}
                    onChange={e => setFormatDesc(e.target.value)}
                    placeholder="Brief description…"
                    rows={3}
                    className="w-full text-xs bg-gray-950 border border-gray-850 rounded-md px-2 py-1.5 text-white placeholder:text-gray-600 resize-none focus:outline-none focus:border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase mb-1 block">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as FormatCategory)}
                    className="w-full h-8 text-xs bg-gray-950 border border-gray-850 rounded-md px-2 text-white focus:outline-none focus:border-gray-700"
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase mb-1 block">Tags (comma-separated)</label>
                  <Input
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    placeholder="dark, stats, minimal"
                    className="h-8 text-xs bg-gray-950 border-gray-850 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-gray-700 focus:border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase mb-1 block">Sort Order</label>
                  <Input
                    type="number"
                    value={sortOrder}
                    onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
                    className="h-8 text-xs bg-gray-950 border-gray-850 text-white w-20 focus-visible:ring-1 focus-visible:ring-gray-700 focus:border-gray-700"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Input
            value={formatName}
            onChange={e => setFormatName(e.target.value)}
            placeholder="Format name"
            className="h-8 w-[200px] text-sm bg-gray-900 border-gray-700 text-white placeholder:text-gray-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-700"
            disabled={isBusy}
          />
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isBusy} className="h-8 text-xs text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
            <X className="h-3.5 w-3.5 mr-1" /> Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isBusy} className="h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
            <Save className="h-3.5 w-3.5 mr-1" /> {isEditing ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </>
  )
}
