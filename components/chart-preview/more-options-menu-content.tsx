"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {
    Undo, Redo, ScanSearch, Search, Hand, RulerDimensionLine,
    Palette, Ban, Camera, RotateCcw, Info
} from "lucide-react"
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useUIStore } from "@/lib/stores/ui-store"
import { useSnapStateStore } from "@/lib/stores/snap-state-store"
import { toast } from "sonner"
import { ZoomMenuContent } from "./zoom-menu-content"

const PRESET_COLORS = [
    '#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb', '#f0f9ff',
    '#212121', '#2d2d2d', '#1e293b', '#f5f3ff', '#fff1f2'
];

interface MoreOptionsMenuContentProps {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    isLoupeActive: boolean;
    onToggleLoupe: () => void;
    showZoomPanOutside: boolean;
    currentZoomPct: number;
    closestIndex: number;
    onSliderChange: (value: number[]) => void;
    onResetZoom: () => void;
    onFullDimension: () => void;
    hasFullDimension: boolean;
    onZoomIn: () => void;
    onZoomOut: () => void;
    panMode: boolean;
    onTogglePanMode: () => void;
    dimensionText: string;
    snapTooltip?: string;
    resetTooltip?: string;
    children?: React.ReactNode;
}

export function MoreOptionsMenuContent({
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    isLoupeActive,
    onToggleLoupe,
    showZoomPanOutside,
    currentZoomPct,
    closestIndex,
    onSliderChange,
    onResetZoom,
    onFullDimension,
    hasFullDimension,
    onZoomIn,
    onZoomOut,
    panMode,
    onTogglePanMode,
    dimensionText,
    snapTooltip = "Saves current chart state as the snapshot baseline. Only one snapshot is kept.",
    resetTooltip = "Restores chart to the saved baseline snapshot and clears all undo and redo history.",
    children,
}: MoreOptionsMenuContentProps) {
    const canvasBgType = useUIStore(s => s.canvasBgType);
    const canvasBgColor = useUIStore(s => s.canvasBgColor);
    const setCanvasBg = useUIStore(s => s.setCanvasBg);

    const hasSnap = useSnapStateStore(s => !!s.snapState);
    const captureCurrentState = useSnapStateStore(s => s.captureCurrentState);
    const restoreSnapState = useSnapStateStore(s => s.restoreSnapState);

    const handleSnapState = () => {
        captureCurrentState('manual', null, 'Manual Snapshot');
    };

    const handleResetState = () => {
        if (!hasSnap) return;
        const success = restoreSnapState();
        if (!success) {
            toast.error("Failed to restore snap state.");
        }
    };

    return (
        <DropdownMenuContent align="end" className="w-64 p-1.5 z-[100]">
            {/* 1. Undo, Redo, and Loupe in same row */}
            <div className="flex items-center gap-0.5 px-0.5 py-0.5">
                <button
                    type="button"
                    disabled={!canUndo}
                    onClick={(e) => {
                        e.stopPropagation();
                        onUndo();
                    }}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-md hover:bg-slate-100 transition-colors text-[11px] font-medium text-slate-700 whitespace-nowrap",
                        !canUndo && "opacity-40 cursor-not-allowed hover:bg-transparent text-slate-400"
                    )}
                    title="Undo (Ctrl+Z)"
                >
                    <Undo className="h-3.5 w-3.5 shrink-0" />
                    <span>Undo</span>
                </button>

                <div className="w-[1px] h-3.5 bg-slate-200 shrink-0" />

                <button
                    type="button"
                    disabled={!canRedo}
                    onClick={(e) => {
                        e.stopPropagation();
                        onRedo();
                    }}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-md hover:bg-slate-100 transition-colors text-[11px] font-medium text-slate-700 whitespace-nowrap",
                        !canRedo && "opacity-40 cursor-not-allowed hover:bg-transparent text-slate-400"
                    )}
                    title="Redo (Ctrl+Y)"
                >
                    <Redo className="h-3.5 w-3.5 shrink-0" />
                    <span>Redo</span>
                </button>

                <div className="w-[1px] h-3.5 bg-slate-200 shrink-0" />

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleLoupe();
                    }}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-md transition-colors text-[11px] font-medium cursor-pointer whitespace-nowrap",
                        isLoupeActive
                            ? "bg-blue-100 text-blue-700 font-semibold"
                            : "text-slate-700 hover:bg-slate-100"
                    )}
                    title={isLoupeActive ? "Disable Loupe View (Esc)" : "Amazon Loupe View (Inspect Details)"}
                >
                    <ScanSearch className={cn("h-3.5 w-3.5 shrink-0", isLoupeActive ? "text-blue-700" : "text-slate-500")} />
                    <span>Loupe</span>
                </button>
            </div>

            {/* Zoom & Pan inside dropdown when between 1024px and 1151px and sidebar is expanded */}
            {!showZoomPanOutside && (
                <>
                    <DropdownMenuSeparator className="my-1" />

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center justify-between px-2 py-1.5 text-xs font-medium cursor-pointer rounded-md hover:bg-slate-100">
                            <div className="flex items-center gap-2">
                                <Search className="h-3.5 w-3.5 text-slate-500" />
                                <span>Zoom</span>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-400 font-mono">
                                {currentZoomPct}%
                            </span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-56 p-2 z-[110]" onClick={(e) => e.stopPropagation()}>
                            <ZoomMenuContent
                                currentZoomPct={currentZoomPct}
                                closestIndex={closestIndex}
                                onSliderChange={onSliderChange}
                                onResetZoom={onResetZoom}
                                onFullDimension={onFullDimension}
                                hasFullDimension={hasFullDimension}
                                onZoomIn={onZoomIn}
                                onZoomOut={onZoomOut}
                            />
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuItem
                        onClick={onTogglePanMode}
                        className={cn(
                            "flex items-center justify-between px-2 py-1.5 text-xs font-medium cursor-pointer rounded-md transition-colors",
                            panMode
                                ? "bg-slate-100 text-slate-900 font-semibold"
                                : "hover:bg-slate-100 text-slate-700"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Hand className={cn("h-3.5 w-3.5", panMode ? "text-slate-900" : "text-slate-500")} />
                            <span>Pan Mode</span>
                        </div>
                        <span className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded",
                            panMode ? "bg-slate-200 text-slate-800 font-semibold" : "text-slate-400"
                        )}>
                            {panMode ? "Active" : "Off"}
                        </span>
                    </DropdownMenuItem>
                </>
            )}

            <DropdownMenuSeparator className="my-1" />

            {/* 2. Dimensions and Canvas Background in same row */}
            <div className="flex items-center justify-between gap-1 px-0.5 py-0.5">
                <div
                    className="flex items-center gap-1.5 px-1.5 py-1 text-[11px] font-medium text-slate-500 font-mono tabular-nums min-w-0 truncate"
                    title={`Dimensions: ${dimensionText}`}
                >
                    <RulerDimensionLine className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{dimensionText}</span>
                </div>

                <div className="w-[1px] h-3.5 bg-slate-200 shrink-0" />

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger
                        className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-slate-700 cursor-pointer rounded-md hover:bg-slate-100 data-[state=open]:bg-slate-100 focus:bg-slate-100 shrink-0 [&_svg]:size-3.5"
                        title="Canvas Background"
                    >
                        <Palette className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>Bg</span>
                        <span
                            className="w-3 h-3 rounded-full border border-slate-300 shadow-2xs shrink-0 flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: canvasBgType === 'transparent' ? 'transparent' : (canvasBgColor || '#e5e7eb') }}
                        >
                            {canvasBgType === 'transparent' && <Ban className="w-2.5 h-2.5 text-red-500" />}
                        </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-[160px] p-2.5 z-[110]" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-2">
                            <div className="grid grid-cols-5 gap-1.5">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setCanvasBg('color', color)}
                                        className={`w-5 h-5 rounded border transition-all ${
                                            canvasBgType !== 'transparent' && canvasBgColor === color
                                                ? 'border-gray-900 ring-1 ring-gray-900 z-10'
                                                : 'border-gray-200 hover:border-gray-400'
                                        }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            <div className="h-px bg-gray-100" />
                            <div className="flex items-center justify-between px-0.5">
                                <button
                                    type="button"
                                    onClick={() => setCanvasBg('transparent')}
                                    className={`flex items-center justify-center w-6 h-6 rounded border transition-colors ${
                                        canvasBgType === 'transparent' ? 'bg-gray-100 border-gray-300' : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                    title="Transparent"
                                >
                                    <Ban className="w-4 h-4 text-red-500" />
                                </button>
                                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-tight">Picker</div>
                                <div className="relative">
                                    <div
                                        className="w-6 h-6 rounded border border-gray-300 shadow-sm cursor-pointer"
                                        style={{ backgroundColor: canvasBgType === 'transparent' ? '#ffffff' : (canvasBgColor || '#e5e7eb') }}
                                    />
                                    <input
                                        type="color"
                                        value={canvasBgType === 'transparent' ? '#ffffff' : (canvasBgColor || '#e5e7eb')}
                                        onChange={(e) => setCanvasBg('color', e.target.value)}
                                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            </div>

            <DropdownMenuSeparator className="my-1" />

            {/* 3. Snap State and Reset State in same row */}
            <div className="flex items-center gap-0.5 px-0.5 py-0.5">
                <div className="flex-1 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors min-w-0">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSnapState();
                        }}
                        className="flex items-center justify-center gap-1 py-1.5 pl-1.5 pr-0.5 text-[11px] font-medium text-slate-700 cursor-pointer whitespace-nowrap"
                    >
                        <Camera className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span>Snap State</span>
                    </button>
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                    }}
                                    className="p-0.5 mr-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                                >
                                    <Info className="h-3 w-3" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={6} align="center" className="z-[150] max-w-[210px] p-2 text-xs font-normal text-slate-700 bg-white border border-slate-200 shadow-md">
                                {snapTooltip}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <div className="w-[1px] h-3.5 bg-slate-200 shrink-0" />

                <div className={cn(
                    "flex-1 flex items-center justify-center rounded-md transition-colors min-w-0",
                    hasSnap && "hover:bg-slate-100"
                )}>
                    <button
                        type="button"
                        disabled={!hasSnap}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleResetState();
                        }}
                        className="flex items-center justify-center gap-1 py-1.5 pl-1.5 pr-0.5 text-[11px] font-medium text-slate-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        <RotateCcw className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span>Reset State</span>
                    </button>
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                    }}
                                    className="p-0.5 mr-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                                >
                                    <Info className="h-3 w-3" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={6} align="center" className="z-[150] max-w-[210px] p-2 text-xs font-normal text-slate-700 bg-white border border-slate-200 shadow-md">
                                {resetTooltip}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {children}
        </DropdownMenuContent>
    );
}
