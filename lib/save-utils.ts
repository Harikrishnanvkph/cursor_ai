/**
 * Shared Save Utility
 * 
 * Consolidates chart saving logic used across landing page, editor page, 
 * and config panel to ensure consistent behavior.
 */

import { dataService } from './data-service';
import { useChartStore, prepareChartDataForSave } from './chart-store';
import { useChatStore } from './chat-store';
import { useTemplateStore } from './template-store';
import { clearCurrentChart } from './storage-utils';
import { toast } from 'sonner';
import { DatasetService } from './services/dataset-service';
import { GroupService } from './services/group-service';
import { useFormatGalleryStore } from './stores/format-gallery-store';
import { useDecorationStore } from './stores/decoration-store';

export interface SaveChartOptions {
    /** Custom chart name (used for new saves or renaming) */
    chartName?: string;
    /** User object - required for saving */
    user: { id: string } | null;
    /** Callback when save starts (for loading states) */
    onSaveStart?: () => void;
    /** Callback when save completes */
    onSaveComplete?: (result: SaveChartResult) => void;
}

export interface SaveChartResult {
    success: boolean;
    conversationId?: string;
    snapshotId?: string;
    isUpdate: boolean;
    error?: string;
}

/**
 * Normalizes chart config before saving to backend.
 * Converts dynamicDimension to manualDimensions and cleans up conflicting flags.
 */
function normalizeChartConfig(chartConfig: any): any {
    const config = { ...chartConfig };

    // If dynamicDimension is active, convert it to manualDimensions
    if (config.dynamicDimension === true) {
        config.manualDimensions = true;
        config.responsive = false;
        delete config.dynamicDimension;

        // Ensure width and height are preserved
        if (!config.width) config.width = '800px';
        if (!config.height) config.height = '600px';
    } else {
        // Clean up - ensure only responsive OR manualDimensions is set
        delete config.dynamicDimension;

        if (config.responsive === true) {
            config.manualDimensions = false;
        } else if (config.manualDimensions === true) {
            config.responsive = false;
        }
    }

    return config;
}

/**
 * Extracts template data for saving (if template exists AND we're in template mode).
 * Only saves template when the editor is actively in template mode.
 */
function extractTemplateData(): {
    templateStructure: any | null;
    templateContent: Record<string, any> | null;
} {
    const { currentTemplate, templateInBackground, editorMode } = useTemplateStore.getState();

    // Only save template data when in template mode
    if (editorMode !== 'template') {
        return { templateStructure: null, templateContent: null };
    }

    // Get template from either currentTemplate or templateInBackground
    const templateToSave = currentTemplate || templateInBackground;

    // Save template if it exists AND has content (text areas)
    if (templateToSave && templateToSave.textAreas && templateToSave.textAreas.length > 0) {
        const templateContent: Record<string, any> = {};

        templateToSave.textAreas.forEach((area: any) => {
            if (templateContent[area.type]) {
                // Handle multiple areas of same type
                if (Array.isArray(templateContent[area.type])) {
                    templateContent[area.type].push(area.content);
                } else {
                    templateContent[area.type] = [templateContent[area.type], area.content];
                }
            } else {
                templateContent[area.type] = area.content;
            }
        });

        console.log('📄 Template data will be saved');
        return {
            templateStructure: templateToSave,
            templateContent
        };
    }

    return { templateStructure: null, templateContent: null };
}

/**
 * Main save function - consolidated logic for saving charts to backend.
 * Used by chart-layout.tsx, editor/page.tsx, and config-panel.tsx.
 */
export async function saveChartToCloud(options: SaveChartOptions): Promise<SaveChartResult> {
    const { chartName, user, onSaveStart, onSaveComplete } = options;

    // Validation
    if (!user) {
        const result: SaveChartResult = {
            success: false,
            isUpdate: false,
            error: 'Please sign in to save charts'
        };
        toast.error(result.error);
        onSaveComplete?.(result);
        return result;
    }

    const { hasJSON, chartType, chartData, chartConfig, chartMode, activeDatasetIndex, activeGroupId, groups } = useChartStore.getState();

    if (!hasJSON) {
        const result: SaveChartResult = {
            success: false,
            isUpdate: false,
            error: 'No chart to save'
        };
        toast.error(result.error);
        onSaveComplete?.(result);
        return result;
    }

    onSaveStart?.();

    try {
        const chatMessages = useChatStore.getState().messages;
        const existingBackendId = useChatStore.getState().backendConversationId;

        let conversationId: string;
        let isUpdate = false;

        // Check if this chart is already saved to backend
        if (existingBackendId) {
            conversationId = existingBackendId;
            isUpdate = true;

            // Update conversation title if name changed
            if (chartName) {
                await dataService.updateConversation(existingBackendId, { title: chartName });
            }
        } else {
            // Create new conversation
            const conversationTitle = chartName || `Chart saved on ${new Date().toLocaleDateString()}`;

            const response = await dataService.createConversation(
                conversationTitle,
                'Chart saved from editor'
            );

            if (response.error || !response.data) {
                const result: SaveChartResult = {
                    success: false,
                    isUpdate: false,
                    error: 'Failed to create conversation'
                };
                toast.error(result.error);
                onSaveComplete?.(result);
                return result;
            }

            conversationId = response.data.id;
            useChatStore.getState().setBackendConversationId(conversationId);
        }

        // Normalize config
        const normalizedConfig = normalizeChartConfig(chartConfig);

        // Inject overlay data into config so it's persisted in the snapshot
        const { overlayImages, overlayTexts, overlayShapes } = useChartStore.getState();
        if (overlayImages && overlayImages.length > 0) {
            normalizedConfig.overlayImages = overlayImages;
        }
        if (overlayTexts && overlayTexts.length > 0) {
            normalizedConfig.overlayTexts = overlayTexts;
        }
        if (overlayShapes && overlayShapes.length > 0) {
            normalizedConfig.overlayShapes = overlayShapes;
        }

        // Inject decorations into config so it's persisted in the snapshot
        const decorationShapes = useDecorationStore.getState().shapes;
        if (decorationShapes && decorationShapes.length > 0) {
            normalizedConfig.decorationShapes = decorationShapes;
        }

        // Extract template data
        let { templateStructure, templateContent } = extractTemplateData();
        
        // If we are in template mode, also inject decorations directly into template structure
        if (templateStructure && decorationShapes && decorationShapes.length > 0) {
            templateStructure.decorations = decorationShapes;
        }

        // Inject format data into config so it's persisted in the snapshot
        const { editorMode, generateMode } = useTemplateStore.getState();
        const { selectedFormatId, contentPackage, contextualImageUrl } = useFormatGalleryStore.getState();
        
        // Only inject format data when BOTH in template mode AND actively using format generate mode.
        // Previously this only checked selectedFormatId, which could be stale if the user
        // switched from format to template mode without the format store being cleared.
        const isActiveFormatMode = editorMode === 'template' && generateMode === 'format' && selectedFormatId;
        
        if (isActiveFormatMode) {
            normalizedConfig.formatData = {
                formatId: selectedFormatId,
                contentPackage,
                contextualImageUrl
            };
            
            // Note: The Supabase RPC function 'save_chart_snapshot' sets `is_template_mode = true` 
            // ONLY if templateStructure or templateContent is NOT NULL.
            // Since formats store their data in chartConfig instead of templateStructure,
            // we must pass a dummy structure to force the database template flag to true!
            if (!templateStructure) {
                templateStructure = {
                    isFormatReference: true,
                    formatId: selectedFormatId,
                    note: 'Dummy structure to trigger backend is_template_mode flag for formats'
                };
            }
        } else if (editorMode === 'template') {
            // Saving as a standard template — make sure to strip any leftover formatData
            // from a previous format session so the load logic doesn't misidentify it as a format.
            delete normalizedConfig.formatData;
        }

        // Get current snapshot ID for updates
        const { currentSnapshotId, setCurrentSnapshotId } = useChartStore.getState();

        // Fetch snapshot ID if updating but don't have it in memory
        let snapshotIdForUpdate: string | undefined = currentSnapshotId || undefined;
        if (!snapshotIdForUpdate && isUpdate) {
            try {
                const currentSnapshot = await dataService.getCurrentChartSnapshot(conversationId);
                if (currentSnapshot.data?.id) {
                    snapshotIdForUpdate = currentSnapshot.data.id;
                    setCurrentSnapshotId(snapshotIdForUpdate);
                }
            } catch {
                // If this fails, we'll fall back to creating a new snapshot
            }
        }

        // Prepare chart data with updated metadata
        const savedTitle = chartName || `Chart saved on ${new Date().toLocaleDateString()}`;
        const chartDataToSave = prepareChartDataForSave(
            chartData, chartMode, activeDatasetIndex, activeGroupId, savedTitle, conversationId, !isUpdate
        );

        // Save chart snapshot
        const snapshotResult = await dataService.saveChartSnapshot(
            conversationId,
            chartType,
            chartDataToSave,
            normalizedConfig,
            templateStructure,
            templateContent,
            snapshotIdForUpdate
        );

        if (snapshotResult.error) {
            const result: SaveChartResult = {
                success: false,
                isUpdate,
                error: 'Failed to save chart snapshot'
            };
            toast.error(result.error);
            onSaveComplete?.(result);
            return result;
        }

        const snapshotId = snapshotResult.data?.id;

        // Update current snapshot ID in store
        if (snapshotId) {
            setCurrentSnapshotId(snapshotId);
        }

        // Save messages for new conversations
        if (!isUpdate) {
            const messagesToSave = chatMessages.filter(m => {
                return !(m.role === 'assistant' && m.content.includes('Hi! Describe the chart'));
            });

            for (let i = 0; i < messagesToSave.length; i++) {
                const msg = messagesToSave[i];
                try {
                    const chartSnapshotId = (msg.role === 'assistant' && msg.chartSnapshot)
                        ? snapshotId
                        : undefined;

                    await dataService.addMessage(
                        conversationId,
                        msg.role,
                        msg.content,
                        chartSnapshotId,
                        msg.action || undefined,
                        msg.changes || undefined
                    );
                } catch (msgError) {
                    console.error(`Failed to save message ${i}:`, msgError);
                }
            }
        }

        // Success!
        toast.success(isUpdate ? 'Chart updated successfully!' : 'Chart saved successfully!');
        console.log(`✅ Chart ${isUpdate ? 'updated' : 'saved'} to backend:`, conversationId);

        // Clear localStorage
        clearCurrentChart();

        // Clear localStorage history to prevent duplicates
        if (typeof window !== 'undefined') {
            const userId = localStorage.getItem('user-id') || 'anonymous';
            const historyKey = `chat-history-${userId}`;
            try {
                const historyData = localStorage.getItem(historyKey);
                if (historyData) {
                    const parsed = JSON.parse(historyData);
                    if (parsed.state) {
                        parsed.state.conversations = [];
                        localStorage.setItem(historyKey, JSON.stringify(parsed));
                    }
                }
            } catch (error) {
                console.warn('Failed to clear history:', error);
            }
        }

        // Update backend conversation ID
        useChatStore.getState().setBackendConversationId(conversationId);

        // Update active dataset's or group's source metadata
        // Use Services directly since actions are not available in non-component context


        // Update active dataset's or group's source metadata
        // Use Services directly since actions are not available in non-component context
        const currentState = useChartStore.getState();

        if (chartMode === 'single') {
            if (currentState.chartData.datasets[activeDatasetIndex]) {
                // Manually replicate updateDataset action logic using Service + setState
                const updates = {
                    sourceId: isUpdate ? currentState.chartData.datasets[activeDatasetIndex].sourceId : conversationId,
                    sourceTitle: savedTitle
                };

                const newState = DatasetService.updateDataset(activeDatasetIndex, updates, {
                    chartType: currentState.chartType,
                    chartData: currentState.chartData,
                    chartConfig: currentState.chartConfig,
                    chartMode: currentState.chartMode,
                    hasJSON: currentState.hasJSON,
                    singleModeData: currentState.singleModeData,
                    groupedModeData: currentState.groupedModeData
                });

                if (newState) {
                    useChartStore.setState(newState);
                }
            }
        } else if (chartMode === 'grouped' && activeGroupId && groups) {
            const activeGroup = groups.find(g => g.id === activeGroupId);
            if (activeGroup) {
                // Manually replicate updateGroup action logic using Service + setState
                const currentState = useChartStore.getState();
                const updates = {
                    name: savedTitle,
                    sourceId: isUpdate ? activeGroup.sourceId : conversationId,
                    sourceTitle: savedTitle
                };

                const newState = GroupService.updateGroup(activeGroupId, updates, { groups: currentState.groups });
                useChartStore.setState(newState);
            }
        }

        // CRITICAL: Also update chatStore.currentChartState with the saved title
        // This ensures both stores stay in sync, preventing title reset on navigation
        const currentSnapshot = useChatStore.getState().currentChartState;
        if (currentSnapshot) {
            const updatedDatasets = currentSnapshot.chartData.datasets.map((ds: any, i: number) => {
                if (chartMode === 'single' && i === activeDatasetIndex) {
                    return {
                        ...ds,
                        sourceId: isUpdate ? ds.sourceId : conversationId,
                        sourceTitle: savedTitle
                    };
                } else if (chartMode === 'grouped' && ds.groupId === activeGroupId) {
                    return {
                        ...ds,
                        sourceId: isUpdate ? ds.sourceId : conversationId,
                        sourceTitle: savedTitle
                    };
                }
                return ds;
            });

            useChatStore.getState().updateChartState({
                ...currentSnapshot,
                chartData: {
                    ...currentSnapshot.chartData,
                    datasets: updatedDatasets
                }
            });
        }

        const result: SaveChartResult = {
            success: true,
            conversationId,
            snapshotId,
            isUpdate
        };

        onSaveComplete?.(result);
        return result;

    } catch (error) {
        console.error('Failed to save chart:', error);
        const result: SaveChartResult = {
            success: false,
            isUpdate: false,
            error: 'Failed to save chart. Please try again.'
        };
        toast.error(result.error);
        onSaveComplete?.(result);
        return result;
    }
}
