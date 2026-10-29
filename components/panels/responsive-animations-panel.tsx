import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChartStore } from "@/lib/chart-store";
import { useChartActions } from "@/lib/hooks/use-chart-actions";
import { useTemplateStore } from "@/lib/template-store";
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store";
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

  const handleUnitChange = (newUnit: DimensionUnit) => {
    setUnit(newUnit);
    setWidthInput(convertFromPixels(widthValue, newUnit).toString());
    setHeightInput(convertFromPixels(heightValue, newUnit).toString());
    setPadTopInput(convertFromPixels(padTopValue, newUnit).toString());
    setPadRightInput(convertFromPixels(padRightValue, newUnit).toString());
    setPadBottomInput(convertFromPixels(padBottomValue, newUnit).toString());
    setPadLeftInput(convertFromPixels(padLeftValue, newUnit).toString());
  };

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
      if (typeof newConfig.layout.padding === 'number') {
        const val = newConfig.layout.padding;
        newConfig.layout.padding = { top: val, right: val, bottom: val, left: val };
      } else if (!newConfig.layout.padding || typeof newConfig.layout.padding !== 'object') {
        newConfig.layout.padding = {};
      }

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
              <div className="flex flex-wrap gap-1.5">
                {sliceLabels.map((label: any, index: number) => {
                  // Check if slice is hidden using legendFilter
                  const isHidden = legendFilter.slices[index] === false;

                  return (
                    <Button
                      key={index}
                      variant={isHidden ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleToggleSliceVisibility(index)}
                      className={`h-6 text-[10px] px-2 max-w-[140px] ${isHidden
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-300'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                      {isHidden ? <EyeOff className="h-2.5 w-2.5 mr-0.5 shrink-0" /> : <Eye className="h-2.5 w-2.5 mr-0.5 shrink-0" />}
                      <span className="truncate">{String(label)}</span>
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
          <div className="bg-slate-50/70 rounded-b-lg p-2.5 space-y-2.5 border-x border-b border-slate-200/80 overflow-hidden min-w-0">
            {/* Template Mode Notice */}
            {isTemplateMode && (
              <div className="text-[11px] text-amber-700 bg-amber-50/90 p-2 rounded-md border border-amber-200">
                ⚠️ Layout settings are locked in Template mode. Responsive mode is active.
              </div>
            )}
            {/* Common Unit Selector */}
            <div className={`flex items-center justify-between px-1 py-0.5 ${isTemplateMode ? 'opacity-50 pointer-events-none' : ''}`}>
              <span className="text-xs font-semibold text-slate-700">Unit</span>
              <Select
                value={unit}
                onValueChange={(val) => handleUnitChange(val as DimensionUnit)}
              >
                <SelectTrigger className="h-7 w-20 text-xs bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="px" className="text-xs">px</SelectItem>
                  <SelectItem value="mm" className="text-xs">mm</SelectItem>
                  <SelectItem value="cm" className="text-xs">cm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dimension Mode Cards */}
            <div className={`space-y-1.5 ${isTemplateMode ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Fixed Dimensions Option */}
              {(() => {
                const isFixedActive = chartConfig.manualDimensions === true && !(chartConfig as any).templateDimensions && !(chartConfig as any).originalDimensions;

                const handleSelectFixed = () => {
                  const currentWidth = (chartConfig as any)?.width;
                  const currentHeight = (chartConfig as any)?.height;
                  const width = (!currentWidth || currentWidth.toString().includes('%')) ? '800px' : currentWidth;
                  const height = (!currentHeight || currentHeight.toString().includes('%')) ? '600px' : currentHeight;

                  updateChartConfig({
                    ...chartConfig,
                    manualDimensions: true,
                    responsive: false,
                    templateDimensions: false,
                    originalDimensions: false,
                    width: width,
                    height: height
                  });
                };

                return (
                  <div
                    onClick={handleSelectFixed}
                    className={`rounded-lg border transition-all cursor-pointer p-2.5 ${
                      isFixedActive
                        ? 'bg-white border-blue-400 shadow-2xs'
                        : 'bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        id="manual-mode-anim"
                        name="chart-mode-anim"
                        checked={isFixedActive}
                        onChange={handleSelectFixed}
                        className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-slate-300 mt-0.5 cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <label htmlFor="manual-mode-anim" className="text-xs font-semibold text-slate-800 cursor-pointer">
                            Fixed Dimensions
                          </label>
                          {isFixedActive && (
                            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/70 px-1.5 py-0.2 rounded-full">
                              Active
                            </span>
                          )}
                        </div>

                        {/* Inputs shown only when Fixed Dimensions is active */}
                        {isFixedActive && (
                          <div
                            className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Width & Height inputs side-by-side in a 2-column grid */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[10px] font-medium text-slate-500 block mb-0.5">Width</span>
                                <div className="relative flex items-center">
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
                                    className="h-7 text-xs bg-white pr-7 border-slate-200"
                                  />
                                  <span className="absolute right-2 text-[10px] text-slate-400 pointer-events-none">{unit}</span>
                                </div>
                              </div>

                              <div>
                                <span className="text-[10px] font-medium text-slate-500 block mb-0.5">Height</span>
                                <div className="relative flex items-center">
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
                                    className="h-7 text-xs bg-white pr-7 border-slate-200"
                                  />
                                  <span className="absolute right-2 text-[10px] text-slate-400 pointer-events-none">{unit}</span>
                                </div>
                              </div>
                            </div>

                            {unit !== 'px' && (
                              <div className="text-[10px] text-slate-400 text-right">
                                ≈ {widthValue} × {heightValue} px
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Template Dimensions & Original Chart Dimensions */}
              {(() => {
                const templateStore = useTemplateStore.getState();
                const formatStore = useFormatGalleryStore.getState();
                const { originalCloudDimensions } = useChartStore.getState();

                let templateWidth: number | undefined = undefined;
                let templateHeight: number | undefined = undefined;

                // 1. Resolve format layout chart zone size
                const selectedFormatId = formatStore.selectedFormatId;
                if (selectedFormatId) {
                  const format = formatStore.selectedFormatSnapshot
                    || [...formatStore.formats, ...(formatStore.userFormats || [])].find(f => f.id === selectedFormatId);
                  if (format) {
                    const zones = format.skeleton?.zones || (format as any).zones || [];
                    const chartZone = zones.find((z: any) => z.type === 'chart' || z.role === 'chart' || (z.id && String(z.id).startsWith('chart')));
                    if (chartZone?.position?.width && chartZone?.position?.height) {
                      templateWidth = chartZone.position.width;
                      templateHeight = chartZone.position.height;
                    }
                  }
                }

                // 2. Resolve template layout chart zone size
                const templateWithDimensions = templateStore.currentTemplate || templateStore.templateInBackground;
                if (!templateWidth && templateWithDimensions?.chartArea) {
                  templateWidth = templateWithDimensions.chartArea.width;
                  templateHeight = templateWithDimensions.chartArea.height;
                }

                const hasTemplateDimensions = !!(templateWidth && templateHeight);

                // Resolve original chart dimensions (from cloud, backup, or default 800x600)
                const origWidth = originalCloudDimensions?.width 
                  || (templateStore.chartDimensionBackup?.width ? `${templateStore.chartDimensionBackup.width}` : '800px');
                const origHeight = originalCloudDimensions?.height 
                  || (templateStore.chartDimensionBackup?.height ? `${templateStore.chartDimensionBackup.height}` : '600px');
                
                const origWNum = parseInt(origWidth, 10) || 800;
                const origHNum = parseInt(origHeight, 10) || 600;

                const isTemplateActive = (chartConfig as any).templateDimensions === true;
                const isOriginalActive = (chartConfig as any).originalDimensions === true;

                return (
                  <>
                    {/* 1. Template Dimensions */}
                    {hasTemplateDimensions && (
                      <div
                        onClick={() => {
                          if (templateWidth && templateHeight) {
                            updateChartConfig({
                              ...chartConfig,
                              templateDimensions: true,
                              originalDimensions: false,
                              manualDimensions: true,
                              responsive: false,
                              width: `${templateWidth}px`,
                              height: `${templateHeight}px`
                            });
                          }
                        }}
                        className={`rounded-lg border transition-all cursor-pointer p-2.5 ${
                          isTemplateActive
                            ? 'bg-white border-blue-400 shadow-2xs'
                            : 'bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            id="template-dimension-mode-anim"
                            name="chart-mode-anim"
                            checked={isTemplateActive}
                            onChange={() => {
                              if (templateWidth && templateHeight) {
                                updateChartConfig({
                                  ...chartConfig,
                                  templateDimensions: true,
                                  originalDimensions: false,
                                  manualDimensions: true,
                                  responsive: false,
                                  width: `${templateWidth}px`,
                                  height: `${templateHeight}px`
                                });
                              }
                            }}
                            className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-slate-300 mt-0.5 cursor-pointer shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <label htmlFor="template-dimension-mode-anim" className="text-xs font-semibold text-slate-800 cursor-pointer">
                                Template Dimensions
                              </label>
                              {isTemplateActive && (
                                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/70 px-1.5 py-0.2 rounded-full">
                                  Active
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {templateWidth} × {templateHeight} px
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. Original Chart Dimensions (neglecting template dimensions) */}
                    <div
                      onClick={() => {
                        updateChartConfig({
                          ...chartConfig,
                          originalDimensions: true,
                          templateDimensions: false,
                          manualDimensions: true,
                          responsive: false,
                          width: `${origWNum}px`,
                          height: `${origHNum}px`
                        });
                      }}
                      className={`rounded-lg border transition-all cursor-pointer p-2.5 ${
                        isOriginalActive
                          ? 'bg-white border-blue-400 shadow-2xs'
                          : 'bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          id="original-dimension-mode-anim"
                          name="chart-mode-anim"
                          checked={isOriginalActive}
                          onChange={() => {
                            updateChartConfig({
                              ...chartConfig,
                              originalDimensions: true,
                              templateDimensions: false,
                              manualDimensions: true,
                              responsive: false,
                              width: `${origWNum}px`,
                              height: `${origHNum}px`
                            });
                          }}
                          className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-slate-300 mt-0.5 cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <label htmlFor="original-dimension-mode-anim" className="text-xs font-semibold text-slate-800 cursor-pointer">
                              Original Chart Dimensions
                            </label>
                            {isOriginalActive && (
                              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/70 px-1.5 py-0.2 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {origWNum} × {origHNum} px
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
            {/* Padding Controls */}
            <div className={`p-2.5 rounded-lg bg-white/70 border border-slate-200/80 space-y-2 ${isTemplateMode ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Chart Padding</span>
                <span className="text-[10px] text-slate-400 font-medium">({unit})</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <div>
                  <span className="text-[10px] text-slate-500 block text-center mb-0.5 font-medium">Top</span>
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
                    className="h-7 text-xs text-center px-1 bg-white border-slate-200"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block text-center mb-0.5 font-medium">Right</span>
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
                    className="h-7 text-xs text-center px-1 bg-white border-slate-200"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block text-center mb-0.5 font-medium">Bottom</span>
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
                    className="h-7 text-xs text-center px-1 bg-white border-slate-200"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block text-center mb-0.5 font-medium">Left</span>
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
                    className="h-7 text-xs text-center px-1 bg-white border-slate-200"
                  />
                </div>
              </div>
              {unit !== 'px' && (
                <div className="text-[10px] text-slate-400 text-right">
                  ≈ {padTopValue}, {padRightValue}, {padBottomValue}, {padLeftValue} px
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div >
  );
} 