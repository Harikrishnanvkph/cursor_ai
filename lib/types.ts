import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js'

export interface ChartStore {
  chartType: string
  chartData: ChartData
  chartConfig: ChartOptions
  setChartType: (type: string) => void
  updateDataset: (index: number, updates: any) => void
  setFullChart: (payload: { chartType: string; chartData: ChartData; chartConfig: ChartOptions }) => void
} 