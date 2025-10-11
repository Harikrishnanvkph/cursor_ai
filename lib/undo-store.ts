// Client-side undo store with Zustand - stays local only
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UndoableOperation = {
  id: string;
  timestamp: number;
  type: 'ai_chart_creation' | 'ai_chart_modification' | 'ai_chart_update' | 'manual_config_change' | 'manual_dataset_change' | 'manual_design_change' | 'manual_chart_type_change';
  previousState: any | null;
  currentState: any;
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

interface UndoStore {
  // Per-conversation undo stacks
  undoStacks: Map<string, UndoStack>;
  
  // Actions
  addToUndoStack: (conversationId: string, operation: Omit<UndoableOperation, 'id' | 'timestamp'>) => void;
  undo: (conversationId: string) => UndoableOperation | null;
  redo: (conversationId: string) => UndoableOperation | null;
  clearUndoStack: (conversationId: string) => void;
  getUndoStack: (conversationId: string) => UndoStack;
  canUndo: (conversationId: string) => boolean;
  canRedo: (conversationId: string) => boolean;
  
  // Cleanup methods
  clearAllUndoStacks: () => void;
  clearOldUndoStacks: (maxAge: number) => void; // Clear stacks older than maxAge ms
}

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

export const useUndoStore = create<UndoStore>()(
  persist(
    (set, get) => ({
      undoStacks: new Map(),
      
      addToUndoStack: (conversationId: string, operation: Omit<UndoableOperation, 'id' | 'timestamp'>) => {
        const { undoStacks } = get();
        const stack = undoStacks.get(conversationId) || {
          operations: [],
          maxOperations: 10,
          currentIndex: -1
        };
        
        const newOperation: UndoableOperation = {
          ...operation,
          id: generateId(),
          timestamp: Date.now()
        };
        
        // Remove operations after current index (when undoing then making new changes)
        const operations = stack.operations.slice(0, stack.currentIndex + 1);
        
        // Add new operation
        const updatedOperations = [...operations, newOperation];
        
        // Maintain max operations limit
        if (updatedOperations.length > stack.maxOperations) {
          updatedOperations.shift(); // Remove oldest
        }
        
        const newCurrentIndex = updatedOperations.length - 1;
        
        const newStack: UndoStack = {
          ...stack,
          operations: updatedOperations,
          currentIndex: newCurrentIndex
        };
        
        set({
          undoStacks: new Map(undoStacks.set(conversationId, newStack))
        });
      },
      
      undo: (conversationId: string) => {
        const { undoStacks } = get();
        const stack = undoStacks.get(conversationId);
        
        if (!stack || stack.currentIndex < 0) return null;
        
        const operation = stack.operations[stack.currentIndex];
        const newCurrentIndex = stack.currentIndex - 1;
        
        set({
          undoStacks: new Map(undoStacks.set(conversationId, {
            ...stack,
            currentIndex: newCurrentIndex
          }))
        });
        
        return operation;
      },
      
      redo: (conversationId: string) => {
        const { undoStacks } = get();
        const stack = undoStacks.get(conversationId);
        
        if (!stack || stack.currentIndex >= stack.operations.length - 1) return null;
        
        const nextIndex = stack.currentIndex + 1;
        const operation = stack.operations[nextIndex];
        
        set({
          undoStacks: new Map(undoStacks.set(conversationId, {
            ...stack,
            currentIndex: nextIndex
          }))
        });
        
        return operation;
      },
      
      clearUndoStack: (conversationId: string) => {
        const { undoStacks } = get();
        undoStacks.delete(conversationId);
        set({ undoStacks: new Map(undoStacks) });
      },
      
      getUndoStack: (conversationId: string) => {
        const { undoStacks } = get();
        return undoStacks.get(conversationId) || {
          operations: [],
          maxOperations: 10,
          currentIndex: -1
        };
      },
      
      canUndo: (conversationId: string) => {
        const stack = get().getUndoStack(conversationId);
        return stack.currentIndex >= 0;
      },
      
      canRedo: (conversationId: string) => {
        const stack = get().getUndoStack(conversationId);
        return stack.currentIndex < stack.operations.length - 1;
      },
      
      clearAllUndoStacks: () => {
        set({ undoStacks: new Map() });
      },
      
      clearOldUndoStacks: (maxAge: number) => {
        const { undoStacks } = get();
        const now = Date.now();
        const newStacks = new Map();
        
        for (const [conversationId, stack] of undoStacks) {
          const latestOperation = stack.operations[stack.operations.length - 1];
          if (latestOperation && (now - latestOperation.timestamp) < maxAge) {
            newStacks.set(conversationId, stack);
          }
        }
        
        set({ undoStacks: newStacks });
      }
    }),
    {
      name: (() => {
        if (typeof window !== 'undefined') {
          const userId = localStorage.getItem('user-id') || 'anonymous';
          return `undo-store-${userId}`;
        }
        return 'undo-store-anonymous';
      })(),
      version: 1,
      // Custom storage that handles Map serialization
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            return {
              state: {
                ...parsed.state,
                undoStacks: new Map(parsed.state.undoStacks || [])
              },
              version: parsed.version
            };
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            const serialized = {
              state: {
                ...value.state,
                undoStacks: Array.from(value.state.undoStacks.entries())
              },
              version: value.version
            };
            localStorage.setItem(name, JSON.stringify(serialized));
          } catch (error) {
            console.error('Failed to save undo store:', error);
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) => ({ undoStacks: state.undoStacks }),
    }
  )
);

// Auto-cleanup old undo stacks (older than 24 hours)
if (typeof window !== 'undefined') {
  const cleanupInterval = setInterval(() => {
    useUndoStore.getState().clearOldUndoStacks(24 * 60 * 60 * 1000); // 24 hours
  }, 60 * 60 * 1000); // Check every hour
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(cleanupInterval);
  });
}

