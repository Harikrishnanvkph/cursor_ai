"use client"

import React, { useState } from "react"
import { useTemplateStore } from "@/lib/template-store"
import { useChatStore } from "@/lib/chat-store"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { TiptapEditor } from "@/components/tiptap-editor"
import { LayoutTemplate, Type, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

// Import our new extracted components
import { TemplateListTab } from "./template-list-tab"
import { BackgroundSection } from "./content-tab/background-section"
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
    const [richEditorOpen, setRichEditorOpen] = useState(false)
    const [richEditorContent, setRichEditorContent] = useState('')

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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="templates" className="flex items-center gap-2">
                        <LayoutTemplate className="h-4 w-4" />
                        Templates
                    </TabsTrigger>
                    <TabsTrigger value="content" className="flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Content
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="space-y-4">
                    <TemplateListTab currentCloudTemplate={currentCloudTemplate} />
                </TabsContent>

                <TabsContent value="content" className="space-y-4 mt-4">
                    {currentTemplate ? (
                        <>
                            <BackgroundSection currentTemplate={currentTemplate} />

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
                </TabsContent>
            </Tabs>

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
                        <DialogHeader className="px-3 py-2 border-b shrink-0 flex flex-row items-center justify-between">
                            <DialogTitle className="text-sm font-semibold">Rich Text Editor</DialogTitle>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
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
                                    onClick={() => {
                                        updateTextArea(selectedTextAreaId, { content: richEditorContent })
                                        setRichEditorOpen(false)
                                    }}
                                >
                                    Save
                                </Button>
                            </div>
                        </DialogHeader>

                        <div className="flex gap-2 p-2 flex-1 overflow-hidden min-h-0">
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

                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="text-xs font-medium text-gray-700 mb-1 shrink-0">Live Preview</div>
                                <div className="flex-1 overflow-auto border rounded bg-gray-50 p-2">
                                    {(() => {
                                        const selectedTextArea = currentTemplate.textAreas.find(ta => ta.id === selectedTextAreaId)
                                        if (!selectedTextArea) return null

                                        const width = selectedTextArea.position.width
                                        const height = selectedTextArea.position.height

                                        return (
                                            <div
                                                className="bg-white border rounded shadow-sm overflow-auto html-content-area"
                                                style={{
                                                    width: `${width}px`,
                                                    height: `${height}px`,
                                                    fontSize: selectedTextArea.style.fontSize ? `${selectedTextArea.style.fontSize}px` : '14px',
                                                    fontFamily: selectedTextArea.style.fontFamily || 'inherit',
                                                    fontWeight: selectedTextArea.style.fontWeight || 'normal',
                                                    color: selectedTextArea.style.color || '#000000',
                                                    textAlign: selectedTextArea.style.textAlign || 'left',
                                                    lineHeight: selectedTextArea.style.lineHeight || 'normal',
                                                    letterSpacing: selectedTextArea.style.letterSpacing ? `${selectedTextArea.style.letterSpacing}px` : 'normal',
                                                    padding: '8px'
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
