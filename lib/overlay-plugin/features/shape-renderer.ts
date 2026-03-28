import { ChartArea } from 'chart.js';
import { OverlayShape } from '../../types/overlay';
import { applyOpacityToColor } from '../../utils/color-utils';
import { imageCache } from './image-renderer';

export const renderOverlayShape = (
    ctx: CanvasRenderingContext2D,
    shape: OverlayShape,
    chartArea: ChartArea
) => {
    const x = chartArea.left + shape.x;
    const y = chartArea.top + shape.y;
    const w = shape.width;
    const h = shape.height;

    // Find center point for rotation and skewing
    const cx = x + w / 2;
    const cy = y + h / 2;

    ctx.save();

    // Move origin to center, rotate, skew, and move back
    ctx.translate(cx, cy);
    if (shape.rotation) {
        ctx.rotate((shape.rotation * Math.PI) / 180);
    }

    if (shape.skewX || shape.skewY) {
        // Skew is applied via standard transform: (a, b, c, d, e, f)
        // a (m11) Horizontal scaling
        // b (m12) Horizontal skewing
        // c (m21) Vertical skewing
        // d (m22) Vertical scaling
        // e (dx) Horizontal moving
        // f (dy) Vertical moving
        const skewXRad = ((shape.skewX || 0) * Math.PI) / 180;
        const skewYRad = ((shape.skewY || 0) * Math.PI) / 180;
        ctx.transform(1, Math.tan(skewYRad), Math.tan(skewXRad), 1, 0, 0);
    }

    ctx.translate(-cx, -cy);

    // Context styles
    ctx.fillStyle = shape.fillColor !== 'transparent' && shape.fillColor ? applyOpacityToColor(shape.fillColor, shape.fillOpacity ?? 100) : 'transparent';
    ctx.strokeStyle = shape.borderColor;
    ctx.lineWidth = shape.borderWidth;
    ctx.globalAlpha = shape.visible ? 1 : 0;

    if (shape.borderStyle === 'dashed') {
        ctx.setLineDash([8, 8]);
    } else if (shape.borderStyle === 'dotted') {
        ctx.setLineDash([2, 4]);
    } else {
        ctx.setLineDash([]);
    }

    ctx.beginPath();

    switch (shape.type) {
        case 'rectangle':
        case 'square':
            ctx.rect(x, y, w, h);
            break;

        case 'circle':
            ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, 2 * Math.PI);
            break;

        case 'line':
            ctx.moveTo(x, cy);
            ctx.lineTo(x + w, cy);
            break;

        case 'lineArrow': {
            ctx.moveTo(x, cy);
            ctx.lineTo(x + w, cy);
            const arrowSize = Math.max(10, Math.min(w * 0.2, 20));
            ctx.moveTo(x + w - arrowSize, cy - arrowSize / 2);
            ctx.lineTo(x + w, cy);
            ctx.lineTo(x + w - arrowSize, cy + arrowSize / 2);
            break;
        }

        case 'lineDoubleArrow': {
            ctx.moveTo(x, cy);
            ctx.lineTo(x + w, cy);
            const doubleArrowSize = Math.max(10, Math.min(w * 0.2, 20));
            ctx.moveTo(x + w - doubleArrowSize, cy - doubleArrowSize / 2);
            ctx.lineTo(x + w, cy);
            ctx.lineTo(x + w - doubleArrowSize, cy + doubleArrowSize / 2);
            ctx.moveTo(x + doubleArrowSize, cy - doubleArrowSize / 2);
            ctx.lineTo(x, cy);
            ctx.lineTo(x + doubleArrowSize, cy + doubleArrowSize / 2);
            break;
        }

        default:
            ctx.rect(x, y, w, h);
    }

    if (shape.type === 'line' || shape.type === 'lineArrow' || shape.type === 'lineDoubleArrow') {
        // Lines don't have fillColor, they just stroke
        ctx.stroke();
    } else {
        if (shape.fillColor !== 'transparent' && shape.fillColor) {
            ctx.fill();
        }
        
        // FRAME SUPPORT: If the shape has an image, render it inside the path
        if (shape.imageUrl) {
            const img = imageCache.get(shape.imageUrl);
            if (img && img.complete) {
                ctx.save();
                ctx.clip(); // Mask to the shape path
                
                // Draw image with fit logic
                const fit = shape.imageFit || 'cover';
                if (fit === 'cover') {
                    const imgRatio = img.width / img.height;
                    const shapeRatio = w / h;
                    let drawW, drawH, drawX, drawY;
                    if (imgRatio > shapeRatio) {
                        drawH = h;
                        drawW = h * imgRatio;
                        drawX = x - (drawW - w) / 2;
                        drawY = y;
                    } else {
                        drawW = w;
                        drawH = w / imgRatio;
                        drawX = x;
                        drawY = y - (drawH - h) / 2;
                    }
                    ctx.drawImage(img, drawX, drawY, drawW, drawH);
                } else if (fit === 'contain') {
                    const imgRatio = img.width / img.height;
                    const shapeRatio = w / h;
                    let drawW, drawH, drawX, drawY;
                    if (imgRatio > shapeRatio) {
                        drawW = w;
                        drawH = w / imgRatio;
                        drawX = x;
                        drawY = y + (h - drawH) / 2;
                    } else {
                        drawH = h;
                        drawW = h * imgRatio;
                        drawX = x + (w - drawW) / 2;
                        drawY = y;
                    }
                    ctx.drawImage(img, drawX, drawY, drawW, drawH);
                } else {
                    ctx.drawImage(img, x, y, w, h);
                }
                ctx.restore();
            }
        }

        if (shape.borderWidth > 0) {
            ctx.stroke();
        }
    }

    ctx.restore();
};
