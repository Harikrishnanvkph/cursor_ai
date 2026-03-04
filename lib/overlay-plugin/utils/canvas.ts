export function drawResizeHandles(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, drawRotationHandle: boolean = false): void {
    const handleSize = 8
    const halfHandle = handleSize / 2
    const midX = x + width / 2
    const midY = y + height / 2

    ctx.save()
    ctx.fillStyle = '#007acc'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1

    // Draw all 8 handles: 4 corners + 4 edges
    const handles = [
        // Corner handles
        { x: x - halfHandle, y: y - halfHandle }, // NW
        { x: x + width - halfHandle, y: y - halfHandle }, // NE
        { x: x - halfHandle, y: y + height - halfHandle }, // SW
        { x: x + width - halfHandle, y: y + height - halfHandle }, // SE

        // Edge handles
        { x: midX - halfHandle, y: y - halfHandle }, // N (top)
        { x: x + width - halfHandle, y: midY - halfHandle }, // E (right)
        { x: midX - halfHandle, y: y + height - halfHandle }, // S (bottom)
        { x: x - halfHandle, y: midY - halfHandle }, // W (left)
    ]

    handles.forEach(handle => {
        ctx.fillRect(handle.x, handle.y, handleSize, handleSize)
        ctx.strokeRect(handle.x, handle.y, handleSize, handleSize)
    })

    if (drawRotationHandle) {
        // Draw connection line
        ctx.beginPath();
        ctx.strokeStyle = '#007acc';
        ctx.lineWidth = 1.5;
        ctx.moveTo(midX, y);
        ctx.lineTo(midX, y - handleSize * 3);
        ctx.stroke();

        // Draw rotation circle
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(midX, y - handleSize * 3, handleSize / 1.2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Draw inner dot
        ctx.beginPath();
        ctx.fillStyle = '#007acc';
        ctx.arc(midX, y - handleSize * 3, handleSize / 3.5, 0, 2 * Math.PI);
        ctx.fill();
    }

    ctx.restore()
}

export function drawCircularResizeHandles(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, drawRotationHandle: boolean = false): void {
    const handleSize = 8
    const halfHandle = handleSize / 2
    const centerX = x + width / 2
    const centerY = y + height / 2
    const radiusX = width / 2
    const radiusY = height / 2

    ctx.save()
    ctx.fillStyle = '#007acc'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1

    // Draw 4 handles at cardinal directions (top, right, bottom, left)
    const handles = [
        { x: centerX - halfHandle, y: centerY - radiusY - halfHandle }, // Top
        { x: centerX + radiusX - halfHandle, y: centerY - halfHandle }, // Right
        { x: centerX - halfHandle, y: centerY + radiusY - halfHandle }, // Bottom
        { x: centerX - radiusX - halfHandle, y: centerY - halfHandle }, // Left
    ]

    handles.forEach(handle => {
        ctx.fillRect(handle.x, handle.y, handleSize, handleSize)
        ctx.strokeRect(handle.x, handle.y, handleSize, handleSize)
    })

    if (drawRotationHandle) {
        // Draw connection line
        ctx.beginPath();
        ctx.strokeStyle = '#007acc';
        ctx.lineWidth = 1.5;
        ctx.moveTo(centerX, centerY - radiusY);
        ctx.lineTo(centerX, centerY - radiusY - handleSize * 3);
        ctx.stroke();

        // Draw rotation circle
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(centerX, centerY - radiusY - handleSize * 3, handleSize / 1.2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Draw inner dot
        ctx.beginPath();
        ctx.fillStyle = '#007acc';
        ctx.arc(centerX, centerY - radiusY - handleSize * 3, handleSize / 3.5, 0, 2 * Math.PI);
        ctx.fill();
    }

    ctx.restore()
}

export function drawRoundedResizeHandles(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, drawRotationHandle: boolean = false): void {
    const handleSize = 8
    const halfHandle = handleSize / 2
    const radius = Math.min(width, height) * 0.1

    ctx.save()
    ctx.fillStyle = '#007acc'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1

    // Draw handles at the corners and edges of the rounded rectangle
    const handles = [
        // Corner handles (adjusted for rounded corners)
        { x: x + radius - halfHandle, y: y + radius - halfHandle }, // Top-left (adjusted)
        { x: x + width - radius - halfHandle, y: y + radius - halfHandle }, // Top-right (adjusted)
        { x: x + radius - halfHandle, y: y + height - radius - halfHandle }, // Bottom-left (adjusted)
        { x: x + width - radius - halfHandle, y: y + height - radius - halfHandle }, // Bottom-right (adjusted)

        // Edge handles (center of edges)
        { x: x + width / 2 - halfHandle, y: y - halfHandle }, // Top center
        { x: x + width - halfHandle, y: y + height / 2 - halfHandle }, // Right center
        { x: x + width / 2 - halfHandle, y: y + height - halfHandle }, // Bottom center
        { x: x - halfHandle, y: y + height / 2 - halfHandle }, // Left center
    ]

    handles.forEach(handle => {
        ctx.fillRect(handle.x, handle.y, handleSize, handleSize)
        ctx.strokeRect(handle.x, handle.y, handleSize, handleSize)
    })

    if (drawRotationHandle) {
        const midX = x + width / 2;
        // Draw connection line
        ctx.beginPath();
        ctx.strokeStyle = '#007acc';
        ctx.lineWidth = 1.5;
        ctx.moveTo(midX, y);
        ctx.lineTo(midX, y - handleSize * 3);
        ctx.stroke();

        // Draw rotation circle
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(midX, y - handleSize * 3, handleSize / 1.2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Draw inner dot
        ctx.beginPath();
        ctx.fillStyle = '#007acc';
        ctx.arc(midX, y - handleSize * 3, handleSize / 3.5, 0, 2 * Math.PI);
        ctx.fill();
    }

    ctx.restore()
}

export function drawDashedBorder(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    ctx.save()
    ctx.strokeStyle = '#007acc'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(x, y, width, height)
    ctx.restore()
}

export function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
}

export function clipImageToShape(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, shape: string): void {
    ctx.save()

    if (shape === 'circle') {
        const centerX = x + width / 2
        const centerY = y + height / 2
        const radius = Math.min(width, height) / 2
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
        ctx.clip()
    } else if (shape === 'rounded') {
        const radius = Math.min(width, height) * 0.1
        drawRoundedRect(ctx, x, y, width, height, radius)
        ctx.clip()
    } else {
        // Rectangle - default clipping
        ctx.beginPath()
        ctx.rect(x, y, width, height)
        ctx.clip()
    }
}
