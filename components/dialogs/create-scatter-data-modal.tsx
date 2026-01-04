"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"

interface DataPoint {
    x: number
    y: number
    r?: number
}

interface CreateScatterDataModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    chartType: 'scatter' | 'bubble'
    onDatasetCreate: (datasetName: string, data: DataPoint[], backgroundColor: string) => void
}

function generateRandomColor(): string {
    const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
        '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
}

export function CreateScatterDataModal({
    open,
    onOpenChange,
    chartType,
    onDatasetCreate
}: CreateScatterDataModalProps) {
    const [datasetName, setDatasetName] = useState('')
    const [points, setPoints] = useState<DataPoint[]>([
        { x: 10, y: 20, r: 10 },
        { x: 20, y: 35, r: 15 },
        { x: 30, y: 25, r: 8 }
    ])
    const [backgroundColor, setBackgroundColor] = useState(generateRandomColor())

    const isBubble = chartType === 'bubble'

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            setDatasetName(isBubble ? 'Bubble Dataset' : 'Scatter Dataset')
            setPoints([
                { x: 10, y: 20, r: 10 },
                { x: 20, y: 35, r: 15 },
                { x: 30, y: 25, r: 8 }
            ])
            setBackgroundColor(generateRandomColor())
        }
    }, [open, isBubble])

    const handleAddPoint = () => {
        const lastPoint = points[points.length - 1] || { x: 0, y: 0, r: 10 }
        setPoints([...points, {
            x: lastPoint.x + 10,
            y: Math.floor(Math.random() * 50) + 10,
            r: Math.floor(Math.random() * 15) + 5
        }])
    }

    const handleRemovePoint = (index: number) => {
        if (points.length > 1) {
            setPoints(points.filter((_, i) => i !== index))
        }
    }

    const handleUpdatePoint = (index: number, field: keyof DataPoint, value: string) => {
        const numValue = parseFloat(value)
        if (isNaN(numValue)) return

        setPoints(points.map((point, i) =>
            i === index ? { ...point, [field]: numValue } : point
        ))
    }

    const handleCreate = () => {
        if (!datasetName.trim() || points.length === 0) return

        // For scatter, remove the 'r' property
        const finalData = isBubble
            ? points
            : points.map(({ x, y }) => ({ x, y }))

        onDatasetCreate(datasetName.trim(), finalData as DataPoint[], backgroundColor)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        Create {isBubble ? 'Bubble' : 'Scatter'} Dataset
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                    {/* Dataset Name */}
                    <div className="space-y-2">
                        <Label>Dataset Name</Label>
                        <Input
                            value={datasetName}
                            onChange={(e) => setDatasetName(e.target.value)}
                            placeholder="Enter dataset name"
                        />
                    </div>

                    {/* Color */}
                    <div className="space-y-2">
                        <Label>Point Color</Label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                className="w-10 h-10 rounded border cursor-pointer"
                            />
                            <span className="text-sm text-gray-500">{backgroundColor}</span>
                        </div>
                    </div>

                    {/* Data Points */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Data Points</Label>
                            <span className="text-xs text-gray-500">{points.length} points</span>
                        </div>

                        {/* Header */}
                        <div className={`grid gap-2 text-xs font-medium text-gray-500 px-1 ${isBubble ? 'grid-cols-[1fr_1fr_1fr_32px]' : 'grid-cols-[1fr_1fr_32px]'}`}>
                            <span>X</span>
                            <span>Y</span>
                            {isBubble && <span>Size (R)</span>}
                            <span></span>
                        </div>

                        {/* Points */}
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {points.map((point, index) => (
                                <div
                                    key={index}
                                    className={`grid gap-2 items-center ${isBubble ? 'grid-cols-[1fr_1fr_1fr_32px]' : 'grid-cols-[1fr_1fr_32px]'}`}
                                >
                                    <Input
                                        type="number"
                                        value={point.x}
                                        onChange={(e) => handleUpdatePoint(index, 'x', e.target.value)}
                                        className="h-9"
                                    />
                                    <Input
                                        type="number"
                                        value={point.y}
                                        onChange={(e) => handleUpdatePoint(index, 'y', e.target.value)}
                                        className="h-9"
                                    />
                                    {isBubble && (
                                        <Input
                                            type="number"
                                            value={point.r}
                                            onChange={(e) => handleUpdatePoint(index, 'r', e.target.value)}
                                            className="h-9"
                                            min={1}
                                        />
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemovePoint(index)}
                                        disabled={points.length <= 1}
                                        className="h-9 w-9 text-gray-400 hover:text-red-500"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddPoint}
                            className="w-full gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Point
                        </Button>
                    </div>
                </div>

                <DialogFooter className="gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={!datasetName.trim() || points.length === 0}
                    >
                        Create Chart
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
