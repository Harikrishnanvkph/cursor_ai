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
    
    // 3D Tilt Support
    const pie3dOpts = chart.options.plugins?.pie3d;
    const is3dActive = !!pie3dOpts?.enabled;
    const tilt = is3dActive ? (typeof pie3dOpts.tilt === 'number' ? pie3dOpts.tilt : 0.75) : 1.0;
    const chartArea = chart.chartArea;
    const centerY_chart = (chartArea.top + chartArea.bottom) / 2;
    const transformY = (valY) => is3dActive ? centerY_chart + (valY - centerY_chart) * tilt : valY;

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

        if (anchor === 'callout' && label.draggable) {
          // Unified callout positioning: check drag state first, then stored position, then compute default
          const key = \`\${datasetIdx}_\${pointIdx}\`;
          if (window.labelDragState && window.labelDragState[key]) {
            x = window.labelDragState[key].x;
            y = window.labelDragState[key].y;
          } else if (label.x != null && label.y != null) {
            x = label.x;
            y = label.y;
          } else {
            // Compute default position per chart type
            const offset = label.calloutOffset || shapeSize * 1.5;
            if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
              const cArea = chart.chartArea;
              const centerX = cArea.left + cArea.width / 2;
              const centerY = cArea.top + cArea.height / 2;
              const startAngle = element.startAngle ?? 0;
              const endAngle = element.endAngle ?? 0;
              const midAngle = (startAngle + endAngle) / 2;
              const outerRadius = element.outerRadius ?? Math.min(cArea.width, cArea.height) / 2;
              const r = outerRadius + offset;
              x = centerX + Math.cos(midAngle) * r;
              y = transformY(centerY + Math.sin(midAngle) * r);
            } else {
              x = element.x ?? 0;
              y = (element.y ?? 0) - offset;
            }
          }

          // Clamp label within canvas boundaries
          const halfShape = shapeSize / 2;
          const padding = 5;
          x = Math.max(halfShape + padding, Math.min(x, chart.width - halfShape - padding));
          y = Math.max(halfShape + padding, Math.min(y, chart.height - halfShape - padding));
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
        
        // Apply 3D tilt transform only for non-callout labels
        // (callout labels handle tilt inside their own branch)
        if (!(anchor === 'callout' && label.draggable)) {
          y = transformY(y);
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
            // Apply 3D tilt to arrow start point
            startY = transformY(startY);
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
        
        // --- Draw shape/background ---
        if (label.shape !== 'none' && label.shape !== undefined) {
          ctx.save();
          ctx.font = label.font || 'bold 14px Arial';
          const borderRadius = label.borderRadius ?? 6;
          const w = shapeSize;
          const h = shapeSize;
          
          // Background fill
          if (label.backgroundColor) {
            ctx.fillStyle = label.backgroundColor;
            if (label.shape === 'rectangle') {
              roundRect(ctx, x - w / 2, y - h / 2, w, h, borderRadius);
              ctx.fill();
            } else if (label.shape === 'circle') {
              ctx.beginPath();
              ctx.arc(x, y, w / 2, 0, 2 * Math.PI);
              ctx.fill();
            } else if (label.shape === 'star') {
              drawStar(ctx, x, y, w / 2, 5);
              ctx.fill();
            }
          }
          
          // Border stroke
          if (label.borderColor && label.borderWidth) {
            ctx.strokeStyle = label.borderColor;
            ctx.lineWidth = label.borderWidth;
            if (label.shape === 'rectangle') {
              roundRect(ctx, x - w / 2, y - h / 2, w, h, borderRadius);
              ctx.stroke();
            } else if (label.shape === 'circle') {
              ctx.beginPath();
              ctx.arc(x, y, w / 2, 0, 2 * Math.PI);
              ctx.stroke();
            } else if (label.shape === 'star') {
              drawStar(ctx, x, y, w / 2, 5);
              ctx.stroke();
            }
          }
          ctx.restore();
        }
        
        // --- Draw text ---
        ctx.save();
        ctx.font = label.font || 'bold 14px Arial';
        ctx.fillStyle = label.color || '#222';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
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
  let isHovering = false;
  let dragKey = '';
  let offsetX = 0;
  let offsetY = 0;

  function getLabelAt(x, y) {
    const opts = ${JSON.stringify(customLabelsConfig)};
    if (!opts || !opts.labels) return null;
    const shapeSize = opts.shapeSize ?? 32;

    // Define transformY locally for 3D hit-testing
    const pie3dOpts = chart.options.plugins?.pie3d;
    const is3dActive = !!(pie3dOpts?.enabled);
    const tilt = is3dActive ? (typeof pie3dOpts.tilt === 'number' ? pie3dOpts.tilt : 0.75) : 1.0;
    const chartArea = chart.chartArea;
    const centerY_chart = (chartArea.top + chartArea.bottom) / 2;
    const localTransformY = (valY) => is3dActive ? centerY_chart + (valY - centerY_chart) * tilt : valY;
    
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
        } else if (label.x != null && label.y != null) {
          lx = label.x;
          ly = label.y;
        } else {
          const meta = chart.getDatasetMeta(datasetIdx);
          const element = meta.data[pointIdx];
          const offset = label.calloutOffset || shapeSize * 1.5;
          if (chart.config.type === 'pie' || chart.config.type === 'doughnut' || chart.config.type === 'polarArea') {
            const cArea = chart.chartArea;
            const cX = cArea.left + cArea.width / 2;
            const cY = cArea.top + cArea.height / 2;
            const startAngle = element.startAngle ?? 0;
            const endAngle = element.endAngle ?? 0;
            const midAngle = (startAngle + endAngle) / 2;
            const outerRadius = element.outerRadius ?? Math.min(cArea.width, cArea.height) / 2;
            const r = outerRadius + offset;
            lx = cX + Math.cos(midAngle) * r;
            ly = localTransformY(cY + Math.sin(midAngle) * r);
          } else {
            lx = element.x ?? 0;
            ly = (element.y ?? 0) - offset;
          }
        }

        // Apply clamping to match afterDraw
        const halfShape = shapeSize / 2;
        const pad = 5;
        lx = Math.max(halfShape + pad, Math.min(lx, chart.width - halfShape - pad));
        ly = Math.max(halfShape + pad, Math.min(ly, chart.height - halfShape - pad));
        
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
      if (hit) {
        canvas.style.cursor = 'grab';
        isHovering = true;
      } else if (isHovering) {
        canvas.style.cursor = 'default';
        isHovering = false;
      }
    }
  }

  function onMouseUp() {
    dragging = false;
    isHovering = false; // Reset isHovering on mouse up
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
