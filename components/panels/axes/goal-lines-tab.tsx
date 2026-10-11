"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Target, Sparkles, Check } from "lucide-react"

interface GoalLinesTabProps {
  chartConfig: any
  onUpdate: (path: string, value: any) => void
  hasY1InUse?: boolean
}

const PRESET_COLORS = [
  { label: "Red", value: "#ef4444" },
  { label: "Emerald", value: "#10b981" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Slate", value: "#475569" },
]

const QUICK_LABELS = ["Target", "KPI Goal", "Budget Limit", "Benchmark", "Breakeven"]

export function GoalLinesTab({ chartConfig, onUpdate, hasY1InUse = false }: GoalLinesTabProps) {
  const yThreshold = chartConfig?.scales?.y?.threshold || {}
  const yEnabled = yThreshold.enabled === true

  const y1Threshold = chartConfig?.scales?.y1?.threshold || {}
  const y1Enabled = y1Threshold.enabled === true

  const updateYThreshold = (updates: Record<string, any>) => {
    const current = chartConfig?.scales?.y?.threshold || {}
    onUpdate("scales.y.threshold", { ...current, ...updates })
  }

  const updateY1Threshold = (updates: Record<string, any>) => {
    const current = chartConfig?.scales?.y1?.threshold || {}
    onUpdate("scales.y1.threshold", { ...current, ...updates })
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Overview Banner */}
      <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-xl border border-blue-100 flex items-start gap-2.5">
        <Target className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-950 space-y-0.5">
          <div className="font-semibold text-blue-900">Scale-Locked Benchmark Lines</div>
          <p className="text-[11px] text-blue-700 leading-relaxed">
            Goal lines automatically adjust with your data values, scale limits, and high-res exports.
          </p>
        </div>
      </div>

      {/* Primary Goal Line (Left Y-Axis) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full transition-colors ${yEnabled ? "bg-emerald-500 shadow-xs ring-2 ring-emerald-200" : "bg-gray-300"}`} />
            <div>
              <div className="text-xs font-semibold text-gray-900">Primary Goal Line (Left Y)</div>
              <div className="text-[10px] text-gray-500">Benchmark line plotted on Left Y scale</div>
            </div>
          </div>
          <Switch
            checked={yEnabled}
            onCheckedChange={(checked) => {
              updateYThreshold({
                enabled: checked,
                value: typeof yThreshold.value === "number" && !isNaN(yThreshold.value) ? yThreshold.value : 100,
                label: yThreshold.label !== undefined ? yThreshold.label : "Target",
                color: yThreshold.color || "#ef4444",
                style: yThreshold.style || "dashed",
                width: typeof yThreshold.width === "number" ? yThreshold.width : 2,
                position: yThreshold.position || "end",
              })
            }}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>

        {yEnabled ? (
          <div className="p-3 space-y-3 bg-blue-50/30">
            {/* Target Value and Label */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Target Value</Label>
                <Input
                  type="number"
                  value={yThreshold.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value === "" ? undefined : Number(e.target.value)
                    updateYThreshold({ value: val })
                  }}
                  placeholder="e.g. 100"
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Line Label</Label>
                <Input
                  type="text"
                  value={yThreshold.label ?? ""}
                  onChange={(e) => updateYThreshold({ label: e.target.value })}
                  placeholder="e.g. Target"
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>

            {/* Quick Preset Labels */}
            <div className="space-y-1">
              <Label className="text-[10px] text-gray-500 font-medium">Quick Label Suggestions</Label>
              <div className="flex flex-wrap gap-1">
                {QUICK_LABELS.map((ql) => (
                  <button
                    key={ql}
                    type="button"
                    onClick={() => updateYThreshold({ label: ql })}
                    className={`px-2 py-0.5 text-[10px] rounded-md border transition-all ${
                      yThreshold.label === ql
                        ? "bg-blue-100 border-blue-300 text-blue-700 font-semibold"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {ql}
                  </button>
                ))}
              </div>
            </div>

            {/* Position and Style */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Label Position</Label>
                <Select
                  value={yThreshold.position || "end"}
                  onValueChange={(val) => updateYThreshold({ position: val })}
                >
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value="start">Start (Left)</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="end">End (Right)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Line Style</Label>
                <Select
                  value={yThreshold.style || "dashed"}
                  onValueChange={(val) => updateYThreshold({ style: val })}
                >
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue placeholder="Style" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value="dashed">Dashed (- - -)</SelectItem>
                    <SelectItem value="solid">Solid (───)</SelectItem>
                    <SelectItem value="dotted">Dotted (···)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Color Swatches and Custom Input */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-medium text-gray-700">Line & Label Color</Label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1">
                  {PRESET_COLORS.map((pc) => {
                    const isSelected = (yThreshold.color || "#ef4444").toLowerCase() === pc.value.toLowerCase()
                    return (
                      <button
                        key={pc.value}
                        type="button"
                        onClick={() => updateYThreshold({ color: pc.value })}
                        style={{ backgroundColor: pc.value }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-xs ${
                          isSelected ? "ring-2 ring-offset-2 ring-gray-400 scale-105" : ""
                        }`}
                        title={pc.label}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <input
                    id="y-threshold-color-input"
                    type="color"
                    value={yThreshold.color || "#ef4444"}
                    onChange={(e) => updateYThreshold({ color: e.target.value })}
                    className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0.5 bg-white"
                  />
                  <Input
                    value={yThreshold.color || "#ef4444"}
                    onChange={(e) => updateYThreshold({ color: e.target.value })}
                    className="w-20 h-7 text-[11px] font-mono uppercase bg-white px-2"
                  />
                </div>
              </div>
            </div>

            {/* Line Width */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs text-gray-700">
                <Label className="text-xs font-medium">Line Thickness</Label>
                <span className="font-mono text-[11px] text-gray-500">{yThreshold.width ?? 2}px</span>
              </div>
              <Slider
                value={[yThreshold.width ?? 2]}
                onValueChange={([val]) => updateYThreshold({ width: val })}
                min={1}
                max={6}
                step={0.5}
                className="mt-1"
              />
            </div>
          </div>
        ) : (
          <div className="p-3 text-center">
            <p className="text-xs text-gray-500">
              Goal line is disabled. Turn on the switch above to add a benchmark or target line to your Left Y scale.
            </p>
          </div>
        )}
      </div>

      {/* Secondary Goal Line (Right Y2-Axis) if dual-axis is active */}
      {hasY1InUse && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-purple-50/40">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full transition-colors ${y1Enabled ? "bg-purple-600 shadow-xs ring-2 ring-purple-200" : "bg-gray-300"}`} />
              <div>
                <div className="text-xs font-semibold text-gray-900">Secondary Goal Line (Right Y2)</div>
                <div className="text-[10px] text-gray-500">Benchmark line plotted on Right Y2 scale</div>
              </div>
            </div>
            <Switch
              checked={y1Enabled}
              onCheckedChange={(checked) => {
                updateY1Threshold({
                  enabled: checked,
                  value: typeof y1Threshold.value === "number" && !isNaN(y1Threshold.value) ? y1Threshold.value : 100,
                  label: y1Threshold.label !== undefined ? y1Threshold.label : "Target Y2",
                  color: y1Threshold.color || "#8b5cf6",
                  style: y1Threshold.style || "dashed",
                  width: typeof y1Threshold.width === "number" ? y1Threshold.width : 2,
                  position: y1Threshold.position || "start",
                })
              }}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>

          {y1Enabled && (
            <div className="p-3 space-y-3 bg-purple-50/20">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Target Value</Label>
                  <Input
                    type="number"
                    value={y1Threshold.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : Number(e.target.value)
                      updateY1Threshold({ value: val })
                    }}
                    placeholder="e.g. 50"
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Line Label</Label>
                  <Input
                    type="text"
                    value={y1Threshold.label ?? ""}
                    onChange={(e) => updateY1Threshold({ label: e.target.value })}
                    placeholder="e.g. Target Y2"
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Position</Label>
                  <Select
                    value={y1Threshold.position || "start"}
                    onValueChange={(val) => updateY1Threshold({ position: val })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="start">Start (Left)</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="end">End (Right)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Style</Label>
                  <Select
                    value={y1Threshold.style || "dashed"}
                    onValueChange={(val) => updateY1Threshold({ style: val })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="dashed">Dashed (- - -)</SelectItem>
                      <SelectItem value="solid">Solid (───)</SelectItem>
                      <SelectItem value="dotted">Dotted (···)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
