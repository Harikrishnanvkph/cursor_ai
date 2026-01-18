"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Shuffle } from 'lucide-react';
import { useChartStore, type ExtendedChartDataset, type SupportedChartType } from '@/lib/chart-store';
import { useChatStore } from '@/lib/chat-store';
import { cn } from '@/lib/utils';

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
  const { chartMode, uniformityMode, chartType, chartData, activeGroupId } = useChartStore();
  const [newDatasetName, setNewDatasetName] = useState("");
  const [chartCategory, setChartCategory] = useState<ChartCategory>('categorical');
  const [newDatasetChartType, setNewDatasetChartType] = useState<SupportedChartType>('bar');
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);

  // Filter datasets by mode AND by active group (for grouped mode)
  const filteredDatasets = chartData.datasets.filter(dataset => {
    if (dataset.mode) {
      if (dataset.mode !== chartMode) return false;
      // For grouped mode, also filter by active group
      if (chartMode === 'grouped' && dataset.groupId !== activeGroupId) {
        return false;
      }
      return true;
    }
    return true;
  });

  // Determine if category selection is locked (grouped mode + existing datasets, regardless of uniformity)
  // This prevents mixing Coordinate and Categorical charts in the same group
  const isCategoryLocked = chartMode === 'grouped' && filteredDatasets.length > 0;

  // Determine if chart type selection is locked (grouped + uniform mode + existing datasets)
  // In mixed mode, chart type is NOT locked, but category IS locked by the above
  const isChartTypeLocked = chartMode === 'grouped' && uniformityMode === 'uniform' && filteredDatasets.length > 0;

  // Determine current category based on locked logic or selection
  const effectiveCategory: ChartCategory = isCategoryLocked
    ? (coordinateChartTypes.some(t => t.value === filteredDatasets[0].chartType) ? 'coordinate' : 'categorical')
    : chartCategory;

  const isBubbleChart = isChartTypeLocked ? chartType === 'bubble' : newDatasetChartType === 'bubble';

  const initializeModal = () => {
    setNewDatasetName("");

    // Determine initial category based on category lock or current chart type if locked
    const initialCategory: ChartCategory = isCategoryLocked
      ? (coordinateChartTypes.some(t => t.value === filteredDatasets[0].chartType) ? 'coordinate' : 'categorical')
      : (isChartTypeLocked
        ? (coordinateChartTypes.some(t => t.value === chartType) ? 'coordinate' : 'categorical')
        : 'categorical');

    setChartCategory(initialCategory);
    setNewDatasetChartType(isChartTypeLocked ? chartType : (initialCategory === 'coordinate' ? 'scatter' : 'bar'));

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

  const handleRandomize = () => {
    const randomizedPoints = dataPoints.map(point => {
      if (effectiveCategory === 'coordinate') {
        const isScatter = isChartTypeLocked ? chartType === 'scatter' : newDatasetChartType === 'scatter';
        return {
          ...point,
          x: Math.floor(Math.random() * 100),
          y: Math.floor(Math.random() * 100),
          r: Math.floor(Math.random() * 20) + 5,
        };
      } else {
        return {
          ...point,
          value: Math.floor(Math.random() * 100) + 10,
        };
      }
    });
    setDataPoints(randomizedPoints);
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

    // NEW: Clear backendConversationId since this is now a new/modified local chart
    useChatStore.getState().setBackendConversationId(null);

    onOpenChange(false);
  };

  const pointLabel = effectiveCategory === 'coordinate' ? 'Points' : 'Slices';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b bg-gray-50/50">
          <DialogTitle className="text-base font-semibold">Create New Dataset</DialogTitle>
        </DialogHeader>

        {/* Configurations Section - Compact */}
        <div className="px-4 py-3 bg-white border-b space-y-3">
          <div className="grid grid-cols-12 gap-3 items-end">
            {/* Dataset Name */}
            <div className="col-span-4 space-y-1">
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Name</label>
              <Input
                value={newDatasetName}
                onChange={e => setNewDatasetName(e.target.value)}
                placeholder="Dataset Name"
                className="h-8 text-xs"
              />
            </div>

            {/* Category Dropdown */}
            <div className="col-span-4 space-y-1">
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Category</label>
              {isCategoryLocked ? (
                <div className="w-full h-8 px-2 rounded border border-gray-200 bg-gray-50 flex items-center text-xs text-gray-500 cursor-not-allowed">
                  {effectiveCategory === 'coordinate' ? 'Coordinate' : 'Categorical'}
                </div>
              ) : (
                <Select value={chartCategory} onValueChange={(v) => handleCategoryChange(v as ChartCategory)}>
                  <SelectTrigger className="w-full h-8 text-xs">
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
            <div className="col-span-4 space-y-1">
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Type</label>
              {isChartTypeLocked ? (
                <div className="w-full h-8 px-2 rounded border border-gray-200 bg-gray-50 flex items-center text-xs text-gray-500 cursor-not-allowed">
                  {chartType.charAt(0).toUpperCase() + chartType.slice(1)}
                </div>
              ) : (
                <Select value={newDatasetChartType} onValueChange={(v) => setNewDatasetChartType(v as SupportedChartType)}>
                  <SelectTrigger className="w-full h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {getAvailableChartTypes().map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>

        {/* Grouped Mode Warning */}
        {chartMode === 'grouped' && filteredDatasets.length > 0 && (
          <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100">
            <p className="text-[10px] text-yellow-800 flex items-center gap-1.5">
              <span className="font-semibold">{uniformityMode === 'uniform' ? 'Uniform Mode:' : 'Mixed Mode:'}</span>
              {uniformityMode === 'uniform'
                ? `Chart type is locked to ${chartType}. Slice structure matches existing datasets.`
                : 'Slice structure matches existing datasets. You can select a compatible chart type.'}
            </p>
          </div>
        )}

        {/* Data Points Header Row */}
        <div className="grid grid-cols-12 gap-1.5 items-center px-4 py-2 bg-gray-50 border-b text-[10px] font-medium text-gray-500">
          {effectiveCategory === 'coordinate' ? (
            <>
              <div className="col-span-3">Label</div>
              <div className="col-span-2">X</div>
              <div className="col-span-2">Y</div>
              {isBubbleChart ? (
                <>
                  <div className="col-span-2">Radius</div>
                  <div className="col-span-2">Color</div>
                </>
              ) : (
                <>
                  <div className="col-span-2"></div>
                  <div className="col-span-2">Color</div>
                </>
              )}
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

        {/* Scrollable Data Points */}
        <div className="flex-1 overflow-auto px-4 py-2 space-y-1.5">
          {dataPoints.map((point, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-1.5 items-center py-1.5 px-2 border border-gray-100 rounded-md bg-white hover:border-gray-200 transition-colors"
            >
              {effectiveCategory === 'coordinate' ? (
                <>
                  <div className="col-span-3">
                    <Input
                      value={point.name}
                      onChange={e => handleUpdatePoint(index, 'name', e.target.value)}
                      placeholder={`Point ${index + 1}`}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={point.x}
                      onChange={e => handleUpdatePoint(index, 'x', Number(e.target.value))}
                      className="h-7 text-xs"
                      step="0.1"
                      placeholder="X"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={point.y}
                      onChange={e => handleUpdatePoint(index, 'y', Number(e.target.value))}
                      className="h-7 text-xs"
                      step="0.1"
                      placeholder="Y"
                    />
                  </div>
                  {isBubbleChart ? (
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={point.r}
                        onChange={e => handleUpdatePoint(index, 'r', Number(e.target.value))}
                        className="h-7 text-xs"
                        min="1"
                        placeholder="R"
                      />
                    </div>
                  ) : (
                    <div className="col-span-2"></div>
                  )}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={point.color}
                        onChange={e => handleUpdatePoint(index, 'color', e.target.value)}
                        className="w-7 h-7 p-0 border border-gray-200 rounded cursor-pointer"
                      />
                      <Input
                        value={point.color}
                        onChange={e => handleUpdatePoint(index, 'color', e.target.value)}
                        placeholder="#1E90FF"
                        className="h-7 text-xs flex-1"
                      />
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemovePoint(index)}
                      disabled={dataPoints.length <= 1}
                      className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-4">
                    <Input
                      value={point.name}
                      onChange={e => handleUpdatePoint(index, 'name', e.target.value)}
                      disabled={chartMode === 'grouped' && filteredDatasets.length > 0}
                      placeholder="Slice name"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      value={point.value}
                      onChange={e => handleUpdatePoint(index, 'value', Number(e.target.value))}
                      placeholder="Value"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="col-span-4">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={point.color}
                        onChange={e => handleUpdatePoint(index, 'color', e.target.value)}
                        className="w-7 h-7 p-0 border border-gray-200 rounded cursor-pointer"
                      />
                      <Input
                        value={point.color}
                        onChange={e => handleUpdatePoint(index, 'color', e.target.value)}
                        placeholder="#1E90FF"
                        className="h-7 text-xs flex-1"
                      />
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemovePoint(index)}
                      disabled={dataPoints.length <= 1}
                      className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Compact Footer */}
        <DialogFooter className="px-4 py-3 border-t bg-gray-50/50 gap-2 sm:gap-0">
          <div className="flex-1 flex justify-start">
            <div title={chartMode === 'grouped' && filteredDatasets.length > 0 ? "Cannot add points in Grouped Mode (structure matches existing datasets)" : ""}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddPoint}
                disabled={chartMode === 'grouped' && filteredDatasets.length > 0}
                className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add {effectiveCategory === 'coordinate' ? 'Point' : 'Slice'}
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRandomize}
              className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5 sm:mr-auto"
            >
              <Shuffle className="w-3 h-3" />
              Randomize
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" className="h-8">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleCreateDataset}
              disabled={!newDatasetName.trim()}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white h-8"
            >
              Create Dataset
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
