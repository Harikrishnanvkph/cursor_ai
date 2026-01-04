import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditSlicesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chartData: any;
  chartType: string;
  onSave: (newSliceLabels: string[], newValues: any[][]) => void;
}

export function EditSlicesModal({ open, onOpenChange, chartData, chartType, onSave }: EditSlicesModalProps) {
  const isCoordinateChart = chartType === 'scatter' || chartType === 'bubble';
  const datasets = chartData.datasets;

  // Initial state setup
  const getInitialLabels = () => chartData.labels || (datasets[0]?.sliceLabels ?? datasets[0]?.data.map((_: any, i: number) => `Slice ${i + 1}`)) || [];

  const getInitialValues = () => {
    const labels = getInitialLabels();
    return labels.map((_: any, rowIdx: number) =>
      datasets.map((ds: any) => {
        const val = ds.data[rowIdx];
        if (isCoordinateChart) {
          // Ensure object structure for coordinate charts
          if (typeof val === 'object' && val !== null) {
            return { x: val.x ?? 0, y: val.y ?? 0, r: val.r ?? (chartType === 'bubble' ? 10 : undefined) };
          }
          return { x: 0, y: 0, r: chartType === 'bubble' ? 10 : undefined };
        }
        return val ?? "";
      })
    );
  };

  const [sliceLabels, setSliceLabels] = useState<string[]>([]);
  const [values, setValues] = useState<any[][]>([]);

  useEffect(() => {
    if (open) {
      setSliceLabels(getInitialLabels());
      setValues(getInitialValues());
    }
  }, [open, chartData, chartType]);

  const handleLabelChange = (idx: number, value: string) => {
    const newLabels = [...sliceLabels];
    newLabels[idx] = value;
    setSliceLabels(newLabels);
  };

  const handleValueChange = (row: number, col: number, field: string | null, value: string) => {
    const newValues = values.map(arr => [...arr]);
    const numVal = value === "" ? "" : Number(value);

    if (isCoordinateChart) {
      const currentVal = newValues[row][col] || { x: 0, y: 0 };
      if (field) {
        newValues[row][col] = { ...currentVal, [field]: numVal };
      }
    } else {
      newValues[row][col] = numVal;
    }
    setValues(newValues);
  };

  const handleAddSlice = () => {
    const newLabel = isCoordinateChart ? `Point ${sliceLabels.length + 1}` : `Slice ${sliceLabels.length + 1}`;
    setSliceLabels([...sliceLabels, newLabel]);

    // Create empty values for each dataset
    const newRow = datasets.map(() =>
      isCoordinateChart
        ? { x: 0, y: 0, r: chartType === 'bubble' ? 10 : undefined }
        : ""
    );
    setValues([...values, newRow]);
  };

  const handleRemoveSlice = (idx: number) => {
    if (sliceLabels.length <= 1) return;
    setSliceLabels(sliceLabels.filter((_, i) => i !== idx));
    setValues(values.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    // Clean values before saving
    const cleanedValues = values.map(row => row.map(val => {
      if (isCoordinateChart) {
        return {
          x: Number(val.x || 0),
          y: Number(val.y || 0),
          ...(chartType === 'bubble' ? { r: Number(val.r || 10) } : {})
        };
      }
      return val === "" ? null : Number(val);
    }));
    onSave(sliceLabels, cleanedValues);
    onOpenChange(false);
  };

  const renderDatasetInputs = (rowIdx: number, colIdx: number, val: any) => {
    if (isCoordinateChart) {
      return (
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="space-y-0.5">
            <Label className="text-[10px] text-gray-500">X</Label>
            <Input
              type="number"
              value={val?.x ?? 0}
              onChange={e => handleValueChange(rowIdx, colIdx, 'x', e.target.value)}
              className="h-7 text-xs px-2"
              placeholder="X"
            />
          </div>
          <div className="space-y-0.5">
            <Label className="text-[10px] text-gray-500">Y</Label>
            <Input
              type="number"
              value={val?.y ?? 0}
              onChange={e => handleValueChange(rowIdx, colIdx, 'y', e.target.value)}
              className="h-7 text-xs px-2"
              placeholder="Y"
            />
          </div>
          {chartType === 'bubble' && (
            <div className="col-span-2 space-y-0.5">
              <Label className="text-[10px] text-gray-500">Radius (R)</Label>
              <Input
                type="number"
                value={val?.r ?? 10}
                onChange={e => handleValueChange(rowIdx, colIdx, 'r', e.target.value)}
                className="h-7 text-xs px-2"
                placeholder="R"
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <Input
        type="number"
        value={val ?? ""}
        onChange={e => handleValueChange(rowIdx, colIdx, null, e.target.value)}
        className="h-8 text-xs"
        placeholder="Value"
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {isCoordinateChart ? 'Edit Points (Grouped Mode)' : 'Edit Slices (Grouped Mode)'}
          </DialogTitle>
          <p className="text-sm text-gray-500">
            Manage data across all datasets. {isCoordinateChart ? 'Adjust coordinates for each point.' : 'Set values for each slice.'}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          <div className="space-y-3 pb-4">
            {sliceLabels.map((label, rowIdx) => (
              <div
                key={rowIdx}
                className={cn(
                  "group relative flex flex-col gap-3 p-4 rounded-xl border transition-all duration-200",
                  "bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200",
                  "focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300"
                )}
              >
                {/* Header Row: Label & Actions */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-500 cursor-grab active:cursor-grabbing">
                    <span className="text-xs font-semibold">{rowIdx + 1}</span>
                  </div>

                  <div className="flex-1">
                    <Input
                      value={label}
                      onChange={e => handleLabelChange(rowIdx, e.target.value)}
                      className="h-8 text-sm font-medium border-transparent hover:border-gray-200 focus:border-blue-400 bg-transparent px-2 -ml-2 w-full max-w-sm transition-colors"
                      placeholder={isCoordinateChart ? "Point Name" : "Slice Name"}
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSlice(rowIdx)}
                    disabled={sliceLabels.length <= 1}
                    className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 -mr-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Values Grid */}
                <div className={cn(
                  "grid gap-4",
                  datasets.length === 1 ? "grid-cols-1" :
                    datasets.length === 2 ? "grid-cols-2" :
                      "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                )}>
                  {datasets.map((ds: any, colIdx: number) => (
                    <div key={colIdx} className="space-y-1.5 p-3 rounded-lg bg-gray-50/50 border border-gray-100">
                      <Label className="text-xs font-medium text-gray-500 truncate block" title={ds.label}>
                        {ds.label || `Dataset ${colIdx + 1}`}
                      </Label>
                      {renderDatasetInputs(rowIdx, colIdx, values[rowIdx]?.[colIdx])}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-gray-50/50 gap-2 sm:gap-0">
          <div className="flex-1 flex justify-start">
            <Button variant="outline" onClick={handleAddSlice} className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
              <Plus className="w-4 h-4" />
              {isCoordinateChart ? 'Add Point' : 'Add Slice'}
            </Button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[80px]">
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}