"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { ChartPreview } from "@/components/chart-preview"
import { ConfigPanel } from "@/components/config-panel"
import { useChartStore } from "@/lib/chart-store"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditorPage() {
  const [activeTab, setActiveTab] = useState("types_toggles")
  const { chartConfig } = useChartStore()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar - Navigation */}
      <div className="w-64 flex-shrink-0 flex flex-col h-full">
        <div className="p-4">
          <Link href="/landing" className="block mb-4">
            <Button variant="outline" className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border-blue-200 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Generate AI Chart
            </Button>
          </Link>
          <div className="border-b mb-4"></div>
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Center Area - Chart Preview */}
      <div className="flex-1 min-w-0 p-4">
        <ChartPreview />
      </div>

      {/* Right Panel - Configuration */}
      <div className="w-80 flex-shrink-0 border-l bg-white overflow-hidden">
        <ConfigPanel activeTab={activeTab} />
      </div>
    </div>
  )
} 