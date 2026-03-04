export interface OverlayImage {
    id: string
    url: string
    x: number
    y: number
    width: number
    height: number
    naturalWidth?: number
    naturalHeight?: number
    useNaturalSize: boolean
    visible: boolean
    borderWidth: number
    borderColor: string
    shape: 'rectangle' | 'circle' | 'rounded'
    imageFit?: 'fill' | 'cover' | 'contain'
    zIndex: number
}

export interface OverlayText {
    id: string
    text: string
    x: number
    y: number
    fontSize: number
    fontFamily: string
    color: string
    backgroundColor: string
    backgroundTransparent: boolean
    borderWidth: number
    borderColor: string
    paddingX: number
    paddingY: number
    visible: boolean
    rotation: number
    zIndex: number
    maxWidth?: number // Maximum width for text wrapping
}

export type ShapeType = 'rectangle' | 'square' | 'circle' | 'cloud' | 'star' | 'line' | 'lineArrow' | 'lineDoubleArrow' | 'freehand';

export interface OverlayShape {
    id: string
    type: ShapeType
    x: number
    y: number
    width: number
    height: number
    rotation: number
    skewX: number
    skewY: number
    fillColor: string
    fillOpacity?: number
    borderColor: string
    borderWidth: number
    borderStyle?: 'solid' | 'dashed' | 'dotted'
    visible: boolean
    zIndex: number
    points?: { x: number, y: number }[] // Used exclusively by 'freehand' type to store internal normalized points within the shape bounds [0,1]
}
