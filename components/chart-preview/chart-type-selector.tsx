"use client"

import React, { memo } from "react"
import { cn } from "@/lib/utils"
import {
  CATEGORIZED_CHART_TYPES,
  getChartLabel,
  isCategoryCompatible,
  isChartTypeCompatible,
  getChartIncompatibilityReason,
  type ChartCategory,
  type ChartTypeOption
} from "@/lib/chart-types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { ChartColumn, ChevronDown, Check, Info } from "lucide-react"

export interface ChartTypeSelectorProps {
  value: string
  onChange: (type: string) => void
  variant?: "toolbar" | "sidebar"
  className?: string
  isMobile?: boolean
  disabled?: boolean
}

export const ChartTypeSelector = memo(function ChartTypeSelector({
  value,
  onChange,
  variant = "toolbar",
  className,
  isMobile = false,
  disabled = false
}: ChartTypeSelectorProps) {
  if (variant === "sidebar") {
    return (
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={cn("h-8 text-xs bg-white font-medium", className)}>
          <SelectValue placeholder="Select chart type">
            {getChartLabel(value)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-80 z-[100]">
          {CATEGORIZED_CHART_TYPES.map((category, idx) => {
            const isCatIncompatible = !isCategoryCompatible(category.id, value)
            const reason = getChartIncompatibilityReason(category.id, value)
            return (
              <React.Fragment key={category.id}>
                {idx > 0 && <SelectSeparator />}
                <SelectGroup>
                  <SelectLabel className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 flex items-center justify-between text-gray-500">
                    <span className={cn(isCatIncompatible && "text-amber-600 dark:text-amber-400")}>
                      {category.label}
                    </span>
                    {isCatIncompatible && (
                      <span
                        className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/40 px-1.5 py-0.5 rounded font-normal"
                        title={reason}
                      >
                        Incompatible
                      </span>
                    )}
                  </SelectLabel>
                  {category.charts.map((type) => {
                    const isTypeIncompatible = !isChartTypeCompatible(type.value, value)
                    return (
                      <SelectItem
                        key={type.value}
                        value={type.value}
                        disabled={isTypeIncompatible}
                        className={cn(
                          "text-xs py-1.5",
                          isTypeIncompatible
                            ? "opacity-40 cursor-not-allowed text-gray-400 pointer-events-none"
                            : "cursor-pointer",
                          category.id === "3d" && !isTypeIncompatible && "font-medium text-blue-600"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{type.label}</span>
                          {isTypeIncompatible && (
                            <span className="text-[10px] text-gray-400 font-normal ml-2">
                              (Disabled)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectGroup>
              </React.Fragment>
            )
          })}
        </SelectContent>
      </Select>
    )
  }

  // Default: "toolbar" variant
  const triggerClassName = isMobile
    ? "h-7 w-12 text-[10px] px-1.5 py-0 border-gray-200 bg-white rounded-lg flex-shrink-0"
    : "h-6 w-9 lg:w-[90px] text-[10px] px-1 lg:px-2 py-0 border-gray-200 bg-white"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center justify-between rounded-md border border-gray-200 bg-white font-medium shadow-2xs hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none",
            triggerClassName,
            className
          )}
          title="Select Chart Type"
        >
          <ChartColumn className="h-3.5 w-3.5 lg:hidden text-slate-600 dark:text-slate-300 shrink-0 stroke-[2.5]" />
          <span className="hidden lg:block truncate text-slate-700 dark:text-slate-200 text-left text-[11px] leading-tight">
            {getChartLabel(value)}
          </span>
          <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 ml-0.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 p-1 z-[100] text-xs shadow-lg">
        {CATEGORIZED_CHART_TYPES.map((category) => {
          const hasSelectedChart = category.charts.some((c) => c.value === value)
          const isCatIncompatible = !isCategoryCompatible(category.id, value)
          const reason = getChartIncompatibilityReason(category.id, value)

          return (
            <DropdownMenuSub key={category.id}>
              <DropdownMenuSubTrigger
                className={cn(
                  "text-xs py-1.5 px-2.5 cursor-pointer flex items-center justify-between rounded-md font-medium transition-colors",
                  hasSelectedChart && "font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30",
                  isCatIncompatible
                    ? "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    : "text-slate-700 dark:text-slate-200"
                )}
              >
                <span>{category.label}</span>
                {isCatIncompatible && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/40 px-1.5 py-0.5 rounded font-normal leading-tight ml-auto mr-1">
                    Disabled
                  </span>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56 p-1 z-[100] text-xs shadow-lg">
                {isCatIncompatible && (
                  <div className="p-2 mb-1.5 rounded-md bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 select-none">
                    <div className="font-semibold flex items-center gap-1 mb-0.5 text-amber-700 dark:text-amber-400">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>{category.label} Charts</span>
                    </div>
                    <p className="text-[10px] leading-relaxed text-amber-700/90 dark:text-amber-300/90">
                      {reason}
                    </p>
                  </div>
                )}
                {category.charts.map((type) => {
                  const isSelected = value === type.value
                  const isTypeIncompatible = !isChartTypeCompatible(type.value, value)
                  return (
                    <DropdownMenuItem
                      key={type.value}
                      disabled={isTypeIncompatible}
                      onClick={() => {
                        if (!isTypeIncompatible) {
                          onChange(type.value)
                        }
                      }}
                      className={cn(
                        "text-xs py-1.5 px-2.5 flex items-center justify-between rounded-md transition-colors",
                        isTypeIncompatible
                          ? "opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500 hover:bg-transparent"
                          : "cursor-pointer",
                        isSelected && "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-semibold"
                      )}
                    >
                      <span>{type.label}</span>
                      {isTypeIncompatible ? (
                        <span className="text-[10px] text-slate-400 italic">Incompatible</span>
                      ) : (
                        isSelected && (
                          <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />
                        )
                      )}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
