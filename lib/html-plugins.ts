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
      
      const labelArr = opts.labels[datasetIdx] || [];
      meta.data.forEach((element, pointIdx) => {
        const label = labelArr[pointIdx];
        if (!label || !label.text) return;
        
        // Position logic
        let x = label.x;
        let y = label.y;
        let anchor = label.anchor || 'center';
        
        // If callout and draggable, use stored position
        if (anchor === 'callout' && label.draggable) {
          const dragKey = \`\${datasetIdx}_\${pointIdx}\`;
          const storedPos = window.labelDragState?.[dragKey];
          if (storedPos) {
            x = storedPos.x;
            y = storedPos.y;
          } else if (x == null || y == null) {
            const offset = label.calloutOffset || shapeSize * 1.5;
            x = (element.x ?? 0) + offset;
            y = (element.y ?? 0) - offset;
          }
        }
        
        // Calculate position based on anchor if not absolute
        if (x == null || y == null) {
          const chartType = chart.config.type;
          
          if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
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
            } else if (anchor === 'callout') {
              const offset = label.calloutOffset || shapeSize * 1.5;
              x = (element.x ?? 0) + offset;
              y = (element.y ?? 0) - offset;
            }
          } else if (chartType === 'bar' || chartType === 'horizontalBar') {
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
              } else if (anchor === 'callout') {
                const offset = label.calloutOffset || shapeSize * 1.5;
                x = (element.x ?? 0) + offset;
                y = (element.y ?? 0) - offset;
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
              } else if (anchor === 'callout') {
                const offset = label.calloutOffset || shapeSize * 1.5;
                x = (element.x ?? 0) + offset;
                y = (element.y ?? 0) - offset;
              }
            }
          } else {
            x = element.x ?? 0;
            if (anchor === 'center') {
              y = element.y ?? 0;
            } else if (anchor === 'top') {
              y = (element.y ?? 0) - 12;
            } else if (anchor === 'bottom') {
              y = (element.y ?? 0) + 12;
            } else if (anchor === 'callout') {
              const offset = label.calloutOffset || shapeSize * 1.5;
              x = (element.x ?? 0) + offset;
              y = (element.y ?? 0) - offset;
            }
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
            const chartArea = chart.chartArea;
            const centerX = chartArea.left + chartArea.width / 2;
            const centerY = chartArea.top + chartArea.height / 2;
            const angle = Math.atan2(startY - centerY, startX - centerX);
            const radius = Math.min(chartArea.width, chartArea.height) / 2;
            startX = centerX + Math.cos(angle) * radius;
            startY = centerY + Math.sin(angle) * radius;
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
              ctx.lineTo(endX, endY);
              ctx.stroke();
            }
            
            if (label.arrowHead) {
              const headLength = 8;
              const headAngle = Math.PI / 6;
              
              ctx.beginPath();
              ctx.moveTo(endX, endY);
              ctx.lineTo(
                endX - headLength * Math.cos(Math.atan2(dy, dx) - headAngle),
                endY - headLength * Math.sin(Math.atan2(dy, dx) - headAngle)
              );
              ctx.moveTo(endX, endY);
              ctx.lineTo(
                endX - headLength * Math.cos(Math.atan2(dy, dx) + headAngle),
                endY - headLength * Math.sin(Math.atan2(dy, dx) + headAngle)
              );
              ctx.stroke();
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

      meta.data.forEach((element, pointIndex) => {
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

    // Add event listeners
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);

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

  if (config.fillBar) {
    const barWidth = element.width;
    const barHeight = Math.abs(element.y - element.base);
    const barX = element.x - barWidth / 2;
    const barY = Math.min(element.y, element.base);

    ctx.save();
    ctx.beginPath();
    ctx.rect(barX, barY, barWidth, barHeight);
    ctx.clip();

    const fit = config.imageFit || 'cover';
    let dx = barX, dy = barY, dWidth = barWidth, dHeight = barHeight;
    const barAspect = barWidth / barHeight;
    const imgAspect = img.width / img.height;

    if (fit === 'contain') {
      if (imgAspect > barAspect) {
        dWidth = barWidth;
        dHeight = dWidth / imgAspect;
        dy = barY + (barHeight - dHeight) / 2;
      } else {
        dHeight = barHeight;
        dWidth = dHeight * imgAspect;
        dx = barX + (barWidth - dWidth) / 2;
      }
    } else if (fit === 'cover') {
      if (imgAspect > barAspect) {
        dHeight = barHeight;
        dWidth = dHeight * imgAspect;
        dx = barX + (barWidth - dWidth) / 2;
      } else {
        dWidth = barWidth;
        dHeight = dWidth / imgAspect;
        dy = barY + (barHeight - dHeight) / 2;
      }
    }

    ctx.drawImage(img, dx, dy, dWidth, dHeight);
    ctx.restore();
  } else {
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

function renderBarImageHorizontal(ctx, element, img, config) {
  const size = config.size || 30;
  const x = element.x;
  const y = element.y;

  if (config.fillBar) {
    const barWidth = Math.abs(element.x - element.base);
    const barHeight = element.width;
    const barX = Math.min(element.x, element.base);
    const barY = element.y - barHeight / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(barX, barY, barWidth, barHeight);
    ctx.clip();

    const fit = config.imageFit || 'cover';
    let dx = barX, dy = barY, dWidth = barWidth, dHeight = barHeight;
    const barAspect = barWidth / barHeight;
    const imgAspect = img.width / img.height;

    if (fit === 'contain') {
      if (imgAspect > barAspect) {
        dWidth = barWidth;
        dHeight = dWidth / imgAspect;
        dy = barY + (barHeight - dHeight) / 2;
      } else {
        dHeight = barHeight;
        dWidth = dHeight * imgAspect;
        dx = barX + (barWidth - dWidth) / 2;
      }
    } else if (fit === 'cover') {
      if (imgAspect > barAspect) {
        dHeight = barHeight;
        dWidth = dHeight * imgAspect;
        dx = barX + (barWidth - dWidth) / 2;
      } else {
        dWidth = barWidth;
        dHeight = dWidth / imgAspect;
        dy = barY + (barHeight - dHeight) / 2;
      }
    }

    ctx.drawImage(img, dx, dy, dWidth, dHeight);
    ctx.restore();
  } else {
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
  let x = config.calloutX !== undefined ? config.calloutX : pointX + (config.offset || 40);
  let y = config.calloutY !== undefined ? config.calloutY : pointY - (config.offset || 40);

  // Draw arrow if enabled
  if (config.arrow) {
    ctx.save();
    ctx.strokeStyle = config.arrowColor || '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pointX, pointY);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Draw arrow head
    const headLength = 8;
    const headAngle = Math.PI / 6;
    const angle = Math.atan2(y - pointY, x - pointX);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x - headLength * Math.cos(angle - headAngle),
      y - headLength * Math.sin(angle - headAngle)
    );
    ctx.moveTo(x, y);
    ctx.lineTo(
      x - headLength * Math.cos(angle + headAngle),
      y - headLength * Math.sin(angle + headAngle)
    );
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
 * Generate the complete plugin system for HTML export
 */
export function generateCompletePluginSystem(chartConfig: any): string {
  const customLabelsConfig = (chartConfig.plugins as any)?.customLabels;
  const hasCustomLabels = customLabelsConfig && customLabelsConfig.labels;
  const hasImages = chartConfig.data?.datasets?.some((ds: any) => ds.pointImages?.length > 0);

  let pluginCode = '';

  // Add custom label plugin if needed
  if (hasCustomLabels) {
    pluginCode += generateCustomLabelPluginCode(customLabelsConfig);
  }

  // Add universal image plugin if needed
  if (hasImages) {
    pluginCode += generateUniversalImagePluginCode();
  }

  return pluginCode;
} 