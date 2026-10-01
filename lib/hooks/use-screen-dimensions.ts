"use client"

import { useState, useEffect } from "react"

// Custom hook to detect < 768px (Mobile Range, below Tailwind 'md')
export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== "undefined") {
            return window.matchMedia("(max-width: 767px)").matches;
        }
        return false;
    });
    
    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 767px)");
        const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        
        setIsMobile(mediaQuery.matches);
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);
    
    return isMobile;
}

// Backward compatibility alias for existing imports
export const useIsMobile576 = useIsMobile;

// Custom hook to get screen dimensions (Debounced)
export function useScreenDimensions() {
    const [dimensions, setDimensions] = useState(() => {
        if (typeof window !== "undefined") {
            return { width: window.innerWidth, height: window.innerHeight };
        }
        return { width: 0, height: 0 };
    });

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        function updateDimensions() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setDimensions({
                    width: window.innerWidth,
                    height: window.innerHeight
                });
            }, 100);
        }

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => {
            window.removeEventListener("resize", updateDimensions);
            clearTimeout(timeoutId);
        };
    }, []);

    return dimensions;
}

// Custom hook to detect 768px - 1023px (Tablet Range, Tailwind 'md' to 'lg')
export function useIsTablet() {
    const [isTablet, setIsTablet] = useState(() => {
        if (typeof window !== "undefined") {
            return window.matchMedia("(min-width: 768px) and (max-width: 1023px)").matches;
        }
        return false;
    });
    
    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
        const handleChange = (e: MediaQueryListEvent) => setIsTablet(e.matches);
        
        setIsTablet(mediaQuery.matches);
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);
    
    return isTablet;
}
