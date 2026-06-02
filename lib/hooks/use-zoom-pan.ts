import { useState, useEffect, useCallback, useRef, useMemo } from "react"

/**
 * Calculate the distance between two touch points.
 */
function getTouchDistance(t1: Touch, t2: Touch): number {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Manages zoom level and pan (drag) state for the chart preview canvas.
 * Supports both mouse-based and touch-based (pinch-to-zoom) interactions.
 */
export function useZoomPan() {
    const [zoom, setZoom] = useState(1);
    const [panMode, setPanMode] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

    // Refs for touch interaction tracking (avoiding stale closure issues)
    const touchStateRef = useRef({
        // The live values synced from state
        currentZoom: 1,
        currentPanOffset: { x: 0, y: 0 },

        // Captured snapshots at the moment of touchstart
        initialZoom: 1,
        initialDistance: 0,
        initialPanOffset: { x: 0, y: 0 },
        touchStartPos: { x: 0, y: 0 },

        // Active gesture flags
        isPinching: false,
        isPanning: false,
    });

    const handleZoomIn = useCallback(() => {
        setZoom(prev => Math.min(prev + 0.1, 5));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom(prev => Math.max(prev - 0.1, 0.1));
    }, []);

    const handleResetZoom = useCallback(() => {
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!panMode) return;
        setIsDragging(true);
        setDragStart({
            x: e.clientX - panOffset.x,
            y: e.clientY - panOffset.y
        });
        e.preventDefault();
        e.stopPropagation();
    }, [panMode, panOffset]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging) {
            setPanOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
            e.preventDefault();
        }
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Handle mouse move globally while dragging
    useEffect(() => {
        if (!isDragging) return;

        const handleGlobalMouseMove = (e: MouseEvent) => {
            setPanOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        };

        const handleGlobalMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging, dragStart]);

    /**
     * Attach pinch-to-zoom and single-finger pan touch handlers to a container element.
     * Call this inside a useEffect with the container ref.
     *
     * - Two-finger pinch: zooms in/out
     * - Two-finger drag: pans the canvas
     * - Prevents the browser from zooming the entire page
     */
    const attachTouchHandlers = useCallback((container: HTMLElement | null) => {
        if (!container) return () => {};

        const state = touchStateRef.current;

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                // Two-finger pinch-to-zoom
                e.preventDefault();
                state.isPinching = true;
                state.isPanning = false;
                state.initialDistance = getTouchDistance(e.touches[0], e.touches[1]);
                state.initialZoom = state.currentZoom;
            } else if (e.touches.length === 1) {
                // Single-finger panning
                e.preventDefault();
                state.isPanning = true;
                state.isPinching = false;
                state.touchStartPos = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                };
                state.initialPanOffset = { ...state.currentPanOffset };
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (state.isPinching && e.touches.length === 2) {
                e.preventDefault();
                const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
                if (state.initialDistance > 0) {
                    const scale = currentDistance / state.initialDistance;
                    const newZoom = Math.min(Math.max(state.initialZoom * scale, 0.1), 5);
                    setZoom(newZoom);
                }
            } else if (state.isPanning && e.touches.length === 1) {
                e.preventDefault();
                const dx = e.touches[0].clientX - state.touchStartPos.x;
                const dy = e.touches[0].clientY - state.touchStartPos.y;
                setPanOffset({
                    x: state.initialPanOffset.x + dx,
                    y: state.initialPanOffset.y + dy,
                });
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (state.isPinching && e.touches.length < 2) {
                state.isPinching = false;
            }
            if (state.isPanning && e.touches.length === 0) {
                state.isPanning = false;
            }
        };

        // Use { passive: false } so we can call preventDefault() to block browser zoom
        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: false });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [setZoom, setPanOffset]);

    // Keep touchStateRef in sync with current zoom and panOffset values
    useEffect(() => {
        touchStateRef.current.currentZoom = zoom;
    }, [zoom]);

    useEffect(() => {
        touchStateRef.current.currentPanOffset = panOffset;
    }, [panOffset]);

    return useMemo(() => ({
        zoom,
        panMode,
        isDragging,
        panOffset,
        dragStart,
        setZoom,
        setPanMode,
        setPanOffset,
        handleZoomIn,
        handleZoomOut,
        handleResetZoom,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        attachTouchHandlers,
    }), [
        zoom,
        panMode,
        isDragging,
        panOffset,
        dragStart,
        handleZoomIn,
        handleZoomOut,
        handleResetZoom,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        attachTouchHandlers,
    ]);
}
