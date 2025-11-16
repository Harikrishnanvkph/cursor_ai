/**
 * Storage Utilities for User-Specific localStorage
 * 
 * Provides helper functions to ensure localStorage keys are user-specific,
 * preventing data contamination between different user accounts.
 */

/**
 * Gets a user-specific storage key
 * @param baseName - The base name of the storage key
 * @returns User-specific storage key (e.g., "chart-store-user123")
 */
export function getUserStorageKey(baseName: string): string {
  if (typeof window === 'undefined') {
    return `${baseName}-anonymous`;
  }
  
  const userId = localStorage.getItem('user-id');
  if (!userId || userId === 'null' || userId === 'undefined') {
    return `${baseName}-anonymous`;
  }
  
  return `${baseName}-${userId}`;
}

/**
 * Gets the current user ID from localStorage
 * @returns User ID or 'anonymous' if not found
 */
export function getCurrentUserId(): string {
  if (typeof window === 'undefined') {
    return 'anonymous';
  }
  
  const userId = localStorage.getItem('user-id');
  return userId && userId !== 'null' && userId !== 'undefined' ? userId : 'anonymous';
}

/**
 * Clears all localStorage keys for a specific user
 * @param userId - The user ID whose data should be cleared
 */
export function clearUserSpecificStorage(userId: string): void {
  if (typeof window === 'undefined') return;
  
  const storeNames = [
    'chart-store-with-sync',
    'chart-store',
    'chat-store',
    'enhanced-chat-store',
    'template-store',
    'undo-store',
    'chat-history',
    'offline-conversations',
    'offline-chart-data',
  ];
  
  const keysToRemove = storeNames.map(name => `${name}-${userId}`);
  
  let removedCount = 0;
  keysToRemove.forEach(key => {
    try {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        removedCount++;
      }
    } catch (error) {
      console.warn(`Failed to remove ${key}:`, error);
    }
  });
  
  console.log(`✅ Cleared ${removedCount} localStorage keys for user: ${userId}`);
}

/**
 * Clears all localStorage keys (useful for complete logout)
 */
export function clearAllStorage(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keysToKeep = ['theme', 'language', 'cookies-accepted'];
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ Cleared all user-specific localStorage');
  } catch (error) {
    console.error('Failed to clear all storage:', error);
  }
}

/**
 * Gets all storage keys for a specific user
 * @param userId - The user ID
 * @returns Array of storage keys for this user
 */
export function getUserStorageKeys(userId: string): string[] {
  if (typeof window === 'undefined') return [];
  
  const allKeys = Object.keys(localStorage);
  return allKeys.filter(key => key.includes(`-${userId}`));
}

/**
 * Checks if there's data in localStorage for a specific user
 * @param userId - The user ID
 * @returns True if user has data in localStorage
 */
export function userHasStoredData(userId: string): boolean {
  return getUserStorageKeys(userId).length > 0;
}

/**
 * Creates a user-specific storage object for Zustand persist
 * @param baseName - The base name for the storage
 * @returns Storage object compatible with Zustand persist
 */
export function createUserSpecificStorage(baseName: string) {
  return {
    getItem: (name: string) => {
      const key = getUserStorageKey(baseName);
      return localStorage.getItem(key);
    },
    setItem: (name: string, value: string) => {
      const key = getUserStorageKey(baseName);
      localStorage.setItem(key, value);
    },
    removeItem: (name: string) => {
      const key = getUserStorageKey(baseName);
      localStorage.removeItem(key);
    },
  };
}

/**
 * Safely gets a value from user-specific storage
 * @param baseName - The base name of the storage
 * @param defaultValue - Default value if not found
 * @returns Parsed value or default
 */
export function getUserStorageValue<T>(baseName: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const key = getUserStorageKey(baseName);
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from ${baseName}:`, error);
    return defaultValue;
  }
}

/**
 * Safely sets a value in user-specific storage
 * @param baseName - The base name of the storage
 * @param value - Value to store
 */
export function setUserStorageValue<T>(baseName: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = getUserStorageKey(baseName);
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to ${baseName}:`, error);
  }
}

/**
 * Lists all users that have data in localStorage
 * @returns Array of user IDs that have stored data
 */
export function getAllStoredUserIds(): string[] {
  if (typeof window === 'undefined') return [];
  
  const userIds = new Set<string>();
  const allKeys = Object.keys(localStorage);
  
  allKeys.forEach(key => {
    const parts = key.split('-');
    if (parts.length >= 3) {
      const potentialUserId = parts[parts.length - 1];
      if (potentialUserId !== 'anonymous') {
        userIds.add(potentialUserId);
      }
    }
  });
  
  return Array.from(userIds);
}

/**
 * Clears old anonymous data (from before user logged in)
 */
export function clearAnonymousData(): void {
  if (typeof window === 'undefined') return;
  
  const allKeys = Object.keys(localStorage);
  const anonymousKeys = allKeys.filter(key => key.endsWith('-anonymous'));
  
  anonymousKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove anonymous key ${key}:`, error);
    }
  });
  
  if (anonymousKeys.length > 0) {
    console.log(`✅ Cleared ${anonymousKeys.length} anonymous storage keys`);
  }
}

/**
 * Gets storage usage statistics for the current user
 * @returns Object with storage statistics
 */
export function getUserStorageStats() {
  if (typeof window === 'undefined') {
    return { keys: 0, bytes: 0, megabytes: 0 };
  }
  
  const userId = getCurrentUserId();
  const userKeys = getUserStorageKeys(userId);
  
  let totalBytes = 0;
  userKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      totalBytes += value.length * 2;
    }
  });
  
  return {
    keys: userKeys.length,
    bytes: totalBytes,
    kilobytes: (totalBytes / 1024).toFixed(2),
    megabytes: (totalBytes / (1024 * 1024)).toFixed(2),
  };
}

/**
 * Manually save current chart to backend (called when Save button is clicked)
 * @returns Promise<boolean> - true if saved successfully, false otherwise
 */
export async function saveChartToBackend(): Promise<boolean> {
  try {
    const { dataService } = await import('./data-service');
    const { authApi } = await import('@/lib/auth-client');
    
    // Check if user is authenticated
    const authCheck = await authApi.me();
    if (!authCheck.user) {
      console.log('User not authenticated, cannot save to backend');
      return false;
    }
    
    // Get current chart data from localStorage
    const chartData = getUserStorageValue('chart-store-with-sync', null);
    if (!chartData || !chartData.state) {
      console.log('No chart data to save');
      return false;
    }
    
    const { chartType, chartData: chartDataValue, chartConfig } = chartData.state;
    
    // Create conversation
    const conversationResponse = await dataService.createConversation(
      'Saved Chart',
      'Manually saved chart'
    );
    
    if (conversationResponse.error) {
      console.error('Failed to create conversation:', conversationResponse.error);
      return false;
    }
    
    const conversationId = conversationResponse.data.id;
    
    // Normalize chartConfig before saving: convert dynamicDimension to manualDimensions
    const normalizedConfig = (() => {
      const config = { ...chartConfig };
      
      // If dynamicDimension is active, convert it to manualDimensions
      if (config.dynamicDimension === true) {
        config.manualDimensions = true;
        config.responsive = false;
        delete config.dynamicDimension; // Remove the dynamicDimension flag
        
        // Ensure width and height are preserved
        if (!config.width) config.width = '800px';
        if (!config.height) config.height = '600px';
        
        console.log('📊 Converted dynamicDimension to manualDimensions for storage');
      } else {
        // Clean up - ensure only responsive OR manualDimensions is set
        delete config.dynamicDimension;
        
        if (config.responsive === true) {
          config.manualDimensions = false;
        } else if (config.manualDimensions === true) {
          config.responsive = false;
        }
      }
      
      return config;
    })();

    // Save chart snapshot
    const snapshotResult = await dataService.saveChartSnapshot(
      conversationId,
      chartType,
      chartDataValue,
      normalizedConfig
    );
    
    if (snapshotResult.error) {
      console.error('Failed to save chart snapshot:', snapshotResult.error);
      return false;
    }
    
    console.log('✅ Chart saved to backend successfully');
    return true;
    
  } catch (error) {
    console.error('Error saving chart to backend:', error);
    return false;
  }
}

/**
 * Clear current chart data (called when Cancel button is clicked)
 */
export function clearCurrentChart(): void {
  if (typeof window === 'undefined') return;
  
  const userId = getCurrentUserId();
  const chartKeys = [
    'chart-store-with-sync',
    'chart-store',
    'chat-store',
    'enhanced-chat-store',
  ];
  
  chartKeys.forEach(name => {
    const key = `${name}-${userId}`;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove ${key}:`, error);
    }
  });
  
  console.log('✅ Current chart cleared from localStorage');
}

