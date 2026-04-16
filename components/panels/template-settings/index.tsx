"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { useTemplateStore } from "@/lib/template-store"
import { useChatStore } from "@/lib/chat-store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { TiptapEditor } from "@/components/tiptap-editor"
import { LayoutTemplate, Type, FileText, Columns, Rows, Maximize, Minimize, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

// Import our new extracted components
import { TemplateListTab } from "./template-list-tab"
import { TextAreasList } from "./content-tab/text-areas-list"
import { TextEditorSection } from "./content-tab/text-editor-section"

export function TemplatesPanel() {
    const {
        currentTemplate,
        selectedTextAreaId,
        setSelectedTextAreaId,
        updateTextArea,
        originalCloudTemplateContent
    } = useTemplateStore()

    const currentChartState = useChatStore((state) => state.currentChartState)

    const [activeTab, setActiveTab] = useState("templates")

    const currentCloudTemplate = React.useMemo(() => {
        if (currentChartState?.template_structure) {
            return {
                ...currentChartState.template_structure,
                id: 'current-cloud-template',
                name: 'Current Cloud Template',
                description: 'Original template structure from backend snapshot',
                isCustom: false,
                isCloudTemplate: true
            }
        }

        if (originalCloudTemplateContent?.id === 'current-cloud-template') {
            return originalCloudTemplateContent
        }

        return null
    }, [currentChartState?.template_structure, originalCloudTemplateContent])

    return (
        <div className="space-y-4">
            <TemplateListTab currentCloudTemplate={currentCloudTemplate} />
        </div>
    )
}

export function TemplateContentPanel() {
    const {
        currentTemplate,
        selectedTextAreaId,
        setSelectedTextAreaId,
        updateTextArea
    } = useTemplateStore()

    const [richEditorOpen, setRichEditorOpen] = useState(false)
    const [richEditorContent, setRichEditorContent] = useState('')
    const [editorLayout, setEditorLayout] = useState<'side-by-side' | 'stacked'>('side-by-side')
    const [fitToPreview, setFitToPreview] = useState(false)

    // Ref for the preview container to calculate scale
    const previewContainerRef = useRef<HTMLDivElement>(null)
    const [previewScale, setPreviewScale] = useState(1)

    // Compute scale when fitToPreview changes or dialog size changes
    const computeScale = useCallback(() => {
        if (!fitToPreview || !previewContainerRef.current || !selectedTextAreaId || !currentTemplate) {
            setPreviewScale(1)
            return
        }
        const selectedTextArea = currentTemplate.textAreas.find(ta => ta.id === selectedTextAreaId)
        if (!selectedTextArea) return

        const container = previewContainerRef.current
        const containerWidth = container.clientWidth - 16 // padding
        const containerHeight = container.clientHeight - 16
        const contentWidth = selectedTextArea.position.width
        const contentHeight = selectedTextArea.position.height

        if (contentWidth <= 0 || contentHeight <= 0) return

        const scaleX = containerWidth / contentWidth
        const scaleY = containerHeight / contentHeight
        setPreviewScale(Math.min(scaleX, scaleY, 1)) // Never scale up, only down
    }, [fitToPreview, selectedTextAreaId, currentTemplate])

    useEffect(() => {
        // Use rAF to compute after layout settles
        const id = requestAnimationFrame(() => computeScale())
        window.addEventListener('resize', computeScale)
        return () => {
            cancelAnimationFrame(id)
            window.removeEventListener('resize', computeScale)
        }
    }, [computeScale, richEditorOpen, editorLayout, fitToPreview])

    return (
        <div className="space-y-4 pt-1">
            {currentTemplate ? (
                <>
                    <TextAreasList
                        currentTemplate={currentTemplate}
                        selectedTextAreaId={selectedTextAreaId}
                        setSelectedTextAreaId={setSelectedTextAreaId}
                    />

                    <TextEditorSection
                        currentTemplate={currentTemplate}
                        selectedTextAreaId={selectedTextAreaId}
                        setRichEditorContent={setRichEditorContent}
                        setRichEditorOpen={setRichEditorOpen}
                    />
                </>
            ) : (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                                Select a template from the Templates tab to edit content.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Rich Text Editor Dialog */}
            {selectedTextAreaId && currentTemplate && (
                <Dialog open={richEditorOpen} onOpenChange={(open) => {
                    if (!open) {
                        const selectedTextArea = currentTemplate.textAreas.find(ta => ta.id === selectedTextAreaId)
                        if (selectedTextArea) {
                            setRichEditorContent(selectedTextArea.content || '')
                        }
                    }
                    setRichEditorOpen(open)
                }}>
                    <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-0" hideCloseButton>
                        <DialogTitle className="sr-only">Rich Text Editor</DialogTitle>
                        {/* Main body: editor + preview */}
                        <div className={`flex ${editorLayout === 'side-by-side' ? 'flex-row' : 'flex-col'} gap-0 flex-1 overflow-hidden min-h-0`}>
                            {/* Editor Section */}
                            <div className={`flex flex-col overflow-hidden ${editorLayout === 'side-by-side' ? 'flex-1 border-r' : 'flex-1 border-b'} min-w-0`}>
                                {/* Action bar: title + layout toggle + Save/Cancel */}
                                <div className="flex items-center justify-between px-2 py-1 bg-gray-50 border-b shrink-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-600 mr-1">Rich Text Editor</span>
                                        {/* Layout Toggle */}
                                        <div className="flex items-center border rounded-md overflow-hidden bg-white">
                                            <button
                                                type="button"
                                                className={`p-1.5 transition-colors ${editorLayout === 'side-by-side' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                                                onClick={() => setEditorLayout('side-by-side')}
                                                title="Side by Side"
                                            >
                                                <Columns className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                className={`p-1.5 transition-colors border-l ${editorLayout === 'stacked' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                                                onClick={() => setEditorLayout('stacked')}
                                                title="Stacked"
                                            >
                                                <Rows className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <span className="text-[10px] text-gray-400">Layout</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => {
                                                const selectedTextArea = currentTemplate.textAreas.find(ta => ta.id === selectedTextAreaId)
                                                if (selectedTextArea) {
                                                    setRichEditorContent(selectedTextArea.content || '')
                                                }
                                                setRichEditorOpen(false)
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => {
                                                updateTextArea(selectedTextAreaId, { content: richEditorContent })
                                                setRichEditorOpen(false)
                                            }}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </div>

                                {/* Editor */}
                                <div className="flex-1 overflow-auto">
                                    {(() => {
                                        const selectedTextArea = currentTemplate.textAreas.find(ta => ta.id === selectedTextAreaId)
                                        return (
                                            <TiptapEditor
                                                initialHtml={richEditorContent}
                                                onChange={(html) => setRichEditorContent(html)}
                                                className="h-full"
                                                contentStyle={selectedTextArea ? {
                                                    fontSize: selectedTextArea.style.fontSize,
                                                    fontFamily: selectedTextArea.style.fontFamily,
                                                    color: selectedTextArea.style.color,
                                                    lineHeight: selectedTextArea.style.lineHeight,
                                                    letterSpacing: selectedTextArea.style.letterSpacing
                                                } : undefined}
                                            />
                                        )
                                    })()}
                                </div>
                            </div>

                            {/* Preview Section */}
                            <div className={`flex flex-col overflow-hidden min-w-0 ${editorLayout === 'side-by-side' ? 'flex-1' : 'flex-1'}`}>
                                {/* Preview header with fit toggle + close */}
                                <div className="flex items-center justify-between px-2 py-1 bg-gray-50 border-b shrink-0">
                                    <span className="text-xs font-medium text-gray-600">Live Preview</span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors border ${
                                                fitToPreview
                                                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'
                                            }`}
                                            onClick={() => {
                                                setFitToPreview(!fitToPreview)
                                            }}
                                            title={fitToPreview ? 'Show actual size with scrollbars' : 'Fit preview to container'}
                                        >
                                            {fitToPreview ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                                            {fitToPreview ? 'Actual Size' : 'Fit to View'}
                                        </button>
                                        <button
                                            type="button"
                                            className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors"
                                            onClick={() => {
                                                const selectedTextArea = currentTemplate.textAreas.find(ta => ta.id === selectedTextAreaId)
                                                if (selectedTextArea) {
                                                    setRichEditorContent(selectedTextArea.content || '')
                                                }
                                                setRichEditorOpen(false)
                                            }}
                                            title="Close"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Preview content */}
                                <div
                                    ref={previewContainerRef}
                                    className={`flex-1 ${fitToPreview ? 'overflow-hidden' : 'overflow-auto'} border-t-0 bg-gray-50 p-2 min-w-0`}
                                >
                                    {(() => {
                                        const selectedTextArea = currentTemplate.textAreas.find(ta => ta.id === selectedTextAreaId)
                                        if (!selectedTextArea) return null

                                        const width = selectedTextArea.position.width
                                        const height = selectedTextArea.position.height

                                        if (fitToPreview) {
                                            // Wrapper sized to scaled dimensions so content doesn't clip
                                            return (
                                                <div style={{
                                                    width: `${width * previewScale}px`,
                                                    height: `${height * previewScale}px`,
                                                    flexShrink: 0,
                                                    margin: '0 auto'
                                                }}>
                                                    <div
                                                        className="bg-white border rounded shadow-sm html-content-area"
                                                        style={{
                                                            width: `${width}px`,
                                                            height: `${height}px`,
                                                            fontSize: selectedTextArea.style.fontSize ? `${selectedTextArea.style.fontSize}px` : '14px',
                                                            fontFamily: selectedTextArea.style.fontFamily || 'inherit',
                                                            fontWeight: selectedTextArea.style.fontWeight || 'normal',
                                                            color: selectedTextArea.style.color || '#000000',
                                                            textAlign: (selectedTextArea.style.textAlign as any) || 'left',
                                                            lineHeight: selectedTextArea.style.lineHeight || 'normal',
                                                            letterSpacing: selectedTextArea.style.letterSpacing ? `${selectedTextArea.style.letterSpacing}px` : 'normal',
                                                            padding: '8px',
                                                            overflow: 'hidden',
                                                            transform: `scale(${previewScale})`,
                                                            transformOrigin: 'top left'
                                                        }}
                                                        dangerouslySetInnerHTML={{ __html: richEditorContent || 'Preview will appear here...' }}
                                                    />
                                                </div>
                                            )
                                        }

                                        return (
                                            <div
                                                className="bg-white border rounded shadow-sm html-content-area"
                                                style={{
                                                    width: `${width}px`,
                                                    height: `${height}px`,
                                                    fontSize: selectedTextArea.style.fontSize ? `${selectedTextArea.style.fontSize}px` : '14px',
                                                    fontFamily: selectedTextArea.style.fontFamily || 'inherit',
                                                    fontWeight: selectedTextArea.style.fontWeight || 'normal',
                                                    color: selectedTextArea.style.color || '#000000',
                                                    textAlign: (selectedTextArea.style.textAlign as any) || 'left',
                                                    lineHeight: selectedTextArea.style.lineHeight || 'normal',
                                                    letterSpacing: selectedTextArea.style.letterSpacing ? `${selectedTextArea.style.letterSpacing}px` : 'normal',
                                                    padding: '8px',
                                                    overflow: 'auto',
                                                    flexShrink: 0,
                                                    margin: '0 auto'
                                                }}
                                                dangerouslySetInnerHTML={{ __html: richEditorContent || 'Preview will appear here...' }}
                                            />
                                        )
                                    })()}
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
