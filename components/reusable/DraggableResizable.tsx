"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

export type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "e" | "s" | "w"

export interface DraggableResizableProps {
  x: number
  y: number
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  bounds: { width: number; height: number }
  grid?: number // snap size (px). 0 or undefined disables snapping
  // The visual scale applied to the parent surface (e.g., template zoom).
  // Used to convert mouse positions (in CSS pixels) to logical coordinates.
  scale?: number
  selected?: boolean
  onSelect?: () => void
  onChange: (rect: { x: number; y: number; width: number; height: number }) => void
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  label?: string
  accentColor?: string
}

function snap(value: number, grid?: number) {
  if (!grid || grid <= 0) return value
  return Math.round(value / grid) * grid
}

export function DraggableResizable({
  x,
  y,
  width,
  height,
  minWidth = 40,
  minHeight = 30,
  bounds,
  grid,
  scale = 1,
  selected = true,
  onSelect,
  onChange,
  children,
  className,
  style,
  label,
  accentColor
}: DraggableResizableProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState<ResizeHandle | null>(null)
  const dragOffset = useRef({ dx: 0, dy: 0 })
  const startRect = useRef({ x, y, width, height })

  const setCursor = (cursor: string) => {
    document.body.style.cursor = cursor
  }

  const clampRect = useCallback((rect: { x: number; y: number; width: number; height: number }) => {
    let nx = Math.max(0, Math.min(rect.x, bounds.width - minWidth))
    let ny = Math.max(0, Math.min(rect.y, bounds.height - minHeight))
    let nwidth = Math.max(minWidth, Math.min(rect.width, bounds.width - nx))
    let nheight = Math.max(minHeight, Math.min(rect.height, bounds.height - ny))
    return { x: nx, y: ny, width: nwidth, height: nheight }
  }, [bounds.height, bounds.width, minHeight, minWidth])

  const onMouseDownDrag = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onSelect?.()
    // First, detect if we're near an edge to start resizing even if not clicking the small handle square
    const elRect = containerRef.current!.getBoundingClientRect()
    const px = e.clientX - elRect.left
    const py = e.clientY - elRect.top
    const HS = 8 // same tolerance as hover
    const nearLeft = px <= HS
    const nearRight = px >= elRect.width - HS
    const nearTop = py <= HS
    const nearBottom = py >= elRect.height - HS
    let inferredHandle: ResizeHandle | null = null
    if ((nearLeft && nearTop)) inferredHandle = "nw"
    else if ((nearRight && nearTop)) inferredHandle = "ne"
    else if ((nearLeft && nearBottom)) inferredHandle = "sw"
    else if ((nearRight && nearBottom)) inferredHandle = "se"
    else if (nearLeft) inferredHandle = "w"
    else if (nearRight) inferredHandle = "e"
    else if (nearTop) inferredHandle = "n"
    else if (nearBottom) inferredHandle = "s"

    if (inferredHandle) {
      // Begin resizing from edge proximity
      setIsResizing(inferredHandle)
      startRect.current = { x, y, width, height }
      switch (inferredHandle) {
        case "nw":
        case "se":
          setCursor("nwse-resize"); break
        case "ne":
        case "sw":
          setCursor("nesw-resize"); break
        case "n":
        case "s":
          setCursor("ns-resize"); break
        case "e":
        case "w":
          setCursor("ew-resize"); break
      }
      return
    }

    // Otherwise, begin dragging
    setIsDragging(true)
    // Account for parent scaling when computing initial drag offset
    const parentRect = containerRef.current?.parentElement?.getBoundingClientRect() || containerRef.current!.getBoundingClientRect()
    const localX = (e.clientX - parentRect.left) / scale
    const localY = (e.clientY - parentRect.top) / scale
    dragOffset.current = { dx: localX - x, dy: localY - y }
    // Store the starting rect for consistent movement with scaling
    startRect.current = { x, y, width, height }
    setCursor("grabbing")
  }

  const onMouseDownResize = (handle: ResizeHandle) => (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onSelect?.()
    setIsResizing(handle)
    startRect.current = { x, y, width, height }
    switch (handle) {
      case "nw":
      case "se":
        setCursor("nwse-resize"); break
      case "ne":
      case "sw":
        setCursor("nesw-resize"); break
      case "n":
      case "s":
        setCursor("ns-resize"); break
      case "e":
      case "w":
        setCursor("ew-resize"); break
    }
  }

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (isDragging) {
      const rect = containerRef.current?.parentElement?.getBoundingClientRect()
      // Fallback to own rect if parent not found
      const baseRect = rect || containerRef.current!.getBoundingClientRect()
      const localX = (clientX - baseRect.left) / scale
      const localY = (clientY - baseRect.top) / scale
      const nx = snap(localX - dragOffset.current.dx, grid)
      const ny = snap(localY - dragOffset.current.dy, grid)
      onChange(clampRect({ x: nx, y: ny, width: startRect.current.width, height: startRect.current.height }))
    } else if (isResizing) {
      const start = startRect.current
      let nx = start.x
      let ny = start.y
      let nwidth = start.width
      let nheight = start.height
      const rect = containerRef.current?.parentElement?.getBoundingClientRect()
      const baseRect = rect || containerRef.current!.getBoundingClientRect()
      // Mouse coordinates converted to logical coords considering scale
      const mx = (clientX - baseRect.left) / scale
      const my = (clientY - baseRect.top) / scale

      if (isResizing.includes("e")) {
        nwidth = Math.max(minWidth, snap(mx - start.x, grid))
      }
      if (isResizing.includes("s")) {
        nheight = Math.max(minHeight, snap(my - start.y, grid))
      }
      if (isResizing.includes("w")) {
        const rx = snap(mx, grid)
        const delta = start.x - rx
        nx = snap(rx, grid)
        nwidth = Math.max(minWidth, snap(start.width + delta, grid))
      }
      if (isResizing.includes("n")) {
        const ry = snap(my, grid)
        const delta = start.y - ry
        ny = snap(ry, grid)
        nheight = Math.max(minHeight, snap(start.height + delta, grid))
      }

      onChange(clampRect({ x: nx, y: ny, width: nwidth, height: nheight }))
    }
  }, [clampRect, grid, height, isDragging, isResizing, minHeight, minWidth, onChange, width])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY)
    const onMouseUp = () => {
      setIsDragging(false)
      setIsResizing(null)
      setCursor("")
    }
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
      document.body.style.userSelect = "none"
    }
    return () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
      document.body.style.userSelect = ""
    }
  }, [handleMove, isDragging, isResizing])

  const accent = accentColor || "#2563eb" // default blue
  const handleClass = "absolute w-2 h-2 border border-white rounded shadow"

  // Hover cursor feedback without clicking: set appropriate cursor when near handles
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      if (isDragging || isResizing) return
      const rect = el.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      const HS = 8
      const nearLeft = px <= HS
      const nearRight = px >= rect.width - HS
      const nearTop = py <= HS
      const nearBottom = py >= rect.height - HS
      let cursor = "move"
      if ((nearLeft && nearTop) || (nearRight && nearBottom)) cursor = "nwse-resize"
      else if ((nearRight && nearTop) || (nearLeft && nearBottom)) cursor = "nesw-resize"
      else if (nearLeft || nearRight) cursor = "ew-resize"
      else if (nearTop || nearBottom) cursor = "ns-resize"
      el.style.cursor = cursor
    }
    el.addEventListener("mousemove", onMove)
    return () => el.removeEventListener("mousemove", onMove)
  }, [isDragging, isResizing])

  return (
    <div
      ref={containerRef}
      className={"absolute select-none " + (className || "")}
      style={{ left: x, top: y, width, height, ...style }}
      onMouseDown={onMouseDownDrag}
    >
      {/* Content */}
      <div className={`w-full h-full`}>
        {label && (
          <div
            className="absolute -top-3 left-0 text-[10px] px-1 py-0.5 rounded border"
            style={{ color: accent, borderColor: accent, background: "rgba(255,255,255,0.9)" }}
          >
            {label}
          </div>
        )}
        {children}
      </div>

      {/* Resize handles */}
      {selected && (
        <>
          <div className={`${handleClass}`} style={{ left: -4, top: -4, cursor: "nwse-resize", backgroundColor: accent }} onMouseDown={onMouseDownResize("nw")} />
          <div className={`${handleClass}`} style={{ right: -4, top: -4, cursor: "nesw-resize", backgroundColor: accent }} onMouseDown={onMouseDownResize("ne")} />
          <div className={`${handleClass}`} style={{ left: -4, bottom: -4, cursor: "nesw-resize", backgroundColor: accent }} onMouseDown={onMouseDownResize("sw")} />
          <div className={`${handleClass}`} style={{ right: -4, bottom: -4, cursor: "nwse-resize", backgroundColor: accent }} onMouseDown={onMouseDownResize("se")} />

          <div className={`${handleClass}`} style={{ left: "50%", top: -4, transform: "translateX(-50%)", cursor: "ns-resize", backgroundColor: accent }} onMouseDown={onMouseDownResize("n")} />
          <div className={`${handleClass}`} style={{ right: -4, top: "50%", transform: "translateY(-50%)", cursor: "ew-resize", backgroundColor: accent }} onMouseDown={onMouseDownResize("e")} />
          <div className={`${handleClass}`} style={{ left: "50%", bottom: -4, transform: "translateX(-50%)", cursor: "ns-resize", backgroundColor: accent }} onMouseDown={onMouseDownResize("s")} />
          <div className={`${handleClass}`} style={{ left: -4, top: "50%", transform: "translateY(-50%)", cursor: "ew-resize", backgroundColor: accent }} onMouseDown={onMouseDownResize("w")} />
        </>
      )}
    </div>
  )
}

export default DraggableResizable


