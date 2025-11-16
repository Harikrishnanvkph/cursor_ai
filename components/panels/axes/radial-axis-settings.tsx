"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RadialAxisSettingsProps {
  config: any
  onUpdate: (path: string, value: any) => void
  className?: string
}

type RadialAxisTab = 'general' | 'grid' | 'ticks' | 'labels'

export function RadialAxisSettings({ config, onUpdate, className }: RadialAxisSettingsProps) {
  const [activeTab, setActiveTab] = useState<RadialAxisTab>('general')
  const [gridDropdownOpen, setGridDropdownOpen] = useState(false)
  const [ticksDropdownOpen, setTicksDropdownOpen] = useState(false)
  const [labelsDropdownOpen, setLabelsDropdownOpen] = useState(false)
  const [angleLinesDropdownOpen, setAngleLinesDropdownOpen] = useState(false)

  const updateConfig = (path: string, value: any) => {
    onUpdate(`scales.r.${path}`, value)
  }

  const updateNestedConfig = (basePath: string, path: string, value: any) => {
    updateConfig(`${basePath}.${path}`, value)
  }

  const renderGeneralTab = () => (
    <div className="space-y-4">
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
    </div>
  )

  const renderGridTab = () => (
    <div className="space-y-4">
      {/* Grid Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900">Grid Lines</h3>
          <div className="ml-auto flex items-center gap-2">
            <Switch
              checked={config?.grid?.display !== false}
              onCheckedChange={(checked) => updateConfig('grid.display', checked)}
              className="data-[state=checked]:bg-purple-600"
              aria-label="Toggle grid lines"
            />
          <button
            onClick={() => setGridDropdownOpen(!gridDropdownOpen)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label={gridDropdownOpen ? "Collapse grid options" : "Expand grid options"}
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
              className={`transform transition-transform ${gridDropdownOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9"/>
            </svg>
          </button>
          </div>
        </div>
        
        {config?.grid?.display === false ? (
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-xs text-purple-700">Grid lines are hidden. Toggle the switch above to enable styling options.</p>
              </div>
        ) : gridDropdownOpen ? (
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="space-y-3 pt-1">
              {/* Circular Grid */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Circular Grid</Label>
                <Switch
                    checked={config?.grid?.circular === true}
                    onCheckedChange={(checked) => updateConfig('grid.circular', checked)}
                  className="data-[state=checked]:bg-purple-600"
                />
            </div>
          </div>
          
              {/* Color and Line Width on same line */}
              <div className="grid grid-cols-2 gap-3">
                {/* Grid Color - Stacked: label above, color picker below */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Color</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
                      style={{ backgroundColor: config?.grid?.color || '#e5e7eb' }}
                      onClick={() => document.getElementById('grid-color')?.click()}
                    />
                    <input
                      id="grid-color"
                      type="color"
                      value={config?.grid?.color || '#e5e7eb'}
                      onChange={(e) => updateConfig('grid.color', e.target.value)}
                      className="sr-only"
                    />
                    <Input
                      value={config?.grid?.color || '#e5e7eb'}
                      onChange={(e) => updateConfig('grid.color', e.target.value)}
                      className="flex-1 h-8 text-xs font-mono uppercase"
                      placeholder="#e5e7eb"
                    />
                  </div>
                </div>

                {/* Grid Line Width - Stacked: label above, input below */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Line Width</Label>
                  <Input
                    type="number"
                    value={config?.grid?.lineWidth || 1}
                    onChange={(e) => updateConfig('grid.lineWidth', e.target.value ? Number(e.target.value) : 1)}
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
        ) : null}
      </div>

      {/* Angle Lines Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-red-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900">Angle Lines</h3>
          <div className="ml-auto flex items-center gap-2">
            <Switch
              checked={config?.angleLines?.display !== false}
              onCheckedChange={(checked) => updateConfig('angleLines.display', checked)}
              className="data-[state=checked]:bg-red-600"
              aria-label="Toggle angle lines"
            />
            <button
              onClick={() => setAngleLinesDropdownOpen(!angleLinesDropdownOpen)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label={angleLinesDropdownOpen ? "Collapse angle lines options" : "Expand angle lines options"}
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
                className={`transform transition-transform ${angleLinesDropdownOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9L12 15L18 9"/>
              </svg>
            </button>
          </div>
        </div>
        
        {config?.angleLines?.display === false ? (
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-xs text-red-700">Angle lines are hidden. Toggle the switch above to enable styling options.</p>
          </div>
        ) : angleLinesDropdownOpen ? (
          <div className="bg-red-50 rounded-lg p-3">
            <div className="space-y-3 pt-1">
              {/* Angle Lines Color */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Color</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: config?.angleLines?.color || '#e5e7eb' }}
                      onClick={() => document.getElementById('angle-color')?.click()}
                    />
                    <input
                      id="angle-color"
                      type="color"
                      value={config?.angleLines?.color || '#e5e7eb'}
                      onChange={(e) => updateConfig('angleLines.color', e.target.value)}
                      className="sr-only"
                    />
                    <Input
                      value={config?.angleLines?.color || '#e5e7eb'}
                      onChange={(e) => updateConfig('angleLines.color', e.target.value)}
                      className="w-24 h-8 text-xs font-mono uppercase"
                      placeholder="#e5e7eb"
                    />
                  </div>
                </div>
              </div>

              {/* Line Width */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Line Width</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[config?.angleLines?.lineWidth || 1]}
                    onValueChange={([value]) => updateConfig('angleLines.lineWidth', value)}
                    max={10}
                    min={0}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs font-mono w-8 text-center">
                    {config?.angleLines?.lineWidth || 1}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )

  const renderTicksTab = () => (
    <div className="space-y-4">
      {/* Ticks Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900">Scale Ticks</h3>
          <button
            onClick={() => setTicksDropdownOpen(!ticksDropdownOpen)}
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
              className={`transform transition-transform ${ticksDropdownOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9"/>
            </svg>
          </button>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-3 space-y-3">
          {/* Show Ticks Toggle */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Show Ticks</Label>
              <Switch
                checked={config?.ticks?.display !== false}
                onCheckedChange={(checked) => updateConfig('ticks.display', checked)}
                className="data-[state=checked]:bg-orange-600"
              />
            </div>
          </div>
          
          {/* Dropdown Content */}
          {ticksDropdownOpen && (
            <div className="space-y-3 pt-2 border-t border-orange-200">
              {/* Tick Color */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Color</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: config?.ticks?.color || '#666666' }}
                      onClick={() => document.getElementById('tick-color')?.click()}
                    />
                    <input
                      id="tick-color"
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

              {/* Backdrop Color */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Backdrop Color</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: config?.ticks?.backdropColor || 'rgba(255, 255, 255, 0.8)' }}
                      onClick={() => document.getElementById('backdrop-color')?.click()}
                    />
                    <input
                      id="backdrop-color"
                      type="color"
                      value={config?.ticks?.backdropColor || 'rgba(255, 255, 255, 0.8)'}
                      onChange={(e) => updateConfig('ticks.backdropColor', e.target.value)}
                      className="sr-only"
                    />
                    <Input
                      value={config?.ticks?.backdropColor || 'rgba(255, 255, 255, 0.8)'}
                      onChange={(e) => updateConfig('ticks.backdropColor', e.target.value)}
                      className="w-24 h-8 text-xs font-mono uppercase"
                      placeholder="rgba(255, 255, 255, 0.8)"
                    />
                  </div>
                </div>
              </div>

              {/* Backdrop Padding */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Backdrop Padding</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[config?.ticks?.backdropPadding || 4]}
                    onValueChange={([value]) => updateConfig('ticks.backdropPadding', value)}
                    max={20}
                    min={0}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs font-mono w-8 text-center">
                    {config?.ticks?.backdropPadding || 4}
                  </span>
                </div>
              </div>

              {/* Step Size */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Step Size</Label>
                <Input
                  type="number"
                  value={config?.ticks?.stepSize || ''}
                  onChange={(e) => updateConfig('ticks.stepSize', e.target.value === '' ? undefined : Number(e.target.value))}
                  placeholder="Auto"
                  className="h-8 text-xs"
                />
                <p className="text-xs text-gray-500">Leave empty for automatic step size</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderLabelsTab = () => (
    <div className="space-y-4">
      {/* Point Labels Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900">Point Labels</h3>
          <button
            onClick={() => setLabelsDropdownOpen(!labelsDropdownOpen)}
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
              className={`transform transition-transform ${labelsDropdownOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9"/>
            </svg>
          </button>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3 space-y-3">
          {/* Show Labels Toggle */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Show Labels</Label>
              <Switch
                checked={config?.pointLabels?.display !== false}
                onCheckedChange={(checked) => updateConfig('pointLabels.display', checked)}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>
          
          {/* Dropdown Content */}
          {labelsDropdownOpen && (
            <div className="space-y-3 pt-2 border-t border-blue-200">
              {/* Label Color */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Color</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: config?.pointLabels?.color || '#666666' }}
                      onClick={() => document.getElementById('label-color')?.click()}
                    />
                    <input
                      id="label-color"
                      type="color"
                      value={config?.pointLabels?.color || '#666666'}
                      onChange={(e) => updateConfig('pointLabels.color', e.target.value)}
                      className="sr-only"
                    />
                    <Input
                      value={config?.pointLabels?.color || '#666666'}
                      onChange={(e) => updateConfig('pointLabels.color', e.target.value)}
                      className="w-24 h-8 text-xs font-mono uppercase"
                      placeholder="#666666"
                    />
                  </div>
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Font Size</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[config?.pointLabels?.font?.size || 12]}
                    onValueChange={([value]) => updateConfig('pointLabels.font.size', value)}
                    max={24}
                    min={8}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs font-mono w-8 text-center">
                    {config?.pointLabels?.font?.size || 12}
                  </span>
                </div>
              </div>

              {/* Padding */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Padding</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[config?.pointLabels?.padding || 20]}
                    onValueChange={([value]) => updateConfig('pointLabels.padding', value)}
                    max={50}
                    min={0}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs font-mono w-8 text-center">
                    {config?.pointLabels?.padding || 20}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderTabContent = (tab: RadialAxisTab) => {
    switch (tab) {
      case 'general':
        return renderGeneralTab()
      case 'grid':
        return renderGridTab()
      case 'ticks':
        return renderTicksTab()
      case 'labels':
        return renderLabelsTab()
      default:
        return renderGeneralTab()
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Tabs - Horizontally Scrollable */}
      <div className="overflow-x-auto">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg min-w-min">
          {(['general', 'grid', 'ticks', 'labels'] as RadialAxisTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
                "flex-shrink-0 text-sm font-semibold py-2.5 px-4 rounded-md transition-colors whitespace-nowrap",
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
              {tab === 'angleLines' ? 'Angle Lines' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {renderTabContent(activeTab)}
      </div>
    </div>
  )
} 