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
            const { useFormatGalleryStore } = require('@/lib/stores/format-gallery-store');
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
                    <AlertDialogTitle>Reset Application</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete everything and start fresh? This will remove all datasets, template settings, and chat history. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirmClear}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        Reset Everything
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
