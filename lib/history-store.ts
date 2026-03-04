"use client"

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useChatStore, ChatMessage, ChartSnapshot } from "@/lib/chat-store";
import { useChartStore, type SupportedChartType, type ExtendedChartData } from "@/lib/chart-store";
import { useTemplateStore } from "@/lib/template-store";
import { dataService } from "@/lib/data-service";
import { createExpiringStorage } from "@/lib/storage-utils";
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

        // If found locally but snapshot doesn't have ID, fetch from backend to get snapshot ID
        if (conv && conv.snapshot && !conv.snapshot.id) {
          try {
            const snapshotResponse = await dataService.getCurrentChartSnapshot(id);
            if (snapshotResponse.data?.id) {
              conv.snapshot.id = snapshotResponse.data.id;
            }
          } catch (error) {
            console.warn('Could not fetch snapshot ID from backend:', error);
          }
        }

        // If not found locally, OR if found but has no details (lazy load case), fetch from backend
        // We check for absence of snapshot or absence of chartData in snapshot as indication of "list-only" data
        const isIncomplete = conv && (!conv.snapshot || (conv.snapshot && !conv.snapshot.chartData));

        if (!conv || isIncomplete) {
          console.log(`Conversation ${isIncomplete ? 'incomplete' : 'not found'} locally, fetching details from backend...`);
          try {
            const response = await dataService.getConversation(id);
            if (response.data) {
              // Fetch messages
              const messagesResponse = await dataService.getMessages(id);
              // Fetch current snapshot
              const snapshotResponse = await dataService.getCurrentChartSnapshot(id);

              // Transform messages to frontend format with proper ChatMessage structure
              const transformedMessages = (messagesResponse.data || []).map((msg: any) => ({
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.created_at).getTime(),
                action: msg.action,
                changes: msg.changes,
                // Link chart snapshot if this message has one
                chartSnapshot: msg.chart_snapshots ? {
                  chartType: msg.chart_snapshots.chart_type,
                  chartData: msg.chart_snapshots.chart_data,
                  chartConfig: msg.chart_snapshots.chart_config
                } : undefined
              }));

              // Transform to frontend format
              conv = {
                id: response.data.id,
                title: response.data.title,
                messages: transformedMessages,
                snapshot: snapshotResponse.data ? {
                  id: snapshotResponse.data.id, // Include snapshot ID for updates
                  chartType: snapshotResponse.data.chart_type,
                  chartData: snapshotResponse.data.chart_data,
                  chartConfig: snapshotResponse.data.chart_config,
                  template_structure: snapshotResponse.data.template_structure, // Map template fields
                  template_content: snapshotResponse.data.template_content,     // Map template fields
                  is_template_mode: snapshotResponse.data.is_template_mode      // Map template fields
                } : null,
                timestamp: new Date(response.data.created_at).getTime()
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
        const { setMessages, updateChartState, setBackendConversationId } = useChatStore.getState();
        setMessages(conv.messages);

        // Set backend conversation ID so Save button knows to update instead of create
        setBackendConversationId(conv.id);

        // Restore chart snapshot
        const { setFullChart, setHasJSON, setCurrentSnapshotId } = useChartStore.getState();
        const { setCurrentTemplate, setEditorMode } = useTemplateStore.getState();

        if (conv.snapshot) {
          // Get snapshot ID from the snapshot object (already fetched above)
          const snapshotId = conv.snapshot.id;

          if (snapshotId) {
            setCurrentSnapshotId(snapshotId);
          }

          // Pass snapshot ID and chart name to setFullChart so it can be stored
          // NOTE: Do NOT use replaceMode: true here! History loading should APPEND datasets
          // so users can load multiple charts and switch between them in the dropdown
          setFullChart({ ...conv.snapshot, id: snapshotId || undefined, name: conv.title, conversationId: conv.id });
          setHasJSON(true);

          // CRITICAL: Also update chatStore.currentChartState so landing page sees correct chart
          // Without this, navigating from editor to landing after loading from history
          // would show the old chart instead of the newly loaded one
          updateChartState({
            chartType: conv.snapshot.chartType,
            chartData: conv.snapshot.chartData,
            chartConfig: conv.snapshot.chartConfig
          });

          // Save original cloud dimensions for restoration (for chart-only conversations)
          // ONLY if they haven't been set yet, to preserve the true "Original" reference
          const chartConfig = conv.snapshot.chartConfig as any;
          if (chartConfig) {
            const { originalCloudDimensions, setOriginalCloudDimensions } = useChartStore.getState();

            if (!originalCloudDimensions) {
              const width = chartConfig.width ? String(chartConfig.width) : '600px';
              const height = chartConfig.height ? String(chartConfig.height) : '500px';

              setOriginalCloudDimensions({
                width: width.includes('px') ? width : `${width}px`,
                height: height.includes('px') ? height : `${height}px`
              });
            }
          }

          // Restore template mode if snapshot has template data
          if (conv.snapshot.template_structure || conv.snapshot.is_template_mode) {
            if (conv.snapshot.template_structure) {
              // Create Current Cloud Template structure
              const cloudTemplate = {
                ...conv.snapshot.template_structure,
                id: 'current-cloud-template',
                name: 'Current Cloud Template',
                description: 'Original template structure from backend snapshot',
                isCustom: false,
                isCloudTemplate: true
              }

              // Restore text area content if available
              if (conv.snapshot.template_content) {
                const template = conv.snapshot.template_structure;
                const content = conv.snapshot.template_content;

                // Update text areas with saved content
                const updatedTextAreas = template.textAreas.map(area => {
                  const areaContent = content[area.type];
                  if (areaContent !== undefined) {
                    // Handle multiple areas of same type (array) or single content
                    if (Array.isArray(areaContent)) {
                      // Find index of this area among areas of same type
                      const sameTypeAreas = template.textAreas.filter(ta => ta.type === area.type);
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

              // Store as original cloud template content for content transfer
              const templateStore = useTemplateStore.getState()
              templateStore.setOriginalCloudTemplateContent(cloudTemplate)
              templateStore.setCurrentTemplate(cloudTemplate)
              templateStore.setEditorMode('template');
              templateStore.setTemplateSavedToCloud(true); // Mark template as saved to cloud
              templateStore.clearUnusedContents()
            }
          } else {
            // No template data - explicitly clear ALL template state and set chart mode
            console.log('📊 Loading chart-only conversation - clearing all template state')
            const templateStore = useTemplateStore.getState()
            templateStore.clearAllTemplateState() // This clears templateInBackground, currentTemplate, editorMode to 'chart', etc.
          }
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
              chart_mode: conv.chart_mode || 'single'
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
