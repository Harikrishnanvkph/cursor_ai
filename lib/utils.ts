import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely sets a nested property in an object immutably.
 * It deeply clones only the path of objects that are being modified,
 * leaving other branches untouched but avoiding mutation of the original.
 */
export function setNestedProperty<T extends Record<string, any>>(
  obj: T,
  path: string,
  value: any
): T {
  if (!obj) obj = {} as T;
  const keys = path.split('.');
  const newObj = { ...obj };

  let current: any = newObj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    // If the next object doesn't exist or isn't an object, create it
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    } else {
      // Shallow clone the next level so we don't mutate the original reference
      current[key] = { ...current[key] };
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return newObj;
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

export function getPatternCSS(patternType: string, color: string, scale: number = 1): React.CSSProperties & { styleString: string } {
  const size = 20 * scale;
  let bgImage = '';
  let bgSize = '';
  let bgRepeat = 'repeat';
  
  switch (patternType) {
    case 'lines':
      // Horizontal lines using repeating-linear-gradient for bulletproof rendering
      bgImage = `repeating-linear-gradient(to bottom, ${color} 0px, ${color} 1px, transparent 1px, transparent ${size}px)`;
      bgSize = '100% 100%';
      break;
    case 'grid':
      // Standard graph paper grid
      bgImage = `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`;
      bgSize = `${size}px ${size}px`;
      break;
    case 'mesh':
      // Diagonal grid requires repeating-linear-gradients to wrap properly without artifacts
      bgImage = `repeating-linear-gradient(45deg, ${color} 0px, ${color} 1px, transparent 1px, transparent ${size}px), repeating-linear-gradient(-45deg, ${color} 0px, ${color} 1px, transparent 1px, transparent ${size}px)`;
      bgSize = '100% 100%';
      break;
    case 'dots':
    default:
      // Circular dots
      bgImage = `radial-gradient(circle, ${color} 1px, transparent 1px)`;
      bgSize = `${size}px ${size}px`;
      break;
  }

  return {
    backgroundImage: bgImage,
    backgroundSize: bgSize,
    backgroundRepeat: bgRepeat,
    styleString: `background-image: ${bgImage}; background-size: ${bgSize}; background-repeat: ${bgRepeat};`
  };
}
