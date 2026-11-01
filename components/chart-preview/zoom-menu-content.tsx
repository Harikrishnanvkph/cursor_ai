import React from "react"
import { Slider } from "@/components/ui/slider"
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { ZoomIn, ZoomOut } from "lucide-react"

export const ZOOM_VALUES: number[] = (() => {
  const values: number[] = [];
  for (let i = 10; i <= 50; i += 1) values.push(i);
  for (let i = 52; i <= 100; i += 2) values.push(i);
  for (let i = 103; i <= 160; i += 3) values.push(i);
  for (let i = 165; i <= 210; i += 5) values.push(i);
  for (let i = 216; i <= 300; i += 6) values.push(i);
  for (let i = 310; i <= 380; i += 10) values.push(i);
  for (let i = 392; i <= 500; i += 12) values.push(i);
  return values;
})();

export function getClosestZoomIndex(currentZoomPct: number): number {
  let closestIndex = 0;
  let minDiff = Infinity;
  for (let i = 0; i < ZOOM_VALUES.length; i++) {
    const diff = Math.abs(ZOOM_VALUES[i] - currentZoomPct);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }
  return closestIndex;
}

export interface ZoomMenuContentProps {
  currentZoomPct: number;
  closestIndex: number;
  onSliderChange: (value: number[]) => void;
  onResetZoom: () => void;
  onFullDimension?: () => void;
  hasFullDimension?: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function ZoomMenuContent({
  currentZoomPct,
  closestIndex,
  onSliderChange,
  onResetZoom,
  onFullDimension,
  hasFullDimension,
  onZoomIn,
  onZoomOut,
}: ZoomMenuContentProps) {
  return (
    <>
      <DropdownMenuItem
        onClick={onResetZoom}
        className="text-xs py-1.5 cursor-pointer font-medium text-slate-700 focus:bg-slate-100"
      >
        <span className="flex-1">100% (Fit to View)</span>
      </DropdownMenuItem>

      {hasFullDimension && onFullDimension && (
        <DropdownMenuItem
          onClick={() => {
            onFullDimension();
            setTimeout(onFullDimension, 50);
          }}
          className="text-xs py-1.5 cursor-pointer font-medium text-slate-700 focus:bg-slate-100"
        >
          <span className="flex-1">Full Dimension</span>
        </DropdownMenuItem>
      )}

      <DropdownMenuSeparator className="my-1" />

      <div className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <Slider
          min={0}
          max={ZOOM_VALUES.length - 1}
          step={1}
          value={[closestIndex]}
          onValueChange={onSliderChange}
          className="cursor-pointer"
        />
      </div>

      <DropdownMenuSeparator className="my-1" />
      <div className="flex items-center justify-between gap-1 px-1 py-0.5">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onZoomOut();
          }}
          className="h-8 w-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-slate-100 text-slate-600"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>

        <span className="text-xs font-semibold tabular-nums text-slate-700 select-none px-2">
          {currentZoomPct}%
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onZoomIn();
          }}
          className="h-8 w-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-slate-100 text-slate-600"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
