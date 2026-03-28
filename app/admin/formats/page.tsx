"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { useRouter } from "next/navigation"
import { dataService } from "@/lib/data-service"
import { defaultFormats } from "@/lib/format-defaults"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Layers, Plus, Globe, Trash2, ArrowLeft, Upload,
  Maximize2, BarChart3, Type, Hash, Image, Shapes
} from "lucide-react"
import { toast } from "sonner"

// Zone type → color mapping for skeleton preview
const ZONE_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  chart:      { bg: 'rgba(59, 130, 246, 0.25)', border: '#3b82f6', label: 'Chart' },
  text:       { bg: 'rgba(16, 185, 129, 0.2)',  border: '#10b981', label: 'Text' },
  stat:       { bg: 'rgba(245, 158, 11, 0.25)', border: '#f59e0b', label: 'Stat' },
  background: { bg: 'rgba(139, 92, 246, 0.15)', border: '#8b5cf6', label: 'BG' },
  decoration: { bg: 'rgba(236, 72, 153, 0.15)', border: '#ec4899', label: 'Deco' },
}

// Zone type → icon mapping
const ZONE_ICONS: Record<string, React.ReactNode> = {
  chart: <BarChart3 className="w-3 h-3" />,
  text: <Type className="w-3 h-3" />,
  stat: <Hash className="w-3 h-3" />,
  background: <Image className="w-3 h-3" />,
  decoration: <Shapes className="w-3 h-3" />,
}

// Category badge colors
const CATEGORY_COLORS: Record<string, string> = {
  infographic:  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  social:       'bg-pink-500/20 text-pink-400 border-pink-500/30',
  report:       'bg-blue-500/20 text-blue-400 border-blue-500/30',
  presentation: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  template:     'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
}

interface FormatRow {
  id: string
  name: string
  description: string | null
  category: string
  skeleton: any
  dimensions: { width: number; height: number; aspect: string; label: string }
  tags: string[]
  is_official: boolean
  is_public: boolean
  sort_order: number
  created_at: string
}

export default function AdminFormatsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [formats, setFormats] = useState<FormatRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [formatToDelete, setFormatToDelete] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (user && !user.is_admin) {
      router.push('/')
      return
    }
    fetchFormats()
  }, [user, router])

  const fetchFormats = async () => {
    try {
      setIsLoading(true)
      const res = await dataService.getFormats()
      if (res.error) throw new Error(res.error)
      setFormats(res.data || [])
    } catch (err) {
      console.error("Failed to fetch formats:", err)
      toast.error("Failed to load formats")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSeedDefaults = async () => {
    try {
      setIsSeeding(true)
      const formatsToSeed = defaultFormats.map(f => ({
        name: f.name,
        description: f.description,
        category: f.category,
        skeleton: f,  // Store the entire FormatSkeleton as the skeleton JSONB
        dimensions: f.dimensions,
        tags: f.tags,
        isOfficial: true,
        isPublic: true,
        sortOrder: f.sortOrder || 0
      }))
      const res = await dataService.bulkCreateFormats(formatsToSeed)
      if (res.error) throw new Error(res.error)
      toast.success(`${res.data?.count || formatsToSeed.length} formats seeded successfully!`)
      fetchFormats()
    } catch (err: any) {
      console.error("Failed to seed formats:", err)
      toast.error(err.message || "Failed to seed formats")
    } finally {
      setIsSeeding(false)
    }
  }

  const handlePushOfficial = async (id: string, isOfficial: boolean) => {
    try {
      const res = await dataService.setFormatOfficial(id, isOfficial)
      if (res.error) throw new Error(res.error)
      toast.success(isOfficial ? "Format pushed globally!" : "Format removed from global scope")
      fetchFormats()
    } catch (err) {
      console.error("Failed to update format status:", err)
      toast.error("Failed to update official status")
    }
  }

  const handleDeleteClick = (id: string) => {
    setFormatToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!formatToDelete) return
    try {
      const res = await dataService.deleteFormat(formatToDelete)
      if (res.error) throw new Error(res.error)
      toast.success("Format deleted")
      fetchFormats()
    } catch (err: any) {
      console.error("Delete failed:", err)
      toast.error(err.message || "Failed to delete format")
    } finally {
      setDeleteConfirmOpen(false)
      setFormatToDelete(null)
    }
  }

  // Filter formats by category
  const filteredFormats = filter === 'all' ? formats : formats.filter(f => f.category === filter)
  const categories = ['all', ...new Set(formats.map(f => f.category))]

  return (
    <div className="min-h-screen bg-black text-gray-100 p-4 pt-6">
      <div className="px-2 mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              title="Back to Admin"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                Format Blueprint Manager
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Manage format skeletons for the multi-format chart gallery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {formats.length === 0 && (
              <Button
                onClick={handleSeedDefaults}
                disabled={isSeeding}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isSeeding ? 'Seeding...' : `Seed ${defaultFormats.length} Defaults`}
              </Button>
            )}
          </div>
        </div>

        {/* Category Filter Tabs */}
        {formats.length > 0 && (
          <div className="flex gap-2 mb-5 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                  filter === cat
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                    : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-700'
                }`}
              >
                {cat} {cat !== 'all' && `(${formats.filter(f => f.category === cat).length})`}
                {cat === 'all' && ` (${formats.length})`}
              </button>
            ))}
          </div>
        )}

        {/* Format Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFormats.map(format => (
              <FormatCard
                key={format.id}
                format={format}
                onPushOfficial={handlePushOfficial}
                onDelete={handleDeleteClick}
              />
            ))}

            {filteredFormats.length === 0 && (
              <div className="col-span-full py-16 text-center text-gray-400 bg-gray-900/50 rounded-xl border border-dashed border-gray-800">
                <Layers className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="mb-2">
                  {formats.length === 0
                    ? 'No formats found. Seed the defaults to get started.'
                    : `No formats in "${filter}" category.`}
                </p>
                {formats.length === 0 && (
                  <Button
                    onClick={handleSeedDefaults}
                    disabled={isSeeding}
                    variant="outline"
                    className="mt-3 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Seed {defaultFormats.length} Default Formats
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <ConfirmDialog
          open={deleteConfirmOpen}
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Format"
          description="Are you sure? This format will be removed from the gallery for all users if it is official."
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </div>
  )
}

// ============================
// Format Card Component
// ============================

function FormatCard({
  format,
  onPushOfficial,
  onDelete,
}: {
  format: FormatRow
  onPushOfficial: (id: string, isOfficial: boolean) => void
  onDelete: (id: string) => void
}) {
  const skeleton = format.skeleton
  const zones = skeleton?.zones || []
  const dims = format.dimensions
  const palette = skeleton?.colorPalette

  // Calculate scale for skeleton preview
  const containerW = 260
  const containerH = 180
  const scale = Math.min(containerW / dims.width, containerH / dims.height, 1)

  // Count zones by type
  const zoneCounts: Record<string, number> = {}
  zones.forEach((z: any) => {
    zoneCounts[z.type] = (zoneCounts[z.type] || 0) + 1
  })

  return (
    <Card className="bg-gray-900 border-gray-800 flex flex-col hover:border-orange-500/30 transition-colors group">
      <CardContent className="p-3 flex-1 flex flex-col">
        {/* Header Row */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-400 shrink-0" />
              <h3 className="font-semibold text-sm text-white truncate">{format.name}</h3>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${CATEGORY_COLORS[format.category] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                {format.category}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700 flex items-center gap-1">
                <Maximize2 className="w-2.5 h-2.5" />
                {dims.width}×{dims.height}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-500 border border-gray-700">
                {dims.aspect}
              </span>
            </div>
          </div>
          {format.is_official && (
            <span className="flex items-center text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0 ml-2">
              <Globe className="w-2.5 h-2.5 mr-1" /> Official
            </span>
          )}
        </div>

        {/* Skeleton Preview */}
        <div className="relative w-full h-44 mb-2 bg-gray-950/50 rounded-md border border-gray-800 overflow-hidden shrink-0 flex items-center justify-center">
          <div
            className="relative rounded-sm overflow-hidden"
            style={{
              width: dims.width * scale,
              height: dims.height * scale,
              backgroundColor: palette?.background || 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* Render each zone as a colored placeholder */}
            {zones
              .filter((z: any) => z.position)
              .map((zone: any) => {
                const colors = ZONE_COLORS[zone.type] || ZONE_COLORS.decoration
                return (
                  <div
                    key={zone.id}
                    className="absolute flex items-center justify-center text-[8px] font-medium"
                    style={{
                      left: zone.position.x * scale,
                      top: zone.position.y * scale,
                      width: zone.position.width * scale,
                      height: zone.position.height * scale,
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      color: colors.border,
                      overflow: 'hidden',
                    }}
                    title={`${zone.type}: ${zone.role || zone.subtype || zone.id}`}
                  >
                    {zone.position.width * scale > 30 && zone.position.height * scale > 15 && (
                      <span className="truncate px-0.5 opacity-80">
                        {zone.role || zone.subtype || zone.type}
                      </span>
                    )}
                  </div>
                )
              })}
          </div>
        </div>

        {/* Zone Summary */}
        <div className="flex gap-1.5 flex-wrap mb-2">
          {Object.entries(zoneCounts).map(([type, count]) => {
            const colors = ZONE_COLORS[type] || ZONE_COLORS.decoration
            return (
              <span
                key={type}
                className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border + '40',
                  color: colors.border
                }}
              >
                {ZONE_ICONS[type]}
                {count}
              </span>
            )
          })}
        </div>

        {/* Color Palette Preview */}
        {palette && (
          <div className="flex gap-0.5 mb-2">
            {[palette.primary, palette.secondary, palette.accent, palette.text, palette.background].map((color: string, i: number) => (
              <div
                key={i}
                className="h-3 flex-1 rounded-sm first:rounded-l last:rounded-r"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}

        {/* Description */}
        <p className="text-[11px] text-gray-500 flex-1 line-clamp-2 mb-3">
          {format.description || "No description."}
        </p>

        {/* Tags */}
        {format.tags?.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-3">
            {format.tags.slice(0, 4).map(tag => (
              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800/50 text-gray-500 border border-gray-800">
                #{tag}
              </span>
            ))}
            {format.tags.length > 4 && (
              <span className="text-[9px] text-gray-600">+{format.tags.length - 4}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-3 border-t border-gray-800">
          <Button
            variant={format.is_official ? "outline" : "default"}
            size="sm"
            className={`flex-1 text-xs ${
              format.is_official
                ? "bg-gray-800 hover:bg-gray-700 border-gray-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            onClick={() => onPushOfficial(format.id, !format.is_official)}
          >
            <Globe className="w-3.5 h-3.5 mr-1.5" />
            {format.is_official ? "Unpush" : "Push Global"}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            className="w-9 p-0 flex-shrink-0"
            onClick={() => onDelete(format.id)}
          >
            <Trash2 className="w-3.5 h-3.5 text-white" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
