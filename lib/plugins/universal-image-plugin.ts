import type { Chart } from "chart.js"
import type { SupportedChartType, PointImageConfig } from "../chart-store"

// Global state for drag handling
const dragState = {
    isDragging: false,
    dragDatasetIndex: -1,
    dragPointIndex: -1,
    dragOffsetX: 0,
    dragOffsetY: 0,
}

// Universal image plugin for all chart types
export const universalImagePlugin = {
    id: "universalImages",
    afterDraw: (chart: any) => {
        const ctx = chart.ctx
        const chartArea = chart.chartArea

        chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
            // Respect default Chart.js legend visibility for datasets
            if (typeof chart.isDatasetVisible === 'function' && chart.isDatasetVisible(datasetIndex) === false) {
                return;
            }
            const meta = chart.getDatasetMeta(datasetIndex)
            if (!meta || !meta.data || !dataset.pointImages) return

            meta.data.forEach((element: any, pointIndex: number) => {
                // For pie/doughnut/polarArea, respect per-slice visibility toggled by legend
                const type = chart.config?.type;
                if ((type === 'pie' || type === 'doughnut' || type === 'polarArea') &&
                    typeof chart.getDataVisibility === 'function' && chart.getDataVisibility(pointIndex) === false) {
                    return;
                }
                const imageUrl = dataset.pointImages[pointIndex];
                const imageConfig = dataset.pointImageConfig?.[pointIndex] || getDefaultImageConfig(chart.config.type || 'bar')

                if (imageUrl && element) {
                    const img = new Image()
                    img.crossOrigin = "anonymous"
                    img.onload = () => {
                        ctx.save()
                        const chartType = chart.config.type
                        const x = element.x
                        const y = element.y

                        // Add chart reference to element
                        element.chart = chart

                        // Fill Slice/Bar takes priority over position - check it first
                        if (chartType === "pie" || chartType === "doughnut" || chartType === "polarArea") {
                            if (imageConfig.fillSlice) {
                                // Fill slice mode - ignore position setting
                                renderSliceImage(ctx, element, img, imageConfig)
                                ctx.restore()
                                return
                            }
                        } else if (chartType === "bar") {
                            if (imageConfig.fillBar) {
                                // Fill bar mode - ignore position setting
                                if (chart.config.options?.indexAxis === "y") {
                                    renderBarImageHorizontal(ctx, element, img, imageConfig)
                                } else {
                                    renderBarImageVertical(ctx, element, img, imageConfig)
                                }
                                ctx.restore()
                                return
                            }
                        }

                        // Handle callout position for all chart types (only if fillSlice/fillBar is not enabled)
                        if (imageConfig.position === "callout") {
                            renderCalloutImage(ctx, x, y, img, imageConfig, datasetIndex, pointIndex, chart)
                            ctx.restore()
                            return
                        }

                        if (chartType === "pie" || chartType === "doughnut" || chartType === "polarArea") {
                            renderSliceImage(ctx, element, img, imageConfig)
                        } else if (chartType === "bar") {
                            if (chart.config.options?.indexAxis === "y") {
                                renderBarImageHorizontal(ctx, element, img, imageConfig)
                            } else {
                                renderBarImageVertical(ctx, element, img, imageConfig)
                            }
                        } else if (
                            chartType === "line" ||
                            chartType === "scatter" ||
                            chartType === "bubble" ||
                            chartType === "radar"
                        ) {
                            renderPointImage(ctx, element, img, imageConfig)
                        }

                        ctx.restore()
                    }
                    img.src = imageUrl
                }
            })
        })
    },
    afterInit: (chart: any) => {
        // Set up event listeners for dragging
        const canvas = chart.canvas

        const handleMouseDown = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            const x = event.clientX - rect.left
            const y = event.clientY - rect.top

            // Check if clicking on a callout
            chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
                if (!dataset.pointImageConfig) return

                const meta = chart.getDatasetMeta(datasetIndex)
                if (!meta || !meta.data) return

                // Iterate over visible elements only (meta.data is already filtered)
                meta.data.forEach((element: any, filteredPointIndex: number) => {
                    // Map filtered index back to original index for accessing pointImageConfig
                    // Since datasets are filtered, we need to find the original index
                    // For now, use filteredPointIndex directly as the datasets are already filtered
                    const pointIndex = filteredPointIndex
                    const config = dataset.pointImageConfig?.[pointIndex]

                    if (config && config.position === "callout" && dataset.pointImages?.[pointIndex]) {
                        if (!element) return

                        const calloutX = config.calloutX !== undefined ? config.calloutX : element.x + (config.offset || 40)
                        const calloutY = config.calloutY !== undefined ? config.calloutY : element.y - (config.offset || 40)
                        const size = config.size || 30

                        const distance = Math.sqrt((x - calloutX) ** 2 + (y - calloutY) ** 2)

                        if (distance <= size / 2) {
                            dragState.isDragging = true
                            dragState.dragDatasetIndex = datasetIndex
                            dragState.dragPointIndex = pointIndex
                            dragState.dragOffsetX = x - calloutX
                            dragState.dragOffsetY = y - calloutY
                            canvas.style.cursor = "grabbing"
                            event.preventDefault()
                        }
                    }
                })
            })
        }

        const handleMouseMove = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect()
            const x = event.clientX - rect.left
            const y = event.clientY - rect.top

            if (dragState.isDragging) {
                // Update callout position
                const dataset = chart.data.datasets[dragState.dragDatasetIndex]
                if (dataset && dataset.pointImageConfig && dataset.pointImageConfig[dragState.dragPointIndex]) {
                    const config = dataset.pointImageConfig[dragState.dragPointIndex]

                    config.calloutX = x - dragState.dragOffsetX
                    config.calloutY = y - dragState.dragOffsetY

                    // Redraw chart
                    chart.update("none")
                }
                event.preventDefault()
            } else {
                // Check if hovering over a callout
                let isOverCallout = false

                chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
                    if (!dataset.pointImageConfig) return

                    dataset.pointImageConfig.forEach((config: any, pointIndex: number) => {
                        if (config && config.position === "callout" && dataset.pointImages[pointIndex]) {
                            const meta = chart.getDatasetMeta(datasetIndex)
                            const element = meta.data[pointIndex]

                            if (!element) return

                            const calloutX = config.calloutX !== undefined ? config.calloutX : element.x + (config.offset || 40)
                            const calloutY = config.calloutY !== undefined ? config.calloutY : element.y - (config.offset || 40)
                            const size = config.size || 30

                            const distance = Math.sqrt((x - calloutX) ** 2 + (y - calloutY) ** 2)

                            if (distance <= size / 2) {
                                isOverCallout = true
                            }
                        }
                    })
                })

                canvas.style.cursor = isOverCallout ? "grab" : "default"
            }
        }

        const handleMouseUp = () => {
            if (dragState.isDragging) {
                // Dispatch event to persist the new position to the store
                const dataset = chart.data.datasets[dragState.dragDatasetIndex]
                if (dataset && dataset.pointImageConfig && dataset.pointImageConfig[dragState.dragPointIndex]) {
                    const config = dataset.pointImageConfig[dragState.dragPointIndex]

                    const updateEvent = new CustomEvent('calloutPositionUpdate', {
                        detail: {
                            datasetIndex: dragState.dragDatasetIndex,
                            pointIndex: dragState.dragPointIndex,
                            calloutX: config.calloutX,
                            calloutY: config.calloutY
                        }
                    })
                    canvas.dispatchEvent(updateEvent)
                }

                dragState.isDragging = false
                dragState.dragDatasetIndex = -1
                dragState.dragPointIndex = -1
                canvas.style.cursor = "default"
            }
        }

        // Touch event handlers for mobile/tablet support
        const handleTouchStart = (event: TouchEvent) => {
            if (event.touches.length !== 1) return
            const touch = event.touches[0]
            const rect = canvas.getBoundingClientRect()
            const x = touch.clientX - rect.left
            const y = touch.clientY - rect.top

            // Check if touching a callout (same logic as mouse)
            chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
                if (!dataset.pointImageConfig) return

                const meta = chart.getDatasetMeta(datasetIndex)
                if (!meta || !meta.data) return

                // Iterate over visible elements only (meta.data is already filtered)
                meta.data.forEach((element: any, filteredPointIndex: number) => {
                    const pointIndex = filteredPointIndex
                    const config = dataset.pointImageConfig?.[pointIndex]

                    if (config && config.position === "callout" && dataset.pointImages?.[pointIndex]) {
                        if (!element) return

                        const calloutX = config.calloutX !== undefined ? config.calloutX : element.x + (config.offset || 40)
                        const calloutY = config.calloutY !== undefined ? config.calloutY : element.y - (config.offset || 40)
                        const size = config.size || 30

                        const distance = Math.sqrt((x - calloutX) ** 2 + (y - calloutY) ** 2)

                        if (distance <= size / 2) {
                            dragState.isDragging = true
                            dragState.dragDatasetIndex = datasetIndex
                            dragState.dragPointIndex = pointIndex
                            dragState.dragOffsetX = x - calloutX
                            dragState.dragOffsetY = y - calloutY
                            canvas.style.cursor = "grabbing"
                            event.preventDefault()
                        }
                    }
                })
            })
        }

        const handleTouchMove = (event: TouchEvent) => {
            if (event.touches.length !== 1) return
            const touch = event.touches[0]
            const rect = canvas.getBoundingClientRect()
            const x = touch.clientX - rect.left
            const y = touch.clientY - rect.top

            if (dragState.isDragging) {
                // Update callout position
                const dataset = chart.data.datasets[dragState.dragDatasetIndex]
                if (dataset && dataset.pointImageConfig && dataset.pointImageConfig[dragState.dragPointIndex]) {
                    const config = dataset.pointImageConfig[dragState.dragPointIndex]

                    config.calloutX = x - dragState.dragOffsetX
                    config.calloutY = y - dragState.dragOffsetY

                    // Redraw chart
                    chart.update("none")
                }
                event.preventDefault()
            }
        }

        const handleTouchEnd = (event: TouchEvent) => {
            if (dragState.isDragging) {
                dragState.isDragging = false
                dragState.dragDatasetIndex = -1
                dragState.dragPointIndex = -1
                canvas.style.cursor = "default"
                event.preventDefault()
            }
        }

        // Add event listeners for both mouse and touch
        canvas.addEventListener("mousedown", handleMouseDown)
        canvas.addEventListener("mousemove", handleMouseMove)
        canvas.addEventListener("mouseup", handleMouseUp)

        // Touch event listeners for mobile/tablet support
        canvas.addEventListener("touchstart", handleTouchStart, { passive: false })
        canvas.addEventListener("touchmove", handleTouchMove, { passive: false })
        canvas.addEventListener("touchend", handleTouchEnd, { passive: false })
        canvas.addEventListener("mouseleave", handleMouseUp) // Stop dragging when leaving canvas

        // Store references for cleanup
        chart._imagePluginListeners = {
            mousedown: handleMouseDown,
            mousemove: handleMouseMove,
            mouseup: handleMouseUp,
            mouseleave: handleMouseUp,
        }
    },
    beforeDestroy: (chart: any) => {
        // Clean up event listeners
        if (chart._imagePluginListeners) {
            const canvas = chart.canvas
            Object.entries(chart._imagePluginListeners).forEach(([event, handler]) => {
                canvas.removeEventListener(event, handler as EventListener)
            })
            delete chart._imagePluginListeners
        }
    },
}

// Helper function to render image within a rectangle with optional fitting mode
function renderImageInRect(ctx: any, img: any, x: number, y: number, width: number, height: number, fitMode: 'cover' | 'contain' | 'fill' | string = 'fill') {
    if (fitMode === 'fill') {
        ctx.drawImage(img, x, y, width, height)
        return
    }

    const imgRatio = img.width / img.height
    const targetRatio = width / height

    let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0

    if (fitMode === 'cover') {
        // Cover: maintain aspect ratio and cover entire area
        if (imgRatio > targetRatio) {
            // Image is wider than target (relative to height)
            drawHeight = height
            drawWidth = drawHeight * imgRatio
            offsetX = (width - drawWidth) / 2
        } else {
            // Image is taller than target (relative to width)
            drawWidth = width
            drawHeight = drawWidth / imgRatio
            offsetY = (height - drawHeight) / 2
        }
    } else {
        // Contain (default fallback for 'contain' or others)
        if (imgRatio > targetRatio) {
            // Image is wider than target
            drawWidth = width
            drawHeight = drawWidth / imgRatio
            offsetY = (height - drawHeight) / 2
        } else {
            // Image is taller than target
            drawHeight = height
            drawWidth = drawHeight * imgRatio
            offsetX = (width - drawWidth) / 2
        }
    }

    ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight)
}

// Render image for vertical bar charts
function renderBarImageVertical(ctx: any, element: any, img: any, config: any) {
    const size = config.size || 30
    const x = element.x
    let y = element.y

    // If fill mode is enabled, fill the entire bar with the image
    if (config.fillBar) {
        const barWidth = element.width
        const barHeight = Math.abs(element.y - element.base)

        // Calculate position (top-left corner of the bar)
        const barX = element.x - barWidth / 2
        const barY = Math.min(element.y, element.base)

        // Draw the image to fill the entire bar
        ctx.save()
        ctx.beginPath()
        ctx.rect(barX, barY, barWidth, barHeight)
        ctx.clip()

        renderImageInRect(ctx, img, barX, barY, barWidth, barHeight, config.imageFit)

        ctx.restore()
        return
    }

    // Original positioning logic for non-fill mode
    switch (config.position) {
        case "center":
            // Center of the bar: halfway between top (element.y) and base (element.base)
            y = ((element.y ?? 0) + (element.base ?? 0)) / 2;
            break
        case "above":
            // Just above the bar
            y = (element.y ?? 0) - size / 2 - 8;
            break
        case "below":
            // Just inside the bottom of the bar
            y = (element.base ?? 0) - size / 2 - 8;
            break
        case "callout":
            // Callout position - handled separately
            const chart = element.chart;
            const datasetIndex = element._datasetIndex || 0;
            const pointIndex = element._index || 0;
            renderCalloutImage(ctx, element.x, element.y, img, config, datasetIndex, pointIndex, chart)
            return
        default:
            y = element.y - size / 2 - 5
            break
    }

    drawImageWithClipping(ctx, x - size / 2, y - size / 2, size, size, img, config.type)
}

// Render image for horizontal bar charts
function renderBarImageHorizontal(ctx: any, element: any, img: any, config: any) {
    const size = config.size || 30
    let x = element.x
    const y = element.y

    // If fill mode is enabled, fill the entire bar with the image
    if (config.fillBar) {
        // Improved fallback for barHeight
        let barHeight = element.height;
        if (!barHeight || barHeight <= 0) {
            // Try to estimate from meta data if available
            const meta = element.$context?.dataset?.meta;
            if (meta && meta.data && meta.data.length > 1) {
                const idx = element.$context.dataIndex;
                if (meta.data[idx + 1]) {
                    barHeight = Math.abs(meta.data[idx + 1].y - element.y);
                }
            }
            // Fallback to a larger default if still not found
            if (!barHeight || barHeight <= 0) barHeight = 40;
        }
        const barWidth = Math.abs(element.x - element.base)

        // Calculate position (top-left corner of the bar)
        const barX = Math.min(element.x, element.base)
        const barY = element.y - barHeight / 2

        // Draw the image to fill the entire bar
        ctx.save()
        ctx.beginPath()
        ctx.rect(barX, barY, barWidth, barHeight)
        ctx.clip()

        renderImageInRect(ctx, img, barX, barY, barWidth, barHeight, config.imageFit)

        ctx.restore()
        return
    }

    // Original positioning logic for non-fill mode
    switch (config.position) {
        case "center":
            // Center of the bar: halfway between left (element.base) and right (element.x)
            x = ((element.x ?? 0) + (element.base ?? 0)) / 2;
            break
        case "above":
            // Right end of the bar
            x = (element.x ?? 0) + size / 2 + 8;
            break
        case "below":
            // Just inside the left end of the bar
            const barStart = Math.min(element.x ?? 0, element.base ?? 0);
            x = barStart + size / 2 + 8;
            break
        case "callout":
            // Callout position - handled separately
            const chart = element.chart;
            const datasetIndex = element._datasetIndex || 0;
            const pointIndex = element._index || 0;
            renderCalloutImage(ctx, element.x, element.y, img, config, datasetIndex, pointIndex, chart)
            return
        default:
            x = element.x + (element.base - element.x) / 2
            break
    }

    drawImageWithClipping(ctx, x - size / 2, y - size / 2, size, size, img, config.type)
}

// Render image for point-based charts with proper positioning
function renderPointImage(ctx: any, element: any, img: any, config: any) {
    const size = config.size || 25
    let x = element.x
    let y = element.y

    switch (config.position) {
        case "center":
            // Center on the point
            break
        case "above":
            // Above the point
            y = (element.y ?? 0) - size / 2 - 12;
            break
        case "below":
            // Below the point
            y = (element.y ?? 0) + size / 2 + 12;
            break
        case "callout":
            // Callout position - handled separately
            const chart = element.chart;
            const datasetIndex = element._datasetIndex || 0;
            const pointIndex = element._index || 0;
            renderCalloutImage(ctx, element.x, element.y, img, config, datasetIndex, pointIndex, chart)
            return
        default:
            break
    }

    drawImageWithClipping(ctx, x - size / 2, y - size / 2, size, size, img, config.type)
}

// Enhanced callout rendering with configurable border and shape
function renderCalloutImage(
    ctx: any,
    pointX: any,
    pointY: any,
    img: any,
    config: any,
    datasetIndex: number,
    pointIndex: number,
    chart: any,
) {
    const size = config.size || 30
    const offset = config.offset || 40

    // Use stored position or calculate default
    let calloutX = config.calloutX
    let calloutY = config.calloutY
    if (calloutX === undefined || calloutY === undefined) {
        const chartType = chart.config.type
        if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
            const centerX = chart.chartArea.left + chart.chartArea.width / 2
            const centerY = chart.chartArea.top + chart.chartArea.height / 2
            const meta = chart.getDatasetMeta(datasetIndex)
            const el = meta?.data?.[pointIndex]
            const startAngle = el?.startAngle ?? 0
            const endAngle = el?.endAngle ?? 0
            const midAngle = (startAngle + endAngle) / 2
            const outerRadius = el?.outerRadius ?? Math.min(chart.chartArea.width, chart.chartArea.height) / 2
            const r = outerRadius + offset
            calloutX = centerX + Math.cos(midAngle) * r
            calloutY = centerY + Math.sin(midAngle) * r
        } else {
            calloutX = pointX + offset
            calloutY = pointY - offset
        }
    }

    // Store the calculated position back to config for dragging
    if (config.calloutX === undefined) config.calloutX = calloutX
    if (config.calloutY === undefined) config.calloutY = calloutY

    // Draw arrow line and head if enabled
    const arrowLine = config.arrowLine !== false
    const arrowHead = config.arrowHead !== false
    const gap = config.arrowEndGap ?? 8

    if (arrowLine || arrowHead) {
        ctx.strokeStyle = config.arrowColor || "#666"
        ctx.lineWidth = 2
        ctx.setLineDash([])

        // Calculate arrow path based on chart type
        const chartType = chart.config.type
        let startX = pointX
        let startY = pointY

        // Adjust start point for different chart types
        if (chartType === "pie" || chartType === "doughnut" || chartType === "polarArea") {
            // Anchor to this slice's outer mid-angle so arrows don't all start at one point
            const centerX = chart.chartArea.left + chart.chartArea.width / 2
            const centerY = chart.chartArea.top + chart.chartArea.height / 2
            const meta = chart.getDatasetMeta(datasetIndex)
            const el = meta?.data?.[pointIndex]
            const startAngle = el?.startAngle ?? 0
            const endAngle = el?.endAngle ?? 0
            const midAngle = (startAngle + endAngle) / 2
            const radius = el?.outerRadius ?? Math.min(chart.chartArea.width, chart.chartArea.height) / 2
            startX = centerX + Math.cos(midAngle) * radius
            startY = centerY + Math.sin(midAngle) * radius
        } else if (chartType === "bar") {
            if (chart.config.options?.indexAxis === "y") {
                startX = pointX
                startY = pointY
            } else {
                startX = pointX
                startY = pointY
            }
        }

        // Calculate the end point (image center) and apply arrowEndGap
        let endX = calloutX
        let endY = calloutY
        if (gap > 0) {
            const angle = Math.atan2(endY - startY, endX - startX)
            endX = endX - gap * Math.cos(angle)
            endY = endY - gap * Math.sin(angle)
        }

        // Optional two-segment elbow leader support
        const useElbow = config.arrowSegments === 2
        let bendX: number | undefined = config.arrowBendX
        let bendY: number | undefined = config.arrowBendY
        if ((bendX == null || bendY == null) && config.arrowBendRelX != null && config.arrowBendRelY != null) {
            bendX = config.arrowBendRelX * chart.width
            bendY = config.arrowBendRelY * chart.height
        }
        if (useElbow && (bendX == null || bendY == null)) {
            // Default elbow path optimized for pies: short radial segment, then to callout
            if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
                const meta = chart.getDatasetMeta(datasetIndex)
                const el = meta?.data?.[pointIndex]
                const startAngle = el?.startAngle ?? 0
                const endAngle = el?.endAngle ?? 0
                const midAngle = (startAngle + endAngle) / 2
                const elbow = (config.arrowElbowLength ?? 14)
                bendX = startX + Math.cos(midAngle) * elbow
                bendY = startY + Math.sin(midAngle) * elbow
            } else {
                bendX = startX + (endX - startX) * 0.2
                bendY = startY
            }
        }

        // Draw the arrow line if enabled
        if (arrowLine) {
            ctx.beginPath()
            ctx.moveTo(startX, startY)
            if (useElbow) {
                ctx.lineTo(bendX as number, bendY as number)
                ctx.lineTo(endX, endY)
            } else {
                ctx.lineTo(endX, endY)
            }
            ctx.stroke()
        }

        // Draw arrow head if enabled
        if (arrowHead) {
            // Arrow head should follow the last segment's direction
            let prevX = startX
            let prevY = startY
            if (useElbow) {
                prevX = (bendX as number)
                prevY = (bendY as number)
            }
            const angle = Math.atan2(endY - prevY, endX - prevX)
            const arrowLength = 12
            ctx.beginPath()
            ctx.moveTo(endX, endY)
            ctx.lineTo(
                endX - arrowLength * Math.cos(angle - Math.PI / 6),
                endY - arrowLength * Math.sin(angle - Math.PI / 6),
            )
            ctx.moveTo(endX, endY)
            ctx.lineTo(
                endX - arrowLength * Math.cos(angle + Math.PI / 6),
                endY - arrowLength * Math.sin(angle + Math.PI / 6),
            )
            ctx.stroke()
        }
    }

    // Get image type/shape from config (default to circle)
    const imageType = config.type || "circle"

    // Draw image with configurable clipping shape
    drawImageWithClipping(ctx, calloutX - size / 2, calloutY - size / 2, size, size, img, imageType)

    // Draw configurable border around callout
    const borderWidth = config.borderWidth !== undefined ? config.borderWidth : 3
    const borderColor = config.borderColor || "#ffffff"

    if (borderWidth > 0) {
        ctx.strokeStyle = borderColor
        ctx.lineWidth = borderWidth

        // Calculate actual image dimensions for regular type
        let borderX = calloutX - size / 2
        let borderY = calloutY - size / 2
        let borderW = size
        let borderH = size

        if (imageType === "regular") {
            // Calculate the actual rendered dimensions (preserving aspect ratio)
            const imgAspectRatio = img.naturalWidth / img.naturalHeight
            const targetAspectRatio = size / size

            if (imgAspectRatio > targetAspectRatio) {
                // Image is wider - fit to width
                borderH = size / imgAspectRatio
                borderY = calloutY - borderH / 2
            } else {
                // Image is taller - fit to height
                borderW = size * imgAspectRatio
                borderX = calloutX - borderW / 2
            }
        }

        if (imageType === "circle") {
            ctx.beginPath()
            ctx.arc(calloutX, calloutY, size / 2, 0, 2 * Math.PI)
            ctx.stroke()
        } else if (imageType === "square") {
            ctx.beginPath()
            ctx.rect(calloutX - size / 2, calloutY - size / 2, size, size)
            ctx.stroke()
        } else if (imageType === "regular") {
            ctx.beginPath()
            ctx.rect(borderX, borderY, borderW, borderH)
            ctx.stroke()
        } else if (imageType === "rounded") {
            const radius = size * 0.15 // 15% border radius
            ctx.beginPath()
            roundRect(ctx, calloutX - size / 2, calloutY - size / 2, size, size, radius)
            ctx.stroke()
        }

        // Add shadow for better visibility
        ctx.save()
        ctx.shadowColor = "rgba(0,0,0,0.2)"
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2

        if (imageType === "circle") {
            ctx.beginPath()
            ctx.arc(calloutX, calloutY, size / 2, 0, 2 * Math.PI)
            ctx.stroke()
        } else if (imageType === "square") {
            ctx.beginPath()
            ctx.rect(calloutX - size / 2, calloutY - size / 2, size, size)
            ctx.stroke()
        } else if (imageType === "regular") {
            ctx.beginPath()
            ctx.rect(borderX, borderY, borderW, borderH)
            ctx.stroke()
        } else if (imageType === "rounded") {
            const radius = size * 0.15
            ctx.beginPath()
            roundRect(ctx, calloutX - size / 2, calloutY - size / 2, size, size, radius)
            ctx.stroke()
        }

        ctx.restore()
    }
}

// Helper function to draw images with different clipping shapes
function drawImageWithClipping(ctx: any, x: any, y: any, width: any, height: any, img: any, type: string) {
    ctx.save()

    if (type === "regular") {
        // Regular: Preserve aspect ratio, scale to fit within bounds, center it
        renderImageInRect(ctx, img, x, y, width, height, 'contain')
    } else {
        // Apply clipping for circle, square, or rounded
        if (type === "circle") {
            ctx.beginPath()
            ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI)
            ctx.clip()
        } else if (type === "square") {
            ctx.beginPath()
            ctx.rect(x, y, width, height)
            ctx.clip()
        } else if (type === "rounded") {
            const radius = Math.min(width, height) * 0.15 // 15% border radius
            ctx.beginPath()
            roundRect(ctx, x, y, width, height, radius)
            ctx.clip()
        }

        ctx.drawImage(img, x, y, width, height)
    }

    ctx.restore()
}

// Helper function to draw rounded rectangles
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
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

// Render image for pie/doughnut/polarArea charts
function renderSliceImage(ctx: any, element: any, img: any, config: any) {
    // Check if this is a fill slice request
    if (config.fillSlice) {
        renderSliceFillImage(ctx, element, img, config);
        return;
    }

    const size = config.size || 30
    const chart = element._chart || element.chart
    const chartArea = chart.chartArea
    const centerX = chartArea.left + chartArea.width / 2
    const centerY = chartArea.top + chartArea.height / 2

    // For Chart.js, element has startAngle, endAngle, innerRadius, outerRadius
    const startAngle = element.startAngle || 0
    const endAngle = element.endAngle || 0
    const midAngle = (startAngle + endAngle) / 2
    const innerRadius = element.innerRadius || 0
    const outerRadius = element.outerRadius || Math.min(chartArea.width, chartArea.height) / 2

    let x, y
    switch (config.position) {
        case "center":
            // Center of the slice: halfway between inner and outer radius
            const r = innerRadius + (outerRadius - innerRadius) * 0.5;
            x = centerX + Math.cos(midAngle) * r;
            y = centerY + Math.sin(midAngle) * r;
            break
        case "above":
            // Above the slice: outside the outer radius
            const rAbove = outerRadius + size * 0.7;
            x = centerX + Math.cos(midAngle) * rAbove;
            y = centerY + Math.sin(midAngle) * rAbove;
            break
        case "below":
            // Below the slice: closer to inner radius
            const rBelow = innerRadius + (outerRadius - innerRadius) * 0.2;
            x = centerX + Math.cos(midAngle) * rBelow;
            y = centerY + Math.sin(midAngle) * rBelow;
            break
        case "callout":
            // Callout position - handled separately
            renderCalloutImage(ctx, element.x, element.y, img, config, element._datasetIndex, element._index, chart)
            return
        default:
            x = element.x
            y = element.y
            break
    }

    drawImageWithClipping(ctx, x - size / 2, y - size / 2, size, size, img, config.type)
}

function renderSliceFillImage(ctx: any, element: any, img: any, config: any) {
    const chart = element._chart || element.chart
    const chartArea = chart.chartArea
    const centerX = chartArea.left + chartArea.width / 2
    const centerY = chartArea.top + chartArea.height / 2

    // Get slice geometry
    const startAngle = element.startAngle || 0
    const endAngle = element.endAngle || 0
    const innerRadius = element.innerRadius || 0
    const outerRadius = element.outerRadius || Math.min(chartArea.width, chartArea.height) / 2

    // Save context for clipping
    ctx.save()

    // Create clipping path for the slice
    ctx.beginPath()
    if (innerRadius > 0) {
        ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle)
        ctx.lineTo(centerX + Math.cos(endAngle) * innerRadius, centerY + Math.sin(endAngle) * innerRadius)
        ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true)
        ctx.closePath()
    } else {
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle)
        ctx.closePath()
    }
    ctx.clip()

    const imageFit = config.imageFit || 'cover'
    if (imageFit === 'contain') {
        // --- Mathematically correct: largest rectangle fully inside the sector ---
        const sliceAngle = Math.abs(endAngle - startAngle)
        const imgAspect = img.width / img.height
        let best = { area: 0, x: 0, y: 0, w: 0, h: 0 }
        const angleSteps = 30
        const radiusSteps = 30
        for (let ai = 0; ai <= angleSteps; ai++) {
            const fracA = ai / angleSteps
            const theta = startAngle + fracA * (endAngle - startAngle)
            for (let ri = 0; ri <= radiusSteps; ri++) {
                const fracR = ri / radiusSteps
                const r = innerRadius + fracR * (outerRadius - innerRadius)
                // Binary search for max width
                let low = 0, high = outerRadius - innerRadius, maxW = 0, maxH = 0
                for (let iter = 0; iter < 10; iter++) {
                    const mid = (low + high) / 2
                    let w, h
                    if (imgAspect > 1) {
                        w = mid
                        h = w / imgAspect
                    } else {
                        h = mid
                        w = h * imgAspect
                    }
                    // Rectangle corners in cartesian
                    const corners = [
                        { dx: -w / 2, dy: -h / 2 },
                        { dx: w / 2, dy: -h / 2 },
                        { dx: w / 2, dy: h / 2 },
                        { dx: -w / 2, dy: h / 2 },
                    ].map(({ dx, dy }) => {
                        // Place center at (cx,cy)
                        const cx = centerX + Math.cos(theta) * r
                        const cy = centerY + Math.sin(theta) * r
                        return { x: cx + dx, y: cy + dy }
                    })
                    // Check all corners are inside the sector
                    const allInside = corners.every(({ x, y }) => {
                        const relX = x - centerX
                        const relY = y - centerY
                        const rad = Math.sqrt(relX * relX + relY * relY)
                        let ang = Math.atan2(relY, relX)
                        if (ang < 0) ang += 2 * Math.PI
                        let sA = startAngle, eA = endAngle
                        if (sA < 0) sA += 2 * Math.PI
                        if (eA < 0) eA += 2 * Math.PI
                        if (eA < sA) eA += 2 * Math.PI
                        if (ang < sA) ang += 2 * Math.PI
                        return (
                            rad >= innerRadius - 0.5 && rad <= outerRadius + 0.5 &&
                            ang >= sA - 1e-6 && ang <= eA + 1e-6
                        )
                    })
                    if (allInside) {
                        maxW = w; maxH = h; low = mid
                    } else {
                        high = mid
                    }
                }
                if (maxW > 0 && maxH > 0 && maxW * maxH > best.area) {
                    // Place center at (cx,cy)
                    const cx = centerX + Math.cos(theta) * r
                    const cy = centerY + Math.sin(theta) * r
                    best = { area: maxW * maxH, x: cx - maxW / 2, y: cy - maxH / 2, w: maxW, h: maxH }
                }
            }
        }
        if (best.area > 0) {
            ctx.drawImage(img, best.x, best.y, best.w, best.h)
        }
    } else {
        // --- Calculate the bounding box for the current slice only ---
        const points = []
        const steps = 100 // More steps = more accurate bounding box
        for (let i = 0; i <= steps; i++) {
            const angle = startAngle + (endAngle - startAngle) * (i / steps)
            points.push([
                centerX + Math.cos(angle) * outerRadius,
                centerY + Math.sin(angle) * outerRadius
            ])
            if (innerRadius > 0) {
                points.push([
                    centerX + Math.cos(angle) * innerRadius,
                    centerY + Math.sin(angle) * innerRadius
                ])
            }
        }
        const xs = points.map(p => p[0])
        const ys = points.map(p => p[1])
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)
        const sliceWidth = maxX - minX
        const sliceHeight = maxY - minY

        // Use renderImageInRect for both fill and cover (default) cases
        // renderImageInRect handles the aspect ratio logic for cover
        renderImageInRect(ctx, img, minX, minY, sliceWidth, sliceHeight, imageFit === 'fill' ? 'fill' : 'cover')
    }
    ctx.restore()
}

// Define the return type for getImageOptionsForChartType
export interface ImageOptions {
    types: { value: string; label: string }[];
    positions: { value: string; label: string }[];
    supportsArrow: boolean;
    supportsFill?: boolean;
}

export const getImageOptionsForChartType = (chartType: SupportedChartType): ImageOptions => {
    const type = chartType === 'area' ? 'line' : chartType;
    switch (type) {
        case 'bar':
        case 'horizontalBar':
        case 'stackedBar':
            return {
                types: [
                    { value: 'square', label: 'Square' },
                    { value: 'circle', label: 'Circle' },
                    { value: 'regular', label: 'Regular' },
                ],
                positions: [
                    { value: 'center', label: 'Center' },
                    { value: 'above', label: 'Above' },
                    { value: 'below', label: 'Bottom' },
                    { value: 'callout', label: 'Callout with Arrow' },
                ],
                supportsArrow: true,
                supportsFill: true,
            };
        case 'line':
        case 'scatter':
            return {
                types: [
                    { value: "circle", label: "Circle" },
                    { value: "square", label: "Square" },
                    { value: "regular", label: "Regular" },
                ],
                positions: [
                    { value: "center", label: "Center" },
                    { value: "above", label: "Above" },
                    { value: "below", label: "Bottom" },
                    { value: "callout", label: "Callout with Arrow" },
                ],
                supportsArrow: true,
                supportsFill: true,
            }
        case 'bubble':
            return {
                types: [
                    { value: "circle", label: "Circle" },
                    { value: "square", label: "Square" },
                    { value: "regular", label: "Regular" },
                ],
                positions: [
                    { value: "center", label: "Center" },
                    { value: "above", label: "Above" },
                    { value: "callout", label: "Callout with Arrow" },
                ],
                supportsArrow: true,
                supportsFill: true,
            }
        case 'radar':
            return {
                types: [
                    { value: "circle", label: "Circle" },
                    { value: "square", label: "Square" },
                    { value: "regular", label: "Regular" },
                ],
                positions: [
                    { value: "center", label: "Center" },
                    { value: "above", label: "Above" },
                    { value: "below", label: "Bottom" },
                    { value: "callout", label: "Callout with Arrow" },
                ],
                supportsArrow: true,
                supportsFill: true,
            }
        case 'pie':
        case 'doughnut':
        case 'polarArea':
            return {
                types: [
                    { value: "circle", label: "Circle" },
                    { value: "square", label: "Square" },
                    { value: "regular", label: "Regular" },
                ],
                positions: [
                    { value: "center", label: "Center" },
                    { value: "above", label: "Above" },
                    { value: "below", label: "Bottom" },
                    { value: "callout", label: "Callout with Arrow" },
                ],
                supportsArrow: true,
                supportsFill: true,
            }
        default:
            return {
                types: [
                    { value: "circle", label: "Circle" },
                    { value: "regular", label: "Regular" },
                ],
                positions: [
                    { value: "center", label: "Center" },
                    { value: "callout", label: "Callout with Arrow" },
                ],
                supportsArrow: true,
                supportsFill: true,
            }
    }
}

export const getDefaultImageType = (chartType: SupportedChartType): string => {
    return "regular"
}

export const getDefaultImageSize = (chartType: SupportedChartType): number => {
    switch (chartType) {
        case 'pie':
        case 'doughnut':
        case 'polarArea':
            return 24
        case 'bar':
        case 'horizontalBar':
            return 20
        case 'line':
        case 'scatter':
        case 'bubble':
        case 'radar':
            return 16
        default:
            return 20
    }
}

// Helper function to get complete default image configuration
export const getDefaultImageConfig = (chartType: SupportedChartType): PointImageConfig => {
    return {
        type: getDefaultImageType(chartType),
        size: getDefaultImageSize(chartType),
        position: "center",
        arrow: false,
        arrowColor: "#666666",
        borderWidth: 3,
        borderColor: "#ffffff",
        offset: 40,
        fillSlice: false,
        fillBar: false,
        imageFit: 'cover',
    }
}
