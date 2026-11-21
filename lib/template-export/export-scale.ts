export const MAX_EXPORT_PIXELS = 64_000_000
export const MAX_EXPORT_DIMENSION = 8192

/**
 * Clamp requested export scale so the offscreen canvas stays within browser-safe
 * memory and side-length limits (<= 64MP total area, <= 8192px per side).
 */
export function clampExportScale(width: number, height: number, requestedScale: number): number {
  const safeW = Number.isFinite(width) && width > 0 ? width : 800
  const safeH = Number.isFinite(height) && height > 0 ? height : 600
  const req = Number.isFinite(requestedScale) && requestedScale > 0 ? requestedScale : 1

  const maxSideScale = Math.min(MAX_EXPORT_DIMENSION / safeW, MAX_EXPORT_DIMENSION / safeH)
  const maxAreaScale = Math.sqrt(MAX_EXPORT_PIXELS / (safeW * safeH))
  return Math.max(0.25, Math.min(req, maxSideScale, maxAreaScale))
}
