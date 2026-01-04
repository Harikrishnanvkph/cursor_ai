import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useChartStore } from "@/lib/chart-store";
import { useTemplateStore } from "@/lib/template-store";
import React, { useState } from "react";
import { Eye, EyeOff, ArrowUpNarrowWide, ArrowDownWideNarrow, ArrowUpAZ, ArrowDownZA, ArrowUpDown, Trophy, TrendingUp, TrendingDown, BarChart3, Percent, Hash, X, Divide, Undo2 } from "lucide-react";
import { toast } from "sonner";

export function ResponsiveAnimationsPanel() {
  const {
    chartData,
    chartConfig,
    updateChartConfig,
    legendFilter,
    toggleSliceVisibility,
    activeDatasetIndex,
    chartMode,
    sortDataset,
    reverseDataset,
    filterTopN,
    filterAboveThreshold,
    filterBelowThreshold,
    normalizeDataset,
    convertToPercentage,
    roundDataset,
    scaleDataset,
    datasetBackups,
    resetDatasetOperations
  } = useChartStore();
  const { editorMode, setEditorMode } = useTemplateStore();
  const [responsiveDropdownOpen, setResponsiveDropdownOpen] = useState(true);
  const [sliceVisibilityOpen, setSliceVisibilityOpen] = useState(false);
  const [quickToolsOpen, setQuickToolsOpen] = useState(false);
  const [thresholdValue, setThresholdValue] = useState(50);

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
        <div className="space-y-3">
          <div
            className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
            onClick={() => setSliceVisibilityOpen(!sliceVisibilityOpen)}
          >
            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
            <h3 className="text-sm font-semibold text-gray-900">Quick Slice Filter</h3>
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
            <div className="bg-purple-50 rounded-lg p-3 space-y-2">
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
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
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

      {/* Quick Tools Section */}
      <div className="space-y-3">
        <div
          className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
          onClick={() => setQuickToolsOpen(!quickToolsOpen)}
        >
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900 flex-1">Quick Tools</h3>
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
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 space-y-3 border border-blue-100">
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
                  className="h-8 bg-white hover:bg-green-50 hover:border-green-300 transition-all group"
                  title="Show Top 5 Values"
                >
                  <Trophy className="h-4 w-4 text-green-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTop10}
                  className="h-8 bg-white hover:bg-green-50 hover:border-green-300 transition-all group"
                  title="Show Top 10 Values"
                >
                  <Trophy className="h-4 w-4 text-green-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAboveThreshold}
                  className="h-8 bg-white hover:bg-green-50 hover:border-green-300 transition-all group"
                  title={`Show values above ${thresholdValue}`}
                >
                  <TrendingUp className="h-4 w-4 text-green-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBelowThreshold}
                  className="h-8 bg-white hover:bg-green-50 hover:border-green-300 transition-all group"
                  title={`Show values below ${thresholdValue}`}
                >
                  <TrendingDown className="h-4 w-4 text-green-600 group-hover:scale-110 transition-transform" />
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
                  className="h-8 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all group"
                  title="Normalize to 0-100 range"
                >
                  <BarChart3 className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConvertToPercentage}
                  className="h-8 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all group"
                  title="Convert to percentages"
                >
                  <Percent className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRound1Decimal}
                  className="h-8 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all group"
                  title="Round to 1 decimal place"
                >
                  <Hash className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRound2Decimals}
                  className="h-8 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all group"
                  title="Round to 2 decimal places"
                >
                  <Hash className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDoubleValues}
                  className="h-8 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all group"
                  title="Double all values"
                >
                  <X className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleHalfValues}
                  className="h-8 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all group"
                  title="Half all values"
                >
                  <Divide className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform" />
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

      {/* Layout and Dimensions - Expanded by default */}
      <div
        className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
        onClick={() => setResponsiveDropdownOpen(!responsiveDropdownOpen)}
      >
        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
        <h3 className="text-sm font-semibold text-gray-900">Layout and Dimensions</h3>
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
        <div className="bg-green-50 rounded-lg p-3 space-y-3">
          {/* Template Mode Notice */}
          {isTemplateMode && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mb-2">
              ⚠️ Layout settings are locked in Template mode. Responsive mode is active.
            </div>
          )}
          {/* Radio Buttons for Chart Mode */}
          <div className={`space-y-2 ${isTemplateMode ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center space-x-2">
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
                className="text-green-600 focus:ring-green-500"
              />
              <Label htmlFor="responsive-mode-anim" className="text-xs font-medium cursor-pointer">
                Responsive {chartConfig.responsive === true && !chartConfig.templateDimensions && !(chartConfig as any).originalDimensions ? '(Active)' : ''}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="dynamic-dimension-mode-anim"
                name="chart-mode-anim"
                checked={chartConfig.dynamicDimension === true && !chartConfig.templateDimensions && !(chartConfig as any).originalDimensions}
                onChange={() => {
                  updateChartConfig({
                    ...chartConfig,
                    dynamicDimension: true,
                    responsive: false,
                    manualDimensions: false,
                    templateDimensions: false,
                    originalDimensions: false,
                    width: '400px',
                    height: '400px'
                  });
                }}
                className="text-green-600 focus:ring-green-500"
              />
              <Label htmlFor="dynamic-dimension-mode-anim" className="text-xs font-medium cursor-pointer">
                Dynamic Dimension {chartConfig.dynamicDimension === true && !chartConfig.templateDimensions && !(chartConfig as any).originalDimensions ? '(Active)' : ''}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="manual-mode-anim"
                name="chart-mode-anim"
                checked={chartConfig.manualDimensions === true && !(chartConfig as any).templateDimensions && !(chartConfig as any).originalDimensions}
                onChange={() => {
                  // Initialize width/height if they don't exist
                  const currentWidth = (chartConfig as any)?.width;
                  const currentHeight = (chartConfig as any)?.height;
                  const width = currentWidth || '600px';
                  const height = currentHeight || '500px';

                  updateChartConfig({
                    ...chartConfig,
                    manualDimensions: true,
                    responsive: false,
                    dynamicDimension: false,
                    templateDimensions: false,
                    originalDimensions: false,
                    width: width,
                    height: height
                  });
                }}
                className="text-green-600 focus:ring-green-500"
              />
              <Label htmlFor="manual-mode-anim" className="text-xs font-medium cursor-pointer">
                Manual Dimensions {chartConfig.manualDimensions === true && !(chartConfig as any).templateDimensions && !(chartConfig as any).originalDimensions ? '(Active)' : ''}
              </Label>
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
                  <div className="flex items-center space-x-2">
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
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="template-dimension-mode-anim" className="text-xs font-medium cursor-pointer text-blue-700">
                      Template Dimensions {(chartConfig as any).templateDimensions === true ? '(Active)' : ''}
                      <span className="text-gray-500 ml-1">
                        ({templateWithDimensions?.chartArea?.width}×{templateWithDimensions?.chartArea?.height})
                      </span>
                    </Label>
                  </div>
                );
              }

              // For chart-only conversations loaded from cloud, show Original Dimension
              if (!isTemplateConversation && hasOriginalDimensions) {
                const widthNum = parseInt(originalCloudDimensions.width);
                const heightNum = parseInt(originalCloudDimensions.height);

                return (
                  <div className="flex items-center space-x-2">
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
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <Label htmlFor="original-dimension-mode-anim" className="text-xs font-medium cursor-pointer text-indigo-700">
                      Original Dimensions {(chartConfig as any).originalDimensions === true ? '(Active)' : ''}
                      <span className="text-gray-500 ml-1">
                        ({widthNum}×{heightNum})
                      </span>
                    </Label>
                  </div>
                );
              }

              // For new charts (never saved to cloud), show nothing
              return null;
            })()}
          </div>
          {/* Width/Height Controls */}
          <div className={`grid grid-cols-2 gap-3 ${isTemplateMode ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <Label className="text-xs font-medium">Width</Label>
              <Input
                type="number"
                min={100}
                max={2000}
                value={widthValue}
                disabled={!(chartConfig.manualDimensions || chartConfig.dynamicDimension) || isTemplateMode || chartConfig.templateDimensions}
                onChange={e => {
                  const newValue = e.target.value ? `${e.target.value}px` : undefined;
                  if (chartConfig.dynamicDimension) {
                    updateChartConfig({ ...chartConfig, width: newValue, dynamicDimension: true });
                  } else if (chartConfig.manualDimensions) {
                    updateChartConfig({ ...chartConfig, width: newValue, manualDimensions: true });
                  }
                }}
                className="h-8 text-xs w-full"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Height</Label>
              <Input
                type="number"
                min={100}
                max={2000}
                value={heightValue}
                disabled={!(chartConfig.manualDimensions || chartConfig.dynamicDimension) || isTemplateMode || chartConfig.templateDimensions}
                onChange={e => {
                  const newValue = e.target.value ? `${e.target.value}px` : undefined;
                  if (chartConfig.dynamicDimension) {
                    updateChartConfig({ ...chartConfig, height: newValue, dynamicDimension: true });
                  } else if (chartConfig.manualDimensions) {
                    updateChartConfig({ ...chartConfig, height: newValue, manualDimensions: true });
                  }
                }}
                className="h-8 text-xs w-full"
              />
            </div>
          </div>
          {/* Padding Controls */}
          <div className={`grid grid-cols-2 gap-3 mt-2 ${isTemplateMode ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <Label className="text-xs font-medium">Padding Top</Label>
              <Input
                type="number"
                value={(chartConfig.layout?.padding as any)?.top ?? 10}
                onChange={(e) =>
                  handleConfigUpdate("layout.padding.top", e.target.value ? Number.parseInt(e.target.value) : undefined)
                }
                placeholder="0"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Padding Right</Label>
              <Input
                type="number"
                value={(chartConfig.layout?.padding as any)?.right ?? 10}
                onChange={(e) =>
                  handleConfigUpdate("layout.padding.right", e.target.value ? Number.parseInt(e.target.value) : undefined)
                }
                placeholder="0"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Padding Bottom</Label>
              <Input
                type="number"
                value={(chartConfig.layout?.padding as any)?.bottom ?? 10}
                onChange={(e) =>
                  handleConfigUpdate("layout.padding.bottom", e.target.value ? Number.parseInt(e.target.value) : undefined)
                }
                placeholder="0"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Padding Left</Label>
              <Input
                type="number"
                value={(chartConfig.layout?.padding as any)?.left ?? 10}
                onChange={(e) =>
                  handleConfigUpdate("layout.padding.left", e.target.value ? Number.parseInt(e.target.value) : undefined)
                }
                placeholder="0"
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>
      )
      }
    </div >
  );
} 