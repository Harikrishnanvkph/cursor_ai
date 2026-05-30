import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useChartStore, type SupportedChartType, type ExtendedChartData } from './chart-store';
import { getDefaultConfigForType, type ExtendedChartOptions } from './chart-defaults';
import { useTemplateStore } from './template-store';
import { extractTemplateStructure, type TemplateStructureMetadata } from './template-utils';
import { createExpiringStorage } from './storage-utils';
import { useFormatGalleryStore } from './stores/format-gallery-store';
import { extractFormatStructure, formatStructureForPrompt } from './format-utils';
import type { ChartOptions } from 'chart.js';

// Helper function to get the appropriate initial message based on template/format mode
const getInitialMessage = (): ChatMessage => {
  try {
    const templateStore = useTemplateStore.getState();
    if (templateStore.generateMode === 'template' && !templateStore.currentTemplate) {
      return {
        role: 'assistant',
        content: 'Please attach a template to start the conversation. Select a template from the options above to proceed.',
        timestamp: Date.now()
      };
    }
    if (templateStore.generateMode === 'format') {
      try {
        const { useFormatGalleryStore } = require('./stores/format-gallery-store');
        const formatStore = useFormatGalleryStore.getState();
        if (!formatStore.selectedFormatId) {
          return {
            role: 'assistant',
            content: 'Please select a format to start the conversation. Choose a format from the options above to proceed.',
            timestamp: Date.now()
          };
        }
      } catch { }
    }
  } catch (error) {
    // If template store is not available, fall back to default
    console.warn('Could not access template store for initial message:', error);
  }

  return {
    role: 'assistant',
    content: 'Hi! Describe the chart you want to create, or ask me to modify an existing chart.',
    timestamp: Date.now()
  };
};

// Server API base - call directly to pass credentials properly
const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
}
const globalServerAPILink = `${getBaseUrl()}/api/process-chart-enhanced`

/**
 * Dimension-system properties the AI has no concept of — never override these.
 * Everything else (background, visualSettings, etc.) is user-modifiable via AI chat.
 */
const AI_PROTECTED_CONFIG_KEYS = new Set([
  'responsive',
  'manualDimensions',
  'dynamicDimension',
  'templateDimensions',
  'originalDimensions',
  'width',
  'height',
]);

/**
 * Deep-merge AI config overrides into the current chart config.
 * - Frontend-owned properties (dimensions, background, visual settings) are never overridden
 * - Objects are recursively merged (preserves properties AI didn't return)
 * - Arrays and primitives from the override replace the base value
 * - Properties only in the base are preserved
 */
function deepMergeChartConfig(
  base: Record<string, any>,
  override: Record<string, any>
): Record<string, any> {
  const result = { ...base };

  for (const key of Object.keys(override)) {
    // Skip frontend-owned properties — AI must never override these
    if (AI_PROTECTED_CONFIG_KEYS.has(key)) continue;

    const baseVal = base[key];
    const overrideVal = override[key];

    if (
      overrideVal !== null &&
      overrideVal !== undefined &&
      typeof overrideVal === 'object' &&
      !Array.isArray(overrideVal) &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal) &&
      baseVal !== null
    ) {
      // Both are plain objects: recurse to preserve nested properties
      result[key] = deepMergeChartConfig(baseVal, overrideVal);
    } else {
      // Override wins for primitives, arrays, null, and type mismatches
      result[key] = overrideVal;
    }
  }

  return result;
}

// In-flight request control
let currentRequestController: AbortController | null = null;
const REQUEST_TIMEOUT_MS = 120000; // 120s timeout (generous buffer for complex AI processing)
const MAX_RETRIES = 2; // Maximum retry attempts for failed requests

export type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
  timestamp: number;
  chartSnapshot?: ChartSnapshot;
  action?: 'create' | 'modify' | 'update' | 'reset';
  changes?: string[];
};

export type ChartSnapshot = {
  chartType: SupportedChartType;
  chartData: ExtendedChartData;
  template_structure?: any; // Optional: full template layout structure
  template_content?: any;   // Optional: text content for template areas
  is_template_mode?: boolean; // Optional: indicates if this is template mode
  chartConfig: ChartOptions;
};

export type ConversationContext = {
  currentChart: ChartSnapshot | null;
  conversationHistory: ChatMessage[];
  sessionId: string;
  topic: string;
};

// Removed UndoableOperation and UndoStack types since we use zundo

// Generate unique ID for conversations (UUID v4 format)
const generateId = () => {
  // Generate a proper UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Global state for drag handling
const dragState = {
  isDragging: false,
  dragDatasetIndex: -1,
  dragPointIndex: -1,
  dragOffsetX: 0,
  dragOffsetY: 0,
}

// Debouncing mechanism for undo points
const undoDebounceState = {
  lastOperationTime: 0,
  lastOperationType: '',
  lastOperationSource: '',
  debounceWindow: 1000, // 1 second debounce window
}

// Helper function to check if we should debounce an undo operation
const shouldDebounceUndoOperation = (operationType: string, toolSource: string) => {
  const now = Date.now();
  const timeSinceLastOperation = now - undoDebounceState.lastOperationTime;

  // If it's the same operation type and source within the debounce window, debounce it
  if (timeSinceLastOperation < undoDebounceState.debounceWindow &&
    operationType === undoDebounceState.lastOperationType &&
    toolSource === undoDebounceState.lastOperationSource) {
    return true;
  }

  // Update the debounce state
  undoDebounceState.lastOperationTime = now;
  undoDebounceState.lastOperationType = operationType;
  undoDebounceState.lastOperationSource = toolSource;

  return false;
}

interface ChatStore {
  messages: ChatMessage[];
  currentConversationId: string;
  currentChartState: ChartSnapshot | null;
  conversationContext: ConversationContext | null;
  isProcessing: boolean;
  historyConversationId: string | null;
  backendConversationId: string | null; // NEW: Track if chart is already saved to backend

  setBackendConversationId: (id: string | null) => void; // NEW: Setter for backend conversation ID
}

// Default initial message (fallback)
const defaultInitialMessage: ChatMessage = {
  role: 'assistant',
  content: 'Hi! Describe the chart you want to create, or ask me to modify an existing chart.',
  timestamp: Date.now()
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [getInitialMessage()],
      currentConversationId: generateId(),
      currentChartState: null,
      conversationContext: null,
      isProcessing: false,
      historyConversationId: null,
      backendConversationId: null, // NEW: Track backend conversation ID for updates

      addMessage: (msg) => set({ messages: [...get().messages, msg] }),

      setMessages: (msgs) => set({ messages: msgs }),

      clearMessages: () => set({ messages: [getInitialMessage()] }),

      startNewConversation: (keepChartData?: boolean) => {
        set({
          messages: [getInitialMessage()],
          currentConversationId: generateId(),
          currentChartState: null,
          conversationContext: null,
          historyConversationId: null,
          backendConversationId: null // Clear backend ID for new conversation
        });

        // Only reset chart if not explicitly told to keep data
        if (!keepChartData) {
          useChartStore.getState().resetChart();
          
          // Clear format gallery state when clearing chart data
          const formatStore = useFormatGalleryStore.getState();
          formatStore.setContentPackage(null);
          formatStore.setSelectedFormat(null, 'bar');
          formatStore.setContextualImageUrl(null);

          // Clear template state when clearing chart data
          try {
            const { useTemplateStore } = require('./template-store');
            useTemplateStore.getState().clearAllTemplateState();
          } catch(e) {
            console.warn("Could not clear template store", e);
          }
        }

        // Always hide JSON (welcome screen shown)
        useChartStore.getState().setHasJSON(false);

        // Clear undo history for fresh start
        try {
          useChartStore.temporal.getState().clear();
        } catch (e) {
          console.warn('Could not clear temporal history:', e);
        }
      },

      setBackendConversationId: (id) => set({ backendConversationId: id }),

      continueConversation: async (input: string) => {
        const { currentChartState, currentConversationId, messages } = get();

        const userMsg: ChatMessage = {
          role: 'user',
          content: input,
          timestamp: Date.now()
        };
        // Build the full conversation manually
        const messagesWithUser = [...messages, userMsg];
        set({ messages: messagesWithUser, isProcessing: true });

        // Build compact history (last 5, no snapshots, truncate long messages)
        // Increased from 2→5 messages and 150→300 chars for better AI context
        const compactHistory = messages
          .slice(-5)
          .map(({ role, content, timestamp }) => ({
            role,
            content: content.length > 300 ? content.substring(0, 300) + '...' : content,
            timestamp
          }));

        // Abort any in-flight request
        if (currentRequestController) {
          try { currentRequestController.abort(); } catch { }
        }
        const controller = new AbortController();
        currentRequestController = controller;
        const timeoutId = setTimeout(() => {
          try { controller.abort(); } catch { }
        }, REQUEST_TIMEOUT_MS);

        // Build final input string by appending format structure if in format mode
        let finalInput = input;
        let formatStructureData: any = null; // Will be added to request body
        const templateStore = useTemplateStore.getState();
        if (templateStore.generateMode === 'format') {
          try {
            const { useFormatGalleryStore } = require('./stores/format-gallery-store');
            const galleryStore = useFormatGalleryStore.getState();
            if (galleryStore.selectedFormatId) {
              const format = galleryStore.formats.find((f: any) => f.id === galleryStore.selectedFormatId) || 
                             galleryStore.userFormats.find((f: any) => f.id === galleryStore.selectedFormatId);
              if (format) {
                // Extract full format skeleton structure for the AI
                const zoneNotes = galleryStore.formatZoneNotes[format.id] || {};
                const formatStructure = extractFormatStructure(format, zoneNotes);
                formatStructureData = formatStructure;

                // Append human-readable format structure to the prompt so the AI
                // understands the zone layout, character limits, and theme
                finalInput += `\n\n${formatStructureForPrompt(formatStructure)}`;
              }
            }
          } catch (e) {
            console.warn('Could not inject format structure:', e);
          }
        } else {
          // If we are generating a standard chart or template (NOT format mode), 
          // clear any existing format data so 'Browse Formats' doesn't persist
          try {
            const { useFormatGalleryStore } = require('./stores/format-gallery-store');
            const galleryStore = useFormatGalleryStore.getState();
            galleryStore.setContentPackage(null);
            galleryStore.setSelectedFormat(null, 'bar');
            galleryStore.setContextualImageUrl(null);
          } catch (e) {
            console.warn('Could not clear format store data:', e);
          }
        }

        // Build currentChartState from the LIVE chart store, not the stale chat store snapshot.
        // This ensures manual editor changes (e.g., user switched chart type from bar to line)
        // are reflected in what gets sent to the AI.
        const liveChartState = currentChartState ? {
          chartType: useChartStore.getState().chartType,
          chartData: useChartStore.getState().chartData,
          chartConfig: useChartStore.getState().chartConfig,
        } : null;

        const requestBody: any = {
          input: finalInput,
          conversationId: currentConversationId,
          messageHistory: compactHistory
        };
        if (liveChartState) {
          requestBody.currentChartState = liveChartState;
        }

        // Include format structure if in format mode (structured data for AI)
        if (formatStructureData) {
          requestBody.formatStructure = formatStructureData;
        }

        // Include template structure if a template is selected
        if (templateStore.currentTemplate) {
          // Pass content type preferences and section notes to extractTemplateStructure
          requestBody.templateStructure = extractTemplateStructure(
            templateStore.currentTemplate,
            {
              contentTypes: templateStore.contentTypePreferences,
              notes: templateStore.sectionNotes
            }
          );
        }

        try {
          const response = await fetch(globalServerAPILink, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
            credentials: 'include'
          });

          if (!response.ok) {
            // Get detailed error information from backend
            let errorMessage = "Failed to process request";
            try {
              const errorData = await response.json();
              errorMessage = errorData.details || errorData.error || errorMessage;
            } catch {
              // If can't parse error response, use status text
              errorMessage = `Request failed: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const result = await response.json();
          console.log('Frontend - Received result:', {
            hasChartType: !!result.chartType,
            hasChartData: !!result.chartData,
            hasChartConfig: !!result.chartConfig,
            action: result.action,
            service: result.service,
            keys: Object.keys(result)
          });

          // Handle clarification / no-change responses — do NOT update the chart
          // Detection: AI returned no chartData, OR the changes array is empty (no actual modifications).
          // This prevents reverting manual editor changes (e.g., user switched bar→line)
          // when the AI just asks for clarification or returns unchanged data.
          const hasNoChanges = !result.changes || result.changes.length === 0;
          const hasNoChartData = !result.chartType || !result.chartData;

          if (hasNoChartData || (hasNoChanges && result.action === 'modify')) {
            const clarificationMsg: ChatMessage = {
              role: 'assistant',
              content: result.user_message || 'Could you provide more details?',
              timestamp: Date.now(),
              action: 'modify',
              changes: []
            };
            const updatedMsgs = [...messages, userMsg, clarificationMsg];
            set({
              messages: updatedMsgs,
              isProcessing: false
            });
            return;
          }

          // Build chartConfig: for creation, frontend builds from defaults + AI metadata
          // For modification, deep-merge AI's changes into current config to preserve preset styling
          let finalChartConfig: ExtendedChartOptions;
          if (result.chartConfig) {
            // Modification flow: deep-merge AI's config INTO current config
            // This preserves preset styling (background, dimensions, fonts, visual settings, etc.)
            // while applying AI's specific changes (title text, legend position, scale tweaks, etc.)
            const currentConfig = useChartStore.getState().chartConfig;
            finalChartConfig = deepMergeChartConfig(
              JSON.parse(JSON.stringify(currentConfig)),
              result.chartConfig
            ) as ExtendedChartOptions;

            // Sync visualSettings with AI-driven plugin modifications
            if (result.chartConfig.plugins) {
              if (result.chartConfig.plugins.datalabels !== undefined) {
                if (!finalChartConfig.visualSettings) finalChartConfig.visualSettings = {} as any;
                finalChartConfig.visualSettings.showLabels = result.chartConfig.plugins.datalabels.display !== false;
                
                // Sync customLabelsConfig to match datalabels
                if (!finalChartConfig.plugins.customLabelsConfig) finalChartConfig.plugins.customLabelsConfig = {};
                (finalChartConfig.plugins.customLabelsConfig as any).display = result.chartConfig.plugins.datalabels.display;
              }
              if (result.chartConfig.plugins.legend !== undefined) {
                if (!finalChartConfig.visualSettings) finalChartConfig.visualSettings = {} as any;
                finalChartConfig.visualSettings.showLegend = result.chartConfig.plugins.legend.display !== false;
              }
            }
          } else {
            // Creation flow: build config from frontend defaults
            finalChartConfig = JSON.parse(JSON.stringify(getDefaultConfigForType(result.chartType)));

            // Populate with AI-provided text metadata
            if (result.title && finalChartConfig.plugins?.title) {
              (finalChartConfig.plugins.title as any).text = result.title;
              (finalChartConfig.plugins.title as any).display = true;
            }
            if (result.subtitle && finalChartConfig.plugins?.subtitle) {
              (finalChartConfig.plugins.subtitle as any).text = result.subtitle;
              (finalChartConfig.plugins.subtitle as any).display = true;
            }
            // Set axis titles for chart types that have scales
            if (finalChartConfig.scales) {
              if (result.xAxisTitle && (finalChartConfig.scales as any).x?.title) {
                (finalChartConfig.scales as any).x.title.text = result.xAxisTitle;
                (finalChartConfig.scales as any).x.title.display = true;
              }
              if (result.yAxisTitle && (finalChartConfig.scales as any).y?.title) {
                (finalChartConfig.scales as any).y.title.text = result.yAxisTitle;
                (finalChartConfig.scales as any).y.title.display = true;
              }
            }
          }

          // Ensure user_message exists with fallback
          const userMessage = result.user_message ||
            `Chart ${result.action === 'modify' ? 'modified' : 'created'} successfully`;

          // Safety net: for modifications, preserve the current chart type from the live store.
          // The user may have manually switched chart types (e.g., bar→line) via the editor.
          // The AI might return the old type from conversation history — override it.
          let finalChartType = result.chartType;
          if (result.action === 'modify') {
            const liveType = useChartStore.getState().chartType;
            if (liveType && liveType !== result.chartType) {
              console.log(`Frontend - Chart type override: AI returned "${result.chartType}", using live store "${liveType}"`);
              finalChartType = liveType;
            }
          }

          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: userMessage,
            timestamp: Date.now(),
            chartSnapshot: {
              chartType: finalChartType,
              chartData: result.chartData,
              chartConfig: finalChartConfig
            },
            action: result.action || 'create',
            changes: result.changes || []
          };

          // Build the full conversation manually
          const updatedMessages = [...messages, userMsg, assistantMsg];
          set({
            messages: updatedMessages,
            currentChartState: assistantMsg.chartSnapshot,
            isProcessing: false
          });

          // Update chart store
          if (assistantMsg.chartSnapshot) {
            const chartStore = useChartStore.getState();
            const currentConfig = chartStore.chartConfig;

            // Preserve manual dimensions if set in the previous state config (e.g. 1:1, 16:9 selected initially)
            if (currentConfig && (currentConfig.manualDimensions || !currentConfig.responsive)) {
              if (currentConfig.width && currentConfig.height) {
                assistantMsg.chartSnapshot.chartConfig = {
                  ...(assistantMsg.chartSnapshot.chartConfig || {}),
                  responsive: currentConfig.responsive,
                  manualDimensions: currentConfig.manualDimensions,
                  dynamicDimension: currentConfig.dynamicDimension,
                  templateDimensions: currentConfig.templateDimensions,
                  originalDimensions: currentConfig.originalDimensions,
                  width: currentConfig.width,
                  height: currentConfig.height,
                };
              }
            }

            chartStore.setFullChart({ ...assistantMsg.chartSnapshot, replaceMode: true });
            chartStore.setHasJSON(true);

            // Populate template text areas if template structure was provided and response includes template content
            const templateStore = useTemplateStore.getState();
            if (result.templateContent && templateStore.currentTemplate) {
              const template = templateStore.currentTemplate;
              const contentTypePrefs = templateStore.contentTypePreferences;

              // Update each text area with AI-generated content AND apply contentType from preferences
              template.textAreas.forEach((textArea) => {
                const content = result.templateContent[textArea.type];
                if (content) {
                  // Get the contentType preference for this text area (default to 'text')
                  const contentType = contentTypePrefs[textArea.id] || 'text';
                  // Update both content and contentType to ensure HTML is rendered properly
                  templateStore.updateTextArea(textArea.id, {
                    content,
                    contentType
                  });
                }
              });

              // FIX: Store the AI-generated template as the source of truth for content transfer
              // This ensures content is preserved when switching to a different template
              const updatedTemplate = useTemplateStore.getState().currentTemplate;
              if (updatedTemplate) {
                templateStore.setOriginalCloudTemplateContent(updatedTemplate);
              }
            }

            // FIX: Clear backendConversationId when AI creates a NEW chart
            // This ensures the save dialog shows "Save" instead of "Update" for new charts
            if (result.action === 'create') {
              set({ backendConversationId: null });
              // Also clear the current snapshot ID since this is a brand new chart
              useChartStore.getState().setCurrentSnapshotId(null);

              // Format mode handling for new chart creations
              const templateStore = useTemplateStore.getState();
              if (templateStore.generateMode === 'format') {
                // Format mode: apply content to the selected format (or open gallery to browse)
                try {
                  const { useFormatGalleryStore } = require('./stores/format-gallery-store');
                  const formatStore = useFormatGalleryStore.getState();
                  const { extractContentFromChartData } = require('./variant-engine');

                  // Build content package: prefer AI-generated formatContent, fall back to local extraction
                  let contentPackage = null;
                  if (result.formatContent && result.chartData) {
                    // AI was format-aware and returned zone-specific content
                    const { suggestChartTypes } = require('./variant-engine');
                    contentPackage = {
                      ...result.formatContent,
                      chartData: { labels: result.chartData.labels, datasets: result.chartData.datasets },
                      chartConfig: result.chartConfig || {},
                      suggestedChartTypes: suggestChartTypes?.(result.chartType) || [result.chartType],
                    };
                    console.log('Format mode: Using AI-generated formatContent for zone text');
                  } else if (result.chartData) {
                    // Fallback: AI didn't return formatContent, extract locally from chart data
                    contentPackage = extractContentFromChartData(result.chartType, result.chartData, result.chartConfig);
                    console.log('Format mode: Falling back to local content extraction');
                  }

                  if (formatStore.selectedFormatId && formatStore.formats.length > 0) {
                    // Format is pre-selected → auto-apply and close gallery
                    const format = formatStore.formats.find((f: any) => f.id === formatStore.selectedFormatId) ||
                                   formatStore.userFormats.find((f: any) => f.id === formatStore.selectedFormatId);
                    if (format && contentPackage) {
                      formatStore.setContentPackage(contentPackage);
                      templateStore.clearAllTemplateState();
                      templateStore.setEditorMode('template');
                      templateStore.setGenerateMode('format');
                      formatStore.closeGallery(); // Close gallery so rendered format shows
                    }
                  } else if (contentPackage) {
                    // No format pre-selected → set content and open gallery for browsing
                    formatStore.setContentPackage(contentPackage);
                    templateStore.setGenerateMode('format');
                    formatStore.openGallery();
                  }
                } catch (e) {
                  console.warn('Could not auto-apply pre-selected format:', e);
                }
              } else if (templateStore.generateMode === 'chart') {
                // Chart mode (not format/template): auto-open Chart Style Gallery
                // so user can immediately browse and apply styles to their new chart
                try {
                  const { useChartStyleStore } = require('./stores/chart-style-store');
                  const styleStore = useChartStyleStore.getState();
                  // Small delay to let the chart render first
                  setTimeout(() => {
                    styleStore.openGallery(result.chartType);
                  }, 300);
                } catch (e) {
                  console.warn('Could not auto-open style gallery:', e);
                }
              }
            }

            // Undo is now handled by zundo in chart-store
            // For brand-new chart creations, clear undo history so the user
            // cannot undo back to the empty/default state.
            if (result.action === 'create') {
              try {
                useChartStore.temporal.getState().clear();
              } catch (e) {
                console.warn('Could not clear temporal history:', e);
              }
            }
          }

          // DO NOT save to localStorage history automatically
          // History entries should ONLY be created when user explicitly clicks Save button
          // This prevents duplicate history entries during chart editing/modification

          // Note: historyConversationId tracking removed to prevent confusion
          // Charts are kept in memory until user clicks Save
          console.log('Chart created/modified in memory. Click Save button to persist to backend.');

          // Note: Backend sync is now handled manually via Save button
          // Charts are only saved to localStorage until user clicks Save

        } catch (error: any) {
          if (error?.name === 'AbortError') {
            set({ isProcessing: false });
            return;
          }

          console.error("Error processing chart:", error);

          // Provide more specific error messages based on error type
          let errorMessage = "Sorry, I couldn't process that. Please try again.";

          if (error.message?.includes('Empty response from AI service')) {
            errorMessage = "The AI service returned an empty response. This might be due to rate limiting or a temporary service issue. Please try again in a moment.";
          } else if (error.message?.includes('Failed to parse') && error.message?.includes('JSON')) {
            errorMessage = "The AI service returned an invalid response format. Please try rephrasing your request or try again later.";
          } else if (error.message?.includes('Authentication')) {
            errorMessage = "Authentication failed. Please sign in again.";
          } else if (error.message?.includes('timeout') || error.name === 'TimeoutError') {
            errorMessage = "Request timed out. The AI service is taking longer than usual. Please try again.";
          } else if (error.message?.includes('rate limit')) {
            errorMessage = "Too many requests. Please wait a moment before trying again.";
          } else if (error.message?.includes('API key')) {
            errorMessage = "There's an issue with the AI service configuration. Please try again later.";
          } else if (error.message && error.message !== "Failed to process request") {
            // Use the actual error message if it's descriptive
            errorMessage = error.message;
          }

          const errorMsg: ChatMessage = {
            role: 'assistant',
            content: errorMessage,
            timestamp: Date.now()
          };
          set({
            messages: [...get().messages, errorMsg],
            isProcessing: false
          });
        } finally {
          clearTimeout(timeoutId);
          if (currentRequestController === controller) {
            currentRequestController = null;
          }
        }
      },

      modifyCurrentChart: async (modification: string) => {
        await get().continueConversation(modification);
      },

      resetConversation: () => {
        get().startNewConversation();
      },

      setProcessing: (processing: boolean) => set({ isProcessing: processing }),

      updateChartState: (snapshot: ChartSnapshot) => set({ currentChartState: snapshot })
    }),
    {
      name: (() => {
        if (typeof window !== 'undefined') {
          const userId = localStorage.getItem('user-id') || 'anonymous';
          return `chat-store-${userId}`;
        }
        return 'chat-store-anonymous';
      })(),
      // Use expiring storage - auto-updates timestamp on save, expires after 12 hours
      storage: typeof window !== 'undefined' ? createExpiringStorage('chat-store') : undefined,
      version: 2, // Increment version for undo functionality
      migrate: (persistedState: any, version: number) => {
        return persistedState;
      },
      partialize: (state) => ({
        messages: state.messages,
        currentConversationId: state.currentConversationId,
        currentChartState: state.currentChartState,
        conversationContext: state.conversationContext,
        // NOTE: isProcessing is intentionally EXCLUDED — it's transient UI state.
        // Persisting it would permanently lock the chat input if the browser crashes mid-request.
        historyConversationId: state.historyConversationId,
        backendConversationId: state.backendConversationId
      }),
    }
  )
);

