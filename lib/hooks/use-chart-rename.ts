import { useState, useRef, useEffect, useCallback } from "react"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { useHistoryStore } from "@/lib/history-store"
import { dataService } from "@/lib/data-service"
import { toast } from "sonner"
import {
    useChartMode,
    useChartData,
    useActiveDatasetIndex,
    useActiveGroupId,
    useChartGroups,
} from "@/lib/hooks/use-chart-state"

/**
 * Manages chart rename state: inline edit, save to backend, keyboard handling.
 */
export function useChartRename() {
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState("");
    const [isSavingRename, setIsSavingRename] = useState(false);
    const renameInputRef = useRef<HTMLInputElement>(null);

    const chartMode = useChartMode();
    const chartData = useChartData();
    const activeDatasetIndex = useActiveDatasetIndex();
    const activeGroupId = useActiveGroupId();
    const groups = useChartGroups();

    const setChartTitle = useChartStore(s => s.setChartTitle);
    const { backendConversationId } = useChatStore();
    const { updateConversation } = useHistoryStore();

    const chartTitle = useChartStore(s => {
        if (s.chartMode === 'grouped' && s.activeGroupId && s.groups) {
            const activeGroup = s.groups.find(g => g.id === s.activeGroupId);
            if (activeGroup?.name || activeGroup?.sourceTitle) {
                return activeGroup.name || activeGroup.sourceTitle!;
            }
        }
        if (s.chartMode === 'single' && s.chartData.datasets.length > 0) {
            const activeDs = s.chartData.datasets[s.activeDatasetIndex];
            return activeDs?.sourceTitle || "Untitled Chart";
        }
        return s.chartTitle || "Untitled Chart";
    });

    // Determine if this chart has a backend ID and can be renamed
    let targetId: string | null = null;
    if (chartMode === 'single' && chartData.datasets?.[activeDatasetIndex]?.sourceId) {
        targetId = chartData.datasets[activeDatasetIndex].sourceId!;
    } else if (chartMode === 'grouped' && activeGroupId && groups) {
        const activeGroup = groups.find(g => g.id === activeGroupId);
        if (activeGroup?.sourceId) {
            targetId = activeGroup.sourceId;
        }
    }
    const canEditTitle = !!targetId;

    // Focus input when entering rename mode
    useEffect(() => {
        if (isRenaming && renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
        }
    }, [isRenaming]);

    const handleStartRename = useCallback(() => {
        if (!canEditTitle) return;
        setRenameValue(chartTitle || "");
        setIsRenaming(true);
        setTimeout(() => {
            if (renameInputRef.current) {
                renameInputRef.current.focus();
                renameInputRef.current.select();
            }
        }, 0);
    }, [canEditTitle, chartTitle]);

    const handleSaveRename = useCallback(async () => {
        if (!renameValue.trim() || renameValue === chartTitle) {
            setIsRenaming(false);
            return;
        }

        let saveTargetId = backendConversationId;
        const state = useChartStore.getState();

        if (state.chartMode === 'single' && state.chartData.datasets?.[state.activeDatasetIndex]?.sourceId) {
            saveTargetId = state.chartData.datasets[state.activeDatasetIndex].sourceId;
        } else if (state.chartMode === 'grouped' && state.activeGroupId && state.groups) {
            const activeGroup = state.groups.find(g => g.id === state.activeGroupId);
            if (activeGroup?.sourceId) {
                saveTargetId = activeGroup.sourceId;
            }
        }

        if (!saveTargetId) {
            setChartTitle(renameValue.trim());
            setIsRenaming(false);
            return;
        }

        setIsSavingRename(true);
        try {
            setChartTitle(renameValue.trim());
            updateConversation(saveTargetId, { title: renameValue.trim() });

            try {
                const result = await dataService.updateConversation(saveTargetId, { title: renameValue.trim() });
                if (result.error) throw new Error(result.error);
                toast.success("Title updated");
            } catch (error) {
                console.error("Rename error:", error);
                toast.error("Failed to update title backend");
            }
            setIsRenaming(false);
        } catch (error) {
            console.error("Rename error:", error);
            toast.error("Failed to update title");
        } finally {
            setIsSavingRename(false);
        }
    }, [renameValue, chartTitle, backendConversationId, setChartTitle, updateConversation]);

    const handleRenameKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveRename();
        } else if (e.key === 'Escape') {
            setIsRenaming(false);
        }
    }, [handleSaveRename]);

    return {
        chartTitle,
        isRenaming,
        renameValue,
        isSavingRename,
        renameInputRef,
        canEditTitle,
        handleStartRename,
        handleSaveRename,
        handleRenameKeyDown,
        setRenameValue,
        setIsRenaming,
    };
}
