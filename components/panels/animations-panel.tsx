"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { useChartStore } from "@/lib/chart-store"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import React from "react"

const allowedEasings = [
  "linear",
  "easeInQuad",
  "easeOutQuad",
  "easeInOutQuad",
  "easeInCubic",
  "easeOutCubic",
  "easeInOutCubic",
  "easeInSine",
  "easeOutSine",
  "easeInOutSine"
];

export function AnimationsPanel() {
  const { chartConfig, updateChartConfig } = useChartStore()
  const [generalDropdownOpen, setGeneralDropdownOpen] = useState(false)
  const [hoverDropdownOpen, setHoverDropdownOpen] = useState(false)
  const [responsiveDropdownOpen, setResponsiveDropdownOpen] = useState(false)
  const [hoverOpen, setHoverOpen] = useState(true)
  const [hoverEnabled, setHoverEnabled] = useState(chartConfig.interaction?.mode !== undefined && chartConfig.interaction?.mode !== false)
  const [widthUnit, setWidthUnit] = useState<'px' | '%'>('px');
  const [heightUnit, setHeightUnit] = useState<'px' | '%'>('px');
  
  // Update parseDimensionValue to accept a fallback parameter
  const parseDimensionValue = (value: any, fallback: number): { value: number, unit: 'px' | '%' } => {
    if (typeof value === 'string') {
      if (value.includes('%')) {
        const parsed = parseFloat(value);
        return { value: isNaN(parsed) ? 100 : parsed, unit: '%' };
      } else if (value.includes('px')) {
        const parsed = parseFloat(value);
        return { value: isNaN(parsed) ? fallback : parsed, unit: 'px' };
      }
      // If it's a string without units, try to parse as number
      const parsed = parseFloat(value);
      return { value: isNaN(parsed) ? fallback : parsed, unit: 'px' };
    }
    if (typeof value === 'number') {
      return { value: isNaN(value) ? fallback : value, unit: 'px' };
    }
    // Default values
    return { value: fallback, unit: 'px' };
  };

  // Use 500 for width and 400 for height
  const widthDimension = parseDimensionValue((chartConfig as any).width, 500);
  const heightDimension = parseDimensionValue((chartConfig as any).height, 400);
  
  const widthValue = widthDimension.value;
  const heightValue = heightDimension.value;
  
  // Update units when they change
  React.useEffect(() => {
    setWidthUnit(widthDimension.unit);
  }, [widthDimension.unit]);
  
  React.useEffect(() => {
    setHeightUnit(heightDimension.unit);
  }, [heightDimension.unit]);
  
  const isResponsive = chartConfig.responsive !== false;

  const handleConfigUpdate = (path: string, value: any) => {
    const keys = path.split(".")
    const newConfig = { ...chartConfig } as any
    let current = newConfig

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {}
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    updateChartConfig(newConfig)
  }

  const handleHoverEnabledChange = (checked: boolean) => {
    setHoverEnabled(checked)
    handleConfigUpdate('interaction.mode', checked ? (typeof chartConfig.interaction?.mode === 'string' ? chartConfig.interaction.mode : 'point') : undefined)
  }

  // Ensure the value is always one of the allowed options
  const easingValue = allowedEasings.includes(chartConfig.animation?.easing)
    ? chartConfig.animation?.easing
    : "linear"

  return (
    <div className="space-y-4">
      {/* General Animations Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900">General Animations</h3>
          <button
            onClick={() => setGeneralDropdownOpen(!generalDropdownOpen)}
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
              className={`transform transition-transform ${generalDropdownOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9"/>
            </svg>
          </button>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3 space-y-3">
          {/* Enable Toggle */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Enable Animations</Label>
            <Switch
              checked={chartConfig.animation !== false}
              onCheckedChange={(checked) => handleConfigUpdate("animation", checked ? {} : false)}
                className="data-[state=checked]:bg-blue-600"
            />
            </div>
          </div>

          {/* Dropdown Content */}
          {generalDropdownOpen && chartConfig.animation !== false && (
            <div className="space-y-3 pt-2 border-t border-blue-200">
              {/* Duration */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Duration</Label>
                  <span className="text-xs text-gray-500">{chartConfig.animation?.duration || 1000}ms</span>
                </div>
                <Slider
                  value={[chartConfig.animation?.duration || 1000]}
                  onValueChange={([value]) => handleConfigUpdate("animation.duration", value)}
                  max={3000}
                  min={100}
                  step={100}
                  className="mt-1"
                />
              </div>

              {/* Easing */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Easing</Label>
                <Select
                  value={easingValue}
                  onValueChange={(value) => handleConfigUpdate("animation.easing", value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select easing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="easeInQuad">Ease In</SelectItem>
                    <SelectItem value="easeOutQuad">Ease Out</SelectItem>
                    <SelectItem value="easeInOutQuad">Ease In Out</SelectItem>
                    <SelectItem value="easeInCubic">Ease In (Strong)</SelectItem>
                    <SelectItem value="easeOutCubic">Ease Out (Strong)</SelectItem>
                    <SelectItem value="easeInOutCubic">Ease In Out (Strong)</SelectItem>
                    <SelectItem value="easeInSine">Ease In (Smooth)</SelectItem>
                    <SelectItem value="easeOutSine">Ease Out (Smooth)</SelectItem>
                    <SelectItem value="easeInOutSine">Ease In Out (Smooth)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Delay */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Delay</Label>
                  <span className="text-xs text-gray-500">{chartConfig.animation?.delay || 0}ms</span>
                </div>
                <Slider
                  value={[chartConfig.animation?.delay || 0]}
                  onValueChange={([value]) => handleConfigUpdate("animation.delay", value)}
                  max={2000}
                  min={0}
                  step={100}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Responsive Animations Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900">Responsive Animations</h3>
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
              <path d="M6 9L12 15L18 9"/>
            </svg>
          </button>
        </div>
        
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
          {/* Debug Info */}
          {/* Removed Aspect Ratio Input */}
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
          {responsiveDropdownOpen && (
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
          )}
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
      </div>

      {/* Hover Animation Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900 flex-1">Hover Animation</h3>
          <Switch
            checked={hoverEnabled}
            onCheckedChange={handleHoverEnabledChange}
            className="data-[state=checked]:bg-pink-600"
          />
          <button
            onClick={() => setHoverOpen(!hoverOpen)}
            className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Toggle Hover Animation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${hoverOpen ? 'rotate-180' : ''}`}> <path d="M6 9L12 15L18 9"/> </svg>
          </button>
        </div>
        {/* Single container for summary and expanded content */}
        <div className="bg-pink-50 rounded-lg">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-medium text-black">Hover Mode</span>
            <Select
              value={chartConfig.interaction?.mode === 'nearest' ? 'nearest' : 'point'}
              onValueChange={value => handleConfigUpdate('interaction.mode', value)}
              disabled={!hoverEnabled}
            >
              <SelectTrigger className="h-8 text-xs w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="point">Point</SelectItem>
                <SelectItem value="nearest">Nearest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hoverOpen && (
            <div className={`px-3 pb-3 ${!hoverEnabled ? 'opacity-50 pointer-events-none' : ''}`}> 
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-medium">Animation Duration (ms)</Label>
                <div className="relative w-24">
                  <Input
                    type="number"
                    min={0}
                    value={chartConfig.hover?.animationDuration ?? 400}
                    onChange={e => handleConfigUpdate('hover.animationDuration', e.target.value ? Number(e.target.value) : 400)}
                    className="h-8 text-xs pr-8 w-full"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">ms</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
