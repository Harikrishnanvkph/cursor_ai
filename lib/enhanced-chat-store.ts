// Enhanced chat store with backend sync and client-side undo
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dataService } from './data-service';
import { useUndoStore } from './undo-store';
import { createExpiringStorage } from './storage-utils';

export type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
  timestamp: number;
  chartSnapshot?: ChartSnapshot;
  action?: 'create' | 'modify' | 'update' | 'reset';
  changes?: string[];
};

export type ChartSnapshot = {
  chartType: string;
  chartData: any;
  chartConfig: any;
};

export type Conversation = {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  last_activity: string;
  message_count: number;
  current_chart_type?: string;
};

interface EnhancedChatStore {
  // State
  messages: ChatMessage[];
  currentConversationId: string | null;
  conversations: Conversation[];
  currentChartState: ChartSnapshot | null;
  isProcessing: boolean;
  isOnline: boolean;
  lastSyncTime: number;
  
  // Client-side undo state
  canUndo: boolean;
  canRedo: boolean;
  
  // Actions
  createConversation: (title: string, description?: string) => Promise<string>;
  loadConversations: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  addMessage: (msg: ChatMessage) => Promise<void>;
  saveChartSnapshot: (snapshot: ChartSnapshot) => Promise<void>;
  syncWithBackend: () => Promise<void>;
  handleOfflineMode: () => void;
  
  // Client-side undo methods only
  undo: () => Promise<boolean>;
  redo: () => Promise<boolean>;
  addUndoPoint: (operation: any) => void;
  
  // Utility methods
  clearConversation: () => void;
  startNewConversation: () => Promise<void>;
}

const initialMessage: ChatMessage = {
  role: 'assistant',
  content: 'Hi! Describe the chart you want to create, or ask me to modify an existing chart.',
  timestamp: Date.now()
};

export const useEnhancedChatStore = create<EnhancedChatStore>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [initialMessage],
      currentConversationId: null,
      conversations: [],
      currentChartState: null,
      isProcessing: false,
      isOnline: navigator.onLine,
      lastSyncTime: 0,
      canUndo: false,
      canRedo: false,

      // Create new conversation
      createConversation: async (title: string, description?: string) => {
        set({ isProcessing: true });
        
        try {
          const response = await dataService.createConversation(title, description);
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          const conversationId = response.data.id;
          set({ 
            currentConversationId: conversationId,
            messages: [initialMessage],
            isProcessing: false
          });
          
          // Refresh conversations list
          get().loadConversations();
          
          return conversationId;
        } catch (error) {
          console.error('Error creating conversation:', error);
          set({ isProcessing: false });
          throw error;
        }
      },

      // Load user's conversations
      loadConversations: async () => {
        try {
          const response = await dataService.getConversations();
          
          if (response.data) {
            set({ conversations: response.data });
          }
        } catch (error) {
          console.error('Error loading conversations:', error);
          
          // Fallback to offline data
          if (!get().isOnline) {
            const offlineData = await dataService.getOfflineData();
            set({ conversations: offlineData.conversations || [] });
          }
        }
      },

      // Load specific conversation
      loadConversation: async (id: string) => {
        set({ isProcessing: true, currentConversationId: id });
        
        try {
          const response = await dataService.getConversation(id);
          
          if (response.data) {
            // Convert backend messages to frontend format
            const messages = (response.data.chat_messages || []).map((msg: any) => ({
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.created_at).getTime(),
              action: msg.action,
              changes: msg.changes,
              chartSnapshot: msg.chart_snapshots ? {
                chartType: msg.chart_snapshots.chart_type,
                chartData: msg.chart_snapshots.chart_data,
                chartConfig: msg.chart_snapshots.chart_config
              } : undefined
            }));

            // Get current chart snapshot
            const currentSnapshot = (response.data.chart_snapshots || [])
              .find((s: any) => s.is_current);

            set({
              messages: messages.length > 0 ? messages : [initialMessage],
              currentChartState: currentSnapshot ? {
                chartType: currentSnapshot.chart_type,
                chartData: currentSnapshot.chart_data,
                chartConfig: currentSnapshot.chart_config
              } : null,
              isProcessing: false
            });

            // Update undo state
            const undoStore = useUndoStore.getState();
            set({
              canUndo: undoStore.canUndo(id),
              canRedo: undoStore.canRedo(id)
            });
          }
        } catch (error) {
          console.error('Error loading conversation:', error);
          set({ isProcessing: false });
          
          // Fallback to offline data
          if (!get().isOnline) {
            const offlineData = await dataService.getOfflineData();
            const conversation = offlineData.conversations.find((c: any) => c.id === id);
            if (conversation) {
              set({
                messages: conversation.messages || [initialMessage],
                currentChartState: conversation.currentChartState || null,
                isProcessing: false
              });
            }
          }
        }
      },

      // Add message to conversation
      addMessage: async (msg: ChatMessage) => {
        const { currentConversationId, isOnline } = get();
        
        // Add to local state immediately for responsiveness
        set({ messages: [...get().messages, msg] });
        
        if (currentConversationId && isOnline) {
          try {
            await dataService.addMessage(
              currentConversationId,
              msg.role,
              msg.content,
              msg.chartSnapshot?.id,
              msg.action,
              msg.changes
            );
          } catch (error) {
            console.error('Error saving message:', error);
            // Message is already in local state, will sync later
          }
        } else if (currentConversationId && !isOnline) {
          // Save to offline storage
          const offlineData = await dataService.getOfflineData();
          await dataService.saveOfflineData(currentConversationId, {
            id: currentConversationId,
            messages: get().messages,
            currentChartState: get().currentChartState
          });
        }
      },

      // Save chart snapshot - AUTO-SAVE DISABLED (only manual Save button)
      saveChartSnapshot: async (snapshot: ChartSnapshot) => {
        // Only update local state, don't auto-save to backend
        set({ currentChartState: snapshot });
        
        // Auto-save to backend is DISABLED
        // Charts only save when user explicitly clicks Save button
        console.log('Chart snapshot updated locally. Click Save button to save to backend.');
      },

      // Sync with backend
      syncWithBackend: async () => {
        if (!get().isOnline) return;
        
        try {
          // Sync conversations
          await get().loadConversations();
          
          // Sync current conversation if exists
          const { currentConversationId } = get();
          if (currentConversationId) {
            await get().loadConversation(currentConversationId);
          }
          
          set({ lastSyncTime: Date.now() });
        } catch (error) {
          console.error('Error syncing with backend:', error);
        }
      },

      // Handle offline mode
      handleOfflineMode: () => {
        set({ isOnline: navigator.onLine });
        
        if (navigator.onLine && get().lastSyncTime === 0) {
          // Came back online, sync data
          get().syncWithBackend();
        }
      },

      // Client-side undo methods only
      undo: async () => {
        const { currentConversationId, currentChartState } = get();
        if (!currentConversationId) return false;
        
        const undoStore = useUndoStore.getState();
        const operation = undoStore.undo(currentConversationId);
        
        if (operation && operation.previousState) {
          set({ 
            currentChartState: operation.previousState,
            canUndo: undoStore.canUndo(currentConversationId),
            canRedo: undoStore.canRedo(currentConversationId)
          });
          return true;
        }
        
        return false;
      },

      redo: async () => {
        const { currentConversationId } = get();
        if (!currentConversationId) return false;
        
        const undoStore = useUndoStore.getState();
        const operation = undoStore.redo(currentConversationId);
        
        if (operation) {
          set({ 
            currentChartState: operation.currentState,
            canUndo: undoStore.canUndo(currentConversationId),
            canRedo: undoStore.canRedo(currentConversationId)
          });
          return true;
        }
        
        return false;
      },

      // Helper method to add undo point
      addUndoPoint: (operation: any) => {
        const { currentConversationId, currentChartState } = get();
        if (!currentConversationId || !currentChartState) return;
        
        const undoStore = useUndoStore.getState();
        undoStore.addToUndoStack(currentConversationId, {
          ...operation,
          previousState: operation.previousState,
          currentState: currentChartState,
          conversationId: currentConversationId
        });
        
        set({
          canUndo: undoStore.canUndo(currentConversationId),
          canRedo: undoStore.canRedo(currentConversationId)
        });
      },

      // Clear current conversation
      clearConversation: () => {
        set({
          messages: [initialMessage],
          currentChartState: null,
          currentConversationId: null,
          canUndo: false,
          canRedo: false
        });
      },

      // Start new conversation
      startNewConversation: async () => {
        const { currentConversationId } = get();
        
        // Clear undo stack for current conversation
        if (currentConversationId) {
          const undoStore = useUndoStore.getState();
          undoStore.clearUndoStack(currentConversationId);
        }
        
        set({
          messages: [initialMessage],
          currentChartState: null,
          currentConversationId: null,
          canUndo: false,
          canRedo: false
        });
      }
    }),
    {
      name: (() => {
        if (typeof window !== 'undefined') {
          const userId = localStorage.getItem('user-id') || 'anonymous';
          return `enhanced-chat-store-${userId}`;
        }
        return 'enhanced-chat-store-anonymous';
      })(),
      // Use expiring storage - auto-updates timestamp on save, expires after 12 hours
      storage: typeof window !== 'undefined' ? createExpiringStorage('enhanced-chat-store') : undefined,
      version: 1,
      // Only persist certain fields
      partialize: (state) => ({
        messages: state.messages,
        currentConversationId: state.currentConversationId,
        currentChartState: state.currentChartState,
        conversations: state.conversations,
        lastSyncTime: state.lastSyncTime
      }),
    }
  )
);

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useEnhancedChatStore.getState().handleOfflineMode();
  });
  
  window.addEventListener('offline', () => {
    useEnhancedChatStore.getState().handleOfflineMode();
  });
}

