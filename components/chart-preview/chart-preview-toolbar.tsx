"use client"
import { useSearchParams } from "next/navigation";

import React, { memo, useState, useEffect } from "react"
import { useStore } from "zustand"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CATEGORIZED_CHART_TYPES, getChartLabel, STANDARD_CHART_TYPES, THREE_D_CHART_TYPES } from "@/lib/chart-types"
import { ChartTypeSelector } from "./chart-type-selector"
import {
    Download, Maximize2,
    ZoomIn, ZoomOut, Hand, Pencil, Check, Loader2,
    ChartColumn, RulerDimensionLine, Ban, Search, Palette, Upload, Sparkles, ScanSearch, Ellipsis,
    Camera, RotateCcw, Info, ChevronDown, Undo, Redo
} from "lucide-react"
import { useLoupeStore } from "@/lib/stores/loupe-store"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
    DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Slider } from "@/components/ui/slider"
import { FileCode, FileImage, FileText, ImageIcon, Settings } from "lucide-react"
import { useTemplateStore } from "@/lib/template-store"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { useUIStore } from "@/lib/stores/ui-store"
import { useChartStore } from "@/lib/chart-store"
import { useChartStyleStore } from "@/lib/stores/chart-style-store"
import { useSnapStateStore } from "@/lib/stores/snap-state-store"
import { toast } from "sonner"
import { ChartBgColorPicker } from "./chart-bg-color-picker"
import { useAuth } from "@/components/auth/AuthProvider"
import { PublishStyleDialog } from "@/components/chart-style-gallery/publish-dialog"
import { UpdatePresetDialog } from "@/components/chart-style-gallery/update-preset-dialog"
import { dataService } from "@/lib/data-service"
import { useEditorSidebarContext } from "@/components/editor/editor-sidebar-context"
import { useIsCompactDesktop } from "@/lib/hooks/use-screen-dimensions"
import { ZoomMenuContent, ZOOM_VALUES, getClosestZoomIndex } from "./zoom-menu-content"

// --- 1. Mode & Type Section (Independent) ---

const ModeAndTypeSection = memo(({
    editorMode, setEditorMode,
    chartType, onChartTypeChange,
    isResponsive, chartContainerRef,
    chartWidth, chartHeight,
    isMobile,
    disabled,
    isLeftSidebarCollapsed,
}: {
    editorMode: string;
    setEditorMode: (mode: string) => void;
    chartType: string;
    onChartTypeChange: (type: string) => void;
    isResponsive: boolean;
    chartContainerRef: React.RefObject<HTMLDivElement | null>;
    chartWidth?: number;
    chartHeight?: number;
    isMobile: boolean;
    disabled?: boolean;
    isLeftSidebarCollapsed?: boolean;
}) => {
    const btnClassName = isMobile ? "px-2 py-0.5 text-[11px] min-w-[50px]" : "px-2 py-0.5 text-[10px] min-w-[50px]";

    return (
        <div className={`flex items-center gap-1 flex-shrink-0 ${disabled ? 'opacity-40 pointer-events-none select-none' : ''}`}>
            <div className="flex items-center gap-0 bg-gray-100 rounded-full p-[2px] border border-gray-200">
                <button
                    onClick={() => setEditorMode('chart')}
                    className={`${btnClassName} font-medium rounded-full transition-all ${editorMode === 'chart' ? 'bg-blue-500 text-white shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                >Chart</button>
                <button
                    onClick={() => {
                        const templateStore = useTemplateStore.getState()
                        const formatStore = useFormatGalleryStore.getState()
                        if (!templateStore.currentTemplate && !formatStore.selectedFormatId) {
                            templateStore.applyTemplate('template-1')
                            useUIStore.getState().setActiveSidebarTab('templates')
                        }
                        setEditorMode('template')
                    }}
                    className={`${btnClassName} font-medium rounded-full transition-all ${editorMode === 'template' ? 'bg-blue-500 text-white shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                >Template</button>
            </div>

            <ChartTypeSelector
                value={chartType}
                onChange={onChartTypeChange}
                variant="toolbar"
                isMobile={isMobile}
                disabled={disabled}
                isLeftSidebarCollapsed={isLeftSidebarCollapsed}
            />
        </div>
    );
});
ModeAndTypeSection.displayName = "ModeAndTypeSection";

// --- 2. Title Section (Independent) ---

const TitleSection = memo(({ rename }: {
    rename: {
        chartTitle: string;
        isRenaming: boolean;
        renameValue: string;
        isSavingRename: boolean;
        renameInputRef: React.RefObject<HTMLInputElement | null>;
        canEditTitle: boolean;
        handleStartRename: () => void;
        handleSaveRename: () => void;
        handleRenameKeyDown: (e: React.KeyboardEvent) => void;
        setRenameValue: (v: string) => void;
        setIsRenaming: React.Dispatch<React.SetStateAction<boolean>>;
    }
}) => {
    if (!rename.chartTitle) return null;

    return (
        <div className="flex items-center gap-1.5 mb-0 min-w-0 w-full">
            {rename.canEditTitle && (
                <button onClick={rename.handleStartRename} className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0" title="Rename">
                    <Pencil className="h-3 w-3" />
                </button>
            )}
            <div className="flex items-center gap-1 flex-1 min-w-0">
                {rename.isRenaming && rename.canEditTitle ? (
                    <>
                        <input
                            ref={rename.renameInputRef as any}
                            type="text"
                            value={rename.renameValue}
                            onChange={(e) => rename.setRenameValue(e.target.value)}
                            onKeyDown={rename.handleRenameKeyDown}
                            onBlur={() => rename.setIsRenaming(false)}
                            className="flex-1 min-w-0 font-semibold text-gray-900 text-sm bg-transparent border-b-2 border-blue-400 outline-none w-full text-ellipsis overflow-hidden whitespace-nowrap px-0 pb-0.5 focus:border-blue-500"
                            disabled={rename.isSavingRename}
                        />
                        <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={rename.handleSaveRename}
                            disabled={rename.isSavingRename}
                            className="p-0.5 hover:bg-green-50 rounded text-green-600 flex-shrink-0"
                            title="Save"
                        >
                            {rename.isSavingRename ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        </button>
                    </>
                ) : (
                    <h4 className="font-semibold text-gray-900 text-sm truncate border-b-2 border-transparent max-w-full" title={rename.chartTitle}>{rename.chartTitle}</h4>
                )}
            </div>
        </div>
    );
});
TitleSection.displayName = "TitleSection";

// --- 3. Controls & Actions Section (Independent) ---

const ControlsSection = memo(({ zoomPan, exports, handleFullscreen, isMobile, chartContainerRef, chartWidth, chartHeight, disabled, isLeftSidebarCollapsed }: {
    zoomPan: {
        zoom: number;
        panMode: boolean;
        setPanMode: (v: boolean) => void;
        handleZoomIn: () => void;
        handleZoomOut: () => void;

        setZoom: (z: number) => void;
        setPanOffset: (offset: { x: number; y: number }) => void;
    };
    exports: {
        handleExport: (exportScale?: number) => void;
        handleExportHTML: () => void;
        handleExportJPEG: (exportScale?: number) => void;
        handleExportCSV: () => void;
        handleExportSettings: () => void;
    };
    handleFullscreen: () => void;

    isMobile: boolean;
    chartContainerRef?: React.RefObject<HTMLDivElement | null>;
    chartWidth?: number;
    chartHeight?: number;
    disabled?: boolean;
    isLeftSidebarCollapsed?: boolean;
}) => {
    const sidebarContext = useEditorSidebarContext();
    const effectiveLeftSidebarCollapsed = isLeftSidebarCollapsed !== undefined 
        ? isLeftSidebarCollapsed 
        : sidebarContext.leftSidebarCollapsed;

    const isCompactDesktop = useIsCompactDesktop();
    // Between 1024px and 1151px:
    // If left sidebar is expanded (!effectiveLeftSidebarCollapsed): hide zoom & pan outside, show inside ellipsis dropdown.
    // If left sidebar is collapsed (effectiveLeftSidebarCollapsed): show zoom & pan outside as icon buttons.
    // For >= 1152px (and < 1024px): show zoom & pan outside.
    const showZoomPanOutside = !isCompactDesktop || effectiveLeftSidebarCollapsed;

    const { isLoupeActive, toggleLoupe } = useLoupeStore();
    const { isGalleryOpen, toggleGallery, editPresetId, isBuiltInPreset, presetMetadata } = useChartStyleStore();
    const { undo: temporalUndo, redo: temporalRedo, pastStates, futureStates } = useStore(useChartStore.temporal);
    const canUndo = pastStates.length > 0;
    const canRedo = futureStates.length > 0;

    const { user } = useAuth();
    const hasJSON = useChartStore(s => s.hasJSON);
    const [publishDialogOpen, setPublishDialogOpen] = useState(false);

    const canvasBgType = useUIStore(s => s.canvasBgType);
    const canvasBgColor = useUIStore(s => s.canvasBgColor);
    const setCanvasBg = useUIStore(s => s.setCanvasBg);
    const dimensionText = chartWidth && chartHeight ? `${chartWidth} × ${chartHeight}` : "Responsive";
    const currentZoomPct = Math.round(zoomPan.zoom * 100);
    const closestIndex = getClosestZoomIndex(currentZoomPct);

    const handleResetZoom = () => {
        zoomPan.setZoom(1);
        zoomPan.setPanOffset({ x: 0, y: 0 });
    };

    const applyFullDimension = () => {
        let baseScale = 1.0;
        if (chartContainerRef?.current && chartWidth && chartHeight) {
            const cWidth = chartContainerRef.current.clientWidth || 800;
            const cHeight = chartContainerRef.current.clientHeight || 600;
            const padding = 40;
            const availableWidth = Math.max(10, cWidth - padding);
            const availableHeight = Math.max(10, cHeight - padding);
            const scaleX = availableWidth / chartWidth;
            const scaleY = availableHeight / chartHeight;
            baseScale = Math.min(scaleX, scaleY, 1.0);
        }
        zoomPan.setZoom(1.0 / baseScale);
        zoomPan.setPanOffset({ x: 0, y: 0 });
    };

    const snapState = useSnapStateStore(s => s.snapState);
    const captureCurrentState = useSnapStateStore(s => s.captureCurrentState);
    const restoreSnapState = useSnapStateStore(s => s.restoreSnapState);
    const hasSnap = !!snapState;

    const handleSnapState = () => {
        captureCurrentState('manual', null, 'Manual Snapshot');
        toast.success("Snapshot baseline saved!");
    };

    const handleResetState = () => {
        if (!hasSnap) {
            toast.error("No snap state saved yet.");
            return;
        }
        const success = restoreSnapState();
        if (success) {
            toast.success("Restored to baseline snapshot. Undo/redo history reset.");
        } else {
            toast.error("Failed to restore snap state.");
        }
    };

    const handleSliderChange = (value: number[]) => {
        const newZoomPct = ZOOM_VALUES[value[0]];
        zoomPan.setZoom(newZoomPct / 100);
    };

    // Keyboard shortcuts for Undo (Ctrl+Z) and Redo (Ctrl+Y / Ctrl+Shift+Z)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                return;
            }
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        temporalRedo();
                    } else {
                        temporalUndo();
                    }
                } else if (e.key === 'y') {
                    e.preventDefault();
                    temporalRedo();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [temporalUndo, temporalRedo]);

    return (
        <div className={`flex items-center gap-1 ${disabled ? 'opacity-40 pointer-events-none select-none' : ''}`}>
            {/* Zoom Menu and Pan Button (Rendered outside when wide or left sidebar collapsed) */}
            {showZoomPanOutside && (
                <>
                    {/* Zoom Menu (Icon only) */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600 rounded-md" title={`Zoom (${currentZoomPct}%)`}>
                                <Search className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 z-[110]" onClick={(e) => e.stopPropagation()}>
                            <ZoomMenuContent
                                currentZoomPct={currentZoomPct}
                                closestIndex={closestIndex}
                                onSliderChange={handleSliderChange}
                                onResetZoom={handleResetZoom}
                                onFullDimension={applyFullDimension}
                                hasFullDimension={!!(chartWidth && chartHeight)}
                                onZoomIn={zoomPan.handleZoomIn}
                                onZoomOut={zoomPan.handleZoomOut}
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Pan Mode Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => zoomPan.setPanMode(!zoomPan.panMode)}
                        className={cn(
                            "h-7 w-7 p-0 transition-colors rounded-md",
                            zoomPan.panMode
                                ? "bg-slate-200 text-slate-900 shadow-inner"
                                : "hover:bg-slate-100 text-slate-600"
                        )}
                        title={zoomPan.panMode ? "Disable Pan Mode" : "Enable Pan Mode"}
                    >
                        <Hand className={cn("h-4 w-4", zoomPan.panMode ? "text-slate-900" : "text-slate-600")} />
                    </Button>
                </>
            )}

            {/* Export / Download Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600" title="Export Image / Data"><Download className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 p-1.5 z-[100]">
                    <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Export Chart
                    </div>

                    {/* PNG Submenu */}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md hover:bg-slate-100">
                            <FileImage className="h-4 w-4 text-indigo-600" />
                            <span>PNG Image</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-64 p-1.5 z-[110]">
                            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                PNG Quality
                            </div>
                            <DropdownMenuItem
                                onClick={() => exports.handleExport(4)}
                                className="flex items-center justify-between py-2 cursor-pointer focus:bg-indigo-50"
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-xs text-slate-900">Crystal Clear (4x)</span>
                                        <span className="text-[10px] text-slate-500">Maximum clarity · Print-ready</span>
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded shrink-0">UHD</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => exports.handleExport(3)}
                                className="flex items-center justify-between py-2 cursor-pointer focus:bg-blue-50"
                            >
                                <div className="flex items-center gap-2">
                                    <FileImage className="h-4 w-4 text-blue-600 shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-xs text-slate-900">High Quality (3x)</span>
                                        <span className="text-[10px] text-slate-500">Very sharp · Presentations & 4K</span>
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded shrink-0">3K</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => exports.handleExport(2)}
                                className="flex items-center justify-between py-2 cursor-pointer focus:bg-slate-50"
                            >
                                <div className="flex items-center gap-2">
                                    <FileImage className="h-4 w-4 text-slate-600 shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-xs text-slate-900">Enhanced (2x)</span>
                                        <span className="text-[10px] text-slate-500">Crisp · Web & social</span>
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0">2K</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => exports.handleExport(1)}
                                className="flex items-center justify-between py-2 cursor-pointer focus:bg-slate-50"
                            >
                                <div className="flex items-center gap-2">
                                    <FileImage className="h-4 w-4 text-slate-400 shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-xs text-slate-900">Normal (1x)</span>
                                        <span className="text-[10px] text-slate-500">Standard resolution · Light size</span>
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0">1x</span>
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    {/* JPEG Submenu */}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md hover:bg-slate-100">
                            <ImageIcon className="h-4 w-4 text-amber-600" />
                            <span>JPEG Image</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-64 p-1.5 z-[110]">
                            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                JPEG Quality
                            </div>
                            <DropdownMenuItem
                                onClick={() => exports.handleExportJPEG(4)}
                                className="flex items-center justify-between py-2 cursor-pointer focus:bg-amber-50"
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-xs text-slate-900">Crystal Clear (4x)</span>
                                        <span className="text-[10px] text-slate-500">Maximum clarity · Print-ready</span>
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded shrink-0">UHD</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => exports.handleExportJPEG(3)}
                                className="flex items-center justify-between py-2 cursor-pointer focus:bg-blue-50"
                            >
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-blue-600 shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-xs text-slate-900">High Quality (3x)</span>
                                        <span className="text-[10px] text-slate-500">Very sharp · Presentations & 4K</span>
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded shrink-0">3K</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => exports.handleExportJPEG(2)}
                                className="flex items-center justify-between py-2 cursor-pointer focus:bg-slate-50"
                            >
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-slate-600 shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-xs text-slate-900">Enhanced (2x)</span>
                                        <span className="text-[10px] text-slate-500">Crisp · Web & email</span>
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0">2K</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => exports.handleExportJPEG(1)}
                                className="flex items-center justify-between py-2 cursor-pointer focus:bg-slate-50"
                            >
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-slate-400 shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-xs text-slate-900">Normal (1x)</span>
                                        <span className="text-[10px] text-slate-500">Standard resolution · Small file</span>
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0">1x</span>
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuSeparator className="my-1" />

                    <DropdownMenuItem onClick={exports.handleExportHTML} className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md hover:bg-slate-100">
                        <FileCode className="h-4 w-4 text-emerald-600" />
                        <span>Interactive HTML</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exports.handleExportCSV} className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md hover:bg-slate-100">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <span>CSV Data</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

            {/* More Options (Ellipsis Dropdown) */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600 rounded-md" title="More Options">
                        <Ellipsis className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-1.5 z-[100]">
                    {/* 1. First: Redo and Undo */}
                    <div className="flex items-center px-1 py-0.5">
                        <button
                            type="button"
                            disabled={!canUndo}
                            onClick={(e) => {
                                e.stopPropagation();
                                temporalUndo();
                            }}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-1.5 px-2 rounded-md hover:bg-slate-100 transition-colors text-xs font-medium text-slate-700",
                                !canUndo && "opacity-40 cursor-not-allowed hover:bg-transparent text-slate-400"
                            )}
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo className="h-4 w-4 shrink-0" />
                            <span>Undo</span>
                        </button>

                        <div className="w-[1px] h-4 bg-slate-200 shrink-0 mx-1" />

                        <button
                            type="button"
                            disabled={!canRedo}
                            onClick={(e) => {
                                e.stopPropagation();
                                temporalRedo();
                            }}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-1.5 px-2 rounded-md hover:bg-slate-100 transition-colors text-xs font-medium text-slate-700",
                                !canRedo && "opacity-40 cursor-not-allowed hover:bg-transparent text-slate-400"
                            )}
                            title="Redo (Ctrl+Y)"
                        >
                            <Redo className="h-4 w-4 shrink-0" />
                            <span>Redo</span>
                        </button>
                    </div>

                    <DropdownMenuSeparator className="my-1" />

                    {/* 2. Full Screen and Loupe on same line */}
                    <div className="flex items-center px-1 py-0.5">
                        <button
                            type="button"
                            onClick={() => {
                                handleFullscreen();
                            }}
                            className="flex-1 flex items-center justify-center gap-2 py-1.5 px-2 rounded-md hover:bg-slate-100 transition-colors text-xs font-medium text-slate-700 cursor-pointer"
                            title="Fullscreen"
                        >
                            <Maximize2 className="h-4 w-4 text-slate-500 shrink-0" />
                            <span>Full Screen</span>
                        </button>

                        <div className="w-[1px] h-4 bg-slate-200 shrink-0 mx-1" />

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleLoupe();
                            }}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-1.5 px-2 rounded-md transition-colors text-xs font-medium cursor-pointer",
                                isLoupeActive
                                    ? "bg-blue-100 text-blue-700 font-semibold"
                                    : "text-slate-700 hover:bg-slate-100"
                            )}
                            title={isLoupeActive ? "Disable Loupe View (Esc)" : "Amazon Loupe View (Inspect Details)"}
                        >
                            <ScanSearch className={cn("h-4 w-4 shrink-0", isLoupeActive ? "text-blue-700" : "text-slate-500")} />
                            <span>Loupe</span>
                        </button>
                    </div>

                    {/* 3. Zoom & Pan inside dropdown when between 1024px and 1151px and sidebar is expanded */}
                    {!showZoomPanOutside && (
                        <>
                            <DropdownMenuSeparator className="my-1" />

                            {/* Zoom Submenu */}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="flex items-center justify-between px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md hover:bg-slate-100">
                                    <div className="flex items-center gap-2.5">
                                        <Search className="h-4 w-4 text-slate-500" />
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
                                        onSliderChange={handleSliderChange}
                                        onResetZoom={handleResetZoom}
                                        onFullDimension={applyFullDimension}
                                        hasFullDimension={!!(chartWidth && chartHeight)}
                                        onZoomIn={zoomPan.handleZoomIn}
                                        onZoomOut={zoomPan.handleZoomOut}
                                    />
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            {/* Pan Mode */}
                            <DropdownMenuItem
                                onClick={() => zoomPan.setPanMode(!zoomPan.panMode)}
                                className={cn(
                                    "flex items-center justify-between px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md transition-colors",
                                    zoomPan.panMode
                                        ? "bg-slate-100 text-slate-900 font-semibold"
                                        : "hover:bg-slate-100 text-slate-700"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Hand className={cn("h-4 w-4", zoomPan.panMode ? "text-slate-900" : "text-slate-500")} />
                                    <span>Pan Mode</span>
                                </div>
                                <span className={cn(
                                    "text-[10px] font-medium px-1.5 py-0.5 rounded",
                                    zoomPan.panMode ? "bg-slate-200 text-slate-800 font-semibold" : "text-slate-400"
                                )}>
                                    {zoomPan.panMode ? "Active" : "Off"}
                                </span>
                            </DropdownMenuItem>
                        </>
                    )}

                    <DropdownMenuSeparator className="my-1.5" />

                    {/* Dimensions */}
                    <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="flex items-center justify-between px-2.5 py-2 text-xs font-medium cursor-default rounded-md hover:bg-slate-50"
                    >
                        <div className="flex items-center gap-2.5">
                            <RulerDimensionLine className="h-4 w-4 text-slate-500" />
                            <span>Dimensions</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400 font-mono">
                            {dimensionText}
                        </span>
                    </DropdownMenuItem>

                    {/* Background Color */}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center justify-between px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md hover:bg-slate-100">
                            <div className="flex items-center gap-2.5">
                                <Palette className="h-4 w-4 text-slate-500" />
                                <span>Canvas Background</span>
                            </div>
                            <div
                                className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs mr-1"
                                style={{ backgroundColor: canvasBgType === 'transparent' ? 'transparent' : (canvasBgColor || '#e5e7eb') }}
                            />
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-[160px] p-2.5 z-[110]" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-2">
                                <div className="grid grid-cols-5 gap-1.5">
                                    {['#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb', '#f0f9ff', '#212121', '#2d2d2d', '#1e293b', '#f5f3ff', '#fff1f2'].map((color) => (
                                        <button
                                            key={color}
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

                    <DropdownMenuSeparator className="my-1" />

                    {/* Snap State */}
                    <DropdownMenuItem
                        onClick={handleSnapState}
                        className="flex items-center justify-between px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md hover:bg-slate-100 group"
                    >
                        <div className="flex items-center gap-2.5">
                            <Camera className="h-4 w-4 text-indigo-500" />
                            <span>Snap State</span>
                        </div>
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                        }}
                                        className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <Info className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={10} align="center" className="z-[150] max-w-[210px] p-2 text-xs font-normal text-slate-700 bg-white border border-slate-200 shadow-md">
                                    Saves current chart state as the snapshot baseline. Only one snapshot is kept.
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </DropdownMenuItem>

                    {/* Reset State */}
                    <DropdownMenuItem
                        onClick={handleResetState}
                        disabled={!hasSnap}
                        className="flex items-center justify-between px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed group"
                    >
                        <div className="flex items-center gap-2.5">
                            <RotateCcw className="h-4 w-4 text-amber-500" />
                            <span>Reset State</span>
                        </div>
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                        }}
                                        className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <Info className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={10} align="center" className="z-[150] max-w-[210px] p-2 text-xs font-normal text-slate-700 bg-white border border-slate-200 shadow-md">
                                    Restores chart to the saved baseline snapshot and clears all undo and redo history.
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-1.5" />

                    {/* 4. Last: show Chart styles */}
                    <DropdownMenuItem
                        onClick={() => {
                            toggleGallery();
                        }}
                        data-styles-toggle
                        className={cn(
                            "flex items-center justify-between px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md transition-colors",
                            isGalleryOpen
                                ? "bg-violet-50 text-violet-700 focus:bg-violet-100"
                                : "hover:bg-violet-50 text-slate-700 hover:text-violet-700 focus:bg-violet-50 focus:text-violet-700"
                        )}
                    >
                        <div className="flex items-center gap-2.5">
                            <Palette className={cn("h-4 w-4", isGalleryOpen ? "text-violet-600" : "text-violet-500")} />
                            <span className="font-medium">Chart Styles</span>
                        </div>
                        <span className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded",
                            isGalleryOpen ? "bg-violet-100 text-violet-700 font-semibold" : "text-slate-400"
                        )}>
                            {isGalleryOpen ? 'Open' : 'Gallery'}
                        </span>
                    </DropdownMenuItem>

                    {/* Publish/Update Style Preset (Admin only) */}
                    {user?.is_admin && hasJSON && (
                        <DropdownMenuItem
                            onClick={() => setPublishDialogOpen(true)}
                            className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md hover:bg-emerald-50 text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700"
                        >
                            <Upload className="h-4 w-4 text-emerald-600" />
                            <span>{editPresetId ? "Update Style Preset" : "Publish Style Preset"}</span>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Admin dialogs for styles preset */}
            {user?.is_admin && hasJSON && (
                editPresetId ? (
                    <UpdatePresetDialog
                        open={publishDialogOpen}
                        onOpenChange={setPublishDialogOpen}
                        presetId={editPresetId}
                        initialData={presetMetadata}
                        isBuiltIn={isBuiltInPreset}
                        onSuccess={(newDbId) => {
                            const store = useChartStyleStore.getState();
                            if (newDbId && isBuiltInPreset) {
                                store.setEditPresetId(newDbId);
                                store.setIsBuiltInPreset(false);
                                window.history.replaceState(null, '', `/editor?editPresetId=${newDbId}`);
                            }
                            store.invalidateCache().catch(console.error);
                            const idToFetch = newDbId || editPresetId;
                            dataService.getChartStylePreset(idToFetch).then((res) => {
                                if (res.data) {
                                    store.setPresetMetadata({
                                        name: res.data.name,
                                        description: res.data.description || '',
                                        category: res.data.category || 'minimal',
                                        tags: res.data.tags || [],
                                        isOfficial: res.data.is_official || false,
                                    });
                                }
                            }).catch(console.error);
                        }}
                    />
                ) : (
                    <PublishStyleDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen} />
                )
            )}
        </div>
    );
});
ControlsSection.displayName = "ControlsSection";

// --- Main Toolbar ---

interface ChartPreviewToolbarProps {
    isMobile: boolean;
    editorMode: string;
    setEditorMode: (mode: string) => void;
    chartType: string;
    onChartTypeChange: (type: string) => void;
    isResponsive: boolean;
    chartContainerRef: React.RefObject<HTMLDivElement | null>;
    chartWidth?: number;
    chartHeight?: number;
    rename: any;
    zoomPan: any;
    exports: any;
    handleFullscreen: () => void;
    isLeftSidebarCollapsed?: boolean;
}

export const ChartPreviewToolbar = memo(({
    isMobile,
    editorMode,
    setEditorMode,
    chartType,
    onChartTypeChange,
    isResponsive,
    chartContainerRef,
    chartWidth,
    chartHeight,
    rename,
    zoomPan,
    exports,
    handleFullscreen,
    isLeftSidebarCollapsed,
}: ChartPreviewToolbarProps) => {
    const hasData = useChartStore(s => s.chartData.datasets.length > 0);
    const disabled = !hasData;

    return (
        <div className={`${isMobile ? 'py-0.5 px-1' : 'px-2 py-1 mb-1'} flex items-center justify-between gap-2.5 flex-shrink-0 w-full min-w-0`}>
            {rename?.chartTitle && (
                <div className="flex-1 min-w-0 pr-1">
                    <TitleSection rename={rename} />
                </div>
            )}
            <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                <ModeAndTypeSection
                    editorMode={editorMode} setEditorMode={setEditorMode}
                    chartType={chartType} onChartTypeChange={onChartTypeChange}
                    isResponsive={isResponsive} chartContainerRef={chartContainerRef}
                    chartWidth={chartWidth} chartHeight={chartHeight}
                    isMobile={false}
                    disabled={disabled}
                    isLeftSidebarCollapsed={isLeftSidebarCollapsed}
                />
                <div className="w-[1px] h-3.5 bg-gray-200 mx-0.5" />
                <ControlsSection
                    zoomPan={zoomPan} exports={exports}
                    handleFullscreen={handleFullscreen}
                    isMobile={false}
                    chartContainerRef={chartContainerRef}
                    chartWidth={chartWidth}
                    chartHeight={chartHeight}
                    disabled={disabled}
                    isLeftSidebarCollapsed={isLeftSidebarCollapsed}
                />
            </div>
        </div>
    );
});
ChartPreviewToolbar.displayName = "ChartPreviewToolbar";
