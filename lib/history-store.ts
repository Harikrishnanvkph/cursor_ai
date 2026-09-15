"use client"

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useChatStore, ChatMessage, ChartSnapshot } from "@/lib/chat-store";
import { useChartStore, type SupportedChartType, type ExtendedChartData } from "@/lib/chart-store";
import { useTemplateStore } from "@/lib/template-store";
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store";
import { dataService } from "@/lib/data-service";
import { createExpiringStorage } from "@/lib/storage-utils";
import { useDecorationStore } from "@/lib/stores/decoration-store";
import type { ChartOptions } from "chart.js";

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  snapshot: ChartSnapshot | null;
  timestamp: number;
  // Mode metadata from backend
  is_template_mode?: boolean;
  chart_mode?: 'single' | 'grouped';
  width?: string;
  height?: string;
};

interface HistoryStore {
  conversations: Conversation[];
  loading: boolean;
  addConversation: (conv: Omit<Conversation, "id" | "timestamp">) => string;
  deleteConversation: (id: string) => Promise<void>;
  restoreConversation: (id: string) => Promise<void>;
  clearAllConversations: () => Promise<void>;
  updateConversation: (id: string, updates: Partial<Omit<Conversation, 'id' | 'timestamp'>>) => void;
  loadConversationsFromBackend: () => Promise<void>;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      loading: false,
      addConversation: (conv) => {
        const id = Date.now().toString();
        const timestamp = Date.now();
        // Ensure newest first and limit to 50 entries
        set({
          conversations: [
            { id, timestamp, ...conv },
            ...get().conversations
          ].slice(0, 50)
        });
        return id; // Return the created ID
      },
      deleteConversation: async (id) => {
        try {
          // First, try to delete from backend
          const response = await dataService.deleteConversation(id);
          if (response.error) {
            console.error('Failed to delete conversation from backend:', response.error);
            // Still remove from local state even if backend fails
          } else {
            console.log('✅ Conversation deleted from backend:', id);
          }
        } catch (error) {
          console.error('Error deleting conversation from backend:', error);
          // Still remove from local state even if backend fails
        }

        // Remove from local state
        set({
          conversations: get().conversations.filter((c) => c.id !== id)
        });
      },
      restoreConversation: async (id) => {
        // Try to find conversation in local store first
        let conv = get().conversations.find((c) => c.id === id);

        // Check if we need to fetch from backend:
        // - Not found locally, OR
        // - Found but missing chart data (lazy-loaded lightweight stub from loadConversationsFromBackend)
        const needsFetch = !conv || !conv.snapshot || !conv.snapshot.chartData;

        if (needsFetch) {
          console.log(`Conversation ${conv ? 'incomplete' : 'not found'} locally, fetching from backend...`);
          try {
            // Single API call — getConversation returns chat_messages(*) and chart_snapshots(*)
            // via Supabase relational join, eliminating 3 redundant sequential requests
            const response = await dataService.getConversation(id);
            if (response.data) {
              const convData = response.data;

              // Extract messages from the relational join, sorted by created_at ascending
              const rawMessages = (convData.chat_messages || [])
                .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

              // Extract the current snapshot from the embedded chart_snapshots array
              const currentSnapshot = (convData.chart_snapshots || [])
                .find((s: any) => s.is_current === true) || null;

              // Transform messages to frontend format with proper ChatMessage structure
              const transformedMessages = rawMessages.map((msg: any) => ({
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.created_at).getTime(),
                action: msg.action,
                changes: msg.changes,
                // Link chart snapshot if this message has one (cross-reference by chart_snapshot_id)
                chartSnapshot: msg.chart_snapshot_id && convData.chart_snapshots
                  ? (() => {
                      const snap = convData.chart_snapshots.find((s: any) => s.id === msg.chart_snapshot_id);
                      return snap ? {
                        chartType: snap.chart_type,
                        chartData: snap.chart_data,
                        chartConfig: snap.chart_config
                      } : undefined;
                    })()
                  : undefined
              }));

              // Infer chart mode from snapshot if not provided by backend response
              let inferredChartMode: 'single' | 'grouped' = 'single';
              if (currentSnapshot && currentSnapshot.chart_data) {
                const datasets = currentSnapshot.chart_data.datasets || [];
                if (datasets.some((ds: any) => ds.mode === 'grouped')) {
                  inferredChartMode = 'grouped';
                } else if (datasets.some((ds: any) => ds.mode === 'single')) {
                  inferredChartMode = 'single';
                } else if (datasets.length > 1) {
                  inferredChartMode = 'grouped';
                }
              }

              // Transform to frontend format
              conv = {
                id: convData.id,
                title: convData.title,
                messages: transformedMessages,
                snapshot: currentSnapshot ? {
                  id: currentSnapshot.id,
                  chartType: currentSnapshot.chart_type,
                  chartData: currentSnapshot.chart_data,
                  chartConfig: currentSnapshot.chart_config,
                  template_structure: currentSnapshot.template_structure,
                  template_content: currentSnapshot.template_content,
                  is_template_mode: currentSnapshot.is_template_mode
                } : null,
                timestamp: new Date(convData.created_at).getTime(),
                is_template_mode: currentSnapshot?.is_template_mode ?? false,
                chart_mode: conv?.chart_mode ?? inferredChartMode
              };

              // Add to local store for future access
              set((state) => {
                const existingIndex = state.conversations.findIndex(c => c.id === conv?.id);
                if (existingIndex >= 0 && conv) {
                  const newConversations = [...state.conversations];
                  newConversations[existingIndex] = conv;
                  return { conversations: newConversations };
                }
                return {
                  conversations: [conv!, ...state.conversations].slice(0, 50)
                };
              });
            }
          } catch (error) {
            console.error('Failed to fetch conversation from backend:', error);
            return;
          }
        }

        if (!conv) {
          console.error('Conversation not found:', id);
          return;
        }

        // Restore chat messages
        const chatStore = useChatStore.getState();
        chatStore.setMessages(conv.messages);

        // Set backend conversation ID so Save button knows to update instead of create
        chatStore.setBackendConversationId(conv.id);

        if (conv.snapshot) {
          const chartStore = useChartStore.getState();
          const templateStore = useTemplateStore.getState();
          const snapshotId = conv.snapshot.id;

          // Helper for template & format restoration
          const restoreTemplateOrFormat = () => {
            const chartConfig = conv.snapshot?.chartConfig as any;
            if (chartConfig?.formatData) {
              const { formatId, contentPackage, contextualImageUrl, formatSnapshot } = chartConfig.formatData;
              const store = useFormatGalleryStore.getState();
              
              // Use saved formatSnapshot if present; otherwise fall back to lookup from loaded formats
              const restoredSnapshot = formatSnapshot || [...store.formats, ...store.userFormats].find(f => f.id === formatId) || null;

              useFormatGalleryStore.setState({
                selectedFormatId: formatId,
                selectedChartType: conv.snapshot!.chartType,
                selectedFormatSnapshot: restoredSnapshot,
                contentPackage: contentPackage || store.contentPackage,
                contextualImageUrl: contextualImageUrl || store.contextualImageUrl,
                isGalleryOpen: false,
              });
              
              templateStore.clearAllTemplateState(); // Clear standard templates
              templateStore.setEditorMode('template'); // Set to template mode for format rendering
              templateStore.setGenerateMode('format'); // Set to format mode so Browse Formats button remains
              templateStore.setTemplateSavedToCloud(true);
              return;
            }

            if (conv.snapshot?.template_structure || conv.snapshot?.is_template_mode) {
              if (conv.snapshot.template_structure) {
                const cloudTemplate = {
                  ...conv.snapshot.template_structure,
                  id: 'current-cloud-template',
                  name: 'Current Cloud Template',
                  description: 'Original template structure from backend snapshot',
                  isCustom: false,
                  isCloudTemplate: true
                };

                if (conv.snapshot.template_content) {
                  const template = conv.snapshot.template_structure;
                  const content = conv.snapshot.template_content;

                  const updatedTextAreas = template.textAreas.map((area: any) => {
                    const areaContent = content[area.type];
                    if (areaContent !== undefined) {
                      if (Array.isArray(areaContent)) {
                        const sameTypeAreas = template.textAreas.filter((ta: any) => ta.type === area.type);
                        const index = sameTypeAreas.indexOf(area);
                        return {
                          ...area,
                          content: areaContent[index] || areaContent[0] || area.content
                        };
                      } else {
                        return { ...area, content: areaContent };
                      }
                    }
                    return area;
                  });

                  cloudTemplate.textAreas = updatedTextAreas;
                }

                templateStore.setOriginalCloudTemplateContent(cloudTemplate);
                templateStore.setCurrentTemplate(cloudTemplate);
                templateStore.setEditorMode('template');
                templateStore.setGenerateMode('template');
                templateStore.setTemplateSavedToCloud(true);
                templateStore.clearUnusedContents();
                
                const formatStore = useFormatGalleryStore.getState();
                formatStore.setSelectedFormat(null, conv.snapshot.chartType || 'bar');
                formatStore.setContentPackage(null);
                formatStore.setContextualImageUrl(null);
              }
            } else {
              // Chart-only: park existing template safely in background without clearing user edits
              templateStore.parkTemplateInBackground();
              
              const formatStore = useFormatGalleryStore.getState();
              formatStore.setSelectedFormat(null, 'bar');
              formatStore.setContentPackage(null);
              formatStore.setContextualImageUrl(null);
            }
          };

          // Helper for decorations & cloud dimensions
          const restoreDecorationsAndDims = () => {
            const chartConfig = conv.snapshot?.chartConfig as any;
            const isTemplateMode = !!(conv.snapshot?.template_structure || conv.snapshot?.is_template_mode || chartConfig?.formatData);
            const targetMode = isTemplateMode ? 'template' : 'chart';

            const decorationsToLoad = chartConfig?.decorationShapes || conv.snapshot?.template_structure?.decorations || [];
            if (decorationsToLoad.length > 0) {
              useDecorationStore.getState().setShapes(decorationsToLoad, targetMode);
            } else {
              useDecorationStore.getState().clearShapes?.();
            }

            if (chartConfig) {
              const width = chartConfig.width ? String(chartConfig.width) : '800';
              const height = chartConfig.height ? String(chartConfig.height) : '600';

              chartStore.setOriginalCloudDimensions({
                width: width.includes('px') ? width : (width.includes('%') ? width : `${width}px`),
                height: height.includes('px') ? height : (height.includes('%') ? height : `${height}px`)
              });
            }
          };

          // 1. Determine target chart mode (single vs grouped)
          const targetChartMode: 'single' | 'grouped' = conv.chart_mode || ((conv.snapshot.chartData?.datasets?.length || 0) > 1 ? 'grouped' : 'single');
          if (chartStore.chartMode !== targetChartMode) {
            chartStore.setChartMode(targetChartMode);
          }

          const currentStore = useChartStore.getState();

          // 2. Check if this cloud chart is already loaded in the workspace
          let existingDatasetIndex = -1;
          let existingGroupId: string | null = null;

          if (targetChartMode === 'single' && currentStore.chartData?.datasets) {
            existingDatasetIndex = currentStore.chartData.datasets.findIndex(
              (ds: any) => ds.sourceId === conv.id
            );
          } else if (targetChartMode === 'grouped' && currentStore.groups) {
            const matchingGroup = currentStore.groups.find(
              (g: any) => g.sourceId === conv.id || g.id === conv.id
            );
            if (matchingGroup) {
              existingGroupId = matchingGroup.id;
            }
          }

          const isAlreadyActive = chatStore.backendConversationId === conv.id;
          if (existingDatasetIndex === -1 && existingGroupId === null && isAlreadyActive) {
            if (targetChartMode === 'single') {
              existingDatasetIndex = currentStore.activeDatasetIndex;
            } else {
              existingGroupId = currentStore.activeGroupId;
            }
          }

          const isExistingInWorkspace = existingDatasetIndex !== -1 || existingGroupId !== null;

          if (isExistingInWorkspace) {
            // Already present in workspace: switch active tab directly without appending duplicates
            if (existingDatasetIndex !== -1) {
              if (existingDatasetIndex !== currentStore.activeDatasetIndex) {
                currentStore.setActiveDatasetIndex(existingDatasetIndex);
              }
              // Refresh dataset in-place with latest cloud snapshot
              const snapDs = conv.snapshot.chartData?.datasets?.[0];
              if (snapDs) {
                const refreshedDatasets = currentStore.chartData.datasets.map((ds: any, idx: number) => {
                  if (idx === existingDatasetIndex) {
                    return {
                      ...ds,
                      ...snapDs,
                      sourceId: conv.id,
                      sourceTitle: conv.title,
                      chartConfig: conv.snapshot!.chartConfig ? JSON.parse(JSON.stringify(conv.snapshot!.chartConfig)) : ds.chartConfig,
                      sliceLabels: conv.snapshot!.chartData?.labels ? [...conv.snapshot!.chartData.labels] : ds.sliceLabels
                    };
                  }
                  return ds;
                });
                const updatedChartData = {
                  ...currentStore.chartData,
                  labels: conv.snapshot.chartData?.labels ? [...conv.snapshot.chartData.labels] : currentStore.chartData.labels,
                  datasets: refreshedDatasets
                };
                useChartStore.setState({
                  chartData: updatedChartData,
                  chartConfig: conv.snapshot.chartConfig ? JSON.parse(JSON.stringify(conv.snapshot.chartConfig)) : currentStore.chartConfig,
                  chartType: conv.snapshot.chartType || currentStore.chartType,
                  chartTitle: conv.title || currentStore.chartTitle,
                  singleModeData: currentStore.chartMode === 'single' ? updatedChartData : currentStore.singleModeData
                });
              }
            } else if (existingGroupId) {
              if (existingGroupId !== currentStore.activeGroupId) {
                currentStore.setActiveGroupId(existingGroupId);
              }
              useChartStore.setState({
                chartConfig: conv.snapshot.chartConfig ? JSON.parse(JSON.stringify(conv.snapshot.chartConfig)) : currentStore.chartConfig,
                chartType: conv.snapshot.chartType || currentStore.chartType,
                chartTitle: conv.title || currentStore.chartTitle
              });
            }

            if (snapshotId) {
              currentStore.setCurrentSnapshotId(snapshotId);
            }
            currentStore.setHasJSON(true);
            try { (useChartStore as any).temporal?.getState()?.clear(); } catch (e) {}

            chatStore.updateChartState({
              chartType: conv.snapshot.chartType,
              chartData: conv.snapshot.chartData,
              chartConfig: conv.snapshot.chartConfig
            });

            restoreDecorationsAndDims();
            restoreTemplateOrFormat();
            return;
          }

          // 3. Not in workspace: check if current workspace is just the initial starter sample
          const datasets = currentStore.chartData?.datasets || [];
          const isStarterSample = datasets.length <= 1 && !currentStore.hasJSON && (!datasets[0]?.sourceId || datasets[0]?.label === 'Sample Dataset');

          currentStore.setFullChart({
            ...conv.snapshot,
            id: snapshotId || undefined,
            name: conv.title,
            conversationId: conv.id,
            replaceMode: isStarterSample
          });
          currentStore.setHasJSON(true);
          if (snapshotId) {
            currentStore.setCurrentSnapshotId(snapshotId);
          }
          try { (useChartStore as any).temporal?.getState()?.clear(); } catch (e) {}

          chatStore.updateChartState({
            chartType: conv.snapshot.chartType,
            chartData: conv.snapshot.chartData,
            chartConfig: conv.snapshot.chartConfig
          });

          restoreDecorationsAndDims();
          restoreTemplateOrFormat();
        }
      },
      clearAllConversations: async () => {
        try {
          // First, try to delete all conversations from backend
          const response = await dataService.deleteAllConversations();
          if (response.error) {
            console.error('Failed to delete all conversations from backend:', response.error);
            // Still clear local state even if backend fails
          } else {
            console.log('✅ All conversations deleted from backend');
          }
        } catch (error) {
          console.error('Error deleting all conversations from backend:', error);
          // Still clear local state even if backend fails
        }

        // Clear local state
        set({ conversations: [] });
      },
      updateConversation: (id, updates) => {
        set({
          conversations: get().conversations.map(conv =>
            conv.id === id ? { ...conv, ...updates } : conv
          )
        });
      },
      loadConversationsFromBackend: async () => {
        set({ loading: true });
        try {
          const response = await dataService.getConversations();

          // Check if there was an error in the response
          if (response.error) {
            console.warn('Failed to load conversations from backend:', response.error);
            set({ loading: false, conversations: [] });
            return;
          }

          if (response.data && response.data.length > 0) {
            // Transform to lightweight frontend format
            // We will lazy-load the details (messages & snapshot) when the user actually clicks on a conversation
            // This prevents "Too Many Requests" (429) errors from firing hundreds of API calls at once
            const lightweightConversations: Conversation[] = response.data.map((conv: any) => ({
              id: conv.id,
              title: conv.title,
              messages: [], // Empty by default, loaded on open
              // Construct a "mini" snapshot with just the type for display
              snapshot: conv.current_chart_type ? {
                chartType: conv.current_chart_type,
                // These will be filled in when the conversation is actually opened
                id: '',
                conversationId: conv.id,
                chartData: null,
                chartConfig: null
              } as any : null,
              timestamp: new Date(conv.created_at).getTime(),
              // Mode metadata from backend
              is_template_mode: conv.is_template_mode || false,
              chart_mode: conv.chart_mode || 'single',
              width: conv.width || undefined,
              height: conv.height || undefined
            }));

            set({
              conversations: lightweightConversations,
              loading: false
            });
            console.log(`✅ Loaded ${lightweightConversations.length} conversations from backend`);
          } else {
            set({ conversations: [], loading: false });
            console.log('No conversations found in backend');
          }
        } catch (error) {
          console.error('Failed to load conversations from backend:', error);
          // Set empty conversations array on error to prevent UI issues
          set({ loading: false, conversations: [] });
        }
      },
    }),
    {
      name: (() => {
        // Get current user ID for user-specific storage
        if (typeof window !== 'undefined') {
          const userId = localStorage.getItem('user-id') || 'anonymous';
          return `chat-history-${userId}`;
        }
        return "chat-history-anonymous";
      })(),
      // Use expiring storage - auto-updates timestamp on save, expires after 12 hours
      storage: typeof window !== 'undefined' ? createExpiringStorage('chat-history') : undefined,
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return {
            conversations: persistedState.conversations || [],
          };
        }
        return persistedState;
      },
      partialize: (state) => ({ conversations: state.conversations }),
    }
  )
);
