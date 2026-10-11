"use client"

import React, { memo } from "react"
import { cn } from "@/lib/utils"
import {
  CATEGORIZED_CHART_TYPES,
  getChartLabel,
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
import { ChartColumn, ChevronDown, Check } from "lucide-react"

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
          {CATEGORIZED_CHART_TYPES.map((category, idx) => (
            <React.Fragment key={category.id}>
              {idx > 0 && <SelectSeparator />}
              <SelectGroup>
                <SelectLabel className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-1">
                  {category.label}
                </SelectLabel>
                {category.charts.map((type) => (
                  <SelectItem
                    key={type.value}
                    value={type.value}
                    className={cn(
                      "text-xs py-1.5 cursor-pointer",
                      category.id === "3d" && "font-medium text-blue-600"
                    )}
                  >
                    {type.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </React.Fragment>
          ))}
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
      <DropdownMenuContent align="start" className="w-40 p-1 z-[100] text-xs shadow-lg">
        {CATEGORIZED_CHART_TYPES.map((category) => {
          const hasSelectedChart = category.charts.some((c) => c.value === value)
          return (
            <DropdownMenuSub key={category.id}>
              <DropdownMenuSubTrigger
                className={cn(
                  "text-xs py-1.5 px-2.5 cursor-pointer flex items-center justify-between rounded-md font-medium text-slate-700 dark:text-slate-200",
                  hasSelectedChart && "font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30"
                )}
              >
                <span>{category.label}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-44 p-1 z-[100] text-xs shadow-lg">
                {category.charts.map((type) => {
                  const isSelected = value === type.value
                  return (
                    <DropdownMenuItem
                      key={type.value}
                      onClick={() => onChange(type.value)}
                      className={cn(
                        "text-xs py-1.5 px-2.5 cursor-pointer flex items-center justify-between rounded-md transition-colors",
                        isSelected && "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-semibold"
                      )}
                    >
                      <span>{type.label}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />
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
