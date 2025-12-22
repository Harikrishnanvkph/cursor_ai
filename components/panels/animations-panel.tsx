"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { useChartStore } from "@/lib/chart-store"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Settings, Plus } from "lucide-react"

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
  const [hoverOpen, setHoverOpen] = useState(true)
  const [hoverEnabled, setHoverEnabled] = useState(chartConfig.interaction?.mode !== undefined && chartConfig.interaction?.mode !== false)
  const [dsAnimationsDropdownOpen, setDsAnimationsDropdownOpen] = useState(false)

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
        <div
          className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
          onClick={() => setGeneralDropdownOpen(!generalDropdownOpen)}
        >
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900 flex-1">General Animations</h3>
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={chartConfig.animation !== false}
              onCheckedChange={(checked) => handleConfigUpdate("animation", checked ? {} : false)}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
          <div className="ml-2 flex items-center gap-2">
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
              <path d="M6 9L12 15L18 9" />
            </svg>
          </div>
        </div>

        {/* Dropdown Content */}
        {generalDropdownOpen && chartConfig.animation !== false && (
          <div className="bg-blue-50 rounded-lg p-3 space-y-3">
            <div className="space-y-3">
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
          </div>
        )}
      </div>

      {/* Hover Animation Section */}
      <div className="space-y-3">
        <div
          className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
          onClick={() => setHoverOpen(!hoverOpen)}
        >
          <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900 flex-1">Hover Animation</h3>
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={hoverEnabled}
              onCheckedChange={handleHoverEnabledChange}
              className="data-[state=checked]:bg-pink-600"
            />
          </div>
          <div className="ml-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${hoverOpen ? 'rotate-180' : ''}`}> <path d="M6 9L12 15L18 9" /> </svg>
          </div>
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

      {/* DS Animations Section */}
      <div className="space-y-3">
        <div
          className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
          onClick={() => setDsAnimationsDropdownOpen(!dsAnimationsDropdownOpen)}
        >
          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900 flex-1">DS Animations</h3>
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={true} // Chart animations are typically enabled by default
              onCheckedChange={(checked) => {
                // This would update the chart config for animations
                console.log('Animation toggle:', checked)
              }}
              className="data-[state=checked]:bg-orange-600"
            />
          </div>
          <div className="ml-2 flex items-center gap-2">
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
              className={`transform transition-transform ${dsAnimationsDropdownOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9" />
            </svg>
          </div>
        </div>

        {dsAnimationsDropdownOpen && (
          <div className="bg-orange-50 rounded-lg p-3 space-y-3">
            <div className="space-y-3">
              {/* Animation Settings */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-orange-800">Animation Properties</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Duration (ms)</Label>
                    <Input
                      type="number"
                      defaultValue="1000"
                      className="h-8 text-xs"
                      placeholder="1000"
                      min={0}
                      max={5000}
                      step={100}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Easing</Label>
                    <Select defaultValue="easeOutQuart">
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">Linear</SelectItem>
                        <SelectItem value="easeOutQuart">Ease Out</SelectItem>
                        <SelectItem value="easeInQuart">Ease In</SelectItem>
                        <SelectItem value="easeInOutQuart">Ease In/Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Interaction Settings */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-orange-800">Interactions</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Hover Effects</Label>
                    <Switch
                      defaultChecked={true}
                      className="data-[state=checked]:bg-orange-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Click Events</Label>
                    <Switch
                      defaultChecked={true}
                      className="data-[state=checked]:bg-orange-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Tooltips</Label>
                    <Switch
                      defaultChecked={true}
                      className="data-[state=checked]:bg-orange-600"
                    />
                  </div>
                </div>
              </div>

              {/* Performance Settings */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-orange-800">Performance</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Responsive</Label>
                    <Switch
                      defaultChecked={true}
                      className="data-[state=checked]:bg-orange-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Device Pixel Ratio</Label>
                    <Select defaultValue="auto">
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="1">1x</SelectItem>
                        <SelectItem value="2">2x</SelectItem>
                        <SelectItem value="3">3x</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Data Transformation */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-orange-800">Data Processing</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Skip Null Values</Label>
                    <Switch
                      defaultChecked={false}
                      className="data-[state=checked]:bg-orange-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Normalize Data</Label>
                    <Switch
                      defaultChecked={false}
                      className="data-[state=checked]:bg-orange-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Index Axis</Label>
                    <Select defaultValue="x">
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="x">X-Axis</SelectItem>
                        <SelectItem value="y">Y-Axis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-orange-800">Actions</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Settings className="h-3 w-3 mr-1" />
                    Export Config
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Import Config
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
