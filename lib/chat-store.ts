import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useChartStore, type SupportedChartType, type ExtendedChartData } from './chart-store';
import type { ChartOptions } from 'chart.js';

// Server API base (proxy through Next.js to avoid CORS/preflight)
const globalServerAPILink = "/api/chart"

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
  chartConfig: ChartOptions;
};

export type ConversationContext = {
  currentChart: ChartSnapshot | null;
  conversationHistory: ChatMessage[];
  sessionId: string;
  topic: string;
};

// Undo mechanism types
export type UndoableOperation = {
  id: string;
  timestamp: number;
  type: 'ai_chart_creation' | 'ai_chart_modification' | 'ai_chart_update' | 'manual_config_change' | 'manual_dataset_change' | 'manual_design_change' | 'manual_chart_type_change';
  previousState: ChartSnapshot | null;
  currentState: ChartSnapshot;
  userMessage: string;
  assistantMessage: string;
  conversationId: string;
  toolSource?: string;
  changeDescription?: string;
};

export type UndoStack = {
  operations: UndoableOperation[];
  maxOperations: number;
  currentIndex: number;
};

// Generate unique ID for conversations
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

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
  
  // Undo mechanism
  undoStack: UndoStack;
  canUndo: boolean;
  canRedo: boolean;
  
  // Enhanced methods
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  clearMessages: () => void;
  startNewConversation: () => void;
  continueConversation: (input: string) => Promise<void>;
  modifyCurrentChart: (modification: string) => Promise<void>;
  resetConversation: () => void;
  setProcessing: (processing: boolean) => void;
  updateChartState: (snapshot: ChartSnapshot) => void;
  
  // Undo methods
  addToUndoStack: (operation: Omit<UndoableOperation, 'id' | 'timestamp'>) => void;
  undo: () => Promise<boolean>;
  redo: () => Promise<boolean>;
  clearUndoStack: () => void;
  getUndoHistory: () => UndoableOperation[];
  captureUndoPoint: (operation: Omit<UndoableOperation, 'id' | 'timestamp' | 'conversationId' | 'userMessage' | 'assistantMessage'>) => void;
}

const initialMessage: ChatMessage = {
  role: 'assistant',
  content: 'Hi! Describe the chart you want to create, or ask me to modify an existing chart.',
  timestamp: Date.now()
};

// Helper function to capture undo points
const captureUndoPoint = (operation: Omit<UndoableOperation, 'id' | 'timestamp' | 'conversationId' | 'userMessage' | 'assistantMessage'>) => {
  const { useChatStore } = require('./chat-store');
  const chatStore = useChatStore.getState();
  
  if (chatStore.currentChartState) {
    // Check if there are actual changes by comparing the states
    const hasChanges = !operation.previousState || 
      JSON.stringify(operation.previousState.chartData) !== JSON.stringify(operation.currentState.chartData) ||
      JSON.stringify(operation.previousState.chartConfig) !== JSON.stringify(operation.currentState.chartConfig) ||
      operation.previousState.chartType !== operation.currentState.chartType;
    
    if (hasChanges) {
      chatStore.addToUndoStack({
        ...operation,
        conversationId: chatStore.currentConversationId,
        userMessage: operation.changeDescription || 'Manual chart change',
        assistantMessage: 'Chart updated via UI tools'
      });
    } else {
      console.log('Skipping undo point - no actual changes detected');
    }
  }
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [initialMessage],
      currentConversationId: generateId(),
      currentChartState: null,
      conversationContext: null,
      isProcessing: false,
      historyConversationId: null,
      
      // Initialize undo stack
      undoStack: {
        operations: [],
        maxOperations: 10,
        currentIndex: -1
      },
      canUndo: false,
      canRedo: false,

      addMessage: (msg) => set({ messages: [...get().messages, msg] }),
      
      setMessages: (msgs) => set({ messages: msgs }),
      
      clearMessages: () => set({ messages: [initialMessage] }),
      
      startNewConversation: () => {
        set({
          messages: [initialMessage],
          currentConversationId: generateId(),
          currentChartState: null,
          conversationContext: null,
          historyConversationId: null,
          // Reset undo stack for new conversation
          undoStack: {
            operations: [],
            maxOperations: 10,
            currentIndex: -1
          },
          canUndo: false,
          canRedo: false
        });
        // Reset chart to default state
        useChartStore.getState().resetChart();
        useChartStore.getState().setHasJSON(false);
      },

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

        // Build compact history (last 2, no snapshots, truncate long messages)
        const compactHistory = messages
          .slice(-2)
          .map(({ role, content, timestamp }) => ({ 
            role, 
            content: content.length > 150 ? content.substring(0, 150) + '...' : content,
            timestamp 
          }));

        // Abort any in-flight request
        if (currentRequestController) {
          try { currentRequestController.abort(); } catch {}
        }
        const controller = new AbortController();
        currentRequestController = controller;
        const timeoutId = setTimeout(() => {
          try { controller.abort(); } catch {}
        }, REQUEST_TIMEOUT_MS);

        const requestBody: any = {
          input,
          conversationId: currentConversationId,
          messageHistory: compactHistory
        };
        if (currentChartState) {
          requestBody.currentChartState = currentChartState;
        }

        try {
          const response = await fetch(globalServerAPILink, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
            signal: controller.signal
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
          
          // Validate response has required fields
          if (!result.chartType || !result.chartData) {
            console.error('Frontend - Validation failed:', {
              chartType: result.chartType,
              hasChartData: !!result.chartData,
              result: result
            });
            throw new Error("Invalid response: missing chart data");
          }

          // Ensure user_message exists with fallback
          const userMessage = result.user_message || 
                             `Chart ${result.action === 'modify' ? 'modified' : 'created'} successfully`;
          
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: userMessage,
            timestamp: Date.now(),
            chartSnapshot: {
              chartType: result.chartType,
              chartData: result.chartData,
              chartConfig: result.chartConfig
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
            useChartStore.getState().setFullChart(assistantMsg.chartSnapshot);
            useChartStore.getState().setHasJSON(true);
            
            // Capture undo point for AI-generated changes, but only if there are actual changes
            if (result.action === 'create' || result.action === 'modify' || result.action === 'update') {
              // Check if there are actual changes by comparing the states
              const hasChanges = !currentChartState || 
                JSON.stringify(currentChartState.chartData) !== JSON.stringify(assistantMsg.chartSnapshot.chartData) ||
                JSON.stringify(currentChartState.chartConfig) !== JSON.stringify(assistantMsg.chartSnapshot.chartConfig) ||
                currentChartState.chartType !== assistantMsg.chartSnapshot.chartType;
              
              if (hasChanges) {
                const operationType = result.action === 'create' ? 'ai_chart_creation' : 
                                    result.action === 'modify' ? 'ai_chart_modification' : 'ai_chart_update';
                
                get().addToUndoStack({
                  type: operationType,
                  previousState: currentChartState,
                  currentState: assistantMsg.chartSnapshot,
                  userMessage: input,
                  assistantMessage: result.user_message,
                  conversationId: currentConversationId,
                  toolSource: 'ai-chat',
                  changeDescription: `AI ${result.action}: ${input.slice(0, 50)}${input.length > 50 ? '...' : ''}`
                });
              }
            }
          }
          
          // Save to history if it's a new chart creation
          if (result.action === 'create') {
            const { useHistoryStore } = await import('./history-store');
            const historyStore = useHistoryStore.getState();
            
            // Add conversation and get the actual ID that was created
            if (assistantMsg.chartSnapshot) {
              const conversationData = {
                title: input.length > 60 ? input.slice(0, 57) + '...' : input,
                messages: updatedMessages,
                snapshot: assistantMsg.chartSnapshot,
              };
            
              // Store the conversation and get the actual ID that was created
              const newId = historyStore.addConversation(conversationData);
              
              // Set the history ID to track this conversation
              set({ historyConversationId: newId });
            }
          } else {
            // Update the conversation in history if it exists
            const { useHistoryStore } = await import('./history-store');
            const historyStore = useHistoryStore.getState();
            const historyId = get().historyConversationId;
            
            if (historyId) {
              // Find the conversation by ID and update it
              const existingConversation = historyStore.conversations.find(c => c.id === historyId);
              if (existingConversation) {
                if (assistantMsg.chartSnapshot) {
                  historyStore.updateConversation(historyId, {
                    messages: updatedMessages,
                    snapshot: assistantMsg.chartSnapshot,
                  });
                }
              } else {
                                 // If conversation doesn't exist, create a new one
                 console.log('Creating new history entry as existing one not found');
                 if (assistantMsg.chartSnapshot) {
                   const conversationData = {
                     title: updatedMessages[1]?.content?.slice(0, 57) + '...' || 'Chart Conversation',
                     messages: updatedMessages,
                     snapshot: assistantMsg.chartSnapshot,
                   };
                   const newId = historyStore.addConversation(conversationData);
                   set({ historyConversationId: newId });
                 }
              }
            } else {
              // No history ID exists, create new conversation
              console.log('Creating new history entry as historyId is null');
                             if (assistantMsg.chartSnapshot) {
                 const conversationData = {
                   title: updatedMessages[1]?.content?.slice(0, 57) + '...' || 'Chart Conversation',
                   messages: updatedMessages,
                   snapshot: assistantMsg.chartSnapshot,
                 };
                 const newId = historyStore.addConversation(conversationData);
                 set({ historyConversationId: newId });
               }
            }
          }
          
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

      updateChartState: (snapshot: ChartSnapshot) => set({ currentChartState: snapshot }),

      // Undo mechanism implementation
      addToUndoStack: (operation: Omit<UndoableOperation, 'id' | 'timestamp'>) => {
        // Check if we should debounce this operation
        if (shouldDebounceUndoOperation(operation.type, operation.toolSource || '')) {
          console.log('Debouncing undo operation:', operation.type, operation.toolSource);
          return;
        }
        
        const { undoStack } = get();
        const newOperation = {
          ...operation,
          id: generateId(),
          timestamp: Date.now()
        };
        
        // Remove any operations after current index (when undoing then making new changes)
        const operations = undoStack.operations.slice(0, undoStack.currentIndex + 1);
        
        // Add new operation
        const updatedOperations = [...operations, newOperation];
        
        // Maintain max 10 operations
        if (updatedOperations.length > undoStack.maxOperations) {
          updatedOperations.shift(); // Remove oldest
        }
        
        const newCurrentIndex = updatedOperations.length - 1;
        
        set({
          undoStack: {
            ...undoStack,
            operations: updatedOperations,
            currentIndex: newCurrentIndex
          },
          canUndo: newCurrentIndex >= 0,
          canRedo: false // Can't redo after new operation
        });
      },

      undo: async () => {
        const { undoStack, currentChartState } = get();
        
        if (undoStack.currentIndex < 0) return false;
        
        const operation = undoStack.operations[undoStack.currentIndex];
        
        // Restore previous state
        if (operation.previousState) {
          // Update chart store
          useChartStore.getState().setFullChart(operation.previousState);
          useChartStore.getState().setHasJSON(true);
          
          // Update chat store
          set({ currentChartState: operation.previousState });
          
          // Update history if this was a tracked conversation
          if (operation.conversationId) {
            const { useHistoryStore } = await import('./history-store');
            const historyStore = useHistoryStore.getState();
            const historyId = get().historyConversationId;
            
            if (historyId) {
              historyStore.updateConversation(historyId, {
                snapshot: operation.previousState
              });
            }
          }
        }
        
        // Update undo stack index
        const newCurrentIndex = undoStack.currentIndex - 1;
        set({
          undoStack: {
            ...undoStack,
            currentIndex: newCurrentIndex
          },
          canUndo: newCurrentIndex >= 0,
          canRedo: newCurrentIndex < undoStack.operations.length - 1
        });
        
        return true;
      },

      redo: async () => {
        const { undoStack } = get();
        
        if (undoStack.currentIndex >= undoStack.operations.length - 1) return false;
        
        const nextIndex = undoStack.currentIndex + 1;
        const operation = undoStack.operations[nextIndex];
        
        // Restore the state that was undone
        useChartStore.getState().setFullChart(operation.currentState);
        useChartStore.getState().setHasJSON(true);
        
        set({ 
          currentChartState: operation.currentState,
          undoStack: {
            ...undoStack,
            currentIndex: nextIndex
          },
          canUndo: nextIndex >= 0,
          canRedo: nextIndex < undoStack.operations.length - 1
        });
        
        // Update history
        if (operation.conversationId) {
          const { useHistoryStore } = await import('./history-store');
          const historyStore = useHistoryStore.getState();
          const historyId = get().historyConversationId;
          
          if (historyId) {
            historyStore.updateConversation(historyId, {
              snapshot: operation.currentState
            });
          }
        }
        
        return true;
      },

      clearUndoStack: () => set({
        undoStack: {
          operations: [],
          maxOperations: 10,
          currentIndex: -1
        },
        canUndo: false,
        canRedo: false
      }),

      getUndoHistory: () => get().undoStack.operations,

      captureUndoPoint: (operation: Omit<UndoableOperation, 'id' | 'timestamp' | 'conversationId' | 'userMessage' | 'assistantMessage'>) => {
        const { currentChartState, currentConversationId } = get();
        
        if (currentChartState) {
          get().addToUndoStack({
            ...operation,
            conversationId: currentConversationId,
            userMessage: operation.changeDescription || 'Manual chart change',
            assistantMessage: 'Chart updated via UI tools'
          });
        }
      }
    }),
    {
      name: 'chat-store',
      version: 2, // Increment version for undo functionality
      migrate: (persistedState: any, version: number) => {
        if (version === 1) {
          return {
            ...persistedState,
            undoStack: {
              operations: [],
              maxOperations: 10,
              currentIndex: -1
            },
            canUndo: false,
            canRedo: false
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        messages: state.messages,
        currentConversationId: state.currentConversationId,
        currentChartState: state.currentChartState,
        conversationContext: state.conversationContext,
        isProcessing: state.isProcessing,
        historyConversationId: state.historyConversationId,
        undoStack: state.undoStack,
        canUndo: state.canUndo,
        canRedo: state.canRedo
      }),
    }
  )
);

// Export the captureUndoPoint function for use in other stores
export { captureUndoPoint };
