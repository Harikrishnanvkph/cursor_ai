"use client"

import React, { RefObject, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Download, Minimize2, X, ZoomIn, ZoomOut, Hand, Menu, ChevronLeft
} from "lucide-react"
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
                <Button variant="ghost" size="icon" onClick={handleExport} title="Download" className="hover:bg-gray-100 h-8 w-8">
                    <Download className="h-4 w-4" />
                </Button>
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
