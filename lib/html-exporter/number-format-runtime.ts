/**
 * Shared runtime JS generators for Number & Value Formatting across HTML exports.
 * Mirrors the formatting behavior in lib/chart_generator.tsx so exported HTML charts
 * match the canvas editor for axis ticks, tooltips, and numeric displays.
 */

export function generateNumberFormatHelpersJS(): string {
    return `
        // Utility to check whether a numberFormat config activates formatting
        function hasActiveNumberFormat(numFormat) {
            if (!numFormat || typeof numFormat !== 'object') return false;
            return Boolean(
                (numFormat.preset && numFormat.preset !== 'none') ||
                numFormat.compact ||
                (numFormat.decimals !== undefined && numFormat.decimals !== 'auto') ||
                numFormat.useGrouping === false
            );
        }

        // Utility to format numbers based on numberFormat configuration
        function formatNumberWithConfig(val, formatConfig) {
            if (!formatConfig || typeof formatConfig !== 'object') return String(val);
            const preset = formatConfig.preset || 'none';
            const currencySymbol = formatConfig.currencySymbol || '$';
            const currencyPosition = formatConfig.currencyPosition || 'prefix';
            const decimals = formatConfig.decimals;
            const compact = Boolean(formatConfig.compact) || preset === 'compact';
            const useGrouping = formatConfig.useGrouping !== false;

            if (preset === 'none' && !compact && (decimals === undefined || decimals === 'auto')) {
                return String(val);
            }

            let formatted = '';
            const fracDigits = (decimals !== undefined && decimals !== 'auto') ? Number(decimals) : (val % 1 === 0 ? 0 : 2);

            try {
                const opts = {
                    useGrouping: useGrouping,
                    maximumFractionDigits: fracDigits,
                    minimumFractionDigits: (decimals !== undefined && decimals !== 'auto') ? fracDigits : 0,
                };
                if (compact) {
                    opts.notation = 'compact';
                    opts.compactDisplay = 'short';
                }
                formatted = new Intl.NumberFormat('en-US', opts).format(val);
            } catch(e) {
                formatted = String(val);
            }

            if (preset === 'currency') {
                if (currencyPosition === 'prefix') {
                    formatted = currencySymbol + formatted;
                } else {
                    formatted = formatted + ' ' + currencySymbol;
                }
            } else if (preset === 'percent') {
                formatted = formatted + '%';
            }

            return formatted;
        }`;
}

export function generateScaleTicksFormattingJS(configVarName: string = 'enhancedConfig'): string {
    return `
        // Dynamic Axis Tick Prefix, Suffix & Number Formatting
        if (${configVarName}.scales) {
            Object.keys(${configVarName}.scales).forEach(function(axisKey) {
                const scale = ${configVarName}.scales[axisKey];
                if (scale && scale.ticks) {
                    const prefix = typeof scale.ticks.prefix === 'string' ? scale.ticks.prefix : '';
                    const suffix = typeof scale.ticks.suffix === 'string' ? scale.ticks.suffix : '';
                    const numFormat = scale.ticks.numberFormat;
                    const hasNumFormat = hasActiveNumberFormat(numFormat);
                    if (prefix || suffix || hasNumFormat) {
                        const origCallback = scale.ticks.callback;
                        scale.ticks.callback = function(value, index, ticks) {
                            let label;
                            if (typeof origCallback === 'function') {
                                label = origCallback.call(this, value, index, ticks);
                            } else if (this && (this.type === 'category' || this.type === 'time')) {
                                label = typeof this.getLabelForValue === 'function' ? this.getLabelForValue(value) : value;
                            } else if (typeof value === 'number' && hasNumFormat) {
                                label = formatNumberWithConfig(value, numFormat);
                            } else if (this && typeof this.getLabelForValue === 'function') {
                                label = this.getLabelForValue(value);
                            } else {
                                label = value;
                            }
                            if (label !== undefined && label !== null && (prefix || suffix)) {
                                if (Array.isArray(label)) {
                                    return label.map(function(l, i) {
                                        return (i === 0 ? prefix : '') + l + (i === label.length - 1 ? suffix : '');
                                    });
                                }
                                return prefix + label + suffix;
                            }
                            return label;
                        };
                    }
                }
            });
        }`;
}

export function generateTooltipFormattingJS(
    configVarName: string = 'enhancedConfig',
    originalChartType: string = '',
    mappedChartType: string = ''
): string {
    return `
        // Dynamic Tooltip Number & Timeline Value Formatting
        if (!${configVarName}.plugins || !${configVarName}.plugins.tooltip || ${configVarName}.plugins.tooltip.enabled !== false) {
            ${configVarName}.plugins = ${configVarName}.plugins || {};
            ${configVarName}.plugins.tooltip = ${configVarName}.plugins.tooltip || {};
            const origTooltipLabel = ${configVarName}.plugins.tooltip.callbacks && ${configVarName}.plugins.tooltip.callbacks.label;
            ${configVarName}.plugins.tooltip.callbacks = ${configVarName}.plugins.tooltip.callbacks || {};
            ${configVarName}.plugins.tooltip.callbacks.label = function(context) {
                if (typeof origTooltipLabel === 'function') {
                    return origTooltipLabel.call(this, context);
                }
                const _mappedType = ${JSON.stringify(mappedChartType || '')} || (typeof chartType !== 'undefined' ? chartType : '');
                const _origChartType = ${JSON.stringify(originalChartType || '')} || _mappedType;
                const isTimelineChart = _origChartType === 'timeline' || _mappedType === 'timeline';
                const dataset = context.dataset || {};
                const label = context.label || '';
                const needsHorizontal = ${configVarName}.indexAxis === 'y';
                let rawVal = context.raw !== undefined
                    ? context.raw
                    : (needsHorizontal && context.parsed && context.parsed.x !== undefined
                        ? context.parsed.x
                        : (context.parsed && context.parsed.y !== undefined ? context.parsed.y : context.parsed));
                let numVal;
                if (typeof rawVal === 'number') {
                    numVal = rawVal;
                } else if (typeof rawVal === 'object' && rawVal !== null && !Array.isArray(rawVal) && rawVal.y !== undefined) {
                    numVal = Number(rawVal.y);
                } else if (needsHorizontal && context.parsed && context.parsed.x !== undefined) {
                    numVal = Number(context.parsed.x);
                } else if (context.parsed && context.parsed.y !== undefined) {
                    numVal = Number(context.parsed.y);
                } else if (context.parsed && context.parsed.r !== undefined) {
                    numVal = Number(context.parsed.r);
                } else {
                    numVal = Number(rawVal);
                }

                let formattedVal = isNaN(numVal) ? String(rawVal ?? '') : numVal;
                if (typeof numVal === 'number' && !isNaN(numVal)) {
                    let scaleFormat;
                    if (_origChartType === 'radar' || _origChartType === 'polarArea') {
                        scaleFormat = ${configVarName}.scales && ${configVarName}.scales.r && ${configVarName}.scales.r.ticks && ${configVarName}.scales.r.ticks.numberFormat;
                    } else if (['pie', 'doughnut', 'pie3d', 'doughnut3d'].indexOf(_origChartType) !== -1) {
                        scaleFormat = ${configVarName}.numberFormat || (${configVarName}.scales && ${configVarName}.scales.r && ${configVarName}.scales.r.ticks && ${configVarName}.scales.r.ticks.numberFormat);
                    } else if (_origChartType === 'gauge' || (${configVarName}.plugins && ${configVarName}.plugins.gauge && ${configVarName}.plugins.gauge.enabled)) {
                        scaleFormat = ${configVarName}.numberFormat || (${configVarName}.plugins && ${configVarName}.plugins.gauge && ${configVarName}.plugins.gauge.numberFormat);
                    } else {
                        const axisKey = needsHorizontal ? 'x' : (dataset.yAxisID || 'y');
                        scaleFormat = ${configVarName}.scales && ${configVarName}.scales[axisKey] && ${configVarName}.scales[axisKey].ticks && ${configVarName}.scales[axisKey].ticks.numberFormat;
                    }

                    if (scaleFormat && scaleFormat.syncTooltip !== false && hasActiveNumberFormat(scaleFormat)) {
                        formattedVal = formatNumberWithConfig(numVal, scaleFormat);
                    } else if (isTimelineChart) {
                        const yTick = ${configVarName}.scales && ${configVarName}.scales.y && ${configVarName}.scales.y.ticks;
                        const prefix = typeof yTick?.prefix === 'string' ? yTick.prefix : '';
                        const suffix = typeof yTick?.suffix === 'string' ? yTick.suffix : '';
                        const formatted = numVal.toLocaleString(undefined, {
                            minimumFractionDigits: numVal % 1 === 0 ? 0 : 2,
                            maximumFractionDigits: 2
                        });
                        formattedVal = prefix + formatted + suffix;
                    }
                }
                const dsLabel = dataset.label ? dataset.label + ': ' : (isTimelineChart ? '' : (label ? label + ': ' : ''));
                return dsLabel + formattedVal;
            };
        }`;
}
