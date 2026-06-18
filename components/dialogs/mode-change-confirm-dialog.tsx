"use client"

import React, { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useSettingsStore } from "@/lib/stores/settings-store"
import { Info } from "lucide-react"

interface ModeChangeConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel: () => void
}

export function ModeChangeConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: ModeChangeConfirmDialogProps) {
  const [mounted, setMounted] = React.useState(false)
  const { showModeChangeNotification, setShowModeChangeNotification } = useSettingsStore()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[450px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
              <Info className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-slate-800 dark:text-slate-100 text-left">
              Switching to Template Mode
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild className="text-xs text-slate-500 dark:text-slate-400 leading-normal text-left">
            <div className="space-y-2">
              <p>
                Changing the mode will not cascade your active chart decoration information into template mode.
              </p>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 bg-slate-50 dark:bg-slate-950/40 p-2 rounded border border-slate-100 dark:border-slate-800/80">
                Note: You can re-enable or disable this confirmation dialog at any time in the <strong>Settings</strong> option in your profile dropdown menu.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center gap-2 py-2">
          {mounted ? (
            <Checkbox
              id="suppress-mode-change-notify"
              checked={!showModeChangeNotification}
              onCheckedChange={(checked) => setShowModeChangeNotification(!checked)}
              className="border-slate-350 dark:border-slate-700 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
            />
          ) : (
            <div className="w-4 h-4 bg-slate-100 rounded border border-slate-200 animate-pulse" />
          )}
          <Label
            htmlFor="suppress-mode-change-notify"
            className="text-[11px] font-medium text-slate-650 dark:text-slate-400 cursor-pointer select-none"
          >
            Don't show this notification again
          </Label>
        </div>

        <AlertDialogFooter className="flex gap-2 sm:gap-0">
          <AlertDialogCancel
            onClick={handleCancel}
            className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold py-2 px-4 shadow-sm"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold py-2 px-4 shadow-sm"
          >
            Proceed
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
