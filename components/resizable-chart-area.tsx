"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useChartStore } from '@/lib/chart-store'
import { GripHorizontal, GripVertical, CornerDownRight } from 'lucide-react'

interface ResizableChartAreaProps {
  children: React.ReactNode
}

export function ResizableChartArea({ children }: ResizableChartAreaProps) {
  const { chartConfig, updateChartConfig } = useChartStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string>('')
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })

  // Get current chart dimensions for dynamic mode only
  const getCurrentDimensions = () => {
    if (chartConfig.dynamicDimension) {
      const width = typeof chartConfig.width === 'string' 
        ? parseInt(chartConfig.width) 
        : chartConfig.width || 400
      const height = typeof chartConfig.height === 'string' 
        ? parseInt(chartConfig.height) 
        : chartConfig.height || 300
      return { width, height }
    }
    return { width: 400, height: 300 }
  }

  const [dimensions, setDimensions] = useState(getCurrentDimensions())

  // Only update local state if dynamicDimension is active
  useEffect(() => {
    if (chartConfig.dynamicDimension) {
      setDimensions(getCurrentDimensions())
    }
    // Do not update if not in dynamic mode
    // eslint-disable-next-line
  }, [chartConfig.width, chartConfig.height, chartConfig.dynamicDimension])

  const handleMouseDown = (e: React.MouseEvent, direction: string) => {
    if (!chartConfig.dynamicDimension) return;
    e.preventDefault()
    setIsResizing(true)
    setResizeDirection(direction)
    setStartPos({ x: e.clientX, y: e.clientY })
    setStartSize({ width: dimensions.width, height: dimensions.height })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !chartConfig.dynamicDimension) return

    const deltaX = e.clientX - startPos.x
    const deltaY = e.clientY - startPos.y

    let newWidth = startSize.width
    let newHeight = startSize.height

    // Calculate new dimensions based on resize direction
    switch (resizeDirection) {
      case 'right':
        newWidth = Math.max(200, startSize.width + deltaX)
        break
      case 'bottom':
        newHeight = Math.max(150, startSize.height + deltaY)
        break
      case 'corner':
        newWidth = Math.max(200, startSize.width + deltaX)
        newHeight = Math.max(150, startSize.height + deltaY)
        break
    }

    setDimensions({ width: newWidth, height: newHeight })

    // Only update chart config if in dynamic mode
    if (chartConfig.dynamicDimension) {
      updateChartConfig({
        ...chartConfig,
        dynamicDimension: true,
        width: `${newWidth}px`,
        height: `${newHeight}px`
      })
    }
  }

  const handleMouseUp = () => {
    if (isResizing) {
      setIsResizing(false)
      setResizeDirection('')
      // Chart config is already updated during resize, no need to update again
    }
  }

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'se-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, resizeDirection, startPos, startSize, chartConfig.dynamicDimension])

  // Only render the resizable area if dynamicDimension is true
  if (!chartConfig.dynamicDimension) {
    return children as React.ReactElement
  }

  return (
    <div className="relative inline-block">
      <div
        ref={containerRef}
        className="relative border-2 border-blue-400 border-dashed bg-blue-50/20"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          minWidth: '200px',
          minHeight: '150px'
        }}
      >
        {/* Chart Content */}
        <div className="w-full h-full overflow-hidden">
          {React.cloneElement(children as React.ReactElement, {
            key: `chart-${dimensions.width}-${dimensions.height}`
          })}
        </div>

        {/* Resize Handles */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Right handle */}
          <div
            className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-8 bg-blue-500 rounded cursor-ew-resize pointer-events-auto hover:bg-blue-600 transition-colors"
            onMouseDown={(e) => handleMouseDown(e, 'right')}
          >
            <GripVertical className="w-2 h-8 text-white" />
          </div>

          {/* Bottom handle */}
          <div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-blue-500 rounded cursor-ns-resize pointer-events-auto hover:bg-blue-600 transition-colors"
            onMouseDown={(e) => handleMouseDown(e, 'bottom')}
          >
            <GripHorizontal className="w-8 h-2 text-white" />
          </div>

          {/* Corner handle */}
          <div
            className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded cursor-se-resize pointer-events-auto hover:bg-blue-600 transition-colors"
            onMouseDown={(e) => handleMouseDown(e, 'corner')}
          >
            <CornerDownRight className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Size indicator */}
        {dimensions.width} × {dimensions.height}
      </div>
    </div>
  )
} 