import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useChartStore, type SupportedChartType, type ExtendedChartData } from './chart-store';
import type { ChartOptions } from 'chart.js';

// Server API base
const baseServerUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"
const globalServerAPILink = `${baseServerUrl}/api/perplexity/process-chart`

export type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
  timestamp: number;
  chartSnapshot?: ChartSnapshot;
  action?: 'create' | 'modify' | 'update' | 'reset';
  changes?: string[];
  suggestions?: string[];
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

// Generate unique ID for conversations
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

interface ChatStore {
  messages: ChatMessage[];
  currentConversationId: string;
  currentChartState: ChartSnapshot | null;
  conversationContext: ConversationContext | null;
  isProcessing: boolean;
  historyConversationId: string | null;
  
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
}

const initialMessage: ChatMessage = {
  role: 'assistant',
  content: 'Hi! Describe the chart you want to create, or ask me to modify an existing chart.',
  timestamp: Date.now()
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

      addMessage: (msg) => set({ messages: [...get().messages, msg] }),
      
      setMessages: (msgs) => set({ messages: msgs }),
      
      clearMessages: () => set({ messages: [initialMessage] }),
      
      startNewConversation: () => {
        set({
          messages: [initialMessage],
          currentConversationId: generateId(),
          currentChartState: null,
          conversationContext: null,
          historyConversationId: null
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

        try {
          const response = await fetch(globalServerAPILink, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({
              input,
              conversationId: currentConversationId,
              currentChartState,
              messageHistory: messages.slice(-5) // Last 5 messages for context
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to process request");
          }

          const result = await response.json();
          
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: result.user_message,
            timestamp: Date.now(),
            chartSnapshot: {
              chartType: result.chartType,
              chartData: result.chartData,
              chartConfig: result.chartConfig
            },
            action: result.action || 'create',
            changes: result.changes || [],
            suggestions: result.suggestions || []
          };

          // Build the full conversation manually
          const updatedMessages = [...messages, userMsg, assistantMsg];
          set({ 
            messages: updatedMessages,
            currentChartState: assistantMsg.chartSnapshot,
            isProcessing: false
          });

          // Update chart store
          useChartStore.getState().setFullChart(assistantMsg.chartSnapshot);
          useChartStore.getState().setHasJSON(true);
          
          // Save to history if it's a new chart creation
          if (result.action === 'create') {
            const { useHistoryStore } = await import('./history-store');
            const historyStore = useHistoryStore.getState();
            
            // Add conversation and get the actual ID that was created
            const conversationData = {
              title: input.length > 60 ? input.slice(0, 57) + '...' : input,
              messages: updatedMessages,
              snapshot: assistantMsg.chartSnapshot,
            };
            
            // Store the conversation and get the actual ID that was created
            const newId = historyStore.addConversation(conversationData);
            
            // Set the history ID to track this conversation
            set({ historyConversationId: newId });
          } else {
            // Update the conversation in history if it exists
            const { useHistoryStore } = await import('./history-store');
            const historyStore = useHistoryStore.getState();
            const historyId = get().historyConversationId;
            
            if (historyId) {
              // Find the conversation by ID and update it
              const existingConversation = historyStore.conversations.find(c => c.id === historyId);
              if (existingConversation) {
                historyStore.updateConversation(historyId, {
                  messages: updatedMessages,
                  snapshot: assistantMsg.chartSnapshot,
                });
              } else {
                                 // If conversation doesn't exist, create a new one
                 console.log('Creating new history entry as existing one not found');
                 const conversationData = {
                   title: updatedMessages[1]?.content?.slice(0, 57) + '...' || 'Chart Conversation',
                   messages: updatedMessages,
                   snapshot: assistantMsg.chartSnapshot,
                 };
                 const newId = historyStore.addConversation(conversationData);
                 set({ historyConversationId: newId });
              }
            } else {
              // No history ID exists, create new conversation
              console.log('Creating new history entry as historyId is null');
                             const conversationData = {
                 title: updatedMessages[1]?.content?.slice(0, 57) + '...' || 'Chart Conversation',
                 messages: updatedMessages,
                 snapshot: assistantMsg.chartSnapshot,
               };
               const newId = historyStore.addConversation(conversationData);
               set({ historyConversationId: newId });
            }
          }
          
        } catch (error) {
          console.error("Error processing chart:", error);
          const errorMsg: ChatMessage = {
            role: 'assistant',
            content: "Sorry, I couldn't process that. Please try again.",
            timestamp: Date.now()
          };
          set({ 
            messages: [...get().messages, errorMsg],
            isProcessing: false
          });
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
      name: 'enhanced-chat',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return {
            messages: persistedState.messages || [initialMessage],
            currentConversationId: persistedState.currentConversationId || generateId(),
            currentChartState: persistedState.currentChartState || null,
            conversationContext: persistedState.conversationContext || null,
            isProcessing: persistedState.isProcessing ?? false,
            historyConversationId: persistedState.historyConversationId || null,
          };
        }
        return persistedState;
      },
      partialize: (state) => ({ 
        messages: state.messages,
        currentConversationId: state.currentConversationId,
        currentChartState: state.currentChartState,
        historyConversationId: state.historyConversationId
      })
    }
  )
);
