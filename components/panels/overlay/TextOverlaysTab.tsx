"use client"

import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Type } from "lucide-react"
import { useChartStore } from "@/lib/chart-store"
import { useUIStore } from "@/lib/stores/ui-store"
import { useToast } from "@/hooks/use-toast"
import { OverlayHeader } from "./components/OverlayHeader"
import { OverlayClearDialog } from "./components/OverlayClearDialog"

export function TextOverlaysTab() {
    const {
        overlayTexts,
        addOverlayText,
        updateOverlayText,
        removeOverlayText,
    } = useChartStore()

    const {
        selectedTextId,
        setSelectedTextId,
    } = useUIStore()

    const { toast } = useToast()
    const [newText, setNewText] = useState("")
    const [showClearTextsDialog, setShowClearTextsDialog] = useState(false)

    const handleAddText = () => {
        if (!newText.trim()) return
        addOverlayText({
            text: newText, x: 150, y: 150, fontSize: 16, fontFamily: 'Arial',
            color: '#000000', backgroundColor: '#ffffff', backgroundTransparent: true,
            borderWidth: 0, borderColor: '#000000', paddingX: 8, paddingY: 4,
            visible: true, rotation: 0, zIndex: 1, maxWidth: 200
        })
        setNewText("")
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Type className="h-4 w-4" />Add Text</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Textarea value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Enter text..." className="min-h-[80px] resize-none" rows={3} />
                        <Button onClick={handleAddText} disabled={!newText.trim()}>Add Text</Button>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-2">
                {(selectedTextId || overlayTexts.length > 0) && (
                    <div className="flex justify-between items-center px-1 py-1">
                        <span className="text-xs text-gray-400 font-medium">{overlayTexts.length} {overlayTexts.length === 1 ? 'text' : 'texts'}</span>
                        <div className="flex gap-1.5">
                            {selectedTextId && <Button size="sm" variant="ghost" onClick={() => setSelectedTextId(null)} className="text-xs h-6 px-2 text-gray-500">Deselect</Button>}
                            <Button size="sm" variant="ghost" onClick={() => setShowClearTextsDialog(true)} className="text-xs h-6 px-2 text-red-400">Clear all</Button>
                            <OverlayClearDialog
                                open={showClearTextsDialog} onOpenChange={setShowClearTextsDialog}
                                title="Clear all text?" description={`Permanently remove all ${overlayTexts.length} text overlays?`}
                                count={overlayTexts.length}
                                onConfirm={() => {
                                    const count = overlayTexts.length;
                                    [...overlayTexts].forEach(t => removeOverlayText(t.id));
                                    setSelectedTextId(null);
                                    toast({ title: "Text Cleared", description: `All ${count} text overlays removed.` });
                                    setShowClearTextsDialog(false);
                                }}
                            />
                        </div>
                    </div>
                )}

                {[...overlayTexts]
                    .sort((a, b) => (a.id === selectedTextId ? -1 : b.id === selectedTextId ? 1 : 0))
                    .map((text, index) => {
                        const originalIndex = overlayTexts.findIndex(t => t.id === text.id);
                        const isSelected = selectedTextId === text.id;
                        return (
                            <Card key={text.id} className={`transition-all ${isSelected ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-100 hover:border-gray-200'}`}>
                                <OverlayHeader
                                    isSelected={isSelected}
                                    onToggleExpand={() => setSelectedTextId(isSelected ? null : text.id)}
                                    visualPreview={<div className="w-6 h-6 rounded bg-gray-100 border flex items-center justify-center"><Type className="h-3.5 w-3.5 text-gray-500" /></div>}
                                    label={text.text.slice(0, 20) + (text.text.length > 20 ? '...' : '') || `Text ${originalIndex + 1}`}
                                    typeBadge="text"
                                    isVisible={text.visible}
                                    onToggleVisibility={() => updateOverlayText(text.id, { visible: !text.visible })}
                                    onDelete={() => removeOverlayText(text.id)}
                                />

                                {isSelected && (
                                    <CardContent className="space-y-4 pt-3 pb-4">
                                        <div><Label className="text-xs">Text</Label><Textarea value={text.text} onChange={(e) => updateOverlayText(text.id, { text: e.target.value })} className="min-h-[80px]" /></div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><Label className="text-xs">X</Label><Input type="number" value={text.x} onChange={e => updateOverlayText(text.id, { x: parseInt(e.target.value) || 0 })} className="h-8" /></div>
                                            <div><Label className="text-xs">Y</Label><Input type="number" value={text.y} onChange={e => updateOverlayText(text.id, { y: parseInt(e.target.value) || 0 })} className="h-8" /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><Label className="text-xs">Size</Label><Input type="number" value={text.fontSize} onChange={e => updateOverlayText(text.id, { fontSize: parseInt(e.target.value) || 12 })} className="h-8" /></div>
                                            <div><Label className="text-xs">Font</Label>
                                                <Select value={text.fontFamily} onValueChange={v => updateOverlayText(text.id, { fontFamily: v })}>
                                                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                    <SelectContent>{['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div><Label className="text-xs">Color</Label><Input type="color" value={text.color} onChange={e => updateOverlayText(text.id, { color: e.target.value })} className="h-8 w-full" /></div>
                                        <div><Label className="text-xs">Max Width</Label><Input type="number" value={text.maxWidth || ''} onChange={e => updateOverlayText(text.id, { maxWidth: parseInt(e.target.value) || undefined })} className="h-8" /></div>
                                        <div className="flex items-center space-x-2"><Switch id={`trans-${text.id}`} checked={text.backgroundTransparent} onCheckedChange={v => updateOverlayText(text.id, { backgroundTransparent: v })} /><Label htmlFor={`trans-${text.id}`} className="text-xs">Transparent BG</Label></div>
                                        {!text.backgroundTransparent && <div><Label className="text-xs">BG Color</Label><Input type="color" value={text.backgroundColor} onChange={e => updateOverlayText(text.id, { backgroundColor: e.target.value })} className="h-8 w-full" /></div>}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><Label className="text-xs">Pad X</Label><Slider value={[text.paddingX || 8]} onValueChange={([v]) => updateOverlayText(text.id, { paddingX: v })} max={20} className="mt-2" /></div>
                                            <div><Label className="text-xs">Pad Y</Label><Slider value={[text.paddingY || 4]} onValueChange={([v]) => updateOverlayText(text.id, { paddingY: v })} max={20} className="mt-2" /></div>
                                        </div>
                                        <div><Label className="text-xs">Rotation</Label> <Slider value={[text.rotation]} onValueChange={([v]) => updateOverlayText(text.id, { rotation: v })} min={-180} max={180} className="mt-2" /></div>
                                        <div><Label className="text-xs">Order</Label><Input type="number" value={text.zIndex} onChange={e => updateOverlayText(text.id, { zIndex: parseInt(e.target.value) || 1 })} className="h-8" /></div>
                                    </CardContent>
                                )}
                            </Card>
                        )
                    })
                }
            </div>
        </div>
    )
}
