"use client"

import React, { RefObject, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Download, Minimize2, X, ZoomIn, ZoomOut, Hand, Menu, ChevronLeft,
    Sparkles, FileImage, ImageIcon, FileCode, FileText, ScanSearch
} from "lucide-react"
import { useLoupeStore } from "@/lib/stores/loupe-store"
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
    DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import { Sidebar } from "@/components/sidebar"
import { ConfigPanel } from "@/components/config-panel"
import { SidebarPortalProvider } from "@/components/sidebar-portal-context"
import { SidebarContainer } from "@/components/sidebar-container"

interface FullscreenOverlayProps {
    // Zoom/pan
    zoomPan: {
        zoom: number;
        panMode: boolean;
        setPanMode: (v: boolean) => void;
        handleZoomIn: () => void;
        handleZoomOut: () => void;
    };
    // Fullscreen
    handleFullscreen: () => void;
    handleExport: () => void;
    exports?: {
        handleExport: (exportScale?: number) => void;
        handleExportHTML: () => void;
        handleExportJPEG: (exportScale?: number) => void;
        handleExportCSV: () => void;
        handleExportSettings: () => void;
    };
    // Overlays
    showLeftOverlay: boolean;
    showRightOverlay: boolean;
    setShowLeftOverlay: (v: boolean) => void;
    setShowRightOverlay: (v: boolean) => void;
    // Sidebar props
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    onNewChart?: () => void;
    // Refs
    leftSidebarPanelRef: RefObject<HTMLDivElement>;
    rightSidebarPanelRef: RefObject<HTMLDivElement>;
}

/**
 * Fullscreen toolbar (zoom, pan, download, minimize, close) + sidebar overlays.
 * Rendered only when isFullscreen is true.
 */
export function FullscreenOverlay({
    zoomPan,
    handleFullscreen,
    handleExport,
    exports,
    showLeftOverlay,
    showRightOverlay,
    setShowLeftOverlay,
    setShowRightOverlay,
    activeTab,
    onTabChange,
    onNewChart,
    leftSidebarPanelRef,
    rightSidebarPanelRef,
}: FullscreenOverlayProps) {
    const [fullscreenActiveTab, setFullscreenActiveTab] = useState(activeTab || "types_toggles");
    const { isLoupeActive, toggleLoupe } = useLoupeStore();

    return (
        <>
            {/* Top Left Button - Open Left Sidebar */}
            {activeTab && onTabChange && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowLeftOverlay(true)}
                    className="fixed top-4 left-4 z-50 bg-white rounded-xl shadow-xl border border-gray-300 hover:bg-gray-50 hover:shadow-2xl hover:border-gray-400 transition-all duration-200 h-11 w-11"
                    title="Open Options"
                >
                    <Menu className="h-5 w-5 text-gray-700" />
                </Button>
            )}

            {/* Top Right Toolbar */}
            <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-2 flex gap-2 border border-gray-200 animate-in fade-in duration-200">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 border rounded-md p-0.5 bg-white mr-1">
                    <Button variant="ghost" size="icon" onClick={zoomPan.handleZoomOut} disabled={zoomPan.zoom <= 0.1} className="h-7 w-7 p-0" title="Zoom Out">
                        <ZoomOut className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-xs text-gray-600 min-w-[45px] text-center px-1">{Math.round(zoomPan.zoom * 100)}%</span>
                    <Button variant="ghost" size="icon" onClick={zoomPan.handleZoomIn} disabled={zoomPan.zoom >= 3} className="h-7 w-7 p-0" title="Zoom In">
                        <ZoomIn className="h-3.5 w-3.5" />
                    </Button>
                </div>
                {/* Pan Mode Toggle */}
                <Button variant={zoomPan.panMode ? "default" : "ghost"} size="icon" onClick={() => zoomPan.setPanMode(!zoomPan.panMode)} title={zoomPan.panMode ? "Disable Pan Mode" : "Enable Pan Mode"} className="h-8 w-8">
                    <Hand className="h-4 w-4" />
                </Button>
                {/* Amazon Loupe Magnifier Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleLoupe}
                    className={`h-8 w-8 transition-all ${
                        isLoupeActive
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 ring-1 ring-blue-400 shadow-inner'
                            : 'hover:bg-slate-100 text-slate-600'
                    }`}
                    title={isLoupeActive ? "Disable Loupe View (Esc)" : "Amazon Loupe View (Inspect Details)"}
                >
                    <ScanSearch className="h-4 w-4" />
                </Button>
                {exports ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" title="Export Image / Data" className="hover:bg-gray-100 h-8 w-8">
                                <Download className="h-4 w-4" />
                            </Button>
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
                ) : (
                    <Button variant="ghost" size="icon" onClick={handleExport} title="Download" className="hover:bg-gray-100 h-8 w-8">
                        <Download className="h-4 w-4" />
                    </Button>
                )}
                <Button variant="ghost" size="icon" onClick={handleFullscreen} title="Exit fullscreen" className="hover:bg-gray-100 h-8 w-8">
                    <Minimize2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => document.exitFullscreen()} title="Close" className="hover:bg-gray-100 text-red-500 hover:bg-red-50 h-8 w-8">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Left Sidebar Overlay */}
            {showLeftOverlay && activeTab && onTabChange && (
                <SidebarPortalProvider>
                    <SidebarContainer containerRef={leftSidebarPanelRef}>
                        <div className="fixed inset-0 z-[60] flex">
                            <div ref={leftSidebarPanelRef as any} className="w-80 bg-white shadow-2xl border-r border-gray-200 flex flex-col h-full">
                                <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                                    <h2 className="text-lg font-semibold text-gray-900">Options</h2>
                                    <Button variant="ghost" size="icon" onClick={() => setShowLeftOverlay(false)} className="h-8 w-8">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <Sidebar
                                        activeTab={fullscreenActiveTab}
                                        onTabChange={(tab) => {
                                            setFullscreenActiveTab(tab);
                                            if (onTabChange) onTabChange(tab);
                                            setShowRightOverlay(true);
                                        }}
                                        onToggleLeftSidebar={() => setShowLeftOverlay(false)}
                                        isLeftSidebarCollapsed={false}
                                    />
                                </div>
                            </div>
                            {/* Backdrop */}
                            <div className="flex-1 bg-black/50" onClick={() => setShowLeftOverlay(false)} />
                        </div>
                    </SidebarContainer>
                </SidebarPortalProvider>
            )}

            {/* Right Tools Panel Overlay */}
            {showRightOverlay && activeTab && onTabChange && (
                <SidebarPortalProvider>
                    <SidebarContainer containerRef={rightSidebarPanelRef}>
                        <div className="fixed inset-0 z-[70] flex">
                            <div ref={rightSidebarPanelRef as any} className="w-80 bg-white shadow-2xl border-r border-gray-200 flex flex-col h-full">
                                <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                                    <h2 className="text-lg font-semibold text-gray-900">Tools</h2>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => setShowRightOverlay(false)} className="h-8 w-8" title="Close Tools">
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => { setShowRightOverlay(false); setShowLeftOverlay(false); }} className="h-8 w-8" title="Close All">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <ConfigPanel
                                        activeTab={fullscreenActiveTab}
                                        onTabChange={(tab) => {
                                            setFullscreenActiveTab(tab);
                                            if (onTabChange) onTabChange(tab);
                                        }}
                                        onNewChart={onNewChart}
                                    />
                                </div>
                            </div>
                            {/* Backdrop */}
                            <div className="flex-1 bg-black/50" onClick={() => setShowRightOverlay(false)} />
                        </div>
                    </SidebarContainer>
                </SidebarPortalProvider>
            )}
        </>
    );
}
