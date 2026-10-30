"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Crosshair, Calendar, DollarSign, Eye, Sparkles } from "lucide-react"

interface TimelineAxisSettingsProps {
  options: any
  onUpdate: (path: string, value: any) => void
}

export function TimelineAxisSettings({ options, onUpdate }: TimelineAxisSettingsProps) {
  const crosshair = options?.plugins?.timelineCrosshair || {}
  const rangeSelector = options?.plugins?.timelineRangeSelector || {}
  const isCrosshairEnabled = crosshair.enabled !== false
  const isRangeSelectorEnabled = rangeSelector.enabled !== false
  const showStatsBadge = rangeSelector.showStats !== false
  const crosshairColor = crosshair.lineColor || crosshair.color || "#64748b"
  const crosshairDash = Array.isArray(crosshair.lineDash) ? crosshair.lineDash.join(",") : "4,4"
  const showIntersection = crosshair.showIntersectionPoint !== false
  const currencyPrefix = options?.scales?.y?.ticks?.prefix ?? "$"
  const beginAtZero = options?.scales?.y?.beginAtZero === true

  return (
    <div className="space-y-4">
      {/* ── 1. Interactive Crosshair Tracking ─────────────────────────────── */}
      <Card className="border border-slate-200 shadow-2xs">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-blue-600" />
              <div>
                <Label className="text-xs font-semibold text-slate-900">Vertical Crosshair</Label>
                <p className="text-[11px] text-slate-500">Google Finance style cursor tracking hairline</p>
              </div>
            </div>
            <Switch
              checked={isCrosshairEnabled}
              onCheckedChange={(checked) => onUpdate("plugins.timelineCrosshair.enabled", checked)}
            />
          </div>

          {isCrosshairEnabled && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-700 font-medium">Hairline Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={crosshairColor}
                    onChange={(e) => {
                      onUpdate("plugins.timelineCrosshair.lineColor", e.target.value)
                      onUpdate("plugins.timelineCrosshair.color", e.target.value)
                    }}
                    className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5"
                  />
                  <span className="text-[11px] font-mono text-slate-600">{crosshairColor}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-700 font-medium">Line Style</Label>
                <Select
                  value={crosshairDash === "0" || crosshairDash === "" ? "solid" : (crosshairDash === "2,2" ? "dotted" : "dashed")}
                  onValueChange={(val) => {
                    const dash = val === "solid" ? [] : (val === "dotted" ? [2, 2] : [4, 4])
                    onUpdate("plugins.timelineCrosshair.lineDash", dash)
                    onUpdate("plugins.timelineCrosshair.dash", dash)
                  }}
                >
                  <SelectTrigger className="w-28 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashed">Dashed</SelectItem>
                    <SelectItem value="dotted">Dotted</SelectItem>
                    <SelectItem value="solid">Solid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs text-slate-700 font-medium">Glowing Intersection Dot</Label>
                  <p className="text-[10px] text-slate-400">Pulses on curve under cursor</p>
                </div>
                <Switch
                  checked={showIntersection}
                  onCheckedChange={(checked) => onUpdate("plugins.timelineCrosshair.showIntersectionPoint", checked)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 2. Time Range Selector Toolbar ─────────────────────────────────── */}
      <Card className="border border-slate-200 shadow-2xs">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <div>
                <Label className="text-xs font-semibold text-slate-900">Range Selector Toolbar</Label>
                <p className="text-[11px] text-slate-500">1D, 5D, 1M, 6M, YTD, 1Y, 5Y, Max zoom buttons</p>
              </div>
            </div>
            <Switch
              checked={isRangeSelectorEnabled}
              onCheckedChange={(checked) => onUpdate("plugins.timelineRangeSelector.enabled", checked)}
            />
          </div>

          {isRangeSelectorEnabled && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs text-slate-700 font-medium">Live Value & Change Badge</Label>
                  <p className="text-[10px] text-slate-400">Shows current price & % gain/loss over range</p>
                </div>
                <Switch
                  checked={showStatsBadge}
                  onCheckedChange={(checked) => onUpdate("plugins.timelineRangeSelector.showStats", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-700 font-medium">Default Range</Label>
                <Select
                  value={rangeSelector.selectedRange || "Max"}
                  onValueChange={(val) => onUpdate("plugins.timelineRangeSelector.selectedRange", val)}
                >
                  <SelectTrigger className="w-24 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Max">Max</SelectItem>
                    <SelectItem value="5Y">5Y</SelectItem>
                    <SelectItem value="1Y">1Y</SelectItem>
                    <SelectItem value="YTD">YTD</SelectItem>
                    <SelectItem value="6M">6M</SelectItem>
                    <SelectItem value="1M">1M</SelectItem>
                    <SelectItem value="5D">5D</SelectItem>
                    <SelectItem value="1D">1D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 3. Financial Currency & Scaling ───────────────────────────────── */}
      <Card className="border border-slate-200 shadow-2xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-600" />
            <div>
              <Label className="text-xs font-semibold text-slate-900">Financial Currency & Scale</Label>
              <p className="text-[11px] text-slate-500">Stock and financial chart settings</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-700 font-medium">Currency Prefix</Label>
              <Input
                value={currencyPrefix}
                onChange={(e) => onUpdate("scales.y.ticks.prefix", e.target.value)}
                placeholder="$"
                className="w-20 h-7 text-xs font-mono text-center"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs text-slate-700 font-medium">Dynamic Vertical Zoom</Label>
                <p className="text-[10px] text-slate-400">
                  {beginAtZero ? "Base at 0 (flattens stock fluctuations)" : "Dynamic scale around stock price"}
                </p>
              </div>
              <Switch
                checked={!beginAtZero}
                onCheckedChange={(checked) => onUpdate("scales.y.beginAtZero", !checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
