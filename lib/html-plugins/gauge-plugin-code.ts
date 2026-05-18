export function generateGaugePluginCode(): string {
    return `
function drawCurvedText(ctx, text, cx, cy, radius, midAngle, fontSize) {
    var charWidths = [];
    var totalWidth = 0;
    for (var i = 0; i < text.length; i++) {
        var w = ctx.measureText(text[i]).width;
        charWidths.push(w);
        totalWidth += w;
    }
    var totalArcAngle = totalWidth / radius;
    var currentAngle = midAngle - totalArcAngle / 2;
    for (var i = 0; i < text.length; i++) {
        var charAngle = charWidths[i] / radius;
        var drawAngle = currentAngle + charAngle / 2;
        var x = cx + Math.cos(drawAngle) * radius;
        var y = cy + Math.sin(drawAngle) * radius;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(drawAngle + Math.PI / 2);
        ctx.fillText(text[i], 0, 0);
        ctx.restore();
        currentAngle += charAngle;
    }
}

const gaugePlugin = {
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

    afterDatasetsDraw(chart, _args, pluginOptions) {
        if (!pluginOptions || !pluginOptions.enabled) return;

        var ctx = chart.ctx;
        var meta = chart.getDatasetMeta(0);
        if (!meta || !meta.data || meta.data.length === 0) return;

        var arc = meta.data[0];
        if (!arc) return;

        var dataset = chart.data.datasets[0];
        if (!dataset || !dataset.data || dataset.data.length < 2) return;

        var rawCurrentValue = dataset.data[0] != null ? dataset.data[0] : 0;
        var absData = dataset.data.map(function(v) { return Math.abs(Number(v) || 0); });
        var currentValue = absData[0] != null ? absData[0] : 0;
        var totalValue = absData.reduce(function(sum, v) { return sum + v; }, 0);

        var centerX = arc.x;
        var centerY = arc.y;
        var outerRadius = arc.outerRadius;
        var innerRadius = arc.innerRadius;
        var needleLength = outerRadius - 10;

        var minLabelVal = Number(pluginOptions.minLabel != null ? pluginOptions.minLabel : 0);
        var maxLabelVal = Number(pluginOptions.maxLabel != null ? pluginOptions.maxLabel : 100);
        var scaleRange = maxLabelVal - minLabelVal;

        var manualNeedleValue = pluginOptions.needleValue;
        var needleDisplayValue;
        if (manualNeedleValue !== undefined && manualNeedleValue !== null && manualNeedleValue !== '') {
            needleDisplayValue = Number(manualNeedleValue);
        } else {
            needleDisplayValue = currentValue;
        }

        var ratio;
        if (scaleRange > 0 && manualNeedleValue !== undefined && manualNeedleValue !== null && manualNeedleValue !== '') {
            ratio = (needleDisplayValue - minLabelVal) / scaleRange;
        } else {
            ratio = totalValue > 0 ? currentValue / totalValue : 0;
        }
        ratio = Math.max(0, Math.min(1, ratio));
        var angle = Math.PI + (ratio * Math.PI);

        var needleType = pluginOptions.needleType || 'triangle';
        var needleColor = pluginOptions.needleColor || '#374151';
        var needleWidth = pluginOptions.needleWidth != null ? pluginOptions.needleWidth : 3;
        var needleBaseRadius = pluginOptions.needleBaseRadius != null ? pluginOptions.needleBaseRadius : 8;
        var valueFontSize = pluginOptions.valueFontSize != null ? pluginOptions.valueFontSize : 28;
        var valueColor = pluginOptions.valueColor || '#111827';
        var valueFontFamily = pluginOptions.valueFontFamily || 'Inter, system-ui, sans-serif';
        var valueFontWeight = pluginOptions.valueFontWeight || '700';
        var valuePrefix = pluginOptions.valuePrefix || '';
        var valueSuffix = pluginOptions.valueSuffix || '';
        var showValue = pluginOptions.showValue !== false;
        var valueDisplayContent = pluginOptions.valueDisplayContent || 'number';
        var showMinMax = pluginOptions.showMinMax !== false;
        var minLabel = pluginOptions.minLabel != null ? pluginOptions.minLabel : '0';
        var maxLabel = pluginOptions.maxLabel != null ? pluginOptions.maxLabel : '100';
        var minMaxColor = pluginOptions.minMaxColor || '#6b7280';
        var minMaxFontSize = pluginOptions.minMaxFontSize != null ? pluginOptions.minMaxFontSize : 12;
        var centerOffsetY = pluginOptions.centerOffsetY != null ? pluginOptions.centerOffsetY : 0;

        var globalCustomLabels = (chart.options && chart.options.plugins && chart.options.plugins.customLabelsConfig) || {};
        var datasetCustomLabels = dataset.customLabelsConfig || {};

        ctx.save();

        // ── 1. Draw curved slice labels along the arc
        if (dataset.data.length >= 2) {
            var cumulativeAngle = Math.PI;

            for (var i = 0; i < dataset.data.length; i++) {
                var rawSliceValue = dataset.data[i] != null ? dataset.data[i] : 0;
                var sliceValue = Math.abs(Number(rawSliceValue) || 0);
                var sliceRatio = totalValue > 0 ? sliceValue / totalValue : 0;
                var sliceAngle = sliceRatio * Math.PI;
                var midAngle = cumulativeAngle + sliceAngle / 2;

                var sliceOverride = (dataset.sliceLabelOverrides && dataset.sliceLabelOverrides[i]) || {};
                var sliceLabelsConfig = Object.assign({}, globalCustomLabels, datasetCustomLabels, sliceOverride);

                var showThisSliceLabel = sliceLabelsConfig.display !== false;
                var sliceLabelAnchor = sliceLabelsConfig.anchor || 'center';

                if (!showThisSliceLabel || sliceLabelAnchor === 'callout') {
                    cumulativeAngle += sliceAngle;
                    continue;
                }

                var sliceLabelColor = sliceLabelsConfig.color || '#000000';
                var sliceLabelFontSize = sliceLabelsConfig.fontSize != null ? sliceLabelsConfig.fontSize : 14;
                var sliceLabelFontFamily = sliceLabelsConfig.fontFamily || valueFontFamily;
                var sliceLabelFontWeight = sliceLabelsConfig.fontWeight || '600';
                var sliceLabelContent = sliceLabelsConfig.labelContent || 'value';
                var sliceLabelAnchor = sliceLabelsConfig.anchor || 'center';

                var labelRadius = (outerRadius + innerRadius) / 2;
                if (sliceLabelAnchor === 'top') {
                    labelRadius = outerRadius - 15;
                } else if (sliceLabelAnchor === 'bottom') {
                    labelRadius = innerRadius + 15;
                } else if (sliceLabelAnchor === 'callout') {
                    labelRadius = outerRadius + 15;
                }

                ctx.font = sliceLabelFontWeight + ' ' + sliceLabelFontSize + 'px ' + sliceLabelFontFamily;
                ctx.fillStyle = sliceLabelColor;
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';

                var labelText = '';
                var chartLabel = chart.data.labels && chart.data.labels[i];
                switch (sliceLabelContent) {
                    case 'label':
                        labelText = chartLabel ? String(chartLabel) : String(rawSliceValue);
                        break;
                    case 'percentage':
                        labelText = Math.round(sliceRatio * 100) + '%';
                        break;
                    case 'label+value':
                        labelText = chartLabel ? (chartLabel + ': ' + rawSliceValue) : String(rawSliceValue);
                        break;
                    case 'value':
                    default:
                        labelText = String(rawSliceValue);
                        break;
                }

                var textMetrics = ctx.measureText(labelText);
                var arcLength = sliceAngle * labelRadius;

                if (textMetrics.width > arcLength * 0.9 || labelText.length <= 4) {
                    var lx = centerX + Math.cos(midAngle) * labelRadius;
                    var ly = centerY + Math.sin(midAngle) * labelRadius;
                    ctx.save();
                    ctx.translate(lx, ly);
                    ctx.rotate(midAngle + Math.PI / 2);
                    ctx.fillText(labelText, 0, 0);
                    ctx.restore();
                } else {
                    drawCurvedText(ctx, labelText, centerX, centerY, labelRadius, midAngle, sliceLabelFontSize);
                }

                cumulativeAngle += sliceAngle;
            }
        }

        // ── 2. Draw needle
        var needleTipX = centerX + Math.cos(angle) * needleLength;
        var needleTipY = centerY + Math.sin(angle) * needleLength;

        if (needleType === 'line') {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(needleTipX, needleTipY);
            ctx.strokeStyle = needleColor;
            ctx.lineWidth = needleWidth;
            ctx.lineCap = 'round';
            ctx.stroke();
        } else if (needleType === 'arrow') {
            var shaftLength = needleLength * 0.7;
            var headWidth = Math.max(8, needleWidth * 4);
            var shaftEndX = centerX + Math.cos(angle) * shaftLength;
            var shaftEndY = centerY + Math.sin(angle) * shaftLength;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(shaftEndX, shaftEndY);
            ctx.strokeStyle = needleColor;
            ctx.lineWidth = needleWidth;
            ctx.lineCap = 'round';
            ctx.stroke();
            var perpAngle1 = angle - Math.PI / 2;
            var perpAngle2 = angle + Math.PI / 2;
            var wingX1 = shaftEndX + Math.cos(perpAngle1) * (headWidth / 2);
            var wingY1 = shaftEndY + Math.sin(perpAngle1) * (headWidth / 2);
            var wingX2 = shaftEndX + Math.cos(perpAngle2) * (headWidth / 2);
            var wingY2 = shaftEndY + Math.sin(perpAngle2) * (headWidth / 2);
            ctx.beginPath();
            ctx.moveTo(needleTipX, needleTipY);
            ctx.lineTo(wingX1, wingY1);
            ctx.lineTo(wingX2, wingY2);
            ctx.closePath();
            ctx.fillStyle = needleColor;
            ctx.fill();
        } else {
            var perpAngle1 = angle - Math.PI / 2;
            var perpAngle2 = angle + Math.PI / 2;
            var halfBase = needleBaseRadius * 0.8;
            var baseX1 = centerX + Math.cos(perpAngle1) * halfBase;
            var baseY1 = centerY + Math.sin(perpAngle1) * halfBase;
            var baseX2 = centerX + Math.cos(perpAngle2) * halfBase;
            var baseY2 = centerY + Math.sin(perpAngle2) * halfBase;
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
        var innerDotRadius = Math.max(2, needleBaseRadius * 0.5);
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerDotRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // ── 3. Draw value text
        if (showValue) {
            var valuePosition = pluginOptions.valuePosition || 'bottom';
            var gaugeValueText;
            if (valueDisplayContent === 'label') {
                var needleSliceIndex = 0;
                var cumulativeRatio = 0;
                for (var j = 0; j < absData.length; j++) {
                    var sr = totalValue > 0 ? absData[j] / totalValue : 0;
                    cumulativeRatio += sr;
                    if (ratio <= cumulativeRatio) {
                        needleSliceIndex = j;
                        break;
                    }
                    needleSliceIndex = j;
                }
                var sliceLabel = (chart.data.labels && chart.data.labels[needleSliceIndex]) || '';
                gaugeValueText = valuePrefix + sliceLabel + valueSuffix;
            } else {
                var displayNum = (manualNeedleValue !== undefined && manualNeedleValue !== null && manualNeedleValue !== '')
                    ? needleDisplayValue
                    : rawCurrentValue;
                gaugeValueText = valuePrefix + displayNum + valueSuffix;
            }

            ctx.font = valueFontWeight + ' ' + valueFontSize + 'px ' + valueFontFamily;
            ctx.fillStyle = valueColor;
            ctx.textBaseline = 'middle';

            var valX = centerX;
            var valY = centerY;

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

        // ── 4. Draw min/max labels
        if (showMinMax) {
            ctx.font = '400 ' + minMaxFontSize + 'px ' + valueFontFamily;
            ctx.fillStyle = minMaxColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            var labelY = centerY + 8;
            var labelSpread = outerRadius * 0.85;
            ctx.fillText(String(minLabel), centerX - labelSpread, labelY);
            ctx.fillText(String(maxLabel), centerX + labelSpread, labelY);

            // Zero Reference Marker
            var showZeroMarker = pluginOptions.showZeroMarker !== false;
            var zeroMarkerPosition = pluginOptions.zeroMarkerPosition || 'inner';
            var minVal = Number(minLabel);
            var maxVal = Number(maxLabel);

            if (showZeroMarker && !isNaN(minVal) && !isNaN(maxVal) && minVal < 0 && maxVal > 0) {
                var zeroRatio = (0 - minVal) / (maxVal - minVal);
                var zeroAngle = Math.PI + (zeroRatio * Math.PI);
                var tickInnerR, tickOuterR, textR;
                if (zeroMarkerPosition === 'outer') {
                    tickInnerR = outerRadius;
                    tickOuterR = outerRadius + 6;
                    textR = outerRadius + 14;
                } else {
                    tickInnerR = innerRadius - 6;
                    tickOuterR = innerRadius;
                    textR = innerRadius - 12;
                }
                var startX = centerX + Math.cos(zeroAngle) * tickInnerR;
                var startY = centerY + Math.sin(zeroAngle) * tickInnerR;
                var endX = centerX + Math.cos(zeroAngle) * tickOuterR;
                var endY = centerY + Math.sin(zeroAngle) * tickOuterR;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = minMaxColor;
                ctx.lineWidth = 2;
                ctx.stroke();
                var textX = centerX + Math.cos(zeroAngle) * textR;
                var textY = centerY + Math.sin(zeroAngle) * textR;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '600 ' + Math.max(10, minMaxFontSize - 2) + 'px ' + valueFontFamily;
                ctx.fillText('0', textX, textY);
            }
        }

        ctx.restore();
    }
};

Chart.register(gaugePlugin);
`;
}
