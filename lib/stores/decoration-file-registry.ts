/**
 * Memory-only file registry mapping browser blob URLs to raw File objects.
 * This registry is used during active editing sessions and is cleared on save
 * or when navigating away/unmounting the editor.
 */
export const decorationFileRegistry = new Map<string, File>();

/**
 * Revokes all active blob URLs in the registry and clears all mappings.
 */
export function cleanupDecorationFiles() {
  if (typeof window === 'undefined') return;
  
  decorationFileRegistry.forEach((_, url) => {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to revoke blob URL:', e);
    }
  });
  decorationFileRegistry.clear();
}
