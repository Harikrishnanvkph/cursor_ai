/**
 * Migration Utilities for localStorage
 * 
 * Handles migration from global localStorage keys to user-specific keys
 */

import { getUserStorageKey } from './storage-utils';

interface MigrationResult {
  success: boolean;
  migratedKeys: string[];
  removedKeys: string[];
  errors: string[];
}

/**
 * Migrates data from global localStorage keys to user-specific keys
 * @param userId - The user ID to migrate data for
 * @returns Migration result with details
 */
export function migrateGlobalToUserSpecificStorage(userId: string): MigrationResult {
  const result: MigrationResult = {
    success: true,
    migratedKeys: [],
    removedKeys: [],
    errors: [],
  };

  if (typeof window === 'undefined') {
    result.success = false;
    result.errors.push('Cannot migrate in SSR context');
    return result;
  }

  if (!userId || userId === 'anonymous') {
    result.success = false;
    result.errors.push('Invalid user ID for migration');
    return result;
  }

  // Check if migration was already done for this user
  const migrationKey = `migration-completed-${userId}`;
  if (localStorage.getItem(migrationKey) === 'true') {
    console.log(`ℹ️ Migration already completed for user: ${userId}`);
    return result;
  }

  const globalKeys = [
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

  console.log(`🔄 Starting migration for user: ${userId}`);

  globalKeys.forEach(globalKey => {
    try {
      const data = localStorage.getItem(globalKey);
      
      if (data && data !== 'null' && data !== 'undefined') {
        const userKey = getUserStorageKey(globalKey);
        
        // Only migrate if user-specific key doesn't already exist
        const existingUserData = localStorage.getItem(userKey);
        
        if (!existingUserData || existingUserData === 'null') {
          // Migrate data to user-specific key
          localStorage.setItem(userKey, data);
          result.migratedKeys.push(globalKey);
          console.log(`✅ Migrated: ${globalKey} → ${userKey}`);
        } else {
          console.log(`ℹ️ Skipped (already exists): ${userKey}`);
        }
        
        // Remove global key after successful migration
        localStorage.removeItem(globalKey);
        result.removedKeys.push(globalKey);
      }
    } catch (error) {
      const errorMsg = `Failed to migrate ${globalKey}: ${error}`;
      result.errors.push(errorMsg);
      console.error(errorMsg);
      result.success = false;
    }
  });

  // Mark migration as completed for this user
  if (result.success) {
    localStorage.setItem(migrationKey, 'true');
    console.log(`✅ Migration completed for user: ${userId}`);
    console.log(`   Migrated: ${result.migratedKeys.length} keys`);
    console.log(`   Removed: ${result.removedKeys.length} keys`);
  } else {
    console.error(`❌ Migration failed for user: ${userId}`);
    console.error(`   Errors: ${result.errors.length}`);
  }

  return result;
}

/**
 * Checks if there are global keys that need migration
 * @returns True if migration is needed
 */
export function needsMigration(): boolean {
  if (typeof window === 'undefined') return false;

  const globalKeys = [
    'chart-store-with-sync',
    'chart-store',
    'chat-store',
    'enhanced-chat-store',
    'template-store',
    'undo-store',
  ];

  return globalKeys.some(key => {
    const value = localStorage.getItem(key);
    return value && value !== 'null' && value !== 'undefined';
  });
}

/**
 * Gets preview of what will be migrated
 * @returns Object with migration preview
 */
export function getMigrationPreview(): {
  hasData: boolean;
  globalKeysFound: string[];
  estimatedSize: number;
} {
  if (typeof window === 'undefined') {
    return { hasData: false, globalKeysFound: [], estimatedSize: 0 };
  }

  const globalKeys = [
    'chart-store-with-sync',
    'chart-store',
    'chat-store',
    'enhanced-chat-store',
    'template-store',
    'undo-store',
    'chat-history',
  ];

  const found: string[] = [];
  let totalSize = 0;

  globalKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value && value !== 'null') {
      found.push(key);
      totalSize += value.length * 2; // UTF-16 = 2 bytes per char
    }
  });

  return {
    hasData: found.length > 0,
    globalKeysFound: found,
    estimatedSize: totalSize,
  };
}

/**
 * Cleans up old global keys (for users who already migrated)
 */
export function cleanupOldGlobalKeys(): void {
  if (typeof window === 'undefined') return;

  const globalKeys = [
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

  let removedCount = 0;

  globalKeys.forEach(key => {
    try {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        removedCount++;
      }
    } catch (error) {
      console.warn(`Failed to remove global key ${key}:`, error);
    }
  });

  if (removedCount > 0) {
    console.log(`✅ Cleaned up ${removedCount} old global keys`);
  }
}

/**
 * Resets migration status for a user (for testing purposes)
 * @param userId - The user ID to reset migration status for
 */
export function resetMigrationStatus(userId: string): void {
  if (typeof window === 'undefined') return;
  
  const migrationKey = `migration-completed-${userId}`;
  localStorage.removeItem(migrationKey);
  console.log(`🔄 Reset migration status for user: ${userId}`);
}

/**
 * Forces a complete re-migration (for debugging)
 * @param userId - The user ID to re-migrate
 */
export function forceMigration(userId: string): MigrationResult {
  if (typeof window === 'undefined') {
    return {
      success: false,
      migratedKeys: [],
      removedKeys: [],
      errors: ['Cannot migrate in SSR context'],
    };
  }

  // Reset migration status
  resetMigrationStatus(userId);
  
  // Run migration
  return migrateGlobalToUserSpecificStorage(userId);
}

/**
 * Backs up user data before migration (optional safety measure)
 * @param userId - The user ID to backup data for
 * @returns JSON string of backed up data
 */
export function backupUserData(userId: string): string | null {
  if (typeof window === 'undefined') return null;

  const globalKeys = [
    'chart-store-with-sync',
    'chart-store',
    'chat-store',
    'enhanced-chat-store',
    'template-store',
    'undo-store',
    'chat-history',
  ];

  const backup: Record<string, any> = {
    userId,
    timestamp: new Date().toISOString(),
    data: {},
  };

  globalKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value && value !== 'null') {
      try {
        backup.data[key] = JSON.parse(value);
      } catch {
        backup.data[key] = value; // Store as-is if not JSON
      }
    }
  });

  return JSON.stringify(backup, null, 2);
}

/**
 * Restores user data from backup (for rollback scenarios)
 * @param backupJson - The backup JSON string
 * @returns True if restore was successful
 */
export function restoreFromBackup(backupJson: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const backup = JSON.parse(backupJson);
    
    if (!backup.userId || !backup.data) {
      console.error('Invalid backup format');
      return false;
    }

    Object.entries(backup.data).forEach(([key, value]) => {
      try {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, stringValue);
      } catch (error) {
        console.error(`Failed to restore ${key}:`, error);
      }
    });

    console.log(`✅ Restored data from backup for user: ${backup.userId}`);
    return true;
  } catch (error) {
    console.error('Failed to restore from backup:', error);
    return false;
  }
}

/**
 * Auto-migration hook that can be called on app initialization
 * @param userId - Current user ID
 * @returns Promise that resolves when migration is complete
 */
export async function autoMigrate(userId: string | null): Promise<void> {
  if (!userId || userId === 'anonymous') return;

  // Check if migration is needed
  if (!needsMigration()) {
    console.log('ℹ️ No migration needed');
    return;
  }

  // Optional: Create backup before migration
  const backup = backupUserData(userId);
  if (backup) {
    console.log('📦 Backup created (stored in memory for rollback)');
    // You could optionally save this to IndexedDB or download it
  }

  // Run migration
  const result = migrateGlobalToUserSpecificStorage(userId);

  if (!result.success) {
    console.error('❌ Auto-migration failed:', result.errors);
    
    // Optional: Restore from backup if migration failed
    if (backup) {
      console.log('🔄 Rolling back to backup...');
      restoreFromBackup(backup);
    }
  } else {
    console.log('✅ Auto-migration completed successfully');
  }
}

