"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Download, RefreshCw, Maximize2, RotateCcw,
    Ellipsis, ZoomIn, ZoomOut, Hand, Pencil, Check, Loader2
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { FileCode, FileImage, FileText, ImageIcon, Settings } from "lucide-react"
import { UndoRedoButtons } from "@/components/ui/undo-redo-buttons"
import { useTemplateStore } from "@/lib/template-store"
import { useUIStore } from "@/lib/stores/ui-store"

interface ChartPreviewToolbarProps {
    // Layout
    isMobile: boolean;
    // Editor mode
    editorMode: string;
    setEditorMode: (mode: string) => void;
    // Chart type
    chartType: string;
    onChartTypeChange: (type: string) => void;
    // Dimensions
    isResponsive: boolean;
    containerDimensions: { width: number; height: number };
    chartWidth?: number;
    chartHeight?: number;
    // Rename hook
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
    };
    // Zoom/pan
    zoomPan: {
        zoom: number;
        panMode: boolean;
        setPanMode: (v: boolean) => void;
        handleZoomIn: () => void;
        handleZoomOut: () => void;
        handleResetZoom: () => void;
    };
    // Export
    exports: {
        handleExport: () => void;
        handleExportHTML: () => void;
        handleExportJPEG: () => void;
        handleExportCSV: () => void;
        handleExportSettings: () => void;
        handleRefresh: () => void;
    };
    // Fullscreen
    handleFullscreen: () => void;
    // Chart reset
    onResetChart: () => void;
}

/**
 * The top toolbar of ChartPreview: title, mode toggle, type selector, zoom controls, export/actions dropdown.
 */
export function ChartPreviewToolbar({
    isMobile,
    editorMode,
    setEditorMode,
    chartType,
    onChartTypeChange,
    isResponsive,
    containerDimensions,
    chartWidth,
    chartHeight,
    rename,
    zoomPan,
    exports,
    handleFullscreen,
    onResetChart,
}: ChartPreviewToolbarProps) {

    const ChartTypeSelector = ({ triggerClassName }: { triggerClassName: string }) => (
        <Select value={chartType} onValueChange={onChartTypeChange}>
            <SelectTrigger className={triggerClassName}>
                <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="bar" className="text-xs">Bar</SelectItem>
                <SelectItem value="horizontalBar" className="text-xs">H. Bar</SelectItem>
                <SelectItem value="stackedBar" className="text-xs">Stacked</SelectItem>
                <SelectItem value="line" className="text-xs">Line</SelectItem>
                <SelectItem value="area" className="text-xs">Area</SelectItem>
                <SelectItem value="pie" className="text-xs">Pie</SelectItem>
                <SelectItem value="doughnut" className="text-xs">Doughnut</SelectItem>
                <SelectItem value="radar" className="text-xs">Radar</SelectItem>
                <SelectItem value="polarArea" className="text-xs">Polar</SelectItem>
                <SelectItem value="scatter" className="text-xs">Scatter</SelectItem>
                <SelectItem value="bubble" className="text-xs">Bubble</SelectItem>
                <SelectItem value="pie3d" className="text-xs">3D Pie</SelectItem>
                <SelectItem value="doughnut3d" className="text-xs">3D Doughnut</SelectItem>
                <SelectItem value="bar3d" className="text-xs">3D Bar</SelectItem>
                <SelectItem value="horizontalBar3d" className="text-xs">3D Horizontal Bar</SelectItem>
            </SelectContent>
        </Select>
    );

    const ModeToggle = ({ btnClassName }: { btnClassName: string }) => (
        <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5 border border-gray-200"
            style={{ display: 'flex', visibility: 'visible', opacity: 1 }}>
            <button
                onClick={() => setEditorMode('chart')}
                className={`${btnClassName} font-medium rounded-full transition-all ${editorMode === 'chart' ? 'bg-blue-500 text-white shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                style={{ display: 'inline-block', visibility: 'visible', opacity: 1 }}
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
                style={{ display: 'inline-block', visibility: 'visible', opacity: 1 }}
            >Template</button>
        </div>
    );

    const DimensionDisplay = () => (
        <div className="flex items-center gap-1 text-xs text-gray-400">
            {isResponsive ? (
                <span>{Math.round(containerDimensions.width)}px × {Math.round(containerDimensions.height)}px</span>
            ) : (
                <span>{chartWidth}px × {chartHeight}px</span>
            )}
        </div>
    );

    return (
        <div className={`${isMobile ? '' : 'mb-4'} flex-shrink-0`}>
            <div className={`flex${isMobile ? ' mb-2 flex-col' : ' items-center justify-between flex-wrap'} gap-2 px-2`}>
                {/* Left: title + chart info */}
                {isMobile ? (
                    <div className="min-w-0 flex-1 flex flex-row items-center xs576:justify-between gap-x-2">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-gray-900 truncate xs400:text-base"><span className="xs400:hidden">Chart</span> Preview</h1>
                            <ModeToggle btnClassName="px-2 py-1 text-xs" />
                            <ChartTypeSelector triggerClassName="h-6 w-[85px] text-[10px] px-2 py-0 border-gray-200 bg-white" />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 min-w-0 flex-nowrap overflow-x-auto">
                            <DimensionDisplay />
                        </div>
                    </div>
                ) : (
                    <div className="min-w-0 flex-1 max-w-[500px]">
                        {/* Chart Title with edit icon */}
                        {rename.chartTitle && (
                            <div className="flex items-center gap-1.5 mb-0.5">
                                {rename.canEditTitle && (
                                    <button onClick={rename.handleStartRename} className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0" title="Rename">
                                        <Pencil className="h-3 w-3" />
                                    </button>
                                )}
                                <div className="flex items-center gap-1 flex-1">
                                    {rename.isRenaming && rename.canEditTitle ? (
                                        <>
                                            <input
                                                ref={rename.renameInputRef as any}
                                                type="text"
                                                value={rename.renameValue}
                                                onChange={(e) => rename.setRenameValue(e.target.value)}
                                                onKeyDown={rename.handleRenameKeyDown}
                                                onBlur={() => rename.setIsRenaming(false)}
                                                className="flex-1 font-semibold text-gray-900 text-base bg-transparent border-b-2 border-blue-400 outline-none w-full"
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
                                        <h4 className="font-semibold text-gray-900 text-base truncate border-b-2 border-transparent" title={rename.chartTitle}>{rename.chartTitle}</h4>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Toggle and Chart info row */}
                        <div className="flex items-center gap-2">
                            <ModeToggle btnClassName="px-2 py-0.5 text-[10px]" />
                            <ChartTypeSelector triggerClassName="h-6 w-[90px] text-[10px] px-2 py-0 border-gray-200 bg-white" />
                            <DimensionDisplay />
                        </div>
                    </div>
                )}
                {/* Right: action buttons */}
                <div className={`flex gap-1 flex-shrink-0 ml-4${isMobile ? ' justify-evenly ml-0 overflow-x-auto max-w-full pb-1' : ''}`} style={isMobile ? { WebkitOverflowScrolling: 'touch' } : {}}>
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-0.5 border rounded-md p-0.5 bg-white">
                        <Button variant="ghost" size="sm" onClick={zoomPan.handleZoomOut} disabled={zoomPan.zoom <= 0.1} className="h-7 w-7 p-0" title="Zoom Out">
                            <ZoomOut className="h-3.5 w-3.5" />
                        </Button>
                        <span className="text-xs text-gray-600 min-w-[45px] text-center px-1">{Math.round(zoomPan.zoom * 100)}%</span>
                        <Button variant="ghost" size="sm" onClick={zoomPan.handleZoomIn} disabled={zoomPan.zoom >= 3} className="h-7 w-7 p-0" title="Zoom In">
                            <ZoomIn className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    {/* Pan Mode Toggle */}
                    <Button variant={zoomPan.panMode ? "default" : "outline"} size="sm" onClick={() => zoomPan.setPanMode(!zoomPan.panMode)} title={zoomPan.panMode ? "Disable Pan Mode" : "Enable Pan Mode"}>
                        <Hand className="h-4 w-4" />
                    </Button>
                    {/* Actions Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" title="Actions"><Ellipsis className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={exports.handleRefresh}><RefreshCw className="h-4 w-4 mr-2" /><span>Refresh Chart</span></DropdownMenuItem>
                            <DropdownMenuItem onClick={zoomPan.handleResetZoom}><RotateCcw className="h-4 w-4 mr-2" /><span>Reset Zoom</span></DropdownMenuItem>
                            <DropdownMenuItem onClick={handleFullscreen}><Maximize2 className="h-4 w-4 mr-2" /><span>Fullscreen</span></DropdownMenuItem>
                            <DropdownMenuItem onClick={onResetChart}><RotateCcw className="h-4 w-4 mr-2" /><span>Reset Chart</span></DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {/* Export Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="default" title="Export"><Download className="h-4 w-4" /></Button>
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
                    {/* Undo/Redo Buttons */}
                    <UndoRedoButtons variant="default" size="sm" showLabels={false} />
                </div>
            </div>
        </div>
    );
}
