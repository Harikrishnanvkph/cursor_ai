"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { cn } from "@/lib/utils"

export interface NumberFormatConfig {
    preset?: 'none' | 'currency' | 'compact' | 'percent' | 'number'
    currencySymbol?: string
    currencyPosition?: 'prefix' | 'suffix'
    decimals?: number | 'auto'
    compact?: boolean
    useGrouping?: boolean
    syncTooltip?: boolean
    [key: string]: any
}

interface NumberFormattingSectionProps {
    value?: NumberFormatConfig
    onChange: (config: NumberFormatConfig) => void
    title?: string
    defaultOpen?: boolean
    hideSyncTooltip?: boolean
    tooltipDescription?: string
    className?: string
}

const PRESET_CURRENCIES = ['$', '€', '£', '₹', '¥', 'C$', 'A$']

export function NumberFormattingSection({
    value,
    onChange,
    title = "Number & Value Formatting",
    defaultOpen = false,
    hideSyncTooltip = false,
    tooltipDescription,
    className
}: NumberFormattingSectionProps) {
    const [dropdownOpen, setDropdownOpen] = useState(defaultOpen)

    const numFormat = value || {}
    const preset = numFormat.preset || 'none'
    const currencySymbol = numFormat.currencySymbol || '$'
    const [isCustomCurrency, setIsCustomCurrency] = useState(!PRESET_CURRENCIES.includes(currencySymbol) && currencySymbol !== '')
    const isCustom = isCustomCurrency || (!PRESET_CURRENCIES.includes(currencySymbol) && currencySymbol !== '')
    const decimals = numFormat.decimals ?? 'auto'
    const compact = Boolean(numFormat.compact)
    const useGrouping = numFormat.useGrouping !== false
    const syncTooltip = numFormat.syncTooltip !== false

    const handleFormatUpdate = (field: string, val: any) => {
        onChange({ ...numFormat, [field]: val })
    }

    return (
        <div className={cn("space-y-0", className)}>
            <div
                className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded-t"
                onClick={() => setDropdownOpen(!dropdownOpen)}
            >
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                <div className="ml-auto flex items-center gap-2">
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
                        className={`transform transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    >
                        <path d="M6 9L12 15L18 9" />
                    </svg>
                </div>
            </div>

            {dropdownOpen && (
                <div className="bg-blue-50 rounded-b-lg p-3 space-y-3 relative overflow-hidden border-x border-b border-blue-100">
                    {/* Format Preset */}
                    <div className="space-y-1">
                        <Label className="text-xs font-medium">Format Preset</Label>
                        <Select
                            value={preset}
                            onValueChange={(val) => handleFormatUpdate('preset', val)}
                        >
                            <SelectTrigger className="h-8 text-xs bg-white">
                                <SelectValue placeholder="Select Format" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Standard (Raw Value)</SelectItem>
                                <SelectItem value="currency">Currency ($ / € / £ / ₹)</SelectItem>
                                <SelectItem value="compact">Compact (1.2K, 3.5M, 10B)</SelectItem>
                                <SelectItem value="percent">Percentage (%)</SelectItem>
                                <SelectItem value="number">Number with Commas (1,250)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Currency Details */}
                    {preset === 'currency' && (
                        <div className="space-y-2 pt-1">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Currency Symbol</Label>
                                    <Select
                                        value={isCustom ? 'custom' : currencySymbol}
                                        onValueChange={(val) => {
                                            if (val === 'custom') {
                                                setIsCustomCurrency(true)
                                            } else {
                                                setIsCustomCurrency(false)
                                                handleFormatUpdate('currencySymbol', val)
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="h-8 text-xs bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="$">$ (USD / CAD)</SelectItem>
                                            <SelectItem value="€">€ (EUR)</SelectItem>
                                            <SelectItem value="£">£ (GBP)</SelectItem>
                                            <SelectItem value="₹">₹ (INR)</SelectItem>
                                            <SelectItem value="¥">¥ (JPY / CNY)</SelectItem>
                                            <SelectItem value="C$">C$ (CAD)</SelectItem>
                                            <SelectItem value="A$">A$ (AUD)</SelectItem>
                                            <SelectItem value="custom">Custom...</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Position</Label>
                                    <Select
                                        value={numFormat.currencyPosition || 'prefix'}
                                        onValueChange={(val) => handleFormatUpdate('currencyPosition', val)}
                                    >
                                        <SelectTrigger className="h-8 text-xs bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="prefix">Prefix ($100)</SelectItem>
                                            <SelectItem value="suffix">Suffix (100 $)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Custom Currency Symbol Input */}
                            {isCustom && (
                                <div className="space-y-1 bg-white p-2 rounded border border-blue-200">
                                    <Label className="text-xs font-medium text-blue-700">Custom Symbol or Unit</Label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. CHF, kr, zł, R$, ₿"
                                        value={currencySymbol}
                                        onChange={(e) => handleFormatUpdate('currencySymbol', e.target.value)}
                                        className="h-8 text-xs bg-white border-gray-200 focus-visible:ring-blue-500"
                                        maxLength={10}
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Decimal Places */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Decimals</Label>
                            <Select
                                value={String(decimals)}
                                onValueChange={(val) => handleFormatUpdate('decimals', val === 'auto' ? 'auto' : Number(val))}
                            >
                                <SelectTrigger className="h-8 text-xs bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">Auto</SelectItem>
                                    <SelectItem value="0">0 (e.g. 100)</SelectItem>
                                    <SelectItem value="1">1 (e.g. 100.5)</SelectItem>
                                    <SelectItem value="2">2 (e.g. 100.50)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col justify-end">
                            <div className="flex items-center justify-between h-8 px-2 bg-white rounded border border-gray-200">
                                <Label className="text-xs text-gray-700 cursor-pointer" htmlFor="compact-num-toggle">Compact K/M</Label>
                                <Switch
                                    id="compact-num-toggle"
                                    checked={compact || preset === 'compact'}
                                    disabled={preset === 'compact'}
                                    onCheckedChange={(checked) => handleFormatUpdate('compact', checked)}
                                    className="scale-75 data-[state=checked]:bg-blue-600"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Toggles: Commas and Tooltip Sync */}
                    <div className="space-y-2 pt-1 border-t border-blue-100">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-gray-700">Use Commas (1,000s)</Label>
                            <Switch
                                checked={useGrouping}
                                onCheckedChange={(checked) => handleFormatUpdate('useGrouping', checked)}
                                className="scale-75 data-[state=checked]:bg-blue-600"
                            />
                        </div>

                        {!hideSyncTooltip && (
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-xs text-gray-700 font-medium text-blue-900">Sync Format to Tooltips</Label>
                                    {tooltipDescription && (
                                        <p className="text-[10px] text-gray-500">{tooltipDescription}</p>
                                    )}
                                </div>
                                <Switch
                                    checked={syncTooltip}
                                    onCheckedChange={(checked) => handleFormatUpdate('syncTooltip', checked)}
                                    className="scale-75 data-[state=checked]:bg-blue-600"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
