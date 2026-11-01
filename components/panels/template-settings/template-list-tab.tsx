import React from "react"
import { useTemplateStore } from "@/lib/template-store"
import { useChartStore } from "@/lib/chart-store"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Pencil, Trash2, LayoutGrid, Globe, User, Plus } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Zone type → color mapping for skeleton preview
const ZONE_COLORS: Record<string, { bg: string; border: string }> = {
    chart: { bg: 'rgba(59, 130, 246, 0.3)', border: 'rgba(59, 130, 246, 0.5)' },
    text: { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.4)' },
    stat: { bg: 'rgba(245, 158, 11, 0.3)', border: 'rgba(245, 158, 11, 0.5)' },
    background: { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)' },
    decoration: { bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.3)' },
}

interface TemplateListTabProps {
    mode?: 'editor' | 'landing'
}

export function TemplateListTab({ mode = 'editor' }: TemplateListTabProps = {}) {
    const { setEditorMode, setGenerateMode } = useTemplateStore()

    const [confirmFormatOpen, setConfirmFormatOpen] = React.useState(false)
    const [pendingDeleteFormatId, setPendingDeleteFormatId] = React.useState<string | null>(null)

    const askDeleteFormat = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setPendingDeleteFormatId(id)
        setConfirmFormatOpen(true)
    }

    const cancelDeleteFormat = () => {
        setConfirmFormatOpen(false)
        setPendingDeleteFormatId(null)
    }

    const confirmDeleteFormat = async () => {
        if (pendingDeleteFormatId) {
            try {
                const { deleteFormat } = useFormatGalleryStore.getState()
                const res = await deleteFormat(pendingDeleteFormatId)
                if (res.success) {
                    toast.success("Template deleted successfully")
                } else {
                    toast.error(res.error || "Failed to delete template")
                }
            } catch (error: any) {
                console.error('Error deleting template:', error)
                toast.error(error.message || "Failed to delete template")
            }
        }
        setConfirmFormatOpen(false)
        setPendingDeleteFormatId(null)
    }

    // Format gallery store bindings
    const {
        formats,
        selectedFormatId,
        setSelectedFormat,
        contentPackage,
        setContentPackage,
        userFormats,
        isLoadingUserFormats,
        loadFormats
    } = useFormatGalleryStore()
    const { chartData, chartType, chartConfig } = useChartStore()

    // Sub-view toggle: 'global' (Official) or 'mine' (My Templates)
    const [formatView, setFormatView] = React.useState<'global' | 'mine'>('global')

    // Always ensure fresh blueprints when mounted
    React.useEffect(() => {
        loadFormats(true)
    }, [loadFormats])

    React.useEffect(() => {
        // Reconstruct content package if this is an actual layout chart or preparing to be one
        if (!contentPackage && chartData?.datasets?.length > 0) {
            import('@/lib/variant-engine').then(({ extractContentFromChartData }) => {
                try {
                    const pkg = extractContentFromChartData(chartType, chartData as any, chartConfig)
                    if (pkg) setContentPackage(pkg)
                } catch (e) {
                    console.error('Failed to extract content package:', e)
                }
            })
        }
    }, [chartData, chartType, chartConfig, contentPackage, setContentPackage])

    const handleFormatSelect = (formatId: string) => {
        // Clear any old template state and apply modern layout
        useTemplateStore.getState().clearAllTemplateState()
        setSelectedFormat(formatId, 'bar')
        setEditorMode('template')
        setGenerateMode('format')
    }

    const activeFormats = formatView === 'global' ? formats : userFormats
    const isLoading = formatView === 'global'
        ? useFormatGalleryStore.getState().isLoadingFormats
        : isLoadingUserFormats

    return (
        <div className="space-y-2.5">
            {/* 1. First: + Create Template Button */}
            {mode === 'editor' && (
                <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 shadow-2xs rounded-lg transition-all duration-150 active:scale-[0.99]"
                >
                    <Link href="/editor/custom-format" className="flex items-center justify-center gap-1.5">
                        <Plus className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Create Template</span>
                    </Link>
                </Button>
            )}

            {/* 2. Below: Global / My Templates toggle */}
            <div className="grid grid-cols-2 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-lg border border-slate-200/60 dark:border-slate-700/60 w-full">
                <button
                    type="button"
                    onClick={() => setFormatView('global')}
                    className={cn(
                        "flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-all cursor-pointer",
                        formatView === 'global'
                            ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xs font-semibold"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
                    )}
                >
                    <Globe className="h-3.5 w-3.5" />
                    <span>Global</span>
                </button>
                <button
                    type="button"
                    onClick={() => setFormatView('mine')}
                    className={cn(
                        "flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-all cursor-pointer",
                        formatView === 'mine'
                            ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xs font-semibold"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
                    )}
                >
                    <User className="h-3.5 w-3.5" />
                    <span>My Templates</span>
                </button>
            </div>

            {/* Layouts list */}
            {isLoading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
                </div>
            ) : activeFormats.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                    <LayoutGrid className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 mb-1">
                        {formatView === 'global'
                            ? 'No global templates available yet.'
                            : "You haven't created any custom templates yet."}
                    </p>
                    {formatView === 'mine' && mode === 'editor' && (
                        <Link
                            href="/editor/custom-format"
                            className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                        >
                            <Plus className="h-3 w-3" />
                            Create your first template
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-2">
                    {activeFormats.map((format) => {
                        const isSelected = selectedFormatId === format.id
                        const skeleton = format.skeleton as any
                        const zones = skeleton?.zones || []
                        const palette = skeleton?.colorPalette
                        const isUserFormat = formatView === 'mine'

                        // Scale math for preview
                        const dims = format.dimensions
                        const previewW = 240
                        const previewH = 140
                        const scale = Math.min(previewW / dims.width, previewH / dims.height, 1)

                        return (
                            <div
                                key={format.id}
                                className={`group p-2 rounded-lg cursor-pointer transition-all duration-200 border ${
                                    isSelected
                                        ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200 shadow-sm'
                                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                }`}
                                onClick={() => handleFormatSelect(format.id)}
                            >
                                <div className="min-w-0 flex-1 flex flex-col">
                                    <div className="relative w-full h-[140px] mb-2 shrink-0 flex items-center justify-center pointer-events-none">
                                        <div
                                            className="relative shadow-sm rounded-sm bg-white ring-1 ring-gray-200 overflow-hidden"
                                            style={{
                                                width: dims.width * scale,
                                                height: dims.height * scale,
                                                backgroundColor: palette?.background || '#f8f9fa',
                                            }}
                                        >
                                            {zones.filter((z: any) => z.position).map((zone: any) => {
                                                const colors = ZONE_COLORS[zone.type] || ZONE_COLORS.decoration
                                                const zoneW = zone.position.width * scale
                                                const zoneH = zone.position.height * scale

                                                return (
                                                    <div
                                                        key={zone.id}
                                                        className="absolute flex items-center justify-center overflow-hidden"
                                                        style={{
                                                            left: zone.position.x * scale,
                                                            top: zone.position.y * scale,
                                                            width: zoneW,
                                                            height: zoneH,
                                                            backgroundColor: colors.bg,
                                                            borderColor: colors.border,
                                                            borderWidth: 1,
                                                            borderStyle: 'solid',
                                                        }}
                                                    >
                                                        {zoneW > 20 && zoneH > 10 && (
                                                            <span
                                                                className="text-[6px] font-semibold uppercase tracking-wider truncate px-0.5 opacity-70"
                                                                style={{ color: colors.border }}
                                                            >
                                                                {zone.type === 'chart' ? '📊' :
                                                                    zone.type === 'stat' ? '#' :
                                                                        zone.type === 'text' ? (zone.role === 'title' ? 'T' : 'Aa') : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 mb-1 px-1">
                                        {isSelected && (
                                            <span className="inline-block h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                                        )}
                                        <LayoutGrid className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                                        <h4 className="font-semibold text-xs text-gray-900 truncate flex-1">{format.name}</h4>
                                        {isUserFormat && mode === 'editor' && (
                                            <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/editor/custom-format?id=${format.id}`} onClick={(e: any) => e.stopPropagation()}>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6" title="Edit" type="button">
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                    title="Delete"
                                                    type="button"
                                                    onClick={(e: any) => askDeleteFormat(e, format.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between px-1">
                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium rounded ${
                                            isUserFormat
                                                ? 'text-blue-700 bg-blue-50 border border-blue-100'
                                                : 'text-blue-700 bg-blue-50 border border-blue-100'
                                        }`}>
                                            {isUserFormat ? <User className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}
                                            {isUserFormat ? 'Custom' : 'Official'}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {format.dimensions.width} × {format.dimensions.height}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <ConfirmDialog
                open={confirmFormatOpen}
                title="Delete custom template?"
                description="This will permanently remove your custom template. This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
                onConfirm={confirmDeleteFormat}
                onCancel={cancelDeleteFormat}
            />

            {/* Create button — only in My Templates view */}
            {mode === 'editor' && formatView === 'mine' && (
                <div className="mt-2">
                    <Link
                        href="/editor/custom-format"
                        className="inline-flex items-center px-3 py-1.5 border border-dashed border-blue-400 rounded-md text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                    >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Create custom template
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">
                        Design your own layout with zones for charts, text, stats & decorations.
                    </p>
                </div>
            )}
        </div>
    )
}
