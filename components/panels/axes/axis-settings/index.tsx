"use client"

import { cn } from "@/lib/utils"
import { useState, useCallback } from "react"
import { GeneralTab } from "./general-tab"
import { TicksTab } from "./ticks-tab"
import { MoreTab } from "./more-tab"

interface AxisSettingsProps {
    axis: 'x' | 'y'
    config: any
    onUpdate: (path: string, value: any) => void
    className?: string
    chartType?: string
}

type AxisTab = 'general' | 'ticks' | 'more'

export function AxisSettings({ axis, config, onUpdate, className, chartType }: AxisSettingsProps) {
    const [activeTab, setActiveTab] = useState<AxisTab>('general')

    const updateConfig = useCallback((path: string, value: any) => {
        onUpdate(`scales.${axis}.${path}`, value)
    }, [axis, onUpdate])

    const updateNestedConfig = useCallback((basePath: string, path: string, value: any) => {
        updateConfig(`${basePath}.${path}`, value)
    }, [updateConfig])

    const renderTabContent = (tab: AxisTab) => {
        switch (tab) {
            case 'general':
                return (
                    <GeneralTab
                        axis={axis}
                        config={config}
                        updateConfig={updateConfig}
                        updateNestedConfig={updateNestedConfig}
                    />
                )
            case 'ticks':
                return (
                    <TicksTab
                        axis={axis}
                        config={config}
                        chartType={chartType}
                        updateConfig={updateConfig}
                        updateNestedConfig={updateNestedConfig}
                    />
                )
            case 'more':
                return (
                    <MoreTab
                        axis={axis}
                        config={config}
                        onUpdate={onUpdate}
                        updateConfig={updateConfig}
                    />
                )
            default:
                return null
        }
    }

    const renderTabButton = useCallback((tab: AxisTab, icon: React.ReactNode, isCompact = false) => (
        <button
            key={tab}
            className={cn(
                "relative flex items-center gap-1 font-medium transition-all duration-200 flex-shrink-0 bg-transparent border-b-2",
                isCompact ? "px-2 py-2 text-xs" : "px-3 py-2 text-sm gap-1.5",
                activeTab === tab
                    ? "text-blue-600 border-blue-500"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-gray-300"
            )}
            onClick={() => setActiveTab(tab)}
        >
            {icon}
            {!isCompact && <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>}
        </button>
    ), [activeTab])

    return (
        <div className={cn("flex flex-col h-full overflow-hidden", className)}>
            {/* Tab Navigation with Better Overflow Handling */}
            <div className="flex items-center border-b bg-white relative">
                {/* Scrollable Tab Container */}
                <div
                    className="flex items-center overflow-x-auto flex-1 px-2"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 transparent'
                    }}
                >
                    <div className="flex items-center gap-1 min-w-max py-1">
                        {/* Full tabs for larger screens */}
                        <div className="hidden md:flex items-center gap-1">
                            {renderTabButton('general', <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>)}
                            {renderTabButton('ticks', <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 20h13" /><path d="M12 14h13" /><path d="M3 4h13" /><path d="M3 10h13" /><path d="M3 16h7" /><path d="M3 22h7" /></svg>)}
                            {renderTabButton('more', <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>)}
                        </div>

                        {/* Compact icon-only tabs for smaller screens */}
                        <div className="flex md:hidden items-center gap-0.5">
                            {renderTabButton('general', <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>, true)}
                            {renderTabButton('ticks', <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 20h13" /><path d="M12 14h13" /><path d="M3 4h13" /><path d="M3 10h13" /><path d="M3 16h7" /><path d="M3 22h7" /></svg>, true)}
                            {renderTabButton('more', <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>, true)}
                        </div>
                    </div>
                </div>
            </div>

            <div key={activeTab} className="flex-1 overflow-y-auto p-2">
                {renderTabContent(activeTab)}
            </div>
        </div>
    )
}
