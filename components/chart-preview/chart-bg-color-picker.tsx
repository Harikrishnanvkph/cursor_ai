"use client"

import React, { memo } from "react"
import { Ban, ChevronDown, Palette } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useUIStore } from "@/lib/stores/ui-store"

const PRESET_COLORS = [
    '#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb', '#f0f9ff',
    '#212121', '#2d2d2d', '#1e293b', '#f5f3ff', '#fff1f2'
];

export const ChartBgColorPicker = memo(({ 
    className, 
    innerClassName, 
    disabled, 
    variant = "button" 
}: { 
    className?: string, 
    innerClassName?: string, 
    disabled?: boolean, 
    variant?: "button" | "dropdown-item" 
}) => {
    const canvasBgType = useUIStore(s => s.canvasBgType);
    const canvasBgColor = useUIStore(s => s.canvasBgColor);
    const setCanvasBg = useUIStore(s => s.setCanvasBg);

    const isTransparent = canvasBgType === 'transparent';
    const currentColor = canvasBgColor || '#e5e7eb';

    const handleColorChange = (color: string) => {
        setCanvasBg('color', color);
    };

    const handleTransparentClick = () => {
        setCanvasBg('transparent');
    };

    const innerSizeClass = innerClassName || "w-5 h-5";

    const [isOpen, setIsOpen] = React.useState(false);

    if (variant === "dropdown-item") {
        return (
            <div className="rounded-lg overflow-hidden transition-colors">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(prev => !prev);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed select-none"
                >
                    <div className="flex items-center gap-2.5">
                        <Palette className="h-4 w-4 text-purple-500 shrink-0" />
                        <span>Canvas Background</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div
                            className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-600 shadow-sm flex items-center justify-center overflow-hidden shrink-0"
                            style={{ backgroundColor: isTransparent ? 'transparent' : currentColor }}
                            title={isTransparent ? 'Transparent' : currentColor}
                        >
                            {isTransparent && <Ban className="w-3.5 h-3.5 text-red-500" />}
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-purple-500' : ''}`} />
                    </div>
                </button>

                {isOpen && (
                    <div
                        className="px-2.5 py-2 mt-1 mb-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Presets Grid */}
                        <div className="grid grid-cols-5 gap-1.5">
                            {PRESET_COLORS.map((color) => {
                                const isSelected = !isTransparent && currentColor.toLowerCase() === color.toLowerCase();
                                return (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => handleColorChange(color)}
                                        className={`h-6 w-full rounded-md border transition-all relative flex items-center justify-center ${
                                            isSelected
                                                ? 'border-indigo-600 ring-2 ring-indigo-500/30 scale-105 z-10'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    >
                                        {isSelected && (
                                            <div className={`w-1.5 h-1.5 rounded-full ${color === '#ffffff' || color === '#f9fafb' || color === '#f3f4f6' || color === '#f0f9ff' || color === '#fff1f2' ? 'bg-slate-900' : 'bg-white'}`} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="h-px bg-slate-200/70 dark:bg-slate-700/70" />

                        {/* Bottom Actions: Clear & Custom Picker */}
                        <div className="flex items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={handleTransparentClick}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                                    isTransparent
                                        ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                                title="Transparent Background"
                            >
                                <Ban className="w-3.5 h-3.5 text-red-500" />
                                <span>Clear</span>
                            </button>

                            <label className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors relative">
                                <div
                                    className="w-3.5 h-3.5 rounded-sm border border-slate-300 dark:border-slate-600 shadow-sm"
                                    style={{ backgroundColor: isTransparent ? '#ffffff' : currentColor }}
                                />
                                <span>Custom</span>
                                <input
                                    type="color"
                                    value={isTransparent ? '#ffffff' : currentColor}
                                    onChange={(e) => handleColorChange(e.target.value)}
                                    className="sr-only"
                                />
                            </label>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <Popover>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <button
                                className={className || "flex items-center justify-center p-1 rounded hover:bg-gray-100 transition-colors"}
                                disabled={disabled}
                            >
                                {isTransparent ? (
                                    <Ban className={`${innerSizeClass} text-red-500`} />
                                ) : (
                                    <div
                                        className={`${innerSizeClass} rounded shadow-sm border border-gray-300`}
                                        style={{ backgroundColor: currentColor }}
                                    />
                                )}
                            </button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={5} className="z-[100] text-xs font-medium">
                        Canvas Background
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <PopoverContent className="w-[144px] p-2 z-[200] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl" sideOffset={8}>
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
