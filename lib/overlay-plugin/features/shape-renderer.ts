import { ChartArea } from 'chart.js';
import { OverlayShape } from '../../types/overlay';
import { applyOpacityToColor } from '../../utils/color-utils';

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
            // Since square is just a rectangle with constrained w=h (handled by UI), we draw them the same
            ctx.rect(x, y, w, h);
            break;

        case 'circle':
            ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, 2 * Math.PI);
            break;

        case 'cloud':
            drawCloud(ctx, x, y, w, h);
            break;

        case 'star':
            drawStar(ctx, cx, cy, 5, w / 2, w / 4);
            break;

        case 'line':
            ctx.moveTo(x, cy);
            ctx.lineTo(x + w, cy);
            break;

        case 'lineArrow':
            ctx.moveTo(x, cy);
            ctx.lineTo(x + w, cy);
            // Draw arrowhead
            const arrowSize = Math.max(10, Math.min(w * 0.2, 20));
            ctx.moveTo(x + w - arrowSize, cy - arrowSize / 2);
            ctx.lineTo(x + w, cy);
            ctx.lineTo(x + w - arrowSize, cy + arrowSize / 2);
            break;

        case 'lineDoubleArrow':
            ctx.moveTo(x, cy);
            ctx.lineTo(x + w, cy);
            // Draw arrowheads on both sides
            const doubleArrowSize = Math.max(10, Math.min(w * 0.2, 20));
            // Right arrowhead
            ctx.moveTo(x + w - doubleArrowSize, cy - doubleArrowSize / 2);
            ctx.lineTo(x + w, cy);
            ctx.lineTo(x + w - doubleArrowSize, cy + doubleArrowSize / 2);
            // Left arrowhead
            ctx.moveTo(x + doubleArrowSize, cy - doubleArrowSize / 2);
            ctx.lineTo(x, cy);
            ctx.lineTo(x + doubleArrowSize, cy + doubleArrowSize / 2);
            break;

        case 'freehand':
            if (shape.points && shape.points.length > 0) {
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.moveTo(x + shape.points[0].x * w, y + shape.points[0].y * h);

                if (shape.points.length < 3) {
                    for (let i = 1; i < shape.points.length; i++) {
                        ctx.lineTo(x + shape.points[i].x * w, y + shape.points[i].y * h);
                    }
                } else {
                    for (let i = 1; i < shape.points.length - 1; i++) {
                        const pt = shape.points[i];
                        const nextPt = shape.points[i + 1];
                        const midX = (pt.x + nextPt.x) / 2;
                        const midY = (pt.y + nextPt.y) / 2;
                        ctx.quadraticCurveTo(
                            x + pt.x * w, y + pt.y * h,
                            x + midX * w, y + midY * h
                        );
                    }
                    const lastPt = shape.points[shape.points.length - 1];
                    ctx.lineTo(x + lastPt.x * w, y + lastPt.y * h);
                }
            }
            break;

        default:
            ctx.rect(x, y, w, h);
    }

    if (shape.type === 'line' || shape.type === 'lineArrow' || shape.type === 'lineDoubleArrow' || shape.type === 'freehand') {
        // Lines don't have fillColor, they just stroke
        ctx.stroke();
    } else {
        if (shape.fillColor !== 'transparent' && shape.fillColor) {
            ctx.fill();
        }
        if (shape.borderWidth > 0) {
            ctx.stroke();
        }
    }

    ctx.restore();
};

const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    // Cloud drawing uses bezier curves based on width/height
    ctx.moveTo(x + w * 0.2, y + h * 0.8);
    ctx.bezierCurveTo(x + w * 0.1, y + h * 0.8, x + w * 0.1, y + h * 0.5, x + w * 0.3, y + h * 0.5);
    ctx.bezierCurveTo(x + w * 0.3, y + h * 0.2, x + w * 0.7, y + h * 0.2, x + w * 0.7, y + h * 0.5);
    ctx.bezierCurveTo(x + w * 0.9, y + h * 0.5, x + w * 0.9, y + h * 0.8, x + w * 0.8, y + h * 0.8);
    ctx.closePath();
};

const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
};
