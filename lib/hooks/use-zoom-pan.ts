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

    // Refs for pinch-to-zoom tracking (avoid stale closure issues)
    const pinchRef = useRef<{
        initialDistance: number;
        initialZoom: number;
        isPinching: boolean;
        // Single-finger pan tracking for touch
        isTouchPanning: boolean;
        touchPanStart: { x: number; y: number };
        panOffsetAtStart: { x: number; y: number };
    }>({
        initialDistance: 0,
        initialZoom: 1,
        isPinching: false,
        isTouchPanning: false,
        touchPanStart: { x: 0, y: 0 },
        panOffsetAtStart: { x: 0, y: 0 },
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

        const ref = pinchRef.current;

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                // Start pinch-to-zoom
                e.preventDefault();
                ref.isPinching = true;
                ref.isTouchPanning = false;
                ref.initialDistance = getTouchDistance(e.touches[0], e.touches[1]);
                // Read current zoom from the state ref (we'll sync below)
                ref.initialZoom = ref.initialZoom; // Will be set via setZoom wrapper
            } else if (e.touches.length === 1) {
                // Single finger: always allow panning on mobile preview
                e.preventDefault();
                ref.isTouchPanning = true;
                ref.isPinching = false;
                ref.touchPanStart = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                };
                // panOffsetAtStart will be set from current state via the sync effect
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (ref.isPinching && e.touches.length === 2) {
                e.preventDefault();
                const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
                const scale = currentDistance / ref.initialDistance;
                const newZoom = Math.min(Math.max(ref.initialZoom * scale, 0.1), 5);
                setZoom(newZoom);
            } else if (ref.isTouchPanning && e.touches.length === 1) {
                e.preventDefault();
                const dx = e.touches[0].clientX - ref.touchPanStart.x;
                const dy = e.touches[0].clientY - ref.touchPanStart.y;
                setPanOffset({
                    x: ref.panOffsetAtStart.x + dx,
                    y: ref.panOffsetAtStart.y + dy,
                });
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (ref.isPinching) {
                // If still 2 fingers remain, don't stop
                if (e.touches.length < 2) {
                    ref.isPinching = false;
                }
            }
            if (ref.isTouchPanning && e.touches.length === 0) {
                ref.isTouchPanning = false;
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

    // Keep pinchRef in sync with current zoom and panOffset values
    // so the touch handlers always read fresh state
    useEffect(() => {
        pinchRef.current.initialZoom = zoom;
    }, [zoom]);

    useEffect(() => {
        pinchRef.current.panOffsetAtStart = panOffset;
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
