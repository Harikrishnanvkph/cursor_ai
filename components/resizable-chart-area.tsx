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

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, direction: string) => {
    if (!chartConfig.dynamicDimension) return;
    e.preventDefault();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    setIsResizing(true);
    setResizeDirection(direction);
    setStartPos({ x: clientX, y: clientY });
    setStartSize({ width: dimensions.width, height: dimensions.height });
  };

  const handlePointerMove = (e: MouseEvent | TouchEvent) => {
    if (!isResizing || !chartConfig.dynamicDimension) return;
    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }
    const deltaX = clientX - startPos.x;
    const deltaY = clientY - startPos.y;
    let newWidth = startSize.width;
    let newHeight = startSize.height;
    switch (resizeDirection) {
      case 'right':
        newWidth = Math.max(200, startSize.width + deltaX);
        break;
      case 'bottom':
        newHeight = Math.max(150, startSize.height + deltaY);
        break;
      case 'corner':
        newWidth = Math.max(200, startSize.width + deltaX);
        newHeight = Math.max(150, startSize.height + deltaY);
        break;
    }
    setDimensions({ width: newWidth, height: newHeight });
    if (chartConfig.dynamicDimension) {
      updateChartConfig({
        ...chartConfig,
        dynamicDimension: true,
        width: `${newWidth}px`,
        height: `${newHeight}px`
      });
    }
  };

  const handlePointerUp = () => {
    if (isResizing) {
      setIsResizing(false);
      setResizeDirection('');
    }
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handlePointerMove);
      document.addEventListener('mouseup', handlePointerUp);
      document.addEventListener('touchmove', handlePointerMove, { passive: false });
      document.addEventListener('touchend', handlePointerUp);
      document.body.style.cursor = 'se-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseup', handlePointerUp);
      document.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('touchend', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseup', handlePointerUp);
      document.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('touchend', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resizeDirection, startPos, startSize, chartConfig.dynamicDimension]);

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
            onMouseDown={(e) => handlePointerDown(e, 'right')}
            onTouchStart={(e) => handlePointerDown(e, 'right')}
          >
            <GripVertical className="w-2 h-8 text-white" />
          </div>

          {/* Bottom handle */}
          <div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-blue-500 rounded cursor-ns-resize pointer-events-auto hover:bg-blue-600 transition-colors"
            onMouseDown={(e) => handlePointerDown(e, 'bottom')}
            onTouchStart={(e) => handlePointerDown(e, 'bottom')}
          >
            <GripHorizontal className="w-8 h-2 text-white" />
          </div>

          {/* Corner handle */}
          <div
            className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded cursor-se-resize pointer-events-auto hover:bg-blue-600 transition-colors"
            onMouseDown={(e) => handlePointerDown(e, 'corner')}
            onTouchStart={(e) => handlePointerDown(e, 'corner')}
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