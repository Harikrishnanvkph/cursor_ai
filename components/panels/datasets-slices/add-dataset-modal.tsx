"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { useChartStore, type ExtendedChartDataset, type SupportedChartType } from '@/lib/chart-store';

interface AddDatasetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDatasetAdd: (dataset: ExtendedChartDataset) => void;
}

type ChartCategory = 'categorical' | 'coordinate';

// Categorical chart types (use Label + Value)
const categoricalChartTypes: { value: SupportedChartType; label: string }[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'area', label: 'Area' },
  { value: 'pie', label: 'Pie' },
  { value: 'doughnut', label: 'Doughnut' },
  { value: 'polarArea', label: 'Polar Area' },
  { value: 'radar', label: 'Radar' },
  { value: 'horizontalBar', label: 'Horizontal Bar' },
  { value: 'stackedBar', label: 'Stacked Bar' },
];

// Coordinate chart types (use X, Y, and optionally R)
const coordinateChartTypes: { value: SupportedChartType; label: string }[] = [
  { value: 'scatter', label: 'Scatter' },
  { value: 'bubble', label: 'Bubble' },
];

// Combined for backwards compatibility
const supportedChartTypes = [...categoricalChartTypes, ...coordinateChartTypes];

interface DataPoint {
  name: string;
  value: number;      // For categorical
  x: number;          // For coordinate
  y: number;          // For coordinate
  r: number;          // For bubble
  color: string;
}

const darkenColor = (color: string, percent: number) => {
  if (color.startsWith("hsl")) {
    const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
    if (match) {
      const [, h, s, l] = match
      const newL = Math.max(0, Number.parseInt(l) - percent)
      return `hsl(${h}, ${s}%, ${newL}%)`
    }
  }
  return color
}

const getDefaultPoints = (category: ChartCategory, count: number = 3): DataPoint[] => {
  if (category === 'coordinate') {
    return Array.from({ length: count }, (_, i) => ({
      name: `Point ${i + 1}`,
      value: 0,
      x: i * 10,
      y: (i + 1) * 10,
      r: 10,
      color: ['#1E90FF', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][i % 5],
    }));
  }
  return Array.from({ length: count }, (_, i) => ({
    name: `Slice ${i + 1}`,
    value: [10, 20, 15, 25, 30][i % 5],
    x: 0,
    y: 0,
    r: 10,
    color: ['#1E90FF', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][i % 5],
  }));
};

export function AddDatasetModal({ open, onOpenChange, onDatasetAdd }: AddDatasetModalProps) {
  const { chartMode, uniformityMode, chartType, chartData } = useChartStore();
  const [newDatasetName, setNewDatasetName] = useState("");
  const [chartCategory, setChartCategory] = useState<ChartCategory>('categorical');
  const [newDatasetChartType, setNewDatasetChartType] = useState<SupportedChartType>('bar');
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);

  const filteredDatasets = chartData.datasets.filter(dataset => (dataset.mode ? dataset.mode === chartMode : true));

  // Determine if chart type selection is locked (grouped + uniform mode)
  const isChartTypeLocked = chartMode === 'grouped' && uniformityMode === 'uniform';

  // Determine current category based on locked chart type or selection
  const effectiveCategory: ChartCategory = isChartTypeLocked
    ? (coordinateChartTypes.some(t => t.value === chartType) ? 'coordinate' : 'categorical')
    : chartCategory;

  const isBubbleChart = isChartTypeLocked ? chartType === 'bubble' : newDatasetChartType === 'bubble';

  const initializeModal = () => {
    setNewDatasetName("");

    // Determine initial category based on current chart type if locked
    const initialCategory: ChartCategory = isChartTypeLocked
      ? (coordinateChartTypes.some(t => t.value === chartType) ? 'coordinate' : 'categorical')
      : 'categorical';

    setChartCategory(initialCategory);
    setNewDatasetChartType(isChartTypeLocked ? chartType : 'bar');

    if (chartMode === 'grouped' && filteredDatasets.length > 0) {
      const firstDataset = filteredDatasets[0];
      const existingSliceLabels = firstDataset.sliceLabels || firstDataset.data.map((_, i) => `${initialCategory === 'coordinate' ? 'Point' : 'Slice'} ${i + 1}`);
      setDataPoints(existingSliceLabels.map((label, i) => ({
        name: label,
        value: 0,
        x: i * 10,
        y: 0,
        r: 10,
        color: "#1E90FF"
      })));
    } else {
      setDataPoints(getDefaultPoints(initialCategory));
    }
  };

  useEffect(() => {
    if (open) {
      initializeModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, chartMode, filteredDatasets.length]);

  // Handle category change
  const handleCategoryChange = (category: ChartCategory) => {
    setChartCategory(category);
    // Reset chart type to first available in new category
    const newType = category === 'coordinate' ? 'scatter' : 'bar';
    setNewDatasetChartType(newType);
    // Reset data points with appropriate defaults
    if (!(chartMode === 'grouped' && filteredDatasets.length > 0)) {
      setDataPoints(getDefaultPoints(category));
    }
  };

  const getAvailableChartTypes = () => {
    const baseTypes = effectiveCategory === 'coordinate' ? coordinateChartTypes : categoricalChartTypes;
    if (chartMode === 'single') return baseTypes;
    if (uniformityMode === 'mixed') return baseTypes.filter(type => ['bar', 'line', 'area'].includes(type.value));
    return baseTypes.filter(type => !['pie', 'doughnut'].includes(type.value));
  };

  const handleAddPoint = () => {
    const newIndex = dataPoints.length;
    const newPoint: DataPoint = {
      name: `${effectiveCategory === 'coordinate' ? 'Point' : 'Slice'} ${newIndex + 1}`,
      value: 0,
      x: newIndex * 10,
      y: 0,
      r: 10,
      color: ['#1E90FF', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][newIndex % 5],
    };
    setDataPoints([...dataPoints, newPoint]);
  };

  const handleRemovePoint = (index: number) => {
    if (dataPoints.length > 1) {
      setDataPoints(dataPoints.filter((_, i) => i !== index));
    }
  };

  const handleUpdatePoint = (index: number, field: keyof DataPoint, value: string | number) => {
    const updated = [...dataPoints];
    updated[index] = { ...updated[index], [field]: value };
    setDataPoints(updated);
  };

  const handleCreateDataset = () => {
    const colors = dataPoints.map(p => p.color);
    const finalChartType = isChartTypeLocked ? chartType : newDatasetChartType;

    // Create data in the correct format based on chart type
    let data: any[];
    if (finalChartType === 'scatter') {
      data = dataPoints.map(p => ({ x: p.x, y: p.y }));
    } else if (finalChartType === 'bubble') {
      data = dataPoints.map(p => ({ x: p.x, y: p.y, r: p.r }));
    } else {
      data = dataPoints.map(p => p.value);
    }

    const newDataset: ExtendedChartDataset = {
      label: newDatasetName,
      data,
      backgroundColor: colors,
      borderColor: colors.map(c => darkenColor(c, 20)),
      borderWidth: 2,
      pointRadius: 5,
      tension: 0.3,
      fill: false,
      pointImages: Array(dataPoints.length).fill(null),
      mode: chartMode,
      sliceLabels: dataPoints.map(p => p.name),
      chartType: finalChartType,
    };
    onDatasetAdd(newDataset);
    onOpenChange(false);
  };

  const pointLabel = effectiveCategory === 'coordinate' ? 'Points' : 'Slices';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Dataset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Category and Chart Type Selection */}
          <div className="grid grid-cols-3 gap-4">
            {/* Category Dropdown */}
            <div>
              <label className="text-[0.80rem] font-medium text-gray-600 mb-1 block">Category</label>
              {isChartTypeLocked ? (
                <div className="w-full h-9 px-3 rounded border border-gray-200 bg-gray-50 flex items-center text-[0.80rem]">
                  <span className="text-gray-700">{effectiveCategory === 'coordinate' ? 'Coordinate' : 'Categorical'}</span>
                </div>
              ) : (
                <Select value={chartCategory} onValueChange={(v) => handleCategoryChange(v as ChartCategory)}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="categorical">Categorical Chart</SelectItem>
                    <SelectItem value="coordinate">Coordinate Chart</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Chart Type Dropdown */}
            <div>
              <label className="text-[0.80rem] font-medium text-gray-600 mb-1 block">Chart Type</label>
              {isChartTypeLocked ? (
                <div className="w-full h-9 px-3 rounded border border-gray-200 bg-gray-50 flex items-center text-[0.80rem]">
                  <span className="text-gray-700">{chartType.charAt(0).toUpperCase() + chartType.slice(1)}</span>
                </div>
              ) : (
                <Select value={newDatasetChartType} onValueChange={(v) => setNewDatasetChartType(v as SupportedChartType)}>
                  <SelectTrigger className="w-full h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {getAvailableChartTypes().map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Dataset Name */}
            <div>
              <label className="text-[0.80rem] font-medium text-gray-600 mb-1 block">Dataset Name <span className="text-red-500">*</span></label>
              <Input
                value={newDatasetName}
                onChange={e => setNewDatasetName(e.target.value)}
                placeholder="Enter dataset name"
                className="h-9"
              />
            </div>
          </div>

          {/* Data Points Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[0.80rem] font-medium text-gray-700">{pointLabel} ({dataPoints.length})</label>
              <Button size="sm" onClick={handleAddPoint} disabled={chartMode === 'grouped' && filteredDatasets.length > 0}>
                <Plus className="h-3 w-3 mr-1" /> Add {effectiveCategory === 'coordinate' ? 'Point' : 'Slice'}
              </Button>
            </div>

            {/* Column Headers */}
            <div className={`grid gap-2 px-3 text-xs text-gray-500 font-medium ${effectiveCategory === 'coordinate'
                ? (isBubbleChart ? 'grid-cols-12' : 'grid-cols-11')
                : 'grid-cols-12'
              }`}>
              {effectiveCategory === 'coordinate' ? (
                <>
                  <div className="col-span-3">Label</div>
                  <div className="col-span-2">X</div>
                  <div className="col-span-2">Y</div>
                  {isBubbleChart && <div className="col-span-2">Radius</div>}
                  <div className={isBubbleChart ? 'col-span-2' : 'col-span-3'}>Color</div>
                  <div className="col-span-1"></div>
                </>
              ) : (
                <>
                  <div className="col-span-4">Label</div>
                  <div className="col-span-3">Value</div>
                  <div className="col-span-4">Color</div>
                  <div className="col-span-1"></div>
                </>
              )}
            </div>

            {/* Data Point Rows */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dataPoints.map((point, index) => (
                <div
                  key={index}
                  className={`p-3 bg-gray-50 rounded-lg border border-gray-200 grid gap-2 items-center ${effectiveCategory === 'coordinate'
                      ? (isBubbleChart ? 'grid-cols-12' : 'grid-cols-11')
                      : 'grid-cols-12'
                    }`}
                >
                  {effectiveCategory === 'coordinate' ? (
                    <>
                      {/* Label */}
                      <div className="col-span-3">
                        <Input
                          value={point.name}
                          onChange={e => handleUpdatePoint(index, 'name', e.target.value)}
                          placeholder={`Point ${index + 1}`}
                          className="h-8 text-sm"
                        />
                      </div>
                      {/* X */}
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={point.x}
                          onChange={e => handleUpdatePoint(index, 'x', Number(e.target.value))}
                          placeholder="X"
                          className="h-8 text-sm"
                          step="0.1"
                        />
                      </div>
                      {/* Y */}
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={point.y}
                          onChange={e => handleUpdatePoint(index, 'y', Number(e.target.value))}
                          placeholder="Y"
                          className="h-8 text-sm"
                          step="0.1"
                        />
                      </div>
                      {/* Radius (Bubble only) */}
                      {isBubbleChart && (
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={point.r}
                            onChange={e => handleUpdatePoint(index, 'r', Number(e.target.value))}
                            placeholder="R"
                            className="h-8 text-sm"
                            min="1"
                          />
                        </div>
                      )}
                      {/* Color */}
                      <div className={`flex items-center gap-1 ${isBubbleChart ? 'col-span-2' : 'col-span-3'}`}>
                        <Input
                          type="color"
                          value={point.color}
                          onChange={e => handleUpdatePoint(index, 'color', e.target.value)}
                          className="p-0.5 h-8 w-8 flex-shrink-0"
                        />
                        <Input
                          value={point.color}
                          onChange={e => handleUpdatePoint(index, 'color', e.target.value)}
                          placeholder="#1E90FF"
                          className="h-8 text-xs flex-1"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Label */}
                      <div className="col-span-4">
                        <Input
                          value={point.name}
                          onChange={e => handleUpdatePoint(index, 'name', e.target.value)}
                          disabled={chartMode === 'grouped' && filteredDatasets.length > 0}
                          placeholder="Slice name"
                          className="h-8 text-sm"
                        />
                      </div>
                      {/* Value */}
                      <div className="col-span-3">
                        <Input
                          type="number"
                          value={point.value}
                          onChange={e => handleUpdatePoint(index, 'value', Number(e.target.value))}
                          placeholder="Value"
                          className="h-8 text-sm"
                        />
                      </div>
                      {/* Color */}
                      <div className="col-span-4 flex items-center gap-1">
                        <Input
                          type="color"
                          value={point.color}
                          onChange={e => handleUpdatePoint(index, 'color', e.target.value)}
                          className="p-0.5 h-8 w-8 flex-shrink-0"
                        />
                        <Input
                          value={point.color}
                          onChange={e => handleUpdatePoint(index, 'color', e.target.value)}
                          placeholder="#1E90FF"
                          className="h-8 text-xs flex-1"
                        />
                      </div>
                    </>
                  )}
                  {/* Delete Button */}
                  <div className="col-span-1 flex justify-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemovePoint(index)}
                      disabled={dataPoints.length <= 1}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleCreateDataset} disabled={!newDatasetName.trim()}>Create Dataset</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
