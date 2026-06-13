"use client"

import { useState, useEffect } from "react"

// Custom hook to detect <=768px (Mobile Range including Large)
export function useIsMobile576() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        setIsMobile(window.innerWidth <= 768);
        function handleResize() {
            setIsMobile(window.innerWidth <= 768);
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    return isMobile;
}

// Custom hook to get screen dimensions
export function useScreenDimensions() {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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

// Custom hook to detect 769-1024px (Tablet Range)
export function useIsTablet() {
    const [isTablet, setIsTablet] = useState(false);
    useEffect(() => {
        setIsTablet(window.innerWidth >= 769 && window.innerWidth <= 1024);
        function handleResize() {
            setIsTablet(window.innerWidth >= 769 && window.innerWidth <= 1024);
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    return isTablet;
}
