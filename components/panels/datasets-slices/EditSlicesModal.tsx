import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

interface EditSlicesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chartData: any;
  onSave: (newSliceLabels: string[], newValues: number[][]) => void;
}

export function EditSlicesModal({ open, onOpenChange, chartData, onSave }: EditSlicesModalProps) {
  const datasets = chartData.datasets;
  const initialSliceLabels = chartData.labels || (datasets[0]?.sliceLabels ?? datasets[0]?.data.map((_: any, i: number) => `Slice ${i + 1}`)) || [];
  // 2D array: values[row][col]
  const initialValues: number[][] = initialSliceLabels.map((_, rowIdx) =>
    datasets.map((ds: any) => ds.data[rowIdx] ?? "")
  );
  const [sliceLabels, setSliceLabels] = useState<string[]>(initialSliceLabels);
  const [values, setValues] = useState<any[][]>(initialValues);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setSliceLabels(initialSliceLabels);
    setValues(
      initialSliceLabels.map((_, rowIdx) =>
        datasets.map((ds: any) => ds.data[rowIdx] ?? "")
      )
    );
  }, [open, chartData]);

  useEffect(() => {
    if (editingIndex !== null && inputRefs.current[editingIndex]) {
      inputRefs.current[editingIndex]?.focus();
    }
  }, [editingIndex]);

  const handleLabelChange = (idx: number, value: string) => {
    const newLabels = [...sliceLabels];
    newLabels[idx] = value;
    setSliceLabels(newLabels);
  };

  const handleValueChange = (row: number, col: number, value: string) => {
    const newValues = values.map(arr => [...arr]);
    newValues[row][col] = value === "" ? "" : Number(value);
    setValues(newValues);
  };

  const handleAddSlice = () => {
    setSliceLabels([...sliceLabels, `Slice ${sliceLabels.length + 1}`]);
    setValues([...values, datasets.map(() => "")]);
    setEditingIndex(sliceLabels.length);
  };

  const handleRemoveSlice = (idx: number) => {
    if (sliceLabels.length <= 1) return;
    setSliceLabels(sliceLabels.filter((_, i) => i !== idx));
    setValues(values.filter((_, i) => i !== idx));
    setEditingIndex(null);
  };

  const handleSave = () => {
    // Convert all values to numbers or null
    const cleanedValues = values.map(row => row.map(val => val === "" ? null : Number(val)));
    onSave(sliceLabels, cleanedValues);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle>Edit Slices (Grouped Mode)</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto max-h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slice Name</TableHead>
                {datasets.map((ds: any, i: number) => (
                  <TableHead key={i}>{ds.label || `Dataset ${i + 1}`}</TableHead>
                ))}
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sliceLabels.map((label, rowIdx) => (
                <TableRow key={rowIdx}>
                  <TableCell>
                    <Input
                      ref={el => (inputRefs.current[rowIdx] = el)}
                      value={label}
                      onChange={e => handleLabelChange(rowIdx, e.target.value)}
                      onFocus={() => setEditingIndex(rowIdx)}
                      className="w-40"
                    />
                  </TableCell>
                  {datasets.map((ds: any, colIdx: number) => (
                    <TableCell key={colIdx} className="text-center">
                      <Input
                        type="number"
                        value={values[rowIdx]?.[colIdx] ?? ""}
                        onChange={e => handleValueChange(rowIdx, colIdx, e.target.value)}
                        className="w-20 text-center"
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSlice(rowIdx)}
                      disabled={sliceLabels.length <= 1}
                      title="Remove Slice"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={handleAddSlice}>
            <Plus className="w-4 h-4 mr-1" /> Add Slice
          </Button>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave} variant="default">Save</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
} 