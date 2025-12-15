"use client"

import React, { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Loader2 } from "lucide-react"

export interface SaveChartDialogProps {
    open: boolean
    defaultName?: string
    isUpdate?: boolean
    isSaving?: boolean
    onSave: (name: string) => void
    onCancel: () => void
}

export function SaveChartDialog({
    open,
    defaultName = "",
    isUpdate = false,
    isSaving = false,
    onSave,
    onCancel,
}: SaveChartDialogProps) {
    const [name, setName] = useState(defaultName)
    const inputRef = useRef<HTMLInputElement>(null)

    // Update name when defaultName changes
    useEffect(() => {
        setName(defaultName)
    }, [defaultName])

    // Focus and select input when dialog opens
    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus()
                inputRef.current?.select()
            }, 100)
        }
    }, [open])

    // Handle escape key
    useEffect(() => {
        if (!open) return
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape" && !isSaving) {
                e.preventDefault()
                onCancel()
            }
        }
        document.addEventListener("keydown", onKey)
        return () => document.removeEventListener("keydown", onKey)
    }, [open, isSaving, onCancel])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!isSaving) {
            onSave(name.trim() || defaultName)
        }
    }

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[130] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
        >
            <div
                className="fixed inset-0 bg-black/40"
                onClick={() => !isSaving && onCancel()}
            />
            <div className="relative z-[131] w-[92vw] max-w-md rounded-lg bg-white border border-gray-200 shadow-xl p-5">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Save className="h-5 w-5 text-green-600" />
                        {isUpdate ? "Update Chart" : "Save Chart"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                        {isUpdate
                            ? "Update your chart with a new name or keep the existing one."
                            : "Give your chart a name to easily find it later."
                        }
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <Label htmlFor="chart-name" className="text-sm font-medium text-gray-700">
                            Chart Name
                        </Label>
                        <Input
                            ref={inputRef}
                            id="chart-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Awesome Chart"
                            className="mt-1.5"
                            disabled={isSaving}
                            maxLength={100}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            {name.length}/100 characters
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSaving}
                            className="inline-flex items-center justify-center h-9 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex items-center justify-center h-9 rounded-md bg-green-600 px-5 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 shadow-sm transition-colors disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {isUpdate ? "Update" : "Save"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default SaveChartDialog
