"use client"

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Layout, Copy } from 'lucide-react'

interface DimensionMismatchDialogProps {
    isOpen: boolean
    onClose: () => void
    templateDimensions: { width: number; height: number }
    currentDimensions: { width: number; height: number }
    onGoToTemplateMode: () => void
    onSaveAsChartOnly: () => void
    isSaving?: boolean
}

export function DimensionMismatchDialog({
    isOpen,
    onClose,
    templateDimensions,
    currentDimensions,
    onGoToTemplateMode,
    onSaveAsChartOnly,
    isSaving = false
}: DimensionMismatchDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                        Dimension Mismatch
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Your chart dimensions don't match the template's chart area.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Dimension comparison */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-xs text-blue-600 font-medium mb-1">Template Chart Area</div>
                            <div className="text-lg font-bold text-blue-900">
                                {templateDimensions.width} × {templateDimensions.height}
                            </div>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <div className="text-xs text-amber-600 font-medium mb-1">Current Chart</div>
                            <div className="text-lg font-bold text-amber-900">
                                {currentDimensions.width <= 0 && currentDimensions.height <= 0 ? (
                                    <span className="text-sm">Responsive (Variable)</span>
                                ) : (
                                    <>{currentDimensions.width} × {currentDimensions.height}</>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-sm text-gray-600">
                        <p className="mb-2">Choose how to proceed:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs text-gray-500">
                            <li><strong>Go to Template Mode</strong> - Edit in template view with correct dimensions</li>
                            <li><strong>Save as Chart Only</strong> - Create a standalone copy without template</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter className="flex gap-2 sm:justify-between">
                    <Button
                        variant="outline"
                        onClick={onGoToTemplateMode}
                        disabled={isSaving}
                        className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                        <Layout className="h-4 w-4 mr-2" />
                        Go to Template Mode
                    </Button>
                    <Button
                        variant="default"
                        onClick={onSaveAsChartOnly}
                        disabled={isSaving}
                        className="flex-1 bg-amber-600 hover:bg-amber-700"
                    >
                        <Copy className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save as Chart Only'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
