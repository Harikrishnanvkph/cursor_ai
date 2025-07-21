"use client"

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useChatStore, ChatMessage, ChartSnapshot } from "@/lib/chat-store";
import { useChartStore, type SupportedChartType, type ExtendedChartData } from "@/lib/chart-store";
import type { ChartOptions } from "chart.js";

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  snapshot: ChartSnapshot;
  timestamp: number;
};

interface HistoryStore {
  conversations: Conversation[];
  addConversation: (conv: Omit<Conversation, "id" | "timestamp">) => string;
  deleteConversation: (id: string) => void;
  restoreConversation: (id: string) => void;
  clearAllConversations: () => void;
  updateConversation: (id: string, updates: Partial<Omit<Conversation, 'id' | 'timestamp'>>) => void;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      conversations: [],
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
      deleteConversation: (id) => set({ 
        conversations: get().conversations.filter((c) => c.id !== id) 
      }),
      restoreConversation: (id) => {
        const conv = get().conversations.find((c) => c.id === id);
        if (!conv) return;

        // Restore chat messages
        const { setMessages, updateChartState } = useChatStore.getState();
        setMessages(conv.messages);

        // Restore chart snapshot
        const { setFullChart, setHasJSON } = useChartStore.getState();
        setFullChart(conv.snapshot);
        setHasJSON(true);
        
        // Update current chart state in chat store
        updateChartState(conv.snapshot);
      },
      clearAllConversations: () => set({ conversations: [] }),
      updateConversation: (id, updates) => {
        set({
          conversations: get().conversations.map(conv =>
            conv.id === id ? { ...conv, ...updates } : conv
          )
        });
      },
    }),
    {
      name: "chat-history",
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
