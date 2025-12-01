import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useChartStore } from "@/lib/chart-store";
import { useTemplateStore } from "@/lib/template-store";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function ResponsiveAnimationsPanel() {
  const { chartData, chartConfig, updateChartConfig, legendFilter, toggleSliceVisibility } = useChartStore();
  const { editorMode, setEditorMode } = useTemplateStore();
  const [responsiveDropdownOpen, setResponsiveDropdownOpen] = useState(true);
  const [sliceVisibilityOpen, setSliceVisibilityOpen] = useState(false);
  
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
      {/* Quick Slice Visibility */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900">Quick Slice Visibility</h3>
          <button
            onClick={() => setSliceVisibilityOpen(!sliceVisibilityOpen)}
            className="ml-auto p-1 hover:bg-gray-100 rounded transition-colors"
          >
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
          </button>
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
                    className={`h-8 text-xs ${
                      isHidden 
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
            {sliceLabels.length === 0 && (
              <p className="text-xs text-gray-500 italic">No slices available</p>
            )}
          </div>
        )}
      </div>

      {/* Layout and Dimensions - Expanded by default */}
      <div className="flex items-center gap-2 pb-1 border-b">
        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
        <h3 className="text-sm font-semibold text-gray-900">Layout and Dimensions</h3>
        <button
          onClick={() => setResponsiveDropdownOpen(!responsiveDropdownOpen)}
          className="ml-auto p-1 hover:bg-gray-100 rounded transition-colors"
          disabled={isTemplateMode}
        >
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
        </button>
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
                checked={chartConfig.responsive === true}
                onChange={() => {
                  updateChartConfig({
                    ...chartConfig,
                    responsive: true,
                    manualDimensions: false,
                    dynamicDimension: false
                  });
                }}
                className="text-green-600 focus:ring-green-500"
              />
              <Label htmlFor="responsive-mode-anim" className="text-xs font-medium cursor-pointer">
                Responsive {chartConfig.responsive === true ? '(Active)' : ''}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="dynamic-dimension-mode-anim"
                name="chart-mode-anim"
                checked={chartConfig.dynamicDimension === true}
                onChange={() => {
                  updateChartConfig({
                    ...chartConfig,
                    dynamicDimension: true,
                    responsive: false,
                    manualDimensions: false,
                    width: '400px',
                    height: '400px'
                  });
                }}
                className="text-green-600 focus:ring-green-500"
              />
              <Label htmlFor="dynamic-dimension-mode-anim" className="text-xs font-medium cursor-pointer">
                Dynamic Dimension {chartConfig.dynamicDimension === true ? '(Active)' : ''}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="manual-mode-anim"
                name="chart-mode-anim"
                checked={chartConfig.manualDimensions === true}
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
                    width: width,
                    height: height
                  });
                }}
                className="text-green-600 focus:ring-green-500"
              />
              <Label htmlFor="manual-mode-anim" className="text-xs font-medium cursor-pointer">
                Manual Dimensions {chartConfig.manualDimensions === true ? '(Active)' : ''}
              </Label>
            </div>
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
                disabled={!(chartConfig.manualDimensions || chartConfig.dynamicDimension) || isTemplateMode}
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
                disabled={!(chartConfig.manualDimensions || chartConfig.dynamicDimension) || isTemplateMode}
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
      )}
    </div>
  );
} 