import { Chart, Plugin } from 'chart.js';

function safeChartUpdate(chart: any, mode: string = 'none') {
  if (!chart || chart.isDestroyed || !chart.ctx || !chart.canvas) return;
  try {
    chart.update(mode);
  } catch (err) {
    console.warn('[CustomLabelPlugin] Suppressed chart.update layout error:', err);
  }
}

export type LabelAnchor = 'center' | 'top' | 'bottom' | 'callout';
export type LabelShape = 'rectangle' | 'circle' | 'star' | 'none';

export interface CustomLabel {
  text: string;
  anchor?: LabelAnchor;
  shape?: LabelShape;
  textBaseline?: CanvasTextBaseline;
  align?: CanvasTextAlign;
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
  // New: support multi-segment leader lines
  arrowSegments?: 1 | 2; // 1: straight line (default), 2: elbow with bend
  arrowBendX?: number;   // Optional explicit bend point (absolute)
  arrowBendY?: number;
  arrowBendRelX?: number; // Optional bend point relative to end point (percentage of chart width/height if 0..1)
  arrowBendRelY?: number;
  // Arrowhead styling
  arrowHeadStyle?: 'open' | 'filled' | 'bar';
  arrowHeadPosition?: 'start' | 'end';
  arrowHeadSize?: number; // px
  arrowHeadAngle?: number; // radians total half-angle for open/filled types
}

export interface CustomLabelPluginOptions {
  labels: CustomLabel[][]; // [dataset][point]
  shapeSize?: number; // px, default 32
  display?: boolean; // When false, the entire plugin is disabled (no labels rendered)
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

// Reusable boundary clamping for callout labels
function clampToCanvas(chart: any, x: number, y: number, label: any): { x: number; y: number } {
  const ctx = chart.ctx;
  ctx.save();
  ctx.font = label.font || 'bold 14px Arial';
  const textWidth = ctx.measureText(label.text || '').width;
  const textHeight = parseInt(label.font || '14', 10) || 14;
  ctx.restore();
  const padding = label.padding ?? 6;
  const halfW = (textWidth / 2) + padding;
  const halfH = (textHeight / 2) + padding;
  const canvasW = chart.width || chart.canvas.width;
  const canvasH = chart.height || chart.canvas.height;
  const margin = 4;
  let cx = x, cy = y;
  if (cx + halfW > canvasW - margin) cx = canvasW - margin - halfW;
  if (cx - halfW < margin) cx = margin + halfW;
  if (cy - halfH < margin) cy = margin + halfH;
  if (cy + halfH > canvasH - margin) cy = canvasH - margin - halfH;
  return { x: cx, y: cy };
}

function getMidAngle(chart: any, datasetIdx: number, pointIdx: number, element: any): number {
  const isGauge = (chart.options.plugins as any)?.gauge?.enabled;
  if (isGauge) {
    const dataset = chart.data.datasets[datasetIdx];
    const totalValue = dataset.data.reduce((sum: number, val: any) => sum + Math.abs(Number(val) || 0), 0);
    let cumulativeAngle = Math.PI;
    for (let i = 0; i < pointIdx; i++) {
      const sliceValue = Math.abs(Number(dataset.data[i]) || 0);
      const sliceRatio = totalValue > 0 ? sliceValue / totalValue : 0;
      cumulativeAngle += sliceRatio * Math.PI;
    }
    const sliceValue = Math.abs(Number(dataset.data[pointIdx]) || 0);
    const sliceRatio = totalValue > 0 ? sliceValue / totalValue : 0;
    return cumulativeAngle + (sliceRatio * Math.PI) / 2;
  }
  const startAngle = element.startAngle ?? 0;
  const endAngle = element.endAngle ?? 0;
  return (startAngle + endAngle) / 2;
}

function getElementRadius(element: any): number {
  if (!element) return 6;
  if (typeof element.options?.radius === 'number' && element.options.radius > 0) {
    return element.options.radius;
  }
  if (typeof element.options?.pointRadius === 'number' && element.options.pointRadius > 0) {
    return element.options.pointRadius;
  }
  if (typeof element.size === 'number' && element.size > 0) {
    return element.size / 2;
  }
  if (typeof element.radius === 'number' && element.radius > 0) {
    return element.radius;
  }
  return 6;
}

function getLabelFontSize(label: any): number {
  if (typeof label?.font === 'string') {
    const match = label.font.match(/(\d+)px/);
    if (match && match[1]) return parseInt(match[1], 10);
  }
  return 14;
}

// Unified callout position calculator so visual rendering and hit-testing match 100%
function getCalloutDefaultPos(
  chart: any,
  meta: any,
  element: any,
  datasetIdx: number,
  pointIdx: number,
  label: any,
  shapeSize: number,
  transformY: (y: number) => number
): { x: number; y: number } {
  const globalType = (chart.config as any).type as string;
  const chartType = meta?.type || globalType;
  const offset = label.calloutOffset || shapeSize * 1.5;
  const topLimit = (chart.chartArea?.top || 0) + 25;

  if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
    const chartArea = chart.chartArea;
    const centerX = element.x ?? (chartArea.left + chartArea.width / 2);
    const centerY = element.y ?? (chartArea.top + chartArea.height / 2);
    const midAngle = getMidAngle(chart, datasetIdx, pointIdx, element);
    const outerRadius = element.outerRadius ?? Math.min(chartArea.width, chartArea.height) / 2;
    const r = outerRadius + offset;
    return {
      x: centerX + Math.cos(midAngle) * r,
      y: transformY(centerY + Math.sin(midAngle) * r)
    };
  } else if (chartType === 'bar' || chartType === 'horizontalBar' || chartType === 'bar3d' || chartType === 'horizontalBar3d') {
    const isHorizontal = (chart.options.indexAxis === 'y') || chartType === 'horizontalBar' || chartType === 'horizontalBar3d';
    if (isHorizontal) {
      const rightEdge = Math.max(element.x ?? 0, element.base ?? 0);
      const elemY = element.y ?? 0;
      return {
        x: rightEdge + offset,
        y: elemY - offset < topLimit ? elemY + offset : elemY - offset
      };
    } else {
      const barTop = Math.min(element.y ?? 0, element.base ?? 0);
      return {
        x: (element.x ?? 0) + offset,
        y: barTop - offset < topLimit ? barTop + offset : barTop - offset
      };
    }
  } else if (chartType === 'line' || chartType === 'area' || chartType === 'scatter' || chartType === 'bubble' || chartType === 'radar') {
    const elemY = element.y ?? 0;
    const elemX = element.x ?? 0;
    const radius = getElementRadius(element);
    const xShift = (pointIdx % 2 === 0 ? 1 : -1) * (offset * 0.6);
    const targetY = elemY - radius;
    return {
      x: elemX + xShift,
      y: targetY - offset < topLimit ? targetY + offset : targetY - offset
    };
  }
  return {
    x: (element.x ?? 0) + offset,
    y: (element.y ?? 0) - offset
  };
}

export const customLabelPlugin: Plugin = {
  id: 'customLabels',
  afterDraw(chart) {
    const opts: CustomLabelPluginOptions | undefined = (chart?.options?.plugins as any)?.customLabels;
    if (!opts || !opts.labels) return;
    // Top-level display guard: when labels are toggled off, skip all rendering
    if (opts.display === false) return;
    const ctx = chart.ctx;
    const shapeSize = opts.shapeSize ?? 32;

    // Detect if 3D pie is active and get tilt
    const pie3dOpts = (chart.options.plugins as any)?.pie3d;
    const is3dActive = !!(pie3dOpts && pie3dOpts.enabled);
    const tilt = is3dActive ? (typeof pie3dOpts.tilt === 'number' ? pie3dOpts.tilt : 0.75) : 1.0;
    const chartArea = chart.chartArea;
    const centerY_chart = (chartArea.top + chartArea.bottom) / 2;

    const transformY = (y: number) => is3dActive ? centerY_chart + (y - centerY_chart) * tilt : y;

    chart.data.datasets.forEach((dataset, datasetIdx) => {
      const meta = chart.getDatasetMeta(datasetIdx);
      if (!meta || !meta.data) return;
      // Respect default Chart.js legend visibility for datasets
      const dsVisible = typeof (chart as any).isDatasetVisible === 'function'
        ? (chart as any).isDatasetVisible(datasetIdx)
        : true;
      if (!dsVisible) return;
      const labelArr = opts.labels[datasetIdx] || [];
      meta.data.forEach((element: any, pointIdx: number) => {
        const label = labelArr[pointIdx];
        if (!label || !label.text) return;
        // Respect default Chart.js legend visibility for pie/doughnut/polarArea slices
        const chartType = (chart.config as any).type as string;
        if ((chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') &&
          typeof (chart as any).getDataVisibility === 'function') {
          if ((chart as any).getDataVisibility(pointIdx) === false) return;
        }

        // Gauge plugin natively handles non-callout labels using curved text
        const isGauge = (chart.options.plugins as any)?.gauge?.enabled;
        if (isGauge && datasetIdx === 0 && label.anchor !== 'callout') return;
        // --- Position logic ---
        let x = label.x;
        let y = label.y;

        // Apply tilt adjustment to absolute Y if provided and we're in 3D mode
        if (y != null && is3dActive) {
           y = transformY(y);
        }

        let anchor = label.anchor || 'center';
        let isDraggedPosition = false;
        // If callout and draggable, use stored position
        if (anchor === 'callout' && label.draggable) {
          const dragState = dragStateMap.get(chart) || {};
          const dragKey = `${datasetIdx}_${pointIdx}`;
          if (dragState[dragKey]) {
            x = dragState[dragKey].x;
            y = dragState[dragKey].y;
            isDraggedPosition = true;
          } else if (x == null || y == null) {
            const defaultPos = getCalloutDefaultPos(chart, meta, element, datasetIdx, pointIdx, label, shapeSize, transformY);
            x = defaultPos.x;
            y = defaultPos.y;
          }
        }
        // If not absolute, calculate based on anchor
        if (x == null || y == null) {
          if (anchor === 'callout') {
            const defaultPos = getCalloutDefaultPos(chart, meta, element, datasetIdx, pointIdx, label, shapeSize, transformY);
            x = defaultPos.x;
            y = defaultPos.y;
          } else {
            // Measure exact text bounds to detect boundary overflow
            ctx.save();
            ctx.font = label.font || 'bold 14px Arial';
            const textWidth = ctx.measureText(label.text || '').width;
            const textHeight = getLabelFontSize(label);
            ctx.restore();

            const rightLimit = (chart.chartArea?.right || chart.width || 800) - 6;
            const topLimit = (chart.chartArea?.top || 0) + 6;
            const bottomLimit = (chart.chartArea?.bottom || chart.height || 600) - 6;

            if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
              // Pie/doughnut
              const chartArea = chart.chartArea;
              const centerX = element.x ?? (chartArea.left + chartArea.width / 2);
              const centerY = element.y ?? (chartArea.top + chartArea.height / 2);
              const midAngle = getMidAngle(chart, datasetIdx, pointIdx, element);
              const innerRadius = element.innerRadius ?? 0;
              const outerRadius = element.outerRadius ?? Math.min(chartArea.width, chartArea.height) / 2;
              if (anchor === 'center') {
                const r = innerRadius + (outerRadius - innerRadius) * 0.5;
                x = centerX + Math.cos(midAngle) * r;
                y = transformY(centerY + Math.sin(midAngle) * r);
              } else if (anchor === 'top') {
                const r = outerRadius + shapeSize * 0.7;
                x = centerX + Math.cos(midAngle) * r;
                y = transformY(centerY + Math.sin(midAngle) * r);
              } else if (anchor === 'bottom') {
                const r = innerRadius + (outerRadius - innerRadius) * 0.2;
                x = centerX + Math.cos(midAngle) * r;
                y = transformY(centerY + Math.sin(midAngle) * r);
              }
            } else if (chartType === 'bar' || chartType === 'horizontalBar' || chartType === 'bar3d' || chartType === 'horizontalBar3d') {
              const isHorizontal = (chart.options.indexAxis === 'y') || chartType === 'horizontalBar' || chartType === 'horizontalBar3d';
              const gap = 4;
              if (isHorizontal) {
                const isFunnel = !!(chart.options.plugins as any)?.funnel?.enabled;
                const leftEdge = Math.min(element.x ?? 0, element.base ?? 0);
                const rightEdge = Math.max(element.x ?? 0, element.base ?? 0);
                
                if (anchor === 'center') {
                  x = (leftEdge + rightEdge) / 2;
                  y = element.y ?? 0;
                  label.align = 'center';
                  label.textBaseline = 'middle';
                } else if (anchor === 'top') {
                  const endEdge = isFunnel ? leftEdge : rightEdge;
                  if (label.shape && label.shape !== 'none') {
                    const shapeW = opts.shapeSize ?? 32;
                    if (endEdge + shapeW + gap > rightLimit) {
                      x = endEdge - shapeW / 2 - gap;
                    } else {
                      x = endEdge + shapeW / 2 + gap;
                    }
                    label.align = 'center';
                  } else {
                    if (endEdge + textWidth + gap > rightLimit) {
                      // Adjust internally inside the bar slice when space outside is insufficient
                      x = Math.max(leftEdge + 6, endEdge - gap - 4);
                      label.align = 'right';
                    } else {
                      x = endEdge + gap;
                      label.align = 'left';
                    }
                  }
                  y = element.y ?? 0;
                  label.textBaseline = 'middle';
                } else if (anchor === 'bottom') {
                  const startEdge = isFunnel ? rightEdge : leftEdge;
                  x = startEdge + gap;
                  y = element.y ?? 0;
                  label.align = 'left';
                  label.textBaseline = 'middle';
                }
              } else {
                const barTop = Math.min(element.y ?? 0, element.base ?? 0);
                const barBottom = Math.max(element.y ?? 0, element.base ?? 0);
                if (anchor === 'center') {
                  x = element.x ?? 0;
                  y = (barTop + barBottom) / 2;
                  label.align = 'center';
                  label.textBaseline = 'middle';
                } else if (anchor === 'top') {
                  x = element.x ?? 0;
                  if (label.shape && label.shape !== 'none') {
                    const shapeH = opts.shapeSize ?? 32;
                    if (barTop - shapeH - gap < topLimit) {
                      y = barTop + shapeH / 2 + gap;
                    } else {
                      y = barTop - shapeH / 2 - gap;
                    }
                    label.textBaseline = 'middle';
                  } else {
                    if (barTop - textHeight - gap < topLimit) {
                      // Adjust internally inside the bar slice top when top space is insufficient
                      y = barTop + gap + 2;
                      label.textBaseline = 'top';
                    } else {
                      y = barTop - gap;
                      label.textBaseline = 'bottom';
                    }
                  }
                  label.align = 'center';
                } else if (anchor === 'bottom') {
                  x = element.x ?? 0;
                  y = barBottom - gap;
                  label.align = 'center';
                  label.textBaseline = 'bottom';
                }
              }
            } else if (chartType === 'line' || chartType === 'area' || chartType === 'scatter' || chartType === 'bubble' || chartType === 'radar') {
              // Line, area, scatter, bubble, radar
              x = element.x ?? 0;
              const radius = getElementRadius(element);
              const gap = 3;

              if (label.shape && label.shape !== 'none') {
                const halfH = (opts.shapeSize ?? 32) / 2;
                if (anchor === 'center') {
                  y = element.y ?? 0;
                } else if (anchor === 'top') {
                  y = (element.y ?? 0) - radius - halfH - gap;
                } else if (anchor === 'bottom') {
                  y = (element.y ?? 0) + radius + halfH + gap;
                }
                label.textBaseline = 'middle';
              } else {
                if (anchor === 'center') {
                  y = element.y ?? 0;
                  label.textBaseline = 'middle';
                } else if (anchor === 'top') {
                  const targetY = (element.y ?? 0) - radius - gap;
                  if (targetY - textHeight < topLimit) {
                    // Auto adjust below bubble if top boundary overflows
                    y = (element.y ?? 0) + radius + gap;
                    label.textBaseline = 'top';
                  } else {
                    y = targetY;
                    label.textBaseline = 'bottom';
                  }
                } else if (anchor === 'bottom') {
                  const targetY = (element.y ?? 0) + radius + gap;
                  if (targetY + textHeight > bottomLimit) {
                    // Auto adjust above bubble if bottom boundary overflows
                    y = (element.y ?? 0) - radius - gap;
                    label.textBaseline = 'bottom';
                  } else {
                    y = targetY;
                    label.textBaseline = 'top';
                  }
                }
              }
            } else {
              // Fallback
              x = element.x ?? 0;
              y = element.y ?? 0;
            }
          }
        }

        // --- Boundary clamping for callout labels (all chart types) ---
        // Only clamp auto-calculated positions; skip when user has dragged the label
        if (anchor === 'callout' && !isDraggedPosition && x != null && y != null) {
          const clamped = clampToCanvas(chart, x, y, label);
          x = clamped.x;
          y = clamped.y;
        }

        // --- Draw enhanced callout arrow if needed ---
        if (anchor === 'callout' && label.callout && (label.arrowLine || label.arrowHead)) {
          ctx.save();
          ctx.strokeStyle = label.arrowColor || label.calloutColor || '#333';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);

          // Calculate arrow path based on chart type
          const globalType = (chart.config as any).type as string;
          const chartType = meta.type || globalType;

          let startX = element.x ?? 0;
          let startY = element.y ?? 0;

          // Adjust start point for different chart types
          if (chartType === "pie" || chartType === "doughnut" || chartType === "polarArea") {
            // Use the slice's mid-angle and outer radius so each slice gets its own start point
            const chartArea = chart.chartArea;
            const centerX = element.x ?? (chartArea.left + chartArea.width / 2);
            const centerY = element.y ?? (chartArea.top + chartArea.height / 2);
            const midAngle = getMidAngle(chart, datasetIdx, pointIdx, element);
            const outerRadius = element.outerRadius ?? Math.min(chartArea.width, chartArea.height) / 2;
            startX = centerX + Math.cos(midAngle) * outerRadius;
            startY = transformY(centerY + Math.sin(midAngle) * outerRadius);
          } else if (chartType === "bar" || chartType === "horizontalBar") {
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
          const gap = label.arrowEndGap ?? 8;
          if (gap > 0) {
            const angle = Math.atan2(endY - startY, endX - startX);
            endX = endX - gap * Math.cos(angle);
            endY = endY - gap * Math.sin(angle);
          }

          // Draw the arrow line if enabled (support optional elbow bend)
          if (label.arrowLine) {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            const useElbow = (label.arrowSegments === 2);
            if (useElbow) {
              // Compute bend point
              let bendX: number | undefined = label.arrowBendX;
              let bendY: number | undefined = label.arrowBendY;
              if ((bendX == null || bendY == null) && label.arrowBendRelX != null && label.arrowBendRelY != null) {
                // Relative to canvas size
                bendX = label.arrowBendRelX * chart.width;
                bendY = label.arrowBendRelY * chart.height;
              }
              if (bendX == null || bendY == null) {
                // Default elbow: short radial segment outward from slice edge, then to label
                if ((chart.config as any).type === 'pie' || (chart.config as any).type === 'doughnut' || (chart.config as any).type === 'polarArea') {
                  const chartArea = chart.chartArea;
                  const centerX = element.x ?? (chartArea.left + chartArea.width / 2);
                  const centerY = element.y ?? (chartArea.top + chartArea.height / 2);
                  const midAngle = getMidAngle(chart, datasetIdx, pointIdx, element);
                  const outerRadius = element.outerRadius ?? Math.min(chartArea.width, chartArea.height) / 2;
                  const elbow = 15; // default elbow length
                  bendX = startX + Math.cos(midAngle) * elbow;
                  bendY = transformY(centerY + Math.sin(midAngle) * (outerRadius + elbow));
                } else {
                  // fallback generic elbow near start
                  bendX = startX + (endX - startX) * 0.2;
                  bendY = startY;
                }
              }
              ctx.lineTo(bendX as number, bendY as number);
              ctx.lineTo(endX, endY);
            } else {
              ctx.lineTo(endX, endY);
            }
            ctx.stroke();
          }

          // Draw arrow head if enabled
          if (label.arrowHead) {
            const headStyle = label.arrowHeadStyle || 'open';
            const headPos = label.arrowHeadPosition || 'end';
            const headLen = label.arrowHeadSize ?? 10;
            const headHalfAngle = label.arrowHeadAngle ?? (Math.PI / 6);

            // Determine point and direction based on segment and position
            let tipX = endX; let tipY = endY; let fromX = startX; let fromY = startY;
            if (label.arrowSegments === 2) {
              const bx = label.arrowBendX ?? (label.arrowBendRelX != null ? label.arrowBendRelX * chart.width : endX);
              const by = label.arrowBendY ?? (label.arrowBendRelY != null ? label.arrowBendRelY * chart.height : startY);
              if (headPos === 'start') {
                tipX = startX; tipY = startY; fromX = bx; fromY = by;
              } else { // end
                tipX = endX; tipY = endY; fromX = bx; fromY = by;
              }
            } else {
              if (headPos === 'start') {
                tipX = startX; tipY = startY; fromX = endX; fromY = endY;
              } else {
                tipX = endX; tipY = endY; fromX = startX; fromY = startY;
              }
            }
            const theta = Math.atan2(tipY - fromY, tipX - fromX);

            if (headStyle === 'bar') {
              // Perpendicular cap
              const nx = Math.cos(theta + Math.PI / 2) * (headLen / 2);
              const ny = Math.sin(theta + Math.PI / 2) * (headLen / 2);
              ctx.beginPath();
              ctx.moveTo(tipX - nx, tipY - ny);
              ctx.lineTo(tipX + nx, tipY + ny);
              ctx.stroke();
            } else if (headStyle === 'filled') {
              // Filled triangular head
              const leftX = tipX - headLen * Math.cos(theta - headHalfAngle);
              const leftY = tipY - headLen * Math.sin(theta - headHalfAngle);
              const rightX = tipX - headLen * Math.cos(theta + headHalfAngle);
              const rightY = tipY - headLen * Math.sin(theta + headHalfAngle);
              ctx.beginPath();
              ctx.moveTo(tipX, tipY);
              ctx.lineTo(leftX, leftY);
              ctx.lineTo(rightX, rightY);
              ctx.closePath();
              const prev = ctx.fillStyle;
              ctx.fillStyle = label.arrowColor || label.calloutColor || '#333';
              ctx.fill();
              ctx.fillStyle = prev as any;
            } else {
              // Open V head
              ctx.beginPath();
              ctx.moveTo(tipX, tipY);
              ctx.lineTo(
                tipX - headLen * Math.cos(theta - headHalfAngle),
                tipY - headLen * Math.sin(theta - headHalfAngle),
              );
              ctx.moveTo(tipX, tipY);
              ctx.lineTo(
                tipX - headLen * Math.cos(theta + headHalfAngle),
                tipY - headLen * Math.sin(theta + headHalfAngle),
              );
              ctx.stroke();
            }
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
        
        let align: CanvasTextAlign = label.align || 'center';
        const isFunnelCheck = !!(chart.options.plugins as any)?.funnel?.enabled;
        const isHoriz = (chart.options.indexAxis === 'y');
        if (isFunnelCheck && isHoriz && !label.x) { // Only if not absolutely dragged
          if (label.anchor === 'top') align = 'left';
          if (label.anchor === 'bottom') align = 'right';
        }
        ctx.textAlign = align;
        ctx.textBaseline = label.textBaseline || 'middle';
        ctx.fillText(label.text, x ?? 0, y ?? 0);
        ctx.restore();
      });
    });
  },
  beforeUpdate(chart) {
    // Reset drag state if chart type or orientation changes so labels recalculate naturally
    const currentTypeKey = `${(chart.config as any).type}_${chart.options.indexAxis || 'x'}`;
    const lastTypeKey = (chart as any)._lastChartTypeKey;
    if (lastTypeKey && lastTypeKey !== currentTypeKey) {
      const dragState = dragStateMap.get(chart);
      if (dragState) {
        Object.keys(dragState).forEach(k => delete dragState[k]);
      }
    }
    (chart as any)._lastChartTypeKey = currentTypeKey;
  },
  afterInit(chart) {
    // Setup drag for callout labels
    const canvas = chart.canvas;
    const dragState: any = {};
    dragStateMap.set(chart, dragState);
    let dragging = false;
    let isHovering = false;
    let dragKey = '';
    let offsetX = 0;
    let offsetY = 0;

    function getLabelAt(x: number, y: number) {
      // Detect if 3D pie is active and get tilt for hit-testing
      const pie3dOpts = (chart.options.plugins as any)?.pie3d;
      const is3dActive = !!(pie3dOpts && pie3dOpts.enabled);
      const tilt = is3dActive ? (typeof pie3dOpts.tilt === 'number' ? pie3dOpts.tilt : 0.75) : 1.0;
      const chartArea = chart.chartArea;
      if (!chartArea) return null; // Safety check
      const centerY_chart = (chartArea.top + chartArea.bottom) / 2;
      const transformY = (y_val: number) => is3dActive ? centerY_chart + (y_val - centerY_chart) * tilt : y_val;

      const opts: CustomLabelPluginOptions | undefined = (chart.options.plugins as any)?.customLabels;
      if (!opts || !opts.labels) return null;
      const shapeSize = opts.shapeSize ?? 32;
      const ctx = chart.ctx;

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
            if (!meta || !meta.data || !meta.data[pointIdx]) continue;
            const element: any = meta.data[pointIdx];
            const defaultPos = getCalloutDefaultPos(chart, meta, element, datasetIdx, pointIdx, label, shapeSize, transformY);
            lx = defaultPos.x;
            ly = defaultPos.y;
          }
          // Apply the same boundary clamping as rendering so hit-test matches visual position
          const clamped = clampToCanvas(chart, lx, ly, label);
          lx = clamped.x;
          ly = clamped.y;

          // Measure text bounding box for generous hit testing
          ctx.save();
          ctx.font = label.font || 'bold 14px Arial';
          const textWidth = ctx.measureText(label.text || '').width;
          const textHeight = parseInt(label.font || '14', 10) || 14;
          ctx.restore();
          const padding = label.padding ?? 6;
          const halfW = Math.max(shapeSize / 1.5, (textWidth / 2) + padding + 8);
          const halfH = Math.max(shapeSize / 1.5, (textHeight / 2) + padding + 8);

          // Generous hit box test
          if (x >= lx - halfW && x <= lx + halfW && y >= ly - halfH && y <= ly + halfH) {
            return { datasetIdx, pointIdx, lx, ly, key };
          }
        }
      }
      return null;
    }
    function onMouseDown(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
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
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      if (dragging && dragKey) {
        dragState[dragKey] = { x: x - offsetX, y: y - offsetY };
        safeChartUpdate(chart, 'none');
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
      isHovering = false;
      dragKey = '';
      canvas.style.cursor = 'default';
    }

    // Touch event handlers for mobile/tablet support
    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;
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
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;
      if (dragging && dragKey) {
        dragState[dragKey] = { x: x - offsetX, y: y - offsetY };
        safeChartUpdate(chart, 'none');
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