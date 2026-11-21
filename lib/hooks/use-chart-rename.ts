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
 * Resolves the cloud conversation ID for the currently active chart entity.
 * Prefers the active dataset/group's own sourceId so Read, Write, and Save always
 * target the exact same conversation (and never leak a stale backendConversationId).
 */
export function resolveActiveCloudConversationId(
    chartState: ReturnType<typeof useChartStore.getState> = useChartStore.getState(),
    backendConversationId: string | null = useChatStore.getState().backendConversationId
): string | null {
    if (chartState.chartMode === 'single' && chartState.chartData.datasets.length > 0) {
        const activeDs = chartState.chartData.datasets[chartState.activeDatasetIndex];
        return activeDs?.sourceId || null;
    }
    if (chartState.chartMode === 'grouped' && chartState.activeGroupId && chartState.groups) {
        const activeGroup = chartState.groups.find(g => g.id === chartState.activeGroupId);
        if (activeGroup) {
            return activeGroup.sourceId || null;
        }
    }
    return backendConversationId || null;
}

/**
 * Resolves the local (non-cloud) display title strictly from the active dataset or group.
 * Never falls back to global chartTitle when an active entity exists (prevents cross-chart leakage).
 */
function resolveLocalEntityTitle(s: ReturnType<typeof useChartStore.getState>): string {
    if (s.chartMode === 'grouped' && s.activeGroupId && s.groups) {
        const activeGroup = s.groups.find(g => g.id === s.activeGroupId);
        if (activeGroup) {
            return activeGroup.name || activeGroup.sourceTitle || "Untitled Chart";
        }
    }
    if (s.chartMode === 'single' && s.chartData.datasets.length > 0) {
        const activeDs = s.chartData.datasets[s.activeDatasetIndex];
        if (activeDs) {
            if (activeDs.sourceTitle) return activeDs.sourceTitle;
            if (activeDs.label && activeDs.label !== 'Sample Dataset') return activeDs.label;
            return "Untitled Chart";
        }
    }
    return s.chartTitle || "Untitled Chart";
}

/**
 * Retrieves the effective chart title across conversations, groups, and dataset metadata.
 */
export function getEffectiveChartTitle(): string {
    const s = useChartStore.getState();
    const backendConversationId = useChatStore.getState().backendConversationId;
    const activeCloudId = resolveActiveCloudConversationId(s, backendConversationId);

    if (activeCloudId) {
        const conv = useHistoryStore.getState().conversations.find(c => c.id === activeCloudId);
        if (conv?.title) {
            return conv.title;
        }
    }

    return resolveLocalEntityTitle(s);
}

/**
 * Persists a new chart title to in-memory store, local history, and cloud backend if saved.
 */
export async function saveChartTitle(newTitle: string, options?: { silent?: boolean }): Promise<boolean> {
    const trimmed = newTitle.trim();
    if (!trimmed) return false;

    const state = useChartStore.getState();
    const backendConversationId = useChatStore.getState().backendConversationId;
    const saveTargetId = resolveActiveCloudConversationId(state, backendConversationId);

    // Snapshot previous titles for rollback if backend update fails
    const prevStoreTitle = getEffectiveChartTitle();
    const prevConvTitle = saveTargetId
        ? useHistoryStore.getState().conversations.find(c => c.id === saveTargetId)?.title
        : undefined;

    // 1. Update live Zustand store
    useChartStore.getState().setChartTitle(trimmed);

    // 2. If it's a cloud-saved chart, update history store and backend
    if (saveTargetId) {
        useHistoryStore.getState().updateConversation(saveTargetId, { title: trimmed });
        try {
            const result = await dataService.updateConversation(saveTargetId, { title: trimmed });
            if (result.error) throw new Error(result.error);
            if (!options?.silent) {
                toast.success("Title updated");
            }
            return true;
        } catch (error) {
            console.error("Rename error:", error);
            // Roll back optimistic local updates so UI stays consistent with backend
            useChartStore.getState().setChartTitle(prevStoreTitle);
            if (prevConvTitle !== undefined) {
                useHistoryStore.getState().updateConversation(saveTargetId, { title: prevConvTitle });
            }
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

    const backendConversationId = useChatStore(s => s.backendConversationId);

    // Resolve active cloud ID using the exact same priority as saveChartTitle
    const activeCloudId = useMemo(() => {
        if (chartMode === 'single' && chartData.datasets.length > 0) {
            return chartData.datasets[activeDatasetIndex]?.sourceId || null;
        }
        if (chartMode === 'grouped' && activeGroupId && groups) {
            const activeGroup = groups.find(g => g.id === activeGroupId);
            if (activeGroup) return activeGroup.sourceId || null;
        }
        return backendConversationId || null;
    }, [chartMode, chartData.datasets, activeDatasetIndex, activeGroupId, groups, backendConversationId]);

    // Subscribe to active conversation title in history store as primary source of truth
    const activeConversationTitle = useHistoryStore(s => {
        if (!activeCloudId) return null;
        const conv = s.conversations.find(c => c.id === activeCloudId);
        return conv?.title || null;
    });

    const storeChartTitle = useChartStore(s => resolveLocalEntityTitle(s));

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
