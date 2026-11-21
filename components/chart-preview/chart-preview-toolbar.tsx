"use client"

import React, { memo, useState, useEffect } from "react"
import { useStore } from "zustand"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChartTypeSelector } from "./chart-type-selector"
import {
    Download, Hand, Pencil, Check, Loader2,
    Search, Palette, Upload, Sparkles, Ellipsis,
    FileCode, FileImage, FileText, ImageIcon
} from "lucide-react"
import { useLoupeStore } from "@/lib/stores/loupe-store"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
    DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import { useTemplateStore } from "@/lib/template-store"
import { useFormatGalleryStore, ensureDefaultFormatSelected } from "@/lib/stores/format-gallery-store"
import { useUIStore } from "@/lib/stores/ui-store"
import { useChartStore } from "@/lib/chart-store"
import { useChartStyleStore } from "@/lib/stores/chart-style-store"
import { useAuth } from "@/components/auth/AuthProvider"
import { PublishStyleDialog } from "@/components/chart-style-gallery/publish-dialog"
import { UpdatePresetDialog } from "@/components/chart-style-gallery/update-preset-dialog"
import { dataService } from "@/lib/data-service"
import { useEditorSidebarContext } from "@/components/editor/editor-sidebar-context"
import { useIsCompactDesktop } from "@/lib/hooks/use-screen-dimensions"
import { ZoomMenuContent, ZOOM_VALUES, getClosestZoomIndex } from "./zoom-menu-content"
import { MoreOptionsMenuContent } from "./more-options-menu-content"

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
                        if (!formatStore.selectedFormatId) {
                            ensureDefaultFormatSelected(chartType || 'bar')
                            useUIStore.getState().setActiveSidebarTab('templates')
                        }
                        templateStore.setGenerateMode('format')
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

const ControlsSection = memo(({ zoomPan, exports, isMobile, chartContainerRef, chartWidth, chartHeight, disabled, isLeftSidebarCollapsed }: {
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
                <MoreOptionsMenuContent
                    canUndo={canUndo}
                    canRedo={canRedo}
                    onUndo={temporalUndo}
                    onRedo={temporalRedo}
                    isLoupeActive={isLoupeActive}
                    onToggleLoupe={toggleLoupe}
                    showZoomPanOutside={showZoomPanOutside}
                    currentZoomPct={currentZoomPct}
                    closestIndex={closestIndex}
                    onSliderChange={handleSliderChange}
                    onResetZoom={handleResetZoom}
                    onFullDimension={applyFullDimension}
                    hasFullDimension={!!(chartWidth && chartHeight)}
                    onZoomIn={zoomPan.handleZoomIn}
                    onZoomOut={zoomPan.handleZoomOut}
                    panMode={zoomPan.panMode}
                    onTogglePanMode={() => zoomPan.setPanMode(!zoomPan.panMode)}
                    dimensionText={dimensionText}
                >
                    <DropdownMenuSeparator className="my-1" />

                    {/* Chart Styles */}
                    <DropdownMenuItem
                        onClick={() => {
                            toggleGallery();
                        }}
                        data-styles-toggle
                        className={cn(
                            "flex items-center justify-between px-2 py-1.5 text-xs font-medium cursor-pointer rounded-md transition-colors",
                            isGalleryOpen
                                ? "bg-violet-50 text-violet-700 focus:bg-violet-100"
                                : "hover:bg-violet-50 text-slate-700 hover:text-violet-700 focus:bg-violet-50 focus:text-violet-700"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Palette className={cn("h-3.5 w-3.5", isGalleryOpen ? "text-violet-600" : "text-violet-500")} />
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
                            className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium cursor-pointer rounded-md hover:bg-emerald-50 text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700"
                        >
                            <Upload className="h-3.5 w-3.5 text-emerald-600" />
                            <span>{editPresetId ? "Update Style Preset" : "Publish Style Preset"}</span>
                        </DropdownMenuItem>
                    )}
                </MoreOptionsMenuContent>
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
    isLeftSidebarCollapsed?: boolean;
    className?: string;
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
    isLeftSidebarCollapsed,
    className,
}: ChartPreviewToolbarProps) => {
    const hasData = useChartStore(s => s.chartData.datasets.length > 0);
    const disabled = !hasData;

    return (
        <div className={cn(
            isMobile ? 'py-0.5 px-1' : 'px-3 h-[45px] min-h-[45px] border-b border-gray-200 bg-white',
            'flex items-center justify-between gap-2.5 flex-shrink-0 w-full min-w-0',
            className
        )}>
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
