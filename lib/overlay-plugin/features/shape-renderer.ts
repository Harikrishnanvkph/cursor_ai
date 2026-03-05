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

        case 'triangle':
            drawPolygon(ctx, cx, cy, 3, Math.min(w, h) / 2);
            break;

        case 'pentagon':
            drawPolygon(ctx, cx, cy, 5, Math.min(w, h) / 2);
            break;

        case 'hexagon':
            drawPolygon(ctx, cx, cy, 6, Math.min(w, h) / 2);
            break;

        case 'octagon':
            drawPolygon(ctx, cx, cy, 8, Math.min(w, h) / 2);
            break;

        case 'diamond':
            ctx.moveTo(cx, y);
            ctx.lineTo(x + w, cy);
            ctx.lineTo(cx, y + h);
            ctx.lineTo(x, cy);
            ctx.closePath();
            break;

        case 'heart':
            drawHeart(ctx, x, y, w, h);
            break;

        case 'cross':
            drawCross(ctx, x, y, w, h);
            break;

        case 'speechBubble':
            drawSpeechBubble(ctx, x, y, w, h);
            break;

        case 'arrowUp':
            drawArrowUp(ctx, x, y, w, h);
            break;

        case 'arrowDown':
            drawArrowDown(ctx, x, y, w, h);
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

        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
            // Render digit as filled text inside its bounding box
            ctx.restore(); // Restoring here because text rendering is self-contained
            ctx.save();
            ctx.translate(cx, cy);
            if (shape.rotation) ctx.rotate((shape.rotation * Math.PI) / 180);
            if (shape.skewX || shape.skewY) {
                const skewXRad = ((shape.skewX || 0) * Math.PI) / 180;
                const skewYRad = ((shape.skewY || 0) * Math.PI) / 180;
                ctx.transform(1, Math.tan(skewYRad), Math.tan(skewXRad), 1, 0, 0);
            }
            ctx.globalAlpha = shape.visible ? 1 : 0;
            const fontSize = Math.min(w, h) * 0.85;
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (shape.fillColor && shape.fillColor !== 'transparent') {
                ctx.fillStyle = applyOpacityToColor(shape.fillColor, shape.fillOpacity ?? 100);
                ctx.fillText(shape.type, 0, 0);
            }
            if (shape.borderWidth > 0) {
                ctx.strokeStyle = shape.borderColor;
                ctx.lineWidth = shape.borderWidth;
                ctx.strokeText(shape.type, 0, 0);
            }
            ctx.restore();
            return; // already done, skip the generic fill/stroke at the end

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

const drawPolygon = (ctx: CanvasRenderingContext2D, cx: number, cy: number, sides: number, radius: number) => {
    // Start pointing up (-PI/2) for a natural orientation
    const startAngle = -Math.PI / 2;
    ctx.moveTo(cx + radius * Math.cos(startAngle), cy + radius * Math.sin(startAngle));
    for (let i = 1; i <= sides; i++) {
        const angle = startAngle + (2 * Math.PI * i) / sides;
        ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    }
    ctx.closePath();
};

const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const topY = y + h * 0.3;
    ctx.moveTo(x + w / 2, y + h);
    // Left lobe
    ctx.bezierCurveTo(x, y + h * 0.6, x, topY, x + w * 0.25, topY);
    ctx.bezierCurveTo(x + w * 0.35, topY, x + w / 2, y + h * 0.4, x + w / 2, y + h * 0.4);
    // Right lobe
    ctx.bezierCurveTo(x + w / 2, y + h * 0.4, x + w * 0.65, topY, x + w * 0.75, topY);
    ctx.bezierCurveTo(x + w, topY, x + w, y + h * 0.6, x + w / 2, y + h);
    ctx.closePath();
};

const drawCross = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const armW = w / 3;
    const armH = h / 3;
    ctx.moveTo(x + armW, y);
    ctx.lineTo(x + armW * 2, y);
    ctx.lineTo(x + armW * 2, y + armH);
    ctx.lineTo(x + w, y + armH);
    ctx.lineTo(x + w, y + armH * 2);
    ctx.lineTo(x + armW * 2, y + armH * 2);
    ctx.lineTo(x + armW * 2, y + h);
    ctx.lineTo(x + armW, y + h);
    ctx.lineTo(x + armW, y + armH * 2);
    ctx.lineTo(x, y + armH * 2);
    ctx.lineTo(x, y + armH);
    ctx.lineTo(x + armW, y + armH);
    ctx.closePath();
};

const drawSpeechBubble = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const r = Math.min(w, h) * 0.1; // corner radius
    const bubbleH = h * 0.75;
    const tailW = w * 0.2;
    const tailX = x + w * 0.2;
    // Rounded rect for main body
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + bubbleH - r);
    ctx.quadraticCurveTo(x + w, y + bubbleH, x + w - r, y + bubbleH);
    ctx.lineTo(tailX + tailW, y + bubbleH);
    // Tail pointing down-left
    ctx.lineTo(tailX, y + h);
    ctx.lineTo(tailX, y + bubbleH);
    ctx.lineTo(x + r, y + bubbleH);
    ctx.quadraticCurveTo(x, y + bubbleH, x, y + bubbleH - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
};

const drawArrowUp = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const shaftW = w * 0.35;
    const shaftX = x + (w - shaftW) / 2;
    const headH = h * 0.45;
    ctx.moveTo(x + w / 2, y);            // tip
    ctx.lineTo(x + w, y + headH);        // right of head
    ctx.lineTo(shaftX + shaftW, y + headH);
    ctx.lineTo(shaftX + shaftW, y + h);  // shaft bottom-right
    ctx.lineTo(shaftX, y + h);            // shaft bottom-left
    ctx.lineTo(shaftX, y + headH);
    ctx.lineTo(x, y + headH);            // left of head
    ctx.closePath();
};

const drawArrowDown = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const shaftW = w * 0.35;
    const shaftX = x + (w - shaftW) / 2;
    const headH = h * 0.45;
    ctx.moveTo(x + w / 2, y + h);        // tip
    ctx.lineTo(x + w, y + h - headH);   // right of head
    ctx.lineTo(shaftX + shaftW, y + h - headH);
    ctx.lineTo(shaftX + shaftW, y);      // shaft top-right
    ctx.lineTo(shaftX, y);               // shaft top-left
    ctx.lineTo(shaftX, y + h - headH);
    ctx.lineTo(x, y + h - headH);       // left of head
    ctx.closePath();
};

