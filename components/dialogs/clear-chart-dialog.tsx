"use client"

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
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
import { clearCurrentChart } from "@/lib/storage-utils"
import { toast } from "sonner"
import { useState } from "react"
import { Eraser, RotateCcw } from "lucide-react"

interface ClearChartDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function ClearChartDialog({ open, onOpenChange, onSuccess }: ClearChartDialogProps) {
    const [clearOption, setClearOption] = useState<'welcome' | 'reset'>('welcome')
    const { setHasJSON, resetChart } = useChartStore()
    const { clearMessages, startNewConversation, setBackendConversationId } = useChatStore()

    const handleConfirmClear = () => {
        // Actions common to both options:
        // 1. Clear chat messages
        // 2. Start a new conversation (generate new IDs)
        //    IMPORTANT: We pass 'true' to startNewConversation to preventing it from 
        //    automatically resetting the chart store. We handle chart reset manually below.
        clearMessages()
        startNewConversation(true)

        // 3. Clear backend ID as we are starting fresh (or just viewing welcome screen)
        setBackendConversationId(null)

        // 4. Clear template state
        useTemplateStore.getState().clearAllTemplateState()

        if (clearOption === 'welcome') {
            // "Go to Welcome Preview" - Soft Reset
            // - Hide the chart preview (hasJSON = false)
            // - PRESERVE all chart data, groups, and settings
            setHasJSON(false)
            toast.success("Welcome screen shown")
        } else {
            // "Reset Application" - Hard Reset
            // - Clear local storage persistence
            clearCurrentChart()
            // - Reset chart store state completely
            resetChart()
            // - Hide JSON to show welcome screen
            setHasJSON(false)
            toast.success("Application reset successfully")
        }

        onOpenChange(false)
        if (onSuccess) onSuccess()
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-[500px]">
                <AlertDialogHeader>
                    <AlertDialogTitle>Clear Chart</AlertDialogTitle>
                    <AlertDialogDescription>
                        Choose how you want to clear the current session.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-4">
                    <RadioGroup value={clearOption} onValueChange={(v) => setClearOption(v as 'welcome' | 'reset')} className="gap-4">
                        <div className={`flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent cursor-pointer ${clearOption === 'welcome' ? 'border-primary bg-accent/50' : 'border-muted'}`} onClick={() => setClearOption('welcome')}>
                            <RadioGroupItem value="welcome" id="welcome" className="mt-1" />
                            <div className="grid gap-1.5">
                                <Label htmlFor="welcome" className="font-medium cursor-pointer flex items-center gap-2">
                                    <RotateCcw className="h-4 w-4" />
                                    Go to Welcome Preview
                                </Label>
                                <div className="text-sm text-muted-foreground">
                                    Returns to the welcome screen but <strong>keeps your data</strong>. You can resume editing by selecting a dataset or using the AI chat.
                                </div>
                            </div>
                        </div>

                        <div className={`flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-red-50 cursor-pointer ${clearOption === 'reset' ? 'border-red-500 bg-red-50' : 'border-muted'}`} onClick={() => setClearOption('reset')}>
                            <RadioGroupItem value="reset" id="reset" className="mt-1 text-red-500 border-red-500" />
                            <div className="grid gap-1.5">
                                <Label htmlFor="reset" className="font-medium cursor-pointer text-red-600 flex items-center gap-2">
                                    <Eraser className="h-4 w-4" />
                                    Reset Application
                                </Label>
                                <div className="text-sm text-red-600/80">
                                    <strong>Delete everything</strong> and start fresh. This will remove all datasets, template settings, and chat history.
                                </div>
                            </div>
                        </div>
                    </RadioGroup>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirmClear}
                        className={clearOption === 'reset' ? "bg-red-600 hover:bg-red-700" : ""}
                    >
                        {clearOption === 'welcome' ? "Go to Welcome" : "Reset Everything"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
