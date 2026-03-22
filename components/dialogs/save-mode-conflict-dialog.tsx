"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Save, Copy, X } from 'lucide-react'

interface SaveModeConflictDialogProps {
    isOpen: boolean
    onClose: () => void
    /** Save as chart, discarding template from backend */
    onSaveChartDiscardTemplate: () => void
    /** Save as a new separate chart (doesn't touch the original template chart) */
    onSaveAsSeparateChart: () => void
    isSaving?: boolean
}

export function SaveModeConflictDialog({
    isOpen,
    onClose,
    onSaveChartDiscardTemplate,
    onSaveAsSeparateChart,
    isSaving = false
}: SaveModeConflictDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                        Save Mode Conflict
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        This chart was originally saved as a <strong>template chart</strong>, but you're currently in <strong>chart mode</strong>. How would you like to save?
                    </DialogDescription>
                </DialogHeader>

                <div className="py-3 space-y-3">
                    {/* Option 1: Save Chart and Discard Template */}
                    <button
                        onClick={onSaveChartDiscardTemplate}
                        disabled={isSaving}
                        className="w-full text-left p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Save className="h-4 w-4 text-red-600" />
                            <span className="font-semibold text-sm text-red-700">Save Chart & Discard Template</span>
                        </div>
                        <p className="text-xs text-red-600/80 ml-6">
                            Removes the template and saves only as a chart. This will overwrite the existing template chart.
                        </p>
                    </button>

                    {/* Option 2: Save as Separate Chart */}
                    <button
                        onClick={onSaveAsSeparateChart}
                        disabled={isSaving}
                        className="w-full text-left p-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Copy className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-sm text-blue-700">Save as Separate Chart</span>
                        </div>
                        <p className="text-xs text-blue-600/80 ml-6">
                            Creates a new chart entry. The original template chart remains untouched.
                        </p>
                    </button>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSaving}
                        className="w-full"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
