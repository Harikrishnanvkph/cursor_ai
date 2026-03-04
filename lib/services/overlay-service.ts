import { OverlayImage, OverlayText, OverlayShape } from '../types/overlay';

export const OverlayService = {
    addOverlayImage: (
        image: Omit<OverlayImage, 'id'>,
        currentState: {
            overlayImages: OverlayImage[];
        }
    ) => {
        const newImage = {
            ...image,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        } as OverlayImage;

        return {
            overlayImages: [...currentState.overlayImages, newImage]
        };
    },

    updateOverlayImage: (
        id: string,
        updates: Partial<OverlayImage>,
        currentState: {
            overlayImages: OverlayImage[];
        }
    ) => {
        return {
            overlayImages: currentState.overlayImages.map(img => img.id === id ? { ...img, ...updates } : img)
        };
    },

    removeOverlayImage: (
        id: string,
        currentState: {
            overlayImages: OverlayImage[];
        }
    ) => {
        return {
            overlayImages: currentState.overlayImages.filter(img => img.id !== id)
        };
    },

    addOverlayText: (
        text: Omit<OverlayText, 'id'>,
        currentState: {
            overlayTexts: OverlayText[];
        }
    ) => {
        const newText = {
            ...text,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        } as OverlayText;

        return {
            overlayTexts: [...currentState.overlayTexts, newText]
        };
    },

    updateOverlayText: (
        id: string,
        updates: Partial<OverlayText>,
        currentState: {
            overlayTexts: OverlayText[];
        }
    ) => {
        return {
            overlayTexts: currentState.overlayTexts.map(txt => txt.id === id ? { ...txt, ...updates } : txt)
        };
    },

    removeOverlayText: (
        id: string,
        currentState: {
            overlayTexts: OverlayText[];
        }
    ) => {
        return {
            overlayTexts: currentState.overlayTexts.filter(txt => txt.id !== id)
        };
    },

    addOverlayShape: (
        shape: Omit<OverlayShape, 'id'>,
        currentState: {
            overlayShapes: OverlayShape[];
        }
    ) => {
        const newShape = {
            ...shape,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        } as OverlayShape;

        return {
            overlayShapes: [...currentState.overlayShapes, newShape]
        };
    },

    updateOverlayShape: (
        id: string,
        updates: Partial<OverlayShape>,
        currentState: {
            overlayShapes: OverlayShape[];
        }
    ) => {
        return {
            overlayShapes: currentState.overlayShapes.map(sh => sh.id === id ? { ...sh, ...updates } : sh)
        };
    },

    removeOverlayShape: (
        id: string,
        currentState: {
            overlayShapes: OverlayShape[];
        }
    ) => {
        return {
            overlayShapes: currentState.overlayShapes.filter(sh => sh.id !== id)
        };
    },

    clearOverlayShapes: () => {
        return {
            overlayShapes: []
        };
    }
};
