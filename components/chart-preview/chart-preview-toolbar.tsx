"use client"
import { useSearchParams } from "next/navigation";

import React, { memo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { STANDARD_CHART_TYPES, THREE_D_CHART_TYPES } from "@/lib/chart-types"
import {
    Download, Maximize2,
    ZoomIn, ZoomOut, Hand, Pencil, Check, Loader2,
    ChartColumn, RulerDimensionLine, Ban, Search, Palette, Upload, Sparkles, ScanSearch, Ellipsis,
    Camera, RotateCcw, Info
} from "lucide-react"
import { useLoupeStore } from "@/lib/stores/loupe-store"
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
    DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Slider } from "@/components/ui/slider"
import { FileCode, FileImage, FileText, ImageIcon, Settings } from "lucide-react"
import { UndoRedoButtons } from "@/components/ui/undo-redo-buttons"
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

const ZOOM_VALUES: number[] = (() => {
    let values: number[] = [];
    for (let i = 10; i <= 50; i += 1) values.push(i);
    for (let i = 52; i <= 100; i += 2) values.push(i);
    for (let i = 103; i <= 160; i += 3) values.push(i);
    for (let i = 165; i <= 210; i += 5) values.push(i);
    for (let i = 216; i <= 300; i += 6) values.push(i);
    for (let i = 310; i <= 380; i += 10) values.push(i);
    for (let i = 392; i <= 500; i += 12) values.push(i);
    return values;
})();

// --- 1. Mode & Type Section (Independent) ---

const ModeAndTypeSection = memo(({
    editorMode, setEditorMode,
    chartType, onChartTypeChange,
    isResponsive, chartContainerRef,
    chartWidth, chartHeight,
    isMobile,
    disabled
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
}) => {
    const btnClassName = isMobile ? "px-2 py-0.5 text-[11px] min-w-[50px]" : "px-2 py-0.5 text-[10px] min-w-[50px]";
    const triggerClassName = isMobile
        ? "h-7 w-12 text-[10px] px-1.5 py-0 border-gray-200 bg-white rounded-lg flex-shrink-0"
        : "h-6 w-9 lg:w-[90px] text-[10px] px-1 lg:px-2 py-0 border-gray-200 bg-white";

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

            <Select value={chartType} onValueChange={onChartTypeChange}>
                <SelectTrigger className={triggerClassName}>
                    <ChartColumn className="h-3.5 w-3.5 lg:hidden text-slate-600 shrink-0 stroke-[2.5]" />
                    <div className="hidden lg:block truncate"><SelectValue placeholder="Type" /></div>
                </SelectTrigger>
                <SelectContent>
                    {STANDARD_CHART_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-xs py-1.5">{type.label}</SelectItem>
                    ))}
                    <SelectSeparator />
                    {THREE_D_CHART_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-xs py-1.5 font-medium text-blue-600">{type.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Divider */}
            <div className="w-px h-4 bg-gray-200 mx-1" />

            {/* Styles Button */}
            <StylesButton />

            {/* Publish as Style Button (Admin only) */}
            <PublishStyleButton />
        </div>
    );
});
ModeAndTypeSection.displayName = "ModeAndTypeSection";

// --- Styles Button (toggles Chart Style Gallery) ---
const StylesButton = memo(() => {
    const { isGalleryOpen, toggleGallery } = useChartStyleStore();
    const hasJSON = useChartStore(s => s.hasJSON);

    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={toggleGallery}
                        data-styles-toggle
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all border ${isGalleryOpen
                                ? 'bg-violet-100 text-violet-700 border-violet-300 shadow-sm'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50'
                            }`}
                    >
                        <Palette className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">Styles</span>
                    </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={5} className="z-[100] text-xs">
                    {isGalleryOpen ? 'Close Style Gallery' : 'Browse Chart Styles'}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
});
StylesButton.displayName = "StylesButton";

// --- Publish Style Button (admin-only) ---
const PublishStyleButton = memo(() => {
    const { user } = useAuth();
    const hasJSON = useChartStore(s => s.hasJSON);
    const [dialogOpen, setDialogOpen] = useState(false);
    
    // Read from useChartStyleStore instead of searchParams!
    const { editPresetId, isBuiltInPreset, presetMetadata } = useChartStyleStore();

    // Only render for admins who have a chart loaded
    if (!user?.is_admin || !hasJSON) return null;

    if (editPresetId) {
        return (
            <>
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => setDialogOpen(true)}
                                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all border bg-white text-emerald-600 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">Update</span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={5} className="z-[100] text-xs">
                            Update this preset with current settings
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <UpdatePresetDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    presetId={editPresetId}
                    initialData={presetMetadata}
                    isBuiltIn={isBuiltInPreset}
                    onSuccess={(newDbId) => {
                        // Update global store values if they change
                        const store = useChartStyleStore.getState();
                        if (newDbId && isBuiltInPreset) {
                            store.setEditPresetId(newDbId);
                            store.setIsBuiltInPreset(false);
                        }
                        // Optionally fetch updated metadata to update store
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
                        });
                    }}
                />
            </>
        );
    }

    return (
        <>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => setDialogOpen(true)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all border bg-white text-emerald-600 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Publish</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={5} className="z-[100] text-xs">
                        Publish current chart as a reusable style preset
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <PublishStyleDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </>
    );
});
PublishStyleButton.displayName = "PublishStyleButton";

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
        <div className="flex items-center gap-1.5 mb-0 min-w-0">
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
                    <h4 className="font-semibold text-gray-900 text-sm truncate border-b-2 border-transparent" title={rename.chartTitle}>{rename.chartTitle}</h4>
                )}
            </div>
        </div>
    );
});
TitleSection.displayName = "TitleSection";

// --- 3. Controls & Actions Section (Independent) ---

const ControlsSection = memo(({ zoomPan, exports, handleFullscreen, isMobile, chartContainerRef, chartWidth, chartHeight, disabled }: {
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
}) => {
    const { isLoupeActive, toggleLoupe } = useLoupeStore();
    const canvasBgType = useUIStore(s => s.canvasBgType);
    const canvasBgColor = useUIStore(s => s.canvasBgColor);
    const setCanvasBg = useUIStore(s => s.setCanvasBg);
    const dimensionText = chartWidth && chartHeight ? `${chartWidth} × ${chartHeight}` : "Responsive";
    const currentZoomPct = Math.round(zoomPan.zoom * 100);

    let closestIndex = 0;
    let minDiff = Infinity;
    for (let i = 0; i < ZOOM_VALUES.length; i++) {
        const diff = Math.abs(ZOOM_VALUES[i] - currentZoomPct);
        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
        }
    }

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



    return (
        <div className={`flex items-center gap-0.5 ${disabled ? 'opacity-40 pointer-events-none select-none' : ''}`}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600" title={`Zoom (${currentZoomPct}%)`}>
                        <Search className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-52 p-2">
                        <DropdownMenuItem onClick={() => { zoomPan.setZoom(1); zoomPan.setPanOffset({ x: 0, y: 0 }); }} className="text-xs py-1.5 cursor-pointer font-medium text-slate-700 focus:bg-slate-100">
                            <span className="flex-1">100% (Fit to View)</span>
                        </DropdownMenuItem>

                        {chartWidth && chartHeight && (
                            <DropdownMenuItem onClick={() => {
                                const applyFullDimension = () => {
                                    let baseScale = 1.0;
                                    if (chartContainerRef?.current) {
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
                                
                                applyFullDimension();
                                // Recalculate after the browser adds scrollbars to get the exact 1:1 scale
                                setTimeout(applyFullDimension, 50);
                            }} className="text-xs py-1.5 cursor-pointer font-medium text-slate-700 focus:bg-slate-100">
                                <span className="flex-1">Full Dimension</span>
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator className="my-1" />

                        <div className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <Slider
                                min={0}
                                max={ZOOM_VALUES.length - 1}
                                step={1}
                                value={[closestIndex]}
                                onValueChange={handleSliderChange}
                                className="cursor-pointer"
                            />
                        </div>

                        <DropdownMenuSeparator className="my-1" />
                        <div className="flex items-center justify-between gap-1 px-1">
                            <DropdownMenuItem
                                onSelect={(e) => { e.preventDefault(); zoomPan.handleZoomOut(); }}
                                className="flex-1 flex items-center justify-center py-2 cursor-pointer focus:bg-slate-100"
                                title="Zoom Out"
                            >
                                <ZoomOut className="h-4 w-4 text-slate-500" />
                            </DropdownMenuItem>
                            <div className="w-[1px] h-4 bg-slate-200" />
                            <DropdownMenuItem
                                onSelect={(e) => { e.preventDefault(); zoomPan.handleZoomIn(); }}
                                className="flex-1 flex items-center justify-center py-2 cursor-pointer focus:bg-slate-100"
                                title="Zoom In"
                            >
                                <ZoomIn className="h-4 w-4 text-slate-500" />
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Amazon Loupe Magnifier Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLoupe}
                    className={`h-7 w-7 p-0 transition-all ${
                        isLoupeActive
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 ring-1 ring-blue-400 shadow-inner'
                            : 'hover:bg-slate-100 text-slate-600'
                    }`}
                    title={isLoupeActive ? "Disable Loupe View (Esc)" : "Amazon Loupe View (Inspect Details)"}
                >
                    <ScanSearch className="h-4 w-4" />
                </Button>

                <div className="w-[1px] h-4 bg-slate-200 mx-0.5 lg:mx-1" />

            <Button variant="ghost" size="sm" onClick={() => zoomPan.setPanMode(!zoomPan.panMode)} className={`h-7 w-7 p-0 text-slate-600 transition-colors ${zoomPan.panMode ? 'bg-slate-200 shadow-inner' : 'hover:bg-slate-100'}`} title={zoomPan.panMode ? "Disable Pan Mode" : "Enable Pan Mode"}>
                <Hand className="h-4 w-4" />
            </Button>

            <div className="w-[1px] h-4 bg-slate-200 mx-0.5 lg:mx-1" />

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

            <div className="w-[1px] h-4 bg-slate-200 mx-0.5 lg:mx-1" />

            {/* More Options (Ellipsis Dropdown) */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600" title="More Options">
                        <Ellipsis className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5 z-[100]">
                    {/* Fullscreen */}
                    <DropdownMenuItem
                        onClick={handleFullscreen}
                        className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md hover:bg-slate-100"
                    >
                        <Maximize2 className="h-4 w-4 text-slate-500" />
                        <span>Fullscreen</span>
                    </DropdownMenuItem>

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
                                <span>Background</span>
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
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-[1px] h-4 bg-slate-200 mx-0.5 lg:mx-1" />

            <UndoRedoButtons variant="ghost" size="sm" showLabels={false} className="gap-0.5" buttonClassName="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600 hover:scale-100" />
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

}: ChartPreviewToolbarProps) => {
    const hasData = useChartStore(s => s.chartData.datasets.length > 0);
    const disabled = !hasData;

    return (
        <div className={`${isMobile ? '' : 'mb-1.5'} flex-shrink-0 px-1`}>
            {rename?.chartTitle && (
                <div className="mb-1 min-w-0">
                    <TitleSection rename={rename} />
                </div>
            )}
            <div className="flex items-center gap-1 flex-wrap min-w-0">
                <ModeAndTypeSection
                    editorMode={editorMode} setEditorMode={setEditorMode}
                    chartType={chartType} onChartTypeChange={onChartTypeChange}
                    isResponsive={isResponsive} chartContainerRef={chartContainerRef}
                    chartWidth={chartWidth} chartHeight={chartHeight}
                    isMobile={false}
                    disabled={disabled}
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
                />
            </div>
        </div>
    );
});
ChartPreviewToolbar.displayName = "ChartPreviewToolbar";
