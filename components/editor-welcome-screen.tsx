"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Database, Sparkles, TrendingUp, PieChart, LineChart } from "lucide-react"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
import { toast } from "sonner"

interface EditorWelcomeScreenProps {
  onDatasetClick?: () => void
  size?: "default" | "compact"
  className?: string
}

export function EditorWelcomeScreen({ onDatasetClick, size = "default", className = "" }: EditorWelcomeScreenProps) {
  const { setFullChart, setHasJSON, setChartMode } = useChartStore()
  const { setEditorMode } = useTemplateStore()
  const { clearMessages, setBackendConversationId } = useChatStore()

  const handleLoadSampleData = () => {
    // Clear any previous conversation state to ensure this is treated as a NEW chart
    clearMessages()
    setBackendConversationId(null)

    // Set editor mode to chart when loading sample data
    setEditorMode('chart')
    // Load sample bar chart data for SINGLE mode
    const sampleData = {
      labels: ['January', 'February', 'March', 'April', 'May', 'June'],
      datasets: [{
        label: 'Sample Dataset',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 2,
        pointImages: [null, null, null, null, null, null],
        pointImageConfig: [
          { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
          { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
          { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
          { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
          { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
          { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
        ],
        mode: 'single' as const,
        sliceLabels: ['January', 'February', 'March', 'April', 'May', 'June'],
        chartType: 'bar' as const, // Preserve the chart type this dataset was created with
      }]
    }

    // Get current store state
    const { chartData, addDataset } = useChartStore.getState()

    // Check if we already have datasets
    if (chartData.datasets && chartData.datasets.length > 0) {
      // Append sample dataset
      addDataset(sampleData.datasets[0])
      setHasJSON(true)
      toast.success("Sample dataset added to current chart")
    } else {
      // No datasets, start fresh
      setChartMode('single')
      const currentConfig = useChartStore.getState().chartConfig
      setFullChart({
        chartType: 'bar',
        chartData: sampleData,
        chartConfig: currentConfig
      })
      // Mark that we have a valid chart
      setHasJSON(true)
      toast.success("Sample data loaded successfully!")
    }

    // Mark that we have a valid chart
    setHasJSON(true)

    toast.success("Sample data loaded successfully!")
  }

  const handleGoToDataset = () => {
    // Clear any previous conversation state to ensure this is treated as a NEW chart
    clearMessages()
    setBackendConversationId(null)

    if (onDatasetClick) {
      onDatasetClick()
      toast.info("Navigate to Datasets tab to add your data")
    }
  }

  const isCompact = size === "compact"

  return (
    <div className={`flex items-center justify-center h-full w-full p-4 ${className}`}>
      <Card className={`w-full ${isCompact ? 'max-w-lg' : 'max-w-2xl'} border-2 border-dashed border-gray-300 bg-gradient-to-br from-white to-gray-50 shadow-xl`}>
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
              <div className="relative p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                <BarChart3 className={`${isCompact ? 'h-6 w-6' : 'h-8 w-8'} text-white`} />
              </div>
            </div>
          </div>
          <CardTitle className={`${isCompact ? 'text-2xl' : 'text-3xl'} font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent`}>
            Welcome to Chart Editor
          </CardTitle>
          <CardDescription className={`${isCompact ? 'text-sm' : 'text-base'} text-gray-600 mt-2`}>
            Start creating your chart by choosing one of the options below
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pb-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Sample Data Option */}
            <Card
              className="border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={handleLoadSampleData}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Load Sample Data</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  Start with pre-loaded example data to explore chart features and customization options
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <TrendingUp className="h-4 w-4" />
                  <span>Quick start • 6 data points</span>
                </div>
              </CardContent>
            </Card>

            {/* Create Dataset Option */}
            <Card
              className="border-2 border-gray-200 hover:border-green-400 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={handleGoToDataset}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Database className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Add Your Own Data</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  Navigate to the Datasets panel to input your custom data and create a personalized chart
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Database className="h-4 w-4" />
                  <span>Custom data • Full control</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Type Examples */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-center text-gray-600 mb-3 font-medium">
              Supported Chart Types
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { name: "Bar", icon: BarChart3, color: "bg-blue-100 text-blue-700" },
                { name: "Line", icon: LineChart, color: "bg-green-100 text-green-700" },
                { name: "Pie", icon: PieChart, color: "bg-purple-100 text-purple-700" },
                { name: "Scatter", icon: TrendingUp, color: "bg-orange-100 text-orange-700" },
                { name: "Radar", icon: Sparkles, color: "bg-pink-100 text-pink-700" },
                { name: "Area", icon: LineChart, color: "bg-teal-100 text-teal-700" },
              ].map((type, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${type.color} text-xs font-medium`}
                >
                  <type.icon className="h-3.5 w-3.5" />
                  <span>{type.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-center text-blue-800">
              <span className="font-semibold">💡 Tip:</span> You can also generate charts using AI in the{" "}
              <span className="font-semibold">Generate AI Chart</span> page
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

