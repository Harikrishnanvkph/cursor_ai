"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { NumberFormattingSection } from "./number-formatting-section"
import { useState } from "react"

interface GaugeScaleSettingsProps {
    options: any
    onUpdate: (path: string, value: any) => void
}

export function GaugeScaleSettings({ options, onUpdate }: GaugeScaleSettingsProps) {
    const [rangeOpen, setRangeOpen] = useState(true)

    const gaugePlugin = options?.plugins?.gauge || {}
    const minLabel = gaugePlugin.minLabel ?? '0'
    const maxLabel = gaugePlugin.maxLabel ?? '100'
    const showZeroMarker = gaugePlugin.showZeroMarker !== false

    return (
        <div className="space-y-4">
            {/* Number & Value Formatting Section */}
            <NumberFormattingSection
                value={options?.numberFormat || gaugePlugin.numberFormat}
                onChange={(newFmt) => {
                    onUpdate('numberFormat', newFmt)
                    onUpdate('plugins.gauge.numberFormat', newFmt)
                }}
                defaultOpen={true}
                tooltipDescription="Format gauge center values and tooltips"
            />

            {/* Gauge Scale Range (Min / Max) */}
            <div className="space-y-0">
                <div
                    className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded-t"
                    onClick={() => setRangeOpen(!rangeOpen)}
                >
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-gray-900 flex-1">Scale Limits & Markers</h3>
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
                            className={`transform transition-transform ${rangeOpen ? 'rotate-180' : ''}`}
                        >
                            <path d="M6 9L12 15L18 9" />
                        </svg>
                    </div>
                </div>

                {rangeOpen && (
                    <div className="bg-blue-50 rounded-b-lg border-x border-b border-blue-100 p-3 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Minimum Scale Value</Label>
                                <Input
                                    type="text"
                                    value={minLabel}
                                    onChange={(e) => onUpdate('plugins.gauge.minLabel', e.target.value)}
                                    placeholder="0"
                                    className="h-8 text-xs bg-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Maximum Scale Value</Label>
                                <Input
                                    type="text"
                                    value={maxLabel}
                                    onChange={(e) => onUpdate('plugins.gauge.maxLabel', e.target.value)}
                                    placeholder="100"
                                    className="h-8 text-xs bg-white"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-blue-100">
                            <div>
                                <Label className="text-xs text-gray-700 font-medium">Show Zero Reference Marker</Label>
                                <p className="text-[10px] text-gray-500">Displays 0 tick when range spans negative to positive</p>
                            </div>
                            <Switch
                                checked={showZeroMarker}
                                onCheckedChange={(checked) => onUpdate('plugins.gauge.showZeroMarker', checked)}
                                className="scale-75 data-[state=checked]:bg-blue-600"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Helper callout */}
            <Card className="border border-blue-100 bg-blue-50/50">
                <CardContent className="p-3">
                    <p className="text-xs text-gray-600">
                        Needle styles, colors, and dial needle geometry can be further customized under the <strong className="text-blue-700">Appearance</strong> tab.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
