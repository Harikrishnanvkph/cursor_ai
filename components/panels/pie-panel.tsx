"use client";

import { useChartStore } from "@/lib/chart-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Added import for Tabs components
import { PieChartIcon } from "lucide-react";

export function PiePanel() {
  const { chartConfig, updateChartConfig } = useChartStore();

  const dataLabelsConfig = chartConfig.plugins?.datalabels;

  const handleDatalabelsUpdate = (path: string, value: any) => {
    const newConfig = {
      ...chartConfig,
      plugins: {
        ...chartConfig.plugins,
        datalabels: {
          ...chartConfig.plugins?.datalabels,
          [path]: value,
        },
      },
    };
    updateChartConfig(newConfig);
  };

  const handleFontUpdate = (path: string, value: any) => {
    const newConfig = {
      ...chartConfig,
      plugins: {
        ...chartConfig.plugins,
        datalabels: {
          ...chartConfig.plugins?.datalabels,
          font: {
            ...(chartConfig.plugins?.datalabels as any)?.font,
            [path]: value,
          },
        },
      },
    };
    updateChartConfig(newConfig);
  };
  
  // Ensure formatter exists for pie/doughnut
  const currentFormatter = dataLabelsConfig?.formatter;
  const isPercentageFormat = typeof currentFormatter === 'function' && currentFormatter.toString().includes('percentage');

  const toggleFormat = () => {
    const newFormatter = isPercentageFormat 
      ? (value: any, context: any) => value // Show actual value
      : (value: any, context: any) => { // Show percentage
          const total = context.chart.data.datasets[0].data.reduce((acc: number, val: number) => acc + val, 0);
          const percentage = (value / total * 100).toFixed(1) + '%';
          return percentage;
        };
    handleDatalabelsUpdate('formatter', newFormatter);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <PieChartIcon className="h-4 w-4" />
          Pie Chart Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="labels" className="w-full">
          <TabsList className="grid w-full grid-cols-1"> {/* Can expand if more tabs needed */}
            <TabsTrigger value="labels">Data Labels</TabsTrigger>
          </TabsList>
          <TabsContent value="labels" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Label Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showDataLabels"
                    checked={dataLabelsConfig?.display || false}
                    onCheckedChange={(checked) => handleDatalabelsUpdate("display", checked)}
                  />
                  <Label htmlFor="showDataLabels">Show Data Labels</Label>
                </div>

                {dataLabelsConfig?.display && (
                  <>
                    <div>
                      <Label htmlFor="labelColor">Label Color</Label>
                      <Input
                        id="labelColor"
                        type="color"
                        value={dataLabelsConfig?.color as string || "#000000"}
                        onChange={(e) => handleDatalabelsUpdate("color", e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="labelFontSize">Font Size (px)</Label>
                      <Input
                        id="labelFontSize"
                        type="number"
                        value={(dataLabelsConfig?.font as any)?.size || 14}
                        onChange={(e) => handleFontUpdate("size", parseInt(e.target.value, 10))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="labelFontWeight">Font Weight</Label>
                      <Select
                        value={(dataLabelsConfig?.font as any)?.weight || "bold"}
                        onValueChange={(value) => handleFontUpdate("weight", value)}
                      >
                        <SelectTrigger id="labelFontWeight">
                          <SelectValue placeholder="Select weight" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                          <SelectItem value="lighter">Lighter</SelectItem>
                          <SelectItem value="bolder">Bolder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                       <Switch
                        id="labelFormat"
                        checked={isPercentageFormat}
                        onCheckedChange={toggleFormat}
                      />
                      <Label htmlFor="labelFormat">
                        Show as Percentage (vs. Value)
                      </Label>
                    </div>

                    <div>
                      <Label htmlFor="labelPosition">Label Position (Anchor)</Label>
                      <Select
                        value={dataLabelsConfig?.anchor as string || 'center'}
                        onValueChange={(value) => handleDatalabelsUpdate('anchor', value)}
                      >
                        <SelectTrigger id="labelPosition">
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="end">End (Outside)</SelectItem>
                          <SelectItem value="start">Start (Inside)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                     <div>
                      <Label htmlFor="labelAlign">Label Alignment (relative to Anchor)</Label>
                      <Select
                        value={dataLabelsConfig?.align as string || 'center'}
                        onValueChange={(value) => handleDatalabelsUpdate('align', value)}
                      >
                        <SelectTrigger id="labelAlign">
                          <SelectValue placeholder="Select alignment" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="end">End</SelectItem>
                          <SelectItem value="start">Start</SelectItem>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="bottom">Bottom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
