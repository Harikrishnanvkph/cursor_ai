import React from "react"
import { useTemplateStore, type TemplateLayout } from "@/lib/template-store"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Edit3, FileText, ALargeSmall, Pencil } from "lucide-react"

interface TextAreasListProps {
    currentTemplate: TemplateLayout
    selectedTextAreaId: string | null
    setSelectedTextAreaId: (id: string | null) => void
}

export function TextAreasList({ currentTemplate, selectedTextAreaId, setSelectedTextAreaId }: TextAreasListProps) {
    const updateTextArea = useTemplateStore((state) => state.updateTextArea)
    const resetTemplate = useTemplateStore((state) => state.resetTemplate)

    const getTextAreaTypeIcon = (type: string) => {
        switch (type) {
            case 'title': return <span className="text-xs font-bold w-4 h-4 flex items-center justify-center">T</span>
            case 'heading': return <span className="text-xs font-bold w-4 h-4 flex items-center justify-center">H</span>
            case 'custom': return <Pencil className="h-4 w-4" />
            case 'main': return <FileText className="h-4 w-4" />
            default: return <FileText className="h-4 w-4" />
        }
    }

    const getTextAreaTypeColor = (type: string) => {
        switch (type) {
            case 'title': return 'text-blue-600 bg-blue-50'
            case 'heading': return 'text-blue-600 bg-blue-50'
            case 'custom': return 'text-blue-600 bg-blue-50'
            case 'main': return 'text-blue-600 bg-blue-50'
            default: return 'text-gray-600 bg-gray-50'
        }
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    Text Areas
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {currentTemplate.textAreas.map((textArea) => (
                        <div
                            key={textArea.id}
                            className={`p-2 border rounded-md cursor-pointer transition-all duration-200 ${selectedTextAreaId === textArea.id
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                                }`}
                            onClick={() => setSelectedTextAreaId(textArea.id)}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className={`p-1.5 rounded ${getTextAreaTypeColor(textArea.type)} flex-shrink-0`}>
                                        {getTextAreaTypeIcon(textArea.type)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-medium capitalize text-gray-900 truncate">{textArea.type}</div>
                                        <div className="text-xs text-gray-500 truncate">
                                            {textArea.content || 'Empty'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <Switch
                                        checked={textArea.visible}
                                        onCheckedChange={(checked) =>
                                            updateTextArea(textArea.id, { visible: checked })
                                        }
                                        className="scale-75 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        if (currentTemplate) {
                            resetTemplate()
                        }
                    }}
                    className="w-full h-8 text-xs"
                >
                    <FileText className="h-3 w-3 mr-1" />
                    Reset Template
                </Button>
            </CardContent>
        </Card>
    )
}
