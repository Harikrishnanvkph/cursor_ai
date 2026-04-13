import type {
  FormatSkeleton, FormatZone, ZoneType, TextZoneRole,
  StatZoneRole, DecorationSubtype, FormatCategory,
  FormatColorPalette, FormatDimensions, ZonePosition,
} from '@/lib/format-types'

// ==========================================
// EDIT FORMAT PROP
// ==========================================

export interface EditFormatData {
  id: string
  name: string
  description: string | null
  category: FormatCategory
  skeleton: FormatSkeleton
  dimensions: FormatDimensions
  tags: string[]
  is_official: boolean
  sort_order: number
}

// ==========================================
// BUILDER PROPS
// ==========================================

export interface FormatBuilderProps {
  adminMode?: boolean
  editFormat?: EditFormatData | null
}
