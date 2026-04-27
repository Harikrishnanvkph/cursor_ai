"use client"

// Chart Generator - Self-contained Chart Rendering Component
// This file contains the chart rendering component with all necessary imports

import React from "react"
import { createPortal } from "react-dom"
import { useRef, useEffect, useState, memo } from "react"
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
  SubTitle,
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
import { useChartStore } from "@/lib/chart-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { useUIStore } from "@/lib/stores/ui-store"
import { universalImagePlugin } from "@/lib/plugins/universal-image-plugin"
import { useTemplateStore } from "@/lib/template-store"
import exportPlugin from "@/lib/export-plugin"
import { customLabelPlugin } from "@/lib/custom-label-plugin"
import { enhancedTitlePlugin } from "@/lib/enhanced-title-plugin"
import { watermarkPlugin } from "@/lib/plugins/watermark-plugin"
import { pie3dPlugin } from "@/lib/plugins/3d-pie-plugin"
import { bar3dPlugin } from "@/lib/plugins/3d-bar-plugin"
import { slicePatternPlugin } from "@/lib/plugins/slice-pattern-plugin"
import { ResizableChartArea } from "@/components/resizable-chart-area"

import { parseDimension } from "@/lib/utils/dimension-utils"
import { darkenColor, getHexFromColor } from "@/lib/utils/color-utils"
// Date adapter for time scales - auto-registers with Chart.js
import 'chartjs-adapter-date-fns'

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
  SubTitle,
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
  enhancedTitlePlugin,
  pie3dPlugin,
  bar3dPlugin,
  slicePatternPlugin
);

// Plugin registration verified

interface SliceColorPickerPopoverProps {
  isOpen: boolean;
  x: number;
  y: number;
  currentColor: string;
  currentBorderColor: string;
  currentValue: number | string;
  onClose: () => void;
  onColorChange: (color: string) => void;
  onBorderColorChange: (color: string) => void;
  onValueChange: (value: string) => void;
}

const SliceColorPickerPopover = ({ isOpen, x, y, currentColor, currentBorderColor, currentValue, onClose, onColorChange, onBorderColorChange, onValueChange }: SliceColorPickerPopoverProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [localValue, setLocalValue] = useState(currentValue);

  // Sync local state when external value changes (e.g. initial open)
  useEffect(() => {
    setLocalValue(currentValue);
  }, [currentValue]);

  // Use ref to hold latest callback to avoid resetting the timer on parent re-renders
  const onValueChangeRef = useRef(onValueChange);
  useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  // Debounce the value change
  useEffect(() => {
    if (localValue.toString() !== currentValue.toString()) {
      const handler = setTimeout(() => {
        onValueChangeRef.current(localValue.toString());
      }, 700);
      return () => clearTimeout(handler);
    }
  }, [localValue, currentValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuWidth = 140;
  const menuHeight = 44;
  const offsetX = 42; // Center horizontally somewhat
  const offsetY = 10;

  // Default to placing it centered directly above the cursor
  let finalX = x - offsetX;
  let finalY = y - menuHeight - offsetY;

  if (typeof window !== 'undefined') {
    // If it hits the top edge of the screen, fallback to placing it directly below the cursor
    if (finalY < 5) {
      finalY = y + offsetY;
    }

    // Ensure bounds
    finalX = Math.max(5, Math.min(finalX, window.innerWidth - menuWidth - 5));
    finalY = Math.max(5, Math.min(finalY, window.innerHeight - menuHeight - 5));
  }

  const content = (
    <div
      ref={menuRef}
      className="fixed z-[9999] p-1.5 bg-white border border-gray-200 rounded-lg shadow-xl animate-in zoom-in-95 duration-200 flex items-center gap-2"
      style={{ left: `${finalX}px`, top: `${finalY}px` }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="relative" title="Fill Color">
        <button
          className="w-5 h-5 rounded shadow-sm cursor-pointer hover:scale-105 transition-all overflow-hidden bg-cover bg-center p-0 m-0 block"
          style={{
            backgroundColor: currentColor,
            backgroundImage: currentColor.startsWith('rgba') && currentColor.includes(', 0)') ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
            backgroundSize: '5px 5px',
            backgroundPosition: '0 0, 0 2.5px, 2.5px -2.5px, -2.5px 0px'
          }}
          onClick={() => document.getElementById('slice-context-color-popover')?.click()}
        />
        <input
          id="slice-context-color-popover"
          type="color"
          value={getHexFromColor(currentColor)}
          onChange={(e) => onColorChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer pointer-events-none"
        />
      </div>

      <div className="relative" title="Border Color">
        <button
          className="w-5 h-5 rounded shadow-sm cursor-pointer hover:scale-105 transition-all overflow-hidden bg-white p-0 m-0 flex items-center justify-center relative"
          onClick={() => document.getElementById('slice-context-border-color-popover')?.click()}
        >
          <div className="w-full h-full rounded" style={{
            border: `3px solid ${currentBorderColor}`
          }}></div>
        </button>
        <input
          id="slice-context-border-color-popover"
          type="color"
          value={getHexFromColor(currentBorderColor)}
          onChange={(e) => onBorderColorChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer pointer-events-none"
        />
      </div>

      <div className="w-[1px] h-4 bg-gray-200 mx-0.5"></div>

      <div className="flex items-center" title="Slice Value">
        <input
          type="number"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="w-16 h-6 text-xs border border-gray-200 rounded px-1.5 outline-none focus:border-blue-400 font-medium text-gray-700"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onValueChange(localValue.toString());
              onClose();
            }
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );

  if (typeof window !== 'undefined') {
    return createPortal(content, document.body);
  }
  return null;
};

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

import {
  useChartConfig,
  useChartData,
  useChartType,
  useLegendFilter,
  useFillArea,
  useShowBorder,
  useShowImages,
  useChartMode,
  useActiveDatasetIndex,
  useUniformityMode,
  useActiveGroupId,
  useChartGroups,
} from "@/lib/hooks/use-chart-state"

export interface ChartGeneratorProps {
  className?: string;
}

export const ChartGenerator = memo(function ChartGenerator({ className = "" }: ChartGeneratorProps) {
  // Granular hooks to prevent unnecessary re-renders
  const chartConfig = useChartConfig();
  const chartData = useChartData();
  const chartType = useChartType();
  const legendFilter = useLegendFilter();
  const fillArea = useFillArea();
  const showBorder = useShowBorder();
  const showImages = useShowImages();
  const chartMode = useChartMode();
  const activeDatasetIndex = useActiveDatasetIndex();
  const uniformityMode = useUniformityMode();
  const activeGroupId = useActiveGroupId();
  const groups = useChartGroups();


  // When rendered inside a template or format, force responsive mode
  // so the chart always fills its container zone regardless of its own fixed dimensions.
  const editorMode = useTemplateStore(s => s.editorMode);
  const isInsideTemplateOrFormat = editorMode === 'template';



  // Actions are stable and don't cause re-renders, but good practice to select them or use getState if appropriate
  // However, using the hook ensures we get the bound functions
  const {

    updateGroup,
    updateDataset
  } = useChartActions();


  const setGlobalChartRef = useChartStore(s => s.setGlobalChartRef);

  const chartRef = useRef<ChartJS>(null);
  const [hoveredDatasetIndex, setHoveredDatasetIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Refs for stable event listener callbacks — prevents the event listener
  // useEffect from re-running on every render when action functions change
  const actionsRef = useRef({ updateDataset });

  const stateRef = useRef({ chartData });

  // Zustand hydration gate:
  // Prevents the chart from rendering until the chart store has finished hydrating
  // from localStorage. Without this, the component renders first with empty/default
  // state, then re-renders with hydrated data — causing a visible double-load flicker.
  const [storeHydrated, setStoreHydrated] = useState(false);
  const initialRenderRef = useRef(true);
  useEffect(() => {
    // Check if already hydrated (can happen if persist completes synchronously)
    const alreadyHydrated = (useChartStore.persist as any)?.hasHydrated?.();
    if (alreadyHydrated) {
      setStoreHydrated(true);
      return;
    }

    // Listen for hydration completion
    const unsub = (useChartStore.persist as any)?.onFinishHydration?.(() => {
      setStoreHydrated(true);
    });

    // Fallback: if the persist API methods are unavailable, hydrate after a brief delay
    const fallbackTimer = setTimeout(() => {
      if (!storeHydrated) setStoreHydrated(true);
    }, 150);

    return () => {
      unsub?.();
      clearTimeout(fallbackTimer);
    };
  }, []);



  // Slice specific context menu
  const [sliceContextMenu, setSliceContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    datasetIndex: number;
    sliceIndex: number;
    currentColor: string;
    currentBorderColor: string;
    currentValue: number | string;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    datasetIndex: 0,
    sliceIndex: 0,
    currentColor: '#3b82f6',
    currentBorderColor: '#1d4ed8',
    currentValue: 0
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

  // Keep refs in sync with latest values (runs every render but does no real work)
  useEffect(() => {
    actionsRef.current = { updateDataset } as any;

    stateRef.current = { chartData } as any;
  });

  // Register chart ref globally
  useEffect(() => {
    setGlobalChartRef(chartRef);
  }, [setGlobalChartRef]);




  // Get enabled datasets (respect single/grouped mode and legendFilter)
  const enabledDatasets = chartMode === 'single'
    ? chartData.datasets.filter((_, i) => i === activeDatasetIndex)
    : chartData.datasets
      .map((ds, i) => (legendFilter.datasets[i] === false ? null : ds))
      .filter((ds): ds is typeof chartData.datasets[number] => ds !== null);

  // Filter datasets based on mode and active group
  const modeFilteredDatasets = enabledDatasets.filter(dataset => {
    if (dataset.mode) {
      if (dataset.mode !== chartMode) return false;

      // For grouped mode, also filter by active group
      if (chartMode === 'grouped' && dataset.groupId !== activeGroupId) {
        return false;
      }
      return true;
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

  // For both single and grouped modes, check for sliceLabels in datasets first
  if (modeFilteredDatasets.length > 0) {
    // Check if any dataset has sliceLabels (prioritize the first one found)
    const datasetWithSliceLabels = modeFilteredDatasets.find(ds =>
      ds.sliceLabels && Array.isArray(ds.sliceLabels)
    );

    if (datasetWithSliceLabels) {
      filteredLabels = enabledSliceIndices.map(idx => String(datasetWithSliceLabels.sliceLabels![idx]));
    } else if (Array.isArray(chartData.labels)) {
      filteredLabels = enabledSliceIndices.map(idx => String(chartData.labels![idx]));
    }
  } else if (Array.isArray(chartData.labels)) {
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
      // 3D pie/doughnut types still behave like pie/doughnut for fill
      if (chartType === 'pie3d' || chartType === 'doughnut3d') {
        // No fill changes needed for pie-based types
      }
    } else {
      // When fillArea is true, ensure area charts have a fill value
      // Only default to 'origin' if fill is not already set to a valid value
      if (chartType === 'area' && (processedDs.fill === undefined || processedDs.fill === false)) {
        processedDs.fill = 'origin';
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
    // In single mode, use global chartType; in grouped mixed mode, use dataset-specific type
    const datasetType = (chartMode === 'single' || uniformityMode === 'uniform')
      ? chartType
      : (ds.chartType || chartType || 'bar');
    const validType = datasetType === 'stackedBar' || datasetType === 'horizontalBar' || datasetType === 'horizontalBar3d' ? 'bar' :
      (datasetType === 'area' ? 'line' :
        (datasetType === 'pie3d' ? 'pie' :
          (datasetType === 'doughnut3d' ? 'doughnut' :
            (datasetType === 'bar3d' ? 'bar' : datasetType))));

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
  const globalCustomLabelsConfig = ((chartConfig.plugins as any)?.customLabelsConfig) || {};

  // Helper function to format numbers based on customLabelsConfig
  const formatLabelValue = (rawValue: any, config: any): string => {
    let numValue: number | null = null;

    // Extract numeric value
    if (typeof rawValue === 'number') {
      numValue = rawValue;
    } else if (rawValue && typeof rawValue === 'object' && 'y' in rawValue && typeof rawValue.y === 'number') {
      numValue = rawValue.y;
    } else {
      return String(rawValue);
    }

    // Apply decimal places
    const decimals = config.decimals ?? 0;
    let formatted = numValue.toFixed(decimals);

    // Apply thousands separator
    const thousandsSep = config.thousandsSeparator ?? ',';
    const decimalSep = config.decimalSeparator ?? '.';

    if (thousandsSep) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
      formatted = parts.join(decimalSep !== '.' ? decimalSep : '.');
    } else if (decimalSep !== '.') {
      formatted = formatted.replace('.', decimalSep);
    }

    // Apply abbreviation for large numbers
    if (config.abbreviateLargeNumbers && Math.abs(numValue) >= 1000) {
      const absVal = Math.abs(numValue);
      let abbrev = '';
      let divisor = 1;

      if (absVal >= 1e12) { abbrev = 'T'; divisor = 1e12; }
      else if (absVal >= 1e9) { abbrev = 'B'; divisor = 1e9; }
      else if (absVal >= 1e6) { abbrev = 'M'; divisor = 1e6; }
      else if (absVal >= 1e3) { abbrev = 'K'; divisor = 1e3; }

      formatted = (numValue / divisor).toFixed(decimals > 0 ? Math.min(decimals, 2) : 1) + abbrev;
    }

    // Apply number format
    const numberFormat = config.numberFormat || 'default';
    switch (numberFormat) {
      case 'currency':
        const currencySymbol = config.currencySymbol || '$';
        formatted = currencySymbol + formatted;
        break;
      case 'percent':
        formatted = formatted + '%';
        break;
      case 'scientific':
        formatted = numValue.toExponential(decimals);
        break;
      case 'compact':
        if (!config.abbreviateLargeNumbers) {
          const absVal = Math.abs(numValue);
          if (absVal >= 1e9) formatted = (numValue / 1e9).toFixed(1) + 'B';
          else if (absVal >= 1e6) formatted = (numValue / 1e6).toFixed(1) + 'M';
          else if (absVal >= 1e3) formatted = (numValue / 1e3).toFixed(1) + 'K';
        }
        break;
    }

    // Apply plus/minus signs
    if (numValue > 0 && config.showPlusSign) {
      formatted = '+' + formatted;
    }
    if (numValue < 0 && config.showNegativeSign !== false) {
      // Already has minus, but ensure it's there
    }

    return formatted;
  };

  // Apply custom formatter function if provided
  const applyCustomFormatter = (text: string, value: any, config: any): string => {
    if (config.customFormatter && typeof config.customFormatter === 'string' && config.customFormatter.trim()) {
      try {
        // Create a safe function from the string
        const formatterFn = new Function('value', 'text', `
          try {
            ${config.customFormatter}
            return text;
          } catch(e) {
            return text;
          }
        `);
        const result = formatterFn(value, text);
        if (typeof result === 'string') return result;
      } catch (e) {
        console.warn('Custom formatter error:', e);
      }
    }
    return text;
  };

  // Apply conditional formatting if provided
  const applyConditionalFormatting = (text: string, value: any, config: any): {
    text: string;
    color?: string;
    fontSize?: number;
    fontWeight?: string;
    backgroundColor?: string;
    borderColor?: string;
  } => {
    if (config.conditionalFormatting && typeof config.conditionalFormatting === 'string' && config.conditionalFormatting.trim()) {
      try {
        const condFn = new Function('value', 'text', `
          try {
            ${config.conditionalFormatting}
            return { text: text };
          } catch(e) {
            return { text: text };
          }
        `);
        const result = condFn(typeof value === 'number' ? value : (value?.y ?? 0), text);
        if (result && typeof result === 'object') {
          return {
            text: result.text || text,
            color: result.color,
            fontSize: result.fontSize,
            fontWeight: result.fontWeight,
            backgroundColor: result.backgroundColor,
            borderColor: result.borderColor
          };
        }
        if (typeof result === 'string') {
          return { text: result };
        }
      } catch (e) {
        console.warn('Conditional formatting error:', e);
      }
    }
    return { text };
  };

  const customLabels = filteredDatasetsPatched.map((ds, datasetIdx) => {
    let baseConfig = { ...globalCustomLabelsConfig, ...(ds.customLabelsConfig || {}) };
    return ds.data.map((value, filteredPointIdx) => {
      // Map filtered index back to original index
      const originalPointIdx = enabledSliceIndices[filteredPointIdx];

      // Merge per-slice label overrides if they exist (highest priority)
      const sliceOverride = ds.sliceLabelOverrides?.[originalPointIdx];
      const customLabelsConfig = sliceOverride
        ? { ...baseConfig, ...sliceOverride }
        : baseConfig;

      // If this slice is hidden by legend, also hide its label
      if (originalPointIdx === undefined || !isSliceVisible(originalPointIdx)) {
        return { text: '' };
      }
      if (customLabelsConfig.display === false) return { text: '' };

      let text = '';

      if (customLabelsConfig.labelContent === 'label') {
        // For both single and grouped modes, use sliceLabels from the dataset if available
        const originalDs = modeFilteredDatasets[datasetIdx];
        if (originalDs?.sliceLabels && Array.isArray(originalDs.sliceLabels)) {
          text = String(originalDs.sliceLabels[originalPointIdx] ?? value);
        } else {
          text = String(chartData.labels?.[originalPointIdx] ?? value);
        }
      } else if (customLabelsConfig.labelContent === 'percentage') {
        const total = ds.data.reduce((a: number, b: any) => {
          if (typeof b === 'number') return a + b;
          if (b && typeof b === 'object' && 'y' in b && typeof b.y === 'number') return a + b.y;
          return a;
        }, 0);
        let val = 0;
        if (typeof value === 'number') val = value;
        else if (value && typeof value === 'object' && 'y' in value && typeof value.y === 'number') val = value.y;
        const pct = (val / total) * 100;
        text = pct.toFixed(customLabelsConfig.decimals ?? 1) + '%';
      } else if (customLabelsConfig.labelContent === 'index') {
        text = String(originalPointIdx + 1);
      } else if (customLabelsConfig.labelContent === 'dataset') {
        text = ds.label ?? String(value);
      } else {
        // Default: format the value
        text = formatLabelValue(value, customLabelsConfig);
      }

      // Apply custom formatter
      text = applyCustomFormatter(text, value, customLabelsConfig);

      // Apply conditional formatting
      const condResult = applyConditionalFormatting(text, value, customLabelsConfig);
      text = condResult.text;
      const conditionalColor = condResult.color;
      const conditionalFontSize = condResult.fontSize;
      const conditionalFontWeight = condResult.fontWeight;
      const conditionalBgColor = condResult.backgroundColor;
      const conditionalBorderColor = condResult.borderColor;

      // Apply prefix and suffix
      if (customLabelsConfig.prefix) text = customLabelsConfig.prefix + text;
      if (customLabelsConfig.suffix) text = text + customLabelsConfig.suffix;

      // Build dynamic font string with conditional overrides
      const fontSize = conditionalFontSize || customLabelsConfig.fontSize || 14;
      const fontWeight = conditionalFontWeight || customLabelsConfig.fontWeight || 'bold';
      const fontFamily = customLabelsConfig.fontFamily || 'Arial';

      let color = conditionalColor || customLabelsConfig.color || '#222';
      let backgroundColor = conditionalBgColor || (customLabelsConfig.shape === 'none' ? undefined : (customLabelsConfig.backgroundColor || '#fff'));
      let borderColor = conditionalBorderColor || (customLabelsConfig.shape === 'none' ? undefined : (customLabelsConfig.borderColor || '#333'));

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
        font: `${fontWeight} ${fontSize}px ${fontFamily}`,
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
  });

  // Determine chart type for Chart.js
  let chartTypeForChart = chartType === 'area' ? 'line' :
    (chartType === 'stackedBar' ? 'bar' :
      (chartType === 'horizontalBar' ? 'bar' :
        (chartType === 'pie3d' ? 'pie' :
          (chartType === 'doughnut3d' ? 'doughnut' :
            (chartType === 'bar3d' ? 'bar' :
              (chartType === 'horizontalBar3d' ? 'bar' : chartType))))));

  // In single mode, ALWAYS use the global chart type (user expects to change the whole chart)
  // In grouped mode with uniform, also use global chart type
  // In grouped mode with mixed, use dataset-specific chart types (handled by patching datasets)
  if (chartMode === 'single') {
    // Single mode: use global chartType (already set above)
    // Do NOT override from dataset's chartType here
  } else {
    // Grouped mode
    if (uniformityMode === 'uniform') {
      chartTypeForChart = chartType === 'area' ? 'line' :
        (chartType === 'stackedBar' ? 'bar' :
          (chartType === 'horizontalBar' ? 'bar' :
            (chartType === 'pie3d' ? 'pie' :
              (chartType === 'doughnut3d' ? 'doughnut' :
                (chartType === 'bar3d' ? 'bar' :
                  (chartType === 'horizontalBar3d' ? 'bar' : chartType))))));
    } else {
      // Mixed mode: the chart type is 'bar' as base, but each dataset has its own type
      chartTypeForChart = 'bar';
    }
  }

  // Build the chart data for Chart.js
  const chartDataForChart = {
    ...chartData,
    labels: filteredLabels,
    datasets: filteredDatasetsPatched,
  };

  // Final safety check to ensure chartTypeForChart is valid after all overrides
  if (chartTypeForChart === 'stackedBar' || chartTypeForChart === 'horizontalBar') {
    chartTypeForChart = 'bar';
  } else if (chartTypeForChart === 'area') {
    chartTypeForChart = 'line';
  } else if (chartTypeForChart === 'pie3d') {
    chartTypeForChart = 'pie';
  } else if (chartTypeForChart === 'doughnut3d') {
    chartTypeForChart = 'doughnut';
  } else if (chartTypeForChart === 'bar3d' || chartTypeForChart === 'horizontalBar3d') {
    chartTypeForChart = 'bar';
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
            filter: background.blur ? `blur(${background.blur}px)` : 'none',
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
  // When inside a template or format, always force responsive — the chart zone container
  // already defines the correct size. Fixed dimensions must not overflow the zone.
  const isResponsive = isInsideTemplateOrFormat || (chartConfig as any)?.responsive !== false;

  // parseDimension imported from @/lib/utils/dimension-utils
  // Dimensions are irrelevant (always undefined) inside template/format since isResponsive is forced true
  const chartWidth = !isResponsive ? parseDimension((chartConfig as any)?.width) : undefined;
  const chartHeight = !isResponsive ? parseDimension((chartConfig as any)?.height) : undefined;

  // Compute tooltip background color with opacity
  const tooltipBgColor = (chartConfig.plugins as any)?.tooltip?.backgroundColor || '#000000';
  const tooltipBgOpacity = ((chartConfig as any)?.plugins?.tooltip?.backgroundOpacity ?? 80) / 100;
  const tooltipBackgroundWithOpacity = fadeColor(tooltipBgColor, tooltipBgOpacity);

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
  // But radar and polarArea DO need radial scales (r scale)
  const isCircularType = (chartTypeForChart === 'pie' || chartTypeForChart === 'doughnut' || chartTypeForChart === 'radar' || chartTypeForChart === 'polarArea');
  const isRadialType = (chartTypeForChart === 'radar' || chartTypeForChart === 'polarArea');
  const optionsScales = isCircularType ? undefined : ({
    x: { ...(safeScales?.x || {}) },
    y: { ...(safeScales?.y || {}) },
  } as any);
  // For radial chart types (radar, polarArea), extract ONLY the 'r' scale
  // This prevents leftover x/y scales from Cartesian charts from appearing
  const radialOnlyScales = isRadialType && safeScales?.r ? { r: safeScales.r } : {};
  // Determine if any dataset (or the chart) requests horizontal orientation
  const needsHorizontal = chartType === 'horizontalBar' || chartType === 'horizontalBar3d' ||
    filteredDatasetsPatched.some((ds: any) =>
      (ds?.chartType || chartType) === 'horizontalBar' ||
      (ds?.chartType || chartType) === 'horizontalBar3d'
    );
  const baseOptions = {
    ...(chartConfig as any),
    indexAxis: needsHorizontal ? 'y' : ((chartConfig as any)?.indexAxis || 'x'),
    // Explicitly override scales: for pie/doughnut, force empty object to avoid axes
    // For radar/polarArea, use ONLY the r scale configuration (not x/y from previous chart types)
    scales: isRadialType ? radialOnlyScales : (isCircularType ? {} : (optionsScales ?? {})),
  } as any;
  let appliedOptions = baseOptions;

  // Suppress animations during initial render to prevent flickering on page load/navigation.
  // After hydration, Chart.js's first render should appear instantly without animation.
  // We track that the very first render with data has happened, then enable animations.
  if (!storeHydrated || initialRenderRef.current) {
    if (storeHydrated && modeFilteredDatasets.length > 0) {
      // Store is hydrated and we have data — this is the first real render.
      // Allow it through with no animation, then mark initial render done.
      initialRenderRef.current = false;
    }
    appliedOptions = {
      ...appliedOptions,
      animation: false,
      transitions: {
        active: { animation: { duration: 0 } }
      }
    };
  }

  if (chartType === 'stackedBar') {
    appliedOptions = {
      ...baseOptions,
      scales: {
        x: { ...(optionsScales?.x || {}), stacked: true },
        y: { ...(optionsScales?.y || {}), stacked: true },
      },
    };
  } else if (!isCircularType && !isRadialType) {
    // For other Cartesian charts, explicit stacked: false
    appliedOptions = {
      ...baseOptions,
      scales: {
        x: { ...(optionsScales?.x || {}), stacked: false },
        y: { ...(optionsScales?.y || {}), stacked: false },
      },
    };
  }

  // HELPER: Recursively parse stringified functions in the options
  const parseCallbacks = (obj: any): any => {
    if (!obj) return obj;
    if (typeof obj === 'string') {
      // Check if string looks like a function definition
      const trimmed = obj.trim();
      if (trimmed.startsWith('function') || trimmed.startsWith('(') || trimmed.includes('=>')) {
        try {
          // Identify if it's a function declaration or expression
          // Basic handling for "function(val) { ... }" pattern which is common from AI
          if (trimmed.startsWith('function')) {
            // Convert "function(x) { return x; }" to actual function
            // We use new Function(return <code_as_expression>)() approach 
            // OR specifically wrap it to evaluate.
            // But "new Function(obj)" won't work directly if obj is "function() {}". 
            // It needs to be "return " + obj if we want to get the function reference back.

            // Safety: Using new Function is risky with untrusted input, 
            // but necessary for this feature allowing AI/User inserted JS callbacks.
            return new Function('return ' + trimmed)();
          }
        } catch (e) {
          console.warn('Failed to parse callback string:', trimmed, e);
          return obj; // Return original string if parsing fails
        }
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => parseCallbacks(item));
    }

    if (typeof obj === 'object') {
      const newObj: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          newObj[key] = parseCallbacks(obj[key]);
        }
      }
      return newObj;
    }

    return obj;
  };

  // Apply the parsing to the options
  appliedOptions = parseCallbacks(appliedOptions);

  // Context menu handlers
  const handleNativeContextMenu = (event: MouseEvent) => {

    if (!chartRef.current) return;

    let elements = chartRef.current.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);

    if (!elements || elements.length === 0) {
      elements = chartRef.current.getElementsAtEventForMode(event, 'point', { intersect: true }, false);
    }
    if (!elements || elements.length === 0) {
      // In some chart types (Pie/Doughnut), complex arc math or 3D plugins can make 
      // the immediate contextmenu event coordinates fail intersection tests. 
      // However, hovering reliably populates ChartJS's active elements array right before click.
      const active = chartRef.current.getActiveElements();
      if (active && active.length > 0) {
        elements = active;
      }
    }

    if (elements && elements.length > 0) {
      event.preventDefault();
      event.stopPropagation();

      const element = elements[0];
      const dataset = stateRef.current.chartData.datasets[element.datasetIndex];

      let currentColor = '#3b82f6';
      if (dataset && Array.isArray(dataset.backgroundColor) && dataset.backgroundColor[element.index]) {
        currentColor = dataset.backgroundColor[element.index];
      } else if (dataset && dataset.backgroundColor && typeof dataset.backgroundColor === 'string') {
        currentColor = dataset.backgroundColor;
      }

      let currentBorderColor = '#1d4ed8';
      if (dataset && Array.isArray(dataset.borderColor) && dataset.borderColor[element.index]) {
        currentBorderColor = dataset.borderColor[element.index];
      } else if (dataset && dataset.borderColor && typeof dataset.borderColor === 'string') {
        currentBorderColor = dataset.borderColor;
      }

      let sliceValue = dataset.data ? dataset.data[element.index] : 0;
      if (sliceValue !== null && typeof sliceValue === 'object' && 'y' in sliceValue) {
        sliceValue = sliceValue.y;
      }

      setSliceContextMenu({
        isOpen: true,
        x: event.clientX,
        y: event.clientY,
        datasetIndex: element.datasetIndex,
        sliceIndex: element.index,
        currentColor,
        currentBorderColor,
        currentValue: sliceValue ?? 0
      });
    }
  };



  // Function to load sample data based on current mode
  const loadSampleGroupedData = () => {
    // Set editor mode to chart when loading sample data
    useTemplateStore.getState().setEditorMode('chart');

    // Use the active group ID for the sample data
    const targetGroupId = activeGroupId;

    // Sample labels for grouped data
    const sampleLabels = ['January', 'February', 'March', 'April', 'May', 'June'];

    // Sample datasets to add to the active group
    const sampleDatasets = [
      {
        label: 'Dataset A',
        data: [15, 25, 18, 30, 22, 28],
        backgroundColor: 'rgba(59, 130, 246, 0.8)', // Blue
        borderColor: 'rgba(29, 78, 216, 1)',
        borderWidth: 2,
        tension: 0.3,
        pointImages: [null, null, null, null, null, null],
        pointImageConfig: [
          { type: 'circle', size: 20, position: 'center', arrow: false, borderWidth: 3, borderColor: '#ffffff' },
          { type: 'circle', size: 20, position: 'center', arrow: false, borderWidth: 3, borderColor: '#ffffff' },
          { type: 'circle', size: 20, position: 'center', arrow: false, borderWidth: 3, borderColor: '#ffffff' },
          { type: 'circle', size: 20, position: 'center', arrow: false, borderWidth: 3, borderColor: '#ffffff' },
          { type: 'circle', size: 20, position: 'center', arrow: false, borderWidth: 3, borderColor: '#ffffff' },
          { type: 'circle', size: 20, position: 'center', arrow: false, borderWidth: 3, borderColor: '#ffffff' },
        ],
        mode: 'grouped' as const,
        groupId: targetGroupId,
        sliceLabels: sampleLabels,
        chartType: 'bar' as const,
      },
      {
        label: 'Dataset B',
        data: [20, 30, 25, 35, 28, 32],
        backgroundColor: 'rgba(16, 185, 129, 0.8)', // Emerald green
        borderColor: 'rgba(5, 150, 105, 1)',
        borderWidth: 2,
        tension: 0.3,
        pointImages: [null, null, null, null, null, null],
        pointImageConfig: [
          { type: 'circle', size: 20, position: 'center', arrow: false, borderWidth: 3, borderColor: '#ffffff' },
          { type: 'circle', size: 20, position: 'center', arrow: false, borderWidth: 3, borderColor: '#ffffff' },
          { type: 'circle', size: 20, position: 'center', arrow: false, borderWidth: 3, borderColor: '#ffffff' },
          { type: 'circle', size: 20, position: 'center', arrow: false, borderWidth: 3, borderColor: '#ffffff' },
          { type: 'circle', size: 20, position: 'center', arrow: false, borderWidth: 3, borderColor: '#ffffff' },
          { type: 'circle', size: 20, position: 'center', arrow: false, borderWidth: 3, borderColor: '#ffffff' },
        ],
        mode: 'grouped' as const,
        groupId: targetGroupId,
        sliceLabels: sampleLabels,
        chartType: 'bar' as const,
      },
    ];

    // Update labels if the current chart has no labels
    const store = useChartStore.getState();
    if (!store.chartData.labels || store.chartData.labels.length === 0) {
      store.updateLabels(sampleLabels);
    }

    // Add sample datasets directly to the current group by updating store state.
    // We avoid setFullChart because it creates a new temporary group for grouped datasets.
    const mergedLabels = store.chartData.labels && store.chartData.labels.length > 0
      ? store.chartData.labels : sampleLabels;
    const mergedDatasets = [...store.chartData.datasets, ...sampleDatasets];

    // Use Zustand's setState directly to append datasets without group creation side-effects
    useChartStore.setState({
      chartType: 'bar',
      chartData: {
        ...store.chartData,
        labels: mergedLabels,
        datasets: mergedDatasets,
      },
      groupedModeData: {
        ...store.chartData,
        labels: mergedLabels,
        datasets: mergedDatasets,
      },
      hasJSON: true
    });

    // Update the group's category to 'categorical' since we're loading bar charts
    updateGroup(targetGroupId, { category: 'categorical', baseChartType: 'bar' });

    // Mark as having JSON data
    store.setHasJSON(true);
  };

  const loadSampleSingleData = () => {
    // Set editor mode to chart when loading sample data
    useTemplateStore.getState().setEditorMode('chart');

    // Sample single mode data
    const singleData = {
      labels: ['January', 'February', 'March', 'April', 'May', 'June'],
      datasets: [{
        label: 'Sample Dataset',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 2,
        tension: 0.3,
        pointImages: [null, null, null, null, null, null],
        pointImageConfig: [
          { type: 'circle', size: 20, position: 'center', arrow: false, borderWidth: 3, borderColor: '#ffffff' },
          { type: 'circle', size: 20, position: 'center', arrow: false, borderWidth: 3, borderColor: '#ffffff' },
          { type: 'circle', size: 20, position: 'center', arrow: false, borderWidth: 3, borderColor: '#ffffff' },
          { type: 'circle', size: 20, position: 'center', arrow: false, borderWidth: 3, borderColor: '#ffffff' },
          { type: 'circle', size: 20, position: 'center', arrow: false, borderWidth: 3, borderColor: '#ffffff' },
          { type: 'circle', size: 20, position: 'center', arrow: false, borderWidth: 3, borderColor: '#ffffff' },
        ],
        mode: 'single' as const,
        sliceLabels: ['January', 'February', 'March', 'April', 'May', 'June'],
        chartType: 'bar' as const,
      }]
    };

    // Update the chart with single mode sample data
    useChartStore.getState().setFullChart({
      chartType: chartType,
      chartData: singleData,
      chartConfig: chartConfig
    });

    // Mark as having JSON data
    useChartStore.getState().setHasJSON(true);
  };

  // Get chart border styles
  const chartBorderStyles: React.CSSProperties = {};
  if (chartConfig.borderWidth && chartConfig.borderWidth > 0) {
    chartBorderStyles.border = `${chartConfig.borderWidth}px solid ${chartConfig.borderColor || '#000000'}`;
    chartBorderStyles.borderRadius = `${(chartConfig as any).chartBorderRadius || 0}px`;
    chartBorderStyles.boxSizing = 'border-box';
  }

  // Hydration gate: Don't render the chart until the store has finished hydrating.
  // This prevents the visible double-render where the chart first appears empty/default
  // then re-renders with hydrated localStorage data.
  if (!storeHydrated) {
    return (
      <div className="p-0 h-full w-full" />
    );
  }

  return (
    <div className="p-0 h-full w-full">
      {modeFilteredDatasets.length > 0 ? (
        <div
          className={`h-full w-full ${isResponsive ? '' : 'flex items-start justify-center'} relative`}
          style={{
            ...(!isMobile && isResponsive ? { minHeight: 300, minWidth: 400, height: '100%', width: '100%' } : { height: '100%', width: '100%' }),
            ...chartBorderStyles
          }}
        >
          {getBackgroundLayers()}
          <div
            style={{
              position: isResponsive ? 'absolute' : 'relative',
              zIndex: 1,
              width: '100%',
              height: '100%',
              top: isResponsive ? 0 : 'auto',
              left: isResponsive ? 0 : 'auto',
              right: isResponsive ? 0 : 'auto',
              bottom: isResponsive ? 0 : 'auto',
              background: 'transparent',
              display: isResponsive ? 'block' : 'flex',
              alignItems: isResponsive ? 'stretch' : 'center',
              justifyContent: isResponsive ? 'stretch' : 'center',
              maxWidth: '100%',
              maxHeight: '100%',
            }}
            onMouseLeave={() => setHoveredDatasetIndex(null)}
            onContextMenu={(e) => handleNativeContextMenu(e.nativeEvent as MouseEvent)}
          >
            {chartConfig.dynamicDimension ? (
              <ResizableChartArea>
                <Chart
                  key={`${chartTypeForChart}-${isResponsive ? 'responsive' : 'fixed'}-${chartConfig.manualDimensions ? 'manual' : 'auto'}`}
                  ref={chartRef}
                  type={chartTypeForChart as any}
                  data={chartDataForChart}
                  {...((chartConfig.manualDimensions || chartConfig.dynamicDimension) && {
                    'data-debug-width': chartConfig.width,
                    'data-debug-height': chartConfig.height
                  })}
                  options={{
                    ...chartConfig,
                    responsive: true,
                    maintainAspectRatio: false,
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
                      // Guard: Chart.js can call onHover during init/re-renders.
                      // Only update React state when the hovered dataset index actually changes.
                      if (!chartConfig.interaction?.mode) {
                        setHoveredDatasetIndex((prev) => (prev === null ? prev : null));
                        return
                      }

                      const next =
                        chartMode === 'grouped' && elements && elements.length > 0
                          ? elements[0].datasetIndex
                          : null

                      setHoveredDatasetIndex((prev) => (prev === next ? prev : next))
                    },
                    plugins: ({
                      ...chartConfig.plugins,
                      pie3d: (chartType === 'pie3d' || chartType === 'doughnut3d')
                        ? { ...((chartConfig.plugins as any)?.pie3d || {}), enabled: true }
                        : (chartConfig.plugins as any)?.pie3d,
                      bar3d: (chartType === 'bar3d' || chartType === 'horizontalBar3d')
                        ? { ...((chartConfig.plugins as any)?.bar3d || {}), enabled: true }
                        : (chartConfig.plugins as any)?.bar3d,
                      legendType: ((chartConfig.plugins as any)?.legendType) || 'dataset',
                      watermark: (chartConfig as any)?.watermark,
                      customLabels: { shapeSize: 32, labels: customLabels },
                      legend: {
                        ...((chartConfig.plugins as any)?.legend),
                        display: ((chartConfig.plugins as any)?.legend?.display !== false),
                        labels: {
                          ...(((chartConfig.plugins as any)?.legend)?.labels || {}),
                          generateLabels: (chart: any) => {
                            // Read legendType from the chart's config at runtime
                            const legendType = (chart.config?.options?.plugins?.legendType) ||
                              ((chartConfig.plugins as any)?.legendType) ||
                              'dataset';
                            const usePointStyle = (chartConfig.plugins?.legend as any)?.labels?.usePointStyle || false;
                            const pointStyle = (chartConfig.plugins?.legend as any)?.labels?.pointStyle || 'rect';
                            const fontColor = (chartConfig.plugins?.legend?.labels as any)?.color || '#000000';

                            const createItem = (props: any, isHidden: boolean) => {
                              // For a cleaner visual, we avoid heavy Unicode strikethrough
                              // and instead gray out the label and prefix with a subtle "×"
                              // when hidden. This renders much more cleanly on canvas.
                              const text = props.text as string | undefined;
                              const decoratedText =
                                isHidden && text ? `${text}` : text;

                              return {
                                ...props,
                                text: decoratedText,
                                pointStyle: usePointStyle ? pointStyle : undefined,
                                fontColor: isHidden ? '#999999' : fontColor,
                                hidden: isHidden,
                              };
                            };

                            const items = [] as any[];
                            if (legendType === 'slice' || legendType === 'both') {
                              for (let i = 0; i < filteredLabels.length; ++i) {
                                // Check if this slice is hidden
                                const isHidden = typeof chart.getDataVisibility === 'function'
                                  ? !chart.getDataVisibility(i)
                                  : false;

                                // For slice legends, find the best color from the first dataset
                                // Handle both array colors (per-slice) and single string colors
                                const ds0 = filteredDatasets[0];
                                let sliceFill = '#ccc';
                                let sliceStroke = '#333';
                                if (ds0) {
                                  const bg = ds0.backgroundColor;
                                  if (Array.isArray(bg) && bg[i]) {
                                    sliceFill = bg[i] as string;
                                  } else if (typeof bg === 'string' && bg) {
                                    sliceFill = bg;
                                  }
                                  const bc = ds0.borderColor;
                                  if (Array.isArray(bc) && bc[i]) {
                                    sliceStroke = bc[i] as string;
                                  } else if (typeof bc === 'string' && bc) {
                                    sliceStroke = bc;
                                  }
                                }

                                items.push(createItem({
                                  text: String(filteredLabels[i]),
                                  fillStyle: sliceFill,
                                  strokeStyle: sliceStroke,
                                  index: i,
                                  datasetIndex: 0,
                                  type: 'slice',
                                }, isHidden));
                              }
                            }
                            if (legendType === 'dataset' || legendType === 'both') {
                              for (let i = 0; i < filteredDatasets.length; ++i) {
                                // Check if this dataset is hidden
                                const isHidden = typeof chart.isDatasetVisible === 'function'
                                  ? !chart.isDatasetVisible(i)
                                  : false;

                                items.push(createItem({
                                  text: filteredDatasets[i].label || `Dataset ${i + 1}`,
                                  fillStyle: Array.isArray(filteredDatasets[i].backgroundColor) ? (filteredDatasets[i].backgroundColor as string[])[0] : (filteredDatasets[i].backgroundColor as string) || '#ccc',
                                  strokeStyle: Array.isArray(filteredDatasets[i].borderColor) ? (filteredDatasets[i].borderColor as string[])[0] : (filteredDatasets[i].borderColor as string) || '#333',
                                  datasetIndex: i,
                                  index: i,
                                  type: 'dataset',
                                }, isHidden));
                              }
                            }
                            return items;
                          },
                        },
                      },
                      tooltip: {
                        ...((chartConfig.plugins as any)?.tooltip),
                        backgroundColor: tooltipBackgroundWithOpacity,
                        callbacks: {
                          ...((chartConfig.plugins as any)?.tooltip?.callbacks),
                          label: function (context: any) {
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
                              let lines = [`${datasetLabel}`, ...dataset.data.map((v: any, i: number) => {
                                const sliceLabel = data.labels?.[i] || `Slice ${i + 1}`;
                                const sliceColor = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[i] : dataset.backgroundColor;
                                return `${sliceLabel}: ${v}`;
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
                  plugins={[watermarkPlugin]}
                />
              </ResizableChartArea>
            ) : (
              <div
                style={{
                  width: (chartConfig.manualDimensions && !isInsideTemplateOrFormat) ? `${chartWidth}px` : '100%',
                  height: (chartConfig.manualDimensions && !isInsideTemplateOrFormat) ? `${chartHeight}px` : '100%',
                  position: 'relative',
                  minHeight: isResponsive ? '100%' : 'auto',
                  minWidth: isResponsive ? '100%' : 'auto'
                }}
              >
                <Chart
                  key={`${chartTypeForChart}-${isResponsive ? 'responsive' : 'fixed'}-${chartConfig.manualDimensions ? `manual-${chartWidth}-${chartHeight}` : 'auto'}`}
                  ref={chartRef}
                  type={chartTypeForChart as any}
                  data={chartDataForChart}
                  {...((chartConfig.manualDimensions || chartConfig.dynamicDimension) && {
                    'data-debug-width': chartConfig.width,
                    'data-debug-height': chartConfig.height
                  })}
                  options={{
                    ...appliedOptions,
                    responsive: isInsideTemplateOrFormat || chartConfig.manualDimensions ? true : isResponsive,
                    maintainAspectRatio: false,
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
                      // Guard: Chart.js can call onHover during init/re-renders.
                      // Only update React state when the hovered dataset index actually changes.
                      if (!chartConfig.interaction?.mode) {
                        setHoveredDatasetIndex((prev) => (prev === null ? prev : null));
                        return
                      }

                      const next =
                        chartMode === 'grouped' && elements && elements.length > 0
                          ? elements[0].datasetIndex
                          : null

                      setHoveredDatasetIndex((prev) => (prev === next ? prev : next))
                    },
                    plugins: ({
                      ...chartConfig.plugins,
                      pie3d: (chartType === 'pie3d' || chartType === 'doughnut3d')
                        ? { ...((chartConfig.plugins as any)?.pie3d || {}), enabled: true }
                        : (chartConfig.plugins as any)?.pie3d,
                      bar3d: (chartType === 'bar3d' || chartType === 'horizontalBar3d')
                        ? { ...((chartConfig.plugins as any)?.bar3d || {}), enabled: true }
                        : (chartConfig.plugins as any)?.bar3d,
                      legendType: ((chartConfig.plugins as any)?.legendType) || 'dataset',
                      watermark: (chartConfig as any)?.watermark,
                      customLabels: { shapeSize: 32, labels: customLabels },
                      legend: {
                        ...((chartConfig.plugins as any)?.legend),
                        display: ((chartConfig.plugins as any)?.legend?.display !== false),
                        labels: {
                          ...(((chartConfig.plugins as any)?.legend)?.labels || {}),
                          generateLabels: (chart: any) => {
                            // Read legendType from the chart's config at runtime
                            const legendType = (chart.config?.options?.plugins?.legendType) ||
                              ((chartConfig.plugins as any)?.legendType) ||
                              'dataset';
                            const usePointStyle = (chartConfig.plugins?.legend as any)?.labels?.usePointStyle || false;
                            const pointStyle = (chartConfig.plugins?.legend as any)?.labels?.pointStyle || 'rect';
                            const fontColor = (chartConfig.plugins?.legend?.labels as any)?.color || '#000000';

                            const createItem = (props: any, isHidden: boolean) => {
                              const text = props.text as string | undefined;
                              const decoratedText =
                                isHidden && text ? `${text}` : text;

                              return {
                                ...props,
                                text: decoratedText,
                                pointStyle: usePointStyle ? pointStyle : undefined,
                                fontColor: isHidden ? '#999999' : fontColor,
                                hidden: isHidden,
                              };
                            };

                            const items = [] as any[];
                            if (legendType === 'slice' || legendType === 'both') {
                              for (let i = 0; i < filteredLabels.length; ++i) {
                                // Check if this slice is hidden
                                const isHidden = typeof chart.getDataVisibility === 'function'
                                  ? !chart.getDataVisibility(i)
                                  : false;

                                // For slice legends, find the best color from the first dataset
                                // Handle both array colors (per-slice) and single string colors
                                const ds0 = filteredDatasets[0];
                                let sliceFill = '#ccc';
                                let sliceStroke = '#333';
                                if (ds0) {
                                  const bg = ds0.backgroundColor;
                                  if (Array.isArray(bg) && bg[i]) {
                                    sliceFill = bg[i] as string;
                                  } else if (typeof bg === 'string' && bg) {
                                    sliceFill = bg;
                                  }
                                  const bc = ds0.borderColor;
                                  if (Array.isArray(bc) && bc[i]) {
                                    sliceStroke = bc[i] as string;
                                  } else if (typeof bc === 'string' && bc) {
                                    sliceStroke = bc;
                                  }
                                }

                                items.push(createItem({
                                  text: String(filteredLabels[i]),
                                  fillStyle: sliceFill,
                                  strokeStyle: sliceStroke,
                                  index: i,
                                  datasetIndex: 0,
                                  type: 'slice',
                                }, isHidden));
                              }
                            }
                            if (legendType === 'dataset' || legendType === 'both') {
                              for (let i = 0; i < filteredDatasets.length; ++i) {
                                // Check if this dataset is hidden
                                const isHidden = typeof chart.isDatasetVisible === 'function'
                                  ? !chart.isDatasetVisible(i)
                                  : false;

                                items.push(createItem({
                                  text: filteredDatasets[i].label || `Dataset ${i + 1}`,
                                  fillStyle: Array.isArray(filteredDatasets[i].backgroundColor) ? (filteredDatasets[i].backgroundColor as string[])[0] : (filteredDatasets[i].backgroundColor as string) || '#ccc',
                                  strokeStyle: Array.isArray(filteredDatasets[i].borderColor) ? (filteredDatasets[i].borderColor as string[])[0] : (filteredDatasets[i].borderColor as string) || '#333',
                                  datasetIndex: i,
                                  index: i,
                                  type: 'dataset',
                                }, isHidden));
                              }
                            }
                            return items;
                          },
                        },
                      },
                      tooltip: {
                        ...((chartConfig.plugins as any)?.tooltip),
                        backgroundColor: tooltipBackgroundWithOpacity,
                        callbacks: {
                          ...((chartConfig.plugins as any)?.tooltip?.callbacks),
                          label: function (context: any) {
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
                              let lines = [`${datasetLabel}`, ...dataset.data.map((v: any, i: number) => {
                                const sliceLabel = data.labels?.[i] || `Slice ${i + 1}`;
                                const sliceColor = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[i] : dataset.backgroundColor;
                                return `${sliceLabel}: ${v}`;
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
                  plugins={[watermarkPlugin]}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full w-full text-gray-400 gap-4 p-8">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-lg font-semibold text-gray-600 mb-2">No chart data available</p>
            </div>

            {chartMode === 'grouped' && (
              <>
                <p className="text-sm text-gray-500 mb-2">
                  Group: <span className="font-semibold text-purple-600">{groups.find(g => g.id === activeGroupId)?.name || 'Unknown'}</span>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  This group is empty. Add datasets to get started.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={loadSampleGroupedData}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Load Sample Data
                  </button>
                  <button
                    onClick={() => {
                      // Dispatch a custom event that dataset-settings will listen for
                      window.dispatchEvent(new CustomEvent('openAddDatasetModal'));
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-200 hover:border-blue-400 text-gray-700 hover:text-blue-600 rounded-lg font-medium shadow-sm hover:shadow transition-all duration-200 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Dataset Manually
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-4">
                  Sample data: 2 datasets with 6 data points each
                </p>
              </>
            )}

            {chartMode === 'single' && (
              <>
                <p className="text-sm text-gray-500 mb-6">
                  You're in <span className="font-semibold text-blue-600">single mode</span> but don't have any data yet.
                </p>
                <button
                  onClick={loadSampleSingleData}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Load Sample Single Data
                </button>
                <p className="text-xs text-gray-400 mt-4">
                  This will load 1 dataset with 4 data points
                </p>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Or switch to the <span className="font-semibold">Datasets panel</span> to add your own data manually
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}



      {/* Slice Color Context Menu */}
      <SliceColorPickerPopover
        isOpen={sliceContextMenu.isOpen}
        x={sliceContextMenu.x}
        y={sliceContextMenu.y}
        currentColor={sliceContextMenu.currentColor}
        currentBorderColor={sliceContextMenu.currentBorderColor}
        currentValue={sliceContextMenu.currentValue}
        onClose={() => setSliceContextMenu(prev => ({ ...prev, isOpen: false }))}
        onColorChange={(newColor) => {
          setSliceContextMenu(prev => ({ ...prev, currentColor: newColor }));

          const currentMode = useChartStore.getState().chartMode;
          const { datasetIndex, sliceIndex } = sliceContextMenu;

          if (currentMode === 'single') {
            const dataset = chartData.datasets[datasetIndex];
            if (!dataset) return;

            const newBgColors = Array.isArray(dataset.backgroundColor)
              ? [...dataset.backgroundColor]
              : Array(dataset.data.length).fill(dataset.backgroundColor || '#3b82f6');
            const newBorderColors = Array.isArray(dataset.borderColor)
              ? [...dataset.borderColor]
              : Array(dataset.data.length).fill(dataset.borderColor || darkenColor(dataset.backgroundColor || '#3b82f6', 20));

            newBgColors[sliceIndex] = newColor;
            newBorderColors[sliceIndex] = darkenColor(newColor, 20);

            actionsRef.current.updateDataset(datasetIndex, {
              backgroundColor: newBgColors,
              borderColor: newBorderColors
            });
          } else {
            const dataset = chartData.datasets[datasetIndex];
            if (!dataset) return;

            const isSingleString = typeof dataset.backgroundColor === 'string';
            const bgArr = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor : [];
            const normalize = (c: any) => typeof c === 'string' ? c.replace(/\s/g, '').toLowerCase() : '';
            const allSame = bgArr.length > 0 && bgArr.every((c: any) => normalize(c) === normalize(bgArr[0]));
            const isDatasetColorMode = (dataset as any).datasetColorMode === 'single' || isSingleString || allSame;

            if (isDatasetColorMode) {
              const sliceCount = dataset.data.length;
              actionsRef.current.updateDataset(datasetIndex, {
                backgroundColor: Array(sliceCount).fill(newColor),
                borderColor: Array(sliceCount).fill(darkenColor(newColor, 20)),
                lastDatasetColor: newColor,
                datasetColorMode: 'single'
              });
            } else {
              const groupId = (dataset as any).groupId;
              chartData.datasets.forEach((ds: any, dsIdx: number) => {
                if ((ds as any).groupId !== groupId) return;
                if ((ds as any).mode !== 'grouped') return;

                const dsBgColors = Array.isArray(ds.backgroundColor)
                  ? [...ds.backgroundColor]
                  : Array(ds.data.length).fill(ds.backgroundColor || '#3b82f6');
                const dsBorderColors = Array.isArray(ds.borderColor)
                  ? [...ds.borderColor]
                  : Array(ds.data.length).fill(ds.borderColor || darkenColor(ds.backgroundColor || '#3b82f6', 20));

                if (sliceIndex < dsBgColors.length) {
                  dsBgColors[sliceIndex] = newColor;
                  dsBorderColors[sliceIndex] = darkenColor(newColor, 20);
                  actionsRef.current.updateDataset(dsIdx, {
                    backgroundColor: dsBgColors,
                    borderColor: dsBorderColors,
                    lastSliceColors: dsBgColors,
                    datasetColorMode: 'slice'
                  });
                }
              });
            }
          }
        }}
        onBorderColorChange={(newBorderColor) => {
          setSliceContextMenu(prev => ({ ...prev, currentBorderColor: newBorderColor }));

          const currentMode = useChartStore.getState().chartMode;
          const { datasetIndex, sliceIndex } = sliceContextMenu;

          if (currentMode === 'single') {
            const dataset = chartData.datasets[datasetIndex];
            if (!dataset) return;

            const newBorderColors = Array.isArray(dataset.borderColor)
              ? [...dataset.borderColor]
              : Array(dataset.data.length).fill(dataset.borderColor || '#1d4ed8');

            newBorderColors[sliceIndex] = newBorderColor;

            actionsRef.current.updateDataset(datasetIndex, {
              borderColor: newBorderColors
            });
          } else {
            const dataset = chartData.datasets[datasetIndex];
            if (!dataset) return;

            const isSingleString = typeof dataset.backgroundColor === 'string';
            const bgArr = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor : [];
            const normalize = (c: any) => typeof c === 'string' ? c.replace(/\s/g, '').toLowerCase() : '';
            const allSame = bgArr.length > 0 && bgArr.every((c: any) => normalize(c) === normalize(bgArr[0]));
            const isDatasetColorMode = (dataset as any).datasetColorMode === 'single' || isSingleString || allSame;

            if (isDatasetColorMode) {
              const sliceCount = dataset.data.length;
              actionsRef.current.updateDataset(datasetIndex, {
                borderColor: Array(sliceCount).fill(newBorderColor)
              });
            } else {
              const groupId = (dataset as any).groupId;
              chartData.datasets.forEach((ds: any, dsIdx: number) => {
                if ((ds as any).groupId !== groupId) return;
                if ((ds as any).mode !== 'grouped') return;

                const dsBorderColors = Array.isArray(ds.borderColor)
                  ? [...ds.borderColor]
                  : Array(ds.data.length).fill(ds.borderColor || '#1d4ed8');

                if (sliceIndex < dsBorderColors.length) {
                  dsBorderColors[sliceIndex] = newBorderColor;
                  actionsRef.current.updateDataset(dsIdx, {
                    borderColor: dsBorderColors
                  });
                }
              });
            }
          }
        }}
        onValueChange={(newValueStr) => {
          setSliceContextMenu(prev => ({ ...prev, currentValue: newValueStr }));

          const { datasetIndex, sliceIndex } = sliceContextMenu;
          const dataset = chartData.datasets[datasetIndex];
          if (!dataset) return;

          const newData = [...dataset.data];
          const parsedValue = newValueStr === '' ? 0 : Number(newValueStr);

          if (newData[sliceIndex] !== null && typeof newData[sliceIndex] === 'object' && 'y' in newData[sliceIndex]) {
            newData[sliceIndex] = { ...newData[sliceIndex], y: isNaN(parsedValue) ? 0 : parsedValue };
          } else {
            newData[sliceIndex] = isNaN(parsedValue) ? 0 : parsedValue;
          }

          actionsRef.current.updateDataset(datasetIndex, {
            data: newData
          });
        }}
      />
    </div>
  );
});

export default ChartGenerator;