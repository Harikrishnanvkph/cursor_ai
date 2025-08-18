"use client"

// Chart Generator - Self-contained Chart Rendering Component
// This file contains the chart rendering component with all necessary imports

import React from "react"
import { useRef, useEffect, useState } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler,
  ScatterController,
  BubbleController,
  TimeScale,
  BarController,
  LineController,
  PieController,
  DoughnutController,
  PolarAreaController,
  RadarController
} from "chart.js"
import { Chart } from "react-chartjs-2"
import { useChartStore, universalImagePlugin } from "@/lib/chart-store"
import exportPlugin from "@/lib/export-plugin"
import { customLabelPlugin } from "@/lib/custom-label-plugin"
import { overlayPlugin } from "@/lib/overlay-plugin"
import { ResizableChartArea } from "@/components/resizable-chart-area"
import { OverlayContextMenu } from "@/components/overlay-context-menu"

// Register all Chart.js components and plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  BarController,
  LineController,
  PieController,
  DoughnutController,
  PolarAreaController,
  RadarController,
  Filler,
  ScatterController,
  BubbleController,
  TimeScale,
  universalImagePlugin,
  customLabelPlugin,
  exportPlugin,
  overlayPlugin
);

// Verify plugin registration
console.log('🟢🟢🟢 CHART-GENERATOR: CHART.JS REGISTRATION STARTING 🟢🟢🟢');
console.log('🟢 Registered controllers:', Object.keys(ChartJS.registry.controllers));
console.log('🟢 Registered plugins:', Object.keys(ChartJS.registry.plugins));
console.log('🟢 Looking for overlayPlugin:', ChartJS.registry.plugins.overlayPlugin ? 'FOUND' : 'NOT FOUND');
console.log('🟢🟢🟢 CHART-GENERATOR: CHART.JS REGISTRATION COMPLETED 🟢🟢🟢');

// Utility to fade any color to a given alpha
function fadeColor(color: any, alpha = 0.15) {
  if (!color) return color;
  if (typeof color !== 'string') return color;
  if (color.startsWith('rgba')) {
    return color.replace(/rgba\(([^)]+),[^)]+\)/, `rgba($1,${alpha})`);
  }
  if (color.startsWith('rgb')) {
    return color.replace(/rgb\(([^)]+)\)/, `rgba($1,${alpha})`);
  }
  if (color.startsWith('#')) {
    let r = 0, g = 0, b = 0;
    if (color.length === 4) {
      r = parseInt(color[1] + color[1], 16);
      g = parseInt(color[2] + color[2], 16);
      b = parseInt(color[3] + color[3], 16);
    } else if (color.length === 7) {
      r = parseInt(color[1] + color[2], 16);
      g = parseInt(color[3] + color[4], 16);
      b = parseInt(color[5] + color[6], 16);
    }
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color;
}

export interface ChartGeneratorProps {
  className?: string;
}

export function ChartGenerator({ className = "" }: ChartGeneratorProps) {
  const { 
    chartConfig, 
    chartData, 
    chartType, 
    legendFilter, 
    fillArea, 
    showBorder, 
    showImages, 
    showLabels, 
    chartMode, 
    activeDatasetIndex, 
    uniformityMode, 
    overlayImages, 
    overlayTexts, 
    selectedImageId, 
    selectedTextId,
    updateOverlayImage,
    updateOverlayText,
    setSelectedImageId,
    setSelectedTextId,
    removeOverlayImage,
    removeOverlayText,
    setGlobalChartRef 
  } = useChartStore();

  const chartRef = useRef<ChartJS>(null);
  const [hoveredDatasetIndex, setHoveredDatasetIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    type: 'image' | 'text';
    id: string;
    data: any;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    type: 'image',
    id: '',
    data: null
  });

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 576);
    check();
    console.log('Adding Resize event listener')
    window.addEventListener('resize', check);
    return () => {
      console.log('Removing Resize event listener')
      window.removeEventListener('resize', check);
    }
  }, []);

  // Register chart ref globally
  useEffect(() => {
    setGlobalChartRef(chartRef);
  }, [setGlobalChartRef]);

  // Handle overlay position updates from drag and drop
  useEffect(() => {
    const canvas = chartRef.current?.canvas
    if (!canvas) return

    console.log('🔄 Setting up event listeners for chart canvas...')

    const handleOverlayPositionUpdate = (event: CustomEvent) => {
      const { type, id, x, y } = event.detail
      
      if (type === 'image') {
        updateOverlayImage(id, { x, y })
      } else if (type === 'text') {
        updateOverlayText(id, { x, y })
      }
      
      // Update chart to reflect new position
      chartRef.current?.update('none')
    }
    
    const handleImageLoaded = (event: CustomEvent) => {
      console.log('🔄 Image loaded event received, forcing chart update')
      if (chartRef.current) {
        chartRef.current.update('none')
        console.log('✅ Chart updated from component level')
      }
    }

    const handleDimensionsUpdate = (event: CustomEvent) => {
      const { imageId, updateData } = event.detail
      console.log('📏 Dimensions update event received:', { imageId, updateData })
      updateOverlayImage(imageId, updateData)
      
      // Update chart to reflect new dimensions
      if (chartRef.current) {
        chartRef.current.update('none')
      }
    }

    const handleImageSelected = (event: CustomEvent) => {
      const { imageId } = event.detail
      console.log('🎯 Image selected/deselected:', imageId)
      setSelectedImageId(imageId)
      
      // Update chart to show/hide selection handles
      if (chartRef.current) {
        chartRef.current.update('none')
        console.log('✅ Chart updated after image selection change')
      }
    }

    const handleTextSelected = (event: CustomEvent) => {
      const { textId } = event.detail
      console.log('🎯 Text selected/deselected:', textId)
      setSelectedTextId(textId)
      
      // Update chart to show/hide selection handles
      if (chartRef.current) {
        chartRef.current.update('none')
        console.log('✅ Chart updated after text selection change')
      }
    }

    const handleImageResize = (event: CustomEvent) => {
      const { id, x, y, width, height, useNaturalSize } = event.detail
      console.log('🔄 Image resize:', { id, x, y, width, height, useNaturalSize })
      updateOverlayImage(id, { x, y, width, height, useNaturalSize })
      
      // Update chart to reflect new size
      if (chartRef.current) {
        chartRef.current.update('none')
      }
    }

    const handleContextMenu = (event: CustomEvent) => {
      const { type, id, x, y, data } = event.detail
      console.log('🎯 Context menu triggered:', { type, id, x, y })
      
      setContextMenu({
        isOpen: true,
        x,
        y,
        type,
        id,
        data
      })
    }

    canvas.addEventListener('overlayPositionUpdate', handleOverlayPositionUpdate as EventListener)
    canvas.addEventListener('overlayImageLoaded', handleImageLoaded as EventListener)
    canvas.addEventListener('overlayImageDimensionsUpdate', handleDimensionsUpdate as EventListener)
    canvas.addEventListener('overlayImageSelected', handleImageSelected as EventListener)
    canvas.addEventListener('overlayTextSelected', handleTextSelected as EventListener)
    canvas.addEventListener('overlayImageResize', handleImageResize as EventListener)
    canvas.addEventListener('overlayContextMenu', handleContextMenu as EventListener)
    
    console.log('✅ Event listeners attached to chart canvas')
    
    return () => {
      canvas.removeEventListener('overlayPositionUpdate', handleOverlayPositionUpdate as EventListener)
      canvas.removeEventListener('overlayImageLoaded', handleImageLoaded as EventListener)
      canvas.removeEventListener('overlayImageDimensionsUpdate', handleDimensionsUpdate as EventListener)
      canvas.removeEventListener('overlayImageSelected', handleImageSelected as EventListener)
      canvas.removeEventListener('overlayTextSelected', handleTextSelected as EventListener)
      canvas.removeEventListener('overlayImageResize', handleImageResize as EventListener)
      canvas.removeEventListener('overlayContextMenu', handleContextMenu as EventListener)
    }
  }, [updateOverlayImage, updateOverlayText, setSelectedImageId, setSelectedTextId, chartType, chartConfig]);

  // Debug overlay data
  useEffect(() => {
    if (overlayImages.length > 0 || overlayTexts.length > 0) {
      console.log('ChartGenerator - Overlay data:', { 
        overlayImages: overlayImages.length, 
        overlayTexts: overlayTexts.length
      })
    }
  }, [overlayImages, overlayTexts]);

  // Get enabled datasets (respect single/grouped mode and legendFilter)
  const enabledDatasets = chartMode === 'single'
    ? chartData.datasets.filter((_, i) => i === activeDatasetIndex)
    : chartData.datasets
        .map((ds, i) => (legendFilter.datasets[i] === false ? null : ds))
        .filter((ds): ds is typeof chartData.datasets[number] => ds !== null);

  // Filter datasets based on mode
  const modeFilteredDatasets = enabledDatasets.filter(dataset => {
    if (dataset.mode) {
      return dataset.mode === chartMode;
    }
    return true;
  });

  // Slice-level visibility (for pie/doughnut/polarArea) - respect legendFilter
  const isSliceVisible = (index: number): boolean => {
    return (legendFilter.slices[index] !== false);
  };

  // Find all slice indices that are enabled
  const enabledSliceIndicesSet = new Set<number>();
  modeFilteredDatasets.forEach(ds => {
    (ds.data || []).forEach((_, idx) => {
      if (isSliceVisible(idx)) {
        enabledSliceIndicesSet.add(idx);
      }
    });
  });
  const enabledSliceIndices = Array.from(enabledSliceIndicesSet).sort((a, b) => a - b);

  // Filter x-axis labels to only include enabled slices
  let filteredLabels: string[] = [];
  if (Array.isArray(chartData.labels)) {
    filteredLabels = enabledSliceIndices.map(idx => String(chartData.labels![idx]));
  }

  // Filter datasets to only include enabled slices
  const filteredDatasets = modeFilteredDatasets.map(ds => {
    const filterSlice = (arr: any[] | undefined) => {
      if (!arr) return [];
      return enabledSliceIndices.map(idx => arr?.[idx]);
    };
    
    let newData = filterSlice(ds.data);
    let newBackgroundColor = Array.isArray(ds.backgroundColor) 
      ? filterSlice(ds.backgroundColor) 
      : [];
    let newBorderColor = Array.isArray(ds.borderColor) 
      ? filterSlice(ds.borderColor) 
      : [];
    let newPointImages = ds.pointImages ? filterSlice(ds.pointImages) : [];
    let newPointImageConfig = ds.pointImageConfig ? filterSlice(ds.pointImageConfig) : [];

    if (!showImages) {
      newPointImages = newPointImages.map(() => null);
    }

    let processedDs = {
      ...ds,
      data: newData,
      backgroundColor: newBackgroundColor.length ? newBackgroundColor : ds.backgroundColor,
      borderColor: newBorderColor.length ? newBorderColor : ds.borderColor,
      borderWidth: ds.borderWidth,
      fill: ds.fill,
      pointImages: newPointImages.length ? newPointImages : ds.pointImages,
      pointImageConfig: newPointImageConfig.length ? newPointImageConfig : ds.pointImageConfig,
    };

    if (!fillArea) {
      if (Array.isArray(processedDs.backgroundColor)) {
        processedDs.backgroundColor = processedDs.backgroundColor.map(() => 'transparent');
      } else {
        processedDs.backgroundColor = 'transparent';
      }
      if (chartType === 'line' || chartType === 'area' || chartType === 'radar') {
        processedDs.fill = false;
      }
    }

    if (!showBorder) {
      if (Array.isArray(processedDs.borderColor)) {
        processedDs.borderColor = processedDs.borderColor.map(() => 'transparent');
      } else {
        processedDs.borderColor = 'transparent';
      }
      processedDs.borderWidth = 0;
    }

    return processedDs;
  });

  // Always ensure datasets have valid Chart.js types
  let filteredDatasetsPatched = [...filteredDatasets];
  
  filteredDatasetsPatched = filteredDatasetsPatched.map((ds, i) => {
    const datasetType = ds.chartType || chartType || 'bar';
    const validType = datasetType === 'stackedBar' || datasetType === 'horizontalBar' ? 'bar' : 
                     (datasetType === 'area' ? 'line' : datasetType);
    
    let patched = { ...ds, type: validType };
    if (
      chartConfig.hoverFadeEffect !== false &&
      chartMode === 'grouped' && hoveredDatasetIndex !== null
    ) {
      if (i !== hoveredDatasetIndex) {
        patched = {
          ...patched,
          backgroundColor: Array.isArray(patched.backgroundColor)
            ? patched.backgroundColor.map(c => fadeColor(c))
            : fadeColor(patched.backgroundColor),
          borderColor: Array.isArray(patched.borderColor)
            ? patched.borderColor.map(c => fadeColor(c))
            : fadeColor(patched.borderColor),
          pointBackgroundColor: Array.isArray((patched as any).pointBackgroundColor)
            ? (patched as any).pointBackgroundColor.map((c: any) => fadeColor(c))
            : fadeColor((patched as any).pointBackgroundColor),
          pointBorderColor: Array.isArray((patched as any).pointBorderColor)
            ? (patched as any).pointBorderColor.map((c: any) => fadeColor(c))
            : fadeColor((patched as any).pointBorderColor),
          fill: false,
        };
      }
    }
    return patched;
  });

  // Build custom labels config for the current chart
  const customLabelsConfig = ((chartConfig.plugins as any)?.customLabelsConfig) || {};
  const customLabels = showLabels ? filteredDatasetsPatched.map((ds, datasetIdx) =>
    ds.data.map((value, pointIdx) => {
      // If this slice is hidden by legend, also hide its label
      if (!isSliceVisible(pointIdx)) {
        return { text: '' };
      }
      if (customLabelsConfig.display === false) return { text: '' };
      let text = String(value);
      
      if (customLabelsConfig.labelContent === 'label') {
        text = String(chartData.labels?.[pointIdx] ?? text);
      } else if (customLabelsConfig.labelContent === 'percentage') {
        const total = ds.data.reduce((a: number, b: any) => {
          if (typeof b === 'number') return a + b;
          if (b && typeof b === 'object' && 'y' in b && typeof b.y === 'number') return a + b.y;
          return a;
        }, 0);
        let val = 0;
        if (typeof value === 'number') val = value;
        else if (value && typeof value === 'object' && 'y' in value && typeof value.y === 'number') val = value.y;
        text = ((val / total) * 100).toFixed(1) + '%';
      } else if (customLabelsConfig.labelContent === 'index') {
        text = String(pointIdx + 1);
      } else if (customLabelsConfig.labelContent === 'dataset') {
        text = ds.label ?? text;
      }
      
      if (customLabelsConfig.prefix) text = customLabelsConfig.prefix + text;
      if (customLabelsConfig.suffix) text = text + customLabelsConfig.suffix;
      
      let color = customLabelsConfig.color || '#222';
      let backgroundColor = customLabelsConfig.shape === 'none' ? undefined : (customLabelsConfig.backgroundColor || '#fff');
      let borderColor = customLabelsConfig.shape === 'none' ? undefined : (customLabelsConfig.borderColor || '#333');
      
      if (
        chartConfig.hoverFadeEffect !== false &&
        chartMode === 'grouped' && hoveredDatasetIndex !== null && datasetIdx !== hoveredDatasetIndex
      ) {
        color = 'rgba(0,0,0,0.08)';
        backgroundColor = 'rgba(0,0,0,0.04)';
        borderColor = 'rgba(0,0,0,0.04)';
      }
      
      return {
        text,
        anchor: customLabelsConfig.anchor || 'center',
        shape: customLabelsConfig.shape || 'none',
        align: customLabelsConfig.align || 'center',
        color,
        backgroundColor,
        borderColor,
        borderWidth: customLabelsConfig.shape === 'none' ? 0 : (customLabelsConfig.borderWidth ?? 2),
        borderRadius: customLabelsConfig.shape === 'none' ? 0 : (customLabelsConfig.borderRadius ?? 6),
        padding: customLabelsConfig.shape === 'none' ? 0 : (customLabelsConfig.padding ?? 6),
        font: `${customLabelsConfig.fontWeight || 'bold'} ${customLabelsConfig.fontSize || 14}px ${customLabelsConfig.fontFamily || 'Arial'}`,
        callout: customLabelsConfig.anchor === 'callout',
        calloutColor: customLabelsConfig.calloutColor || '#333',
        draggable: customLabelsConfig.anchor === 'callout',
        arrowLine: customLabelsConfig.arrowLine !== false,
        arrowHead: customLabelsConfig.arrowHead !== false,
        arrowColor: customLabelsConfig.arrowColor || customLabelsConfig.calloutColor || '#333',
        calloutOffset: customLabelsConfig.calloutOffset || 48,
        arrowEndGap: customLabelsConfig.arrowEndGap ?? 8,
      };
    })
  ) : [];

  // Determine chart type for Chart.js
  let chartTypeForChart = chartType === 'area' ? 'line' : 
                          (chartType === 'stackedBar' ? 'bar' : 
                          (chartType === 'horizontalBar' ? 'bar' : chartType));
  
  if (chartMode === 'single') {
    const activeDs = chartData.datasets[activeDatasetIndex];
    if (activeDs?.chartType) {
      const dsChartType = activeDs.chartType;
      chartTypeForChart = dsChartType === 'stackedBar' ? 'bar' : 
                         (dsChartType === 'horizontalBar' ? 'bar' : dsChartType);
    }
  } else {
    if (uniformityMode === 'uniform') {
      chartTypeForChart = chartType === 'area' ? 'line' : 
                         (chartType === 'stackedBar' ? 'bar' : 
                         (chartType === 'horizontalBar' ? 'bar' : chartType));
    } else {
      chartTypeForChart = 'bar';
    }
  }

  // Build the chart data for Chart.js
  const chartDataForChart = {
    ...chartData,
    labels: filteredLabels,
    datasets: filteredDatasetsPatched,
  };

  // Final safety check to ensure chartTypeForChart is valid
  if (chartTypeForChart === 'stackedBar' || chartTypeForChart === 'horizontalBar') {
    chartTypeForChart = 'bar';
  } else if (chartTypeForChart === 'area') {
    chartTypeForChart = 'line';
  }

  // Handle background settings
  const getBackgroundLayers = () => {
    const background = (chartConfig as any)?.background || { type: 'color', color: '#ffffff' };
    if (background.type === "image" && background.imageUrl) {
      const opacity = background.opacity || 100;
      return (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            backgroundImage: `url(${background.imageUrl})`,
            backgroundSize: background.imageFit === 'fill' ? '100% 100%' : 
                          background.imageFit === 'contain' ? 'contain' : 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            objectFit: background.imageFit || 'cover',
            opacity: opacity / 100,
            pointerEvents: 'none',
          }}
        />
      );
    }
    if (background.type === "gradient") {
      const color1 = background.gradientColor1 || '#ffffff';
      const color2 = background.gradientColor2 || '#000000';
      const opacity = background.opacity || 100;
      const gradientType = background.gradientType || 'linear';
      const direction = background.gradientDirection || 'to right';
      let gradient;
      if (gradientType === 'radial') {
        gradient = `radial-gradient(circle, ${color1}, ${color2})`;
      } else {
        gradient = `linear-gradient(${direction}, ${color1}, ${color2})`;
      }
      return (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            backgroundImage: gradient,
            opacity: opacity / 100,
            pointerEvents: 'none',
          }}
        />
      );
    }
    if (background.type === "color" || background.type === undefined) {
      const color = background.color || "#ffffff";
      const opacity = background.opacity || 100;
      return (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            backgroundColor: `${color}${Math.round(opacity * 2.55).toString(16).padStart(2, '0')}`,
            pointerEvents: 'none',
          }}
        />
      );
    }
    if (background.type === "transparent") {
      return null;
    }
    return null;
  };

  // Chart size logic
  const isResponsive = (chartConfig as any)?.responsive !== false;
  
  const parseDimension = (value: any): number => {
    if (typeof value === 'number') {
      return isNaN(value) ? 500 : value;
    }
    if (typeof value === 'string') {
      const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''));
      return isNaN(numericValue) ? 400 : numericValue;
    }
    return 500;
  };
  
  const chartWidth = !isResponsive ? parseDimension((chartConfig as any)?.width) : undefined;
  const chartHeight = !isResponsive ? parseDimension((chartConfig as any)?.height) : undefined;

  // Build stacked bar config if needed
  const stackedBarConfig = chartType === 'stackedBar' ? {
    ...chartConfig,
    scales: {
      ...chartConfig.scales,
      x: { ...((chartConfig.scales && chartConfig.scales.x) || {}), stacked: true },
      y: { ...((chartConfig.scales && chartConfig.scales.y) || {}), stacked: true },
    },
  } : chartConfig;

  // Ensure safe scales and correct indexAxis resolution
  const isPlainObject = (v: any) => v && typeof v === 'object' && !Array.isArray(v);
  const safeScalesSrc = (chartConfig as any)?.scales;
  const safeScales = isPlainObject(safeScalesSrc) ? safeScalesSrc : {};
  // Do NOT attach Cartesian scales for circular charts like pie/doughnut
  const isCircularType = (chartTypeForChart === 'pie' || chartTypeForChart === 'doughnut' || chartTypeForChart === 'radar' || chartTypeForChart === 'polarArea');
  const optionsScales = isCircularType ? undefined : ({
    x: { ...(safeScales?.x || {}) },
    y: { ...(safeScales?.y || {}) },
  } as any);
  // Determine if any dataset (or the chart) requests horizontal orientation
  const needsHorizontal = chartType === 'horizontalBar' || filteredDatasetsPatched.some((ds: any) => (ds?.chartType || chartType) === 'horizontalBar');
  const baseOptions = {
    ...(chartConfig as any),
    indexAxis: needsHorizontal ? 'y' : ((chartConfig as any)?.indexAxis || 'x'),
    // Explicitly override scales: for circular charts, force empty object to avoid axes
    scales: isCircularType ? {} : (optionsScales ?? {}),
  } as any;
  const appliedOptions = chartType === 'stackedBar'
    ? {
        ...baseOptions,
        scales: {
          x: { ...optionsScales.x, stacked: true },
          y: { ...optionsScales.y, stacked: true },
        },
      }
    : baseOptions;

  // Context menu handlers
  const handleContextMenuClose = () => {
    setContextMenu(prev => ({ ...prev, isOpen: false }))
  }

  const handleContextMenuDelete = (id: string) => {
    if (contextMenu.type === 'image') {
      removeOverlayImage(id)
    } else {
      removeOverlayText(id)
    }
    setSelectedImageId(null)
  }

  const handleContextMenuHide = (id: string) => {
    if (contextMenu.type === 'image') {
      updateOverlayImage(id, { visible: !contextMenu.data.visible })
    } else {
      updateOverlayText(id, { visible: !contextMenu.data.visible })
    }
  }

  const handleContextMenuUnselect = () => {
    setSelectedImageId(null)
    setSelectedTextId(null)
  }

  return (
    <div className="p-0 h-full w-full">
      {chartData.datasets.length > 0 ? (
        <div className="h-full w-full flex items-start justify-center relative" style={(!isMobile && isResponsive) ? { minHeight: 300, minWidth: 400, height: '100%', width: '100%' } : { height: '100%', width: '100%' }}>
          {getBackgroundLayers()}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              height: '100%',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: '100%',
              maxHeight: '100%',
            }}
            onMouseLeave={() => setHoveredDatasetIndex(null)}
          >
            {chartConfig.dynamicDimension ? (
              <ResizableChartArea>
                <Chart
                  key={`${chartType}-${chartWidth}-${chartHeight}-${isResponsive}-${chartConfig.manualDimensions}`}
                  ref={chartRef}
                  type={chartTypeForChart as any}
                  data={chartDataForChart}
                  {...((chartConfig.manualDimensions || chartConfig.dynamicDimension) && {
                    'data-debug-width': chartConfig.width,
                    'data-debug-height': chartConfig.height
                  })}
                  options={{
                    ...appliedOptions,
                    responsive: chartConfig.manualDimensions ? false : isResponsive,
                    maintainAspectRatio: !(isResponsive),
                    overlayImages,
                    overlayTexts,
                    layout: {
                      padding: chartConfig.layout?.padding || 0
                    },
                    hover: {
                      intersect: chartConfig.hover?.intersect ?? false,
                      animationDuration: chartConfig.hover?.animationDuration ?? 400,
                    },
                    interaction: {
                      intersect: chartConfig.interaction?.intersect ?? true,
                      mode: chartConfig.interaction?.mode ?? 'point',
                    },
                    onHover: (event: any, elements: any[]) => {
                      if (!chartConfig.interaction?.mode) {
                        setHoveredDatasetIndex(null);
                        return;
                      }
                      if (chartMode === 'grouped' && elements && elements.length > 0) {
                        setHoveredDatasetIndex(elements[0].datasetIndex);
                      } else {
                        setHoveredDatasetIndex(null);
                      }
                    },
                    plugins: ({
                      ...chartConfig.plugins,
                      customLabels: { shapeSize: 32, labels: customLabels },
                      overlayPlugin: {
                        overlayImages,
                        overlayTexts,
                        selectedImageId
                      },
                      legend: {
                        ...((chartConfig.plugins as any)?.legend),
                        labels: {
                          ...(((chartConfig.plugins as any)?.legend)?.labels || {}),
                          generateLabels: (chart: any) => {
                            const legendType = ((chartConfig.plugins as any)?.legendType) || 'slice';
                            const usePointStyle = (chartConfig.plugins?.legend as any)?.labels?.usePointStyle || false;
                            const pointStyle = (chartConfig.plugins?.legend as any)?.labels?.pointStyle || 'circle';
                            const fontColor = (chartConfig.plugins?.legend?.labels as any)?.color || '#000000';

                            const createItem = (props: any) => ({
                              ...props,
                              pointStyle: usePointStyle ? pointStyle : undefined,
                              fontColor: fontColor
                            });

                            const items = [] as any[];
                            if (legendType === 'slice' || legendType === 'both') {
                              for (let i = 0; i < filteredLabels.length; ++i) {
                                items.push(createItem({
                                  text: String(filteredLabels[i]),
                                  fillStyle: filteredDatasets[0]?.backgroundColor?.[i] || '#ccc',
                                  strokeStyle: filteredDatasets[0]?.borderColor?.[i] || '#333',
                                  hidden: false,
                                  index: i,
                                  datasetIndex: 0,
                                  type: 'slice',
                                }));
                              }
                            }
                            if (legendType === 'dataset' || legendType === 'both') {
                              for (let i = 0; i < filteredDatasets.length; ++i) {
                                items.push(createItem({
                                  text: filteredDatasets[i].label || `Dataset ${i + 1}`,
                                  fillStyle: Array.isArray(filteredDatasets[i].backgroundColor) ? (filteredDatasets[i].backgroundColor as string[])[0] : (filteredDatasets[i].backgroundColor as string) || '#ccc',
                                  strokeStyle: Array.isArray(filteredDatasets[i].borderColor) ? (filteredDatasets[i].borderColor as string[])[0] : (filteredDatasets[i].borderColor as string) || '#333',
                                  hidden: false,
                                  datasetIndex: i,
                                  index: i,
                                  type: 'dataset',
                                }));
                              }
                            }
                            return items;
                          },
                        },
                      },
                      tooltip: {
                        ...((chartConfig.plugins as any)?.tooltip),
                        callbacks: {
                          ...((chartConfig.plugins as any)?.tooltip?.callbacks),
                          label: function(context: any) {
                            const mode = (chartConfig.plugins as any)?.tooltip?.customDisplayMode || 'slice';
                            const chart = context.chart;
                            const data = chart.data;
                            const datasetIndex = context.datasetIndex;
                            const dataIndex = context.dataIndex;
                            const dataset = data.datasets[datasetIndex];
                            const label = data.labels?.[dataIndex];
                            const value = dataset.data[dataIndex];
                            const datasetLabel = dataset.label || `Dataset ${datasetIndex + 1}`;
                            const datasetColor = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[dataIndex] : dataset.backgroundColor;
                            
                            if (mode === 'slice') {
                              return `${label}: ${value}`;
                            }
                            if (mode === 'dataset') {
                              let lines = [`%c${datasetLabel}`, ...dataset.data.map((v: any, i: number) => {
                                const sliceLabel = data.labels?.[i] || `Slice ${i + 1}`;
                                const sliceColor = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[i] : dataset.backgroundColor;
                                return `%c${sliceLabel}: ${v}`;
                              })];
                              return lines;
                            }
                            if (mode === 'xaxis') {
                              let lines = [`${label}`];
                              data.datasets.forEach((ds: any, i: number) => {
                                const dsLabel = ds.label || `Dataset ${i + 1}`;
                                const dsColor = Array.isArray(ds.backgroundColor) ? ds.backgroundColor[dataIndex] : ds.backgroundColor;
                                lines.push(`${dsLabel}: ${ds.data[dataIndex]}`);
                              });
                              return lines;
                            }
                            if (mode === 'yaxis') {
                              let lines: string[] = [];
                              data.datasets.forEach((ds: any, i: number) => {
                                ds.data.forEach((v: any, j: number) => {
                                  if (v === value) {
                                    const dsLabel = ds.label || `Dataset ${i + 1}`;
                                    const sliceLabel = data.labels?.[j] || `Slice ${j + 1}`;
                                    lines.push(`${dsLabel} - ${sliceLabel}: ${v}`);
                                  }
                                });
                              });
                              return lines.length ? lines : [`${label}: ${value}`];
                            }
                            return `${label}: ${value}`;
                          }
                        }
                      },
                    } as any),
                  }}
                  width={((chartConfig.manualDimensions || chartConfig.dynamicDimension) ? chartWidth : undefined)}
                  height={((chartConfig.manualDimensions || chartConfig.dynamicDimension) ? chartHeight : undefined)}
                />
              </ResizableChartArea>
            ) : (
              <Chart
                key={`${chartType}-${chartWidth}-${chartHeight}-${isResponsive}-${chartConfig.manualDimensions}`}
                ref={chartRef}
                type={chartTypeForChart as any}
                data={chartDataForChart}
                {...((chartConfig.manualDimensions || chartConfig.dynamicDimension) && {
                  'data-debug-width': chartConfig.width,
                  'data-debug-height': chartConfig.height
                })}
                options={{
                  ...appliedOptions,
                  responsive: chartConfig.manualDimensions ? false : isResponsive,
                  maintainAspectRatio: !(isResponsive),
                  overlayImages,
                  overlayTexts,
                  layout: {
                    padding: chartConfig.layout?.padding || 0
                  },
                  hover: {
                    intersect: chartConfig.hover?.intersect ?? false,
                    animationDuration: chartConfig.hover?.animationDuration ?? 400,
                  },
                  interaction: {
                    intersect: chartConfig.interaction?.intersect ?? true,
                    mode: chartConfig.interaction?.mode ?? 'point',
                  },
                  onHover: (event: any, elements: any[]) => {
                    if (!chartConfig.interaction?.mode) {
                      setHoveredDatasetIndex(null);
                      return;
                    }
                    if (chartMode === 'grouped' && elements && elements.length > 0) {
                      setHoveredDatasetIndex(elements[0].datasetIndex);
                    } else {
                      setHoveredDatasetIndex(null);
                    }
                  },
                  plugins: ({
                    ...chartConfig.plugins,
                    customLabels: { shapeSize: 32, labels: customLabels },
                    overlayPlugin: {
                      overlayImages,
                      overlayTexts,
                      selectedImageId,
                      selectedTextId
                    },
                    legend: {
                      ...((chartConfig.plugins as any)?.legend),
                      labels: {
                        ...(((chartConfig.plugins as any)?.legend)?.labels || {}),
                      },
                    },
                    tooltip: {
                      ...((chartConfig.plugins as any)?.tooltip),
                      callbacks: {
                        ...((chartConfig.plugins as any)?.tooltip?.callbacks),
                        label: function(context: any) {
                          const mode = (chartConfig.plugins as any)?.tooltip?.customDisplayMode || 'slice';
                          const chart = context.chart;
                          const data = chart.data;
                          const datasetIndex = context.datasetIndex;
                          const dataIndex = context.dataIndex;
                          const dataset = data.datasets[datasetIndex];
                          const label = data.labels?.[dataIndex];
                          const value = dataset.data[dataIndex];
                          const datasetLabel = dataset.label || `Dataset ${datasetIndex + 1}`;
                          const datasetColor = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[dataIndex] : dataset.backgroundColor;
                          
                          if (mode === 'slice') {
                            return `${label}: ${value}`;
                          }
                          if (mode === 'dataset') {
                            let lines = [`%c${datasetLabel}`, ...dataset.data.map((v: any, i: number) => {
                              const sliceLabel = data.labels?.[i] || `Slice ${i + 1}`;
                              const sliceColor = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[i] : dataset.backgroundColor;
                              return `%c${sliceLabel}: ${v}`;
                            })];
                            return lines;
                          }
                          if (mode === 'xaxis') {
                            let lines = [`${label}`];
                            data.datasets.forEach((ds: any, i: number) => {
                              const dsLabel = ds.label || `Dataset ${i + 1}`;
                              const dsColor = Array.isArray(ds.backgroundColor) ? ds.backgroundColor[dataIndex] : ds.backgroundColor;
                              lines.push(`${dsLabel}: ${ds.data[dataIndex]}`);
                            });
                            return lines;
                          }
                          if (mode === 'yaxis') {
                            let lines: string[] = [];
                            data.datasets.forEach((ds: any, i: number) => {
                              ds.data.forEach((v: any, j: number) => {
                                if (v === value) {
                                  const dsLabel = ds.label || `Dataset ${i + 1}`;
                                  const sliceLabel = data.labels?.[j] || `Slice ${j + 1}`;
                                  lines.push(`${dsLabel} - ${sliceLabel}: ${v}`);
                                }
                              });
                            });
                            return lines.length ? lines : [`${label}: ${value}`];
                          }
                          return `${label}: ${value}`;
                        }
                      }
                    },
                  } as any),
                }}
                width={((chartConfig.manualDimensions || chartConfig.dynamicDimension) ? chartWidth : undefined)}
                height={((chartConfig.manualDimensions || chartConfig.dynamicDimension) ? chartHeight : undefined)}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full w-full text-gray-400">
          No chart data available.
        </div>
      )}
      
      {/* Context Menu */}
      <OverlayContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        type={contextMenu.type}
        id={contextMenu.id}
        data={contextMenu.data}
        onClose={handleContextMenuClose}
        onDelete={handleContextMenuDelete}
        onHide={handleContextMenuHide}
        onUnselect={handleContextMenuUnselect}
      />
    </div>
  );
}

export default ChartGenerator;