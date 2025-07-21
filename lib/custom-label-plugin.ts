import { Chart, Plugin } from 'chart.js';

export type LabelAnchor = 'center' | 'top' | 'bottom' | 'callout';
export type LabelShape = 'rectangle' | 'circle' | 'star' | 'none';

export interface CustomLabel {
  text: string;
  anchor?: LabelAnchor;
  shape?: LabelShape;
  x?: number; // absolute x (overrides anchor)
  y?: number; // absolute y (overrides anchor)
  color?: string;
  font?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  // For callout/arrow
  callout?: boolean;
  calloutColor?: string;
  // For draggable callout
  draggable?: boolean;
  calloutX?: number;
  calloutY?: number;
  // Enhanced arrow options
  arrowLine?: boolean; // Show/hide the arrow line
  arrowHead?: boolean; // Show/hide the arrow head
  arrowColor?: string;
  calloutOffset?: number;
  arrowEndGap?: number; // Distance from label center to stop arrow
}

export interface CustomLabelPluginOptions {
  labels: CustomLabel[][]; // [dataset][point]
  shapeSize?: number; // px, default 32
}

// Drag state (per chart instance)
const dragStateMap = new WeakMap<any, any>();

// Function to get current drag state for HTML export
export function getCurrentDragState(chart: any): any {
  return dragStateMap.get(chart) || {};
}

// Function to set drag state from HTML export
export function setDragState(chart: any, state: any) {
  dragStateMap.set(chart, state);
}

export const customLabelPlugin: Plugin = {
  id: 'customLabels',
  afterDraw(chart) {
    const opts: CustomLabelPluginOptions | undefined = (chart.options.plugins as any)?.customLabels;
    if (!opts || !opts.labels) return;
    const ctx = chart.ctx;
    const shapeSize = opts.shapeSize ?? 32;
    chart.data.datasets.forEach((dataset, datasetIdx) => {
      const meta = chart.getDatasetMeta(datasetIdx);
      if (!meta || !meta.data) return;
      const labelArr = opts.labels[datasetIdx] || [];
      meta.data.forEach((element: any, pointIdx: number) => {
        const label = labelArr[pointIdx];
        if (!label || !label.text) return;
        // --- Position logic ---
        let x = label.x;
        let y = label.y;
        let anchor = label.anchor || 'center';
        // If callout and draggable, use stored position
        if (anchor === 'callout' && label.draggable) {
          const dragState = dragStateMap.get(chart) || {};
          const dragKey = `${datasetIdx}_${pointIdx}`;
          if (dragState[dragKey]) {
            x = dragState[dragKey].x;
            y = dragState[dragKey].y;
          } else if (x == null || y == null) {
            // Default callout position: offset from element
            const offset = label.calloutOffset || shapeSize * 1.5;
            x = (element.x ?? 0) + offset;
            y = (element.y ?? 0) - offset;
          }
        }
        // If not absolute, calculate based on anchor
        if (x == null || y == null) {
          const chartType = (chart.config as any).type as string;
          if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
            // Pie/doughnut
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
            // Robust horizontal bar detection: indexAxis === 'y' means horizontal
            const isHorizontal = (chart.options.indexAxis === 'y');
            if (isHorizontal) {
              if (anchor === 'center') {
                // Center of the bar: halfway between left (element.base) and right (element.x)
                x = ((element.x ?? 0) + (element.base ?? 0)) / 2;
                y = element.y ?? 0;
              } else if (anchor === 'top') {
                // Right end of the bar
                x = (element.x ?? 0) + 8;
                y = element.y ?? 0;
              } else if (anchor === 'bottom') {
                // Just inside the left end of the bar
                const barStart = Math.min(element.x ?? 0, element.base ?? 0);
                x = barStart + 8; // 8px inside the bar
                y = element.y ?? 0;
              } else if (anchor === 'callout') {
                const offset = label.calloutOffset || shapeSize * 1.5;
                x = (element.x ?? 0) + offset;
                y = (element.y ?? 0) - offset;
              }
            } else {
              if (anchor === 'center') {
                x = element.x ?? 0;
                // Center of the bar: halfway between top (element.y) and base (element.base)
                y = ((element.y ?? 0) + (element.base ?? 0)) / 2;
              } else if (anchor === 'top') {
                x = element.x ?? 0;
                // Just above the bar
                y = (element.y ?? 0) - 8;
              } else if (anchor === 'bottom') {
                x = element.x ?? 0;
                // Just inside the bottom of the bar
                y = (element.base ?? 0) - 8;
              } else if (anchor === 'callout') {
                const offset = label.calloutOffset || shapeSize * 1.5;
                x = (element.x ?? 0) + offset;
                y = (element.y ?? 0) - offset;
              }
            }
          } else if (chartType === 'line' || chartType === 'area' || chartType === 'scatter' || chartType === 'bubble') {
            // Line, area, scatter, bubble
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
          } else if (chartType === 'radar') {
            // Radar chart
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
          } else {
            // Line, scatter, etc.
            x = element.x ?? 0;
            y = element.y ?? 0;
          }
        }
        
        // --- Draw enhanced callout arrow if needed ---
        if (anchor === 'callout' && label.callout && (label.arrowLine || label.arrowHead)) {
          ctx.save();
          ctx.strokeStyle = label.arrowColor || label.calloutColor || '#333';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);

          // Calculate arrow path based on chart type
          const chartType = (chart.config as any).type as string;
          let startX = element.x ?? 0;
          let startY = element.y ?? 0;

          // Adjust start point for different chart types
          if (chartType === "pie" || chartType === "doughnut" || chartType === "polarArea") {
            const chartArea = chart.chartArea;
            const centerX = chartArea.left + chartArea.width / 2;
            const centerY = chartArea.top + chartArea.height / 2;
            const angle = Math.atan2(startY - centerY, startX - centerX);
            const radius = Math.min(chartArea.width, chartArea.height) / 2;
            startX = centerX + Math.cos(angle) * radius;
            startY = centerY + Math.sin(angle) * radius;
          } else if (chartType === "bar") {
            if (chart.options.indexAxis === "y") {
              startX = element.x ?? 0;
              startY = element.y ?? 0;
            } else {
              startX = element.x ?? 0;
              startY = element.y ?? 0;
            }
          }

          // Calculate the end point (label center) and apply arrowEndGap
          let endX = x ?? 0;
          let endY = y ?? 0;
          const gap = label.arrowEndGap || 0;
          if (gap > 0) {
            const angle = Math.atan2(endY - startY, endX - startX);
            endX = endX - gap * Math.cos(angle);
            endY = endY - gap * Math.sin(angle);
          }

          // Draw the arrow line if enabled
          if (label.arrowLine) {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          }

          // Draw arrow head if enabled
          if (label.arrowHead) {
            const angle = Math.atan2((endY) - startY, (endX) - startX);
            const arrowLength = 12;
          ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
              endX - arrowLength * Math.cos(angle - Math.PI / 6),
              endY - arrowLength * Math.sin(angle - Math.PI / 6),
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
              endX - arrowLength * Math.cos(angle + Math.PI / 6),
              endY - arrowLength * Math.sin(angle + Math.PI / 6),
            );
          ctx.stroke();
          }
          ctx.restore();
        }
        
        // --- Draw shape/background ---
        if (label.shape !== 'none' && label.shape !== undefined) {
          ctx.save();
          // Style
          ctx.font = label.font || 'bold 14px Arial';
          const textMetrics = ctx.measureText(label.text);
          const padding = label.padding ?? 6;
          const borderRadius = label.borderRadius ?? 6;
          const w = shapeSize;
          const h = shapeSize;
          // Background
          if (label.backgroundColor) {
            ctx.fillStyle = label.backgroundColor;
            if (label.shape === 'rectangle') {
              roundRect(ctx, (x ?? 0) - w / 2, (y ?? 0) - h / 2, w, h, borderRadius);
              ctx.fill();
            } else if (label.shape === 'circle') {
              ctx.beginPath();
              ctx.arc(x ?? 0, y ?? 0, w / 2, 0, 2 * Math.PI);
              ctx.fill();
            } else if (label.shape === 'star') {
              drawStar(ctx, x ?? 0, y ?? 0, w / 2, 5);
              ctx.fill();
            }
          }
          // Border
          if (label.borderColor && label.borderWidth) {
            ctx.strokeStyle = label.borderColor;
            ctx.lineWidth = label.borderWidth;
            if (label.shape === 'rectangle') {
              roundRect(ctx, (x ?? 0) - w / 2, (y ?? 0) - h / 2, w, h, borderRadius);
              ctx.stroke();
            } else if (label.shape === 'circle') {
              ctx.beginPath();
              ctx.arc(x ?? 0, y ?? 0, w / 2, 0, 2 * Math.PI);
              ctx.stroke();
            } else if (label.shape === 'star') {
              drawStar(ctx, x ?? 0, y ?? 0, w / 2, 5);
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
        ctx.fillText(label.text, x ?? 0, y ?? 0);
        ctx.restore();
      });
    });
  },
  afterInit(chart) {
    // Setup drag for callout labels
    const canvas = chart.canvas;
    const dragState: any = {};
    dragStateMap.set(chart, dragState);
    let dragging = false;
    let dragKey = '';
    let offsetX = 0;
    let offsetY = 0;
    function getLabelAt(x: number, y: number) {
      const opts: CustomLabelPluginOptions | undefined = (chart.options.plugins as any)?.customLabels;
      if (!opts || !opts.labels) return null;
      const shapeSize = opts.shapeSize ?? 32;
      for (let datasetIdx = 0; datasetIdx < opts.labels.length; ++datasetIdx) {
        const arr = opts.labels[datasetIdx];
        for (let pointIdx = 0; pointIdx < arr.length; ++pointIdx) {
          const label = arr[pointIdx];
          if (!label || label.anchor !== 'callout' || !label.draggable) continue;
          let lx, ly;
          const key = `${datasetIdx}_${pointIdx}`;
          if (dragState[key]) {
            lx = dragState[key].x;
            ly = dragState[key].y;
          } else {
            const meta = chart.getDatasetMeta(datasetIdx);
            const element = meta.data[pointIdx];
            const offset = label.calloutOffset || shapeSize * 1.5;
            lx = (element.x ?? 0) + offset;
            ly = (element.y ?? 0) - offset;
          }
          // Hit test (circle)
          if (Math.hypot(x - lx, y - ly) < shapeSize / 1.5) {
            return { datasetIdx, pointIdx, lx, ly, key };
          }
        }
      }
      return null;
    }
    function onMouseDown(e: MouseEvent) {
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
    function onMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (dragging && dragKey) {
        dragState[dragKey] = { x: x - offsetX, y: y - offsetY };
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
    function onTouchStart(e: TouchEvent) {
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

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      if (dragging && dragKey) {
        dragState[dragKey] = { x: x - offsetX, y: y - offsetY };
        chart.update('none');
        e.preventDefault();
      }
    }

    function onTouchEnd(e: TouchEvent) {
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
    // Cleanup
    (chart as any)._customLabelListeners = { onMouseDown, onMouseMove, onMouseUp };
  },
  beforeDestroy(chart) {
    const canvas = chart.canvas;
    const listeners = (chart as any)._customLabelListeners;
    if (listeners) {
      canvas.removeEventListener('mousedown', listeners.onMouseDown);
      canvas.removeEventListener('mousemove', listeners.onMouseMove);
      canvas.removeEventListener('mouseup', listeners.onMouseUp);
      canvas.removeEventListener('mouseleave', listeners.onMouseUp);
    }
    dragStateMap.delete(chart);
  }
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, points: number) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i;
    const rad = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(cx + Math.cos(angle - Math.PI / 2) * rad, cy + Math.sin(angle - Math.PI / 2) * rad);
  }
  ctx.closePath();
} 