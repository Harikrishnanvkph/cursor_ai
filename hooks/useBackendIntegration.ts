// Hook to integrate backend storage with existing components
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { dataService } from '@/lib/data-service'
import { useEnhancedChatStore } from '@/lib/enhanced-chat-store'
import { useChartStoreWithSync } from '@/lib/chart-store-with-sync'
import { migrationService } from '@/lib/migration-service'

export function useBackendIntegration() {
  const { user } = useAuth()
  const [needsMigration, setNeedsMigration] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Enhanced chat store
  const {
    createConversation,
    loadConversations,
    loadConversation,
    addMessage,
    saveChartSnapshot,
    syncWithBackend,
    currentConversationId,
    conversations,
    messages,
    currentChartState
  } = useEnhancedChatStore()

  // Chart store with sync
  const {
    chartType,
    chartData,
    chartConfig,
    syncToBackend: syncChartToBackend,
    loadFromBackend: loadChartFromBackend,
    isDirty: chartIsDirty,
    markAsDirty
  } = useChartStoreWithSync()

  // Check for migration needs on mount
  useEffect(() => {
    if (user && !isInitialized) {
      const needsMigrationCheck = migrationService.hasDataToMigrate()
      setNeedsMigration(needsMigrationCheck)
      setIsInitialized(true)
    }
  }, [user, isInitialized])

  // Auto-sync when user changes or comes online
  useEffect(() => {
    if (user && isInitialized) {
      syncWithBackend()
    }
  }, [user, isInitialized])

  // Auto-save DISABLED - Charts should only save when user clicks Save button
  // useEffect(() => {
  //   if (chartIsDirty && currentConversationId && user) {
  //     const timeoutId = setTimeout(() => {
  //       syncChartToBackend(currentConversationId)
  //     }, 2000) // Debounce for 2 seconds

  //     return () => clearTimeout(timeoutId)
  //   }
  // }, [chartIsDirty, currentConversationId, user])

  // Load chart data when conversation changes
  useEffect(() => {
    if (currentConversationId && user) {
      loadChartFromBackend(currentConversationId)
    }
  }, [currentConversationId, user])

  // Wrapper functions that integrate both stores
  const createNewConversation = async (title: string, description?: string) => {
    const conversationId = await createConversation(title, description)
    
    // Reset chart state for new conversation
    useChartStoreWithSync.getState().resetChart()
    
    return conversationId
  }

  const addMessageWithChartSync = async (message: any) => {
    await addMessage(message)
    
    // If message contains chart snapshot, save it
    if (message.chartSnapshot && currentConversationId) {
      await saveChartSnapshot(message.chartSnapshot)
    }
  }

  const updateChartAndSync = (updates: any) => {
    // Update chart state
    Object.entries(updates).forEach(([key, value]) => {
      const setter = useChartStoreWithSync.getState()[`set${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof useChartStoreWithSync.getState()]
      if (typeof setter === 'function') {
        (setter as any)(value)
      }
    })
    
    // Mark as dirty for auto-sync
    markAsDirty()
  }

  const performMigration = async () => {
    try {
      const result = await migrationService.migrateUserData()
      
      if (result.success) {
        setNeedsMigration(false)
        // Reload data after successful migration
        await syncWithBackend()
      }
      
      return result
    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    }
  }

  const getMigrationPreview = async () => {
    return await migrationService.previewMigration()
  }

  return {
    // State
    user,
    needsMigration,
    isInitialized,
    currentConversationId,
    conversations,
    messages,
    currentChartState,
    chartType,
    chartData,
    chartConfig,
    chartIsDirty,

    // Chat actions
    createConversation: createNewConversation,
    loadConversations,
    loadConversation,
    addMessage: addMessageWithChartSync,
    saveChartSnapshot,

    // Chart actions
    updateChartAndSync,
    syncChartToBackend,
    loadChartFromBackend,

    // Migration actions
    performMigration,
    getMigrationPreview,

    // Utility
    syncWithBackend,
    clearCache: () => dataService.clearCache()
  }
}

