/**
 * Image Utilities for Compression and Storage
 * Helps prevent localStorage quota exceeded errors by compressing images
 */

/**
 * Gets the current localStorage usage in bytes
 * @returns number - Current usage in bytes
 */
export function getLocalStorageUsage(): number {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          total += new Blob([value]).size;
        }
      } catch (e) {
        // Ignore errors for specific keys
      }
    }
  }
  return total;
}

/**
 * Gets the estimated localStorage quota
 * @returns number - Estimated quota in bytes (default 5MB, but can be up to 10MB)
 */
export function getLocalStorageQuota(): number {
  // Most browsers allow 5-10MB per origin
  // We'll use a conservative 4.5MB to leave buffer
  return 4.5 * 1024 * 1024;
}

/**
 * Gets available localStorage space
 * @returns number - Available space in bytes
 */
export function getAvailableLocalStorageSpace(): number {
  const used = getLocalStorageUsage();
  const quota = getLocalStorageQuota();
  return Math.max(0, quota - used);
}

/**
 * Compresses an image file to reduce its size
 * Uses progressive compression - tries lower quality if needed for quota
 * @param file - The image file to compress
 * @param maxWidth - Maximum width (default: 600, reduced for better compression)
 * @param maxHeight - Maximum height (default: 600, reduced for better compression)
 * @param quality - JPEG quality 0-1 (default: 0.7, reduced for better compression)
 * @param progressive - If true, will try lower quality if quota is low
 * @returns Promise<string> - Compressed image as base64 data URL
 */
export async function compressImage(
  file: File,
  maxWidth: number = 600,
  maxHeight: number = 600,
  quality: number = 0.7,
  progressive: boolean = true
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    // Always compress images to reduce storage size
    // Even small files should be compressed to prevent quota issues
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        // Determine compression parameters based on available space
        let finalQuality = quality;
        let finalMaxWidth = maxWidth;
        let finalMaxHeight = maxHeight;

        if (progressive) {
          const availableSpace = getAvailableLocalStorageSpace();
          const estimatedSize = estimateBase64Size(e.target?.result as string || '');
          
          // If we're running low on space, compress more aggressively
          if (availableSpace < 1 * 1024 * 1024) { // Less than 1MB available
            finalQuality = 0.5;
            finalMaxWidth = 400;
            finalMaxHeight = 400;
          } else if (availableSpace < 2 * 1024 * 1024) { // Less than 2MB available
            finalQuality = 0.6;
            finalMaxWidth = 500;
            finalMaxHeight = 500;
          } else if (estimatedSize > availableSpace * 0.5) {
            // If estimated size is more than 50% of available space, compress more
            finalQuality = 0.6;
            finalMaxWidth = 500;
            finalMaxHeight = 500;
          }
        }

        if (width > finalMaxWidth || height > finalMaxHeight) {
          const ratio = Math.min(finalMaxWidth / width, finalMaxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        // Create canvas and draw compressed image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        // Always convert PNG to JPEG for better compression
        const outputType = 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Convert blob back to data URL
            const reader2 = new FileReader();
            reader2.onload = (e2) => {
              if (e2.target?.result) {
                const compressedDataUrl = e2.target.result as string;
                
                // Check if compressed image would fit
                const compressedSize = estimateBase64Size(compressedDataUrl);
                const availableSpace = getAvailableLocalStorageSpace();
                
                // If still too large, try even more aggressive compression
                if (compressedSize > availableSpace * 0.8 && progressive) {
                  // Try with even lower quality
                  const canvas2 = document.createElement('canvas');
                  canvas2.width = Math.max(300, width * 0.8);
                  canvas2.height = Math.max(300, height * 0.8);
                  const ctx2 = canvas2.getContext('2d');
                  
                  if (ctx2) {
                    ctx2.drawImage(img, 0, 0, canvas2.width, canvas2.height);
                    canvas2.toBlob(
                      (blob2) => {
                        if (!blob2) {
                          resolve(compressedDataUrl); // Fallback to previous compression
                          return;
                        }
                        const reader3 = new FileReader();
                        reader3.onload = (e3) => {
                          if (e3.target?.result) {
                            resolve(e3.target.result as string);
                          } else {
                            resolve(compressedDataUrl);
                          }
                        };
                        reader3.onerror = () => resolve(compressedDataUrl);
                        reader3.readAsDataURL(blob2);
                      },
                      outputType,
                      0.4 // Very aggressive compression
                    );
                  } else {
                    resolve(compressedDataUrl);
                  }
                } else {
                  resolve(compressedDataUrl);
                }
              } else {
                reject(new Error('Failed to convert compressed image'));
              }
            };
            reader2.onerror = () => reject(new Error('Failed to convert compressed image'));
            reader2.readAsDataURL(blob);
          },
          outputType,
          finalQuality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Validates image file size and type
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB (default: 10)
 * @returns boolean - True if file is valid
 */
export function validateImageFile(file: File, maxSizeMB: number = 10): boolean {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return false;
  }

  // Check file size (10MB default)
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return false;
  }

  return true;
}

/**
 * Estimates the size of a base64 string in bytes
 * @param base64String - The base64 string
 * @returns number - Size in bytes
 */
export function estimateBase64Size(base64String: string): number {
  // Remove data URL prefix if present
  const base64 = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;
  
  // Base64 encoding uses 4 characters per 3 bytes
  // Plus overhead for padding
  return (base64.length * 3) / 4;
}

/**
 * Checks if storing the image would exceed localStorage quota
 * @param base64String - The base64 image string
 * @returns boolean - True if storing would exceed quota
 */
export function wouldExceedQuota(base64String: string): boolean {
  const imageSize = estimateBase64Size(base64String);
  const availableSpace = getAvailableLocalStorageSpace();
  
  // Leave 200KB buffer for other data and operations
  return imageSize > (availableSpace - 200 * 1024);
}

/**
 * Gets indices of images to remove for cleanup (oldest images first)
 * @param dataset - The dataset object
 * @param maxImagesToKeep - Maximum number of images to keep (default: 5)
 * @returns Array of point indices to clean up
 */
export function getImagesToCleanup(dataset: any, maxImagesToKeep: number = 5): number[] {
  if (!dataset.pointImages || dataset.pointImages.length === 0) {
    return [];
  }

  // Get indices of all images (non-null)
  const imageIndices = dataset.pointImages
    .map((img: string | null, idx: number) => img ? idx : null)
    .filter((idx: number | null) => idx !== null) as number[];

  // If we have more images than max, return the oldest ones to remove
  if (imageIndices.length > maxImagesToKeep) {
    return imageIndices.slice(0, imageIndices.length - maxImagesToKeep);
  }

  return [];
}

/**
 * Estimates how much space would be freed by cleaning up images
 * @param chartData - The chart data object
 * @param maxImagesToKeep - Maximum number of images to keep per dataset
 * @returns Estimated bytes that would be freed
 */
export function estimateCleanupSpace(chartData: any, maxImagesToKeep: number = 5): number {
  if (!chartData || !chartData.datasets) {
    return 0;
  }

  let totalFreed = 0;
  chartData.datasets.forEach((dataset: any) => {
    const indicesToRemove = getImagesToCleanup(dataset, maxImagesToKeep);
    indicesToRemove.forEach((idx: number) => {
      const imageUrl = dataset.pointImages?.[idx];
      if (imageUrl) {
        totalFreed += estimateBase64Size(imageUrl);
      }
    });
  });

  return totalFreed;
}

/**
 * Determines if cleanup is needed and returns cleanup parameters
 * @param chartData - The chart data object
 * @param targetFreeSpace - Target free space in bytes
 * @returns Object with cleanup info: { needed: boolean, maxImagesToKeep: number }
 */
export function shouldCleanupImages(
  chartData: any,
  targetFreeSpace: number = 1 * 1024 * 1024
): { needed: boolean; maxImagesToKeep: number } {
  const availableSpace = getAvailableLocalStorageSpace();
  
  if (availableSpace < targetFreeSpace) {
    // Try keeping 3 images per dataset
    const spaceFreed3 = estimateCleanupSpace(chartData, 3);
    if (availableSpace + spaceFreed3 >= targetFreeSpace) {
      return { needed: true, maxImagesToKeep: 3 };
    }
    
    // Try keeping only 1 image per dataset
    const spaceFreed1 = estimateCleanupSpace(chartData, 1);
    if (availableSpace + spaceFreed1 >= targetFreeSpace) {
      return { needed: true, maxImagesToKeep: 1 };
    }
    
    // Aggressive cleanup needed
    return { needed: true, maxImagesToKeep: 1 };
  }
  
  return { needed: false, maxImagesToKeep: 5 };
}


