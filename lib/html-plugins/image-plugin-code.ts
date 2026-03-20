/**
 * Generate the universal image plugin code for HTML export
 */
export function generateUniversalImagePluginCode(): string {
  return `
// Universal Image Plugin for HTML Export
const universalImagePlugin = {
  id: "universalImages",
  afterDraw: (chart) => {
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (!meta || !meta.data || !dataset.pointImages) return;
      // Respect default Chart.js dataset visibility
      if (typeof chart.isDatasetVisible === 'function' && chart.isDatasetVisible(datasetIndex) === false) return;

      meta.data.forEach((element, pointIndex) => {
        // Respect per-slice visibility for pie/doughnut/polarArea
        if ((chart.config?.type === 'pie' || chart.config?.type === 'doughnut' || chart.config?.type === 'polarArea' || chart.config?.type === 'pie3d' || chart.config?.type === 'doughnut3d') &&
            typeof chart.getDataVisibility === 'function' && chart.getDataVisibility(pointIndex) === false) {
          return;
        }
        const imageUrl = dataset.pointImages[pointIndex];
        const imageConfig = dataset.pointImageConfig?.[pointIndex] || getDefaultImageConfig(chart.config.type || 'bar');

        if (imageUrl && element) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            ctx.save();
            const chartType = chart.config.type;
            const x = element.x;
            const y = element.y;

            // Add chart reference to element
            element.chart = chart;

            // Handle callout position for all chart types
            if (imageConfig.position === "callout") {
              renderCalloutImage(ctx, x, y, img, imageConfig, datasetIndex, pointIndex, chart);
              ctx.restore();
              return;
            }

            const isFillEnabled = imageConfig.fillSlice || imageConfig.fillBar;
            if (chartType === "pie" || chartType === "doughnut" || chartType === "polarArea" || chartType === "pie3d" || chartType === "doughnut3d") {
              // Priority: if fill is enabled, call renderSliceImage which internally handles both
              renderSliceImage(ctx, element, img, imageConfig);
            } else if (chartType === "bar" || chartType === "bar3d" || chartType === "horizontalBar3d" || chartType === "horizontalBar" || chartType === "stackedBar") {
              if (isFillEnabled) {
                if (chart.config.options?.indexAxis === "y" || chartType === "horizontalBar" || chartType === "horizontalBar3d") {
                  renderBarImageHorizontal(ctx, element, img, imageConfig);
                } else {
                  renderBarImageVertical(ctx, element, img, imageConfig);
                }
              } else {
                // Non-fill bar rendering (center by default if implemented)
                renderPointImage(ctx, element, img, imageConfig);
              }
            } else if (
              chartType === "line" ||
              chartType === "scatter" ||
              chartType === "bubble" ||
              chartType === "radar"
            ) {
              renderPointImage(ctx, element, img, imageConfig);
            }

            ctx.restore();
          };
          img.src = imageUrl;
        }
      });
    });
  },
  afterInit: (chart) => {
    // Set up event listeners for dragging
    const canvas = chart.canvas;
    let isHovering = false;

    const handleMouseDown = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Check if clicking on a callout
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        if (!dataset.pointImageConfig) return;

        dataset.pointImageConfig.forEach((config, pointIndex) => {
          if (config.position === "callout" && dataset.pointImages[pointIndex]) {
            const meta = chart.getDatasetMeta(datasetIndex);
            const element = meta.data[pointIndex];

            if (!element) return;

            // Detect 3D pie/bar for hit-testing
            const pie3dOpts = (chart.options.plugins && chart.options.plugins.pie3d) || {};
            const isPie3dActive = !!(pie3dOpts.enabled);
            const tilt = isPie3dActive ? (typeof pie3dOpts.tilt === 'number' ? pie3dOpts.tilt : 0.75) : 1.0;
            const chartArea = chart.chartArea;
            const centerY_chart = chartArea ? (chartArea.top + chartArea.bottom) / 2 : 0;
            const transformY = (y_val) => isPie3dActive ? centerY_chart + (y_val - centerY_chart) * tilt : y_val;

            const bar3dOpts = (chart.options.plugins && chart.options.plugins.bar3d) || chart.options.bar3d || {};
            const isBar3dActive = !!(bar3dOpts.enabled !== false && (chart.config.type === 'bar3d' || chart.config.type === 'horizontalBar3d' || bar3dOpts.enabled));
            let dy = 0;
            if (isBar3dActive) {
                const depth = typeof bar3dOpts.depth === 'number' ? bar3dOpts.depth : 12;
                const angleRad = (typeof bar3dOpts.angle === 'number' ? bar3dOpts.angle : 45) * Math.PI / 180;
                dy = -Math.sin(angleRad) * depth;
            }

            let defaultX, defaultY;
            if (chart.config.type === 'pie' || chart.config.type === 'doughnut' || chart.config.type === 'polarArea') {
                const centerX = chart.chartArea.left + chart.chartArea.width / 2;
                const centerY = chart.chartArea.top + chart.chartArea.height / 2;
                const startAngle = element.startAngle || 0;
                const endAngle = element.endAngle || 0;
                const midAngle = (startAngle + endAngle) / 2;
                const radius = element.outerRadius || Math.min(chart.chartArea.width, chart.chartArea.height) / 2;
                const r = radius + (config.offset || 40);
                defaultX = centerX + Math.cos(midAngle) * r;
                defaultY = transformY(centerY + Math.sin(midAngle) * r);
            } else {
                defaultX = element.x + (config.offset || 40);
                defaultY = (element.y + (isBar3dActive && dy < 0 ? dy : 0)) - (config.offset || 40);
            }

            const calloutX = config.calloutX !== undefined ? config.calloutX : defaultX;
            const calloutY = config.calloutY !== undefined ? config.calloutY : defaultY;
            const size = config.size || 30;

            const distance = Math.sqrt((x - calloutX) ** 2 + (y - calloutY) ** 2);

            if (distance <= size / 2) {
              window.imageDragState.isDragging = true;
              window.imageDragState.dragDatasetIndex = datasetIndex;
              window.imageDragState.dragPointIndex = pointIndex;
              window.imageDragState.dragOffsetX = x - calloutX;
              window.imageDragState.dragOffsetY = y - calloutY;
              canvas.style.cursor = "grabbing";
              event.preventDefault();
            }
          }
        });
      });
    };

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (window.imageDragState.isDragging) {
        // Update callout position
        const dataset = chart.data.datasets[window.imageDragState.dragDatasetIndex];
        const config = dataset.pointImageConfig[window.imageDragState.dragPointIndex];

        config.calloutX = x - window.imageDragState.dragOffsetX;
        config.calloutY = y - window.imageDragState.dragOffsetY;

        // Redraw chart
        chart.update("none");
        event.preventDefault();
      } else {
        // Check if hovering over a callout
        let isOverCallout = false;

        chart.data.datasets.forEach((dataset, datasetIndex) => {
          if (!dataset.pointImageConfig) return;

          dataset.pointImageConfig.forEach((config, pointIndex) => {
            if (config.position === "callout" && dataset.pointImages[pointIndex]) {
              const meta = chart.getDatasetMeta(datasetIndex);
              const element = meta.data[pointIndex];

              if (!element) return;

              // Detect 3D pie/bar for hover detection
              const pie3dOpts = (chart.options.plugins && chart.options.plugins.pie3d) || {};
              const isPie3dActive = !!(pie3dOpts.enabled);
              const tilt = isPie3dActive ? (typeof pie3dOpts.tilt === 'number' ? pie3dOpts.tilt : 0.75) : 1.0;
              const chartArea = chart.chartArea;
              const centerY_chart = chartArea ? (chartArea.top + chartArea.bottom) / 2 : 0;
              const transformY = (y_val) => isPie3dActive ? centerY_chart + (y_val - centerY_chart) * tilt : y_val;

              const bar3dOpts = (chart.options.plugins && chart.options.plugins.bar3d) || {};
              const isBar3dActive = !!(bar3dOpts.enabled);
              let dy = 0;
              if (isBar3dActive) {
                  const depth = typeof bar3dOpts.depth === 'number' ? bar3dOpts.depth : 12;
                  const angleRad = (typeof bar3dOpts.angle === 'number' ? bar3dOpts.angle : 45) * Math.PI / 180;
                  dy = -Math.sin(angleRad) * depth;
              }

              let defaultX, defaultY;
              if (chart.config.type === 'pie' || chart.config.type === 'doughnut' || chart.config.type === 'polarArea') {
                  const centerX = chart.chartArea.left + chart.chartArea.width / 2;
                  const centerY = chart.chartArea.top + chart.chartArea.height / 2;
                  const startAngle = element.startAngle || 0;
                  const endAngle = element.endAngle || 0;
                  const midAngle = (startAngle + endAngle) / 2;
                  const radius = element.outerRadius || Math.min(chart.chartArea.width, chart.chartArea.height) / 2;
                  const r = radius + (config.offset || 40);
                  defaultX = centerX + Math.cos(midAngle) * r;
                  defaultY = transformY(centerY + Math.sin(midAngle) * r);
              } else {
                  defaultX = element.x + (config.offset || 40);
                  defaultY = (element.y + (isBar3dActive && dy < 0 ? dy : 0)) - (config.offset || 40);
              }

              const calloutX = config.calloutX !== undefined ? config.calloutX : defaultX;
              const calloutY = config.calloutY !== undefined ? config.calloutY : defaultY;
              const size = config.size || 30;

              const distance = Math.sqrt((x - calloutX) ** 2 + (y - calloutY) ** 2);

              if (distance <= size / 2) {
                isOverCallout = true;
              }
            }
          });
        });

        if (isOverCallout) {
          canvas.style.cursor = "grab";
          isHovering = true;
        } else if (isHovering) {
          canvas.style.cursor = "default";
          isHovering = false;
        }
      }
    };

    const handleMouseUp = () => {
      if (window.imageDragState.isDragging) {
        window.imageDragState.isDragging = false;
        isHovering = false;
        window.imageDragState.dragDatasetIndex = -1;
        window.imageDragState.dragPointIndex = -1;
        canvas.style.cursor = "default";
      }
    };

    // Touch event handlers for mobile/tablet support
    const handleTouchStart = (event) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Check if touching a callout (same logic as mouse)
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        if (!dataset.pointImageConfig) return;

        dataset.pointImageConfig.forEach((config, pointIndex) => {
          if (config.position === "callout" && dataset.pointImages[pointIndex]) {
            const meta = chart.getDatasetMeta(datasetIndex);
            const element = meta.data[pointIndex];

            if (!element) return;

            const calloutX = config.calloutX !== undefined ? config.calloutX : element.x + (config.offset || 40);
            const calloutY = config.calloutY !== undefined ? config.calloutY : element.y - (config.offset || 40);
            const size = config.size || 30;

            const distance = Math.sqrt((x - calloutX) ** 2 + (y - calloutY) ** 2);

            if (distance <= size / 2) {
              window.imageDragState.isDragging = true;
              window.imageDragState.dragDatasetIndex = datasetIndex;
              window.imageDragState.dragPointIndex = pointIndex;
              window.imageDragState.dragOffsetX = x - calloutX;
              window.imageDragState.dragOffsetY = y - calloutY;
              canvas.style.cursor = "grabbing";
              event.preventDefault();
            }
          }
        });
      });
    };

    const handleTouchMove = (event) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (window.imageDragState.isDragging) {
        // Update callout position
        const dataset = chart.data.datasets[window.imageDragState.dragDatasetIndex];
        const config = dataset.pointImageConfig[window.imageDragState.dragPointIndex];

        config.calloutX = x - window.imageDragState.dragOffsetX;
        config.calloutY = y - window.imageDragState.dragOffsetY;

        // Redraw chart
        chart.update("none");
        event.preventDefault();
      }
    };

    const handleTouchEnd = (event) => {
      if (window.imageDragState.isDragging) {
        window.imageDragState.isDragging = false;
        isHovering = false;
        window.imageDragState.dragDatasetIndex = -1;
        window.imageDragState.dragPointIndex = -1;
        canvas.style.cursor = "default";
        event.preventDefault();
      }
    };

    // Add event listeners for both mouse and touch
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);
    
    // Touch event listeners for mobile/tablet support
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

    // Store references for cleanup
    chart._imagePluginListeners = {
      mousedown: handleMouseDown,
      mousemove: handleMouseMove,
      mouseup: handleMouseUp,
      mouseleave: handleMouseUp,
    };
  },
  beforeDestroy: (chart) => {
    // Clean up event listeners
    if (chart._imagePluginListeners) {
      const canvas = chart.canvas;
      Object.entries(chart._imagePluginListeners).forEach(([event, handler]) => {
        canvas.removeEventListener(event, handler);
      });
      delete chart._imagePluginListeners;
    }
  },
};

// Helper functions for image rendering
function getDefaultImageType(chartType) {
  return "regular";
}

function getDefaultImageSize(chartType) {
  const type = chartType || 'bar';
  if (['pie', 'doughnut', 'polarArea', 'pie3d', 'doughnut3d'].includes(type)) return 24;
  if (['bar', 'horizontalBar', 'bar3d', 'horizontalBar3d'].includes(type)) return 20;
  return 20;
}

function getDefaultImageConfig(chartType) {
  return {
    type: getDefaultImageType(chartType),
    size: getDefaultImageSize(chartType),
    position: 'center',
    arrow: false,
    arrowColor: "#666666",
    borderWidth: 3,
    borderColor: "#ffffff",
    offset: 40,
    fillSlice: false,
    fillBar: false,
    imageFit: 'cover'
  };
}

function renderImageInRect(ctx, img, x, y, w, h, fit) {
  if (fit === 'fill') {
    ctx.drawImage(img, x, y, w, h);
    return;
  }

  const imgAspect = img.width / img.height;
  const rectAspect = w / h;
  let drawX = x, drawY = y, drawWidth = w, drawHeight = h;

  if (fit === 'contain') {
    if (imgAspect > rectAspect) {
      drawWidth = w;
      drawHeight = w / imgAspect;
      drawY = y + (h - drawHeight) / 2;
    } else {
      drawHeight = h;
      drawWidth = h * imgAspect;
      drawX = x + (w - drawWidth) / 2;
    }
  } else { // cover (default)
    if (imgAspect > rectAspect) {
      drawHeight = h;
      drawWidth = h * imgAspect;
      drawX = x + (w - drawWidth) / 2;
    } else {
      drawWidth = w;
      drawHeight = w / imgAspect;
      drawY = y + (h - drawHeight) / 2;
    }
  }
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

function renderBarImageVertical(ctx, element, img, config) {
  const size = config.size || 30;
  const x = element.x;
  let y = element.y;

  // If fill mode is enabled, fill the entire bar with the image
    if (config.fillBar) {
        // Use getProps or direct properties with fallbacks
        const props = typeof element.getProps === 'function' ? element.getProps(['width', 'y', 'base', 'x'], true) : element;
        const barWidth = props.width || element.width || 20;
        const barHeight = Math.abs((props.y ?? element.y) - (props.base ?? element.base));

        // Calculate position (top-left corner of the bar)
        const barX = (props.x ?? element.x) - barWidth / 2;
        const barY = Math.min((props.y ?? element.y), (props.base ?? element.base));

        // Draw the image to fill the entire bar
        ctx.save();
        ctx.beginPath();
        ctx.rect(barX, barY, barWidth, barHeight);
        ctx.clip();

        renderImageInRect(ctx, img, barX, barY, barWidth, barHeight, config.imageFit);

        ctx.restore();
        return;
    }

  // Original positioning logic for non-fill mode
  switch (config.position) {
    case "center":
      // Center of the bar: halfway between top (element.y) and base (element.base)
      y = ((element.y ?? 0) + (element.base ?? 0)) / 2;
      break;
    case "above":
      // Detect if 3D bar is active and adjust for top face
      {
        const bar3dOptsAbove = (element.chart?.options?.plugins && element.chart.options.plugins.bar3d) || {};
        const isBar3dActiveAbove = !!(bar3dOptsAbove.enabled);
        let dyAbove = 0;
        if (isBar3dActiveAbove) {
          const depth = typeof bar3dOptsAbove.depth === 'number' ? bar3dOptsAbove.depth : 12;
          const angleRad = (typeof bar3dOptsAbove.angle === 'number' ? bar3dOptsAbove.angle : 45) * Math.PI / 180;
          dyAbove = -Math.sin(angleRad) * depth;
        }
        // Just above the (3D) bar
        y = (element.y ?? 0) + (dyAbove < 0 ? dyAbove : 0) - size / 2 - 8;
      }
      break;
    case "below":
      // Just inside the bottom of the bar
      y = (element.base ?? 0) - size / 2 - 8;
      break;
    case "callout":
      // Callout position - handled separately
      {
        const chart = element.chart;
        const datasetIndex = element._datasetIndex || 0;
        const pointIndex = element._index || 0;
        renderCalloutImage(ctx, element.x, element.y, img, config, datasetIndex, pointIndex, chart);
        return;
      }
    default:
      y = element.y - size / 2 - 5;
      break;
  }
  drawImageWithClipping(ctx, x - size / 2, y - size / 2, size, size, img, config.type);
}

function renderBarImageHorizontal(ctx, element, img, config) {
  const size = config.size || 30;
  let x = element.x;
  const y = element.y;

  // If fill mode is enabled, fill the entire bar with the image
  if (config.fillBar) {
    // Use getProps or direct properties with fallbacks
    const props = typeof element.getProps === 'function' ? element.getProps(['height', 'x', 'base', 'y'], true) : element;
    
    // Improved fallback for barHeight
    let barHeight = props.height || element.height;
    if (!barHeight || barHeight <= 0) {
      // Try to estimate from meta data if available
      const meta = element.$context?.dataset?.meta;
      if (meta && meta.data && meta.data.length > 1) {
        const idx = element.$context.dataIndex;
        if (meta.data[idx + 1]) {
          barHeight = Math.abs(meta.data[idx + 1].y - (props.y ?? element.y));
        }
      }
      // Fallback to a larger default if still not found
      if (!barHeight || barHeight <= 0) barHeight = 40;
    }
    const barWidth = Math.abs((props.x ?? element.x) - (props.base ?? element.base));

    // Calculate position (top-left corner of the bar)
    const barX = Math.min((props.x ?? element.x), (props.base ?? element.base));
    const barY = (props.y ?? element.y) - barHeight / 2;

    // Draw the image to fill the entire bar
    ctx.save();
    ctx.beginPath();
    ctx.rect(barX, barY, barWidth, barHeight);
    ctx.clip();

    renderImageInRect(ctx, img, barX, barY, barWidth, barHeight, config.imageFit);

    ctx.restore();
    return;
  }

  // Original positioning logic for non-fill mode
  switch (config.position) {
    case "center":
      // Center of the bar: halfway between left (element.base) and right (element.x)
      x = ((element.x ?? 0) + (element.base ?? 0)) / 2;
      break;
    case "above":
      // Detect if 3D bar is active and adjust for top face
      {
        const bar3dOptsAboveH = (element.chart?.options?.plugins && element.chart.options.plugins.bar3d) || {};
        const isBar3dActiveAboveH = !!(bar3dOptsAboveH.enabled);
        let dxAboveH = 0;
        if (isBar3dActiveAboveH) {
          const depth = typeof bar3dOptsAboveH.depth === 'number' ? bar3dOptsAboveH.depth : 12;
          const angleRad = (typeof bar3dOptsAboveH.angle === 'number' ? bar3dOptsAboveH.angle : 45) * Math.PI / 180;
          dxAboveH = Math.cos(angleRad) * depth;
        }
        // Right end of the (3D) bar
        x = (element.x ?? 0) + (dxAboveH > 0 ? dxAboveH : 0) + size / 2 + 8;
      }
      break;
    case "below":
      // Just inside the left end of the bar
      const barStart = Math.min(element.x ?? 0, element.base ?? 0);
      x = barStart + size / 2 + 8;
      break;
    case "callout":
      // Callout position - handled separately
      {
        const chart = element.chart;
        const datasetIndex = element._datasetIndex || 0;
        const pointIndex = element._index || 0;
        renderCalloutImage(ctx, element.x, element.y, img, config, datasetIndex, pointIndex, chart);
        return;
      }
    default:
      x = element.x + (element.base - element.x) / 2;
      break;
  }

  drawImageWithClipping(ctx, x - size / 2, y - size / 2, size, size, img, config.type);
}

function renderPointImage(ctx, element, img, config) {
  const size = config.size || 30;
  const x = element.x;
  const y = element.y;

  if (config.type === 'circle') {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  } else if (config.type === 'square') {
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
  } else if (config.type === 'rounded') {
    ctx.save();
    const radius = size * 0.2;
    roundRect(ctx, x - size / 2, y - size / 2, size, size, radius);
    ctx.clip();
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  }
}

function renderCalloutImage(ctx, pointX, pointY, img, config, datasetIndex, pointIndex, chart) {
  const size = config.size || 30;
  let x = config.calloutX;
  let y = config.calloutY;
  const offset = config.offset || 40;
  const chartType = chart.config?.type;
  const pie3dOpts = (chart.options.plugins && chart.options.plugins.pie3d) || chart.options.pie3d || {};
  const isPie3dActive = !!(pie3dOpts.enabled !== false && (chartType === 'pie3d' || chartType === 'doughnut3d' || pie3dOpts.enabled));
  const tilt = isPie3dActive ? (typeof pie3dOpts.tilt === 'number' ? pie3dOpts.tilt : 0.75) : 1.0;
  const chartArea = chart.chartArea;
  const centerY_chart = chartArea ? (chartArea.top + chartArea.bottom) / 2 : 0;
  const transformY = (y_val) => isPie3dActive ? centerY_chart + (y_val - centerY_chart) * tilt : y_val;

  if (x === undefined || y === undefined) {
    if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
      const centerX = chart.chartArea.left + chart.chartArea.width / 2;
      const centerY = chart.chartArea.top + chart.chartArea.height / 2;
      const meta = chart.getDatasetMeta(datasetIndex);
      const el = meta && meta.data ? meta.data[pointIndex] : null;
      const sA = el?.startAngle || 0;
      const eA = el?.endAngle || 0;
      const mA = (sA + eA) / 2;
      const radius = el?.outerRadius || Math.min(chart.chartArea.width, chart.chartArea.height) / 2;
      x = centerX + Math.cos(mA) * (radius + offset);
      y = transformY(centerY + Math.sin(mA) * (radius + offset));
    } else {
      const bar3dOpts = (chart.options.plugins && chart.options.plugins.bar3d) || chart.options.bar3d || {};
      const isBar3dActive = !!(bar3dOpts.enabled !== false && (chartType === 'bar3d' || chartType === 'horizontalBar3d' || bar3dOpts.enabled));
      let dy = 0;
      if (isBar3dActive) {
          const depth = typeof bar3dOpts.depth === 'number' ? bar3dOpts.depth : 12;
          const angleRad = (typeof bar3dOpts.angle === 'number' ? bar3dOpts.angle : 45) * Math.PI / 180;
          dy = -Math.sin(angleRad) * depth;
      }
      x = pointX + offset;
      y = (pointY + (isBar3dActive && dy < 0 ? dy : 0)) - offset;
    }
  }

  // Clamp to canvas boundaries to ensure it's always visible
  if (chart && chart.width && chart.height) {
    const halfSize = size / 2;
    const padding = 5 + (config.borderWidth || 3);
    x = Math.max(halfSize + padding, Math.min(x, chart.width - halfSize - padding));
    y = Math.max(halfSize + padding, Math.min(y, chart.height - halfSize - padding));
  }

  const arrowLine = config.arrowLine !== false;
  const arrowHead = config.arrowHead !== false;
  const showArrow = config.arrow || arrowLine || arrowHead;

  // Draw arrow if enabled
  if (showArrow) {
    ctx.save();
    ctx.strokeStyle = config.arrowColor || '#333';
    ctx.lineWidth = 2;
    // Determine anchor/start point
    const chartType = chart.config?.type;
    let startX = pointX;
    let startY = pointY;
    if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
      const centerX = chart.chartArea.left + chart.chartArea.width / 2;
      const centerY = chart.chartArea.top + chart.chartArea.height / 2;
      const meta = chart.getDatasetMeta(datasetIndex);
      const el = meta && meta.data ? meta.data[pointIndex] : null;
      const sA_arrow = el?.startAngle || 0;
      const eA_arrow = el?.endAngle || 0;
      const mA_arrow = (sA_arrow + eA_arrow) / 2;
      const radius_arrow = el?.outerRadius || Math.min(chart.chartArea.width, chart.chartArea.height) / 2;
      startX = centerX + Math.cos(mA_arrow) * radius_arrow;
      startY = transformY(centerY + Math.sin(mA_arrow) * radius_arrow);
    } else if (chartType === 'bar' || chartType === 'bar3d' || chartType === 'horizontalBar' || chartType === 'horizontalBar3d') {
      const bar3dOpts = (chart.options.plugins && chart.options.plugins.bar3d) || chart.options.bar3d || {};
      const isBar3dActive = !!(bar3dOpts.enabled !== false && (chart.config?.type === 'bar3d' || chart.config?.type === 'horizontalBar3d' || bar3dOpts.enabled));
      let dx = 0, dy = 0;
      if (isBar3dActive) {
          const depth = typeof bar3dOpts.depth === 'number' ? bar3dOpts.depth : 12;
          const angleRad = (typeof bar3dOpts.angle === 'number' ? bar3dOpts.angle : 45) * Math.PI / 180;
          dx = Math.cos(angleRad) * depth;
          dy = -Math.sin(angleRad) * depth;
      }
      if (chart.config.options && chart.config.options.indexAxis === 'y') {
          startX = pointX + (dx > 0 ? dx : 0);
          startY = pointY;
      } else {
          startX = pointX;
          startY = pointY + (dy < 0 ? dy : 0);
      }
    }

    // Optional elbow
    const useElbow = config.arrowSegments === 2;
    let bendX = config.arrowBendX;
    let bendY = config.arrowBendY;
    const gap = config.arrowEndGap ?? 8;

    if ((bendX == null || bendY == null) && config.arrowBendRelX != null && config.arrowBendRelY != null) {
      bendX = config.arrowBendRelX * chart.width;
      bendY = config.arrowBendRelY * chart.height;
    }
    
    if (useElbow && (bendX == null || bendY == null)) {
      if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
        const elbowOffset = (config.arrowElbowLength ?? 14);
        // We reuse midAngle and radius from earlier calculation if available, 
        // but to be safe we recalculate or ensure they are in scope.
        const meta = chart.getDatasetMeta(datasetIndex);
        const el = meta && meta.data ? meta.data[pointIndex] : null;
        if (el) {
          const sA = el.startAngle || 0;
          const eA = el.endAngle || 0;
          const mA = (sA + eA) / 2;
          bendX = startX + Math.cos(mA) * elbowOffset;
          bendY = startY + Math.sin(mA) * (isPie3dActive ? elbowOffset * tilt : elbowOffset);
        }
      } else {
        bendX = startX + (x - startX) * 0.2;
        bendY = startY;
      }
    }

    let px_last = startX, py_last = startY;
    if (useElbow && bendX != null && bendY != null) { px_last = bendX; py_last = bendY; }
    
    const angleToImage = Math.atan2(y - py_last, x - px_last);
    const arrowEndX = x - gap * Math.cos(angleToImage);
    const arrowEndY = y - gap * Math.sin(angleToImage);

    if (arrowLine) {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      if (useElbow && bendX != null && bendY != null) {
        ctx.lineTo(bendX, bendY);
      }
      ctx.lineTo(arrowEndX, arrowEndY);
      ctx.stroke();
    }

    if (arrowHead) {
      const headLength = 12; // Match editor
      const headAngle = Math.PI / 6;
      ctx.beginPath();
      ctx.moveTo(arrowEndX, arrowEndY);
      ctx.lineTo(arrowEndX - headLength * Math.cos(angleToImage - headAngle), arrowEndY - headLength * Math.sin(angleToImage - headAngle));
      ctx.moveTo(arrowEndX, arrowEndY);
      ctx.lineTo(arrowEndX - headLength * Math.cos(angleToImage + headAngle), arrowEndY - headLength * Math.sin(angleToImage + headAngle));
      ctx.stroke();
    }
    ctx.restore();
  }

  // Calculate actual image dimensions for regular type (for border)
  let borderX = x - size / 2;
  let borderY = y - size / 2;
  let borderW = size;
  let borderH = size;
  
  if (config.type === 'regular') {
    const imgAspectRatio = img.naturalWidth / img.naturalHeight;
    if (imgAspectRatio > 1) {
      // Image is wider - fit to width
      borderH = size / imgAspectRatio;
      borderY = y - borderH / 2;
    } else {
      // Image is taller - fit to height
      borderW = size * imgAspectRatio;
      borderX = x - borderW / 2;
    }
  }

  // Draw border if specified
  if (config.borderColor && config.borderWidth) {
    ctx.save();
    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = config.borderWidth;
    ctx.beginPath();
    if (config.type === 'circle') {
      ctx.arc(x, y, size / 2 + config.borderWidth / 2, 0, Math.PI * 2);
    } else if (config.type === 'regular') {
      ctx.rect(borderX - config.borderWidth / 2, borderY - config.borderWidth / 2, 
               borderW + config.borderWidth, borderH + config.borderWidth);
    } else if (config.type === 'square') {
      ctx.rect(x - size / 2 - config.borderWidth / 2, y - size / 2 - config.borderWidth / 2, 
               size + config.borderWidth, size + config.borderWidth);
    } else if (config.type === 'rounded') {
      const radius = size * 0.2;
      roundRect(ctx, x - size / 2 - config.borderWidth / 2, y - size / 2 - config.borderWidth / 2, 
                size + config.borderWidth, size + config.borderWidth, radius);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Draw image
  if (config.type === 'regular') {
    // Regular: Preserve aspect ratio, scale to fit within bounds, center it
    const imgAspectRatio = img.naturalWidth / img.naturalHeight;
    const targetAspectRatio = 1; // Square target (size x size)
    
    let drawWidth = size;
    let drawHeight = size;
    let drawX = x - size / 2;
    let drawY = y - size / 2;
    
    if (imgAspectRatio > targetAspectRatio) {
      // Image is wider - fit to width, scale height proportionally
      drawHeight = size / imgAspectRatio;
      drawY = y - drawHeight / 2; // Center vertically
    } else {
      // Image is taller - fit to height, scale width proportionally
      drawWidth = size * imgAspectRatio;
      drawX = x - drawWidth / 2; // Center horizontally
    }
    
    // Draw image without clipping to preserve aspect ratio
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  } else if (config.type === 'circle') {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  } else if (config.type === 'square') {
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
  } else if (config.type === 'rounded') {
    ctx.save();
    const radius = size * 0.2;
    roundRect(ctx, x - size / 2, y - size / 2, size, size, radius);
    ctx.clip();
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  }
}

function renderSliceImage(ctx, element, img, config) {
  // Check if this is a fill slice request (robustly check both properties)
  if (config.fillSlice || config.fillBar) {
    renderSliceFillImage(ctx, element, img, config);
    return;
  }

  const chart = element._chart || element.chart;
  if (!chart || !chart.chartArea) return;
  const chartArea = chart.chartArea;
  
  // Use element.x/y for center point (handles exploded slices)
  const centerX = element.x || chartArea.left + chartArea.width / 2;
  const centerY = element.y || chartArea.top + chartArea.height / 2;
  
  const startAngle = element.startAngle || 0;
  const endAngle = element.endAngle || 0;
  const innerRadius = element.innerRadius || 0;
  const outerRadius = element.outerRadius || Math.min(chartArea.width, chartArea.height) / 2;

  // Detect 3D pie for label positioning
  const pie3dOpts = (chart.options.plugins && chart.options.plugins.pie3d) || chart.options.pie3d || {};
  const isPie3dActive = !!(pie3dOpts.enabled !== false && (chartType === 'pie3d' || chartType === 'doughnut3d' || pie3dOpts.enabled));
  const tilt = isPie3dActive ? (typeof pie3dOpts.tilt === 'number' ? pie3dOpts.tilt : 0.75) : 1.0;
  const centerY_chart = (chartArea.top + chartArea.bottom) / 2;
  const transformY = (y_val) => isPie3dActive ? centerY_chart + (y_val - centerY_chart) * tilt : y_val;

  const size = config.size || 30;
  const midAngle = (startAngle + endAngle) / 2;
  let x, y;

  switch (config.position) {
    case "center":
      const r = innerRadius + (outerRadius - innerRadius) * 0.5;
      x = centerX + Math.cos(midAngle) * r;
      y = transformY(centerY + Math.sin(midAngle) * r);
      break;
    case "above":
      const rAbove = outerRadius + size * 0.7;
      x = centerX + Math.cos(midAngle) * rAbove;
      y = transformY(centerY + Math.sin(midAngle) * rAbove);
      break;
    case "below":
      const rBelow = innerRadius + (outerRadius - innerRadius) * 0.2;
      x = centerX + Math.cos(midAngle) * rBelow;
      y = transformY(centerY + Math.sin(midAngle) * rBelow);
      break;
    case "callout":
      renderCalloutImage(ctx, element.x, element.y, img, config, element._datasetIndex, element._index, chart);
      return;
    default:
      x = element.x;
      y = element.y;
      break;
  }

  drawImageWithClipping(ctx, x - size / 2, y - size / 2, size, size, img, config.type);
}

function renderSliceFillImage(ctx, element, img, config) {
  const chart = element._chart || element.chart;
  if (!chart || !chart.chartArea) return;
  const chartArea = chart.chartArea;
  
  const centerX = element.x || chartArea.left + chartArea.width / 2;
  const centerY = element.y || chartArea.top + chartArea.height / 2;
  const startAngle = element.startAngle || 0;
  const endAngle = element.endAngle || 0;
  const innerRadius = element.innerRadius || 0;
  const outerRadius = element.outerRadius || Math.min(chartArea.width, chartArea.height) / 2;

  ctx.save();

  // Detect 3D pie and apply tilt
  const pie3dOpts = (chart.options.plugins && chart.options.plugins.pie3d) || chart.options.pie3d || {};
  const isPie3dActive = !!(pie3dOpts.enabled !== false && (chart.config.type === 'pie3d' || chart.config.type === 'doughnut3d' || pie3dOpts.enabled));
  if (isPie3dActive) {
    const tilt = typeof pie3dOpts.tilt === 'number' ? pie3dOpts.tilt : 0.75;
    ctx.translate(centerX, centerY);
    ctx.scale(1, tilt);
    ctx.translate(-centerX, -centerY);
  }

  ctx.beginPath();
  if (innerRadius > 0) {
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.lineTo(centerX + Math.cos(endAngle) * innerRadius, centerY + Math.sin(endAngle) * innerRadius);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
  } else {
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.closePath();
  }
  ctx.clip();

  const fitMode = config.imageFit || 'cover';
  
  if (fitMode === 'contain') {
    const imgAspect = img.width / img.height;
    let best = { area: 0, x: 0, y: 0, w: 0, h: 0 };
    const angleSteps = 15;
    const radiusSteps = 15;
    
    for (let ai = 0; ai <= angleSteps; ai++) {
      const theta = startAngle + (ai / angleSteps) * (endAngle - startAngle);
      for (let ri = 0; ri <= radiusSteps; ri++) {
        const r = innerRadius + (ri / radiusSteps) * (outerRadius - innerRadius);
        
        let low = 0, high = outerRadius - innerRadius, maxW = 0, maxH = 0;
        for (let iter = 0; iter < 8; iter++) {
          const mid = (low + high) / 2;
          let w, h;
          if (imgAspect > 1) {
            w = mid;
            h = w / imgAspect;
          } else {
            h = mid;
            w = h * imgAspect;
          }
          
          const corners = [
            { dx: -w / 2, dy: -h / 2 },
            { dx: w / 2, dy: -h / 2 },
            { dx: w / 2, dy: h / 2 },
            { dx: -w / 2, dy: h / 2 },
          ];
          
          let allInside = true;
          for (let ci = 0; ci < corners.length; ci++) {
            const cx = centerX + Math.cos(theta) * r + corners[ci].dx;
            const cy = centerY + Math.sin(theta) * r + corners[ci].dy;
            
            const relX = cx - centerX;
            const relY = cy - centerY;
            const rad = Math.sqrt(relX * relX + relY * relY);
            let ang = Math.atan2(relY, relX);
            if (ang < 0) ang += 2 * Math.PI;
            
            let sA = startAngle, eA = endAngle;
            while (sA < 0) sA += 2 * Math.PI;
            while (eA < 0) eA += 2 * Math.PI;
            while (eA < sA) eA += 2 * Math.PI;
            while (ang < sA) ang += 2 * Math.PI;
            
            if (!(rad >= innerRadius - 0.5 && rad <= outerRadius + 0.5 && ang >= sA - 1e-6 && ang <= eA + 1e-6)) {
              allInside = false;
              break;
            }
          }
          if (allInside) {
            maxW = w; maxH = h; low = mid;
          } else {
            high = mid;
          }
        }
        if (maxW * maxH > best.area) {
          const cx = centerX + Math.cos(theta) * r;
          const cy = centerY + Math.sin(theta) * r;
          best = { area: maxW * maxH, x: cx - maxW / 2, y: cy - maxH / 2, w: maxW, h: maxH };
        }
      }
    }
    if (best.area > 0) {
      ctx.drawImage(img, best.x, best.y, best.w, best.h);
    }
  } else {
    // Calculate bounding box for the slice for fill/cover
    const boundingPoints = [];
    const boundingSteps = 60;
    for (let bi = 0; bi <= boundingSteps; bi++) {
      const bAngle = startAngle + (endAngle - startAngle) * (bi / boundingSteps);
      boundingPoints.push([centerX + Math.cos(bAngle) * outerRadius, centerY + Math.sin(bAngle) * outerRadius]);
      if (innerRadius > 0) {
        boundingPoints.push([centerX + Math.cos(bAngle) * innerRadius, centerY + Math.sin(bAngle) * innerRadius]);
      }
    }
    const boundingXs = boundingPoints.map(p => p[0]);
    const boundingYs = boundingPoints.map(p => p[1]);
    const sMinX = Math.min(...boundingXs);
    const sMaxX = Math.max(...boundingXs);
    const sMinY = Math.min(...boundingYs);
    const sMaxY = Math.max(...boundingYs);
    const sWidth = sMaxX - sMinX;
    const sHeight = sMaxY - sMinY;

    renderImageInRect(ctx, img, sMinX, sMinY, sWidth, sHeight, fitMode);
  }

  ctx.restore();
}

function drawImageWithClipping(ctx, x, y, w, h, img, type) {
  ctx.save();
  
  if (type === 'regular') {
    // Regular: Preserve aspect ratio, scale to fit within bounds, center it
    const imgAspectRatio = img.naturalWidth / img.naturalHeight;
    const targetAspectRatio = w / h;
    
    let drawWidth = w;
    let drawHeight = h;
    let drawX = x;
    let drawY = y;
    
    if (imgAspectRatio > targetAspectRatio) {
      // Image is wider - fit to width, scale height proportionally
      drawHeight = w / imgAspectRatio;
      drawY = y + (h - drawHeight) / 2; // Center vertically
    } else {
      // Image is taller - fit to height, scale width proportionally
      drawWidth = h * imgAspectRatio;
      drawX = x + (w - drawWidth) / 2; // Center horizontally
    }
    
    // Draw image without clipping to preserve aspect ratio
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  } else {
    // Apply clipping for circle, square, or rounded
    ctx.beginPath();
    if (type === 'circle') {
      ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
    } else if (type === 'square') {
      ctx.rect(x, y, w, h);
    } else if (type === 'rounded') {
      const radius = Math.min(w, h) * 0.15; // 15% border radius
      roundRect(ctx, x, y, w, h, radius);
    }
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
  }
  
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Initialize drag state
window.imageDragState = {
  isDragging: false,
  dragDatasetIndex: -1,
  dragPointIndex: -1,
  dragOffsetX: 0,
  dragOffsetY: 0
};

// Register the plugin
Chart.register(universalImagePlugin);
`;
}
