"use client"

import React, { RefObject, useState, useEffect } from "react"
import ChartGenerator from "@/lib/chart_generator"
import { parseDimension } from "@/lib/utils/dimension-utils"
import { DecorationShapeRenderer } from "@/components/decorations/DecorationShapeRenderer"
import { useDecorationStore } from "@/lib/stores/decoration-store"

interface ChartPreviewCanvasProps {
    chartContainerRef: RefObject<HTMLDivElement>;
    chartConfig: any;
    zoomPan: {
        zoom: number;
        panMode: boolean;
        isDragging: boolean;
        panOffset: { x: number; y: number };
        handleMouseDown: (e: React.MouseEvent) => void;
        handleMouseMove: (e: React.MouseEvent) => void;
        handleMouseUp: () => void;
    };
}

/**
 * The chart canvas area — handles both responsive (fills container) and
 * fixed-dimension modes, wraps <ChartGenerator/> with zoom/pan support.
 */
export const ChartPreviewCanvas = React.memo(({
    chartContainerRef,
    chartConfig,
    zoomPan,
}: ChartPreviewCanvasProps) => {
    const { zoom, panMode, isDragging, panOffset, handleMouseDown } = zoomPan;
    const decorationShapes = useDecorationStore(s => s.shapes);
    const hasDecorations = decorationShapes.length > 0;
    const drawingMode = useDecorationStore(s => s.drawingMode);

    // Track container dimensions for DecorationShapeRenderer
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = containerRef.current || chartContainerRef.current;
        if (!el) return;
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
            }
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [chartContainerRef]);

    const isResponsive = chartConfig?.responsive !== false;
    const chartWidth = !isResponsive ? parseDimension(chartConfig?.width, 800) : 800;
    const chartHeight = !isResponsive ? parseDimension(chartConfig?.height, 800) : 600;

    if (isResponsive) {
        return (
            <div
                className="absolute inset-0"
                style={{
                    backgroundColor: 'transparent',
                    width: '100%',
                    height: '100%',
                    top: 0, left: 0, right: 0, bottom: 0
                }}
            >
                {/* Background layer for dragging (only in pan mode) */}
                {panMode && (
                    <div
                        className="absolute inset-0"
                        style={{ cursor: isDragging ? 'grabbing' : 'grab', zIndex: 1 }}
                        onMouseDown={handleMouseDown}
                    />
                )}

                {/* Chart Area */}
                <div
                    className="absolute inset-0"
                    style={{
                        width: '100%', height: '100%',
                        top: 0, left: 0, right: 0, bottom: 0,
                        transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                        transformOrigin: 'center center',
                        transition: isDragging ? 'none' : 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        zIndex: 10,
                        cursor: panMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
                        pointerEvents: 'auto'
                    }}
                    onMouseDown={panMode ? handleMouseDown : undefined}
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            width: '100%', height: '100%',
                            top: 0, left: 0, right: 0, bottom: 0,
                            pointerEvents: panMode ? 'none' : 'auto',
                            userSelect: panMode ? 'none' : 'auto',
                            WebkitUserSelect: panMode ? 'none' : 'auto'
                        }}
                        onMouseDown={(e) => {
                            if (panMode) { handleMouseDown(e as any); e.preventDefault(); e.stopPropagation(); }
                            else { e.stopPropagation(); }
                        }}
                        onDragStart={(e) => { if (panMode) e.preventDefault(); }}
                    >
                        <div
                            ref={containerRef}
                            className="absolute inset-0"
                            style={{ width: '100%', height: '100%', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: panMode ? 'none' : 'auto' }}
                        >
                            <ChartGenerator />
                        </div>
                        {/* Decoration Shapes Layer (chart mode) */}
                        {(hasDecorations || drawingMode) && containerSize.width > 0 && (
                            <div className="absolute inset-0" style={{ width: '100%', height: '100%', top: 0, left: 0, zIndex: 20, pointerEvents: drawingMode ? 'auto' : 'none' }}>
                                <DecorationShapeRenderer
                                    containerWidth={containerSize.width}
                                    containerHeight={containerSize.height}
                                    panMode={panMode}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Non-responsive mode: fixed dimensions with canvas padding
    const canvasPadding = 80;
    const scaledChartWidth = chartWidth * zoom;
    const scaledChartHeight = chartHeight * zoom;
    const effectiveCanvasWidth = scaledChartWidth + canvasPadding;
    const effectiveCanvasHeight = scaledChartHeight + canvasPadding;
    const initialLeft = effectiveCanvasWidth / 2 - scaledChartWidth / 2;
    const initialTop = effectiveCanvasHeight / 2 - scaledChartHeight / 2;

    return (
        <div
            className="relative"
            style={{
                width: `${effectiveCanvasWidth}px`,
                height: `${effectiveCanvasHeight}px`,
                margin: '0 auto',
                backgroundColor: 'transparent'
            }}
        >
            {/* Background layer for dragging (only in pan mode) */}
            {panMode && (
                <div
                    className="absolute inset-0"
                    style={{ cursor: isDragging ? 'grabbing' : 'grab', zIndex: 1 }}
                    onMouseDown={handleMouseDown}
                />
            )}

            {/* Chart Area */}
            <div
                className="absolute"
                style={{
                    left: `${initialLeft}px`,
                    top: `${initialTop}px`,
                    width: `${chartWidth}px`,
                    height: `${chartHeight}px`,
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                    transformOrigin: 'top left',
                    transition: isDragging ? 'none' : 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    zIndex: 10,
                    cursor: panMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    pointerEvents: 'auto'
                }}
                onMouseDown={panMode ? handleMouseDown : undefined}
            >
                <div
                    className="w-full h-full"
                    style={{
                        pointerEvents: panMode ? 'none' : 'auto',
                        userSelect: panMode ? 'none' : 'auto',
                        WebkitUserSelect: panMode ? 'none' : 'auto'
                    }}
                    onMouseDown={(e) => {
                        if (panMode) { handleMouseDown(e as any); e.preventDefault(); e.stopPropagation(); }
                        else { e.stopPropagation(); }
                    }}
                    onDragStart={(e) => { if (panMode) e.preventDefault(); }}
                >
                    <div ref={containerRef} style={{ pointerEvents: panMode ? 'none' : 'auto', position: 'relative' }}>
                        <ChartGenerator />
                        {/* Decoration Shapes Layer (chart mode, fixed dimensions) */}
                        {(hasDecorations || drawingMode) && (
                            <div className="absolute inset-0" style={{ zIndex: 20, pointerEvents: drawingMode ? 'auto' : 'none' }}>
                                <DecorationShapeRenderer
                                    containerWidth={chartWidth}
                                    containerHeight={chartHeight}
                                    panMode={panMode}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});
