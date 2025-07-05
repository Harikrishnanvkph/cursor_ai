import { Chart as ChartJS, type Chart, type ChartType } from "chart.js";
import { useChartStore } from "./chart-store";
import { type ExtendedChartData, type SupportedChartType } from "./chart-store";
import { chartTypeMapping, isAreaChart } from "./chart-store";

/**
 * Export the current chart as SVG using Chart.js's built-in SVG export functionality.
 */
export async function downloadChartAsSVG() {
  try {
    const { chartType, chartData, chartConfig } = useChartStore.getState();
    
    // Create a temporary canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Create Chart.js instance
    const chart = new ChartJS(ctx, {
      type: chartTypeMapping[chartType],
      data: chartData,
      options: chartConfig,
    }) as Chart<ChartType>;

    // Export to SVG
    const svg = chart.toBase64Image("image/svg+xml");
    
    // Create download link
    const a = document.createElement("a");
    a.href = svg;
    a.download = `chart-${new Date().toISOString().slice(0, 10)}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up
    chart.destroy();
    canvas.remove();
  } catch (error) {
    console.error("Error exporting chart to SVG:", error);
  }
}

function asNumber(n: unknown): number {
  if (typeof n === "number") return n;
  if (n && typeof n === "object" && "y" in (n as any)) return (n as any).y as number;
  return 0;
}
