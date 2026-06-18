"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useSettingsStore } from "@/lib/stores/settings-store"
import { Settings } from "lucide-react"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [mounted, setMounted] = React.useState(false)
  const { showModeChangeNotification, setShowModeChangeNotification } = useSettingsStore()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        forceBodyPortal 
        className="sm:max-w-[425px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl"
      >
        <DialogHeader className="flex flex-row items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg text-indigo-650 dark:text-indigo-400">
            <Settings className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <DialogTitle className="text-base font-bold text-slate-800 dark:text-slate-100">
              Preferences
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 dark:text-slate-500">
              Customize editor features and confirmation popup settings.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-350">
                Show Mode Change Notification
              </Label>
              <p className="text-[11px] text-slate-450 dark:text-slate-500 leading-normal text-left">
                Prompt to confirm when switching from Chart mode to Template mode to explain decoration cascading.
              </p>
            </div>
            {mounted ? (
              <Switch
                checked={showModeChangeNotification}
                onCheckedChange={setShowModeChangeNotification}
                className="mt-0.5 data-[state=checked]:bg-indigo-600"
              />
            ) : (
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse flex-shrink-0" />
            )}
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
