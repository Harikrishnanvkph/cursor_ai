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

const supportedChartTypes: { value: SupportedChartType; label: string }[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'scatter', label: 'Scatter' },
  { value: 'bubble', label: 'Bubble' },
  { value: 'pie', label: 'Pie' },
  { value: 'doughnut', label: 'Doughnut' },
  { value: 'polarArea', label: 'Polar Area' },
  { value: 'radar', label: 'Radar' },
  { value: 'horizontalBar', label: 'Horizontal Bar' },
  { value: 'stackedBar', label: 'Stacked Bar' },
  { value: 'area', label: 'Area' },
];

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

export function AddDatasetModal({ open, onOpenChange, onDatasetAdd }: AddDatasetModalProps) {
  const { chartMode, uniformityMode, chartType, chartData } = useChartStore();
  const [newDatasetName, setNewDatasetName] = useState("");
  const [newDatasetSlices, setNewDatasetSlices] = useState<Array<{ name: string, value: number, color: string }>>([]);
  const [newDatasetChartType, setNewDatasetChartType] = useState<SupportedChartType>('bar');

  const filteredDatasets = chartData.datasets.filter(dataset => (dataset.mode ? dataset.mode === chartMode : true));

  const initializeModal = () => {
    setNewDatasetName("");
    if (chartMode === 'grouped' && filteredDatasets.length > 0) {
      const firstDataset = filteredDatasets[0];
      const existingSliceLabels = firstDataset.sliceLabels || firstDataset.data.map((_, i) => `Slice ${i + 1}`);
      setNewDatasetSlices(existingSliceLabels.map(label => ({ name: label, value: 0, color: "#1E90FF" })));
    } else {
      setNewDatasetSlices([
        { name: "Slice 1", value: 10, color: "#1E90FF" },
        { name: "Slice 2", value: 20, color: "#ff6b6b" },
        { name: "Slice 3", value: 15, color: "#4ecdc4" },
      ]);
    }
    setNewDatasetChartType(chartMode === 'grouped' && uniformityMode === 'uniform' ? chartType : 'bar');
  };

  useEffect(() => {
    if (open) {
      initializeModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, chartMode, filteredDatasets.length]);

  const getAvailableChartTypes = () => {
    if (chartMode === 'single') return supportedChartTypes;
    if (uniformityMode === 'mixed') return supportedChartTypes.filter(type => ['bar', 'line', 'area'].includes(type.value));
    return supportedChartTypes.filter(type => !['pie', 'doughnut'].includes(type.value));
  };

  const handleAddSlice = () => setNewDatasetSlices([...newDatasetSlices, { name: `Slice ${newDatasetSlices.length + 1}`, value: 0, color: "#1E90FF" }]);
  const handleRemoveSlice = (index: number) => newDatasetSlices.length > 1 && setNewDatasetSlices(newDatasetSlices.filter((_, i) => i !== index));
  const handleUpdateSlice = (index: number, field: 'name' | 'value' | 'color', value: string | number) => {
    const updatedSlices = [...newDatasetSlices];
    updatedSlices[index] = { ...updatedSlices[index], [field]: value };
    setNewDatasetSlices(updatedSlices);
  };

  const handleCreateDataset = () => {
    const colors = newDatasetSlices.map(slice => slice.color);
    const newDataset: ExtendedChartDataset = {
      label: newDatasetName,
      data: newDatasetSlices.map(slice => slice.value),
      backgroundColor: colors,
      borderColor: colors.map(c => darkenColor(c, 20)),
      borderWidth: 2,
      pointRadius: 5,
      tension: 0.3,
      fill: false,
      pointImages: Array(newDatasetSlices.length).fill(null),
      mode: chartMode,
      sliceLabels: newDatasetSlices.map(slice => slice.name),
      chartType: newDatasetChartType,
    };
    onDatasetAdd(newDataset);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Dataset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[0.80rem] font-medium text-gray-600 mb-1 block">Chart Type</label>
              {chartMode === 'grouped' && uniformityMode === 'uniform' ? (
                <div className="w-full h-9 px-3 rounded border border-gray-200 bg-gray-50 flex items-center text-[0.80rem]">
                  <span className="text-gray-700">{chartType.charAt(0).toUpperCase() + chartType.slice(1)}</span>
                  <span className="text-xs text-gray-500 ml-2">(from Types & Toggles)</span>
                </div>
              ) : (
                <Select value={newDatasetChartType} onValueChange={(v) => setNewDatasetChartType(v as any)}>
                  <SelectTrigger className="w-full h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {getAvailableChartTypes().map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <label className="text-[0.80rem] font-medium text-gray-600 mb-1 block">Dataset Name <span className="text-red-500">*</span></label>
              <Input
                value={newDatasetName}
                onChange={e => setNewDatasetName(e.target.value)}
                placeholder="Enter dataset name"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[0.80rem] font-medium text-gray-700">Slices ({newDatasetSlices.length})</label>
              <Button size="sm" onClick={handleAddSlice} disabled={chartMode === 'grouped' && filteredDatasets.length > 0}>
                <Plus className="h-3 w-3 mr-1" /> Add Slice
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {newDatasetSlices.map((slice, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <Input value={slice.name} onChange={e => handleUpdateSlice(index, 'name', e.target.value)} disabled={chartMode === 'grouped' && filteredDatasets.length > 0} placeholder="Slice name" />
                  </div>
                  <div className="col-span-3">
                    <Input type="number" value={slice.value} onChange={e => handleUpdateSlice(index, 'value', Number(e.target.value))} placeholder="Value" />
                  </div>
                  <div className="col-span-4 flex items-center gap-2">
                    <Input type="color" value={slice.color} onChange={e => handleUpdateSlice(index, 'color', e.target.value)} className="p-1 h-10 w-10" />
                    <Input value={slice.color} onChange={e => handleUpdateSlice(index, 'color', e.target.value)} placeholder="#1E90FF" />
                  </div>
                  <div className="col-span-1">
                    <Button size="icon" variant="ghost" onClick={() => handleRemoveSlice(index)} disabled={newDatasetSlices.length <= 1}><Trash2 className="h-4 w-4" /></Button>
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
