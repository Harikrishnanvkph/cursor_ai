// Template text area types
export interface TemplateTextArea {
    id: string
    type: 'title' | 'heading' | 'custom' | 'main'
    content: string
    contentType?: 'text' | 'html' // Support both plain text and HTML content
    position: {
        x: number
        y: number
        width: number
        height: number
    }
    style: {
        fontSize: number
        fontFamily: string
        fontWeight: string
        color: string
        textAlign: 'left' | 'center' | 'right' | 'justify'
        lineHeight: number
        letterSpacing: number
    }
    background?: {
        type: 'color' | 'gradient' | 'image' | 'transparent'
        color?: string
        gradientType?: 'linear' | 'radial'
        gradientDirection?: 'to right' | 'to left' | 'to top' | 'to bottom' | '135deg'
        gradientColor1?: string
        gradientColor2?: string
        opacity?: number
        imageUrl?: string
        imageFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
    }
    visible: boolean
}

// Template layout types
export interface TemplateLayout {
    id: string
    name: string
    description: string
    width: number
    height: number
    isCustom?: boolean
    chartArea: {
        x: number
        y: number
        width: number
        height: number
    }
    textAreas: TemplateTextArea[]
    backgroundColor: string
    borderColor: string
    borderWidth: number
    padding: number
    background?: {
        type: 'color' | 'gradient' | 'image' | 'transparent'
        color?: string
        gradientType?: 'linear' | 'radial'
        gradientDirection?: 'to right' | 'to left' | 'to top' | 'to bottom' | '135deg'
        gradientColor1?: string
        gradientColor2?: string
        opacity?: number
        imageUrl?: string
        imageFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
    }
}

// Editor mode types
export type EditorMode = 'chart' | 'template'

// Template store dimension state
export interface ChartDimensionState {
    manualDimensions?: boolean
    responsive?: boolean
    dynamicDimension?: boolean
    width?: string | number
    height?: string | number
    maintainAspectRatio?: boolean
}
