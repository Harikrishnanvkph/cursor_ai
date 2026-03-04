import type { Chart } from "chart.js"
import { getMouseHandlers } from "./mouse-handlers"

export function getTouchHandlers(chart: Chart) {
    const { handleMouseDown, handleMouseMove, handleMouseUp } = getMouseHandlers(chart)

    // Touch event handlers for mobile support
    const handleTouchStart = (event: TouchEvent) => {
        if (event.touches.length !== 1) return
        const touch = event.touches[0]

        // Convert to mouse event format and use same logic
        const mouseEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            preventDefault: () => event.preventDefault()
        } as MouseEvent

        handleMouseDown(mouseEvent)
    }

    const handleTouchMove = (event: TouchEvent) => {
        if (event.touches.length !== 1) return
        const touch = event.touches[0]

        const mouseEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            preventDefault: () => event.preventDefault()
        } as MouseEvent

        handleMouseMove(mouseEvent)
    }

    const handleTouchEnd = (event: TouchEvent) => {
        handleMouseUp()
        event.preventDefault()
    }

    return {
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd
    }
}
