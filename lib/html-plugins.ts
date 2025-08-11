import { type CustomLabel, type CustomLabelPluginOptions } from "./custom-label-plugin";

// Drag state for image callouts
const dragState = {
  isDragging: false,
  dragDatasetIndex: -1,
  dragPointIndex: -1,
  dragOffsetX: 0,
  dragOffsetY: 0
};

// Drag state for custom labels
const labelDragState = {
  isDragging: false,
  dragDatasetIndex: -1,
  dragPointIndex: -1,
  dragOffsetX: 0,
  dragOffsetY: 0
};

/**
 * Generate the custom label plugin code for HTML export
 */
export function generateCustomLabelPluginCode(customLabelsConfig: CustomLabelPluginOptions): string {
  if (!customLabelsConfig || !customLabelsConfig.labels) {
    return '';
  }

  return `
// Global drag state for HTML export
window.labelDragState = ${JSON.stringify(customLabelsConfig.labels?.map((dataset, datasetIdx) => 
  dataset?.map((label, pointIdx) => {
    if (label.x != null && label.y != null) {
      return { [`${datasetIdx}_${pointIdx}`]: { x: label.x, y: label.y } };
    }
    return null;
  }).filter(Boolean)
).flat().reduce((acc, item) => ({ ...acc, ...item }), {}) || {})};

// Custom Label Plugin for HTML Export
const customLabelPlugin = {
  id: 'customLabels',
  afterDraw(chart) {
    const opts = ${JSON.stringify(customLabelsConfig)};
    if (!opts || !opts.labels) return;
    
    const ctx = chart.ctx;
    const shapeSize = opts.shapeSize ?? 32;
    
    chart.data.datasets.forEach((dataset, datasetIdx) => {
      const meta = chart.getDatasetMeta(datasetIdx);
      if (!meta || !meta.data) return;
      // Respect default Chart.js dataset visibility
      if (typeof chart.isDatasetVisible === 'function' && chart.isDatasetVisible(datasetIdx) === false) return;
      
      const labelArr = opts.labels[datasetIdx] || [];
      meta.data.forEach((element, pointIdx) => {
        const label = labelArr[pointIdx];
        if (!label || !label.text) return;
        // Respect default slice visibility for pie/doughnut/polarArea
        if ((chart.config.type === 'pie' || chart.config.type === 'doughnut' || chart.config.type === 'polarArea') &&
            typeof chart.getDataVisibility === 'function' && chart.getDataVisibility(pointIdx) === false) return;
        
        // Position logic
        let x = label.x;
        let y = label.y;
        let anchor = label.anchor || 'center';
        const chartType = chart.config.type;
        const shapeSize = opts.shapeSize ?? 32;

        if (anchor === 'callout' && label.draggable && chartType === 'bar' && !(chart.options.indexAxis === 'y')) {
          // For vertical bar chart callout-with-arrow: anchor is center of top edge of bar
          const anchorX = element.x ?? 0;
          const anchorY = (element.y ?? 0) - (element.height ? element.height / 2 : 0);
          // Use dx/dy if present (relative to anchor point)
          if (label.dx !== undefined && label.dy !== undefined) {
            x = anchorX + label.dx;
            y = anchorY + label.dy;
          } else {
            // Default offset
            const offset = label.calloutOffset || shapeSize * 1.5;
            x = anchorX;
            y = anchorY - offset;
          }
          // Arrow always from anchorX, anchorY to x, y
          // (Arrow drawing code below should use these)
        } else if (anchor === 'callout' && label.draggable) {
          // Default callout position for non-bar charts
          if (label.relX !== undefined && label.relY !== undefined && chart.width && chart.height) {
            x = label.relX * chart.width;
            y = label.relY * chart.height;
          } else {
            const offset = label.calloutOffset || shapeSize * 1.5;
            if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
              const chartArea = chart.chartArea;
              const centerX = chartArea.left + chartArea.width / 2;
              const centerY = chartArea.top + chartArea.height / 2;
              const startAngle = element.startAngle ?? 0;
              const endAngle = element.endAngle ?? 0;
              const midAngle = (startAngle + endAngle) / 2;
              const outerRadius = element.outerRadius ?? Math.min(chartArea.width, chartArea.height) / 2;
              const r = outerRadius + offset;
              x = centerX + Math.cos(midAngle) * r;
              y = centerY + Math.sin(midAngle) * r;
            } else {
              x = (element.x ?? 0) + offset;
              y = (element.y ?? 0) - offset;
            }
          }
        } else {
          // Anchor-based logic for center, top, bottom
          if (chartType === 'bar' || chartType === 'horizontalBar') {
            const isHorizontal = (chart.options.indexAxis === 'y');
            if (isHorizontal) {
              if (anchor === 'center') {
                x = ((element.x ?? 0) + (element.base ?? 0)) / 2;
                y = element.y ?? 0;
              } else if (anchor === 'top') {
                x = (element.x ?? 0) + 8;
                y = element.y ?? 0;
              } else if (anchor === 'bottom') {
                const barStart = Math.min(element.x ?? 0, element.base ?? 0);
                x = barStart + 8;
                y = element.y ?? 0;
              }
            } else {
              if (anchor === 'center') {
                x = element.x ?? 0;
                y = ((element.y ?? 0) + (element.base ?? 0)) / 2;
              } else if (anchor === 'top') {
                x = element.x ?? 0;
                y = (element.y ?? 0) - 8;
              } else if (anchor === 'bottom') {
                x = element.x ?? 0;
                y = (element.base ?? 0) - 8;
              }
            }
          } else if (chartType === 'line' || chartType === 'area' || chartType === 'scatter' || chartType === 'bubble') {
            x = element.x ?? 0;
            if (anchor === 'center') {
              y = element.y ?? 0;
            } else if (anchor === 'top') {
              y = (element.y ?? 0) - 12;
            } else if (anchor === 'bottom') {
              y = (element.y ?? 0) + 12;
            }
          } else if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
            const chartArea = chart.chartArea;
            const centerX = chartArea.left + chartArea.width / 2;
            const centerY = chartArea.top + chartArea.height / 2;
            const startAngle = element.startAngle ?? 0;
            const endAngle = element.endAngle ?? 0;
            const midAngle = (startAngle + endAngle) / 2;
            const innerRadius = element.innerRadius ?? 0;
            const outerRadius = element.outerRadius ?? Math.min(chartArea.width, chartArea.height) / 2;
            if (anchor === 'center') {
              const r = innerRadius + (outerRadius - innerRadius) * 0.5;
              x = centerX + Math.cos(midAngle) * r;
              y = centerY + Math.sin(midAngle) * r;
            } else if (anchor === 'top') {
              const r = outerRadius + shapeSize * 0.7;
              x = centerX + Math.cos(midAngle) * r;
              y = centerY + Math.sin(midAngle) * r;
            } else if (anchor === 'bottom') {
              const r = innerRadius + (outerRadius - innerRadius) * 0.2;
              x = centerX + Math.cos(midAngle) * r;
              y = centerY + Math.sin(midAngle) * r;
            }
          } else if (chartType === 'radar') {
            x = element.x ?? 0;
            if (anchor === 'center') {
              y = element.y ?? 0;
            } else if (anchor === 'top') {
              y = (element.y ?? 0) - 12;
            } else if (anchor === 'bottom') {
              y = (element.y ?? 0) + 12;
            }
          } else {
            x = element.x ?? 0;
            y = element.y ?? 0;
          }
        }
        
        // Draw callout arrow if needed
        if (anchor === 'callout' && label.callout && (label.arrowLine || label.arrowHead)) {
          ctx.save();
          ctx.strokeStyle = label.arrowColor || label.calloutColor || '#333';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          
          let startX = element.x ?? 0;
          let startY = element.y ?? 0;
          
          const chartType = chart.config.type;
          if (chartType === "pie" || chartType === "doughnut" || chartType === "polarArea") {
            // Anchor each arrow to its own slice's outer mid-angle
            const chartArea = chart.chartArea;
            const centerX = chartArea.left + chartArea.width / 2;
            const centerY = chartArea.top + chartArea.height / 2;
            const startAngle = element.startAngle ?? 0;
            const endAngle = element.endAngle ?? 0;
            const midAngle = (startAngle + endAngle) / 2;
            const outerRadius = element.outerRadius ?? Math.min(chartArea.width, chartArea.height) / 2;
            startX = centerX + Math.cos(midAngle) * outerRadius;
            startY = centerY + Math.sin(midAngle) * outerRadius;
          }
          
          const endGap = label.arrowEndGap || 10;
          const dx = x - startX;
          const dy = y - startY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > endGap) {
            const unitX = dx / distance;
            const unitY = dy / distance;
            const endX = x - unitX * endGap;
            const endY = y - unitY * endGap;
            
            if (label.arrowLine) {
              ctx.beginPath();
              ctx.moveTo(startX, startY);
              // Optional elbow support in exported HTML as well
              if (label.arrowSegments === 2) {
                let bendX = label.arrowBendX;
                let bendY = label.arrowBendY;
                if ((bendX == null || bendY == null) && label.arrowBendRelX != null && label.arrowBendRelY != null) {
                  bendX = label.arrowBendRelX * chart.width;
                  bendY = label.arrowBendRelY * chart.height;
                }
                if (bendX == null || bendY == null) {
                  // Default elbow for pies: short radial first segment
                  if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
                    const startAngle = element.startAngle ?? 0;
                    const endAngle = element.endAngle ?? 0;
                    const midAngle = (startAngle + endAngle) / 2;
                    const elbow = (label.arrowElbowLength ?? 14);
                    bendX = startX + Math.cos(midAngle) * elbow;
                    bendY = startY + Math.sin(midAngle) * elbow;
                  } else {
                    bendX = startX + (endX - startX) * 0.2;
                    bendY = startY;
                  }
                }
                ctx.lineTo(bendX, bendY);
                ctx.lineTo(endX, endY);
              } else {
                ctx.lineTo(endX, endY);
              }
              ctx.stroke();
            }
            
            if (label.arrowHead) {
              const style = label.arrowHeadStyle || 'open';
              const headPos = label.arrowHeadPosition || 'end';
              const headLen = label.arrowHeadSize ?? 10;
              const headAng = label.arrowHeadAngle ?? (Math.PI / 6);
              let tipX = endX, tipY = endY, fromX = startX, fromY = startY;
              if (label.arrowSegments === 2) {
                let bendX = label.arrowBendX;
                let bendY = label.arrowBendY;
                if ((bendX == null || bendY == null) && label.arrowBendRelX != null && label.arrowBendRelY != null) {
                  bendX = label.arrowBendRelX * chart.width;
                  bendY = label.arrowBendRelY * chart.height;
                }
                if (headPos === 'start') { tipX = startX; tipY = startY; fromX = bendX ?? endX; fromY = bendY ?? startY; }
                else { tipX = endX; tipY = endY; fromX = bendX ?? startX; fromY = bendY ?? startY; }
              } else {
                if (headPos === 'start') { tipX = startX; tipY = startY; fromX = endX; fromY = endY; }
                else { tipX = endX; tipY = endY; fromX = startX; fromY = startY; }
              }
              const a = Math.atan2(tipY - fromY, tipX - fromX);
              if (style === 'bar') {
                const nx = Math.cos(a + Math.PI/2) * (headLen/2);
                const ny = Math.sin(a + Math.PI/2) * (headLen/2);
                ctx.beginPath();
                ctx.moveTo(tipX - nx, tipY - ny);
                ctx.lineTo(tipX + nx, tipY + ny);
                ctx.stroke();
              } else if (style === 'filled') {
                const lx = tipX - headLen * Math.cos(a - headAng);
                const ly = tipY - headLen * Math.sin(a - headAng);
                const rx = tipX - headLen * Math.cos(a + headAng);
                const ry = tipY - headLen * Math.sin(a + headAng);
                ctx.beginPath();
                ctx.moveTo(tipX, tipY);
                ctx.lineTo(lx, ly);
                ctx.lineTo(rx, ry);
                ctx.closePath();
                const prevFill = ctx.fillStyle;
                ctx.fillStyle = label.arrowColor || label.calloutColor || '#333';
                ctx.fill();
                ctx.fillStyle = prevFill;
              } else {
                ctx.beginPath();
                ctx.moveTo(tipX, tipY);
                ctx.lineTo(tipX - headLen * Math.cos(a - headAng), tipY - headLen * Math.sin(a - headAng));
                ctx.moveTo(tipX, tipY);
                ctx.lineTo(tipX - headLen * Math.cos(a + headAng), tipY - headLen * Math.sin(a + headAng));
                ctx.stroke();
              }
            }
          }
          
          ctx.restore();
        }
        
        // Draw the label
        ctx.save();
        
        // Set text properties
        ctx.font = label.font || \`\${shapeSize * 0.4}px Arial\`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Calculate text dimensions
        const textMetrics = ctx.measureText(label.text);
        const textWidth = textMetrics.width;
        const textHeight = parseInt(ctx.font) * 0.8;
        
        // Draw background shape
        const padding = label.padding || 8;
        const bgWidth = textWidth + padding * 2;
        const bgHeight = textHeight + padding * 2;
        const bgX = x - bgWidth / 2;
        const bgY = y - bgHeight / 2;
        
        if (label.backgroundColor || label.borderColor) {
          ctx.beginPath();
          
          if (label.shape === 'circle') {
            const radius = Math.max(bgWidth, bgHeight) / 2;
            ctx.arc(x, y, radius, 0, Math.PI * 2);
          } else if (label.shape === 'star') {
            drawStar(ctx, x, y, Math.max(bgWidth, bgHeight) / 2, 5);
          } else {
            const borderRadius = label.borderRadius || 4;
            roundRect(ctx, bgX, bgY, bgWidth, bgHeight, borderRadius);
          }
          
          if (label.backgroundColor) {
            ctx.fillStyle = label.backgroundColor;
            ctx.fill();
          }
          
          if (label.borderColor && label.borderWidth) {
            ctx.strokeStyle = label.borderColor;
            ctx.lineWidth = label.borderWidth;
            ctx.stroke();
          }
        }
        
        // Draw text
        ctx.fillStyle = label.color || '#333';
        ctx.fillText(label.text, x, y);
        
        ctx.restore();
      });
    });
  }
};

// Helper functions
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

function drawStar(ctx, cx, cy, r, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points;
    const radius = i % 2 === 0 ? r : r * 0.5;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// Register the plugin
Chart.register(customLabelPlugin);

// Add drag functionality for custom labels
customLabelPlugin.afterInit = function(chart) {
  const canvas = chart.canvas;
  let dragging = false;
  let dragKey = '';
  let offsetX = 0;
  let offsetY = 0;

  function getLabelAt(x, y) {
    const opts = ${JSON.stringify(customLabelsConfig)};
    if (!opts || !opts.labels) return null;
    const shapeSize = opts.shapeSize ?? 32;
    
    for (let datasetIdx = 0; datasetIdx < opts.labels.length; ++datasetIdx) {
      const arr = opts.labels[datasetIdx];
      for (let pointIdx = 0; pointIdx < arr.length; ++pointIdx) {
        const label = arr[pointIdx];
        if (!label || label.anchor !== 'callout' || !label.draggable) continue;
        
        let lx, ly;
        const key = \`\${datasetIdx}_\${pointIdx}\`;
        if (window.labelDragState[key]) {
          lx = window.labelDragState[key].x;
          ly = window.labelDragState[key].y;
        } else {
          const meta = chart.getDatasetMeta(datasetIdx);
          const element = meta.data[pointIdx];
          const offset = label.calloutOffset || shapeSize * 1.5;
          if (chart.config.type === 'pie' || chart.config.type === 'doughnut' || chart.config.type === 'polarArea') {
            const chartArea = chart.chartArea;
            const centerX = chartArea.left + chartArea.width / 2;
            const centerY = chartArea.top + chartArea.height / 2;
            const startAngle = element.startAngle ?? 0;
            const endAngle = element.endAngle ?? 0;
            const midAngle = (startAngle + endAngle) / 2;
            const outerRadius = element.outerRadius ?? Math.min(chartArea.width, chartArea.height) / 2;
            const r = outerRadius + offset;
            lx = centerX + Math.cos(midAngle) * r;
            ly = centerY + Math.sin(midAngle) * r;
          } else {
            lx = (element.x ?? 0) + offset;
            ly = (element.y ?? 0) - offset;
          }
        }
        
        // Hit test (circle)
        if (Math.hypot(x - lx, y - ly) < shapeSize / 1.5) {
          return { datasetIdx, pointIdx, lx, ly, key };
        }
      }
    }
    return null;
  }

  function onMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = getLabelAt(x, y);
    if (hit) {
      dragging = true;
      dragKey = hit.key;
      offsetX = x - hit.lx;
      offsetY = y - hit.ly;
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
    }
  }

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (dragging && dragKey) {
      window.labelDragState[dragKey] = { x: x - offsetX, y: y - offsetY };
      chart.update('none');
    } else {
      // Hover effect
      const hit = getLabelAt(x, y);
      canvas.style.cursor = hit ? 'grab' : 'default';
    }
  }

  function onMouseUp() {
    dragging = false;
    dragKey = '';
    canvas.style.cursor = 'default';
  }

  // Touch event handlers for mobile/tablet support
  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const hit = getLabelAt(x, y);
    if (hit) {
      dragging = true;
      dragKey = hit.key;
      offsetX = x - hit.lx;
      offsetY = y - hit.ly;
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
    }
  }

  function onTouchMove(e) {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    if (dragging && dragKey) {
      window.labelDragState[dragKey] = { x: x - offsetX, y: y - offsetY };
      chart.update('none');
      e.preventDefault();
    }
  }

  function onTouchEnd(e) {
    if (dragging) {
      dragging = false;
      dragKey = '';
      canvas.style.cursor = 'default';
      e.preventDefault();
    }
  }

  // Add event listeners for both mouse and touch
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mouseleave', onMouseUp);

  // Touch event listeners for mobile/tablet support
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd, { passive: false });
};
`;
}

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
        if ((chart.config?.type === 'pie' || chart.config?.type === 'doughnut' || chart.config?.type === 'polarArea') &&
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

            if (chartType === "pie" || chartType === "doughnut" || chartType === "polarArea") {
              renderSliceImage(ctx, element, img, imageConfig);
            } else if (chartType === "bar") {
              if (chart.config.options?.indexAxis === "y") {
                renderBarImageHorizontal(ctx, element, img, imageConfig);
              } else {
                renderBarImageVertical(ctx, element, img, imageConfig);
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

              const calloutX = config.calloutX !== undefined ? config.calloutX : element.x + (config.offset || 40);
              const calloutY = config.calloutY !== undefined ? config.calloutY : element.y - (config.offset || 40);
              const size = config.size || 30;

              const distance = Math.sqrt((x - calloutX) ** 2 + (y - calloutY) ** 2);

              if (distance <= size / 2) {
                isOverCallout = true;
              }
            }
          });
        });

        canvas.style.cursor = isOverCallout ? "grab" : "default";
      }
    };

    const handleMouseUp = () => {
      if (window.imageDragState.isDragging) {
        window.imageDragState.isDragging = false;
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
function getDefaultImageConfig(chartType) {
  return {
    type: 'circle',
    size: 30,
    position: 'center',
    arrow: false
  };
}

function renderBarImageVertical(ctx, element, img, config) {
  const size = config.size || 30;
  const x = element.x;
  let y = element.y;

  // If fill mode is enabled, fill the entire bar with the image
  if (config.fillBar) {
    const barWidth = element.width;
    const barHeight = Math.abs(element.y - element.base);

    // Calculate position (top-left corner of the bar)
    const barX = element.x - barWidth / 2;
    const barY = Math.min(element.y, element.base);

    // Draw the image to fill the entire bar
    ctx.save();
    ctx.beginPath();
    ctx.rect(barX, barY, barWidth, barHeight);
    ctx.clip();

    // Determine how to fit the image
    if (config.imageFit === "cover") {
      // Cover: maintain aspect ratio and cover entire area
      const imgRatio = img.width / img.height;
      const barRatio = barWidth / barHeight;

      let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

      if (imgRatio > barRatio) {
        // Image is wider than bar (relative to height)
        drawHeight = barHeight;
        drawWidth = drawHeight * imgRatio;
        offsetX = (barWidth - drawWidth) / 2;
      } else {
        // Image is taller than bar (relative to width)
        drawWidth = barWidth;
        drawHeight = drawWidth / imgRatio;
        offsetY = (barHeight - drawHeight) / 2;
      }

      ctx.drawImage(img, barX + offsetX, barY + offsetY, drawWidth, drawHeight);
    } else if (config.imageFit === "contain") {
      // Contain: maintain aspect ratio and fit within area
      const imgRatio = img.width / img.height;
      const barRatio = barWidth / barHeight;

      let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

      if (imgRatio > barRatio) {
        // Image is wider than bar (relative to height)
        drawWidth = barWidth;
        drawHeight = drawWidth / imgRatio;
        offsetY = (barHeight - drawHeight) / 2;
      } else {
        // Image is taller than bar (relative to width)
        drawHeight = barHeight;
        drawWidth = drawHeight * imgRatio;
        offsetX = (barWidth - drawWidth) / 2;
      }

      ctx.drawImage(img, barX + offsetX, barY + offsetY, drawWidth, drawHeight);
    } else {
      // Fill: stretch to fill entire area
      ctx.drawImage(img, barX, barY, barWidth, barHeight);
    }

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
      // Just above the bar
      y = (element.y ?? 0) - size / 2 - 8;
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
    const barWidth = Math.abs(element.x - element.base);

    // Calculate position (top-left corner of the bar)
    const barX = Math.min(element.x, element.base);
    const barY = element.y - barHeight / 2;

    // Draw the image to fill the entire bar
    ctx.save();
    ctx.beginPath();
    ctx.rect(barX, barY, barWidth, barHeight);
    ctx.clip();

    // Determine how to fit the image
    if (config.imageFit === "cover") {
      // Cover: maintain aspect ratio and cover entire area
      const imgRatio = img.width / img.height;
      const barRatio = barWidth / barHeight;

      let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

      if (imgRatio > barRatio) {
        // Image is wider than bar (relative to height)
        drawHeight = barHeight;
        drawWidth = drawHeight * imgRatio;
        offsetX = (barWidth - drawWidth) / 2;
      } else {
        // Image is taller than bar (relative to width)
        drawWidth = barWidth;
        drawHeight = drawWidth / imgRatio;
        offsetY = (barHeight - drawHeight) / 2;
      }

      ctx.drawImage(img, barX + offsetX, barY + offsetY, drawWidth, drawHeight);
    } else if (config.imageFit === "contain") {
      // Contain: maintain aspect ratio and fit within area
      const imgRatio = img.width / img.height;
      const barRatio = barWidth / barHeight;

      let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

      if (imgRatio > barRatio) {
        // Image is wider than bar (relative to height)
        drawWidth = barWidth;
        drawHeight = drawWidth / imgRatio;
        offsetY = (barHeight - drawHeight) / 2;
      } else {
        // Image is taller than bar (relative to width)
        drawHeight = barHeight;
        drawWidth = drawHeight * imgRatio;
        offsetX = (barWidth - drawWidth) / 2;
      }

      ctx.drawImage(img, barX + offsetX, barY + offsetY, drawWidth, drawHeight);
    } else {
      // Fill: stretch to fill entire area
      ctx.drawImage(img, barX, barY, barWidth, barHeight);
    }

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
      // Right end of the bar
      x = (element.x ?? 0) + size / 2 + 8;
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
  if (x === undefined || y === undefined) {
    const offset = config.offset || 40;
    const chartType = chart.config?.type;
    if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
      const centerX = chart.chartArea.left + chart.chartArea.width / 2;
      const centerY = chart.chartArea.top + chart.chartArea.height / 2;
      const meta = chart.getDatasetMeta(datasetIndex);
      const el = meta && meta.data ? meta.data[pointIndex] : null;
      const startAngle = el?.startAngle || 0;
      const endAngle = el?.endAngle || 0;
      const midAngle = (startAngle + endAngle) / 2;
      const radius = el?.outerRadius || Math.min(chart.chartArea.width, chart.chartArea.height) / 2;
      const r = radius + offset;
      x = centerX + Math.cos(midAngle) * r;
      y = centerY + Math.sin(midAngle) * r;
    } else {
      x = pointX + offset;
      y = pointY - offset;
    }
  }

  // Draw arrow if enabled
  if (config.arrow) {
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
      const startAngle = el?.startAngle || 0;
      const endAngle = el?.endAngle || 0;
      const midAngle = (startAngle + endAngle) / 2;
      const radius = el?.outerRadius || Math.min(chart.chartArea.width, chart.chartArea.height) / 2;
      startX = centerX + Math.cos(midAngle) * radius;
      startY = centerY + Math.sin(midAngle) * radius;
    }

    // Optional elbow
    const useElbow = config.arrowSegments === 2;
    let bendX = config.arrowBendX;
    let bendY = config.arrowBendY;
    if ((bendX == null || bendY == null) && config.arrowBendRelX != null && config.arrowBendRelY != null) {
      bendX = config.arrowBendRelX * chart.width;
      bendY = config.arrowBendRelY * chart.height;
    }
    if (useElbow && (bendX == null || bendY == null)) {
      bendX = x;
      bendY = startY;
    }

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    if (useElbow) {
      ctx.lineTo(bendX, bendY);
      ctx.lineTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw arrow head at end of last segment
    const headLength = 8;
    const headAngle = Math.PI / 6;
    let px = startX, py = startY;
    if (useElbow) { px = bendX; py = bendY; }
    const angle = Math.atan2(y - py, x - px);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - headLength * Math.cos(angle - headAngle), y - headLength * Math.sin(angle - headAngle));
    ctx.moveTo(x, y);
    ctx.lineTo(x - headLength * Math.cos(angle + headAngle), y - headLength * Math.sin(angle + headAngle));
    ctx.stroke();
    ctx.restore();
  }

  // Draw border if specified
  if (config.borderColor && config.borderWidth) {
    ctx.save();
    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = config.borderWidth;
    ctx.beginPath();
    ctx.arc(x, y, size / 2 + config.borderWidth / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Draw image
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

function renderSliceImage(ctx, element, img, config) {
  // Common geometry variables
  const chart = element._chart || element.chart;
  const chartArea = chart.chartArea;
  const centerX = chartArea.left + chartArea.width / 2;
  const centerY = chartArea.top + chartArea.height / 2;
  const startAngle = element.startAngle || 0;
  const endAngle = element.endAngle || 0;
  const innerRadius = element.innerRadius || 0;
  const outerRadius = element.outerRadius || Math.min(chartArea.width, chartArea.height) / 2;

  // Fill slice mode
  if (config.fillSlice) {
    ctx.save();
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
    const imageFit = config.imageFit || 'cover';
    if (imageFit === 'contain') {
      // Largest rectangle fully inside the sector (approximate)
      const sliceAngle = Math.abs(endAngle - startAngle);
      const imgAspect = img.width / img.height;
      let best = { area: 0, x: 0, y: 0, w: 0, h: 0 };
      const angleSteps = 30;
      const radiusSteps = 30;
      for (let ai = 0; ai <= angleSteps; ai++) {
        const fracA = ai / angleSteps;
        const theta = startAngle + fracA * (endAngle - startAngle);
        for (let ri = 0; ri <= radiusSteps; ri++) {
          const fracR = ri / radiusSteps;
          const r = innerRadius + fracR * (outerRadius - innerRadius);
          // Binary search for max width
          let low = 0, high = outerRadius - innerRadius, maxW = 0, maxH = 0;
          for (let iter = 0; iter < 10; iter++) {
            const mid = (low + high) / 2;
            let w, h;
            if (imgAspect > 1) {
              w = mid;
              h = w / imgAspect;
            } else {
              h = mid;
              w = h * imgAspect;
            }
            // Rectangle corners in cartesian
            const corners = [
              { dx: -w/2, dy: -h/2 },
              { dx: w/2, dy: -h/2 },
              { dx: w/2, dy: h/2 },
              { dx: -w/2, dy: h/2 },
            ].map(({dx,dy}) => {
              // Place center at (cx,cy)
              const cx = centerX + Math.cos(theta) * r;
              const cy = centerY + Math.sin(theta) * r;
              return { x: cx + dx, y: cy + dy };
            });
            // Check all corners are inside the sector
            const allInside = corners.every(({x, y}) => {
              const relX = x - centerX;
              const relY = y - centerY;
              const rad = Math.sqrt(relX*relX + relY*relY);
              let ang = Math.atan2(relY, relX);
              if (ang < 0) ang += 2 * Math.PI;
              let sA = startAngle, eA = endAngle;
              if (sA < 0) sA += 2 * Math.PI;
              if (eA < 0) eA += 2 * Math.PI;
              if (eA < sA) eA += 2 * Math.PI;
              if (ang < sA) ang += 2 * Math.PI;
              return (
                rad >= innerRadius - 0.5 && rad <= outerRadius + 0.5 &&
                ang >= sA - 1e-6 && ang <= eA + 1e-6
              );
            });
            if (allInside) {
              maxW = w; maxH = h; low = mid;
            } else {
              high = mid;
            }
          }
          if (maxW > 0 && maxH > 0 && maxW * maxH > best.area) {
            // Place center at (cx,cy)
            const cx = centerX + Math.cos(theta) * r;
            const cy = centerY + Math.sin(theta) * r;
            best = { area: maxW * maxH, x: cx - maxW/2, y: cy - maxH/2, w: maxW, h: maxH };
          }
        }
      }
      if (best.area > 0) {
        ctx.drawImage(img, best.x, best.y, best.w, best.h);
      }
    } else {
      // --- Calculate the bounding box for the current slice only ---
      const points = [];
      const steps = 100; // More steps = more accurate bounding box
      for (let i = 0; i <= steps; i++) {
        const angle = startAngle + (endAngle - startAngle) * (i / steps);
        points.push([
          centerX + Math.cos(angle) * outerRadius,
          centerY + Math.sin(angle) * outerRadius
        ]);
        if (innerRadius > 0) {
          points.push([
            centerX + Math.cos(angle) * innerRadius,
            centerY + Math.sin(angle) * innerRadius
          ]);
        }
      }
      const xs = points.map(p => p[0]);
      const ys = points.map(p => p[1]);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const sliceWidth = maxX - minX;
      const sliceHeight = maxY - minY;
      let drawX = minX;
      let drawY = minY;
      let drawWidth = sliceWidth;
      let drawHeight = sliceHeight;
      if (imageFit === 'fill') {
        drawX = minX;
        drawY = minY;
        drawWidth = sliceWidth;
        drawHeight = sliceHeight;
      } else {
        // cover (default)
        const imgAspect = img.width / img.height;
        const sliceAspect = sliceWidth / sliceHeight;
        if (imgAspect > sliceAspect) {
          drawHeight = sliceHeight;
          drawWidth = sliceHeight * imgAspect;
          drawX = minX + (sliceWidth - drawWidth) / 2;
        } else {
          drawWidth = sliceWidth;
          drawHeight = sliceWidth / imgAspect;
          drawY = minY + (sliceHeight - drawHeight) / 2;
        }
      }
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }
    ctx.restore();
    return;
  }

  // ...rest of the original renderSliceImage logic for non-fill mode...
  const size = config.size || 30;
  let x = element.x;
  let y;
  switch (config.position) {
    case "center":
      // Center of the slice: halfway between inner and outer radius
      const midAngle = (startAngle + endAngle) / 2;
      const r = innerRadius + (outerRadius - innerRadius) * 0.5;
      x = centerX + Math.cos(midAngle) * r;
      y = centerY + Math.sin(midAngle) * r;
      break;
    case "above":
      // Above the slice: outside the outer radius
      {
        const midAngle = (startAngle + endAngle) / 2;
        const rAbove = outerRadius + size * 0.7;
        x = centerX + Math.cos(midAngle) * rAbove;
        y = centerY + Math.sin(midAngle) * rAbove;
      }
      break;
    case "below":
      // Below the slice: closer to inner radius
      {
        const midAngle = (startAngle + endAngle) / 2;
        const rBelow = innerRadius + (outerRadius - innerRadius) * 0.2;
        x = centerX + Math.cos(midAngle) * rBelow;
        y = centerY + Math.sin(midAngle) * rBelow;
      }
      break;
    case "callout":
      // Callout position - handled separately
      {
        const datasetIndex = element._datasetIndex || 0;
        const pointIndex = element._index || 0;
        renderCalloutImage(ctx, element.x, element.y, img, config, datasetIndex, pointIndex, chart);
        return;
      }
    default:
      // Default: place at element center
      y = element.y - size / 2 - 5;
      break;
  }
  drawImageWithClipping(ctx, x - size / 2, y - size / 2, size, size, img, config.type);
}

function renderSliceFillImage(ctx, element, img, config) {
  const chartArea = element.chart.chartArea;
  const centerX = chartArea.left + chartArea.width / 2;
  const centerY = chartArea.top + chartArea.height / 2;
  const startAngle = element.startAngle;
  const endAngle = element.endAngle;
  const innerRadius = element.innerRadius;
  const outerRadius = element.outerRadius;

  if (config.fillSlice) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.clip();

    const fit = config.imageFit || 'cover';
    let dx = centerX - outerRadius, dy = centerY - outerRadius;
    let dWidth = outerRadius * 2, dHeight = outerRadius * 2;
    const sliceAspect = (endAngle - startAngle) / (Math.PI * 2);
    const imgAspect = img.width / img.height;

    if (fit === 'contain') {
      if (imgAspect > sliceAspect) {
        dWidth = outerRadius * 2;
        dHeight = dWidth / imgAspect;
        dy = centerY - dHeight / 2;
      } else {
        dHeight = outerRadius * 2;
        dWidth = dHeight * imgAspect;
        dx = centerX - dWidth / 2;
      }
    }

    ctx.drawImage(img, dx, dy, dWidth, dHeight);
    ctx.restore();
  } else {
    const midAngle = (startAngle + endAngle) / 2;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = centerX + Math.cos(midAngle) * radius;
    const y = centerY + Math.sin(midAngle) * radius;
    const size = config.size || 30;

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
}

function drawImageWithClipping(ctx, x, y, w, h, img, type) {
  ctx.save();
  ctx.beginPath();
  if (type === 'circle') {
    ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
  } else if (type === 'square') {
    ctx.rect(x, y, w, h);
  } else if (type === 'rounded') {
    const radius = Math.min(w, h) / 2;
    ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
  }
  ctx.clip();
  ctx.drawImage(img, x, y, w, h);
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

/**
 * Generate the overlay plugin code for HTML export
 */
export function generateOverlayPluginCode(overlayConfig: any): string {
  if (!overlayConfig || (!overlayConfig.overlayImages?.length && !overlayConfig.overlayTexts?.length)) {
    return '';
  }

  return `
// Overlay Plugin for HTML Export
const overlayPlugin = {
  id: 'overlayPlugin',
  
  afterDraw(chart) {
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    
    const pluginConfig = ${JSON.stringify(overlayConfig)};
    const overlayImages = pluginConfig.overlayImages || [];
    const overlayTexts = pluginConfig.overlayTexts || [];
    
    // Draw overlay images
    if (overlayImages.length > 0) {
      overlayImages.forEach((image) => {
        if (image.visible) {
          const x = chartArea.left + image.x;
          const y = chartArea.top + image.y;
          const w = image.width;
          const h = image.height;
          
          // Create image element
          const img = new Image();
          img.crossOrigin = "anonymous";
          
          img.onload = () => {
            ctx.save();
            
            // Apply transformations
            if (image.rotation) {
              const centerX = x + w / 2;
              const centerY = y + h / 2;
              ctx.translate(centerX, centerY);
              ctx.rotate(image.rotation * Math.PI / 180);
              ctx.translate(-centerX, -centerY);
            }
            
            // Draw border if specified
            if (image.borderWidth > 0) {
              ctx.strokeStyle = image.borderColor;
              ctx.lineWidth = image.borderWidth;
              
              if (image.shape === 'circle') {
                const centerX = x + w / 2;
                const centerY = y + h / 2;
                const radius = Math.min(w, h) / 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.stroke();
              } else {
                ctx.strokeRect(x, y, w, h);
              }
            }
            
            // Draw image with shape clipping
            if (image.shape === 'circle') {
              const centerX = x + w / 2;
              const centerY = y + h / 2;
              const radius = Math.min(w, h) / 2;
              ctx.save();
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
              ctx.clip();
              ctx.drawImage(img, x, y, w, h);
              ctx.restore();
            } else if (image.shape === 'rounded') {
              const radius = Math.min(w, h) * 0.1;
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(x, y, w, h, radius);
              ctx.clip();
              ctx.drawImage(img, x, y, w, h);
              ctx.restore();
            } else {
              // Rectangle shape
              ctx.drawImage(img, x, y, w, h);
            }
            
            ctx.restore();
          };
          
          img.src = image.url;
        }
      });
    }
    
    // Draw overlay texts
    if (overlayTexts.length > 0) {
      overlayTexts.forEach((text) => {
        if (text.visible) {
          const x = chartArea.left + text.x;
          const y = chartArea.top + text.y;
          
          ctx.save();
          
          // Apply transformations
          if (text.rotation) {
            ctx.translate(x, y);
            ctx.rotate(text.rotation * Math.PI / 180);
            ctx.translate(-x, -y);
          }
          
          // Set font properties
          ctx.font = \`\${text.fontSize}px \${text.fontFamily}\`;
          ctx.fillStyle = text.color;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          
          // Handle text wrapping
          const maxWidth = text.maxWidth || 200;
          const words = text.text.split(' ');
          const lines = [];
          let currentLine = '';
          
          words.forEach(word => {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          });
          if (currentLine) {
            lines.push(currentLine);
          }
          
          // Calculate total dimensions
          const lineHeight = text.fontSize * 1.2;
          const totalHeight = lines.length * lineHeight;
          
          // Draw background if not transparent
          if (!text.backgroundTransparent && text.backgroundColor) {
            const paddingX = text.paddingX || 8;
            const paddingY = text.paddingY || 4;
            const bgX = x - paddingX;
            const bgY = y - paddingY;
            const bgWidth = Math.max(...lines.map(line => ctx.measureText(line).width)) + (paddingX * 2);
            const bgHeight = totalHeight + (paddingY * 2);
            
            ctx.fillStyle = text.backgroundColor;
            ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
            
            // Reset fill style for text
            ctx.fillStyle = text.color;
          }
          
          // Draw border if specified
          if (text.borderWidth > 0) {
            const paddingX = text.paddingX || 8;
            const paddingY = text.paddingY || 4;
            const bgX = x - paddingX;
            const bgY = y - paddingY;
            const bgWidth = Math.max(...lines.map(line => ctx.measureText(line).width)) + (paddingX * 2);
            const bgHeight = totalHeight + (paddingY * 2);
            
            ctx.strokeStyle = text.borderColor;
            ctx.lineWidth = text.borderWidth;
            ctx.strokeRect(bgX, bgY, bgWidth, bgHeight);
          }
          
          // Draw text lines
          lines.forEach((line, index) => {
            const lineY = y + (index * lineHeight);
            ctx.fillText(line, x, lineY);
          });
          
          ctx.restore();
        }
      });
    }
  }
};

// Register the overlay plugin
Chart.register(overlayPlugin);
`;
}

/**
 * Generate the complete plugin system for HTML export
 */
export function generateCompletePluginSystem(chartConfig: any): string {
  const customLabelsConfig = (chartConfig.plugins as any)?.customLabels;
  const overlayConfig = (chartConfig.plugins as any)?.overlayPlugin;
  const hasCustomLabels = customLabelsConfig && customLabelsConfig.labels;
  const hasImages = chartConfig.data?.datasets?.some((ds: any) => Array.isArray(ds.pointImages) && ds.pointImages.some((v: any) => !!v));
  const hasOverlays = overlayConfig && (overlayConfig.overlayImages?.length > 0 || overlayConfig.overlayTexts?.length > 0);

  let pluginCode = '';

  // Add custom label plugin if needed
  if (hasCustomLabels) {
    pluginCode += generateCustomLabelPluginCode(customLabelsConfig);
  }

  // Add universal image plugin if needed
  if (hasImages) {
    pluginCode += generateUniversalImagePluginCode();
  }

  // Add overlay plugin if needed
  if (hasOverlays) {
    pluginCode += generateOverlayPluginCode(overlayConfig);
  }

  return pluginCode;
} 