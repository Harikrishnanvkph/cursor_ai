"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { useChartStore } from "@/lib/chart-store"
import { useState } from "react"

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

  const handleConfigUpdate = (path: string, value: any) => {
    const keys = path.split(".")
    const newConfig = { ...chartConfig }
    let current = newConfig

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {}
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    updateChartConfig(newConfig)
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

      {/* Hover Animations Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900">Hover Animations</h3>
          <button
            onClick={() => setHoverDropdownOpen(!hoverDropdownOpen)}
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
              className={`transform transition-transform ${hoverDropdownOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9"/>
            </svg>
          </button>
          </div>

        <div className="bg-purple-50 rounded-lg p-3 space-y-3">
          {/* Hover Mode */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Hover Mode</Label>
            <Select
              value={chartConfig.interaction?.mode || "point"}
              onValueChange={(value) => handleConfigUpdate("interaction.mode", value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nearest">Nearest</SelectItem>
                <SelectItem value="point">Point</SelectItem>
                <SelectItem value="index">Index</SelectItem>
                <SelectItem value="dataset">Dataset</SelectItem>
                <SelectItem value="x">X-Axis</SelectItem>
                <SelectItem value="y">Y-Axis</SelectItem>
              </SelectContent>
            </Select>
          </div>


          
          {/* Dropdown Content */}
          {hoverDropdownOpen && (
            <div className="space-y-3 pt-2 border-t border-purple-200">
              {/* Hover Animation Duration */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Animation Duration</Label>
                  <span className="text-xs text-gray-500">{chartConfig.hover?.animationDuration || 400}ms</span>
                </div>
                <Slider
                  value={[chartConfig.hover?.animationDuration || 400]}
                  onValueChange={([value]) => handleConfigUpdate("hover.animationDuration", value)}
                  max={1000}
                  min={0}
                  step={50}
                  className="mt-1"
                />
              </div>

              {/* Hover Fade Effect */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Fade Effect</Label>
            <Switch
              checked={chartConfig.hoverFadeEffect !== false}
              onCheckedChange={(checked) => handleConfigUpdate("hoverFadeEffect", checked)}
                    className="data-[state=checked]:bg-purple-600"
            />
                </div>
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
          {/* Responsive Toggle */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Responsive</Label>
              <Switch
                checked={chartConfig.responsive !== false}
                onCheckedChange={(checked) => handleConfigUpdate("responsive", checked)}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          </div>

          {/* Maintain Aspect Ratio */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Maintain Aspect Ratio</Label>
              <Switch
                checked={chartConfig.maintainAspectRatio !== false}
                onCheckedChange={(checked) => handleConfigUpdate("maintainAspectRatio", checked)}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          </div>
          
          {/* Dropdown Content */}
          {responsiveDropdownOpen && (
            <div className="space-y-3 pt-2 border-t border-green-200">
              {/* Resize Animation Duration */}
              <div className="space-y-1">
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
            </div>
          )}
          </div>
          </div>
    </div>
  )
}
