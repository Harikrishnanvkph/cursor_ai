import { useState, useEffect, useCallback, useRef, useMemo } from "react"

/**
 * Manages zoom level and pan (drag) state for the chart preview canvas.
 */
export function useZoomPan() {
    const [zoom, setZoom] = useState(1);
    const [panMode, setPanMode] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

    const handleZoomIn = useCallback(() => {
        setZoom(prev => Math.min(prev + 0.1, 3));
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
    ]);
}
