import type { Plugin } from 'chart.js';

/**
 * Gauge Plugin — Renders a gauge/meter overlay on a doughnut chart.
 *
 * The base chart is a doughnut with circumference: 180° and rotation: -90°.
 * This plugin draws:
 *   1. A needle pointing to the current value
 *   2. Curved slice labels along the arc
 *   3. The center value text
 *   4. Min/max labels at the bottom edges
 *
 * Plugin config is read from chart.options.plugins.gauge
 */

export interface GaugePluginOptions {
  enabled: boolean
  needleType: 'line' | 'arrow' | 'triangle'
  needleColor: string
  needleWidth: number
  needleBaseRadius: number
  valuePosition: 'bottom' | 'center' | 'top' | 'left' | 'right'
  valueFontSize: number
  valueColor: string
  valueFontFamily: string
  valueFontWeight: string
  valuePrefix: string
  valueSuffix: string
  showMinMax: boolean
  minLabel: string
  maxLabel: string
  minMaxColor: string
  minMaxFontSize: number
  centerOffsetY: number
  // Slice label options
  showSliceLabels: boolean
  sliceLabelColor: string
  sliceLabelFontSize: number
  sliceLabelContent: 'value' | 'label' | 'percentage' | 'label+value'
}

export const gaugePlugin: Plugin = {
  id: 'gauge',
  defaults: {
    enabled: false,
    needleType: 'triangle',
    needleColor: '#374151',
    needleWidth: 3,
    needleBaseRadius: 8,
    valuePosition: 'bottom',
    valueFontSize: 28,
    valueColor: '#111827',
    valueFontFamily: 'Inter, system-ui, sans-serif',
    valueFontWeight: '700',
    valuePrefix: '',
    valueSuffix: '',
    showMinMax: true,
    minLabel: '0',
    maxLabel: '100',
    minMaxColor: '#6b7280',
    minMaxFontSize: 12,
    centerOffsetY: 0,
    showSliceLabels: true,
    sliceLabelColor: '#ffffff',
    sliceLabelFontSize: 11,
    sliceLabelContent: 'value',
  },

  afterDatasetsDraw(chart: any, _args: any, pluginOptions: any) {
    if (!pluginOptions || !pluginOptions.enabled) return;

    const ctx = chart.ctx;
    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data || meta.data.length === 0) return;

    // The first arc element is the "value" arc
    const arc = meta.data[0];
    if (!arc) return;

    const dataset = chart.data.datasets[0];
    if (!dataset || !dataset.data || dataset.data.length < 2) return;

    const rawCurrentValue = dataset.data[0] ?? 0;
    const absData = dataset.data.map((v: any) => Math.abs(Number(v) || 0));
    const currentValue = absData[0] ?? 0;
    // Sum all slice values for the total
    const totalValue = absData.reduce((sum: number, v: number) => sum + v, 0);

    // Calculate center from the arc element
    const centerX = arc.x;
    const centerY = arc.y;
    const outerRadius = arc.outerRadius;
    const innerRadius = arc.innerRadius;
    const needleLength = outerRadius - 10; // Slightly shorter than outer edge

    // Calculate needle angle
    // Gauge spans from -180° (left) to 0° (right) — i.e., the top semicircle
    // rotation: -90° + circumference: 180° means startAngle=-π, endAngle=0
    const minLabelVal = Number(pluginOptions.minLabel ?? 0);
    const maxLabelVal = Number(pluginOptions.maxLabel ?? 100);
    const scaleRange = maxLabelVal - minLabelVal;

    // If user set a manual needleValue, use it; otherwise default to first slice's abs value
    const manualNeedleValue = pluginOptions.needleValue;
    let needleDisplayValue: number;
    if (manualNeedleValue !== undefined && manualNeedleValue !== null && manualNeedleValue !== '') {
      needleDisplayValue = Number(manualNeedleValue);
    } else {
      needleDisplayValue = currentValue;
    }

    // Compute needle ratio based on the min/max scale
    let ratio: number;
    if (scaleRange > 0 && manualNeedleValue !== undefined && manualNeedleValue !== null && manualNeedleValue !== '') {
      // Manual mode: position needle on the min-max scale
      ratio = (needleDisplayValue - minLabelVal) / scaleRange;
    } else {
      // Auto mode: position needle based on first slice ratio
      ratio = totalValue > 0 ? currentValue / totalValue : 0;
    }
    ratio = Math.max(0, Math.min(1, ratio)); // clamp 0-1
    const angle = Math.PI + (ratio * Math.PI); // -π to 0 mapped as π to 2π

    // Read options
    const needleType = pluginOptions.needleType || 'triangle';
    const needleColor = pluginOptions.needleColor || '#374151';
    const needleWidth = pluginOptions.needleWidth ?? 3;
    const needleBaseRadius = pluginOptions.needleBaseRadius ?? 8;
    const valueFontSize = pluginOptions.valueFontSize ?? 28;
    const valueColor = pluginOptions.valueColor || '#111827';
    const valueFontFamily = pluginOptions.valueFontFamily || 'Inter, system-ui, sans-serif';
    const valueFontWeight = pluginOptions.valueFontWeight || '700';
    const valuePrefix = pluginOptions.valuePrefix || '';
    const valueSuffix = pluginOptions.valueSuffix || '';
    const showValue = pluginOptions.showValue !== false;
    const valueDisplayContent = pluginOptions.valueDisplayContent || 'number';
    const showMinMax = pluginOptions.showMinMax !== false;
    const minLabel = pluginOptions.minLabel ?? '0';
    const maxLabel = pluginOptions.maxLabel ?? '100';
    const minMaxColor = pluginOptions.minMaxColor || '#6b7280';
    const minMaxFontSize = pluginOptions.minMaxFontSize ?? 12;
    const centerOffsetY = pluginOptions.centerOffsetY ?? 0;

    // Use global custom labels config from chart options
    const globalCustomLabels = chart.options?.plugins?.customLabelsConfig || {};
    const datasetCustomLabels = (dataset as any).customLabelsConfig || {};

    ctx.save();

    // ── 1. Draw curved slice labels along the arc ──────────
    if (dataset.data.length >= 2) {
      let cumulativeAngle = Math.PI; // Start from left (π)

      for (let i = 0; i < dataset.data.length; i++) {
        const rawSliceValue = dataset.data[i] ?? 0;
        const sliceValue = Math.abs(Number(rawSliceValue) || 0);
        const sliceRatio = totalValue > 0 ? sliceValue / totalValue : 0;
        const sliceAngle = sliceRatio * Math.PI; // Fraction of the 180° semicircle

        // Midpoint angle of this slice
        const midAngle = cumulativeAngle + sliceAngle / 2;

        // Merge label configurations (Global -> Dataset -> Slice Override)
        const sliceOverride = (dataset as any).sliceLabelOverrides?.[i] || {};
        const sliceLabelsConfig = { ...globalCustomLabels, ...datasetCustomLabels, ...sliceOverride };

        const showThisSliceLabel = sliceLabelsConfig.display !== false;

        const sliceLabelAnchor = sliceLabelsConfig.anchor || 'center'; // 'top', 'center', 'bottom', 'callout'
        
        if (!showThisSliceLabel || sliceLabelAnchor === 'callout') {
          cumulativeAngle += sliceAngle;
          continue;
        }

        const sliceLabelColor = sliceLabelsConfig.color || '#000000';
        const sliceLabelFontSize = sliceLabelsConfig.fontSize ?? 14;
        const sliceLabelFontFamily = sliceLabelsConfig.fontFamily || valueFontFamily;
        const sliceLabelFontWeight = sliceLabelsConfig.fontWeight || '600';
        const sliceLabelContent = sliceLabelsConfig.labelContent || 'value';

        // Determine radius based on anchor setting
        let labelRadius = (outerRadius + innerRadius) / 2; // default: center
        if (sliceLabelAnchor === 'top') {
          labelRadius = outerRadius - 15; // slightly inside outer edge
        } else if (sliceLabelAnchor === 'bottom') {
          labelRadius = innerRadius + 15; // slightly outside inner edge
        } else if (sliceLabelAnchor === 'callout') {
          labelRadius = outerRadius + 15; // outside the gauge
        }

        ctx.font = `${sliceLabelFontWeight} ${sliceLabelFontSize}px ${sliceLabelFontFamily}`;
        ctx.fillStyle = sliceLabelColor;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        let labelText = '';
        const chartLabel = chart.data.labels?.[i];
        switch (sliceLabelContent) {
          case 'label':
            labelText = chartLabel ? String(chartLabel) : String(rawSliceValue);
            break;
          case 'percentage':
            labelText = `${Math.round(sliceRatio * 100)}%`;
            break;
          case 'label+value':
            labelText = chartLabel ? `${chartLabel}: ${rawSliceValue}` : String(rawSliceValue);
            break;
          case 'value':
          default:
            labelText = String(rawSliceValue);
            break;
        }

        // Measure text to decide: curved per-character or straight
        const textMetrics = ctx.measureText(labelText);
        const arcLength = sliceAngle * labelRadius;

        if (textMetrics.width > arcLength * 0.9 || labelText.length <= 4) {
          // Short text or tight arc: render straight at the midpoint
          const lx = centerX + Math.cos(midAngle) * labelRadius;
          const ly = centerY + Math.sin(midAngle) * labelRadius;
          ctx.save();
          ctx.translate(lx, ly);
          // Rotate so text is tangent to the arc
          ctx.rotate(midAngle + Math.PI / 2);
          ctx.fillText(labelText, 0, 0);
          ctx.restore();
        } else {
          // Longer text: draw each character along the curved path
          drawCurvedText(ctx, labelText, centerX, centerY, labelRadius, midAngle, sliceLabelFontSize);
        }

        cumulativeAngle += sliceAngle;
      }
    }

    // ── 2. Draw needle ────────────────────────────────────
    const needleTipX = centerX + Math.cos(angle) * needleLength;
    const needleTipY = centerY + Math.sin(angle) * needleLength;

    if (needleType === 'line') {
      // ─── LINE: Simple straight line from center to tip ───
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(needleTipX, needleTipY);
      ctx.strokeStyle = needleColor;
      ctx.lineWidth = needleWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

    } else if (needleType === 'arrow') {
      // ─── ARROW: A line with an arrowhead at the tip ───
      const shaftLength = needleLength * 0.7;
      const headWidth = Math.max(8, needleWidth * 4);
      
      const shaftEndX = centerX + Math.cos(angle) * shaftLength;
      const shaftEndY = centerY + Math.sin(angle) * shaftLength;
      
      // Shaft line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(shaftEndX, shaftEndY);
      ctx.strokeStyle = needleColor;
      ctx.lineWidth = needleWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Arrowhead (filled triangle at the tip)
      const perpAngle1 = angle - Math.PI / 2;
      const perpAngle2 = angle + Math.PI / 2;
      const wingX1 = shaftEndX + Math.cos(perpAngle1) * (headWidth / 2);
      const wingY1 = shaftEndY + Math.sin(perpAngle1) * (headWidth / 2);
      const wingX2 = shaftEndX + Math.cos(perpAngle2) * (headWidth / 2);
      const wingY2 = shaftEndY + Math.sin(perpAngle2) * (headWidth / 2);

      ctx.beginPath();
      ctx.moveTo(needleTipX, needleTipY);
      ctx.lineTo(wingX1, wingY1);
      ctx.lineTo(wingX2, wingY2);
      ctx.closePath();
      ctx.fillStyle = needleColor;
      ctx.fill();

    } else {
      // ─── TRIANGLE (default): Fat tapered wedge from wide base to sharp tip ───
      const perpAngle1 = angle - Math.PI / 2;
      const perpAngle2 = angle + Math.PI / 2;
      const halfBase = needleBaseRadius * 0.8;

      const baseX1 = centerX + Math.cos(perpAngle1) * halfBase;
      const baseY1 = centerY + Math.sin(perpAngle1) * halfBase;
      const baseX2 = centerX + Math.cos(perpAngle2) * halfBase;
      const baseY2 = centerY + Math.sin(perpAngle2) * halfBase;

      // Draw the filled wedge
      ctx.beginPath();
      ctx.moveTo(baseX1, baseY1);
      ctx.lineTo(needleTipX, needleTipY);
      ctx.lineTo(baseX2, baseY2);
      ctx.closePath();
      ctx.fillStyle = needleColor;
      ctx.fill();
    }

    // Needle base circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, needleBaseRadius, 0, Math.PI * 2);
    ctx.fillStyle = needleColor;
    ctx.fill();

    // Inner white dot on base
    const innerDotRadius = Math.max(2, needleBaseRadius * 0.5);
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerDotRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // ── 3. Draw value text ─────────────────────────────────
    if (showValue) {
      const valuePosition = pluginOptions.valuePosition || 'bottom';

      // Determine what to display
      let gaugeValueText: string;
      if (valueDisplayContent === 'label') {
        // Find which slice the needle is pointing at based on the needle ratio
        let needleSliceIndex = 0;
        let cumulativeRatio = 0;
        for (let i = 0; i < absData.length; i++) {
          const sliceRatio = totalValue > 0 ? absData[i] / totalValue : 0;
          cumulativeRatio += sliceRatio;
          if (ratio <= cumulativeRatio) {
            needleSliceIndex = i;
            break;
          }
          needleSliceIndex = i; // fallback to last slice
        }
        const sliceLabel = chart.data.labels?.[needleSliceIndex] ?? '';
        gaugeValueText = `${valuePrefix}${sliceLabel}${valueSuffix}`;
      } else {
        // Show the number (manual override or raw value)
        const displayNum = (manualNeedleValue !== undefined && manualNeedleValue !== null && manualNeedleValue !== '')
          ? needleDisplayValue
          : rawCurrentValue;
        gaugeValueText = `${valuePrefix}${displayNum}${valueSuffix}`;
      }

      ctx.font = `${valueFontWeight} ${valueFontSize}px ${valueFontFamily}`;
      ctx.fillStyle = valueColor;
      ctx.textBaseline = 'middle';

      let valX = centerX;
      let valY = centerY;

      switch (valuePosition) {
        case 'bottom':
          ctx.textAlign = 'center';
          valY = centerY + valueFontSize * 1.2 + centerOffsetY;
          break;
        case 'center':
          ctx.textAlign = 'center';
          valY = centerY - (outerRadius - innerRadius) / 2 + centerOffsetY;
          break;
        case 'top':
          ctx.textAlign = 'center';
          valY = centerY - outerRadius - valueFontSize * 0.6 + centerOffsetY;
          break;
        case 'left':
          ctx.textAlign = 'right';
          valX = centerX - outerRadius - 12;
          valY = centerY + centerOffsetY;
          break;
        case 'right':
          ctx.textAlign = 'left';
          valX = centerX + outerRadius + 12;
          valY = centerY + centerOffsetY;
          break;
      }

      ctx.fillText(gaugeValueText, valX, valY);
    }

    // ── 4. Draw min/max labels ────────────────────────────
    if (showMinMax) {
      ctx.font = `400 ${minMaxFontSize}px ${valueFontFamily}`;
      ctx.fillStyle = minMaxColor;

      // Min label — bottom-left of the gauge arc
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const labelY = centerY + 8;
      const labelSpread = outerRadius * 0.85;
      ctx.fillText(String(minLabel), centerX - labelSpread, labelY);

      // Max label — bottom-right of the gauge arc
      ctx.fillText(String(maxLabel), centerX + labelSpread, labelY);

      // ── Zero Reference Marker ──
      const showZeroMarker = pluginOptions.showZeroMarker !== false;
      const zeroMarkerPosition = pluginOptions.zeroMarkerPosition || 'inner';
      
      const minVal = Number(minLabel);
      const maxVal = Number(maxLabel);
      
      if (showZeroMarker && !isNaN(minVal) && !isNaN(maxVal) && minVal < 0 && maxVal > 0) {
        const zeroRatio = (0 - minVal) / (maxVal - minVal);
        const zeroAngle = Math.PI + (zeroRatio * Math.PI);

        let tickInnerR, tickOuterR, textR;

        if (zeroMarkerPosition === 'outer') {
          tickInnerR = outerRadius;
          tickOuterR = outerRadius + 6;
          textR = outerRadius + 14;
        } else {
          tickInnerR = innerRadius - 6;
          tickOuterR = innerRadius;
          textR = innerRadius - 12;
        }

        const startX = centerX + Math.cos(zeroAngle) * tickInnerR;
        const startY = centerY + Math.sin(zeroAngle) * tickInnerR;
        const endX = centerX + Math.cos(zeroAngle) * tickOuterR;
        const endY = centerY + Math.sin(zeroAngle) * tickOuterR;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = minMaxColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        const textX = centerX + Math.cos(zeroAngle) * textR;
        const textY = centerY + Math.sin(zeroAngle) * textR;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `600 ${Math.max(10, minMaxFontSize - 2)}px ${valueFontFamily}`;
        ctx.fillText('0', textX, textY);
      }
    }

    ctx.restore();
  }
};

/**
 * Helper: Draw text along a curved arc path.
 * Each character is placed along the arc at the given radius.
 *
 * @param ctx        - Canvas 2D rendering context
 * @param text       - The text string to render
 * @param cx         - Center X of the arc
 * @param cy         - Center Y of the arc
 * @param radius     - Radius at which to place the text
 * @param midAngle   - The center angle of the text span (radians)
 * @param fontSize   - Font size for character width estimation
 */
function drawCurvedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  midAngle: number,
  fontSize: number
) {
  const charWidths: number[] = [];
  let totalWidth = 0;

  // Measure each character
  for (let i = 0; i < text.length; i++) {
    const w = ctx.measureText(text[i]).width;
    charWidths.push(w);
    totalWidth += w;
  }

  // Calculate the total angular span of the text
  const totalArcAngle = totalWidth / radius;

  // Start angle: center the text around midAngle
  let currentAngle = midAngle - totalArcAngle / 2;

  for (let i = 0; i < text.length; i++) {
    const charAngle = charWidths[i] / radius;
    const drawAngle = currentAngle + charAngle / 2;

    const x = cx + Math.cos(drawAngle) * radius;
    const y = cy + Math.sin(drawAngle) * radius;

    ctx.save();
    ctx.translate(x, y);
    // Rotate so the character follows the arc tangent
    // +π/2 because the arc text should be upright relative to the curve
    ctx.rotate(drawAngle + Math.PI / 2);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();

    currentAngle += charAngle;
  }
}
