import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X } from "lucide-react";
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
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            value={val?.x ?? 0}
            onChange={e => handleValueChange(rowIdx, colIdx, 'x', e.target.value)}
            className="h-7 text-xs w-16"
            placeholder="X"
          />
          <Input
            type="number"
            value={val?.y ?? 0}
            onChange={e => handleValueChange(rowIdx, colIdx, 'y', e.target.value)}
            className="h-7 text-xs w-16"
            placeholder="Y"
          />
          {chartType === 'bubble' && (
            <Input
              type="number"
              value={val?.r ?? 10}
              onChange={e => handleValueChange(rowIdx, colIdx, 'r', e.target.value)}
              className="h-7 text-xs w-14"
              placeholder="R"
            />
          )}
        </div>
      );
    }

    return (
      <Input
        type="number"
        value={val ?? ""}
        onChange={e => handleValueChange(rowIdx, colIdx, null, e.target.value)}
        className="h-7 text-xs w-20"
        placeholder="Value"
      />
    );
  };

  const columnWidth = isCoordinateChart ? "220px" : "140px";
  const gridTemplateColumns = `40px 160px repeat(${datasets.length}, ${columnWidth}) 40px`;
  const minWidth = 40 + 160 + (datasets.length * (isCoordinateChart ? 220 : 140)) + 40;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[85vh] flex flex-col p-0 gap-0">
        {/* Modal Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gray-50/50 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {isCoordinateChart ? 'Edit Points' : 'Edit Slices'} (Grouped Mode)
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Edit value{isCoordinateChart ? 's' : ''} for all datasets across {sliceLabels.length} {isCoordinateChart ? 'points' : 'slices'}.
          </p>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto min-h-0 relative">
          <div className="min-w-fit inline-block w-full">
            {/* Sticky Header Row */}
            <div
              className="sticky top-0 z-10 grid gap-3 items-center px-4 py-2 bg-gray-50 border-b text-[11px] font-medium text-gray-500 uppercase tracking-wider backdrop-blur-sm bg-gray-50/90"
              style={{ gridTemplateColumns, minWidth: '100%' }}
            >
              <div className="text-center">#</div>
              <div>{isCoordinateChart ? 'Point Name' : 'Slice Name'}</div>
              {datasets.map((ds: any, i: number) => (
                <div key={i} className="truncate px-1" title={ds.label}>
                  {ds.label || `Dataset ${i + 1}`}
                </div>
              ))}
              <div></div>
            </div>

            {/* Data Rows */}
            <div className="p-4 space-y-1.5 ">
              {sliceLabels.map((label, rowIdx) => (
                <div
                  key={rowIdx}
                  className="grid gap-3 items-start py-2 px-0 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors rounded-sm"
                  style={{ gridTemplateColumns, minWidth: '100%' }}
                >
                  {/* Row Number */}
                  <div className="flex items-center justify-center h-8 text-xs text-gray-400 font-mono">
                    {rowIdx + 1}
                  </div>

                  {/* Slice/Point Name */}
                  <div className="pt-0.5">
                    <Input
                      value={label}
                      onChange={e => handleLabelChange(rowIdx, e.target.value)}
                      className="h-8 text-xs font-medium"
                      placeholder={isCoordinateChart ? "Point Name" : "Slice Name"}
                    />
                  </div>

                  {/* Dataset Values */}
                  {datasets.map((ds: any, colIdx: number) => (
                    <div key={colIdx} className="pt-0.5">
                      {renderDatasetInputs(rowIdx, colIdx, values[rowIdx]?.[colIdx])}
                    </div>
                  ))}

                  {/* Delete Button */}
                  <div className="flex justify-center pt-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSlice(rowIdx)}
                      disabled={sliceLabels.length <= 1}
                      className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-gray-50/50 gap-3 flex-shrink-0">
          <div className="flex-1 flex justify-start">
            <Button
              variant="outline"
              onClick={handleAddSlice}
              className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
            >
              <Plus className="w-4 h-4" />
              Add {isCoordinateChart ? 'Point' : 'Slice'}
            </Button>
          </div>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}