// Migration service to move data from localStorage to backend
import { dataService } from './data-service';
import { useAuth } from '@/components/auth/AuthProvider';

interface MigrationResult {
  success: boolean;
  migrated: {
    conversations: number;
    chartData: number;
    preferences: number;
  };
  errors: string[];
}

class MigrationService {
  
  async migrateUserData(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migrated: { conversations: 0, chartData: 0, preferences: 0 },
      errors: []
    };

    try {
      // Get current user
      const { user } = useAuth.getState();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Migrate chat history (from chat-history localStorage)
      await this.migrateChatHistory(result);
      
      // Migrate chart store data
      await this.migrateChartData(result);
      
      // Migrate user preferences
      await this.migrateUserPreferences(result);
      
      // Clean up localStorage after successful migration
      if (result.success && result.errors.length === 0) {
        this.cleanupLocalStorage();
      }

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  private async migrateChatHistory(result: MigrationResult): Promise<void> {
    try {
      const chatHistoryData = localStorage.getItem('chat-history');
      if (!chatHistoryData) return;

      const historyStore = JSON.parse(chatHistoryData);
      const conversations = historyStore.state?.conversations || [];

      for (const conversation of conversations) {
        try {
          // Create conversation in backend
          const response = await dataService.createConversation(
            conversation.title || 'Migrated Conversation',
            'Migrated from localStorage'
          );

          if (response.error) {
            result.errors.push(`Failed to create conversation: ${response.error}`);
            continue;
          }

          const conversationId = response.data.id;

          // Migrate messages
          for (const message of conversation.messages || []) {
            await dataService.addMessage(
              conversationId,
              message.role,
              message.content,
              message.chartSnapshot?.id,
              message.action,
              message.changes
            );
          }

          // Migrate chart snapshot if exists
          if (conversation.snapshot) {
            await dataService.saveChartSnapshot(
              conversationId,
              conversation.snapshot.chartType,
              conversation.snapshot.chartData,
              conversation.snapshot.chartConfig
            );
          }

          result.migrated.conversations++;
        } catch (error) {
          result.errors.push(`Failed to migrate conversation: ${error}`);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to parse chat history: ${error}`);
    }
  }

  private async migrateChartData(result: MigrationResult): Promise<void> {
    try {
      const chartStoreData = localStorage.getItem('chart-store');
      if (!chartStoreData) return;

      const chartStore = JSON.parse(chartStoreData);
      const state = chartStore.state;

      if (!state) return;

      // Save current chart state as user preferences
      const preferences = {
        chartDefaults: {
          chartType: state.chartType,
          chartMode: state.chartMode,
          fillArea: state.fillArea,
          showBorder: state.showBorder,
          showImages: state.showImages,
          showLabels: state.showLabels,
          uniformityMode: state.uniformityMode
        },
        uiPreferences: {
          activeDatasetIndex: state.activeDatasetIndex,
          legendFilter: state.legendFilter
        }
      };

      await dataService.updateUserPreferences(preferences);
      result.migrated.chartData++;
    } catch (error) {
      result.errors.push(`Failed to migrate chart data: ${error}`);
    }
  }

  private async migrateUserPreferences(result: MigrationResult): Promise<void> {
    try {
      // Check for any other localStorage keys that might contain user preferences
      const keysToCheck = ['user-preferences', 'app-settings'];
      
      for (const key of keysToCheck) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const preferences = JSON.parse(data);
            await dataService.updateUserPreferences(preferences);
            result.migrated.preferences++;
          } catch (parseError) {
            result.errors.push(`Failed to parse preferences from ${key}: ${parseError}`);
          }
        }
      }
    } catch (error) {
      result.errors.push(`Failed to migrate user preferences: ${error}`);
    }
  }

  private cleanupLocalStorage(): void {
    // Clear old global keys (pre-fix)
    const oldGlobalKeys = [
      'chat-history',
      'chart-store',
      'chart-store-with-sync', 
      'chat-store',
      'enhanced-chat-store',
      'template-store',
      'undo-store',
      'user-preferences',
      'app-settings',
      'offline-conversations',
      'offline-chart-data'
    ];

    oldGlobalKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove ${key} from localStorage:`, error);
      }
    });
  }

  // Check if migration is needed
  hasDataToMigrate(): boolean {
    const keysToCheck = ['chat-history', 'chart-store', 'chart-store-with-sync', 'chat-store', 'enhanced-chat-store', 'template-store', 'undo-store'];
    return keysToCheck.some(key => localStorage.getItem(key) !== null);
  }

  // Get migration status
  getMigrationStatus(): { needsMigration: boolean; dataSize: number } {
    let dataSize = 0;
    const keysToCheck = ['chat-history', 'chart-store', 'chart-store-with-sync', 'chat-store', 'enhanced-chat-store', 'template-store', 'undo-store'];
    
    keysToCheck.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        dataSize += data.length;
      }
    });

    return {
      needsMigration: this.hasDataToMigrate(),
      dataSize
    };
  }

  // Preview what will be migrated
  async previewMigration(): Promise<{
    conversations: number;
    chartSettings: boolean;
    preferences: boolean;
    totalSize: number;
  }> {
    const status = this.getMigrationStatus();
    
    let conversations = 0;
    let chartSettings = false;
    let preferences = false;

    try {
      // Count conversations
      const chatHistoryData = localStorage.getItem('chat-history');
      if (chatHistoryData) {
        const historyStore = JSON.parse(chatHistoryData);
        conversations = historyStore.state?.conversations?.length || 0;
      }

      // Check for chart settings
      const chartStoreData = localStorage.getItem('chart-store');
      chartSettings = !!chartStoreData;

      // Check for preferences
      const preferenceKeys = ['user-preferences', 'app-settings'];
      preferences = preferenceKeys.some(key => localStorage.getItem(key) !== null);

    } catch (error) {
      console.error('Error previewing migration:', error);
    }

    return {
      conversations,
      chartSettings,
      preferences,
      totalSize: status.dataSize
    };
  }
}

export const migrationService = new MigrationService();

