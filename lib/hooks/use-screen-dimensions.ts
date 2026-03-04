"use client"

import { useState, useEffect } from "react"

// Custom hook to detect <=576px
export function useIsMobile576() {
    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" ? window.innerWidth <= 576 : false
    );
    useEffect(() => {
        function handleResize() {
            setIsMobile(window.innerWidth <= 576);
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

// Custom hook to detect 577-1024px
export function useIsTablet() {
    const [isTablet, setIsTablet] = useState(
        typeof window !== "undefined" ? window.innerWidth >= 577 && window.innerWidth <= 1024 : false
    );
    useEffect(() => {
        function handleResize() {
            setIsTablet(window.innerWidth >= 577 && window.innerWidth <= 1024);
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    return isTablet;
}
