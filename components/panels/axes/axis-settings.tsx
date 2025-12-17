"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { ScaleType } from "chart.js"
import { useState, useCallback, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AxisSettingsProps {
  axis: 'x' | 'y'
  config: any
  onUpdate: (path: string, value: any) => void
  className?: string
}

type AxisTab = 'general' | 'grid' | 'ticks' | 'others'

const axisTypeOptions: { value: ScaleType; label: string }[] = [
  { value: 'category', label: 'Category' },
  { value: 'linear', label: 'Linear' },
  { value: 'logarithmic', label: 'Logarithmic' },
  { value: 'time', label: 'Time' }
]

const positionOptions = (axis: 'x' | 'y') => [
  { value: axis === 'x' ? 'bottom' : 'left', label: axis === 'x' ? 'Bottom' : 'Left' },
  { value: axis === 'x' ? 'top' : 'right', label: axis === 'x' ? 'Top' : 'Right' },
  { value: 'center', label: 'Center' },
]

export function AxisSettings({ axis, config, onUpdate, className }: AxisSettingsProps) {
  const [activeTab, setActiveTab] = useState<AxisTab>('general')
  const [titleDropdownOpen, setTitleDropdownOpen] = useState(false)
  const [labelAppearanceDropdownOpen, setLabelAppearanceDropdownOpen] = useState(false)
  const [tickMarkConfigDropdownOpen, setTickMarkConfigDropdownOpen] = useState(false)
  const [tickConfigDropdownOpen, setTickConfigDropdownOpen] = useState(false)
  const [majorTicksDropdownOpen, setMajorTicksDropdownOpen] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const updateConfig = (path: string, value: any) => {
    onUpdate(`scales.${axis}.${path}`, value)
  }

  const updateNestedConfig = (basePath: string, path: string, value: any) => {
    updateConfig(`${basePath}.${path}`, value)
  }

  useEffect(() => {
    console.log('config initialization')
    console.log(JSON.stringify(config))
  }, [])

  const renderGeneralTab = () => (
    <div className="space-y-4">
      {/* Main Toggle */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
        <div className="space-y-1">
          <Label className="text-sm font-medium text-green-900">Show {axis.toUpperCase()}-Axis</Label>
        </div>
        <Switch
          checked={config?.display !== false}
          onCheckedChange={(checked) => updateConfig('display', checked)}
          className="data-[state=checked]:bg-green-600"
        />
      </div>

      {config?.display !== false && (
        <div className="space-y-4">
          {/* Type and Position */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Type</Label>
              <Select
                value={config?.type || 'category'}
                onValueChange={(value) => updateConfig('type', value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {axisTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Position</Label>
              <Select
                value={config?.position || (axis === 'x' ? 'bottom' : 'left')}
                onValueChange={(value) => updateConfig('position', value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positionOptions(axis).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Begin at Zero (Y-axis only) */}
          {axis === 'y' && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Label className="text-sm font-medium text-blue-900">Begin at Zero</Label>
              <Switch
                checked={!!config?.beginAtZero}
                onCheckedChange={(checked) => updateConfig('beginAtZero', checked)}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          )}

          {/* Title Section */}
          <div className="space-y-3">
            <div
              className="flex items-center gap-2 pb-1 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
              onClick={() => setTitleDropdownOpen(!titleDropdownOpen)}
            >
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <h3 className="text-sm font-semibold text-gray-900">Title</h3>
              <div className="ml-auto flex items-center gap-2">
                <div onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={!!config?.title?.display}
                    onCheckedChange={(checked) => {
                      updateConfig('title.display', checked)
                      if (checked) {
                        setTimeout(() => {
                          titleInputRef.current?.focus()
                        }, 100)
                      }
                    }}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
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
                  className={`transform transition-transform ${titleDropdownOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9L12 15L18 9" />
                </svg>
              </div>
            </div>

            {/* Dropdown Content */}
            {titleDropdownOpen && (
              <div className="bg-blue-50 rounded-lg p-3 space-y-3 relative overflow-hidden max-h-96 overflow-y-auto">
                {/* Title Text Input */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Text</Label>
                  <Input
                    ref={titleInputRef}
                    value={config?.title?.text || ''}
                    onChange={(e) => updateConfig('title.text', e.target.value)}
                    onFocus={(e) => {
                      // Set default text if empty when user focuses
                      if (!config?.title?.text) {
                        updateConfig('title.text', `${axis.toUpperCase()}-Axis`)
                      }
                    }}
                    placeholder={`${axis.toUpperCase()}-Axis`}
                    className="h-8 text-xs"
                  />
                </div>

                {/* Color */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Color</Label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: config?.title?.color || '#666666' }}
                        onClick={() => document.getElementById(`title-color-${axis}`)?.click()}
                      />
                      <input
                        id={`title-color-${axis}`}
                        type="color"
                        value={config?.title?.color || '#666666'}
                        onChange={(e) => updateConfig('title.color', e.target.value)}
                        className="sr-only"
                      />
                      <Input
                        value={config?.title?.color || '#666666'}
                        onChange={(e) => updateConfig('title.color', e.target.value)}
                        className="w-24 h-8 text-xs font-mono uppercase"
                        placeholder="#666666"
                      />
                    </div>
                  </div>
                </div>

                {/* Font Settings */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Font Size</Label>
                    <Input
                      type="number"
                      value={config?.title?.font?.size || ''}
                      onChange={(e) => updateNestedConfig('title.font', 'size', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="12"
                      className="h-8 text-xs pr-1"
                      min={8}
                      max={24}
                      step={1}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Weight</Label>
                    <Select
                      value={config?.title?.font?.weight || '400'}
                      onValueChange={(value) => updateNestedConfig('title.font', 'weight', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="400">Normal</SelectItem>
                        <SelectItem value="600">Bold</SelectItem>
                        <SelectItem value="900">Bolder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Font Style and Family */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Style</Label>
                    <Select
                      value={config?.title?.font?.style || 'normal'}
                      onValueChange={(value) => updateNestedConfig('title.font', 'style', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="italic">Italic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Font Family</Label>
                    <Select
                      value={config?.title?.font?.family || 'Arial'}
                      onValueChange={(value) => updateNestedConfig('title.font', 'family', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                        <SelectItem value="system-ui">System UI</SelectItem>
                        <SelectItem value="monospace">Monospace</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Padding and Alignment */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Padding</Label>
                    <Input
                      type="number"
                      value={config?.title?.padding || ''}
                      onChange={(e) => updateConfig('title.padding', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0"
                      className="h-8 text-xs"
                      min={0}
                      max={20}
                      step={1}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Alignment</Label>
                    <Select
                      value={config?.title?.align || 'center'}
                      onValueChange={(value) => updateConfig('title.align', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="start">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="end">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Label Appearance Section */}
          <div className="space-y-3">
            <div
              className="flex items-center gap-2 pb-1 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
              onClick={() => setLabelAppearanceDropdownOpen(!labelAppearanceDropdownOpen)}
            >
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <h3 className="text-sm font-semibold text-gray-900">Label Appearance</h3>
              <div className="ml-auto flex items-center gap-2">
                <div onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={config?.ticks?.display !== false}
                    onCheckedChange={(checked) => updateConfig('ticks.display', checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
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
                  className={`transform transition-transform ${labelAppearanceDropdownOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9L12 15L18 9" />
                </svg>
              </div>
            </div>

            {/* Dropdown Content */}
            {labelAppearanceDropdownOpen && (
              <div className="bg-blue-50 rounded-lg p-3 space-y-3 relative overflow-hidden max-h-96 overflow-y-auto">
                {/* Color */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Color</Label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: config?.ticks?.color || '#666666' }}
                        onClick={() => document.getElementById(`tick-color-${axis}`)?.click()}
                      />
                      <input
                        id={`tick-color-${axis}`}
                        type="color"
                        value={config?.ticks?.color || '#666666'}
                        onChange={(e) => updateConfig('ticks.color', e.target.value)}
                        className="sr-only"
                      />
                      <Input
                        value={config?.ticks?.color || '#666666'}
                        onChange={(e) => updateConfig('ticks.color', e.target.value)}
                        className="w-24 h-8 text-xs font-mono uppercase"
                        placeholder="#666666"
                      />
                    </div>
                  </div>
                </div>

                {/* Font Settings */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Font Size</Label>
                    <Input
                      type="number"
                      value={config?.ticks?.font?.size || ''}
                      onChange={(e) => updateNestedConfig('ticks.font', 'size', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="12"
                      className="h-8 text-xs"
                      min={8}
                      max={24}
                      step={1}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Align</Label>
                    <Select
                      value={config?.ticks?.align || 'center'}
                      onValueChange={(value) => updateConfig('ticks.align', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="start">Start</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="end">End</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Rotation</Label>
                  <Input
                    type="number"
                    value={config?.ticks?.minRotation || ''}
                    onChange={(e) => updateConfig('ticks.minRotation', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0°"
                    className="h-8 text-xs"
                    min={0}
                    max={90}
                    step={5}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const [gridAppearanceDropdownOpen, setGridAppearanceDropdownOpen] = useState(false)

  const renderGridTab = () => {
    const lineDashOptions = [
      { label: 'Solid', value: '[]' },
      { label: 'Dashed', value: '[5,5]' },
      { label: 'Dotted', value: '[2,2]' },
      { label: 'Dash-Dot', value: '[5,2,2,2]' },
    ]

    const currentDash = config?.border?.dash || []
    const currentDashStr = JSON.stringify(currentDash)
    const currentDashLabel = lineDashOptions.find(opt => opt.value === currentDashStr)?.label || 'Custom'

    return (
      <div className="space-y-4 overflow-y-auto h-full">
        {/* Grid Lines Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b">
            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
            <h3 className="text-sm font-semibold text-gray-900">Quick Toggles</h3>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 space-y-3 relative overflow-hidden">
            {/* Main Toggles - First Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Show</Label>
                  <Switch
                    checked={config?.grid?.display !== false}
                    onCheckedChange={(checked) => updateConfig('grid.display', checked)}
                    className="data-[state=checked]:bg-gray-600"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Axis Line</Label>
                  <Switch
                    checked={config?.border?.display !== false}
                    onCheckedChange={(checked) => updateConfig('border.display', checked)}
                    className="data-[state=checked]:bg-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Grid Options - Second Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Ref. Lines</Label>
                  <Switch
                    checked={config?.grid?.drawOnChartArea !== false}
                    onCheckedChange={(checked) => updateConfig('grid.drawOnChartArea', checked)}
                    className="data-[state=checked]:bg-gray-600"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Draw Ticks</Label>
                  <Switch
                    checked={config?.grid?.drawTicks !== false}
                    onCheckedChange={(checked) => updateConfig('grid.drawTicks', checked)}
                    className="data-[state=checked]:bg-gray-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        {config?.grid?.display !== false && (
          <div className="space-y-3">
            <div
              className="flex items-center gap-2 pb-1 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
              onClick={() => setGridAppearanceDropdownOpen(!gridAppearanceDropdownOpen)}
            >
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <h3 className="text-sm font-semibold text-gray-900">Appearance</h3>
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
                className={`ml-auto transform transition-transform ${gridAppearanceDropdownOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9L12 15L18 9" />
              </svg>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 space-y-3 relative overflow-hidden">
              {/* Color - Always Visible */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Color</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: config?.grid?.color || '#e5e7eb' }}
                      onClick={() => document.getElementById(`grid-color-${axis}`)?.click()}
                    />
                    <input
                      id={`grid-color-${axis}`}
                      type="color"
                      value={config?.grid?.color || '#e5e7eb'}
                      onChange={(e) => updateConfig('grid.color', e.target.value)}
                      className="sr-only"
                    />
                    <Input
                      value={config?.grid?.color || '#e5e7eb'}
                      onChange={(e) => updateConfig('grid.color', e.target.value)}
                      className="w-24 h-8 text-xs font-mono uppercase"
                      placeholder="#e5e7eb"
                    />
                  </div>
                </div>
              </div>

              {/* Dropdown Content */}
              {gridAppearanceDropdownOpen && (
                <div className="space-y-3 pt-2 border-t border-blue-200 relative z-10 max-h-96 overflow-y-auto">
                  {/* Line Properties */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Line Width</Label>
                      <Input
                        type="number"
                        value={config?.grid?.lineWidth || ''}
                        onChange={(e) => updateConfig('grid.lineWidth', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="1"
                        className="h-8 text-xs"
                        min={0}
                        max={5}
                        step={0.1}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Line Style</Label>
                      <Select
                        value={currentDashStr}
                        onValueChange={(value) => updateConfig('border.dash', JSON.parse(value))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select style">
                            {currentDashLabel}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent position="popper" sideOffset={4}>
                          {lineDashOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Custom Dash Pattern */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-700">Custom Dash Pattern</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">Dash Length</Label>
                        <Input
                          type="number"
                          value={(config?.border?.dash && config?.border?.dash[0]) || ''}
                          onChange={(e) => {
                            const value = e.target.value ? Number(e.target.value) : 0
                            const currentDash = config?.border?.dash || [0, 0]
                            updateConfig('border.dash', [value, currentDash[1] || value])
                          }}
                          placeholder="0"
                          className="h-8 text-xs"
                          min={0}
                          max={20}
                          step={1}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">Gap Length</Label>
                        <Input
                          type="number"
                          value={(config?.border?.dash && config?.border?.dash[1]) || ''}
                          onChange={(e) => {
                            const value = e.target.value ? Number(e.target.value) : 0
                            const currentDash = config?.border?.dash || [0, 0]
                            updateConfig('border.dash', [currentDash[0] || value, value])
                          }}
                          placeholder="0"
                          className="h-8 text-xs"
                          min={0}
                          max={20}
                          step={1}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">Dash Offset</Label>
                        <Input
                          type="number"
                          value={config?.border?.dashOffset || ''}
                          onChange={(e) => updateConfig('border.dashOffset', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="0"
                          className="h-8 text-xs"
                          min={0}
                          max={20}
                          step={1}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Axis Line Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b">
            <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
            <h3 className="text-sm font-semibold text-gray-900">Axis Line</h3>
          </div>

          <div className="bg-orange-50 rounded-lg p-3 space-y-3">
            {/* Color and Width Controls */}
            <div className="grid grid-cols-2 gap-3">
              {/* Color */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Color</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
                    style={{ backgroundColor: config?.border?.color || '#666666' }}
                    onClick={() => document.getElementById(`axis-line-color-${axis}`)?.click()}
                  />
                  <input
                    id={`axis-line-color-${axis}`}
                    type="color"
                    value={config?.border?.color || '#666666'}
                    onChange={(e) => updateConfig('border.color', e.target.value)}
                    className="sr-only"
                  />
                  <Input
                    value={config?.border?.color || '#666666'}
                    onChange={(e) => updateConfig('border.color', e.target.value)}
                    className="h-8 text-xs font-mono uppercase flex-1"
                    placeholder="#666666"
                  />
                </div>
              </div>

              {/* Width */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Width</Label>
                <Input
                  type="number"
                  value={config?.border?.width || ''}
                  onChange={(e) => updateConfig('border.width', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="1"
                  className="h-8 text-xs"
                  min={0}
                  max={10}
                  step={0.5}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderTicksTab = () => (
    <div className="space-y-6 overflow-y-auto overflow-x-hidden h-full pr-0 relative isolate">
      <div className="space-y-6 relative">
        {/* Tick Mark Configuration Section */}
        <div className="space-y-3">
          <div
            className="flex items-center gap-2 pb-1 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
            onClick={() => setTickMarkConfigDropdownOpen(!tickMarkConfigDropdownOpen)}
          >
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <h3 className="text-sm font-semibold text-gray-900">Tick Mark Configuration</h3>
            <div className="ml-auto flex items-center gap-2">
              <div onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={config?.grid?.tickLength !== 0}
                  onCheckedChange={(checked) => updateConfig('grid.tickLength', checked ? 8 : 0)}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
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
                className={`transform transition-transform ${tickMarkConfigDropdownOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9L12 15L18 9" />
              </svg>
            </div>
          </div>

          {/* Dropdown Content */}
          {tickMarkConfigDropdownOpen && (
            <div className="bg-green-50 rounded-lg p-3 space-y-3 relative overflow-hidden max-h-96 overflow-y-auto">
              {/* Color */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Color</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: config?.grid?.tickColor || '#666666' }}
                      onClick={() => document.getElementById(`grid-tick-color-${axis}`)?.click()}
                    />
                    <input
                      id={`grid-tick-color-${axis}`}
                      type="color"
                      value={config?.grid?.tickColor || '#666666'}
                      onChange={(e) => updateConfig('grid.tickColor', e.target.value)}
                      className="sr-only"
                    />
                    <Input
                      value={config?.grid?.tickColor || '#666666'}
                      onChange={(e) => updateConfig('grid.tickColor', e.target.value)}
                      className="w-24 h-8 text-xs font-mono uppercase"
                      placeholder="#666666"
                    />
                  </div>
                </div>
              </div>

              {/* Tick Width and Tick Length */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Tick Width</Label>
                  <Input
                    type="number"
                    value={config?.grid?.tickWidth || ''}
                    onChange={(e) => updateConfig('grid.tickWidth', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="1"
                    className="h-8 text-xs"
                    min={0}
                    max={10}
                    step={0.5}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Tick Length</Label>
                  <Input
                    type="number"
                    value={config?.grid?.tickLength || ''}
                    onChange={(e) => updateConfig('grid.tickLength', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="6"
                    className="h-8 text-xs"
                    min={0}
                    max={20}
                    step={1}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tick Configuration Section */}
        <div className="space-y-3">
          <div
            className="flex items-center gap-2 pb-1 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
            onClick={() => setTickConfigDropdownOpen(!tickConfigDropdownOpen)}
          >
            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
            <h3 className="text-sm font-semibold text-gray-900">Tick Configuration</h3>
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
              className={`ml-auto transform transition-transform ${tickConfigDropdownOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9" />
            </svg>
          </div>

          {/* Dropdown Content */}
          {tickConfigDropdownOpen && (
            <div className="bg-purple-50 rounded-lg p-3 space-y-3 relative overflow-hidden">
              {/* Limits */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Max Ticks Limit</Label>
                  <Input
                    type="number"
                    value={config?.ticks?.maxTicksLimit || ''}
                    onChange={(e) => updateConfig('ticks.maxTicksLimit', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="11"
                    className="h-8 text-xs"
                    min={2}
                    max={20}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Step Size</Label>
                  <Input
                    type="number"
                    value={config?.ticks?.stepSize || ''}
                    onChange={(e) => updateConfig('ticks.stepSize', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Auto"
                    className="h-8 text-xs"
                    min={0}
                    step={0.1}
                  />
                </div>
              </div>

              {/* Min/Max Values */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Min Value</Label>
                  <Input
                    type="number"
                    value={config?.min ?? ''}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : undefined
                      console.log(`Setting ${axis} axis min to:`, value)
                      updateConfig('min', value)
                    }}
                    placeholder="Auto"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Max Value</Label>
                  <Input
                    type="number"
                    value={config?.max ?? ''}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : undefined
                      console.log(`Setting ${axis} axis max to:`, value)
                      updateConfig('max', value)
                    }}
                    placeholder="Auto"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Note about numeric scales */}
              {(config?.type === 'category' || config?.type === 'time') && (
                <div className="px-3 py-2 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-yellow-700 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    Min/Max values only work with numeric scales (Linear, Logarithmic). Current type: {config?.type || 'category'}
                  </p>
                </div>
              )}

              {/* Auto Skip Settings */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Auto Skip</Label>
                  <Switch
                    checked={config?.ticks?.autoSkip !== false}
                    onCheckedChange={(checked) => updateConfig('ticks.autoSkip', checked)}
                  />
                </div>

                {config?.ticks?.autoSkip !== false && (
                  <div className="pl-3 space-y-1">
                    <Label className="text-xs font-medium">Auto Skip Padding</Label>
                    <Input
                      type="number"
                      value={config?.ticks?.autoSkipPadding || ''}
                      onChange={(e) => updateConfig('ticks.autoSkipPadding', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="3"
                      className="h-8 text-xs"
                      min={0}
                      max={10}
                    />
                  </div>
                )}
              </div>

              {/* Padding Settings */}
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Padding</Label>
                  <Input
                    type="number"
                    value={config?.ticks?.padding || ''}
                    onChange={(e) => updateConfig('ticks.padding', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="8"
                    className="h-8 text-xs"
                    min={0}
                    max={20}
                    step={1}
                  />
                </div>
              </div>

              {/* Cross Align and Mirror Settings */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Cross Align</Label>
                  <Select
                    value={config?.ticks?.crossAlign || 'near'}
                    onValueChange={(value) => updateConfig('ticks.crossAlign', value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="near">Near</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="far">Far</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Mirror</Label>
                  <div className="h-8 flex items-center">
                    <Switch
                      checked={!!config?.ticks?.mirror}
                      onCheckedChange={(checked) => updateConfig('ticks.mirror', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Major Ticks Section */}
        <div className="space-y-3">
          <div
            className="flex items-center gap-2 pb-1 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
            onClick={() => setMajorTicksDropdownOpen(!majorTicksDropdownOpen)}
          >
            <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
            <h3 className="text-sm font-semibold text-gray-900">Major Ticks</h3>
            <div className="ml-auto flex items-center gap-2">
              <div onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={!!config?.ticks?.major?.enabled}
                  onCheckedChange={(checked) => updateNestedConfig('ticks.major', 'enabled', checked)}
                  className="data-[state=checked]:bg-orange-600"
                />
              </div>
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
                className={`transform transition-transform ${majorTicksDropdownOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9L12 15L18 9" />
              </svg>
            </div>
          </div>

          {/* Dropdown Content */}
          {majorTicksDropdownOpen && (
            <div className="bg-orange-50 rounded-lg p-3 space-y-3 relative overflow-hidden max-h-96 overflow-y-auto">
              {/* Color */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Color</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: config?.ticks?.major?.color || '#000000' }}
                      onClick={() => document.getElementById(`major-tick-color-${axis}`)?.click()}
                    />
                    <input
                      id={`major-tick-color-${axis}`}
                      type="color"
                      value={config?.ticks?.major?.color || '#000000'}
                      onChange={(e) => updateNestedConfig('ticks.major', 'color', e.target.value)}
                      className="sr-only"
                    />
                    <Input
                      value={config?.ticks?.major?.color || '#000000'}
                      onChange={(e) => updateNestedConfig('ticks.major', 'color', e.target.value)}
                      className="w-24 h-8 text-xs font-mono uppercase"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>

              {/* Font Settings */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Font Size</Label>
                  <Input
                    type="number"
                    value={config?.ticks?.major?.font?.size || ''}
                    onChange={(e) => updateNestedConfig('ticks.major.font', 'size', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="14"
                    className="h-8 text-xs"
                    min={8}
                    max={24}
                    step={1}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Font Weight</Label>
                  <Select
                    value={config?.ticks?.major?.font?.weight || 'bold'}
                    onValueChange={(value) => updateNestedConfig('ticks.major.font', 'weight', value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="400">Normal</SelectItem>
                      <SelectItem value="600">Bold</SelectItem>
                      <SelectItem value="900">Bolder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Font Style</Label>
                <Select
                  value={config?.ticks?.major?.fontStyle || 'bold'}
                  onValueChange={(value) => updateNestedConfig('ticks.major', 'fontStyle', value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="italic">Italic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderOthersTab = () => (
    <div className="space-y-4 overflow-y-auto h-full">
      {/* Scale Configuration Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900">Scale Configuration</h3>
        </div>

        <div className="bg-purple-50 rounded-lg p-3 space-y-3 relative overflow-hidden">
          {/* Scale Bounds */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Scale Bounds</Label>
            <Select
              value={config?.bounds || 'ticks'}
              onValueChange={(value) => updateConfig('bounds', value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select bounds" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                <SelectItem value="ticks">Ticks</SelectItem>
                <SelectItem value="data">Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grace */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Grace</Label>
            <Input
              type="number"
              value={config?.grace ?? 5}
              onChange={(e) => updateConfig('grace', e.target.value ? Number(e.target.value) : 5)}
              placeholder="5"
              className="h-8 text-xs"
              min={0}
              step={0.1}
            />
          </div>
        </div>
      </div>

    </div>
  )

  const renderTabContent = (tab: AxisTab) => {
    switch (tab) {
      case 'general':
        return renderGeneralTab()
      case 'grid':
        return renderGridTab()
      case 'ticks':
        return renderTicksTab()
      case 'others':
        return renderOthersTab()
      default:
        return null
    }
  }

  const renderTabButton = useCallback((tab: AxisTab, icon: React.ReactNode, isCompact = false) => (
    <button
      key={tab}
      className={cn(
        "relative flex items-center gap-1 h-8 font-medium transition-all duration-200 flex-shrink-0 rounded-md",
        isCompact ? "px-2 text-xs" : "px-3 text-sm gap-1.5 h-9",
        "hover:text-foreground text-muted-foreground hover:bg-gray-100",
        activeTab === tab && "text-white shadow-sm"
      )}
      style={activeTab === tab ? { backgroundColor: 'rgb(55, 65, 81)' } : {}}
      onClick={() => setActiveTab(tab)}
    >
      {icon}
      {!isCompact && <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>}
    </button>
  ), [activeTab])

  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      {/* Tab Navigation with Better Overflow Handling */}
      <div className="flex items-center border-b bg-white relative">
        {/* Scrollable Tab Container */}
        <div
          className="flex items-center overflow-x-auto flex-1 px-2"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent'
          }}
        >
          <div className="flex items-center gap-1 min-w-max py-1">
            {/* Full tabs for larger screens */}
            <div className="hidden md:flex items-center gap-1">
              {renderTabButton('general', <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>)}
              {renderTabButton('grid', <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></svg>)}
              {renderTabButton('ticks', <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 20h13" /><path d="M12 14h13" /><path d="M3 4h13" /><path d="M3 10h13" /><path d="M3 16h7" /><path d="M3 22h7" /></svg>)}
              {renderTabButton('others', <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>)}
            </div>

            {/* Compact icon-only tabs for smaller screens */}
            <div className="flex md:hidden items-center gap-0.5">
              {renderTabButton('general', <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>, true)}
              {renderTabButton('grid', <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></svg>, true)}
              {renderTabButton('ticks', <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 20h13" /><path d="M12 14h13" /><path d="M3 4h13" /><path d="M3 10h13" /><path d="M3 16h7" /><path d="M3 22h7" /></svg>, true)}
              {renderTabButton('others', <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>, true)}
            </div>
          </div>
        </div>

        {/* Scroll Indicators */}
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none opacity-50"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {renderTabContent(activeTab)}
      </div>
    </div>
  )
}
