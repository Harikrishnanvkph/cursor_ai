import { OverlayImage, OverlayText, OverlayShape } from "../../chart-store";
import { renderOverlayImage } from "../features/image-renderer";
import { renderOverlayText } from "../features/text-renderer";
import { renderOverlayShape } from "../features/shape-renderer";

interface OverlayData {
    images: OverlayImage[];
    texts: OverlayText[];
    shapes: OverlayShape[];
}

interface RenderOptions {
    selectedId?: string | null;
    hoveredId?: string | null;
}

export function renderAllOverlays(
    ctx: CanvasRenderingContext2D,
    data: OverlayData,
    chartArea: { left: number; top: number; right: number; bottom: number; width: number; height: number },
    options: RenderOptions = {}
) {
    // Sort all overlays by zIndex to render in correct order
    const allOverlays = [
        ...data.images.map(img => ({ type: 'image' as const, data: img })),
        ...data.texts.map(txt => ({ type: 'text' as const, data: txt })),
        ...data.shapes.map(sh => ({ type: 'shape' as const, data: sh }))
    ].sort((a, b) => (a.data.zIndex || 0) - (b.data.zIndex || 0));

    for (const overlay of allOverlays) {
        if (!overlay.data.visible) continue;

        const isSelected = options.selectedId === overlay.data.id;
        const isHovered = options.hoveredId === overlay.data.id;

        if (overlay.type === 'image') {
            renderOverlayImage(ctx, overlay.data as OverlayImage, chartArea);
        } else if (overlay.type === 'text') {
            renderOverlayText(ctx, overlay.data as OverlayText, chartArea);
        } else if (overlay.type === 'shape') {
            renderOverlayShape(ctx, overlay.data as OverlayShape, chartArea);
        }
    }
}
