"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { useLoupeStore } from "@/lib/stores/loupe-store"
import { ScanSearch, X } from "lucide-react"

interface ChartLoupeOverlayProps {
  /** The container element of the chart or template to inspect */
  targetContainerRef: React.RefObject<HTMLDivElement | null>
}

const LENS_WIDTH = 160
const LENS_HEIGHT = 110

export const ChartLoupeOverlay: React.FC<ChartLoupeOverlayProps> = ({ targetContainerRef }) => {
  const { isLoupeActive, setLoupeActive, zoomLevel, setZoomLevel } = useLoupeStore()
  
  const [isHovering, setIsHovering] = useState(false)
  const [containerRect, setContainerRect] = useState<{ width: number; height: number }>({ width: 0, height: 0 })

  const isMouseOverContainerRef = useRef(false)
  const isMouseOverZoomWinRef = useRef(false)

  const lensRef = useRef<HTMLDivElement>(null)
  const zoomViewportRef = useRef<HTMLDivElement>(null)
  const zoomMirrorContainerRef = useRef<HTMLDivElement>(null)
  const animFrameIdRef = useRef<number | null>(null)
  const latestMousePosRef = useRef<{ x: number; y: number } | null>(null)

  const updateHoverState = useCallback(() => {
    setIsHovering(isMouseOverContainerRef.current || isMouseOverZoomWinRef.current)
  }, [])

  // Sync snapshot of the target container into the zoom mirror
  const updateSnapshot = useCallback(() => {
    const container = targetContainerRef.current
    const mirror = zoomMirrorContainerRef.current
    if (!container || !mirror) return

    const rect = container.getBoundingClientRect()
    setContainerRect({ width: rect.width, height: rect.height })

    // Clear previous mirror content
    mirror.innerHTML = ""

    // Deep clone container contents
    const clone = container.cloneNode(true) as HTMLElement

    // Remove any loupe elements from the clone to prevent recursive mirrors
    const loupeElements = clone.querySelectorAll("[data-loupe-element]")
    loupeElements.forEach((el) => el.remove())

    // Copy canvas bitmaps from original to clone (cloneNode doesn't clone canvas context pixels)
    const sourceCanvases = container.querySelectorAll("canvas")
    const clonedCanvases = clone.querySelectorAll("canvas")
    sourceCanvases.forEach((src, idx) => {
      const dest = clonedCanvases[idx]
      if (dest) {
        dest.width = src.width
        dest.height = src.height
        const destCtx = dest.getContext("2d")
        if (destCtx) {
          destCtx.drawImage(src, 0, 0)
        }
      }
    })

    // Reset layout styles on clone to ensure it mirrors 1:1
    clone.style.position = "absolute"
    clone.style.top = "0"
    clone.style.left = "0"
    clone.style.width = `${rect.width}px`
    clone.style.height = `${rect.height}px`
    clone.style.pointerEvents = "none"

    mirror.appendChild(clone)
  }, [targetContainerRef])

  // Handle ESC key to exit Loupe mode
  useEffect(() => {
    if (!isLoupeActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLoupeActive(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isLoupeActive, setLoupeActive])

  // Mouse movement loop using requestAnimationFrame for zero-lag 60-120fps tracking
  const applyLensTransform = useCallback(() => {
    if (!latestMousePosRef.current || !targetContainerRef.current) return

    const container = targetContainerRef.current
    const rect = container.getBoundingClientRect()
    const { x, y } = latestMousePosRef.current

    // Clamp lens position inside container bounds
    const maxLensX = Math.max(0, rect.width - LENS_WIDTH)
    const maxLensY = Math.max(0, rect.height - LENS_HEIGHT)
    const lensX = Math.max(0, Math.min(x - LENS_WIDTH / 2, maxLensX))
    const lensY = Math.max(0, Math.min(y - LENS_HEIGHT / 2, maxLensY))

    // Update lens position directly on DOM (bypasses React renders)
    if (lensRef.current) {
      lensRef.current.style.transform = `translate3d(${lensX}px, ${lensY}px, 0)`
    }

    // Update magnified content position directly on DOM
    if (zoomMirrorContainerRef.current) {
      zoomMirrorContainerRef.current.style.transform = `scale(${zoomLevel}) translate3d(${-lensX}px, ${-lensY}px, 0)`
    }
  }, [targetContainerRef, zoomLevel])

  // Event handlers attached to target container
  useEffect(() => {
    const container = targetContainerRef.current
    if (!container || !isLoupeActive) return

    // 1. Temporarily disable pointer events on all canvases and dismiss any active hover states
    const canvases = container.querySelectorAll("canvas")
    canvases.forEach((c) => {
      c.style.pointerEvents = "none"
      try {
        c.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }))
      } catch (err) {}
    })

    // Prime snapshot immediately when loupe mode turns on
    updateSnapshot()

    const handleMouseEnter = () => {
      isMouseOverContainerRef.current = true
      updateHoverState()
      updateSnapshot()
    }

    const handleMouseLeave = () => {
      isMouseOverContainerRef.current = false
      updateHoverState()
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      latestMousePosRef.current = { x, y }

      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current)
      }
      animFrameIdRef.current = requestAnimationFrame(applyLensTransform)
    }

    const handleTouchStart = (e: TouchEvent) => {
      isMouseOverContainerRef.current = true
      updateHoverState()
      updateSnapshot()
      if (e.touches[0]) {
        const rect = container.getBoundingClientRect()
        const x = e.touches[0].clientX - rect.left
        const y = e.touches[0].clientY - rect.top
        latestMousePosRef.current = { x, y }
        if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current)
        animFrameIdRef.current = requestAnimationFrame(applyLensTransform)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        const rect = container.getBoundingClientRect()
        const x = e.touches[0].clientX - rect.left
        const y = e.touches[0].clientY - rect.top
        latestMousePosRef.current = { x, y }
        if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current)
        animFrameIdRef.current = requestAnimationFrame(applyLensTransform)
      }
    }

    const handleTouchEnd = () => {
      isMouseOverContainerRef.current = false
      updateHoverState()
    }

    container.addEventListener("mouseenter", handleMouseEnter)
    container.addEventListener("mouseleave", handleMouseLeave)
    container.addEventListener("mousemove", handleMouseMove)
    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    container.addEventListener("touchmove", handleTouchMove, { passive: true })
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      // Restore canvas pointer events when Loupe mode exits
      canvases.forEach((c) => {
        c.style.pointerEvents = ""
      })
      container.removeEventListener("mouseenter", handleMouseEnter)
      container.removeEventListener("mouseleave", handleMouseLeave)
      container.removeEventListener("mousemove", handleMouseMove)
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current)
      }
    }
  }, [targetContainerRef, isLoupeActive, applyLensTransform, updateSnapshot, updateHoverState])

  // Re-apply transform when zoomLevel changes
  useEffect(() => {
    if (isHovering) {
      applyLensTransform()
    }
  }, [zoomLevel, isHovering, applyLensTransform])

  if (!isLoupeActive) return null

  // Calculate zoom window dimensions matching lens aspect ratio
  const zoomWinWidth = Math.round(LENS_WIDTH * zoomLevel)
  const zoomWinHeight = Math.round(LENS_HEIGHT * zoomLevel)

  return (
    <>
      {/* 0. Transparent interceptor layer: blocks hover/tooltips from reaching chart canvas */}
      <div
        data-loupe-element="true"
        className="absolute inset-0 z-30 cursor-crosshair select-none"
        style={{
          width: "100%",
          height: "100%",
          minWidth: `${containerRect.width}px`,
          minHeight: `${containerRect.height}px`,
          pointerEvents: "auto",
        }}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
      />

      {/* 1. The Reticle / Lens (Amazon Stippled Box) over the chart/template */}
      <div
        ref={lensRef}
        data-loupe-element="true"
        className="absolute top-0 left-0 pointer-events-none z-40 transition-opacity duration-150"
        style={{
          width: `${LENS_WIDTH}px`,
          height: `${LENS_HEIGHT}px`,
          opacity: isHovering ? 1 : 0,
          border: "1.5px solid rgba(59, 130, 246, 0.85)",
          backgroundColor: "rgba(59, 130, 246, 0.12)",
          backgroundImage: "radial-gradient(rgba(59, 130, 246, 0.5) 1.2px, transparent 1.2px)",
          backgroundSize: "5px 5px",
          borderRadius: "6px",
          boxShadow: "0 0 16px rgba(59, 130, 246, 0.3)",
          willChange: "transform",
        }}
      />

      {/* 2. Amazon-Style Magnification Preview Window — Pinned to Right End */}
      <div
        ref={zoomViewportRef}
        data-loupe-element="true"
        onMouseEnter={() => {
          isMouseOverZoomWinRef.current = true
          updateHoverState()
        }}
        onMouseLeave={() => {
          isMouseOverZoomWinRef.current = false
          updateHoverState()
        }}
        className={`fixed z-[100] top-16 right-4 pointer-events-auto transition-all duration-200 ${
          isHovering ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
        }`}
        style={{
          width: `${Math.min(zoomWinWidth, 400)}px`,
          maxWidth: "calc(100vw - 2rem)",
        }}
      >
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-black/5">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 select-none">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
              <ScanSearch className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Loupe View</span>
              <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 ml-1">
                (Press Esc to exit)
              </span>
            </div>

            {/* Magnification Controls & Close Button */}
            <div className="flex items-center gap-1">
              {[2, 2.5, 3].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setZoomLevel(lvl)}
                  className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md transition-all ${
                    zoomLevel === lvl
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                  }`}
                  title={`${lvl}x magnification`}
                >
                  {lvl}x
                </button>
              ))}

              <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 mx-1" />

              <button
                onClick={() => setLoupeActive(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close Loupe View (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Viewport Canvas Mask */}
          <div
            className="relative overflow-hidden bg-white dark:bg-slate-950"
            style={{
              width: "100%",
              height: `${Math.min(zoomWinHeight, 290)}px`,
            }}
          >
            {/* The Mirrored High-Res Content */}
            <div
              ref={zoomMirrorContainerRef}
              style={{
                width: `${containerRect.width}px`,
                height: `${containerRect.height}px`,
                transformOrigin: "top left",
                willChange: "transform",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
