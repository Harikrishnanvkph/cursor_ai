"use client"

import { DatasetPanel } from "./panels/dataset-panel"
import { DesignPanel } from "./panels/design-panel"
import { AxesPanel } from "./panels/axes/axes-panel"
import { LabelsPanel } from "./panels/labels-panel"
import { AnimationsPanel } from "./panels/animations-panel"
import { AdvancedPanel } from "./panels/advanced-panel"
import { ExportPanel } from "./panels/export-panel"
import { TypesTogglesPanel } from "./panels/types-toggles-panel"
import { DatasetsSlicesPanel } from "./panels/datasets-slices-panel"

interface ConfigPanelProps {
  activeTab: string
}

export function ConfigPanel({ activeTab }: ConfigPanelProps) {
  const renderPanel = () => {
    switch (activeTab) {
      case "types_toggles":
        return <TypesTogglesPanel />
      case "datasets_slices":
        return <DatasetsSlicesPanel activeTab={activeTab} />
      case "datasets":
        return <DatasetPanel />
      case "design":
        return <DesignPanel />
      case "axes":
        return <AxesPanel />
      case "labels":
        return <LabelsPanel />
      case "animations":
        return <AnimationsPanel />
      case "advanced":
        return <AdvancedPanel />
      case "export":
        return <ExportPanel />
      default:
        return <TypesTogglesPanel />
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">{renderPanel()}</div>
    </div>
  )
}
