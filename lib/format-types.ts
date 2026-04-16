/**
 * Format System Types
 * 
 * A Format is a visual blueprint (skeleton) that defines how chart data
 * and content are arranged, styled, and decorated to create an infographic-like output.
 * 
 * Architecture:
 *   zones[]       — Content slots filled by AI (text, chart, stat, background)
 *   decorations[] — Static visual elements (shapes, lines, icons, images, SVGs)
 */

// ========================================
// ZONE TYPES — Building blocks of a format
// ========================================

/** Zone types define what kind of content a zone holds */
export type ZoneType = 'text' | 'chart' | 'stat' | 'background' | 'decoration' | 'image';

/** Text zone roles map to specific content fields from the LLM */
export type TextZoneRole = 'title' | 'subtitle' | 'body' | 'source' | 'callout';

/** Stat zone roles define which stat from the content package to show */
export type StatZoneRole = 'highlight' | 'secondary' | 'tertiary';

/** Decoration subtypes (new categories + legacy values for backward compat) */
export type DecorationSubtype = 'shape' | 'line' | 'connector' | 'icon' | 'image' | 'svg-upload'
  | 'svg-icon' | 'border' | 'divider' | 'watermark';  // legacy — kept for existing formats

/** Background subtypes */
export type BackgroundSubtype = 'image' | 'gradient' | 'pattern' | 'solid';

/** Format categories */
export type FormatCategory = 'infographic' | 'social' | 'report' | 'presentation' | 'template';

// ========================================
// ZONE DEFINITIONS
// ========================================

/** Position and size of a zone within the format canvas */
export interface ZonePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Text styling for text zones */
export interface TextZoneStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;
  fontStyle?: 'normal' | 'italic';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textDecoration?: 'none' | 'underline' | 'line-through';
}

/** Stat zone styling */
export interface StatZoneStyle {
  valueSize: number;
  labelSize: number;
  valueColor: string;
  labelColor: string;
  valueFontWeight?: string;
  valueFontFamily?: string;
  valueFontStyle?: 'normal' | 'italic';
  valueTextDecoration?: 'none' | 'underline' | 'line-through';
  labelFontFamily?: string;
  labelFontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  layout?: 'vertical' | 'horizontal';  // Value above label vs side by side
}

/** Background zone styling */
export interface BackgroundZoneStyle {
  type: BackgroundSubtype;
  // Solid
  color?: string;
  // Gradient
  gradientType?: 'linear' | 'radial';
  gradientDirection?: string;  // e.g., '135deg', 'to right'
  gradientColor1?: string;
  gradientColor2?: string;
  // Image
  imageUrl?: string;           // Pre-filled by admin OR filled at runtime by keywords
  imageFit?: 'fill' | 'contain' | 'cover' | 'none';
  overlay?: string;            // e.g., 'rgba(0,0,0,0.5)' over image
  blur?: number;               // Backdrop blur amount
  // Pattern
  patternType?: string;        // e.g., 'dots', 'lines', 'mesh', 'grid'
  patternColor?: string;
  patternOpacity?: number;
}

/** Decoration zone styling (legacy — decoration zones are deprecated in builder, use FormatDecoration instead) */
export interface DecorationZoneStyle {
  // Shape
  shapeType?: string;
  shapeColor?: string;
  shapeOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  borderRadius?: number;
  // Line / Arrow / Connector
  lineType?: 'line' | 'arrow' | 'double-arrow' | 'connected-lines' | 'bezier-line' | 'cloud-line' | 'freehand';
  lineColor?: string;
  lineThickness?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  // Icon
  iconType?: string;
  iconColor?: string;
  iconSize?: number;
  // Image
  imageUrl?: string;
  imageFit?: 'cover' | 'contain' | 'fill';
  imageBorderRadius?: number;
  // SVG
  svgContent?: string;
  svgColor?: string;
  svgOpacity?: number;
  // Legacy fields — kept for backward compat with existing format defaults
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  dividerColor?: string;
  dividerThickness?: number;
  dividerStyle?: 'solid' | 'dashed' | 'gradient';
  svgCategory?: string;
}

/** Chart zone configuration */
export interface ChartZoneConfig {
  preferredChartTypes?: string[];    // e.g., ['pie', 'doughnut', 'pie3d']
  backgroundColor?: string;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';
  legendColor?: string;
  gridColor?: string;
  showGrid?: boolean;
}

// ========================================
// FORMAT ZONE — A single zone in a format
// ========================================

/** Base zone properties shared by all zone types */
export interface BaseZone {
  id: string;
  type: ZoneType;
  position?: ZonePosition;       // Background and border zones may not need position
  visible?: boolean;             // Defaults to true
  contextual?: boolean;          // If true, content is filled from keywords at runtime
  /** Admin-authored AI prompt/instruction for content generation in this zone */
  message?: string;
  /** Expected output type from the AI for this zone's message */
  messageType?: 'text' | 'html' | 'image' | 'data' | 'auto';
}

/** Text zone — displays text content */
export interface TextZone extends BaseZone {
  type: 'text';
  role: TextZoneRole;
  style: TextZoneStyle;
  maxLength?: number;            // Truncate content to this length
}

/** Chart zone — displays the actual chart */
export interface ChartZone extends BaseZone {
  type: 'chart';
  chartConfig: ChartZoneConfig;
}

/** Stat zone — displays a key metric (value + label) */
export interface StatZone extends BaseZone {
  type: 'stat';
  role: StatZoneRole;
  style: StatZoneStyle;
}

/** Background zone — fills the entire canvas background */
export interface BackgroundZone extends BaseZone {
  type: 'background';
  style: BackgroundZoneStyle;
}

/** Decoration zone — SVGs, borders, dividers, shapes */
export interface DecorationZone extends BaseZone {
  type: 'decoration';
  subtype: DecorationSubtype;
  style: DecorationZoneStyle;
}

/** Image zone — displays an image (contextual or pre-set) */
export interface ImageZoneStyle {
  imageFit: 'cover' | 'contain' | 'fill';
  borderRadius?: number;
  objectPosition?: string;       // e.g., 'center', 'top'
  backgroundColor?: string;      // Fallback color behind image
  overlay?: string;              // e.g., 'rgba(0,0,0,0.3)'
}

export interface ImageZone extends BaseZone {
  type: 'image';
  style: ImageZoneStyle;
  imageUrl?: string;             // Pre-set by admin or filled at runtime
  placeholder?: string;          // Hint for AI: 'technology', 'nature', etc.
}

/** Union type for all zone variants */
export type FormatZone = TextZone | ChartZone | StatZone | BackgroundZone | DecorationZone | ImageZone;

// ========================================
// COLOR PALETTE
// ========================================

/** Color palette defining the visual theme of a format */
export interface FormatColorPalette {
  primary: string;
  secondary: string;
  text: string;
  background: string;
  accent: string;
  /** Optional chart dataset colors */
  chartColors?: string[];
}

// ========================================
// FORMAT DIMENSIONS
// ========================================

/** Dimensions and aspect ratio of a format */
export interface FormatDimensions {
  width: number;
  height: number;
  aspect: string;           // e.g., '1:1', '16:9', '9:16', '4:5'
  label: string;            // e.g., 'Instagram Post', 'Story', 'HD Slide'
}

// ========================================
// FORMAT SKELETON — The complete format definition
// ========================================

/** 
 * FormatSkeleton is the complete blueprint definition.
 * It defines the canvas, zones, palette, and metadata.
 * Stored in the `format_blueprints` table's `skeleton` JSONB column.
 */
export interface FormatSkeleton {
  id: string;
  name: string;
  description: string;
  category: FormatCategory;
  dimensions: FormatDimensions;

  /** Content zones — semantic slots filled by AI at render time */
  zones: FormatZone[];

  /** Decoration layer — static visual elements (shapes, lines, icons, images, SVGs) */
  decorations?: FormatDecoration[];

  colorPalette: FormatColorPalette;
  tags: string[];

  /** Whether this format has a pre-filled background (admin-set) vs contextual */
  hasPrefilledBackground: boolean;

  /** Sort order for gallery display */
  sortOrder?: number;

  /** Admin metadata */
  isOfficial?: boolean;
  isPublic?: boolean;
  userId?: string;
  thumbnailUrl?: string;

  /** Timestamps */
  createdAt?: string;
  updatedAt?: string;
}

/** A decoration element in the format (static visual, not AI-filled) */
export interface FormatDecoration {
  id: string;
  type: FormatDecorationType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  /** For freehand, polygon, connected-lines: array of points relative to (x,y) */
  points?: { x: number; y: number }[];
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  visible?: boolean;
  zIndex?: number;
  // Image fields
  imageUrl?: string;
  imageFit?: 'fill' | 'cover' | 'contain';
  borderRadius?: number;
  // SVG fields
  svgContent?: string;
}

/** Decoration shape types available in the format builder */
export type FormatDecorationType =
  | 'rectangle' | 'circle' | 'triangle' | 'star' | 'hexagon' | 'pentagon'
  | 'diamond-shape' | 'heart' | 'cloud' | 'polygon' | 'dot'
  | 'checkmark' | 'crossmark' | 'text-callout'
  | 'line' | 'arrow' | 'double-arrow'
  | 'connected-lines' | 'bezier-line' | 'cloud-line' | 'freehand'
  | 'deco-image' | 'deco-svg';

// ========================================
// LLM CONTENT PACKAGE — What the AI returns
// ========================================

/** A single stat metric from the LLM */
export interface ContentStat {
  value: string;            // e.g., '28%', '$42B', '5'
  label: string;            // e.g., "Russia's Market Share"
}

/** The complete content package returned by the LLM */
export interface LLMContentPackage {
  /** Text content */
  title: string;
  subtitle?: string;
  body?: string;
  source?: string;
  callout?: string;
  titleVariants?: string[];

  /** Key metrics */
  stats: ContentStat[];

  /** Context for background/icon selection */
  keywords: string[];
  mood?: 'professional' | 'playful' | 'minimal' | 'bold' | 'elegant';
  dataStory?: 'comparison' | 'trend' | 'distribution' | 'ranking' | 'composition';

  /** Chart data (existing format) */
  chartData: {
    labels: string[];
    datasets: any[];      // Chart.js dataset format
  };

  /** Suggested chart types for variant generation */
  suggestedChartTypes: string[];

  /** Suggested color palettes */
  colorPalettes?: FormatColorPalette[];

  /** Chart config (existing format) */
  chartConfig?: Record<string, any>;
}

// ========================================
// RENDERED FORMAT — After merging skeleton + content
// ========================================

/** A resolved zone with actual content filled in */
export interface RenderedZone {
  zone: FormatZone;
  resolvedContent?: string;           // For text zones
  resolvedValue?: string;             // For stat zones (the number)
  resolvedLabel?: string;             // For stat zones (the description)
  resolvedChartType?: string;         // For chart zones
  resolvedChartData?: any;            // For chart zones
  resolvedChartConfig?: any;          // For chart zones
  resolvedImageUrl?: string;          // For background zones
  resolvedGradient?: string;          // For background zones
  resolvedSvg?: string;              // For decoration zones
}

/** Fully rendered format ready for display */
export interface RenderedFormat {
  skeleton: FormatSkeleton;
  renderedZones: RenderedZone[];
  chartType: string;
  colorPalette: FormatColorPalette;
  /** Unique ID for this specific variant */
  variantId: string;
  /** Label for the gallery card (e.g., "Pie · Earth Tones · 1:1") */
  variantLabel: string;
}

// ========================================
// GALLERY STATE
// ========================================

/** Filter options for the format gallery */
export interface GalleryFilters {
  category?: FormatCategory;
  dimension?: string;          // Filter by aspect ratio
  chartType?: string;          // Filter by chart type
  style?: string;              // Filter by tag
}

// ========================================
// DATABASE ROW — What comes from Supabase
// ========================================

/** Row type for the format_blueprints table */
export interface FormatBlueprintRow {
  id: string;
  name: string;
  description: string | null;
  category: FormatCategory;
  skeleton: Record<string, any>;    // JSONB → parsed to FormatSkeleton
  dimensions: FormatDimensions;
  tags: string[];
  thumbnail_url: string | null;
  user_id: string | null;
  is_official: boolean;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
