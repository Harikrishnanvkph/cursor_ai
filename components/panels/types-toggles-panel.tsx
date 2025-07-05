"use client"

import { useChartStore, type SupportedChartType } from "@/lib/chart-store"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { BarChart3 } from "lucide-react"

export function TypesTogglesPanel() {
  const { chartType, setChartType, chartData, legendFilter, toggleDatasetVisibility, toggleSliceVisibility, fillArea, showBorder, toggleFillArea, toggleShowBorder, chartMode } = useChartStore()

  const handleChartTypeChange = (type: string) => {
    if (type === 'stackedBar') {
      setChartType('stackedBar' as SupportedChartType)
      chartData.datasets.forEach((dataset, index) => {
        // @ts-ignore: updateDataset expects a partial
        toggleDatasetVisibility(index) // ensure visibility logic is correct
        // update dataset type to 'bar'
        if (dataset.type !== 'bar') {
          dataset.type = 'bar'
        }
      })
      return
    }
    setChartType(type as SupportedChartType)
  }

  // Compute which slices are visible based on visible datasets
  const visibleDatasetIndices = chartData.datasets.map((ds, i) => legendFilter.datasets[i] !== false ? i : null).filter(i => i !== null);
  const visibleSliceIndices = new Set<number>();
  visibleDatasetIndices.forEach(i => {
    const ds = chartData.datasets[i as number];
    if (ds && Array.isArray(ds.data)) {
      ds.data.forEach((_, idx) => visibleSliceIndices.add(idx));
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Chart Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Chart Type</Label>
            <Select value={chartType} onValueChange={handleChartTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="horizontalBar">Horizontal Bar</SelectItem>
                <SelectItem value="stackedBar">Stacked Bar</SelectItem>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="area">Area</SelectItem>
                <SelectItem value="pie">Pie</SelectItem>
                <SelectItem value="doughnut">Doughnut</SelectItem>
                <SelectItem value="radar">Radar</SelectItem>
                <SelectItem value="polarArea">Polar Area</SelectItem>
                <SelectItem value="scatter">Scatter</SelectItem>
                <SelectItem value="bubble">Bubble</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch id="fill-area-toggle" checked={fillArea} onCheckedChange={toggleFillArea} />
            <Label htmlFor="fill-area-toggle">Fill Area</Label>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch id="show-border-toggle" checked={showBorder} onCheckedChange={toggleShowBorder} disabled={!fillArea} />
            <Label htmlFor="show-border-toggle">Show Border</Label>
          </div>

          {/* Legend Filter Buttons */}
          <div className="mt-4">
            <div className="font-semibold text-xs mb-2">Legend Filter</div>
            {chartMode === 'grouped' && (
              <>
                <div className="mb-1 font-semibold text-xs">Datasets</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {chartData.datasets.map((ds, i) => (
                    <button
                      key={i}
                      onClick={() => toggleDatasetVisibility(i)}
                      className={`flex items-center gap-1 px-2 py-1 rounded border text-xs ${legendFilter.datasets[i] === false ? 'opacity-40' : 'opacity-100'} `}
                      style={{ borderColor: Array.isArray(ds.backgroundColor) ? ds.backgroundColor[0] : ds.backgroundColor, color: Array.isArray(ds.backgroundColor) ? ds.backgroundColor[0] : ds.backgroundColor }}
                    >
                      <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ background: Array.isArray(ds.backgroundColor) ? ds.backgroundColor[0] : ds.backgroundColor }} />
                      {ds.label || `Dataset ${i+1}`}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="mb-1 font-semibold text-xs">Slices</div>
            <div className="flex flex-wrap gap-2">
              {chartData.labels && chartData.labels.map((label, i) => (
                visibleSliceIndices.has(i) ? (
                  <button
                    key={label}
                    onClick={() => toggleSliceVisibility(i)}
                    className={`flex items-center gap-1 px-2 py-1 rounded border text-xs ${legendFilter.slices[i] === false ? 'opacity-40' : 'opacity-100'} `}
                    style={{ borderColor: '#ccc', color: '#333' }}
                  >
                    <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ background: (chartData.datasets[0] && Array.isArray(chartData.datasets[0].backgroundColor) ? chartData.datasets[0].backgroundColor[i] : (chartData.datasets[0]?.backgroundColor as string)) || '#ccc' }} />
                    {label}
                  </button>
                ) : null
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}            