"use client"

import { Database, BarChart3, RotateCcw } from "lucide-react"

// Chart type display names for categorical charts
const CHART_TYPE_LABELS: Record<string, string> = {
    bar: 'Bar',
    horizontalBar: 'Horizontal Bar',
    stackedBar: 'Stacked Bar',
    line: 'Line',
    area: 'Area',
    pie: 'Pie',
    doughnut: 'Doughnut',
    polarArea: 'Polar Area',
    radar: 'Radar',
    scatter: 'Scatter',
    bubble: 'Bubble'
}

interface ChartSetupScreenProps {
    targetChartType: string
    direction: 'toScatter' | 'toCategorical'
    hasBackup?: boolean // Whether there's backed up data to restore
    onLoadSample: () => void
    onRestore?: () => void // Handler to restore backed up data
    onQuickTransform?: () => void
    onCreateDataset?: () => void
    onCancel: () => void
}

export function ScatterBubbleSetupScreen({
    targetChartType,
    direction,
    hasBackup = false,
    onLoadSample,
    onRestore,
    onQuickTransform,
    onCreateDataset,
    onCancel
}: ChartSetupScreenProps) {
    const targetLabel = CHART_TYPE_LABELS[targetChartType] || targetChartType

    // Scatter/Bubble setup - transitioning FROM categorical TO scatter/bubble
    if (direction === 'toScatter') {
        const isScatter = targetChartType === 'scatter'
        const isBubble = targetChartType === 'bubble'
        const chartTypeLabel = isBubble ? 'Bubble' : 'Scatter'

        return (
            <div className="flex flex-col items-center justify-center h-full w-full text-gray-400 gap-4 p-8">
                <div className="text-center max-w-md">
                    {/* Icon */}
                    <div className="mb-6">
                        <div className="text-purple-400 mx-auto w-16 h-16">
                            {isScatter ? (
                                <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="6" cy="18" r="2" fill="currentColor" />
                                    <circle cx="10" cy="10" r="2" fill="currentColor" />
                                    <circle cx="15" cy="14" r="2" fill="currentColor" />
                                    <circle cx="18" cy="6" r="2" fill="currentColor" />
                                    <circle cx="8" cy="6" r="2" fill="currentColor" />
                                </svg>
                            ) : (
                                <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="6" cy="16" r="3" fill="currentColor" opacity="0.6" />
                                    <circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.6" />
                                    <circle cx="17" cy="14" r="2.5" fill="currentColor" opacity="0.6" />
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <p className="text-lg font-semibold text-gray-600 mb-2">
                        Set Up {chartTypeLabel} Chart
                    </p>

                    {/* Description */}
                    <p className="text-sm text-gray-500 mb-6">
                        {chartTypeLabel} charts use <span className="font-semibold text-blue-600">coordinate data</span> (X, Y{isBubble ? ', Size' : ''}).
                        <br />
                        {hasBackup && onRestore
                            ? 'You can restore your previous data or load fresh sample data.'
                            : 'Choose how to initialize your data:'}
                    </p>

                    {/* Primary Action - Restore if backup exists, otherwise Load Sample */}
                    {hasBackup && onRestore ? (
                        <>
                            <button
                                onClick={onRestore}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                            >
                                <RotateCcw className="h-5 w-5" />
                                Restore Previous Dataset Used
                            </button>

                            {/* Helper text */}
                            <p className="text-xs text-gray-400 mt-4">
                                This will restore your previous {chartTypeLabel} chart data
                            </p>

                            {/* Secondary option - Load fresh sample */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-500">
                                    Or{' '}
                                    <button
                                        onClick={onLoadSample}
                                        className="text-blue-500 hover:text-blue-600 hover:underline font-semibold"
                                    >
                                        load sample data
                                    </button>
                                    {' '}instead, or{' '}
                                    <button
                                        onClick={onCancel}
                                        className="text-gray-500 hover:text-gray-700 hover:underline"
                                    >
                                        cancel
                                    </button>
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Primary Action - Load Sample */}
                            <button
                                onClick={onLoadSample}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                            >
                                <Database className="h-5 w-5" />
                                Load Sample {chartTypeLabel} Data
                            </button>

                            {/* Helper text */}
                            <p className="text-xs text-gray-400 mt-4">
                                This will load {isBubble ? '8 bubbles with varying sizes' : '8 sample data points'}
                            </p>

                            {/* Secondary Actions */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-500">
                                    Or{' '}
                                    {onQuickTransform && (
                                        <>
                                            <button
                                                onClick={onQuickTransform}
                                                className="text-blue-500 hover:text-blue-600 hover:underline font-semibold"
                                            >
                                                quick transform
                                            </button>
                                            {' '}existing data, or{' '}
                                        </>
                                    )}
                                    {onCreateDataset && (
                                        <>
                                            <button
                                                onClick={onCreateDataset}
                                                className="text-blue-500 hover:text-blue-600 hover:underline font-semibold"
                                            >
                                                create manually
                                            </button>
                                            , or{' '}
                                        </>
                                    )}
                                    <button
                                        onClick={onCancel}
                                        className="text-gray-500 hover:text-gray-700 hover:underline"
                                    >
                                        cancel
                                    </button>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )
    }

    // Categorical setup - transitioning FROM scatter/bubble TO categorical
    // Show different UI based on whether backup exists
    return (
        <div className="flex flex-col items-center justify-center h-full w-full text-gray-400 gap-4 p-8">
            <div className="text-center max-w-md">
                {/* Icon - Bar chart for categorical */}
                <div className="mb-6">
                    <div className="text-purple-400 mx-auto">
                        <BarChart3 className="w-16 h-16" strokeWidth={1.5} />
                    </div>
                </div>

                {/* Title */}
                <p className="text-lg font-semibold text-gray-600 mb-2">
                    Switch to {targetLabel} Chart
                </p>

                {/* Description */}
                <p className="text-sm text-gray-500 mb-6">
                    {targetLabel} charts use <span className="font-semibold text-blue-600">categorical data</span> (labels + values).
                    <br />
                    {hasBackup
                        ? 'You can restore your previous data or load fresh sample data.'
                        : 'Your current scatter/bubble data is incompatible.'}
                </p>

                {/* Primary Action - Restore if backup exists, otherwise Load Sample */}
                {hasBackup && onRestore ? (
                    <>
                        <button
                            onClick={onRestore}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                            <RotateCcw className="h-5 w-5" />
                            Restore Previous Dataset Used
                        </button>

                        {/* Helper text */}
                        <p className="text-xs text-gray-400 mt-4">
                            This will restore your original {targetLabel} chart data
                        </p>

                        {/* Secondary option - Load fresh sample */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                                Or{' '}
                                <button
                                    onClick={onLoadSample}
                                    className="text-blue-500 hover:text-blue-600 hover:underline font-semibold"
                                >
                                    load sample data
                                </button>
                                {' '}instead, or{' '}
                                <button
                                    onClick={onCancel}
                                    className="text-gray-500 hover:text-gray-700 hover:underline"
                                >
                                    cancel
                                </button>
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <button
                            onClick={onLoadSample}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                            <Database className="h-5 w-5" />
                            Load Sample {targetLabel} Data
                        </button>

                        {/* Helper text */}
                        <p className="text-xs text-gray-400 mt-4">
                            This will load sample categorical data with proper labels
                        </p>

                        {/* Cancel option */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                                Or{' '}
                                <button
                                    onClick={onCancel}
                                    className="text-gray-500 hover:text-gray-700 hover:underline"
                                >
                                    cancel and stay on current chart
                                </button>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
