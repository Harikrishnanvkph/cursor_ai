"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface RadialAxisSettingsProps {
  config: any
  onUpdate: (path: string, value: any) => void
  chartType: string
  className?: string
}

export function RadialAxisSettings({ config, onUpdate, chartType, className }: RadialAxisSettingsProps) {
  const [gridDropdownOpen, setGridDropdownOpen] = useState(false)
  const [ticksDropdownOpen, setTicksDropdownOpen] = useState(false)
  const [labelsDropdownOpen, setLabelsDropdownOpen] = useState(false)
  const [angleLinesDropdownOpen, setAngleLinesDropdownOpen] = useState(false)

  const updateConfig = (path: string, value: any) => {
    onUpdate(`scales.r.${path}`, value)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Toggle */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
        <div className="space-y-1">
          <Label className="text-sm font-medium text-green-900">Show Radial Axis</Label>
        </div>
        <Switch
          checked={config?.display !== false}
          onCheckedChange={(checked) => updateConfig('display', checked)}
          className="data-[state=checked]:bg-green-600"
        />
      </div>

      {config?.display !== false && (
        <div className="space-y-4">
          {/* Begin at Zero */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Begin at Zero</Label>
              <Switch
                checked={config?.beginAtZero !== false}
                onCheckedChange={(checked) => updateConfig('beginAtZero', checked)}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>

          {/* Min/Max Values */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Minimum Value</Label>
              <Input
                type="number"
                value={config?.min || ''}
                onChange={(e) => updateConfig('min', e.target.value === '' ? undefined : Number(e.target.value))}
                placeholder="Auto"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Maximum Value</Label>
              <Input
                type="number"
                value={config?.max || ''}
                onChange={(e) => updateConfig('max', e.target.value === '' ? undefined : Number(e.target.value))}
                placeholder="Auto"
                className="h-9"
              />
            </div>
          </div>
        </div>
      )}

      {/* Grid Lines Section */}
      <div className="space-y-2">
        <div
          className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
          onClick={() => setGridDropdownOpen(!gridDropdownOpen)}
        >
          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900 flex-1">Grid Lines</h3>
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={config?.grid?.display !== false}
              onCheckedChange={(checked) => updateConfig('grid.display', checked)}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
          <div className="ml-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${gridDropdownOpen ? 'rotate-180' : ''}`}>
              <path d="M6 9L12 15L18 9" />
            </svg>
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg">
          {gridDropdownOpen && (
            <div className={`px-3 py-3 space-y-3 ${config?.grid?.display === false ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Circular Grid</Label>
                  <Switch
                    checked={chartType === 'polarArea' ? config?.grid?.circular !== false : config?.grid?.circular === true}
                    onCheckedChange={(checked) => updateConfig('grid.circular', checked)}
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Line Width</Label>
                  <Input
                    type="number"
                    value={config?.grid?.lineWidth || 1}
                    onChange={(e) => updateConfig('grid.lineWidth', e.target.value ? Number(e.target.value) : 1)}
                    className="h-8 text-xs"
                    min={0}
                    max={10}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Color</Label>
                <Input
                  type="color"
                  value={config?.grid?.color || '#e5e7eb'}
                  onChange={(e) => updateConfig('grid.color', e.target.value)}
                  className="h-8 w-full cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Angle Lines Section */}
      <div className="space-y-2">
        <div
          className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
          onClick={() => setAngleLinesDropdownOpen(!angleLinesDropdownOpen)}
        >
          <div className="w-2 h-2 bg-red-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900 flex-1">Angle Lines</h3>
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={chartType === 'polarArea' ? config?.angleLines?.display === true : config?.angleLines?.display !== false}
              onCheckedChange={(checked) => updateConfig('angleLines.display', checked)}
              className="data-[state=checked]:bg-red-600"
            />
          </div>
          <div className="ml-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${angleLinesDropdownOpen ? 'rotate-180' : ''}`}>
              <path d="M6 9L12 15L18 9" />
            </svg>
          </div>
        </div>
        <div className="bg-red-50 rounded-lg">
          {angleLinesDropdownOpen && (
            <div className={`px-3 py-3 ${(chartType === 'polarArea' ? config?.angleLines?.display !== true : config?.angleLines?.display === false) ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Color</Label>
                  <Input
                    type="color"
                    value={config?.angleLines?.color || '#e5e7eb'}
                    onChange={(e) => updateConfig('angleLines.color', e.target.value)}
                    className="h-8 w-full cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Line Width</Label>
                  <Input
                    type="number"
                    value={config?.angleLines?.lineWidth ?? 1}
                    onChange={(e) => updateConfig('angleLines.lineWidth', e.target.value === '' ? 1 : Number(e.target.value))}
                    className="h-8 text-xs"
                    min={0}
                    max={10}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Point Labels Section */}
      <div className="space-y-2">
        <div
          className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
          onClick={() => setLabelsDropdownOpen(!labelsDropdownOpen)}
        >
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900 flex-1">Point Labels</h3>
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={chartType === 'polarArea' ? config?.pointLabels?.display === true : config?.pointLabels?.display !== false}
              onCheckedChange={(checked) => updateConfig('pointLabels.display', checked)}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
          <div className="ml-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${labelsDropdownOpen ? 'rotate-180' : ''}`}>
              <path d="M6 9L12 15L18 9" />
            </svg>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg">
          {labelsDropdownOpen && (
            <div className={`px-3 py-3 space-y-3 ${(chartType === 'polarArea' ? config?.pointLabels?.display !== true : config?.pointLabels?.display === false) ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Color</Label>
                  <Input
                    type="color"
                    value={config?.pointLabels?.color || '#666666'}
                    onChange={(e) => updateConfig('pointLabels.color', e.target.value)}
                    className="h-8 w-full cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Font Size</Label>
                  <Input
                    type="number"
                    value={config?.pointLabels?.font?.size ?? 12}
                    onChange={(e) => updateConfig('pointLabels.font.size', e.target.value === '' ? 12 : Number(e.target.value))}
                    className="h-8 text-xs"
                    min={8}
                    max={24}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Padding</Label>
                <Input
                  type="number"
                  value={config?.pointLabels?.padding ?? 20}
                  onChange={(e) => updateConfig('pointLabels.padding', e.target.value === '' ? 20 : Number(e.target.value))}
                  className="h-8 text-xs"
                  min={0}
                  max={50}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scale Ticks Section */}
      <div className="space-y-2">
        <div
          className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
          onClick={() => setTicksDropdownOpen(!ticksDropdownOpen)}
        >
          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900 flex-1">Scale Ticks</h3>
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={config?.ticks?.display !== false}
              onCheckedChange={(checked) => updateConfig('ticks.display', checked)}
              className="data-[state=checked]:bg-orange-600"
            />
          </div>
          <div className="ml-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${ticksDropdownOpen ? 'rotate-180' : ''}`}>
              <path d="M6 9L12 15L18 9" />
            </svg>
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg">
          {ticksDropdownOpen && (
            <div className={`px-3 py-3 space-y-3 ${config?.ticks?.display === false ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Row 0: Show Above Chart and Show Backdrop */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Show Above Chart</Label>
                  <Switch
                    checked={(config?.ticks?.z ?? 1) > 0}
                    onCheckedChange={(checked) => updateConfig('ticks.z', checked ? 10 : 0)}
                    className="data-[state=checked]:bg-orange-600"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Show Backdrop</Label>
                  <Switch
                    checked={config?.ticks?.showLabelBackdrop !== false}
                    onCheckedChange={(checked) => updateConfig('ticks.showLabelBackdrop', checked)}
                    className="data-[state=checked]:bg-orange-600"
                  />
                </div>
              </div>

              {/* Row 1: Color and Backdrop Color */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Color</Label>
                  <Input
                    type="color"
                    value={config?.ticks?.color || '#666666'}
                    onChange={(e) => updateConfig('ticks.color', e.target.value)}
                    className="h-8 w-full cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Backdrop Color</Label>
                  <Input
                    type="color"
                    value={config?.ticks?.backdropColor || '#ffffff'}
                    onChange={(e) => updateConfig('ticks.backdropColor', e.target.value)}
                    className="h-8 w-full cursor-pointer"
                  />
                </div>
              </div>

              {/* Row 2: Backdrop Padding and Step Size */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Backdrop Padding</Label>
                  <Input
                    type="number"
                    value={config?.ticks?.backdropPadding ?? 4}
                    onChange={(e) => updateConfig('ticks.backdropPadding', e.target.value === '' ? 4 : Number(e.target.value))}
                    className="h-8 text-xs"
                    min={0}
                    max={20}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Step Size</Label>
                  <Input
                    type="number"
                    value={config?.ticks?.stepSize || ''}
                    onChange={(e) => updateConfig('ticks.stepSize', e.target.value === '' ? undefined : Number(e.target.value))}
                    placeholder="Auto"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Row 3: Font Size and Font Family */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Font Size</Label>
                  <Input
                    type="number"
                    value={config?.ticks?.font?.size ?? 12}
                    onChange={(e) => updateConfig('ticks.font.size', e.target.value === '' ? 12 : Number(e.target.value))}
                    className="h-8 text-xs"
                    min={8}
                    max={24}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Font Family</Label>
                  <Select
                    value={config?.ticks?.font?.family || 'Arial'}
                    onValueChange={(value) => updateConfig('ticks.font.family', value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Verdana">Verdana</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Courier New">Courier New</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 4: Font Weight and Font Style */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Font Weight</Label>
                  <Select
                    value={config?.ticks?.font?.weight?.toString() || 'normal'}
                    onValueChange={(value) => updateConfig('ticks.font.weight', value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300">Light</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="800">Extra Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Font Style</Label>
                  <Select
                    value={config?.ticks?.font?.style || 'normal'}
                    onValueChange={(value) => updateConfig('ticks.font.style', value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="italic">Italic</SelectItem>
                      <SelectItem value="oblique">Oblique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}