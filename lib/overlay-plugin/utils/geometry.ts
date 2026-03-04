export function isPointInRect(x: number, y: number, rectX: number, rectY: number, width: number, height: number): boolean {
    return x >= rectX && x <= rectX + width && y >= rectY && y <= rectY + height
}

export function isPointInCircle(x: number, y: number, centerX: number, centerY: number, radius: number): boolean {
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
    return distance <= radius
}

export function rotatePoint(x: number, y: number, cx: number, cy: number, angleDegrees: number): { x: number, y: number } {
    const rad = (angleDegrees * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const nx = Math.cos(rad) * (x - cx) - Math.sin(rad) * (y - cy) + cx;
    const ny = Math.sin(rad) * (x - cx) + Math.cos(rad) * (y - cy) + cy;
    return { x: nx, y: ny };
}

export function getResizeHandle(mouseX: number, mouseY: number, imageX: number, imageY: number, imageWidth: number, imageHeight: number, shape: string = 'rectangle', showRotationHandle: boolean = false): 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w' | 'rotation' | null {
    const handleSize = 8
    const tolerance = 4

    if (shape === 'circle') {
        // For circle, check 4 handles
        const radiusX = imageWidth / 2
        const radiusY = imageHeight / 2
        const centerX = imageX + imageWidth / 2
        const centerY = imageY + imageHeight / 2

        const handles = [
            { type: 'n' as const, x: centerX - handleSize / 2, y: centerY - radiusY - handleSize / 2 },
            { type: 'e' as const, x: centerX + radiusX - handleSize / 2, y: centerY - handleSize / 2 },
            { type: 's' as const, x: centerX - handleSize / 2, y: centerY + radiusY - handleSize / 2 },
            { type: 'w' as const, x: centerX - radiusX - handleSize / 2, y: centerY - handleSize / 2 },
        ]

        for (const handle of handles) {
            if (isPointInRect(mouseX, mouseY, handle.x - tolerance, handle.y - tolerance, handleSize + tolerance * 2, handleSize + tolerance * 2)) {
                return handle.type
            }
        }

        if (showRotationHandle) {
            const rotationHandle = { type: 'rotation' as const, x: centerX - handleSize / 2, y: centerY - radiusY - handleSize * 3.5 };
            if (isPointInRect(mouseX, mouseY, rotationHandle.x - tolerance, rotationHandle.y - tolerance, handleSize + tolerance * 2, handleSize + tolerance * 2)) {
                return rotationHandle.type;
            }
        }
    } else if (shape === 'rounded') {
        // For rounded rectangle, adjust corner positions
        const radius = Math.min(imageWidth, imageHeight) * 0.1
        const midX = imageX + imageWidth / 2
        const midY = imageY + imageHeight / 2

        const handles = [
            // Corner handles (adjusted for rounded corners)
            { type: 'nw' as const, x: imageX + radius - handleSize / 2, y: imageY + radius - handleSize / 2 },
            { type: 'ne' as const, x: imageX + imageWidth - radius - handleSize / 2, y: imageY + radius - handleSize / 2 },
            { type: 'sw' as const, x: imageX + radius - handleSize / 2, y: imageY + imageHeight - radius - handleSize / 2 },
            { type: 'se' as const, x: imageX + imageWidth - radius - handleSize / 2, y: imageY + imageHeight - radius - handleSize / 2 },

            // Edge handles (center of edges)
            { type: 'n' as const, x: midX - handleSize / 2, y: imageY - handleSize / 2 },
            { type: 'e' as const, x: imageX + imageWidth - handleSize / 2, y: midY - handleSize / 2 },
            { type: 's' as const, x: midX - handleSize / 2, y: imageY + imageHeight - handleSize / 2 },
            { type: 'w' as const, x: imageX - handleSize / 2, y: midY - handleSize / 2 },
        ]

        for (const handle of handles) {
            if (isPointInRect(mouseX, mouseY, handle.x - tolerance, handle.y - tolerance, handleSize + tolerance * 2, handleSize + tolerance * 2)) {
                return handle.type
            }
        }

        if (showRotationHandle) {
            const rotationHandle = { type: 'rotation' as const, x: midX - handleSize / 2, y: imageY - handleSize * 3.5 };
            if (isPointInRect(mouseX, mouseY, rotationHandle.x - tolerance, rotationHandle.y - tolerance, handleSize + tolerance * 2, handleSize + tolerance * 2)) {
                return rotationHandle.type;
            }
        }
    } else {
        // Rectangle shape - original logic
        const midX = imageX + imageWidth / 2
        const midY = imageY + imageHeight / 2

        const handles = [
            // Corner handles
            { type: 'nw' as const, x: imageX - handleSize / 2, y: imageY - handleSize / 2 },
            { type: 'ne' as const, x: imageX + imageWidth - handleSize / 2, y: imageY - handleSize / 2 },
            { type: 'sw' as const, x: imageX - handleSize / 2, y: imageY + imageHeight - handleSize / 2 },
            { type: 'se' as const, x: imageX + imageWidth - handleSize / 2, y: imageY + imageHeight - handleSize / 2 },

            // Edge handles
            { type: 'n' as const, x: midX - handleSize / 2, y: imageY - handleSize / 2 },
            { type: 'e' as const, x: imageX + imageWidth - handleSize / 2, y: midY - handleSize / 2 },
            { type: 's' as const, x: midX - handleSize / 2, y: imageY + imageHeight - handleSize / 2 },
            { type: 'w' as const, x: imageX - handleSize / 2, y: midY - handleSize / 2 },
        ]

        for (const handle of handles) {
            if (isPointInRect(mouseX, mouseY, handle.x - tolerance, handle.y - tolerance, handleSize + tolerance * 2, handleSize + tolerance * 2)) {
                return handle.type
            }
        }

        if (showRotationHandle) {
            const rotationHandle = { type: 'rotation' as const, x: midX - handleSize / 2, y: imageY - handleSize * 3.5 };
            if (isPointInRect(mouseX, mouseY, rotationHandle.x - tolerance, rotationHandle.y - tolerance, handleSize + tolerance * 2, handleSize + tolerance * 2)) {
                return rotationHandle.type;
            }
        }
    }

    return null
}
