import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js'

export interface ChartStore {
  chartType: string
  chartData: ChartData
  chartConfig: ChartOptions
  fillArea: boolean
  showBorder: boolean
  setChartType: (type: string) => void
  toggleFillArea: () => void
  toggleShowBorder: () => void
  updateDataset: (index: number, updates: any) => void
  setFullChart: (payload: { chartType: string; chartData: ChartData; chartConfig: ChartOptions }) => void
} 