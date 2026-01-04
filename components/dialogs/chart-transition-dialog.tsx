"use client"

import { Database, BarChart3, RotateCcw } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"

// Chart type display names
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

interface ChartTransitionDialogProps {
    open: boolean
    targetChartType: string
    direction: 'toScatter' | 'toCategorical'
    hasBackup?: boolean
    onLoadSample: () => void
    onRestore?: () => void
    onQuickTransform?: () => void
    onCreateDataset?: () => void
    onCancel: () => void
}

export function ChartTransitionDialog({
    open,
    targetChartType,
    direction,
    hasBackup = false,
    onLoadSample,
    onRestore,
    onQuickTransform,
    onCreateDataset,
    onCancel
}: ChartTransitionDialogProps) {
    const targetLabel = CHART_TYPE_LABELS[targetChartType] || targetChartType

    // Scatter/Bubble setup - transitioning FROM categorical TO scatter/bubble
    if (direction === 'toScatter') {
        const isBubble = targetChartType === 'bubble'
        const chartTypeLabel = isBubble ? 'Bubble' : 'Scatter'

        return (
            <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="text-purple-500">
                                {isBubble ? (
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <circle cx="6" cy="16" r="3" fill="currentColor" opacity="0.6" />
                                        <circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.6" />
                                        <circle cx="17" cy="14" r="2.5" fill="currentColor" opacity="0.6" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <circle cx="6" cy="18" r="2" fill="currentColor" />
                                        <circle cx="10" cy="10" r="2" fill="currentColor" />
                                        <circle cx="15" cy="14" r="2" fill="currentColor" />
                                        <circle cx="18" cy="6" r="2" fill="currentColor" />
                                    </svg>
                                )}
                            </div>
                            Set Up {chartTypeLabel} Chart
                        </DialogTitle>
                        <DialogDescription>
                            {chartTypeLabel} charts use <span className="font-semibold text-blue-600">coordinate data</span> (X, Y{isBubble ? ', Size' : ''}).
                            {hasBackup && onRestore
                                ? ' You can restore your previous data or choose another option.'
                                : ' Choose how to initialize your data:'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-3 mt-4">
                        {/* Primary Action: Restore if backup available */}
                        {hasBackup && onRestore ? (
                            <>
                                <button
                                    onClick={onRestore}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                                >
                                    <RotateCcw className="h-5 w-5" />
                                    Restore Previous Dataset Used
                                </button>

                                <button
                                    onClick={onLoadSample}
                                    className="w-full px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Load Fresh Sample Data Instead
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onLoadSample}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                            >
                                <Database className="h-5 w-5" />
                                Load Sample {chartTypeLabel} Data
                            </button>
                        )}

                        {/* Secondary Actions - show only when no backup or as additional options */}
                        {(!hasBackup || !onRestore) && (
                            <div className="flex gap-2">
                                {onQuickTransform && (
                                    <button
                                        onClick={onQuickTransform}
                                        className="flex-1 px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Quick Transform
                                    </button>
                                )}
                                {onCreateDataset && (
                                    <button
                                        onClick={onCreateDataset}
                                        className="flex-1 px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Create Manually
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Cancel */}
                        <button
                            onClick={onCancel}
                            className="w-full px-3 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    // Categorical setup - transitioning FROM scatter/bubble TO categorical
    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-purple-500" />
                        Switch to {targetLabel} Chart
                    </DialogTitle>
                    <DialogDescription>
                        {targetLabel} charts use <span className="font-semibold text-blue-600">categorical data</span> (labels + values).
                        {hasBackup
                            ? ' You can restore your previous data or load fresh sample data.'
                            : ' Your current scatter/bubble data is incompatible.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 mt-4">
                    {/* Primary Action */}
                    {hasBackup && onRestore ? (
                        <>
                            <button
                                onClick={onRestore}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                            >
                                <RotateCcw className="h-5 w-5" />
                                Restore Previous Dataset Used
                            </button>

                            <button
                                onClick={onLoadSample}
                                className="w-full px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                Load Fresh Sample Data Instead
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onLoadSample}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                        >
                            <Database className="h-5 w-5" />
                            Load Sample {targetLabel} Data
                        </button>
                    )}

                    {/* Cancel */}
                    <button
                        onClick={onCancel}
                        className="w-full px-3 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
