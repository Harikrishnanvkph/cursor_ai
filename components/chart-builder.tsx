"use client"

import { DatasetPanel } from "./panels/dataset-panel"
import { DesignPanel } from "./panels/design-panel"
import { AxesPanel } from "./panels/axes/axes-panel"
import { ExportPanel } from "./panels/export-panel"

interface ChartBuilderProps {
  activeTab: string
}

export function ChartBuilder({ activeTab }: ChartBuilderProps) {
  const renderPanel = () => {
    switch (activeTab) {
      case "datasets":
        return <DatasetPanel />
      case "design":
        return <DesignPanel />
      case "axes":
        return <AxesPanel />
      case "export":
        return <ExportPanel />
      default:
        return <DatasetPanel />
    }
  }

  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ultimate Chart Builder</h1>
        <p className="text-gray-600 mt-2">Create beautiful, interactive charts with extensive customization options</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 h-[calc(100%-120px)] overflow-auto">{renderPanel()}</div>
    </div>
  )
}
