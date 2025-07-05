import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to clear localStorage for stores
export function clearStoreData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('enhanced-chat')
    localStorage.removeItem('chat-history')
    localStorage.removeItem('chart-store')
    console.log('Store data cleared from localStorage')
  }
}
