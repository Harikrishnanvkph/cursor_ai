"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useChartStore } from "@/lib/chart-store"
import { Type, Tag, Hash, AlignLeft } from "lucide-react"
import type { SupportedChartType } from "@/lib/chart-store"

export function LabelsPanel() {
  const { chartConfig, updateChartConfig, chartData, chartType } = useChartStore()

  // Helper to update customLabelsConfig in chartConfig
  const handleCustomLabelConfigUpdate = (path: string, value: any) => {
    const keys = path.split(".")
    const newConfig = { ...chartConfig }
    if (!newConfig.plugins) newConfig.plugins = {}
    if (!newConfig.plugins.customLabelsConfig) newConfig.plugins.customLabelsConfig = {}
    let current = newConfig.plugins.customLabelsConfig
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {}
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = value
    updateChartConfig(newConfig)
  }

  // Read current custom label config
  const customLabelsConfig = ((chartConfig.plugins as any)?.customLabelsConfig) || {};

  return (
    <div className="space-y-4">
      <Tabs defaultValue="data-labels" className="w-full">
        <TabsList className="grid w-full grid-cols-3 text-xs">
          <TabsTrigger value="data-labels">Data</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
          <TabsTrigger value="format">Format</TabsTrigger>
        </TabsList>

        <TabsContent value="data-labels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Type className="h-4 w-4" />
                Data Labels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={customLabelsConfig.display !== false}
                  onCheckedChange={(checked) => handleCustomLabelConfigUpdate("display", checked)}
                />
                <Label>Show Data Labels</Label>
              </div>

              <div>
                <Label>Label Content</Label>
                <Select
                  value={customLabelsConfig.labelContent || "value"}
                  onValueChange={(value) => handleCustomLabelConfigUpdate("labelContent", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="label">Label</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="index">Index</SelectItem>
                    <SelectItem value="dataset">Dataset Label</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Position (Anchor)</Label>
                <Select
                  value={customLabelsConfig.anchor || "center"}
                  onValueChange={(value) => handleCustomLabelConfigUpdate("anchor", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="callout">CallOut with Arrow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Shape</Label>
                <Select
                  value={(customLabelsConfig.shape || 'none')}
                  onValueChange={(value) => handleCustomLabelConfigUpdate("shape", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rectangle">Rectangle</SelectItem>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="star">Star</SelectItem>
                    <SelectItem value="none">None (No Background)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Font Size</Label>
                <Slider
                  value={[customLabelsConfig.fontSize || 14]}
                  onValueChange={([value]) => handleCustomLabelConfigUpdate("fontSize", value)}
                  max={24}
                  min={8}
                  step={1}
                />
                <div className="text-xs text-gray-500 mt-1">{customLabelsConfig.fontSize || 14}px</div>
              </div>

              <div>
                <Label>Font Weight</Label>
                <Select
                  value={customLabelsConfig.fontWeight || "bold"}
                  onValueChange={(value) => handleCustomLabelConfigUpdate("fontWeight", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Bold" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="lighter">Lighter</SelectItem>
                    <SelectItem value="bolder">Bolder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Font Family</Label>
                <Select
                  value={customLabelsConfig.fontFamily || "Arial"}
                  onValueChange={(value) => handleCustomLabelConfigUpdate("fontFamily", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Arial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times">Times New Roman</SelectItem>
                    <SelectItem value="Courier">Courier New</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                    <SelectItem value="Impact">Impact</SelectItem>
                    <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Label Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={customLabelsConfig.color || "#000000"}
                    onChange={(e) => handleCustomLabelConfigUpdate("color", e.target.value)}
                    className="w-10 h-8 rounded border"
                  />
                  <Input
                    value={customLabelsConfig.color || "#000000"}
                    onChange={(e) => handleCustomLabelConfigUpdate("color", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label>Background Color</Label>
                <input
                  type="color"
                  value={customLabelsConfig.backgroundColor || "#ffffff"}
                  onChange={(e) => handleCustomLabelConfigUpdate("backgroundColor", e.target.value)}
                  className="w-10 h-8 rounded border"
                  disabled={(customLabelsConfig.shape === 'none')}
                />
              </div>

              <div>
                <Label>Border Color</Label>
                <input
                  type="color"
                  value={customLabelsConfig.borderColor || "#000000"}
                  onChange={(e) => handleCustomLabelConfigUpdate("borderColor", e.target.value)}
                  className="w-10 h-8 rounded border"
                  disabled={(customLabelsConfig.shape === 'none')}
                />
              </div>

              <div>
                <Label>Border Width</Label>
                <Slider
                  value={[customLabelsConfig.borderWidth || 2]}
                  onValueChange={([value]) => handleCustomLabelConfigUpdate("borderWidth", value)}
                  max={8}
                  min={0}
                  step={1}
                  disabled={(customLabelsConfig.shape === 'none')}
                />
                <div className="text-xs text-gray-500 mt-1">{customLabelsConfig.borderWidth || 2}px</div>
              </div>

              <div>
                <Label>Border Radius</Label>
                <Slider
                  value={[customLabelsConfig.borderRadius || 6]}
                  onValueChange={([value]) => handleCustomLabelConfigUpdate("borderRadius", value)}
                  max={20}
                  min={0}
                  step={1}
                  disabled={(customLabelsConfig.shape === 'none')}
                />
                <div className="text-xs text-gray-500 mt-1">{customLabelsConfig.borderRadius || 6}px</div>
              </div>

              <div>
                <Label>Padding</Label>
                <Slider
                  value={[customLabelsConfig.padding || 6]}
                  onValueChange={([value]) => handleCustomLabelConfigUpdate("padding", value)}
                  max={20}
                  min={0}
                  step={1}
                  disabled={(customLabelsConfig.shape === 'none')}
                />
                <div className="text-xs text-gray-500 mt-1">{customLabelsConfig.padding || 6}px</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Custom Labels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Prefix</Label>
                <Input
                  value={customLabelsConfig.prefix || ""}
                  onChange={(e) => handleCustomLabelConfigUpdate("prefix", e.target.value)}
                  placeholder="e.g., $, #, @"
                />
              </div>

              <div>
                <Label>Suffix</Label>
                <Input
                  value={customLabelsConfig.suffix || ""}
                  onChange={(e) => handleCustomLabelConfigUpdate("suffix", e.target.value)}
                  placeholder="e.g., %, °C, units, K"
                />
              </div>

              <div>
                <Label>Thousands Separator</Label>
                <Input 
                  value={customLabelsConfig.thousandsSeparator || ","}
                  onChange={(e) => handleCustomLabelConfigUpdate("thousandsSeparator", e.target.value)}
                  placeholder="," 
                />
              </div>

              <div>
                <Label>Decimal Separator</Label>
                <Input 
                  value={customLabelsConfig.decimalSeparator || "."}
                  onChange={(e) => handleCustomLabelConfigUpdate("decimalSeparator", e.target.value)}
                  placeholder="." 
                />
              </div>

              <div>
                <Label>Decimal Places</Label>
                <Select
                  value={String(customLabelsConfig.decimals || 0)}
                  onValueChange={(value) => handleCustomLabelConfigUpdate("decimals", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Number Format</Label>
                <Select
                  value={customLabelsConfig.numberFormat || "default"}
                  onValueChange={(value) => handleCustomLabelConfigUpdate("numberFormat", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="percent">Percentage</SelectItem>
                    <SelectItem value="scientific">Scientific</SelectItem>
                    <SelectItem value="compact">Compact (1K, 1M)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Currency Symbol</Label>
                <Select
                  value={customLabelsConfig.currencySymbol || "$"}
                  onValueChange={(value) => handleCustomLabelConfigUpdate("currencySymbol", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="$" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$">$ (USD)</SelectItem>
                    <SelectItem value="€">€ (EUR)</SelectItem>
                    <SelectItem value="£">£ (GBP)</SelectItem>
                    <SelectItem value="¥">¥ (JPY)</SelectItem>
                    <SelectItem value="₹">₹ (INR)</SelectItem>
                    <SelectItem value="₽">₽ (RUB)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date Format</Label>
                <Select
                  value={customLabelsConfig.dateFormat || "MM/DD/YYYY"}
                  onValueChange={(value) => handleCustomLabelConfigUpdate("dateFormat", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="MM/DD/YYYY" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    <SelectItem value="MMM DD, YYYY">MMM DD, YYYY</SelectItem>
                    <SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Time Format</Label>
                <Select
                  value={customLabelsConfig.timeFormat || "HH:MM"}
                  onValueChange={(value) => handleCustomLabelConfigUpdate("timeFormat", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="HH:MM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HH:MM">HH:MM (24h)</SelectItem>
                    <SelectItem value="hh:mm A">hh:mm A (12h)</SelectItem>
                    <SelectItem value="HH:MM:SS">HH:MM:SS</SelectItem>
                    <SelectItem value="hh:mm:ss A">hh:mm:ss A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Custom Formatter Function</Label>
                <Textarea
                  value={customLabelsConfig.customFormatter || ""}
                  onChange={(e) => handleCustomLabelConfigUpdate("customFormatter", e.target.value)}
                  placeholder="function(value, context) { return value + ' units'; }"
                  className="h-20 font-mono text-xs"
                />
              </div>

              <div>
                <Label>Conditional Formatting</Label>
                <Textarea
                  value={customLabelsConfig.conditionalFormatting || ""}
                  onChange={(e) => handleCustomLabelConfigUpdate("conditionalFormatting", e.target.value)}
                  placeholder="if (value > 100) return 'High: ' + value; else return 'Low: ' + value;"
                  className="h-16 font-mono text-xs"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  checked={customLabelsConfig.showUnits || false}
                  onCheckedChange={(checked) => handleCustomLabelConfigUpdate("showUnits", checked)}
                />
                <Label>Show Units</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  checked={customLabelsConfig.abbreviateLargeNumbers || false}
                  onCheckedChange={(checked) => handleCustomLabelConfigUpdate("abbreviateLargeNumbers", checked)}
                />
                <Label>Abbreviate Large Numbers</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  checked={customLabelsConfig.showNegativeSign || false}
                  onCheckedChange={(checked) => handleCustomLabelConfigUpdate("showNegativeSign", checked)}
                />
                <Label>Show Negative Sign</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  checked={customLabelsConfig.showPlusSign || false}
                  onCheckedChange={(checked) => handleCustomLabelConfigUpdate("showPlusSign", checked)}
                />
                <Label>Show Plus Sign</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="format" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlignLeft className="h-4 w-4" />
                Text Formatting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Text Transform</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="uppercase">UPPERCASE</SelectItem>
                    <SelectItem value="lowercase">lowercase</SelectItem>
                    <SelectItem value="capitalize">Capitalize</SelectItem>
                    <SelectItem value="title">Title Case</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Text Decoration</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="underline">Underline</SelectItem>
                    <SelectItem value="overline">Overline</SelectItem>
                    <SelectItem value="line-through">Strike Through</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Text Align</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Center" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                    <SelectItem value="justify">Justify</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Line Height</Label>
                <Slider defaultValue={[1.2]} max={3} min={0.5} step={0.1} />
              </div>

              <div>
                <Label>Letter Spacing</Label>
                <Slider defaultValue={[0]} max={5} min={-2} step={0.1} />
              </div>

              <div>
                <Label>Word Spacing</Label>
                <Slider defaultValue={[0]} max={10} min={-5} step={0.5} />
              </div>

              <div className="flex items-center space-x-2">
                <Switch />
                <Label>Text Shadow</Label>
              </div>

              <div>
                <Label>Shadow Color</Label>
                <Input type="color" defaultValue="#000000" />
              </div>

              <div>
                <Label>Shadow Blur</Label>
                <Slider defaultValue={[0]} max={10} min={0} step={1} />
              </div>

              <div>
                <Label>Shadow Offset X</Label>
                <Slider defaultValue={[0]} max={10} min={-10} step={1} />
              </div>

              <div>
                <Label>Shadow Offset Y</Label>
                <Slider defaultValue={[0]} max={10} min={-10} step={1} />
              </div>

              <div className="flex items-center space-x-2">
                <Switch />
                <Label>Text Outline</Label>
              </div>

              <div>
                <Label>Outline Color</Label>
                <Input type="color" defaultValue="#000000" />
              </div>

              <div>
                <Label>Outline Width</Label>
                <Slider defaultValue={[0]} max={5} min={0} step={0.5} />
              </div>

              <div>
                <Label>Text Stroke</Label>
                <Input type="color" defaultValue="transparent" />
              </div>

              <div>
                <Label>Stroke Width</Label>
                <Slider defaultValue={[0]} max={3} min={0} step={0.5} />
              </div>

              <div className="flex items-center space-x-2">
                <Switch />
                <Label>Anti-aliasing</Label>
              </div>

              <div>
                <Label>Font Smoothing</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Auto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="antialiased">Antialiased</SelectItem>
                    <SelectItem value="subpixel-antialiased">Subpixel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
