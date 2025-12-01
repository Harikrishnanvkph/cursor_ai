"use client"

import { useEffect, useCallback } from 'react'
import { initializeStorageWithExpiry, updateLastActivity } from '@/lib/storage-utils'

/**
 * StorageCleanup Component
 * 
 * This component handles localStorage data management:
 * 
 * EXPIRY LOGIC:
 * Data is cleared when BOTH conditions are met:
 * 1. Data is older than 12 hours (from creation)
 * 2. AND user is inactive OR logged out
 * 
 * This means:
 * - If data is < 12 hours old → always kept
 * - If data is >= 12 hours old AND user is actively using → kept
 * - If data is >= 12 hours old AND user is logged out/inactive → cleared
 * 
 * Clearable data (after 12h + inactive/logout):
 * - chart-store, chart-store-with-sync (current chart data)
 * - chat-store, enhanced-chat-store (chat messages)
 * - chat-history (conversation history)
 * - offline-conversations, offline-chart-data (offline cache)
 * - undo-store (undo/redo history)
 * - template-store (user templates)
 * 
 * Permanent data (NEVER expires):
 * - theme, language, cookies-accepted, user-id (preferences)
 */
export function StorageCleanup() {
  // Track user activity
  const handleActivity = useCallback(() => {
    updateLastActivity()
  }, [])

  useEffect(() => {
    // Run storage initialization on mount
    try {
      initializeStorageWithExpiry()
    } catch (error) {
      console.warn('Storage initialization failed:', error)
    }

    // Track user activity to prevent clearing data while user is active
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart']
    
    // Debounce activity updates (max once per 30 seconds)
    let lastUpdate = 0
    const debouncedActivity = () => {
      const now = Date.now()
      if (now - lastUpdate > 30000) { // 30 seconds
        lastUpdate = now
        handleActivity()
      }
    }

    activityEvents.forEach(event => {
      window.addEventListener(event, debouncedActivity, { passive: true })
    })

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, debouncedActivity)
      })
    }
  }, [handleActivity])

  // This component doesn't render anything
  return null
}

export default StorageCleanup

