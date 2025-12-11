/**
 * Storage Utilities for User-Specific localStorage
 * 
 * Provides helper functions to ensure localStorage keys are user-specific,
 * preventing data contamination between different user accounts.
 * 
 * EXPIRY LOGIC:
 * Data is cleared when BOTH conditions are met:
 * 1. Data is older than 12 hours (from creation/last update)
 * 2. AND user is logged out OR inactive
 * 
 * This means:
 * - If data is < 12 hours old → always keep it
 * - If data is >= 12 hours old AND user is actively using → keep it
 * - If data is >= 12 hours old AND user is logged out/inactive → clear it
 */

// =============================================
// EXPIRY CONFIGURATION
// =============================================

/**
 * Data age threshold (12 hours in milliseconds)
 * Data older than this MAY be cleared (if user is also inactive)
 */
export const DATA_AGE_THRESHOLD_MS = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Activity threshold - consider user inactive if no activity for this long
 * (5 minutes of no interaction = inactive)
 */
export const ACTIVITY_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Stores that can be cleared (when old + user inactive/logged out)
 */
const CLEARABLE_STORES = [
  'chart-store-with-sync',
  'chart-store',
  'chat-store',
  'enhanced-chat-store',
  'chat-history',
  'offline-conversations',
  'offline-chart-data',
  'undo-store',
  'template-store',
];

/**
 * Simple keys that should NEVER expire (user preferences)
 */
const PERMANENT_KEYS = [
  'theme',
  'language',
  'cookies-accepted',
  'user-id',
];

/**
 * Key for storing last activity timestamp
 */
const LAST_ACTIVITY_KEY = 'last-activity-timestamp';

/**
 * Key for storing data creation timestamps
 */
const STORAGE_TIMESTAMPS_KEY = 'storage-timestamps';

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
    const chartData = getUserStorageValue<{ state?: { chartType?: string; chartData?: unknown; chartConfig?: Record<string, unknown> } } | null>('chart-store-with-sync', null);
    if (!chartData || !chartData.state) {
      console.log('No chart data to save');
      return false;
    }

    const { chartType, chartData: chartDataValue, chartConfig } = chartData.state;

    if (!chartType) {
      console.log('No chart type found');
      return false;
    }

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
    'template-store', // Also clear template data to prevent cascading to new charts
  ];

  chartKeys.forEach(name => {
    const key = `${name}-${userId}`;
    try {
      localStorage.removeItem(key);
      // Also remove the timestamp for this key
      removeStorageTimestamp(key);
    } catch (error) {
      console.warn(`Failed to remove ${key}:`, error);
    }
  });

  console.log('✅ Current chart cleared from localStorage');
}
// =============================================
// ACTIVITY TRACKING
// =============================================

/**
 * Updates the last activity timestamp (call this on user interactions)
 */
export function updateLastActivity(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  } catch (error) {
    console.warn('Failed to update last activity:', error);
  }
}

/**
 * Gets the last activity timestamp
 */
export function getLastActivity(): number {
  if (typeof window === 'undefined') return Date.now();

  try {
    const timestamp = localStorage.getItem(LAST_ACTIVITY_KEY);
    return timestamp ? parseInt(timestamp, 10) : Date.now();
  } catch {
    return Date.now();
  }
}

/**
 * Checks if user is currently active (had activity within threshold)
 */
export function isUserActive(): boolean {
  const lastActivity = getLastActivity();
  const timeSinceActivity = Date.now() - lastActivity;
  return timeSinceActivity < ACTIVITY_THRESHOLD_MS;
}

// =============================================
// STORAGE TIMESTAMP SYSTEM
// =============================================

/**
 * Interface for storage timestamps (tracks when data was created/updated)
 */
interface StorageTimestamps {
  [key: string]: number; // key -> timestamp when created/last updated
}

/**
 * Gets the storage timestamps object
 */
function getStorageTimestamps(): StorageTimestamps {
  if (typeof window === 'undefined') return {};

  try {
    const data = localStorage.getItem(STORAGE_TIMESTAMPS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Saves the storage timestamps object
 */
function saveStorageTimestamps(timestamps: StorageTimestamps): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_TIMESTAMPS_KEY, JSON.stringify(timestamps));
  } catch (error) {
    console.warn('Failed to save storage timestamps:', error);
  }
}

/**
 * Updates the timestamp for a storage key (call this when data is saved)
 */
export function updateStorageTimestamp(key: string): void {
  if (typeof window === 'undefined') return;

  const timestamps = getStorageTimestamps();
  timestamps[key] = Date.now();
  saveStorageTimestamps(timestamps);

  // Also update activity timestamp (user is actively using the app)
  updateLastActivity();
}

/**
 * Removes the timestamp for a storage key
 */
export function removeStorageTimestamp(key: string): void {
  if (typeof window === 'undefined') return;

  const timestamps = getStorageTimestamps();
  delete timestamps[key];
  saveStorageTimestamps(timestamps);
}

/**
 * Gets the age of a storage key in milliseconds
 * @returns Age in ms, or Infinity if no timestamp found
 */
export function getStorageAge(key: string): number {
  const timestamps = getStorageTimestamps();
  const timestamp = timestamps[key];

  if (!timestamp) {
    return Infinity; // No timestamp means it's old/unknown
  }

  return Date.now() - timestamp;
}

/**
 * Checks if a storage key should be cleared
 * BOTH conditions must be true:
 * 1. Data is older than 12 hours
 * 2. User is inactive OR logged out
 */
export function shouldClearStorage(key: string, isLogout: boolean = false): boolean {
  // Never clear permanent keys
  if (PERMANENT_KEYS.includes(key) || key === STORAGE_TIMESTAMPS_KEY || key === LAST_ACTIVITY_KEY) {
    return false;
  }

  // Check if this is a clearable store
  const isClearableStore = CLEARABLE_STORES.some(store => key.includes(store));
  if (!isClearableStore) {
    return false;
  }

  // Check condition 1: Data is older than 12 hours
  const age = getStorageAge(key);
  const isDataOld = age > DATA_AGE_THRESHOLD_MS;

  if (!isDataOld) {
    return false; // Data is fresh, don't clear it
  }

  // Check condition 2: User is inactive OR logging out
  if (isLogout) {
    return true; // User is logging out and data is old, clear it
  }

  // User is not logging out, check if they're inactive
  return !isUserActive();
}

/**
 * Cleans up old localStorage data
 * Only clears data that is BOTH:
 * 1. Older than 12 hours
 * 2. AND user is inactive or logging out
 * 
 * @param isLogout - True if this is being called during logout
 * @returns Object with cleanup statistics
 */
export function cleanupOldStorage(isLogout: boolean = false): {
  checkedCount: number;
  clearedCount: number;
  clearedKeys: string[];
  keptKeys: string[];
  reason: string;
} {
  if (typeof window === 'undefined') {
    return { checkedCount: 0, clearedCount: 0, clearedKeys: [], keptKeys: [], reason: 'SSR' };
  }

  const allKeys = Object.keys(localStorage);
  const timestamps = getStorageTimestamps();
  const clearedKeys: string[] = [];
  const keptKeys: string[] = [];
  let checkedCount = 0;

  const userActive = isUserActive();
  const reason = isLogout
    ? 'User logout'
    : (userActive ? 'User is active - keeping all data' : 'User inactive');

  // If user is active and not logging out, don't clear anything
  if (userActive && !isLogout) {
    console.log('👤 User is active - skipping storage cleanup');
    return {
      checkedCount: 0,
      clearedCount: 0,
      clearedKeys: [],
      keptKeys: allKeys,
      reason
    };
  }

  allKeys.forEach(key => {
    // Skip system keys
    if (PERMANENT_KEYS.includes(key) || key === STORAGE_TIMESTAMPS_KEY || key === LAST_ACTIVITY_KEY) {
      return;
    }

    // Check if this is a clearable store
    const isClearableStore = CLEARABLE_STORES.some(store => key.includes(store));
    if (!isClearableStore) {
      return; // Unknown store - keep it
    }

    checkedCount++;

    // Check if data is old enough to clear
    const timestamp = timestamps[key];
    const age = timestamp ? (Date.now() - timestamp) : Infinity;
    const isDataOld = age > DATA_AGE_THRESHOLD_MS;

    if (isDataOld) {
      try {
        localStorage.removeItem(key);
        delete timestamps[key];
        clearedKeys.push(key);
        const ageHours = Math.round(age / 1000 / 60 / 60 * 10) / 10;
        console.log(`🗑️ Cleared old storage: ${key} (age: ${ageHours} hours, reason: ${reason})`);
      } catch (error) {
        console.warn(`Failed to clear key ${key}:`, error);
      }
    } else {
      keptKeys.push(key);
    }
  });

  // Save updated timestamps
  saveStorageTimestamps(timestamps);

  if (clearedKeys.length > 0) {
    console.log(`✅ Storage cleanup complete: cleared ${clearedKeys.length}/${checkedCount} old keys (${reason})`);
  }

  return {
    checkedCount,
    clearedCount: clearedKeys.length,
    clearedKeys,
    keptKeys,
    reason
  };
}

/**
 * Call this on logout to clear old data
 */
export function cleanupOnLogout(): void {
  console.log('🚪 User logging out - checking for old data to clear...');
  cleanupOldStorage(true); // Pass true to indicate logout
}

/**
 * Initializes storage timestamps for existing data
 * Call this once to add timestamps to existing data that doesn't have them
 */
export function initializeStorageTimestamps(): void {
  if (typeof window === 'undefined') return;

  const allKeys = Object.keys(localStorage);
  const timestamps = getStorageTimestamps();
  let addedCount = 0;

  allKeys.forEach(key => {
    // Skip system keys
    if (PERMANENT_KEYS.includes(key) || key === STORAGE_TIMESTAMPS_KEY || key === LAST_ACTIVITY_KEY) {
      return;
    }

    // Check if this is a clearable store and doesn't have a timestamp
    const isClearableStore = CLEARABLE_STORES.some(store => key.includes(store));
    if (isClearableStore && !timestamps[key]) {
      // Initialize with current time (gives it a fresh 12 hours)
      timestamps[key] = Date.now();
      addedCount++;
    }
  });

  if (addedCount > 0) {
    saveStorageTimestamps(timestamps);
    console.log(`📝 Initialized timestamps for ${addedCount} existing storage keys`);
  }
}

/**
 * Full storage initialization and conditional cleanup
 * Call this on app startup
 */
export function initializeStorageWithExpiry(): void {
  if (typeof window === 'undefined') return;

  console.log('🔄 Initializing storage with expiry system...');

  // Update activity (user is opening the app)
  updateLastActivity();

  // Initialize timestamps for any existing data without timestamps
  initializeStorageTimestamps();

  // Try to clean up old data (will only work if user was inactive)
  const result = cleanupOldStorage(false);

  if (result.clearedCount > 0) {
    console.log(`🧹 Cleaned up ${result.clearedCount} old storage items`);
  } else if (result.reason.includes('active')) {
    console.log('✅ User is active - all data preserved');
  } else {
    console.log('✅ No old storage items to clear');
  }
}

/**
 * Creates a storage wrapper that automatically updates timestamps
 * Use this with Zustand persist for automatic timestamp tracking
 */
export function createExpiringStorage(baseName: string) {
  return {
    getItem: (name: string) => {
      const key = getUserStorageKey(baseName);
      return localStorage.getItem(key);
    },
    setItem: (name: string, value: string) => {
      const key = getUserStorageKey(baseName);
      localStorage.setItem(key, value);
      // Update timestamp when data is saved (also updates activity)
      updateStorageTimestamp(key);
    },
    removeItem: (name: string) => {
      const key = getUserStorageKey(baseName);
      localStorage.removeItem(key);
      removeStorageTimestamp(key);
    },
  };
}

/**
 * Gets remaining time before storage can be cleared
 * Note: Data will only be cleared if BOTH conditions met:
 * 1. Data is older than this remaining time
 * 2. AND user is inactive/logged out
 * 
 * @returns Remaining time until data becomes "clearable" (but won't be cleared if user is active)
 */
export function getStorageRemainingTime(key: string): number {
  // Check if permanent
  if (PERMANENT_KEYS.includes(key) || key === STORAGE_TIMESTAMPS_KEY || key === LAST_ACTIVITY_KEY) {
    return Infinity;
  }

  const isClearableStore = CLEARABLE_STORES.some(store => key.includes(store));
  if (!isClearableStore) {
    return Infinity;
  }

  const age = getStorageAge(key);
  const remaining = DATA_AGE_THRESHOLD_MS - age;
  return remaining > 0 ? remaining : 0;
}

/**
 * Gets storage expiry info for debugging/display
 */
export function getStorageExpiryInfo(): Array<{
  key: string;
  age: string;
  status: string;
  isPermanent: boolean;
  canBeClearedNow: boolean;
}> {
  if (typeof window === 'undefined') return [];

  const allKeys = Object.keys(localStorage);
  const userActive = isUserActive();
  const info: Array<{
    key: string;
    age: string;
    status: string;
    isPermanent: boolean;
    canBeClearedNow: boolean;
  }> = [];

  allKeys.forEach(key => {
    if (key === STORAGE_TIMESTAMPS_KEY || key === LAST_ACTIVITY_KEY) return;

    const isPermanent = PERMANENT_KEYS.includes(key);
    const isClearable = CLEARABLE_STORES.some(store => key.includes(store));

    if (!isPermanent && !isClearable) return; // Skip unknown keys

    const age = getStorageAge(key);
    const remaining = getStorageRemainingTime(key);
    const isDataOld = age > DATA_AGE_THRESHOLD_MS;
    const canBeClearedNow = !isPermanent && isDataOld && !userActive;

    const formatTime = (ms: number) => {
      if (ms === Infinity) return 'Never';
      if (ms <= 0) return '0m';
      const hours = Math.floor(ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    let status: string;
    if (isPermanent) {
      status = 'Permanent';
    } else if (!isDataOld) {
      status = `Fresh (${formatTime(remaining)} until clearable)`;
    } else if (userActive) {
      status = 'Old but protected (user active)';
    } else {
      status = 'Can be cleared (old + user inactive)';
    }

    info.push({
      key,
      age: formatTime(age),
      status,
      isPermanent,
      canBeClearedNow
    });
  });

  return info;
}


