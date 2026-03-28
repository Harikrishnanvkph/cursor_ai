import type { Chart } from "chart.js"
import { getMouseHandlers } from "./events/mouse-handlers"
import { getTouchHandlers } from "./events/touch-handlers"
import { renderWatermark } from "./features/watermark"
import { dragState } from "./state/drag-state"
import { renderAllOverlays } from "./utils/renderer"

/**
 * Chart.js plugin for rendering overlays.
 * Now wraps the centralized renderAllOverlays utility.
 */
export const overlayPlugin = {
    id: 'overlayPlugin',

    afterDraw: (chart: Chart) => {
        const ctx = chart.ctx
        const pluginConfig = (chart.options as any)?.plugins?.overlayPlugin || {}
        renderAllOverlays(
            ctx,
            {
                images: pluginConfig.overlayImages || [],
                texts: pluginConfig.overlayTexts || [],
                shapes: pluginConfig.overlayShapes || []
            },
            chart.chartArea,
            {
                selectedId: pluginConfig.selectedImageId || pluginConfig.selectedTextId || pluginConfig.selectedShapeId,
                hoveredId: dragState.hoveredOverlayId,
            }
        )

        // Render watermark if configured separately
        const watermarkConfig = (chart.options as any)?.watermark
        if (watermarkConfig) {
            renderWatermark(ctx, watermarkConfig, chart)
        }
    },

    afterInit: (chart: Chart) => {
        const canvas = chart.canvas
        const { handleMouseDown, handleMouseMove, handleMouseUp, handleContextMenu } = getMouseHandlers(chart)
        const { handleTouchStart, handleTouchMove, handleTouchEnd } = getTouchHandlers(chart)

        canvas.addEventListener('mousedown', handleMouseDown)
        canvas.addEventListener('mousemove', handleMouseMove)
        canvas.addEventListener('mouseup', handleMouseUp)
        canvas.addEventListener('mouseleave', handleMouseUp)
        canvas.addEventListener('contextmenu', handleContextMenu)

        canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false })

        ;(chart as any)._overlayPluginListeners = {
            mousedown: handleMouseDown,
            mousemove: handleMouseMove,
            mouseup: handleMouseUp,
            mouseleave: handleMouseUp,
            contextmenu: handleContextMenu,
            touchstart: handleTouchStart,
            touchmove: handleTouchMove,
            touchend: handleTouchEnd
        }
    },

    beforeDestroy: (chart: Chart) => {
        const listeners = (chart as any)._overlayPluginListeners
        if (listeners) {
            const canvas = chart.canvas
            Object.entries(listeners).forEach(([event, handler]) => {
                canvas.removeEventListener(event, handler as EventListener)
            })
            delete (chart as any)._overlayPluginListeners
        }
    }
}
