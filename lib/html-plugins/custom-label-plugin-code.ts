import { type CustomLabel, type CustomLabelPluginOptions } from "../custom-label-plugin";

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
