"use client"

import React, { memo } from "react"
import { Ban } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useUIStore } from "@/lib/stores/ui-store"

const PRESET_COLORS = [
    '#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb', '#f0f9ff',
    '#212121', '#2d2d2d', '#1e293b', '#f5f3ff', '#fff1f2'
];

export const ChartBgColorPicker = memo(() => {
    const canvasBgType = useUIStore(s => s.canvasBgType);
    const canvasBgColor = useUIStore(s => s.canvasBgColor);
    const setCanvasBg = useUIStore(s => s.setCanvasBg);

    const isTransparent = canvasBgType === 'transparent';
    const currentColor = canvasBgColor || '#ffffff';

    const handleColorChange = (color: string) => {
        setCanvasBg('color', color);
    };

    const handleTransparentClick = () => {
        setCanvasBg('transparent');
    };

    return (
        <Popover>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <button
                                className="flex items-center justify-center p-1 rounded hover:bg-gray-100 transition-colors"
                            >
                                {isTransparent ? (
                                    <Ban className="w-4 h-4 text-red-500" />
                                ) : (
                                    <div
                                        className="w-4 h-4 rounded shadow-sm border border-gray-300"
                                        style={{ backgroundColor: currentColor }}
                                    />
                                )}
                            </button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={5} className="z-[100] text-xs font-medium">
                        Background Color
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <PopoverContent className="w-[144px] p-2" sideOffset={8}>
                <div className="space-y-2">
                    {/* Standard Colors Grid - 2 rows of 5 */}
                    <div className="grid grid-cols-5 gap-1.5">
                        {PRESET_COLORS.map((color) => (
                            <button
                                key={color}
                                onClick={() => handleColorChange(color)}
                                className={`w-5 h-5 rounded border transition-all ${!isTransparent && currentColor === color
                                        ? 'border-gray-900 ring-1 ring-gray-900 z-10'
                                        : 'border-gray-200 hover:border-gray-400'
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Third Row: Transparent, Picker text, and Color swatch */}
                    <div className="flex items-center justify-between px-0.5">
                        <button
                            onClick={handleTransparentClick}
                            className={`flex items-center justify-center w-6 h-6 rounded border transition-colors ${isTransparent ? 'bg-gray-100 border-gray-300' : 'border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <Ban className="w-4 h-4 text-red-500" />
                        </button>

                        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-tight">Picker</div>

                        <div className="relative">
                            <div
                                className="w-6 h-6 rounded border border-gray-300 shadow-sm cursor-pointer"
                                style={{ backgroundColor: isTransparent ? '#ffffff' : currentColor }}
                            />
                            <input
                                type="color"
                                value={isTransparent ? '#ffffff' : currentColor}
                                onChange={(e) => handleColorChange(e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
});

ChartBgColorPicker.displayName = "ChartBgColorPicker";
