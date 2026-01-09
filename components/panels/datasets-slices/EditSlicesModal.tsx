import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditSlicesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chartData: any;
  chartType: string;
  onSave: (newSliceLabels: string[], newValues: any[][], selectedGroupId: string) => void;
  // New props for group support
  groups?: any[];
  activeGroupId?: string;
  chartMode?: 'single' | 'grouped';
}

export function EditSlicesModal({ open, onOpenChange, chartData, chartType, onSave, groups = [], activeGroupId, chartMode = 'single' }: EditSlicesModalProps) {
  const datasets = chartData.datasets;

  // Group Management State
  const [selectedGroupId, setSelectedGroupId] = useState<string>(activeGroupId || 'default');
  const [sliceLabels, setSliceLabels] = useState<string[]>([]);
  const [values, setValues] = useState<any[][]>([]);
  const [originalSliceCount, setOriginalSliceCount] = useState<number>(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Filter datasets based on mode and selected group
  const getFilteredDatasets = (groupId: string) => {
    if (chartMode === 'single') return datasets.map((d: any, i: number) => ({ ...d, originalIndex: i }));

    // In grouped mode, filter by selected group
    return datasets
      .map((d: any, i: number) => ({ ...d, originalIndex: i }))
      .filter((d: any) => d.groupId === groupId || (!d.groupId && groupId === 'default'));
  };

  // Determine the chart type based on the selected group
  // For groups with baseChartType, use that
  // For default group or unknown, detect from actual data structure
  const getGroupChartType = (groupId: string) => {
    if (chartMode === 'single') return chartType;

    // Check if this group has an explicit baseChartType
    if (groupId !== 'default') {
      const group = groups?.find(g => g.id === groupId);
      if (group?.baseChartType) {
        return group.baseChartType;
      }
    }

    // For default group or groups without baseChartType, 
    // detect from the actual data structure of the first dataset
    const filtered = getFilteredDatasets(groupId);
    if (filtered.length > 0 && filtered[0]?.data?.length > 0) {
      const firstDataPoint = filtered[0].data[0];
      // If first data point is an object with x/y properties, it's a coordinate chart
      if (typeof firstDataPoint === 'object' && firstDataPoint !== null) {
        if ('x' in firstDataPoint || 'y' in firstDataPoint) {
          if ('r' in firstDataPoint) return 'bubble';
          return 'scatter';
        }
      }
      // Otherwise it's a categorical chart (bar, line, etc.)
      return 'bar';
    }

    // Fallback
    return chartType;
  };

  // Computed values based on current selectedGroupId
  const filteredDatasets = getFilteredDatasets(selectedGroupId);
  const currentGroupChartType = getGroupChartType(selectedGroupId);
  const isCurrentGroupCoordinateChart = currentGroupChartType === 'scatter' || currentGroupChartType === 'bubble';

  // Initialize state for a specific group - completely isolated from other groups
  const initializeForGroup = (groupId: string) => {
    const filtered = getFilteredDatasets(groupId);
    if (filtered.length === 0) {
      setSliceLabels([]);
      setValues([]);
      return;
    }

    const groupChartType = getGroupChartType(groupId);
    const isCoordinate = groupChartType === 'scatter' || groupChartType === 'bubble';

    // Get the data length from the first dataset in this group
    const firstDataset = filtered[0];
    const dataLength = firstDataset?.data?.length || 0;

    // Generate labels - for coordinate charts, always use generic "Point N" names
    // For categorical charts, try to use existing labels but validate length
    let newLabels: string[];
    if (isCoordinate) {
      // For scatter/bubble, use simple point names
      newLabels = Array.from({ length: dataLength }, (_, i) => `Point ${i + 1}`);
    } else {
      // For categorical charts, use sliceLabels if they match the data length
      const existingLabels = firstDataset?.sliceLabels;
      if (Array.isArray(existingLabels) && existingLabels.length === dataLength) {
        newLabels = [...existingLabels];
      } else {
        newLabels = Array.from({ length: dataLength }, (_, i) => `Slice ${i + 1}`);
      }
    }
    setSliceLabels(newLabels);

    // Build values array - ONLY for filtered datasets
    // Structure: values[rowIdx][originalDatasetIndex]
    // We create a sparse-ish array where only filtered datasets have real values
    const newValues: any[][] = Array.from({ length: dataLength }, (_, rowIdx) => {
      // Create an array with slots for ALL datasets (to maintain indices)
      const row = new Array(datasets.length).fill(null);

      // Fill in values only for datasets in the current group
      filtered.forEach((ds: any) => {
        const originalIdx = ds.originalIndex;
        const val = ds.data[rowIdx];

        if (isCoordinate) {
          if (typeof val === 'object' && val !== null) {
            row[originalIdx] = {
              x: val.x ?? 0,
              y: val.y ?? 0,
              r: val.r ?? (groupChartType === 'bubble' ? 10 : undefined)
            };
          } else {
            row[originalIdx] = {
              x: 0,
              y: 0,
              r: groupChartType === 'bubble' ? 10 : undefined
            };
          }
        } else {
          row[originalIdx] = val ?? "";
        }
      });

      return row;
    });
    setValues(newValues);
    setOriginalSliceCount(dataLength); // Track original count for deletion detection
  };

  // Initialize state when modal opens
  useEffect(() => {
    if (open) {
      const initialGroupId = activeGroupId || 'default';
      setSelectedGroupId(initialGroupId);
      // Use setTimeout to ensure state update completes before initialization
      setTimeout(() => initializeForGroup(initialGroupId), 0);
    }
  }, [open]); // Only react to modal open/close

  // Re-initialize state when group selection changes (while modal is open)
  useEffect(() => {
    if (open) {
      setShowDeleteConfirm(false); // Reset warning when switching groups
      initializeForGroup(selectedGroupId);
    }
  }, [selectedGroupId, datasets]); // Include datasets as dependency


  const handleLabelChange = (idx: number, value: string) => {
    const newLabels = [...sliceLabels];
    newLabels[idx] = value;
    setSliceLabels(newLabels);
  };

  const handleValueChange = (row: number, originalCol: number, field: string | null, value: string) => {
    const newValues = values.map(arr => [...arr]);
    const numVal = value === "" ? "" : Number(value);

    if (isCurrentGroupCoordinateChart) {
      const currentVal = newValues[row][originalCol] || { x: 0, y: 0 };
      if (field) {
        newValues[row][originalCol] = { ...currentVal, [field]: numVal };
      }
    } else {
      newValues[row][originalCol] = numVal;
    }
    setValues(newValues);
  };

  const handleAddSlice = () => {
    const newLabel = isCurrentGroupCoordinateChart ? `Point ${sliceLabels.length + 1}` : `Slice ${sliceLabels.length + 1}`;
    setSliceLabels([...sliceLabels, newLabel]);

    const newRow = datasets.map(() =>
      isCurrentGroupCoordinateChart
        ? { x: 0, y: 0, r: currentGroupChartType === 'bubble' ? 10 : undefined }
        : ""
    );
    setValues([...values, newRow]);
  };

  const handleRemoveSlice = (idx: number) => {
    if (sliceLabels.length <= 1) return;
    setSliceLabels(sliceLabels.filter((_, i) => i !== idx));
    setValues(values.filter((_, i) => i !== idx));
  };

  // Actual save logic - called after confirmation if needed
  const performSave = () => {
    const cleanedValues = values.map(row => row.map(val => {
      if (isCurrentGroupCoordinateChart) {
        return {
          x: Number(val?.x || 0),
          y: Number(val?.y || 0),
          ...(currentGroupChartType === 'bubble' ? { r: Number(val?.r || 10) } : {})
        };
      }
      return val === "" ? null : Number(val);
    }));
    onSave(sliceLabels, cleanedValues, selectedGroupId);
    onOpenChange(false);
  };

  // Handle save button click - check for deletions first
  const handleSave = () => {
    const deletedCount = originalSliceCount - sliceLabels.length;
    if (deletedCount > 0) {
      // Slices were deleted, show confirmation
      setShowDeleteConfirm(true);
    } else {
      // No deletions, save directly
      performSave();
    }
  };

  const renderDatasetInputs = (rowIdx: number, originalColIdx: number, val: any) => {
    if (isCurrentGroupCoordinateChart) {
      return (
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            value={val?.x ?? 0}
            onChange={e => handleValueChange(rowIdx, originalColIdx, 'x', e.target.value)}
            className="h-7 text-xs w-16"
            placeholder="X"
          />
          <Input
            type="number"
            value={val?.y ?? 0}
            onChange={e => handleValueChange(rowIdx, originalColIdx, 'y', e.target.value)}
            className="h-7 text-xs w-16"
            placeholder="Y"
          />
          {currentGroupChartType === 'bubble' && (
            <Input
              type="number"
              value={val?.r ?? 10}
              onChange={e => handleValueChange(rowIdx, originalColIdx, 'r', e.target.value)}
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
        onChange={e => handleValueChange(rowIdx, originalColIdx, null, e.target.value)}
        className="h-7 text-xs w-20"
        placeholder="Value"
      />
    );
  };

  const columnWidth = isCurrentGroupCoordinateChart ? "220px" : "140px";
  const numFilteredDatasets = filteredDatasets.length;

  // Grid layout must account for visible columns only
  const gridTemplateColumns = `40px 160px repeat(${numFilteredDatasets}, ${columnWidth}) 40px`;
  // Min width calculation
  const minWidth = 40 + 160 + (numFilteredDatasets * (isCurrentGroupCoordinateChart ? 220 : 140)) + 40;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            // Reset warning state when dialog closes
            setShowDeleteConfirm(false);
          }
          onOpenChange(isOpen);
        }}
      >
        <DialogContent className="max-w-4xl w-full max-h-[85vh] flex flex-col p-0 gap-0">
          {/* Modal Header */}
          <DialogHeader className="px-6 py-4 border-b bg-gray-50/50 flex-shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {isCurrentGroupCoordinateChart ? 'Edit Points' : 'Edit Slices'} {chartMode === 'grouped' ? '(Grouped Mode)' : ''}
                </DialogTitle>
                <p className="text-sm mt-1 flex items-center gap-1.5">
                  {(() => {
                    // Determine if all datasets in this group have the same chart type
                    const groupDatasetTypes = filteredDatasets.map((ds: any) => {
                      const firstPoint = ds.data?.[0];
                      if (typeof firstPoint === 'object' && firstPoint !== null) {
                        if ('r' in firstPoint) return 'bubble';
                        if ('x' in firstPoint || 'y' in firstPoint) return 'scatter';
                      }
                      return 'categorical'; // bar, line, pie, etc.
                    });

                    const uniqueTypes = [...new Set(groupDatasetTypes)];
                    const isUniform = uniqueTypes.length === 1;
                    const chartTypeName = currentGroupChartType.charAt(0).toUpperCase() + currentGroupChartType.slice(1);
                    const pointsLabel = isCurrentGroupCoordinateChart ? 'points' : 'slices';

                    return (
                      <>
                        <span className={isUniform ? "text-blue-600 font-medium" : "text-amber-600 font-medium"}>
                          {isUniform ? `Uniform ${chartTypeName}` : 'Mixed'} group
                        </span>
                        <span className="text-gray-400">·</span>
                        <span className="text-emerald-600 font-medium">{numFilteredDatasets} dataset(s)</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-purple-600 font-medium">{sliceLabels.length} {pointsLabel}</span>
                      </>
                    );
                  })()}
                </p>
              </div>

              {/* Group Selector (Only in Grouped Mode) */}
              {chartMode === 'grouped' && groups.length > 0 && (
                <div className="w-[200px] mr-8">
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue placeholder="Select Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="default" value="default">Default Group</SelectItem>
                      {groups.filter(g => !g.isDefault).map(group => (
                        <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
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
                <div>{isCurrentGroupCoordinateChart ? 'Point Name' : 'Slice Name'}</div>
                {filteredDatasets.map((ds: any, i: number) => (
                  <div key={i} className="truncate px-1" title={ds.label}>
                    {ds.label || `Dataset ${ds.originalIndex + 1}`}
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
                        placeholder={isCurrentGroupCoordinateChart ? "Point Name" : "Slice Name"}
                      />
                    </div>

                    {/* Dataset Values - Map FILTERED datasets */}
                    {filteredDatasets.map((ds: any, i: number) => (
                      <div key={i} className="pt-0.5">
                        {/* Use originalIndex to access values array which stores ALL data */}
                        {renderDatasetInputs(rowIdx, ds.originalIndex, values[rowIdx]?.[ds.originalIndex])}
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
                Add {isCurrentGroupCoordinateChart ? 'Point' : 'Slice'}
              </Button>
            </div>

            {/* Inline Delete Warning */}
            {showDeleteConfirm ? (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span className="text-sm text-amber-800">
                  <span className="font-semibold text-red-600">{originalSliceCount - sliceLabels.length}</span> {isCurrentGroupCoordinateChart ? 'point(s)' : 'slice(s)'} removed. Save changes?
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    initializeForGroup(selectedGroupId); // Restore original slices
                  }}
                  className="text-gray-600 hover:text-gray-800"
                >
                  No, Undo
                </Button>
                <Button
                  size="sm"
                  onClick={performSave}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Yes, Save
                </Button>
              </div>
            ) : (
              <>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]">
                  Save Changes
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}