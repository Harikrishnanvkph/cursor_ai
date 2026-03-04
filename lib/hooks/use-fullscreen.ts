import { useState, useEffect, useCallback, RefObject } from "react"
import { useChartStore } from "@/lib/chart-store"

/**
 * Manages fullscreen state, toggle, and sidebar overlay visibility for chart preview.
 */
export function useFullscreen(containerRef: RefObject<HTMLDivElement | null>) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showLeftOverlay, setShowLeftOverlay] = useState(false);
    const [showRightOverlay, setShowRightOverlay] = useState(false);

    const handleFullscreen = useCallback(async () => {
        const getGlobalChartRef = () => useChartStore.getState().globalChartRef;
        if (!getGlobalChartRef()?.current || !containerRef.current) return;

        const container = containerRef.current;
        const canvas = getGlobalChartRef()?.current?.canvas;

        try {
            if (!document.fullscreenElement) {
                await container.requestFullscreen();
                setIsFullscreen(true);

                const dpr = window.devicePixelRatio || 1;
                const rect = container.getBoundingClientRect();

                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.objectFit = 'contain';

                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;

                getGlobalChartRef()?.current?.resize();
                getGlobalChartRef()?.current?.render();
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);

                canvas.style.width = '';
                canvas.style.height = '';
                canvas.style.objectFit = '';

                getGlobalChartRef()?.current?.resize();
                getGlobalChartRef()?.current?.render();
            }
        } catch (err) {
            console.error('Error toggling fullscreen:', err);
        }
    }, [containerRef]);

    // Listen for fullscreen change events (e.g. Esc key)
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isNowFullscreen = !!document.fullscreenElement;
            setIsFullscreen(isNowFullscreen);
            if (!isNowFullscreen) {
                setShowLeftOverlay(false);
                setShowRightOverlay(false);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return {
        isFullscreen,
        showLeftOverlay,
        showRightOverlay,
        setShowLeftOverlay,
        setShowRightOverlay,
        handleFullscreen,
    };
}
