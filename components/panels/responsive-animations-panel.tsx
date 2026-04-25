import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useChartStore } from "@/lib/chart-store";
import { useChartActions } from "@/lib/hooks/use-chart-actions";
import { useTemplateStore } from "@/lib/template-store";
import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, ArrowUpNarrowWide, ArrowDownWideNarrow, ArrowUpAZ, ArrowDownZA, ArrowUpDown, Trophy, TrendingUp, TrendingDown, BarChart3, Percent, Hash, X, Divide, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { type DimensionUnit, convertFromPixels, convertToPixels } from "@/lib/utils/dimension-utils";

export function ResponsiveAnimationsPanel() {
  const {
    chartData,
    chartConfig,
    legendFilter,
    activeDatasetIndex,
    chartMode,
    datasetBackups
  } = useChartStore();

  const {
    updateChartConfig,
    toggleSliceVisibility,
    sortDataset,
    reverseDataset,
    filterTopN,
    filterAboveThreshold,
    filterBelowThreshold,
    normalizeDataset,
    convertToPercentage,
    roundDataset,
    scaleDataset,
    resetDatasetOperations
  } = useChartActions();
  const { editorMode, setEditorMode } = useTemplateStore();
  const [responsiveDropdownOpen, setResponsiveDropdownOpen] = useState(true);
  const [sliceVisibilityOpen, setSliceVisibilityOpen] = useState(false);
  const [quickToolsOpen, setQuickToolsOpen] = useState(false);
  const [thresholdValue, setThresholdValue] = useState(50);
  const [unit, setUnit] = useState<DimensionUnit>('px');
  
  // Helper to parse dimension values
  const parseDimensionValue = (value: any, fallback: number): { value: number, unit: 'px' | '%' } => {
    if (typeof value === 'string') {
      if (value.includes('%')) {
        const parsed = parseFloat(value);
        return { value: isNaN(parsed) ? 100 : parsed, unit: '%' };
      } else if (value.includes('px')) {
        const parsed = parseFloat(value);
        return { value: isNaN(parsed) ? fallback : parsed, unit: 'px' };
      }
      const parsed = parseFloat(value);
      return { value: isNaN(parsed) ? fallback : parsed, unit: 'px' };
    }
    if (typeof value === 'number') {
      return { value: isNaN(value) ? fallback : value, unit: 'px' };
    }
    return { value: fallback, unit: 'px' };
  };

  const widthDimension = parseDimensionValue((chartConfig as any).width, 500);
  const heightDimension = parseDimensionValue((chartConfig as any).height, 400);
  const widthValue = widthDimension.value;
  const heightValue = heightDimension.value;

  const padTopValue = (chartConfig.layout?.padding as any)?.top ?? 10;
  const padRightValue = (chartConfig.layout?.padding as any)?.right ?? 10;
  const padBottomValue = (chartConfig.layout?.padding as any)?.bottom ?? 10;
  const padLeftValue = (chartConfig.layout?.padding as any)?.left ?? 10;

  // Local string state for inputs
  const [widthInput, setWidthInput] = useState(() => convertFromPixels(widthValue, unit).toString());
  const [heightInput, setHeightInput] = useState(() => convertFromPixels(heightValue, unit).toString());
  const [padTopInput, setPadTopInput] = useState(() => convertFromPixels(padTopValue, unit).toString());
  const [padRightInput, setPadRightInput] = useState(() => convertFromPixels(padRightValue, unit).toString());
  const [padBottomInput, setPadBottomInput] = useState(() => convertFromPixels(padBottomValue, unit).toString());
  const [padLeftInput, setPadLeftInput] = useState(() => convertFromPixels(padLeftValue, unit).toString());

  // Sync inputs with external chartConfig changes (e.g. Reset, load new chart)
  useEffect(() => {
    const wNum = parseFloat(widthInput);
    if (isNaN(wNum) || Math.round(convertToPixels(wNum, unit)) !== Math.round(widthValue)) {
      setWidthInput(convertFromPixels(widthValue, unit).toString());
    }
    const hNum = parseFloat(heightInput);
    if (isNaN(hNum) || Math.round(convertToPixels(hNum, unit)) !== Math.round(heightValue)) {
      setHeightInput(convertFromPixels(heightValue, unit).toString());
    }
    const ptNum = parseFloat(padTopInput);
    if (isNaN(ptNum) || Math.round(convertToPixels(ptNum, unit)) !== Math.round(padTopValue)) {
      setPadTopInput(convertFromPixels(padTopValue, unit).toString());
    }
    const prNum = parseFloat(padRightInput);
    if (isNaN(prNum) || Math.round(convertToPixels(prNum, unit)) !== Math.round(padRightValue)) {
      setPadRightInput(convertFromPixels(padRightValue, unit).toString());
    }
    const pbNum = parseFloat(padBottomInput);
    if (isNaN(pbNum) || Math.round(convertToPixels(pbNum, unit)) !== Math.round(padBottomValue)) {
      setPadBottomInput(convertFromPixels(padBottomValue, unit).toString());
    }
    const plNum = parseFloat(padLeftInput);
    if (isNaN(plNum) || Math.round(convertToPixels(plNum, unit)) !== Math.round(padLeftValue)) {
      setPadLeftInput(convertFromPixels(padLeftValue, unit).toString());
    }
  }, [widthValue, heightValue, padTopValue, padRightValue, padBottomValue, padLeftValue, unit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const wNum = parseFloat(widthInput);
      const hNum = parseFloat(heightInput);
      const ptNum = parseFloat(padTopInput);
      const prNum = parseFloat(padRightInput);
      const pbNum = parseFloat(padBottomInput);
      const plNum = parseFloat(padLeftInput);

      let dimensionsUpdated = false;
      let paddingUpdated = false;
      
      const latestConfig = useChartStore.getState().chartConfig;
      const newConfig = { ...latestConfig } as any;
      
      if (!isNaN(wNum) && wNum > 0) {
        const pxVal = Math.round(convertToPixels(wNum, unit));
        if (newConfig.width !== `${pxVal}px`) {
           newConfig.width = `${pxVal}px`;
           dimensionsUpdated = true;
        }
      }
      if (!isNaN(hNum) && hNum > 0) {
        const pxVal = Math.round(convertToPixels(hNum, unit));
        if (newConfig.height !== `${pxVal}px`) {
           newConfig.height = `${pxVal}px`;
           dimensionsUpdated = true;
        }
      }

      if (!newConfig.layout) newConfig.layout = {};
      if (!newConfig.layout.padding) newConfig.layout.padding = {};

      if (!isNaN(ptNum) && ptNum >= 0) {
        const pxVal = Math.round(convertToPixels(ptNum, unit));
        if (newConfig.layout.padding.top !== pxVal) {
          newConfig.layout.padding.top = pxVal;
          paddingUpdated = true;
        }
      }
      if (!isNaN(prNum) && prNum >= 0) {
        const pxVal = Math.round(convertToPixels(prNum, unit));
        if (newConfig.layout.padding.right !== pxVal) {
          newConfig.layout.padding.right = pxVal;
          paddingUpdated = true;
        }
      }
      if (!isNaN(pbNum) && pbNum >= 0) {
        const pxVal = Math.round(convertToPixels(pbNum, unit));
        if (newConfig.layout.padding.bottom !== pxVal) {
          newConfig.layout.padding.bottom = pxVal;
          paddingUpdated = true;
        }
      }
      if (!isNaN(plNum) && plNum >= 0) {
        const pxVal = Math.round(convertToPixels(plNum, unit));
        if (newConfig.layout.padding.left !== pxVal) {
          newConfig.layout.padding.left = pxVal;
          paddingUpdated = true;
        }
      }
      
      if (dimensionsUpdated || paddingUpdated) {
        if (dimensionsUpdated) {
          newConfig.originalDimensions = false;
        }
        updateChartConfig(newConfig);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [widthInput, heightInput, padTopInput, padRightInput, padBottomInput, padLeftInput, unit, updateChartConfig]);

  const currentDatasetIndex = chartMode === 'single' ? activeDatasetIndex : 0;
  const hasBackup = datasetBackups.has(currentDatasetIndex);

  const handleSortAscending = () => sortDataset(currentDatasetIndex, 'asc');
  const handleSortDescending = () => sortDataset(currentDatasetIndex, 'desc');
  const handleSortLabelAZ = () => sortDataset(currentDatasetIndex, 'label-asc');
  const handleSortLabelZA = () => sortDataset(currentDatasetIndex, 'label-desc');
  const handleReverse = () => reverseDataset(currentDatasetIndex);

  const handleTop5 = () => filterTopN(currentDatasetIndex, 5);
  const handleTop10 = () => filterTopN(currentDatasetIndex, 10);
  const handleAboveThreshold = () => filterAboveThreshold(currentDatasetIndex, thresholdValue);
  const handleBelowThreshold = () => filterBelowThreshold(currentDatasetIndex, thresholdValue);

  const handleNormalize = () => normalizeDataset(currentDatasetIndex, '0-100');
  const handleConvertToPercentage = () => convertToPercentage(currentDatasetIndex);
  const handleRound1Decimal = () => roundDataset(currentDatasetIndex, 1);
  const handleRound2Decimals = () => roundDataset(currentDatasetIndex, 2);
  const handleDoubleValues = () => scaleDataset(currentDatasetIndex, 2);
  const handleHalfValues = () => scaleDataset(currentDatasetIndex, 0.5);

  const handleResetOperations = () => {
    resetDatasetOperations(currentDatasetIndex);
    toast.success('Reset to original state', { duration: 2000 });
  };

  // Check if template mode is active
  const isTemplateMode = editorMode === 'template';


  const handleConfigUpdate = (path: string, value: any) => {
    const keys = path.split(".");
    const newConfig = { ...chartConfig } as any;
    let current = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    updateChartConfig(newConfig);
  };

  // Toggle slice visibility using the store's function
  const handleToggleSliceVisibility = (sliceIndex: number) => {
    toggleSliceVisibility(sliceIndex);
  };

  // Get slice labels
  const sliceLabels = chartData.labels || [];

  return (
    <div className="space-y-3 mt-4">
      {/* Quick Slice Filter - Only show when there are labels */}
      {sliceLabels.length > 0 && (
        <div className="space-y-0">
          <div
            className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded-t"
            onClick={() => setSliceVisibilityOpen(!sliceVisibilityOpen)}
          >
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <h3 className="text-xs font-semibold text-gray-900">Quick Slice Filter</h3>
            <div className="ml-auto flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transform transition-transform ${sliceVisibilityOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9L12 15L18 9" />
              </svg>
            </div>
          </div>

          {sliceVisibilityOpen && (
            <div className="bg-blue-50 rounded-b-lg p-3 space-y-2 border-x border-b border-blue-100">
              <p className="text-xs text-gray-600 mb-2">Click to hide/show slices from the chart</p>
              <div className="flex flex-wrap gap-2">
                {sliceLabels.map((label: any, index: number) => {
                  // Check if slice is hidden using legendFilter
                  const isHidden = legendFilter.slices[index] === false;

                  return (
                    <Button
                      key={index}
                      variant={isHidden ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleToggleSliceVisibility(index)}
                      className={`h-8 text-xs ${isHidden
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-300'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                      {isHidden ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                      {String(label)}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Tools Section - Only for Single Mode */}
      {chartMode !== 'grouped' && (
        <div className="space-y-0">
          <div
            className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded-t"
            onClick={() => setQuickToolsOpen(!quickToolsOpen)}
          >
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <h3 className="text-xs font-semibold text-gray-900 flex-1">Quick Tools</h3>
            <div className="ml-auto flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transform transition-transform ${quickToolsOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9L12 15L18 9" />
              </svg>
            </div>
          </div>
          {quickToolsOpen && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-b-lg p-3 space-y-3 border-x border-b border-blue-100">
              {/* Reordering Operations */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-blue-900">🔄 Reordering</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSortAscending}
                    className="h-8 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
                    title="Sort Ascending (Low to High)"
                  >
                    <ArrowUpNarrowWide className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSortDescending}
                    className="h-8 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
                    title="Sort Descending (High to Low)"
                  >
                    <ArrowDownWideNarrow className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSortLabelAZ}
                    className="h-8 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
                    title="Sort by Label A-Z"
                  >
                    <ArrowUpAZ className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSortLabelZA}
                    className="h-8 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
                    title="Sort by Label Z-A"
                  >
                    <ArrowDownZA className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReverse}
                    className="h-8 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group col-span-4"
                    title="Reverse Order"
                  >
                    <ArrowUpDown className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  </Button>
                </div>
              </div>

              {/* Filtering Operations */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-blue-900">🔍 Filtering</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTop5}
                    className="h-8 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
                    title="Show Top 5 Values"
                  >
                    <Trophy className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTop10}
                    className="h-8 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
                    title="Show Top 10 Values"
                  >
                    <Trophy className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAboveThreshold}
                    className="h-8 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
                    title={`Show values above ${thresholdValue}`}
                  >
                    <TrendingUp className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBelowThreshold}
                    className="h-8 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
                    title={`Show values below ${thresholdValue}`}
                  >
                    <TrendingDown className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-600">Threshold:</Label>
                  <input
                    type="number"
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(Number(e.target.value))}
                    className="w-16 px-2 py-1 text-xs border rounded bg-white"
                    min="0"
                  />
                </div>
              </div>

              {/* Value Transformations */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-blue-900">📈 Transformations</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNormalize}
                    className="h-8 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
                    title="Normalize to 0-100 range"
                  >
                    <BarChart3 className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConvertToPercentage}
                    className="h-8 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
                    title="Convert to percentages"
                  >
                    <Percent className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRound1Decimal}
                    className="h-8 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
                    title="Round to 1 decimal place"
                  >
                    <Hash className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRound2Decimals}
                    className="h-8 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
                    title="Round to 2 decimal places"
                  >
                    <Hash className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDoubleValues}
                    className="h-8 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
                    title="Double all values"
                  >
                    <X className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleHalfValues}
                    className="h-8 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
                    title="Half all values"
                  >
                    <Divide className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  </Button>
                </div>
              </div>

              {/* Reset Button */}
              {hasBackup && (
                <div className="pt-2 border-t border-blue-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetOperations}
                    className="w-full h-8 bg-white hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700 transition-all group"
                  >
                    <Undo2 className="h-3.5 w-3.5 mr-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">Reset to Original</span>
                  </Button>
                </div>
              )}

              {!hasBackup && (
                <div className="pt-2 border-t border-blue-200">
                  <p className="text-xs text-center text-gray-500 py-2">
                    No changes to reset
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Layout and Dimensions - Expanded by default */}
      <div className="space-y-0">
        <div
          className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded-t"
          onClick={() => setResponsiveDropdownOpen(!responsiveDropdownOpen)}
        >
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <h3 className="text-xs font-semibold text-gray-900">Layout and Dimensions</h3>
          <div className="ml-auto flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transform transition-transform ${responsiveDropdownOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9" />
            </svg>
          </div>
        </div>
        {responsiveDropdownOpen && (
          <div className="bg-blue-50 rounded-b-lg p-2 space-y-2 border-x border-b border-blue-100">
            {/* Template Mode Notice */}
            {isTemplateMode && (
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mb-2">
                ⚠️ Layout settings are locked in Template mode. Responsive mode is active.
              </div>
            )}
            {/* Radio Buttons for Chart Mode */}
            <div className={`space-y-3 ${isTemplateMode ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Responsive Option */}
              <div className="flex items-start space-x-3 p-2 rounded-md hover:bg-blue-100/50 transition-colors">
                <input
                  type="radio"
                  id="responsive-mode-anim"
                  name="chart-mode-anim"
                  checked={chartConfig.responsive === true && !chartConfig.templateDimensions && !(chartConfig as any).originalDimensions}
                  onChange={() => {
                    updateChartConfig({
                      ...chartConfig,
                      responsive: true,
                      manualDimensions: false,
                      dynamicDimension: false,
                      templateDimensions: false,
                      originalDimensions: false
                    });
                  }}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex flex-col">
                  <Label htmlFor="responsive-mode-anim" className="text-sm font-medium cursor-pointer">
                    Responsive {chartConfig.responsive === true && !chartConfig.templateDimensions && !(chartConfig as any).originalDimensions ? '(Active)' : ''}
                  </Label>
                  <span className="text-xs text-gray-500">Chart auto-fills its container</span>
                </div>
              </div>

              {/* Fixed Dimensions Option */}
              <div className="flex items-start space-x-3 p-2 rounded-md hover:bg-blue-100/50 transition-colors">
                <input
                  type="radio"
                  id="manual-mode-anim"
                  name="chart-mode-anim"
                  checked={(chartConfig.manualDimensions === true || chartConfig.dynamicDimension === true) && !(chartConfig as any).templateDimensions && !(chartConfig as any).originalDimensions}
                  onChange={() => {
                    const currentWidth = (chartConfig as any)?.width;
                    const currentHeight = (chartConfig as any)?.height;
                    const width = (!currentWidth || currentWidth.toString().includes('%')) ? '800px' : currentWidth;
                    const height = (!currentHeight || currentHeight.toString().includes('%')) ? '600px' : currentHeight;

                    updateChartConfig({
                      ...chartConfig,
                      manualDimensions: true,
                      responsive: false,
                      dynamicDimension: false, // Default off when switching
                      templateDimensions: false,
                      originalDimensions: false,
                      width: width,
                      height: height
                    });
                  }}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex flex-col flex-1">
                  <Label htmlFor="manual-mode-anim" className="text-sm font-medium cursor-pointer mb-1">
                    Fixed Dimensions {(chartConfig.manualDimensions === true || chartConfig.dynamicDimension === true) && !(chartConfig as any).templateDimensions && !(chartConfig as any).originalDimensions ? '(Active)' : ''}
                  </Label>
                  
                  {/* Inputs shown only when Fixed Dimensions is active */}
                  {(chartConfig.manualDimensions === true || chartConfig.dynamicDimension === true) && !(chartConfig as any).templateDimensions && !(chartConfig as any).originalDimensions && (
                    <div className="mt-2 space-y-2 bg-white p-2 rounded-md border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-medium w-12">Unit</Label>
                        <select
                          value={unit}
                          onChange={(e) => {
                            const newUnit = e.target.value as DimensionUnit;
                            setUnit(newUnit);
                            setWidthInput(convertFromPixels(widthValue, newUnit).toString());
                            setHeightInput(convertFromPixels(heightValue, newUnit).toString());
                            setPadTopInput(convertFromPixels(padTopValue, newUnit).toString());
                            setPadRightInput(convertFromPixels(padRightValue, newUnit).toString());
                            setPadBottomInput(convertFromPixels(padBottomValue, newUnit).toString());
                            setPadLeftInput(convertFromPixels(padLeftValue, newUnit).toString());
                          }}
                          className="h-8 text-xs border border-gray-300 rounded-md px-2 flex-1"
                        >
                          <option value="px">Pixels (px)</option>
                          <option value="mm">Millimeters (mm)</option>
                          <option value="cm">Centimeters (cm)</option>
                        </select>
                      </div>

                      {/* Width & Height inputs are managed via local state in the component */}
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-medium w-12">Width</Label>
                        <Input
                          type="number"
                          min={1}
                          value={widthInput}
                          onChange={e => setWidthInput(e.target.value)}
                          onBlur={() => {
                            const num = parseFloat(widthInput);
                            if (isNaN(num) || num <= 0) {
                              setWidthInput(convertFromPixels(widthValue, unit).toString());
                            } else {
                              setWidthInput(num.toString());
                            }
                          }}
                          className="h-8 text-xs flex-1"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-medium w-12">Height</Label>
                        <Input
                          type="number"
                          min={1}
                          value={heightInput}
                          onChange={e => setHeightInput(e.target.value)}
                          onBlur={() => {
                            const num = parseFloat(heightInput);
                            if (isNaN(num) || num <= 0) {
                              setHeightInput(convertFromPixels(heightValue, unit).toString());
                            } else {
                              setHeightInput(num.toString());
                            }
                          }}
                          className="h-8 text-xs flex-1"
                        />
                      </div>

                      {unit !== 'px' && (
                        <div className="text-[10px] text-gray-500 text-right">
                          ≈ {widthValue} × {heightValue} px
                        </div>
                      )}

                      {/* Drag to resize option as a sub-setting */}
                      <div className="flex items-center space-x-2 pt-2 border-t mt-2">
                        <input
                          type="checkbox"
                          id="enable-drag-resize"
                          checked={chartConfig.dynamicDimension === true}
                          onChange={(e) => {
                            updateChartConfig({
                              ...chartConfig,
                              dynamicDimension: e.target.checked
                            });
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <Label htmlFor="enable-drag-resize" className="text-xs text-gray-600 cursor-pointer">
                          Enable drag-to-resize handles on chart
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Template Dimensions - Only shown when a template with chartArea exists */}
              {(() => {
                const templateStore = useTemplateStore.getState();
                const { originalCloudDimensions } = useChartStore.getState();

                const templateWithDimensions = templateStore.currentTemplate || templateStore.templateInBackground;
                const hasTemplateDimensions = templateWithDimensions?.chartArea?.width && templateWithDimensions?.chartArea?.height;
                const isTemplateConversation = templateStore.templateSavedToCloud || templateStore.editorMode === 'template';
                const hasOriginalDimensions = originalCloudDimensions !== null;

                // For template conversations, show Template Dimension
                if (isTemplateConversation && hasTemplateDimensions) {
                  return (
                    <div className="flex items-start space-x-3 p-2 rounded-md hover:bg-blue-50 transition-colors">
                      <input
                        type="radio"
                        id="template-dimension-mode-anim"
                        name="chart-mode-anim"
                        checked={(chartConfig as any).templateDimensions === true}
                        onChange={() => {
                          const template = useTemplateStore.getState().currentTemplate || useTemplateStore.getState().templateInBackground;
                          if (template?.chartArea) {
                            updateChartConfig({
                              ...chartConfig,
                              templateDimensions: true,
                              originalDimensions: false,
                              manualDimensions: true,
                              responsive: false,
                              dynamicDimension: false,
                              width: `${template.chartArea.width}px`,
                              height: `${template.chartArea.height}px`
                            });
                          }
                        }}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex flex-col">
                        <Label htmlFor="template-dimension-mode-anim" className="text-sm font-medium cursor-pointer text-blue-700">
                          Template Dimensions {(chartConfig as any).templateDimensions === true ? '(Active)' : ''}
                        </Label>
                        <span className="text-xs text-gray-500">
                          {templateWithDimensions?.chartArea?.width} × {templateWithDimensions?.chartArea?.height} px
                        </span>
                      </div>
                    </div>
                  );
                }

                // For chart-only conversations loaded from cloud, show Original Dimension
                if (hasOriginalDimensions) {
                  const widthNum = parseInt(originalCloudDimensions.width);
                  const heightNum = parseInt(originalCloudDimensions.height);

                  return (
                    <div className="flex items-start space-x-3 p-2 rounded-md hover:bg-blue-50 transition-colors">
                      <input
                        type="radio"
                        id="original-dimension-mode-anim"
                        name="chart-mode-anim"
                        checked={(chartConfig as any).originalDimensions === true}
                        onChange={() => {
                          const { originalCloudDimensions } = useChartStore.getState();
                          if (originalCloudDimensions) {
                            updateChartConfig({
                              ...chartConfig,
                              originalDimensions: true,
                              templateDimensions: false,
                              manualDimensions: true,
                              responsive: false,
                              dynamicDimension: false,
                              width: originalCloudDimensions.width,
                              height: originalCloudDimensions.height
                            });
                          }
                        }}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex flex-col">
                        <Label htmlFor="original-dimension-mode-anim" className="text-sm font-medium cursor-pointer text-blue-700">
                          Original Dimensions {(chartConfig as any).originalDimensions === true ? '(Active)' : ''}
                        </Label>
                        <span className="text-xs text-gray-500">
                          {widthNum} × {heightNum} px
                        </span>
                      </div>
                    </div>
                  );
                }

                return null;
              })()}
            </div>
            {/* Padding Controls */}
            <div className={`grid grid-cols-2 gap-2 mt-2 ${isTemplateMode ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <Label className="text-xs font-medium">Padding Top ({unit})</Label>
                <Input
                  type="number"
                  min={0}
                  value={padTopInput}
                  onChange={(e) => setPadTopInput(e.target.value)}
                  onBlur={() => {
                    const num = parseFloat(padTopInput);
                    if (isNaN(num) || num < 0) {
                      setPadTopInput(convertFromPixels(padTopValue, unit).toString());
                    } else {
                      setPadTopInput(num.toString());
                    }
                  }}
                  placeholder="0"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Padding Right ({unit})</Label>
                <Input
                  type="number"
                  min={0}
                  value={padRightInput}
                  onChange={(e) => setPadRightInput(e.target.value)}
                  onBlur={() => {
                    const num = parseFloat(padRightInput);
                    if (isNaN(num) || num < 0) {
                      setPadRightInput(convertFromPixels(padRightValue, unit).toString());
                    } else {
                      setPadRightInput(num.toString());
                    }
                  }}
                  placeholder="0"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Padding Bottom ({unit})</Label>
                <Input
                  type="number"
                  min={0}
                  value={padBottomInput}
                  onChange={(e) => setPadBottomInput(e.target.value)}
                  onBlur={() => {
                    const num = parseFloat(padBottomInput);
                    if (isNaN(num) || num < 0) {
                      setPadBottomInput(convertFromPixels(padBottomValue, unit).toString());
                    } else {
                      setPadBottomInput(num.toString());
                    }
                  }}
                  placeholder="0"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Padding Left ({unit})</Label>
                <Input
                  type="number"
                  min={0}
                  value={padLeftInput}
                  onChange={(e) => setPadLeftInput(e.target.value)}
                  onBlur={() => {
                    const num = parseFloat(padLeftInput);
                    if (isNaN(num) || num < 0) {
                      setPadLeftInput(convertFromPixels(padLeftValue, unit).toString());
                    } else {
                      setPadLeftInput(num.toString());
                    }
                  }}
                  placeholder="0"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  );
} 