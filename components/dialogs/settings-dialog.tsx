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
import { useSettingsStore, type EditorInterface } from "@/lib/stores/settings-store"
import { Settings, Layout, PanelLeft, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const INTERFACE_OPTIONS: Array<{
  id: EditorInterface
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    id: 'default',
    label: 'Default',
    description: 'Classic three-column layout with left navigation, center canvas, and right settings panel.',
    icon: Layout,
  },
  {
    id: 'modern',
    label: 'Modern',
    description: 'Unified top bar and left-side navigation rail with an adjacent contextual settings panel.',
    icon: PanelLeft,
  },
]

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [mounted, setMounted] = React.useState(false)
  const {
    showModeChangeNotification,
    setShowModeChangeNotification,
    editorInterface,
    setEditorInterface,
  } = useSettingsStore()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        forceBodyPortal 
        className="sm:max-w-[450px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl"
      >
        <DialogHeader className="flex flex-row items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg text-indigo-600 dark:text-indigo-400">
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
          {/* Interface Selection */}
          <div className="space-y-2.5">
            <div className="space-y-0.5 text-left">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Interface
              </Label>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
                Switch between the classic Default layout and the unified Modern workspace without losing progress.
              </p>
            </div>
            {mounted ? (
              <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Editor Interface">
                {INTERFACE_OPTIONS.map((opt) => {
                  const Icon = opt.icon
                  const isSelected = editorInterface === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setEditorInterface(opt.id)}
                      className={cn(
                        "flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5">
                          <Icon className={cn("w-4 h-4", isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400")} />
                          <span className={cn("text-xs font-bold", isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-200")}>
                            {opt.label}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {opt.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="h-[74px] bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                <div className="h-[74px] bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              </div>
            )}
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Mode Change Notification */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Show Mode Change Notification
              </Label>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal text-left">
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
