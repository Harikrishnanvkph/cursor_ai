"use client"

import React, { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

export interface Padding4Way {
    top: number
    right: number
    bottom: number
    left: number
}

export interface PaddingTopBottom {
    top: number
    bottom: number
}

export interface PaddingControlProps {
    label?: string
    value?: number | Padding4Way | PaddingTopBottom
    defaultValue?: number
    onChange: (value: any) => void
    className?: string
    max?: number
    mode?: "4-way" | "top-bottom"
}

export function PaddingControl({
    label = "Padding",
    value,
    defaultValue = 0,
    onChange,
    className,
    max = 100,
    mode = "4-way",
}: PaddingControlProps) {
    const isObject = typeof value === 'object' && value !== null
    const top = isObject ? ((value as any).top ?? defaultValue) : (typeof value === 'number' ? value : defaultValue)
    const right = isObject ? ((value as any).right ?? defaultValue) : (typeof value === 'number' ? value : defaultValue)
    const bottom = isObject ? ((value as any).bottom ?? defaultValue) : (typeof value === 'number' ? value : defaultValue)
    const left = isObject ? ((value as any).left ?? defaultValue) : (typeof value === 'number' ? value : defaultValue)

    const isAllEqual = mode === "top-bottom"
        ? top === bottom
        : top === right && right === bottom && bottom === left

    const [isDetailed, setIsDetailed] = useState<boolean>(() => isObject && !isAllEqual)

    const handleUniformChange = (newVal: number) => {
        if (mode === "top-bottom") {
            onChange(newVal)
        } else {
            onChange({ top: newVal, right: newVal, bottom: newVal, left: newVal })
        }
    }

    const handleSideChange = (side: keyof Padding4Way, rawVal: string) => {
        const numVal = Math.max(0, parseInt(rawVal, 10) || 0)
        onChange({
            top: side === 'top' ? numVal : top,
            right: side === 'right' ? numVal : right,
            bottom: side === 'bottom' ? numVal : bottom,
            left: side === 'left' ? numVal : left,
        })
    }

    const handleTopBottomChange = (side: 'top' | 'bottom', rawVal: string) => {
        const numVal = Math.max(0, parseInt(rawVal, 10) || 0)
        onChange({
            top: side === 'top' ? numVal : top,
            bottom: side === 'bottom' ? numVal : bottom,
        })
    }

    return (
        <div className={cn("space-y-1.5 pt-1", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Label className="text-xs font-medium text-slate-700">{label}</Label>
                    {!isDetailed && (
                        <span className="text-xs font-mono text-slate-500">({top}px)</span>
                    )}
                </div>
                <div className="flex items-center bg-slate-100 p-0.5 rounded text-[10px]">
                    <button
                        type="button"
                        onClick={() => {
                            setIsDetailed(false)
                            if (mode === "top-bottom") {
                                onChange(top)
                            } else {
                                onChange({ top, right: top, bottom: top, left: top })
                            }
                        }}
                        className={`px-2 py-0.5 rounded transition-all font-medium cursor-pointer ${
                            !isDetailed
                                ? 'bg-white text-blue-600 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        All
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsDetailed(true)
                            if (mode === "top-bottom" && !isObject) {
                                onChange({ top, bottom: top })
                            }
                        }}
                        className={`px-2 py-0.5 rounded transition-all font-medium cursor-pointer ${
                            isDetailed
                                ? 'bg-white text-blue-600 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        {mode === "top-bottom" ? "Top / Bottom" : "4-Way"}
                    </button>
                </div>
            </div>

            {!isDetailed ? (
                <Slider
                    value={[top]}
                    onValueChange={([val]) => handleUniformChange(val)}
                    max={max}
                    min={0}
                    step={1}
                    className="py-1"
                />
            ) : mode === "top-bottom" ? (
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div>
                        <span className="text-[10px] text-slate-500 block text-center mb-0.5 font-medium">Top (from axis)</span>
                        <div className="flex items-center gap-1">
                            <Input
                                type="number"
                                min={0}
                                max={max}
                                value={top}
                                onChange={(e) => handleTopBottomChange('top', e.target.value)}
                                className="h-8 text-xs text-center px-1 bg-white border-slate-200 font-mono"
                            />
                        </div>
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-500 block text-center mb-0.5 font-medium">Bottom (spacing)</span>
                        <div className="flex items-center gap-1">
                            <Input
                                type="number"
                                min={0}
                                max={max}
                                value={bottom}
                                onChange={(e) => handleTopBottomChange('bottom', e.target.value)}
                                className="h-8 text-xs text-center px-1 bg-white border-slate-200 font-mono"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                    <div>
                        <span className="text-[10px] text-slate-500 block text-center mb-0.5 font-medium">Top</span>
                        <Input
                            type="number"
                            min={0}
                            max={200}
                            value={top}
                            onChange={(e) => handleSideChange('top', e.target.value)}
                            className="h-8 text-xs text-center px-1 bg-white border-slate-200 font-mono"
                        />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-500 block text-center mb-0.5 font-medium">Right</span>
                        <Input
                            type="number"
                            min={0}
                            max={200}
                            value={right}
                            onChange={(e) => handleSideChange('right', e.target.value)}
                            className="h-8 text-xs text-center px-1 bg-white border-slate-200 font-mono"
                        />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-500 block text-center mb-0.5 font-medium">Bottom</span>
                        <Input
                            type="number"
                            min={0}
                            max={200}
                            value={bottom}
                            onChange={(e) => handleSideChange('bottom', e.target.value)}
                            className="h-8 text-xs text-center px-1 bg-white border-slate-200 font-mono"
                        />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-500 block text-center mb-0.5 font-medium">Left</span>
                        <Input
                            type="number"
                            min={0}
                            max={200}
                            value={left}
                            onChange={(e) => handleSideChange('left', e.target.value)}
                            className="h-8 text-xs text-center px-1 bg-white border-slate-200 font-mono"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
