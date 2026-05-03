"use client"

import React, { memo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { STANDARD_CHART_TYPES, THREE_D_CHART_TYPES } from "@/lib/chart-types"
import {
    Download, RefreshCw, Maximize2, RotateCcw,
    Ellipsis, ZoomIn, ZoomOut, Hand, Pencil, Check, Loader2,
    ChartColumn, RulerDimensionLine, Ban, Search, Palette, Upload
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Slider } from "@/components/ui/slider"
import { FileCode, FileImage, FileText, ImageIcon, Settings } from "lucide-react"
import { UndoRedoButtons } from "@/components/ui/undo-redo-buttons"
import { useTemplateStore } from "@/lib/template-store"
import { useUIStore } from "@/lib/stores/ui-store"
import { useChartStore } from "@/lib/chart-store"
import { useChartStyleStore } from "@/lib/stores/chart-style-store"
import { ChartBgColorPicker } from "./chart-bg-color-picker"
import { useAuth } from "@/components/auth/AuthProvider"
import { PublishStyleDialog } from "@/components/chart-style-gallery/publish-dialog"

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
    isMobile
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
}) => {
    const btnClassName = isMobile ? "px-2 py-0.5 text-[11px] min-w-[50px]" : "px-2 py-0.5 text-[10px] min-w-[50px]";
    const triggerClassName = isMobile
        ? "h-7 w-12 text-[10px] px-1.5 py-0 border-gray-200 bg-white rounded-lg flex-shrink-0"
        : "h-6 w-9 lg:w-[90px] text-[10px] px-1 lg:px-2 py-0 border-gray-200 bg-white";

    return (
        <div className="flex items-center gap-1 flex-shrink-0">
            <div className="flex items-center gap-0 bg-gray-100 rounded-full p-[2px] border border-gray-200">
                <button
                    onClick={() => setEditorMode('chart')}
                    className={`${btnClassName} font-medium rounded-full transition-all ${editorMode === 'chart' ? 'bg-blue-500 text-white shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                >Chart</button>
                <button
                    onClick={() => {
                        const templateStore = useTemplateStore.getState()
                        if (!templateStore.currentTemplate) {
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

            <DimensionDisplay
                isResponsive={isResponsive}
                chartContainerRef={chartContainerRef}
                chartWidth={chartWidth}
                chartHeight={chartHeight}
            />

            {/* Divider */}
            <div className="w-px h-4 bg-gray-200 mx-1" />

            <ChartBgColorPicker />

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
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all border ${
                            isGalleryOpen
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

    // Only render for admins who have a chart loaded
    if (!user?.is_admin || !hasJSON) return null;

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

const ControlsSection = memo(({ zoomPan, exports, handleFullscreen, onResetChart, isMobile, chartContainerRef, chartWidth, chartHeight }: {
    zoomPan: {
        zoom: number;
        panMode: boolean;
        setPanMode: (v: boolean) => void;
        handleZoomIn: () => void;
        handleZoomOut: () => void;
        handleResetZoom: () => void;
        setZoom: (z: number) => void;
    };
    exports: {
        handleExport: () => void;
        handleExportHTML: () => void;
        handleExportJPEG: () => void;
        handleExportCSV: () => void;
        handleExportSettings: () => void;
        handleRefresh: () => void;
    };
    handleFullscreen: () => void;
    onResetChart: () => void;
    isMobile: boolean;
    chartContainerRef?: React.RefObject<HTMLDivElement | null>;
    chartWidth?: number;
    chartHeight?: number;
}) => {
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

    const handleSliderChange = (value: number[]) => {
        const newZoomPct = ZOOM_VALUES[value[0]];
        zoomPan.setZoom(newZoomPct / 100);
    };



    return (
        <div className="flex items-center gap-0.5 border border-slate-200 rounded-md p-0.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className={`${isMobile ? 'text-[10px] px-1' : 'text-xs px-1.5'} h-6 text-slate-700 font-semibold select-none w-[68px] justify-start gap-2 hover:bg-slate-100 flex-shrink-0 transition-colors`}>
                            <Search className="h-3 w-3 text-slate-500 shrink-0" />
                            <span className="tabular-nums">{currentZoomPct}%</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-52 p-2">
                        <DropdownMenuItem onClick={() => { zoomPan.setZoom(1); zoomPan.setPanOffset({ x: 0, y: 0 }); }} className="text-xs py-1.5 cursor-pointer font-medium text-slate-700 focus:bg-slate-100">
                            <span className="flex-1">100% (Fit to View)</span>
                        </DropdownMenuItem>

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
            </div>

            <div className="w-[1px] h-4 bg-slate-200 mx-0.5 lg:mx-1" />

            <Button variant="ghost" size="sm" onClick={() => zoomPan.setPanMode(!zoomPan.panMode)} className={`h-7 w-7 p-0 text-slate-600 transition-colors ${zoomPan.panMode ? 'bg-slate-200 shadow-inner' : 'hover:bg-slate-100'}`} title={zoomPan.panMode ? "Disable Pan Mode" : "Enable Pan Mode"}>
                <Hand className="h-4 w-4" />
            </Button>

            <div className="w-[1px] h-4 bg-slate-200 mx-0.5 lg:mx-1" />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600" title="Actions"><Ellipsis className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exports.handleRefresh}><RefreshCw className="h-4 w-4 mr-2" /><span>Refresh Chart</span></DropdownMenuItem>
                    <DropdownMenuItem onClick={zoomPan.handleResetZoom}><RotateCcw className="h-4 w-4 mr-2" /><span>Reset Zoom</span></DropdownMenuItem>
                    <DropdownMenuItem onClick={handleFullscreen}><Maximize2 className="h-4 w-4 mr-2" /><span>Fullscreen</span></DropdownMenuItem>
                    <DropdownMenuItem onClick={onResetChart}><RotateCcw className="h-4 w-4 mr-2" /><span>Reset Chart</span></DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-[1px] h-4 bg-slate-200 mx-0.5 lg:mx-1" />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600" title="Export"><Download className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exports.handleExport}><FileImage className="h-4 w-4 mr-2" /> PNG</DropdownMenuItem>
                    <DropdownMenuItem onClick={exports.handleExportJPEG}><ImageIcon className="h-4 w-4 mr-2" /> JPEG</DropdownMenuItem>
                    <DropdownMenuItem onClick={exports.handleExportHTML}><FileCode className="h-4 w-4 mr-2" /> HTML</DropdownMenuItem>
                    <DropdownMenuItem onClick={exports.handleExportCSV}><FileText className="h-4 w-4 mr-2" /> CSV</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={exports.handleExportSettings} className="bg-blue-50 hover:bg-blue-100"><Settings className="h-4 w-4 mr-2" /> Settings</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-[1px] h-4 bg-slate-200 mx-0.5 lg:mx-1" />

            <UndoRedoButtons variant="ghost" size="sm" showLabels={false} className="gap-0.5" buttonClassName="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600 hover:scale-100" />
        </div>
    );
});
ControlsSection.displayName = "ControlsSection";

const DimensionDisplay = memo(({
    isResponsive,
    chartContainerRef,
    chartWidth,
    chartHeight
}: {
    isResponsive: boolean;
    chartContainerRef: React.RefObject<HTMLDivElement | null>;
    chartWidth?: number;
    chartHeight?: number;
}) => {
    const [hoverDimensions, setHoverDimensions] = React.useState<{ width: number, height: number } | null>(null);

    const handleMeasureDimensions = () => {
        if (!isResponsive || !chartContainerRef.current) return;
        const rect = chartContainerRef.current.getBoundingClientRect();
        setHoverDimensions({
            width: Math.round(rect.width),
            height: Math.round(rect.height)
        });
    };

    const getDimensionText = () => {
        if (!isResponsive) {
            return `${chartWidth || 0} × ${chartHeight || 0}`;
        }
        if (!hoverDimensions) return 'Responsive (hover to measure)';
        return `${hoverDimensions.width} × ${hoverDimensions.height} (responsive)`;
    };

    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className="flex items-center justify-center p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded cursor-help transition-colors relative"
                        onMouseEnter={handleMeasureDimensions}
                        onClick={handleMeasureDimensions}
                    >
                        <RulerDimensionLine className="w-4 h-4" />
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={5} className="z-[100] text-xs font-medium">
                    {getDimensionText()}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
});
DimensionDisplay.displayName = "DimensionDisplay";


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
    onResetChart: () => void;
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
    onResetChart,
}: ChartPreviewToolbarProps) => {

    return (
        <div className={`${isMobile ? '' : 'mb-1'} flex-shrink-0`}>
            <div className={`flex${isMobile ? ' mb-1 flex-col' : ' items-center justify-between flex-wrap'} gap-1 px-1`}>

                {isMobile ? (
                    <div className="min-w-0 flex flex-nowrap items-center gap-x-2 overflow-x-auto pb-1.5 scrollbar-hide select-none px-1">
                        <ModeAndTypeSection
                            editorMode={editorMode} setEditorMode={setEditorMode}
                            chartType={chartType} onChartTypeChange={onChartTypeChange}
                            isResponsive={isResponsive} chartContainerRef={chartContainerRef}
                            chartWidth={chartWidth} chartHeight={chartHeight}
                            isMobile={true}
                        />
                        <div className="h-4 w-px bg-gray-200 flex-shrink-0 mx-0.5" />
                        <ControlsSection
                            zoomPan={zoomPan} exports={exports}
                            handleFullscreen={handleFullscreen} onResetChart={onResetChart}
                            isMobile={true}
                            chartContainerRef={chartContainerRef}
                            chartWidth={chartWidth}
                            chartHeight={chartHeight}
                        />
                    </div>
                ) : (
                    <>
                        <div className="min-w-0 flex-1">
                            <TitleSection rename={rename} />
                            <div className="flex items-center gap-2 mt-0.5">
                                <ModeAndTypeSection
                                    editorMode={editorMode} setEditorMode={setEditorMode}
                                    chartType={chartType} onChartTypeChange={onChartTypeChange}
                                    isResponsive={isResponsive} chartContainerRef={chartContainerRef}
                                    chartWidth={chartWidth} chartHeight={chartHeight}
                                    isMobile={false}
                                />
                            </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0 ml-4">
                            <ControlsSection
                                zoomPan={zoomPan} exports={exports}
                                handleFullscreen={handleFullscreen} onResetChart={onResetChart}
                                isMobile={false}
                                chartContainerRef={chartContainerRef}
                                chartWidth={chartWidth}
                                chartHeight={chartHeight}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
});
ChartPreviewToolbar.displayName = "ChartPreviewToolbar";
