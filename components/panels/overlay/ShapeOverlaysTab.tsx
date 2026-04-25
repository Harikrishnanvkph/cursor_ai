"use client"

import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Hexagon, PenTool, ChevronDown, Square, Circle, Cloud, Star, Minus, ArrowRight, ArrowLeftRight } from "lucide-react"
import { useChartStore, type OverlayShape } from "@/lib/chart-store"
import { useUIStore } from "@/lib/stores/ui-store"
import { useToast } from "@/hooks/use-toast"
import { OverlayHeader } from "./components/OverlayHeader"
import { OverlayClearDialog } from "./components/OverlayClearDialog"

export function ShapeOverlaysTab() {
    const {
        overlayShapes,
        addOverlayShape,
        updateOverlayShape,
        removeOverlayShape,
        clearOverlayShapes,
    } = useChartStore()

    const {
        selectedShapeId,
        setSelectedShapeId
    } = useUIStore()

    const { toast } = useToast()
    const [isAddShapeOpen, setIsAddShapeOpen] = useState(false)
    const [showClearShapesDialog, setShowClearShapesDialog] = useState(false)

    const handleAddShape = (type: OverlayShape['type']) => {
        const isLine = type === 'line' || type === 'lineArrow' || type === 'lineDoubleArrow';
        addOverlayShape({
            type, x: 100, y: 100, width: 100, height: isLine ? 2 : 100,
            rotation: 0, skewX: 0, skewY: 0,
            fillColor: isLine ? 'transparent' : 'rgba(0, 119, 204, 0.5)',
            borderColor: '#007acc', borderWidth: 2, visible: true, zIndex: 1
        })
    }

    const shapeGroups = [
        {
            label: 'Basic',
            shapes: [
                { type: 'rectangle', label: 'Rect', icon: Square },
                { type: 'circle', label: 'Circle', icon: Circle }
            ]
        },
        {
            label: 'Arrows',
            shapes: [
                { type: 'line', label: 'Line', icon: Minus },
                { type: 'lineArrow', label: 'Arrow', icon: ArrowRight },
                { type: 'lineDoubleArrow', label: 'Dual', icon: ArrowLeftRight }
            ]
        }
    ];

    return (
        <div className="space-y-4">
            {/* Premium Add Shape Dropdown */}
            <div className={`relative overflow-hidden transition-all duration-300 border rounded-lg ${isAddShapeOpen ? 'bg-slate-50/30 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 shadow-none'}`}>
                <button
                    onClick={() => setIsAddShapeOpen(!isAddShapeOpen)}
                    className="w-full h-11 px-4 flex items-center justify-between group transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg transition-all duration-300 ${isAddShapeOpen ? 'bg-blue-500 text-white shadow-blue-200 shadow-lg scale-110' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                            <Hexagon className="h-4 w-4" />
                        </div>
                        <span className={`text-sm font-bold transition-colors ${isAddShapeOpen ? 'text-slate-900' : 'text-slate-600 group-hover:text-blue-600'}`}>
                            Add Shape
                        </span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-all duration-500 ${isAddShapeOpen ? 'rotate-180 text-blue-500' : 'text-slate-400 group-hover:text-blue-400'}`} />
                </button>

                {isAddShapeOpen && (
                    <div className="px-3 pb-5 pt-1 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 ease-out">
                        {shapeGroups.map(g => (
                            <div key={g.label} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-[1px] flex-1 bg-slate-100" />
                                    <Label className="text-[10px] uppercase text-slate-400 font-black tracking-[0.15em] whitespace-nowrap">{g.label}</Label>
                                    <div className="h-[1px] flex-1 bg-slate-100" />
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {g.shapes.map((s: any) => (
                                        <Button
                                            key={s.type}
                                            variant="outline"
                                            className="h-13 p-0 flex flex-col items-center justify-center gap-1 hover:border-blue-500 hover:bg-white hover:text-blue-600 hover:shadow-md transition-all duration-300 border-slate-100 bg-white/50"
                                            onClick={() => handleAddShape(s.type)}
                                        >
                                            <div className="transition-transform duration-300 group-hover:scale-110">
                                                {s.icon ? <s.icon className="h-5 w-5" /> : s.svg ? s.svg : <span className="text-sm font-bold">{s.label}</span>}
                                            </div>
                                            {g.label !== 'Numbers' && (
                                                <span className="text-[10px] font-semibold text-slate-500 truncate w-full px-1 text-center">
                                                    {s.label}
                                                </span>
                                            )}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                {(selectedShapeId || overlayShapes.length > 0) && (
                    <div className="flex justify-between items-center px-1 py-1">
                        <span className="text-xs text-gray-400 font-medium">{overlayShapes.length} shapes</span>
                        <div className="flex gap-1.5">
                            {selectedShapeId && <Button size="sm" variant="ghost" onClick={() => setSelectedShapeId(null)} className="text-xs text-gray-500">Deselect</Button>}
                            <Button size="sm" variant="ghost" onClick={() => setShowClearShapesDialog(true)} className="text-xs text-red-400">Clear all</Button>
                            <OverlayClearDialog
                                open={showClearShapesDialog} onOpenChange={setShowClearShapesDialog}
                                title="Clear all shapes?" description="Permanently remove all shapes from your chart?"
                                count={overlayShapes.length}
                                onConfirm={() => {
                                    const count = overlayShapes.length;
                                    clearOverlayShapes();
                                    setSelectedShapeId(null);
                                    toast({ title: "Shapes Cleared", description: `${count} shapes removed.` });
                                    setShowClearShapesDialog(false);
                                }}
                            />
                        </div>
                    </div>
                )}

                {[...overlayShapes]
                    .sort((a, b) => (a.id === selectedShapeId ? -1 : b.id === selectedShapeId ? 1 : 0))
                    .map((shape, index) => {
                        const isSelected = selectedShapeId === shape.id;
                        return (
                            <Card key={shape.id} className={`transition-all ${isSelected ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-100 hover:border-gray-200'}`}>
                                <OverlayHeader
                                    isSelected={isSelected}
                                    onToggleExpand={() => setSelectedShapeId(isSelected ? null : shape.id)}
                                    visualPreview={<div className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: shape.fillColor !== 'transparent' ? shape.fillColor : shape.borderColor }} />}
                                    label={`Shape ${overlayShapes.findIndex(s => s.id === shape.id) + 1}`}
                                    typeBadge={shape.type}
                                    isVisible={shape.visible}
                                    onToggleVisibility={() => updateOverlayShape(shape.id, { visible: !shape.visible })}
                                    onDelete={() => removeOverlayShape(shape.id)}
                                />

                                {isSelected && (
                                    <CardContent className="space-y-6 pt-2 pb-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><Label className="text-xs">X</Label><Input type="number" value={shape.x} onChange={e => updateOverlayShape(shape.id, { x: parseInt(e.target.value) || 0 })} className="h-8 text-xs" /></div>
                                            <div><Label className="text-xs">Y</Label><Input type="number" value={shape.y} onChange={e => updateOverlayShape(shape.id, { y: parseInt(e.target.value) || 0 })} className="h-8 text-xs" /></div>
                                            <div><Label className="text-xs">W</Label><Input type="number" value={shape.width} onChange={e => updateOverlayShape(shape.id, { width: parseInt(e.target.value) || 0 })} className="h-8 text-xs" /></div>
                                            <div><Label className="text-xs">H</Label><Input type="number" value={shape.height} onChange={e => updateOverlayShape(shape.id, { height: parseInt(e.target.value) || 0 })} className="h-8 text-xs" disabled={shape.type.includes('line')} /></div>
                                        </div>
                                        {/* Transform */}
                                        {shape.type !== 'freehand' && (
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex justify-between mb-2">
                                                        <Label className="text-xs text-slate-500">Rotation</Label>
                                                        <span className="text-xs text-slate-400">{shape.rotation || 0}°</span>
                                                    </div>
                                                    <Slider value={[shape.rotation || 0]} onValueChange={([v]) => updateOverlayShape(shape.id, { rotation: v })} min={-180} max={180} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="flex justify-between mb-2"><Label className="text-xs text-slate-500">Skew X</Label><span className="text-xs text-slate-400">{shape.skewX || 0}°</span></div>
                                                        <Slider value={[shape.skewX || 0]} onValueChange={([v]) => updateOverlayShape(shape.id, { skewX: v })} min={-45} max={45} />
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between mb-2"><Label className="text-xs text-slate-500">Skew Y</Label><span className="text-xs text-slate-400">{shape.skewY || 0}°</span></div>
                                                        <Slider value={[shape.skewY || 0]} onValueChange={([v]) => updateOverlayShape(shape.id, { skewY: v })} min={-45} max={45} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Colors & Style */}
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                            {shape.type !== 'freehand' && !shape.type.includes('line') && (
                                                <div>
                                                    <Label className="text-xs text-slate-500 block mb-1.5">Fill Color</Label>
                                                    <div className="relative group flex items-center gap-2">
                                                        <Input type="color" value={shape.fillColor?.startsWith('#') ? shape.fillColor : '#0077cc'} onChange={e => updateOverlayShape(shape.id, { fillColor: e.target.value })} className="h-8 w-8 p-0 border opacity-0 absolute z-10 cursor-pointer" />
                                                        <div className="h-8 w-8 rounded border" style={{ backgroundColor: shape.fillColor?.startsWith('#') ? shape.fillColor : '#0077cc' }} />
                                                        <span className="text-[10px] text-slate-400 font-mono uppercase">{shape.fillColor}</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className={shape.type === 'freehand' || shape.type.includes('line') ? 'col-span-2' : ''}>
                                                <Label className="text-xs text-slate-500 block mb-1.5">{shape.type.includes('line') ? 'Line Color' : 'Border Color'}</Label>
                                                <div className="relative group flex items-center gap-2">
                                                    <Input type="color" value={shape.borderColor?.startsWith('#') ? shape.borderColor : '#0077cc'} onChange={e => updateOverlayShape(shape.id, { borderColor: e.target.value })} className="h-8 w-8 p-0 border opacity-0 absolute z-10 cursor-pointer" />
                                                    <div className="h-8 w-8 rounded border" style={{ backgroundColor: shape.borderColor?.startsWith('#') ? shape.borderColor : '#0077cc' }} />
                                                    <span className="text-[10px] text-slate-400 font-mono uppercase">{shape.borderColor}</span>
                                                </div>
                                            </div>

                                            {shape.type !== 'freehand' && !shape.type.includes('line') && (
                                                <div>
                                                    <div className="flex justify-between mb-2"><Label className="text-xs text-slate-500">Fill Opacity</Label><span className="text-xs text-slate-400">{shape.fillOpacity ?? 100}%</span></div>
                                                    <Slider value={[shape.fillOpacity ?? 100]} onValueChange={([v]) => updateOverlayShape(shape.id, { fillOpacity: v })} min={0} max={100} />
                                                </div>
                                            )}
                                            <div className={shape.type === 'freehand' || shape.type.includes('line') ? 'col-span-2' : ''}>
                                                <div className="flex justify-between mb-2"><Label className="text-xs text-slate-500">{shape.type.includes('line') ? 'Line Weight' : 'Border Weight'}</Label><span className="text-xs text-slate-400">{shape.borderWidth || 0}px</span></div>
                                                <Slider value={[shape.borderWidth || 0]} onValueChange={([v]) => updateOverlayShape(shape.id, { borderWidth: v })} max={20} />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-slate-500 block mb-1.5">Border Style</Label>
                                                <Select value={shape.borderStyle || 'solid'} onValueChange={(v: any) => updateOverlayShape(shape.id, { borderStyle: v })}>
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="solid" className="text-xs">Solid</SelectItem>
                                                        <SelectItem value="dashed" className="text-xs">Dashed</SelectItem>
                                                        <SelectItem value="dotted" className="text-xs">Dotted</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-slate-500 block mb-1.5">Layer Order</Label>
                                                <Input type="number" value={shape.zIndex} onChange={e => updateOverlayShape(shape.id, { zIndex: parseInt(e.target.value) || 1 })} className="h-8 text-xs" />
                                            </div>
                                        </div>
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
