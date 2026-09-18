"use client"

import { useState, useEffect } from "react"

// Custom hook to detect < 768px (Mobile Range, below Tailwind 'md')
export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== "undefined") {
            return window.innerWidth < 768;
        }
        return false;
    });
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);
    return isMobile;
}

// Backward compatibility alias for existing imports
export const useIsMobile576 = useIsMobile;

// Custom hook to get screen dimensions
export function useScreenDimensions() {
    const [dimensions, setDimensions] = useState(() => {
        if (typeof window !== "undefined") {
            return { width: window.innerWidth, height: window.innerHeight };
        }
        return { width: 0, height: 0 };
    });

    useEffect(() => {
        function updateDimensions() {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        }

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    return dimensions;
}

// Custom hook to detect 768px - 1023px (Tablet Range, Tailwind 'md' to 'lg')
export function useIsTablet() {
    const [isTablet, setIsTablet] = useState(() => {
        if (typeof window !== "undefined") {
            return window.innerWidth >= 768 && window.innerWidth < 1024;
        }
        return false;
    });
    useEffect(() => {
        const check = () => setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);
    return isTablet;
}
