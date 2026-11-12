import { findFontByInput } from "@/lib/typography-registry";

/**
 * Standard system fonts that do not require external network requests.
 */
const SYSTEM_FONT_NAMES = new Set([
  'arial',
  'helvetica',
  'times new roman',
  'times',
  'courier new',
  'courier',
  'georgia',
  'verdana',
  'tahoma',
  'trebuchet ms',
  'impact',
  'comic sans ms',
  'system-ui',
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
  'inherit',
  'initial',
  'default'
]);

/**
 * Clean a font family string into a clean font name (e.g. "'Courier Prime', monospace" -> "Courier Prime")
 */
export function cleanFontFamilyName(raw?: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const first = raw.split(',')[0].replace(/['"]/g, '').trim();
  return first;
}

/**
 * Recursively scans chartConfig, chartData, and decoration shapes to collect all unique font families.
 */
export function collectAllChartFonts(chartConfig: any, chartData?: any, shapes?: any[]): string[] {
  const fontSet = new Set<string>();

  const addFont = (f?: any) => {
    if (!f || typeof f !== 'string') return;
    const cleaned = cleanFontFamilyName(f);
    if (cleaned && cleaned.toLowerCase() !== 'default') {
      fontSet.add(cleaned);
    }
  };

  if (chartConfig) {
    // 1. Global options / typography
    addFont(chartConfig.fontFamily);
    addFont(chartConfig.options?.font?.family);
    addFont(chartConfig.options?.plugins?.legend?.labels?.font?.family);

    // 2. Titles & Subtitles
    addFont(chartConfig.plugins?.title?.font?.family);
    addFont(chartConfig.plugins?.subtitle?.font?.family);

    // 3. Legend
    addFont(chartConfig.plugins?.legend?.labels?.font?.family);

    // 4. Tooltips
    addFont(chartConfig.plugins?.tooltip?.titleFont?.family);
    addFont(chartConfig.plugins?.tooltip?.bodyFont?.family);
    addFont(chartConfig.plugins?.tooltip?.footerFont?.family);

    // 5. Scales (x, y, y1, r, etc.)
    if (chartConfig.scales && typeof chartConfig.scales === 'object') {
      Object.keys(chartConfig.scales).forEach(k => {
        const sc = chartConfig.scales[k];
        if (sc) {
          addFont(sc.title?.font?.family);
          addFont(sc.ticks?.font?.family);
        }
      });
    }

    // 6. Custom labels
    if (chartConfig.plugins?.customLabels) {
      addFont(chartConfig.plugins.customLabels.fontFamily);
      if (Array.isArray(chartConfig.plugins.customLabels.labels)) {
        chartConfig.plugins.customLabels.labels.forEach((l: any) => {
          addFont(l.fontFamily);
          addFont(l.font?.family);
        });
      }
    }

    // 7. Watermark
    addFont(chartConfig.plugins?.watermark?.font?.family);
    addFont(chartConfig.plugins?.watermark?.fontFamily);
  }

  // 8. Datasets font options (datalabels, etc.)
  if (chartData && Array.isArray(chartData.datasets)) {
    chartData.datasets.forEach((ds: any) => {
      addFont(ds.fontFamily);
      addFont(ds.font?.family);
      addFont(ds.datalabels?.font?.family);
    });
  }

  // 9. Canvas textboxes from decoration store
  if (Array.isArray(shapes)) {
    shapes.forEach(s => {
      if (s && (s.type === 'textbox' || s.type === 'textbox-auto' || s.type === 'text-callout')) {
        addFont(s.fontFamily);
      }
    });
  }

  return Array.from(fontSet);
}

/**
 * Generates Google Fonts <link> tags for any external web fonts found.
 */
export function generateGoogleFontHeadTags(fontNames: string[]): string {
  const googleFonts = new Set<string>();

  fontNames.forEach(rawName => {
    const cleaned = cleanFontFamilyName(rawName);
    if (!cleaned) return;
    const lower = cleaned.toLowerCase();
    if (SYSTEM_FONT_NAMES.has(lower)) return;

    // Check registry
    const registered = findFontByInput(cleaned);
    if (registered && registered.isGoogleFont === false) {
      return; // System font confirmed
    }

    // Google font name
    const gName = registered?.googleFontName || cleaned;
    googleFonts.add(gName);
  });

  if (googleFonts.size === 0) return '';

  const links = Array.from(googleFonts).map(name => {
    const encoded = encodeURIComponent(name).replace(/%20/g, '+');
    return `    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encoded}:wght@300;400;500;600;700;800;900&display=swap">`;
  });

  return `    <!-- Google Fonts Preconnect & Stylesheets -->\n    <link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n${links.join('\n')}`;
}

/**
 * Generates JavaScript runtime patch code for Chart.js 4-way padding and asymmetric tick padding.
 */
export function generatePaddingAndFontPatchesCode(): string {
  return `
// ── Chart.js 4-Way Padding & Asymmetric Tick Padding Patches ──
(function() {
    if (typeof Chart === 'undefined') return;

    // 1. Chart Title & Subtitle 4-Way Individual Padding (top, right, bottom, left)
    try {
        var TitlePlugin = Chart.registry && Chart.registry.getPlugin ? Chart.registry.getPlugin('title') : null;
        var TitleElement = TitlePlugin ? TitlePlugin._element : (Chart.Title ? Chart.Title._element : null);
        if (TitleElement && !TitleElement._drawArgs4WayPatched) {
            var originalDrawArgs = TitleElement.prototype._drawArgs;
            TitleElement.prototype._drawArgs = function(offset) {
                var args = originalDrawArgs.call(this, offset);
                if (this.isHorizontal()) {
                    var padLeft = (this._padding && this._padding.left) || 0;
                    var padRight = (this._padding && this._padding.right) || 0;
                    var align = (this.options && this.options.align) || 'center';
                    if (align === 'start') {
                        args.titleX += padLeft;
                    } else if (align === 'end') {
                        args.titleX -= padRight;
                    } else {
                        args.titleX += (padLeft - padRight) / 2;
                    }
                } else {
                    var padTop = (this._padding && this._padding.top) || 0;
                    var padBottom = (this._padding && this._padding.bottom) || 0;
                    var align = (this.options && this.options.align) || 'center';
                    if (align === 'start') {
                        args.titleY += padTop;
                    } else if (align === 'end') {
                        args.titleY -= padBottom;
                    } else {
                        args.titleY += (padTop - padBottom) / 2;
                    }
                }
                return args;
            };
            TitleElement._drawArgs4WayPatched = true;
        }
    } catch (e) {
        console.warn('TitleElement 4-way padding patch error:', e);
    }

    // 2. Scale (X-axis, Y-axis) Title 4-Way Horizontal & Vertical Padding
    try {
        var ScaleClass = Chart.Scale;
        if (ScaleClass && !ScaleClass.prototype._drawTitle4WayPatched) {
            var originalScaleDrawTitle = ScaleClass.prototype.drawTitle;
            ScaleClass.prototype.drawTitle = function() {
                var title = this.options && this.options.title;
                if (!title || !title.display) return originalScaleDrawTitle.apply(this, arguments);

                var pad = title.padding;
                var isObj = typeof pad === 'object' && pad !== null;
                var padLeft = isObj ? (Number(pad.left) || 0) : 0;
                var padRight = isObj ? (Number(pad.right) || 0) : 0;

                var ctx = this.ctx;
                ctx.save();
                if (this.isHorizontal()) {
                    var hShift = padLeft - padRight;
                    if (hShift !== 0) ctx.translate(hShift, 0);
                } else {
                    var isRight = this.options && this.options.position === 'right';
                    var hShift = isRight ? (padRight - padLeft) : (-padLeft + padRight);
                    if (hShift !== 0) ctx.translate(hShift, 0);
                }

                try {
                    originalScaleDrawTitle.apply(this, arguments);
                } finally {
                    ctx.restore();
                }
            };
            ScaleClass.prototype._drawTitle4WayPatched = true;
        }

        // 3. Scale Ticks Asymmetric top & bottom padding
        if (ScaleClass && !ScaleClass.prototype._fitCustomPaddingPatched) {
            var originalScaleFit = ScaleClass.prototype.fit;
            ScaleClass.prototype.fit = function() {
                var customPad = this.options && this.options.ticks && this.options.ticks._customPadding;
                if (customPad && this.options && this.options.ticks) {
                    var padTop = Number(customPad.top) || 0;
                    var padBottom = Number(customPad.bottom) || 0;
                    var originalPadding = this.options.ticks.padding;
                    this.options.ticks.padding = (padTop + padBottom) / 2;
                    try {
                        originalScaleFit.call(this);
                    } finally {
                        this.options.ticks.padding = originalPadding;
                    }
                    return;
                }
                originalScaleFit.call(this);
            };
            ScaleClass.prototype._fitCustomPaddingPatched = true;
        }
    } catch (e) {
        console.warn('Scale padding patch error:', e);
    }
})();
`;
}

/**
 * Sanitizes scale.ticks.padding objects ({ top, bottom }) so Chart.js calculations don't result in NaN.
 */
export function sanitizeScalesCustomPadding(scales: any): void {
  if (!scales || typeof scales !== 'object') return;
  Object.keys(scales).forEach(key => {
    const sc = scales[key];
    if (sc && sc.ticks && typeof sc.ticks.padding === 'object' && sc.ticks.padding !== null) {
      const rawPad = sc.ticks.padding;
      const padTop = Number(rawPad.top) || 0;
      const padBottom = Number(rawPad.bottom) || 0;
      sc.ticks._customPadding = { top: padTop, bottom: padBottom };
      sc.ticks.padding = (padTop + padBottom) / 2;
    }
  });
}
