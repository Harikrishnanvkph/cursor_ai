import React from "react"
import { useTemplateStore, type TemplateLayout } from "@/lib/template-store"
import { useChartStore } from "@/lib/chart-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Cloud, LayoutTemplate, Database, FileText, ChevronUp, ChevronDown } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface TemplateListTabProps {
    currentCloudTemplate: TemplateLayout | null
    mode?: 'editor' | 'landing'
}

export function TemplateListTab({ currentCloudTemplate, mode = 'editor' }: TemplateListTabProps) {
    const {
        templates,
        currentTemplate,
        applyTemplate,
        setDraftTemplate,
        setOriginalCloudTemplateContent,
        modifiedCloudTemplateContent,
        clearUnusedContents,
        unusedContents,
        removeUnusedContent,
        updateUnusedContent
    } = useTemplateStore()

    const { updateChartConfig } = useChartActions()
    const router = useRouter()

    const [confirmOpen, setConfirmOpen] = React.useState(false)
    const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null)
    const [isUnusedContentsExpanded, setIsUnusedContentsExpanded] = React.useState(true)

    const askDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setPendingDeleteId(id)
        setConfirmOpen(true)
    }

    const confirmDelete = async () => {
        if (pendingDeleteId) {
            try {
                await useTemplateStore.getState().deleteTemplate(pendingDeleteId)
            } catch (error) {
                console.error('Error deleting template:', error)
            }
        }
        setConfirmOpen(false)
        setPendingDeleteId(null)
    }

    const cancelDelete = () => {
        setConfirmOpen(false)
        setPendingDeleteId(null)
    }

    const handleTemplateSelect = (templateId: string) => {
        applyTemplate(templateId)
    }

    const getTemplateType = (template: TemplateLayout) => {
        const isDefault = /^template-\d+$/.test(template.id)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        const isCloudSynced = uuidRegex.test(template.id)

        if (isDefault) return 'default'
        if (isCloudSynced) return 'cloud'
        return 'custom'
    }

    const getTextAreaTypeIcon = (type: string) => {
        switch (type) {
            case 'title': return <span className="text-xs font-bold w-4 h-4 flex items-center justify-center">T</span>
            case 'heading': return <span className="text-xs font-bold w-4 h-4 flex items-center justify-center">H</span> // Placeholder for ALargeSmall
            case 'custom': return <Pencil className="h-4 w-4" /> // Placeholder for Edit3
            case 'main': return <FileText className="h-4 w-4" />
            default: return <FileText className="h-4 w-4" />
        }
    }

    const getTextAreaTypeColor = (type: string) => {
        switch (type) {
            case 'title': return 'text-blue-600 bg-blue-50'
            case 'heading': return 'text-green-600 bg-green-50'
            case 'custom': return 'text-purple-600 bg-purple-50'
            case 'main': return 'text-orange-600 bg-orange-50'
            default: return 'text-gray-600 bg-gray-50'
        }
    }

    const renderTemplateSkeleton = (template: TemplateLayout) => {
        const tWidth = template.width || 1200;
        const tHeight = template.height || 800;

        const containerW = 240;
        const containerH = 120;
        const scale = Math.min(containerW / tWidth, containerH / tHeight, 1);

        return (
            <div className="relative w-full h-[140px] mb-1.5 shrink-0 flex items-center justify-center pointer-events-none">
                <div
                    className="relative shadow-sm rounded-[2px] bg-white ring-1 ring-gray-200"
                    style={{
                        width: tWidth * scale,
                        height: tHeight * scale,
                    }}
                >
                    {template.chartArea && (
                        <div
                            className="absolute bg-blue-50"
                            style={{
                                left: template.chartArea.x * scale,
                                top: template.chartArea.y * scale,
                                width: template.chartArea.width * scale,
                                height: template.chartArea.height * scale,
                                border: `1px solid rgba(59, 130, 246, 0.3)`
                            }}
                        />
                    )}
                    {template.textAreas?.map((ta) => (
                        <div
                            key={ta.id}
                            className="absolute"
                            style={{
                                left: ta.position.x * scale,
                                top: ta.position.y * scale,
                                width: ta.position.width * scale,
                                height: ta.position.height * scale,
                                backgroundColor: ta.type === 'title' ? 'rgba(14,165,233,0.1)' :
                                    ta.type === 'heading' ? 'rgba(22,163,74,0.1)' :
                                        ta.type === 'main' ? 'rgba(234,88,12,0.1)' : 'rgba(124,58,237,0.1)',
                                border: `1px solid ${ta.type === 'title' ? 'rgba(14,165,233,0.3)' :
                                    ta.type === 'heading' ? 'rgba(22,163,74,0.3)' :
                                        ta.type === 'main' ? 'rgba(234,88,12,0.3)' : 'rgba(124,58,237,0.3)'
                                    }`,
                                opacity: ta.visible !== false ? 1 : 0.4
                            }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 mt-3">
            <div className="space-y-1.5">
                <div className="grid grid-cols-1 gap-1.5">
                    {currentCloudTemplate && (
                        <div
                            className={`group p-2 rounded-lg cursor-pointer transition-all duration-200 border ${currentTemplate?.id === 'current-cloud-template'
                                ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200 shadow-sm'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                                }`}
                            onClick={() => {
                                const templateStore = useTemplateStore.getState()
                                let templateToApply = currentCloudTemplate

                                if (modifiedCloudTemplateContent && modifiedCloudTemplateContent.id === 'current-cloud-template') {
                                    templateToApply = modifiedCloudTemplateContent
                                }

                                if (!templateStore.originalCloudTemplateContent) {
                                    setOriginalCloudTemplateContent(currentCloudTemplate)
                                }

                                templateStore.setCurrentTemplate(templateToApply)
                                templateStore.setEditorMode('template')
                                clearUnusedContents()

                                const chartStore = useChartStore.getState()
                                updateChartConfig({
                                    ...chartStore.chartConfig,
                                    manualDimensions: true,
                                    width: `${templateToApply.chartArea.width}px`,
                                    height: `${templateToApply.chartArea.height}px`,
                                    responsive: false,
                                    maintainAspectRatio: false
                                })
                            }}
                        >
                            <div className="min-w-0 flex-1 flex flex-col">
                                {renderTemplateSkeleton(currentCloudTemplate)}
                                <div className="flex items-center gap-2 mb-1.5">
                                    {currentTemplate?.id === 'current-cloud-template' && (
                                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-blue-200 flex-shrink-0" title="Active" />
                                    )}
                                    <Cloud className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    <h4 className="font-semibold text-sm text-gray-900 truncate flex-1">{currentCloudTemplate.name}</h4>
                                    {mode === 'editor' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 flex-shrink-0"
                                            title="Edit structure"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                const draftId = `cloud-edit-${Date.now()}`
                                                setDraftTemplate({
                                                    ...currentCloudTemplate,
                                                    id: draftId,
                                                    isCustom: true
                                                })
                                                setOriginalCloudTemplateContent(currentCloudTemplate)
                                                router.push('/editor/custom-template?source=current-cloud')
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-full">
                                        <Cloud className="h-3 w-3" />
                                        Cloud Snapshot
                                    </span>
                                    <span className="text-[10px] text-gray-400 ml-auto">
                                        {currentCloudTemplate.width} × {currentCloudTemplate.height}
                                    </span>
                                </div>


                            </div>
                        </div>
                    )}

                    {templates.map((template) => {
                        const isActive = currentTemplate?.id === template.id
                        const templateType = getTemplateType(template)
                        const textAreaCount = template.textAreas?.length || 0

                        return (
                            <div
                                key={template.id}
                                className={`group p-2 rounded-lg cursor-pointer transition-all duration-200 border ${isActive
                                    ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200 shadow-sm'
                                    : templateType === 'default'
                                        ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                        : templateType === 'cloud'
                                            ? 'border-purple-200 bg-purple-50/30 hover:border-purple-300 hover:bg-purple-50/50'
                                            : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                                    }`}
                                onClick={() => handleTemplateSelect(template.id)}
                            >
                                <div className="min-w-0 flex-1 flex flex-col">
                                    {renderTemplateSkeleton(template)}
                                    <div className="flex items-center gap-1.5 mb-1">
                                        {isActive && (
                                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-blue-200 flex-shrink-0" title="Active" />
                                        )}
                                        {templateType === 'default' ? (
                                            <LayoutTemplate className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                        ) : templateType === 'cloud' ? (
                                            <Database className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                        ) : (
                                            <FileText className="h-4 w-4 text-purple-500 flex-shrink-0" />
                                        )}
                                        <h4 className="font-semibold text-sm text-gray-900 truncate flex-1">{template.name}</h4>
                                        {mode === 'editor' && template.isCustom && !template.is_official && (
                                            <div className="flex items-center gap-0.5 flex-shrink-0">
                                                <Link href={`/editor/custom-template?id=${template.id}`} onClick={(e: any) => e.stopPropagation()}>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit" type="button">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                                <Button size="icon" variant="ghost" className="h-7 w-7" title="Delete" onClick={(e: any) => askDelete(e, template.id)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        {templateType === 'default' && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-full">
                                                Default
                                            </span>
                                        )}
                                        {templateType === 'cloud' && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-purple-700 bg-purple-100 border border-purple-200 rounded-full">
                                                <Database className="h-3 w-3" />
                                                Cloud Synced
                                            </span>
                                        )}
                                        {templateType === 'custom' && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-purple-700 bg-purple-100 border border-purple-200 rounded-full">
                                                Custom
                                            </span>
                                        )}
                                        {textAreaCount > 0 && (
                                            <span className="text-[10px] text-gray-500">
                                                {textAreaCount} text area{textAreaCount !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-gray-400 ml-auto">
                                            {template.width} × {template.height}
                                        </span>
                                    </div>


                                </div>
                            </div>
                        )
                    })}
                </div>

                <ConfirmDialog
                    open={confirmOpen}
                    title="Delete template?"
                    description="This will permanently remove the custom template."
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />

                {mode === 'editor' && (
                    <div className="mt-2">
                        <Link
                            href="/editor/custom-template"
                            className="inline-flex items-center px-3 py-1.5 border border-dashed border-blue-400 rounded-md text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                            <span className="mr-1.5">＋</span>
                            Create custom template
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">
                            Canvas, Title, Heading, Main: one each. Custom text: many.
                        </p>
                    </div>
                )}

                {mode === 'landing' && (
                    <div className="mt-3 p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40 transition-all duration-200">
                        <div className="flex flex-col items-center justify-center text-center space-y-2">
                            <p className="text-sm font-medium text-gray-700">
                                Go to Editor Page to Edit or Create Custom Templates
                            </p>
                            <Link href="/editor?tab=templates">
                                <Button variant="default" size="sm">
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Go to Editor
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

                {!currentTemplate && (
                    <div className="mt-3 pt-3 border-t">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <FileText className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-600">
                                Select a template above to start customizing your chart with text areas and styling.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {mode === 'editor' && currentTemplate && unusedContents.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Unused Contents
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsUnusedContentsExpanded(!isUnusedContentsExpanded)}
                                className="h-6 px-2"
                            >
                                {isUnusedContentsExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </CardHeader>
                    {isUnusedContentsExpanded && (
                        <CardContent className="space-y-2">
                            {unusedContents.map((item, index) => (
                                <div
                                    key={index}
                                    className="p-3 border border-gray-200 rounded-md bg-gray-50"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded ${getTextAreaTypeColor(item.type)}`}>
                                                {getTextAreaTypeIcon(item.type)}
                                            </div>
                                            <span className="text-xs font-medium capitalize text-gray-700">
                                                {item.type}
                                            </span>
                                            {(item as any).contentType === 'html' && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">
                                                    HTML
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeUnusedContent(index)}
                                            className="h-6 w-6 p-0"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <textarea
                                        value={item.content}
                                        onChange={(e) => updateUnusedContent(index, e.target.value)}
                                        className="w-full min-h-[60px] p-2 text-xs border border-gray-300 rounded resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Content from Current Cloud Template..."
                                    />
                                </div>
                            ))}
                        </CardContent>
                    )}
                </Card>
            )}
        </div>
    )
}
