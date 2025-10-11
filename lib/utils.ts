import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to clear localStorage for stores
export function clearStoreData() {
  if (typeof window !== 'undefined') {
    const userId = localStorage.getItem('user-id') || 'anonymous';
    const storeNames = [
      'enhanced-chat',
      'chat-history',
      'chart-store',
      'chart-store-with-sync',
      'chat-store',
      'enhanced-chat-store',
      'template-store',
      'undo-store',
      'offline-conversations',
      'offline-chart-data',
    ];
    
    storeNames.forEach(name => {
      // Remove user-specific key
      localStorage.removeItem(`${name}-${userId}`);
      // Also remove old global key if it exists
      localStorage.removeItem(name);
    });
    
    console.log('Store data cleared from localStorage');
  }
}
