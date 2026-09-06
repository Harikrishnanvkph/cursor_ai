import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
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
 * Retrieves the effective chart title across conversations, groups, and dataset metadata.
 */
export function getEffectiveChartTitle(): string {
    const backendConversationId = useChatStore.getState().backendConversationId;
    if (backendConversationId) {
        const conv = useHistoryStore.getState().conversations.find(c => c.id === backendConversationId);
        if (conv?.title) {
            return conv.title;
        }
    }

    const s = useChartStore.getState();
    if (s.chartMode === 'grouped' && s.activeGroupId && s.groups) {
        const activeGroup = s.groups.find(g => g.id === s.activeGroupId);
        const title = activeGroup?.name || activeGroup?.sourceTitle;
        if (title) {
            return title;
        }
    }
    if (s.chartMode === 'single' && s.chartData.datasets.length > 0) {
        const activeDs = s.chartData.datasets[s.activeDatasetIndex];
        const title = activeDs?.sourceTitle;
        if (title) {
            return title;
        }
    }
    return s.chartTitle || "Untitled Chart";
}

/**
 * Persists a new chart title to in-memory store, local history, and cloud backend if saved.
 */
export async function saveChartTitle(newTitle: string): Promise<boolean> {
    const trimmed = newTitle.trim();
    if (!trimmed) return false;

    let saveTargetId = useChatStore.getState().backendConversationId;
    const state = useChartStore.getState();

    if (state.chartMode === 'single' && state.chartData.datasets?.[state.activeDatasetIndex]?.sourceId) {
        saveTargetId = state.chartData.datasets[state.activeDatasetIndex].sourceId || null;
    } else if (state.chartMode === 'grouped' && state.activeGroupId && state.groups) {
        const activeGroup = state.groups.find(g => g.id === state.activeGroupId);
        if (activeGroup?.sourceId) {
            saveTargetId = activeGroup.sourceId || null;
        }
    }

    // 1. Update live Zustand store
    useChartStore.getState().setChartTitle(trimmed);

    // 2. If it's a cloud-saved chart, update history store and backend
    if (saveTargetId) {
        useHistoryStore.getState().updateConversation(saveTargetId, { title: trimmed });
        try {
            const result = await dataService.updateConversation(saveTargetId, { title: trimmed });
            if (result.error) throw new Error(result.error);
            toast.success("Title updated");
            return true;
        } catch (error) {
            console.error("Rename error:", error);
            toast.error("Failed to update title backend");
            return false;
        }
    }
    return true;
}

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

    const { backendConversationId } = useChatStore();

    // Subscribe to active conversation title in history store as primary source of truth
    const activeConversationTitle = useHistoryStore(s => {
        if (!backendConversationId) return null;
        const conv = s.conversations.find(c => c.id === backendConversationId);
        return conv?.title || null;
    });

    const storeChartTitle = useChartStore(s => {
        if (s.chartMode === 'grouped' && s.activeGroupId && s.groups) {
            const activeGroup = s.groups.find(g => g.id === s.activeGroupId);
            const title = activeGroup?.name || activeGroup?.sourceTitle;
            if (title) {
                return title;
            }
        }
        if (s.chartMode === 'single' && s.chartData.datasets.length > 0) {
            const activeDs = s.chartData.datasets[s.activeDatasetIndex];
            const title = activeDs?.sourceTitle;
            if (title) {
                return title;
            }
        }
        return s.chartTitle || "Untitled Chart";
    });

    const chartTitle = chartData.datasets.length === 0 ? "No Chart Available" : (activeConversationTitle || storeChartTitle);

    // Allow renaming for any chart with datasets loaded, whether local or cloud
    const canEditTitle = chartData.datasets.length > 0;

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

        setIsSavingRename(true);
        try {
            await saveChartTitle(renameValue);
            setIsRenaming(false);
        } catch (error) {
            console.error("Rename error:", error);
            toast.error("Failed to update title");
        } finally {
            setIsSavingRename(false);
        }
    }, [renameValue, chartTitle]);

    const handleRenameKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveRename();
        } else if (e.key === 'Escape') {
            setIsRenaming(false);
        }
    }, [handleSaveRename]);

    return useMemo(() => ({
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
    }), [
        chartTitle,
        isRenaming,
        renameValue,
        isSavingRename,
        canEditTitle,
        handleStartRename,
        handleSaveRename,
        handleRenameKeyDown,
    ]);
}
