import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useChartStore } from "@/lib/chart-store";
import React, { useState } from "react";

export function ResponsiveAnimationsPanel() {
  const { chartConfig, updateChartConfig } = useChartStore();
  const [responsiveDropdownOpen, setResponsiveDropdownOpen] = useState(false);

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

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-2 pb-1 border-b">
        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
        <h3 className="text-sm font-semibold text-gray-900">Layout and Dimensions</h3>
        <button
          onClick={() => setResponsiveDropdownOpen(!responsiveDropdownOpen)}
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
            className={`transform transition-transform ${responsiveDropdownOpen ? 'rotate-180' : ''}`}
          >
            <path d="M6 9L12 15L18 9" />
          </svg>
        </button>
      </div>
      {responsiveDropdownOpen && (
        <div className="bg-green-50 rounded-lg p-3 space-y-3">
          {/* Radio Buttons for Chart Mode */}
          <div className="space-y-2">
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
                    manualDimensions: false
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
                  updateChartConfig({
                    ...chartConfig,
                    manualDimensions: true,
                    responsive: false,
                    dynamicDimension: false
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Width</Label>
              <Input
                type="number"
                min={100}
                max={2000}
                value={widthValue}
                disabled={!(chartConfig.manualDimensions || chartConfig.dynamicDimension)}
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
                disabled={!(chartConfig.manualDimensions || chartConfig.dynamicDimension)}
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
          {/* Resize Animation Duration */}
          <div className="space-y-1 pt-2 border-t border-green-200">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Resize Animation</Label>
              <span className="text-xs text-gray-500">{chartConfig.responsive?.animationDuration || 0}ms</span>
            </div>
            <Slider
              value={[chartConfig.responsive?.animationDuration || 0]}
              onValueChange={([value]) => handleConfigUpdate("responsive.animationDuration", value)}
              max={1000}
              min={0}
              step={50}
              className="mt-1"
            />
          </div>
          {/* Padding Controls */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <Label className="text-xs font-medium">Padding Top</Label>
              <Input
                type="number"
                value={chartConfig.layout?.padding?.top ?? 10}
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
                value={chartConfig.layout?.padding?.right ?? 10}
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
                value={chartConfig.layout?.padding?.bottom ?? 10}
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
                value={chartConfig.layout?.padding?.left ?? 10}
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