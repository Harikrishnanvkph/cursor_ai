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
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
import { useDecorationStore } from "@/lib/stores/decoration-store"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { clearCurrentChart } from "@/lib/storage-utils"
import { toast } from "sonner"

interface ClearChartDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function ClearChartDialog({
    open,
    onOpenChange,
    onSuccess,
}: ClearChartDialogProps) {
    const { setHasJSON, resetChart } = useChartStore()
    const { clearMessages, startNewConversation, setBackendConversationId } = useChatStore()

    const handleConfirmClear = () => {
        if (onSuccess) onSuccess()

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

        // 5. Clear all decoration shapes
        useDecorationStore.getState().clearShapes()

        // 6. Clear format gallery state
        try {
            const formatStore = useFormatGalleryStore.getState();
            formatStore.setContentPackage(null);
            formatStore.setSelectedFormat(null, 'bar');
            formatStore.setContextualImageUrl(null);
        } catch(e) {
            console.warn("Could not clear format store", e)
        }

        // "Reset Application" - Hard Reset
        // - Clear local storage persistence
        clearCurrentChart()
        // - Reset chart store state completely
        resetChart()
        // - Hide JSON to show welcome screen
        setHasJSON(false)
        toast.success("Application reset successfully")

        onOpenChange(false)
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-[500px]">
                <AlertDialogHeader>
                    <AlertDialogTitle>Clear Local Workspace</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to clear your current editor workspace and start fresh? This will reset the active chart configuration, data values, and chat history on your screen. <br /><br />
                        <strong>Note: This only clears the local editor state—your saved charts and templates in the cloud history are completely safe.</strong>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirmClear}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        Clear Workspace
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
