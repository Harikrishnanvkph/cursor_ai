/**
 * Shared pure-font helpers, Canvas text decoration (underline / strikethrough),
 * text-case transforms, and runtime Chart.js hooks so every native Chart.js
 * element and custom plugin responds accurately on live canvas & HTML exports.
 */

export type FontTextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize'
export type FontStyleOption = 'normal' | 'italic' | 'oblique'

export interface FontDecorationOptions {
  underline?: boolean
  strikethrough?: boolean
  color?: string | CanvasGradient | CanvasPattern
  fontSize?: number
  maxWidth?: number
  letterSpacing?: number
}

export function withCanvasLetterSpacing<T>(
  ctx: CanvasRenderingContext2D | null | undefined,
  letterSpacing: number | undefined,
  fn: () => T
): T {
  if (!ctx || typeof letterSpacing !== 'number' || isNaN(letterSpacing) || letterSpacing === 0) {
    return fn()
  }
  const anyCtx = ctx as any
  if (!('letterSpacing' in anyCtx)) {
    return fn()
  }
  const prev = anyCtx.letterSpacing
  anyCtx.letterSpacing = `${letterSpacing}px`
  try {
    return fn()
  } finally {
    anyCtx.letterSpacing = prev
  }
}

/**
 * Transforms a single string according to a CSS-like textTransform value.
 */
export function applyTextTransform(value: string, transform?: FontTextTransform | string): string {
  if (!value || !transform || transform === 'none') return value
  switch (transform) {
    case 'uppercase':
      return value.toUpperCase()
    case 'lowercase':
      return value.toLowerCase()
    case 'capitalize':
      return value.toLowerCase().replace(/(?:^|[\s\-_/])(\S)/g, (m) => m.toUpperCase())
    default:
      return value
  }
}

/**
 * Applies textTransform to a string or multi-line string[] array without mutating inputs.
 */
export function applyTextTransformToContent(
  content: any,
  transform?: FontTextTransform | string
): any {
  if (!transform || transform === 'none' || content == null) return content
  if (Array.isArray(content)) {
    return content.map((item) => (typeof item === 'string' ? applyTextTransform(item, transform) : item))
  }
  if (typeof content === 'string') {
    return applyTextTransform(content, transform)
  }
  return content
}

/**
 * Extracts numeric pixel size from a CSS/Canvas font string (e.g. "italic 700 14px Inter").
 */
export function extractFontSize(fontStr?: string, fallback: number = 14): number {
  if (typeof fontStr === 'string') {
    const match = fontStr.match(/(\d+(?:\.\d+)?)px/i)
    if (match && match[1]) {
      const parsed = parseFloat(match[1])
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
  }
  return fallback
}

/**
 * Builds a valid CanvasRenderingContext2D.font string from font parts.
 */
export function buildCanvasFont(opts: {
  style?: string
  weight?: string | number
  size?: number
  family?: string
}): string {
  const styleRaw = (opts.style || 'normal').trim().toLowerCase()
  const stylePrefix = styleRaw === 'italic' || styleRaw === 'oblique' ? `${styleRaw} ` : ''
  const weight = opts.weight !== undefined && opts.weight !== '' ? String(opts.weight) : '400'
  const size = typeof opts.size === 'number' && opts.size > 0 ? opts.size : 14
  const family = opts.family && opts.family !== 'default' ? opts.family : 'Arial'
  return `${stylePrefix}${weight} ${size}px ${family}`
}

/**
 * Draws underline and/or strikethrough for text at (x, y) inside the active canvas transform & alignment.
 */
export function drawCanvasTextDecoration(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: FontDecorationOptions
): void {
  if (!text || (!opts.underline && !opts.strikethrough)) return

  const metrics = ctx.measureText(text)
  const fontSize = opts.fontSize || extractFontSize(ctx.font, 14)

  let left: number
  let right: number
  if (
    typeof metrics.actualBoundingBoxLeft === 'number' &&
    typeof metrics.actualBoundingBoxRight === 'number' &&
    (metrics.actualBoundingBoxLeft !== 0 || metrics.actualBoundingBoxRight !== 0)
  ) {
    left = x - metrics.actualBoundingBoxLeft
    right = x + metrics.actualBoundingBoxRight
  } else {
    const width = metrics.width
    const align = ctx.textAlign
    if (align === 'center') {
      left = x - width / 2
      right = x + width / 2
    } else if (align === 'right' || align === 'end') {
      left = x - width
      right = x
    } else {
      left = x
      right = x + width
    }
  }

  if (opts.maxWidth && right - left > opts.maxWidth && opts.maxWidth > 0) {
    const center = (left + right) / 2
    const align = ctx.textAlign
    if (align === 'center') {
      left = center - opts.maxWidth / 2
      right = center + opts.maxWidth / 2
    } else if (align === 'right' || align === 'end') {
      left = right - opts.maxWidth
    } else {
      right = left + opts.maxWidth
    }
  }

  let top: number
  let bottom: number
  if (
    typeof metrics.actualBoundingBoxAscent === 'number' &&
    typeof metrics.actualBoundingBoxDescent === 'number' &&
    (metrics.actualBoundingBoxAscent !== 0 || metrics.actualBoundingBoxDescent !== 0)
  ) {
    top = y - metrics.actualBoundingBoxAscent
    bottom = y + metrics.actualBoundingBoxDescent
  } else {
    const baseline = ctx.textBaseline
    if (baseline === 'top' || baseline === 'hanging') {
      top = y
      bottom = y + fontSize
    } else if (baseline === 'bottom' || baseline === 'ideographic') {
      top = y - fontSize
      bottom = y
    } else if (baseline === 'alphabetic') {
      top = y - fontSize * 0.8
      bottom = y + fontSize * 0.2
    } else {
      top = y - fontSize * 0.5
      bottom = y + fontSize * 0.5
    }
  }

  const lineWidth = Math.max(1, Math.round(fontSize * 0.075 * 10) / 10)
  ctx.save()
  ctx.strokeStyle = opts.color ?? ctx.fillStyle
  ctx.lineWidth = lineWidth
  ctx.setLineDash([])

  if (opts.underline) {
    const underlineY = bottom + Math.max(0.5, lineWidth * 0.45)
    ctx.beginPath()
    ctx.moveTo(left, underlineY)
    ctx.lineTo(right, underlineY)
    ctx.stroke()
  }

  if (opts.strikethrough) {
    const strikeY = (top + bottom) / 2
    ctx.beginPath()
    ctx.moveTo(left, strikeY)
    ctx.lineTo(right, strikeY)
    ctx.stroke()
  }

  ctx.restore()
}

function withScopedTextDecoration(
  ctx: CanvasRenderingContext2D,
  fontSize: number | undefined,
  underline: boolean,
  strikethrough: boolean,
  letterSpacing: number | undefined,
  fn: () => void
): void {
  const runDecorated = () => {
    if (!underline && !strikethrough) {
      fn()
      return
    }
    const origFillText = ctx.fillText
    ctx.fillText = function (text: string, x: number, y: number, maxWidth?: number) {
      origFillText.call(this, text, x, y, maxWidth as any)
      drawCanvasTextDecoration(this, String(text ?? ''), x, y, {
        underline,
        strikethrough,
        color: this.fillStyle,
        fontSize,
        maxWidth,
      })
    }
    try {
      fn()
    } finally {
      ctx.fillText = origFillText
    }
  }

  withCanvasLetterSpacing(ctx, letterSpacing, runDecorated)
}

/**
 * Installs idempotent runtime hooks on Chart.js 4 built-in classes so native
 * Title, SubTitle, Legend, Scale ticks/titles, RadialLinearScale pointLabels/ticks,
 * and Tooltip support underline, strikethrough, textTransform, and letterSpacing.
 */
export function installChartJsFontPatches(targets: {
  Scale?: any
  RadialLinearScale?: any
  Title?: any
  Legend?: any
  Tooltip?: any
}): void {
  const { Scale, RadialLinearScale, Title, Legend, Tooltip } = targets

  // 1. TitleElement (shared by plugins.title and plugins.subtitle)
  const TitleElement = Title?._element
  if (TitleElement && !TitleElement._fontDecorationPatched) {
    const origUpdate = TitleElement.prototype.update
    if (origUpdate) {
      TitleElement.prototype.update = function (maxWidth: number, maxHeight: number, margins?: any) {
        const font = this.options?.font || {}
        const transform = font.textTransform
        const runUpdate = () =>
          withCanvasLetterSpacing(this.ctx, font.letterSpacing, () =>
            origUpdate.call(this, maxWidth, maxHeight, margins)
          )
        if (!transform || transform === 'none' || this.options?.text == null) {
          return runUpdate()
        }
        const prevText = this.options.text
        this.options.text = applyTextTransformToContent(prevText, transform)
        try {
          return runUpdate()
        } finally {
          this.options.text = prevText
        }
      }
    }

    const origDraw = TitleElement.prototype.draw
    if (origDraw) {
      TitleElement.prototype.draw = function () {
        const font = this.options?.font || {}
        const transform = font.textTransform
        const underline = Boolean(font.underline)
        const strikethrough = Boolean(font.strikethrough)

        const runWithDecor = () =>
          withScopedTextDecoration(
            this.ctx,
            font.size,
            underline,
            strikethrough,
            font.letterSpacing,
            () => origDraw.call(this)
          )

        if (!transform || transform === 'none' || this.options?.text == null) {
          runWithDecor()
          return
        }

        const prevText = this.options.text
        this.options.text = applyTextTransformToContent(prevText, transform)
        try {
          runWithDecor()
        } finally {
          this.options.text = prevText
        }
      }
    }
    TitleElement._fontDecorationPatched = true
  }

  // 2. LegendElement
  const LegendElement = Legend?._element
  if (LegendElement && !LegendElement._fontDecorationPatched) {
    const origBuildLabels = LegendElement.prototype.buildLabels
    if (origBuildLabels) {
      LegendElement.prototype.buildLabels = function () {
        origBuildLabels.call(this)
        const transform = this.options?.labels?.font?.textTransform
        if (transform && transform !== 'none' && Array.isArray(this.legendItems)) {
          this.legendItems.forEach((item: any) => {
            if (item && typeof item.text === 'string') {
              item.text = applyTextTransform(item.text, transform)
            }
          })
        }
      }
    }

    const origLegendFit = LegendElement.prototype.fit
    if (origLegendFit) {
      LegendElement.prototype.fit = function () {
        const labelSpacing = this.options?.labels?.font?.letterSpacing
        return withCanvasLetterSpacing(this.ctx, labelSpacing, () => origLegendFit.call(this))
      }
    }

    const origLegendDrawTitle = LegendElement.prototype.drawTitle
    if (origLegendDrawTitle) {
      LegendElement.prototype.drawTitle = function () {
        const titleOpts = this.options?.title
        const titleFont = titleOpts?.font || {}
        const transform = titleFont.textTransform
        const underline = Boolean(titleFont.underline)
        const strikethrough = Boolean(titleFont.strikethrough)
        this._inLegendTitleDraw = true
        const prevText = titleOpts?.text
        if (titleOpts && transform && transform !== 'none' && prevText != null) {
          titleOpts.text = applyTextTransformToContent(prevText, transform)
        }
        try {
          withScopedTextDecoration(
            this.ctx,
            titleFont.size,
            underline,
            strikethrough,
            titleFont.letterSpacing,
            () => origLegendDrawTitle.call(this)
          )
        } finally {
          if (titleOpts && prevText !== undefined) {
            titleOpts.text = prevText
          }
          this._inLegendTitleDraw = false
        }
      }
    }

    const origLegendDraw = LegendElement.prototype._draw
    if (origLegendDraw) {
      LegendElement.prototype._draw = function () {
        const labelFont = this.options?.labels?.font || {}
        const underline = Boolean(labelFont.underline)
        const strikethrough = Boolean(labelFont.strikethrough)
        const letterSpacing = labelFont.letterSpacing
        const runDraw = () => {
          if (!underline && !strikethrough) {
            origLegendDraw.call(this)
            return
          }
          const ctx = this.ctx
          const origFillText = ctx.fillText
          const legendInst = this
          ctx.fillText = function (text: string, x: number, y: number, maxWidth?: number) {
            origFillText.call(this, text, x, y, maxWidth as any)
            if (!legendInst._inLegendTitleDraw) {
              drawCanvasTextDecoration(this, String(text ?? ''), x, y, {
                underline,
                strikethrough,
                color: this.fillStyle,
                fontSize: labelFont.size,
                maxWidth,
              })
            }
          }
          try {
            origLegendDraw.call(this)
          } finally {
            ctx.fillText = origFillText
          }
        }
        withCanvasLetterSpacing(this.ctx, letterSpacing, runDraw)
      }
    }
    LegendElement._fontDecorationPatched = true
  }

  // 3. TooltipElement
  const TooltipElement = Tooltip?._element
  if (TooltipElement && !TooltipElement._fontDecorationPatched) {
    const origTooltipUpdate = TooltipElement.prototype.update
    if (origTooltipUpdate) {
      TooltipElement.prototype.update = function (changed: boolean, replay: boolean) {
        const opts = this.options
        const ls = opts?.bodyFont?.letterSpacing ?? opts?.titleFont?.letterSpacing
        return withCanvasLetterSpacing(this.chart?.ctx, ls, () =>
          origTooltipUpdate.call(this, changed, replay)
        )
      }
    }

    const origGetTitle = TooltipElement.prototype.getTitle
    if (origGetTitle) {
      TooltipElement.prototype.getTitle = function (context: any, options: any) {
        const lines = origGetTitle.call(this, context, options)
        const transform = options?.titleFont?.textTransform
        if (!transform || transform === 'none' || !Array.isArray(lines)) return lines
        return lines.map((l: any) => (typeof l === 'string' ? applyTextTransform(l, transform) : l))
      }
    }

    const origGetBody = TooltipElement.prototype.getBody
    if (origGetBody) {
      TooltipElement.prototype.getBody = function (tooltipItems: any, options: any) {
        const items = origGetBody.call(this, tooltipItems, options)
        const transform = options?.bodyFont?.textTransform
        if (!transform || transform === 'none' || !Array.isArray(items)) return items
        items.forEach((item: any) => {
          if (!item) return
          if (Array.isArray(item.before)) item.before = item.before.map((s: any) => (typeof s === 'string' ? applyTextTransform(s, transform) : s))
          if (Array.isArray(item.lines)) item.lines = item.lines.map((s: any) => (typeof s === 'string' ? applyTextTransform(s, transform) : s))
          if (Array.isArray(item.after)) item.after = item.after.map((s: any) => (typeof s === 'string' ? applyTextTransform(s, transform) : s))
        })
        return items
      }
    }

    const origDrawTooltipTitle = TooltipElement.prototype.drawTitle
    if (origDrawTooltipTitle) {
      TooltipElement.prototype.drawTitle = function (pt: any, ctx: CanvasRenderingContext2D, options: any) {
        const tf = options?.titleFont || {}
        withScopedTextDecoration(ctx, tf.size, Boolean(tf.underline), Boolean(tf.strikethrough), tf.letterSpacing, () => {
          origDrawTooltipTitle.call(this, pt, ctx, options)
        })
      }
    }

    const origDrawTooltipBody = TooltipElement.prototype.drawBody
    if (origDrawTooltipBody) {
      TooltipElement.prototype.drawBody = function (pt: any, ctx: CanvasRenderingContext2D, options: any) {
        const bf = options?.bodyFont || {}
        withScopedTextDecoration(ctx, bf.size, Boolean(bf.underline), Boolean(bf.strikethrough), bf.letterSpacing, () => {
          origDrawTooltipBody.call(this, pt, ctx, options)
        })
      }
    }

    TooltipElement._fontDecorationPatched = true
  }

  // 4. Base Scale (ticks textTransform + underline/strikethrough + letterSpacing, title textTransform + underline/strikethrough + letterSpacing)
  if (Scale && !Scale.prototype._fontDecorationPatched) {
    const resolveTickFontAt = (scale: any, idx: number, tick?: any): any => {
      const tickFontOpt = scale?.options?.ticks?.font
      const resolvedBase =
        typeof tickFontOpt === 'function'
          ? tickFontOpt(scale.getContext ? scale.getContext(idx) : { tick, index: idx })
          : tickFontOpt
      const baseObj = resolvedBase && typeof resolvedBase === 'object' ? resolvedBase : {}
      const majorCfg = scale?.options?.ticks?.major
      if (tick?.major && majorCfg?.enabled && majorCfg?.font && typeof majorCfg.font === 'object') {
        return { ...baseObj, ...majorCfg.font }
      }
      return baseObj
    }

    const origScaleFit = Scale.prototype.fit
    if (origScaleFit) {
      Scale.prototype.fit = function () {
        let fitLetterSpacing: number | undefined
        if (Array.isArray(this.ticks)) {
          this.ticks.forEach((tick: any, idx: number) => {
            if (!tick || tick.label == null) return
            const fontObj = resolveTickFontAt(this, idx, tick)
            if (fitLetterSpacing === undefined && typeof fontObj?.letterSpacing === 'number') {
              fitLetterSpacing = fontObj.letterSpacing
            }
            const t = fontObj?.textTransform
            if (tick._rawLabel === undefined) tick._rawLabel = tick.label
            if (t && t !== 'none') {
              tick.label = applyTextTransformToContent(tick._rawLabel, t)
            } else if (tick.label !== tick._rawLabel) {
              tick.label = tick._rawLabel
            }
          })
        }
        return withCanvasLetterSpacing(this.ctx, fitLetterSpacing, () => origScaleFit.call(this))
      }
    }

    const origScaleDrawLabels = Scale.prototype.drawLabels
    if (origScaleDrawLabels) {
      Scale.prototype.drawLabels = function (chartArea: any) {
        const fontObj = resolveTickFontAt(this, 0, this.ticks?.[0])
        return withCanvasLetterSpacing(this.ctx, fontObj?.letterSpacing, () =>
          origScaleDrawLabels.call(this, chartArea)
        )
      }
    }

    const origGetLabelItems = Scale.prototype.getLabelItems
    if (origGetLabelItems) {
      Scale.prototype.getLabelItems = function (chartArea: any) {
        const items = origGetLabelItems.call(this, chartArea)
        if (Array.isArray(items)) {
          items.forEach((item: any, idx: number) => {
            if (!item?.options) return
            const fontObj = resolveTickFontAt(this, idx, this.ticks?.[idx])
            if (fontObj?.underline) item.options.underline = true
            if (fontObj?.strikethrough) item.options.strikethrough = true
          })
        }
        return items
      }
    }

    const origScaleDrawTitle = Scale.prototype.drawTitle
    if (origScaleDrawTitle) {
      Scale.prototype.drawTitle = function (...args: any[]) {
        const title = this.options?.title
        if (!title?.display) return origScaleDrawTitle.apply(this, args)
        const font = title.font || {}
        const transform = font.textTransform
        const underline = Boolean(font.underline)
        const strikethrough = Boolean(font.strikethrough)

        const prevText = title.text
        if (transform && transform !== 'none' && prevText != null) {
          title.text = applyTextTransformToContent(prevText, transform)
        }
        try {
          withScopedTextDecoration(this.ctx, font.size, underline, strikethrough, font.letterSpacing, () => {
            origScaleDrawTitle.apply(this, args)
          })
        } finally {
          if (prevText !== undefined) title.text = prevText
        }
      }
    }

    Scale.prototype._fontDecorationPatched = true
  }

  // 5. RadialLinearScale (pointLabels + radial ticks)
  if (RadialLinearScale && !RadialLinearScale.prototype._fontDecorationPatched) {
    const origGenTicks = RadialLinearScale.prototype.generateTickLabels
    if (origGenTicks) {
      RadialLinearScale.prototype.generateTickLabels = function (ticks: any) {
        origGenTicks.call(this, ticks)
        const plTransform = this.options?.pointLabels?.font?.textTransform
        if (plTransform && plTransform !== 'none' && Array.isArray(this._pointLabels)) {
          this._pointLabels = this._pointLabels.map((lbl: any) =>
            applyTextTransformToContent(lbl, plTransform)
          )
        }
        if (Array.isArray(this.ticks)) {
          this.ticks.forEach((tick: any, idx: number) => {
            if (!tick || tick.label == null) return
            const tickFontOpt = this.options?.ticks?.font
            const resolvedBase =
              typeof tickFontOpt === 'function'
                ? tickFontOpt(this.getContext ? this.getContext(idx) : { tick, index: idx })
                : tickFontOpt
            const baseObj = resolvedBase && typeof resolvedBase === 'object' ? resolvedBase : {}
            const majorCfg = this.options?.ticks?.major
            const fontObj =
              tick.major && majorCfg?.enabled && majorCfg?.font && typeof majorCfg.font === 'object'
                ? { ...baseObj, ...majorCfg.font }
                : baseObj
            if (fontObj?.textTransform && fontObj.textTransform !== 'none') {
              tick.label = applyTextTransformToContent(tick.label, fontObj.textTransform)
            }
          })
        }
      }
    }

    const origRadialFit = RadialLinearScale.prototype.fit
    if (origRadialFit) {
      RadialLinearScale.prototype.fit = function () {
        const plFont = this.options?.pointLabels?.font || {}
        return withCanvasLetterSpacing(this.ctx, plFont.letterSpacing, () => origRadialFit.call(this))
      }
    }

    const origDrawGrid = RadialLinearScale.prototype.drawGrid
    if (origDrawGrid) {
      RadialLinearScale.prototype.drawGrid = function () {
        const plFont = this.options?.pointLabels?.font || {}
        withScopedTextDecoration(
          this.ctx,
          plFont.size,
          Boolean(plFont.underline),
          Boolean(plFont.strikethrough),
          plFont.letterSpacing,
          () => origDrawGrid.call(this)
        )
      }
    }

    const origRadialDrawLabels = RadialLinearScale.prototype.drawLabels
    if (origRadialDrawLabels) {
      RadialLinearScale.prototype.drawLabels = function () {
        const tickFont = typeof this.options?.ticks?.font === 'object' ? this.options.ticks.font : {}
        const majorFont = this.options?.ticks?.major?.enabled && typeof this.options?.ticks?.major?.font === 'object'
          ? this.options.ticks.major.font
          : null
        const underline = Boolean(tickFont?.underline || majorFont?.underline)
        const strikethrough = Boolean(tickFont?.strikethrough || majorFont?.strikethrough)
        withScopedTextDecoration(
          this.ctx,
          tickFont?.size,
          underline,
          strikethrough,
          tickFont?.letterSpacing ?? majorFont?.letterSpacing,
          () => origRadialDrawLabels.call(this)
        )
      }
    }

    RadialLinearScale.prototype._fontDecorationPatched = true
  }
}

/**
 * Generates self-contained JS patch code matching installChartJsFontPatches()
 * for standalone Chart.js UMD HTML exports.
 */
export function generateNativeChartJsFontPatchScript(): string {
  return `
// ── Chart.js Native Element Font Decorations & Text Transform Patches ──
(function() {
    if (typeof Chart === 'undefined') return;

    function applyTextTransform(val, transform) {
        if (!val || typeof val !== 'string' || !transform || transform === 'none') return val;
        if (transform === 'uppercase') return val.toUpperCase();
        if (transform === 'lowercase') return val.toLowerCase();
        if (transform === 'capitalize') {
            return val.toLowerCase().replace(/(?:^|[\\s\\-_\\/])(\\S)/g, function(m) { return m.toUpperCase(); });
        }
        return val;
    }

    function buildCanvasFont(opts) {
        var styleRaw = ((opts && opts.style) || 'normal').trim().toLowerCase();
        var stylePrefix = (styleRaw === 'italic' || styleRaw === 'oblique') ? (styleRaw + ' ') : '';
        var weight = (opts && opts.weight !== undefined && opts.weight !== '') ? String(opts.weight) : '400';
        var size = (opts && typeof opts.size === 'number' && opts.size > 0) ? opts.size : 14;
        var family = (opts && opts.family && opts.family !== 'default') ? opts.family : 'Arial';
        return stylePrefix + weight + ' ' + size + 'px ' + family;
    }

    function extractFontSize(fontStr, fallback) {
        var fb = fallback || 14;
        if (typeof fontStr === 'string') {
            var match = fontStr.match(/(\\d+(?:\\.\\d+)?)px/i);
            if (match && match[1]) {
                var parsed = parseFloat(match[1]);
                if (!isNaN(parsed) && parsed > 0) return parsed;
            }
        }
        return fb;
    }

    function applyTextTransformToContent(content, transform) {
        if (!transform || transform === 'none' || content == null) return content;
        if (Array.isArray(content)) {
            return content.map(function(c) { return typeof c === 'string' ? applyTextTransform(c, transform) : c; });
        }
        if (typeof content === 'string') return applyTextTransform(content, transform);
        return content;
    }

    function drawCanvasTextDecoration(ctx, text, x, y, opts) {
        if (!text || (!opts.underline && !opts.strikethrough)) return;
        var metrics = ctx.measureText(text);
        var match = typeof ctx.font === 'string' ? ctx.font.match(/(\\d+(?:\\.\\d+)?)px/i) : null;
        var fontSize = opts.fontSize || (match && match[1] ? parseFloat(match[1]) : 14);
        var left, right;
        if (typeof metrics.actualBoundingBoxLeft === 'number' && typeof metrics.actualBoundingBoxRight === 'number' && (metrics.actualBoundingBoxLeft !== 0 || metrics.actualBoundingBoxRight !== 0)) {
            left = x - metrics.actualBoundingBoxLeft;
            right = x + metrics.actualBoundingBoxRight;
        } else {
            var w = metrics.width;
            var align = ctx.textAlign;
            if (align === 'center') { left = x - w / 2; right = x + w / 2; }
            else if (align === 'right' || align === 'end') { left = x - w; right = x; }
            else { left = x; right = x + w; }
        }
        if (opts.maxWidth && right - left > opts.maxWidth && opts.maxWidth > 0) {
            var center = (left + right) / 2;
            var a = ctx.textAlign;
            if (a === 'center') { left = center - opts.maxWidth / 2; right = center + opts.maxWidth / 2; }
            else if (a === 'right' || a === 'end') { left = right - opts.maxWidth; }
            else { right = left + opts.maxWidth; }
        }
        var top, bottom;
        if (typeof metrics.actualBoundingBoxAscent === 'number' && typeof metrics.actualBoundingBoxDescent === 'number' && (metrics.actualBoundingBoxAscent !== 0 || metrics.actualBoundingBoxDescent !== 0)) {
            top = y - metrics.actualBoundingBoxAscent;
            bottom = y + metrics.actualBoundingBoxDescent;
        } else {
            var bl = ctx.textBaseline;
            if (bl === 'top' || bl === 'hanging') { top = y; bottom = y + fontSize; }
            else if (bl === 'bottom' || bl === 'ideographic') { top = y - fontSize; bottom = y; }
            else if (bl === 'alphabetic') { top = y - fontSize * 0.8; bottom = y + fontSize * 0.2; }
            else { top = y - fontSize * 0.5; bottom = y + fontSize * 0.5; }
        }
        var lineWidth = Math.max(1, Math.round(fontSize * 0.075 * 10) / 10);
        ctx.save();
        ctx.strokeStyle = opts.color || ctx.fillStyle;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash([]);
        if (opts.underline) {
            var uy = bottom + Math.max(0.5, lineWidth * 0.45);
            ctx.beginPath();
            ctx.moveTo(left, uy);
            ctx.lineTo(right, uy);
            ctx.stroke();
        }
        if (opts.strikethrough) {
            var sy = (top + bottom) / 2;
            ctx.beginPath();
            ctx.moveTo(left, sy);
            ctx.lineTo(right, sy);
            ctx.stroke();
        }
        ctx.restore();
    }

    function withCanvasLetterSpacing(ctx, letterSpacing, fn) {
        if (!ctx || typeof letterSpacing !== 'number' || isNaN(letterSpacing) || letterSpacing === 0 || !('letterSpacing' in ctx)) {
            return fn();
        }
        var prev = ctx.letterSpacing;
        ctx.letterSpacing = letterSpacing + 'px';
        try { return fn(); } finally { ctx.letterSpacing = prev; }
    }

    function withScopedTextDecoration(ctx, fontSize, underline, strikethrough, letterSpacing, fn) {
        var run = function() {
            if (!underline && !strikethrough) { fn(); return; }
            var origFillText = ctx.fillText;
            ctx.fillText = function(text, x, y, maxWidth) {
                origFillText.call(this, text, x, y, maxWidth);
                drawCanvasTextDecoration(this, String(text == null ? '' : text), x, y, {
                    underline: underline,
                    strikethrough: strikethrough,
                    color: this.fillStyle,
                    fontSize: fontSize,
                    maxWidth: maxWidth
                });
            };
            try { fn(); } finally { ctx.fillText = origFillText; }
        };
        return withCanvasLetterSpacing(ctx, letterSpacing, run);
    }

    if (typeof window !== 'undefined') {
        window.__chartFontUtils = {
            applyTextTransform: applyTextTransform,
            applyTextTransformToContent: applyTextTransformToContent,
            buildCanvasFont: buildCanvasFont,
            extractFontSize: extractFontSize,
            drawCanvasTextDecoration: drawCanvasTextDecoration,
            withCanvasLetterSpacing: withCanvasLetterSpacing
        };
    }

    try {
        var TitlePlugin = Chart.registry && Chart.registry.getPlugin ? Chart.registry.getPlugin('title') : null;
        var TitleElement = TitlePlugin ? TitlePlugin._element : (Chart.Title ? Chart.Title._element : null);
        if (TitleElement && !TitleElement._fontDecorationPatched) {
            var origTitleUpdate = TitleElement.prototype.update;
            if (origTitleUpdate) {
                TitleElement.prototype.update = function(maxWidth, maxHeight, margins) {
                    var font = (this.options && this.options.font) || {};
                    var tf = font.textTransform;
                    var self = this;
                    var exec = function() {
                        return withCanvasLetterSpacing(self.ctx, font.letterSpacing, function() {
                            return origTitleUpdate.call(self, maxWidth, maxHeight, margins);
                        });
                    };
                    if (!tf || tf === 'none' || !this.options || this.options.text == null) {
                        return exec();
                    }
                    var prev = this.options.text;
                    this.options.text = applyTextTransformToContent(prev, tf);
                    try { return exec(); }
                    finally { this.options.text = prev; }
                };
            }
            var origTitleDraw = TitleElement.prototype.draw;
            if (origTitleDraw) {
                TitleElement.prototype.draw = function() {
                    var font = (this.options && this.options.font) || {};
                    var tf = font.textTransform;
                    var ul = !!font.underline;
                    var st = !!font.strikethrough;
                    var self = this;
                    var run = function() {
                        withScopedTextDecoration(self.ctx, font.size, ul, st, font.letterSpacing, function() {
                            origTitleDraw.call(self);
                        });
                    };
                    if (!tf || tf === 'none' || !this.options || this.options.text == null) { run(); return; }
                    var prev = this.options.text;
                    this.options.text = applyTextTransformToContent(prev, tf);
                    try { run(); } finally { this.options.text = prev; }
                };
            }
            TitleElement._fontDecorationPatched = true;
        }
    } catch (e) {}

    try {
        var LegendPlugin = Chart.registry && Chart.registry.getPlugin ? Chart.registry.getPlugin('legend') : null;
        var LegendElement = LegendPlugin ? LegendPlugin._element : null;
        if (LegendElement && !LegendElement._fontDecorationPatched) {
            var origBuildLabels = LegendElement.prototype.buildLabels;
            if (origBuildLabels) {
                LegendElement.prototype.buildLabels = function() {
                    origBuildLabels.call(this);
                    var tf = this.options && this.options.labels && this.options.labels.font && this.options.labels.font.textTransform;
                    if (tf && tf !== 'none' && Array.isArray(this.legendItems)) {
                        this.legendItems.forEach(function(item) {
                            if (item && typeof item.text === 'string') item.text = applyTextTransform(item.text, tf);
                        });
                    }
                };
            }
            var origLegendFit = LegendElement.prototype.fit;
            if (origLegendFit) {
                LegendElement.prototype.fit = function() {
                    var ls = this.options && this.options.labels && this.options.labels.font && this.options.labels.font.letterSpacing;
                    var self = this;
                    return withCanvasLetterSpacing(this.ctx, ls, function() { return origLegendFit.call(self); });
                };
            }
            var origLegendDrawTitle = LegendElement.prototype.drawTitle;
            if (origLegendDrawTitle) {
                LegendElement.prototype.drawTitle = function() {
                    var titleOpts = this.options && this.options.title;
                    var titleFont = (titleOpts && titleOpts.font) || {};
                    var tf = titleFont.textTransform;
                    var ul = !!titleFont.underline;
                    var st = !!titleFont.strikethrough;
                    this._inLegendTitleDraw = true;
                    var prev = titleOpts ? titleOpts.text : undefined;
                    if (titleOpts && tf && tf !== 'none' && prev != null) titleOpts.text = applyTextTransformToContent(prev, tf);
                    try {
                        var self = this;
                        withScopedTextDecoration(this.ctx, titleFont.size, ul, st, titleFont.letterSpacing, function() { origLegendDrawTitle.call(self); });
                    } finally {
                        if (titleOpts && prev !== undefined) titleOpts.text = prev;
                        this._inLegendTitleDraw = false;
                    }
                };
            }
            var origLegendDraw = LegendElement.prototype._draw;
            if (origLegendDraw) {
                LegendElement.prototype._draw = function() {
                    var lf = (this.options && this.options.labels && this.options.labels.font) || {};
                    var ul = !!lf.underline;
                    var st = !!lf.strikethrough;
                    var self = this;
                    var runDraw = function() {
                        if (!ul && !st) { origLegendDraw.call(self); return; }
                        var ctx = self.ctx;
                        var origFillText = ctx.fillText;
                        ctx.fillText = function(text, x, y, maxWidth) {
                            origFillText.call(this, text, x, y, maxWidth);
                            if (!self._inLegendTitleDraw) {
                                drawCanvasTextDecoration(this, String(text == null ? '' : text), x, y, {
                                    underline: ul, strikethrough: st, color: this.fillStyle, fontSize: lf.size, maxWidth: maxWidth
                                });
                            }
                        };
                        try { origLegendDraw.call(self); } finally { ctx.fillText = origFillText; }
                    };
                    withCanvasLetterSpacing(this.ctx, lf.letterSpacing, runDraw);
                };
            }
            LegendElement._fontDecorationPatched = true;
        }
    } catch (e) {}

    try {
        var TooltipPlugin = Chart.registry && Chart.registry.getPlugin ? Chart.registry.getPlugin('tooltip') : null;
        var TooltipElement = TooltipPlugin ? TooltipPlugin._element : null;
        if (TooltipElement && !TooltipElement._fontDecorationPatched) {
            var origTooltipUpdate = TooltipElement.prototype.update;
            if (origTooltipUpdate) {
                TooltipElement.prototype.update = function(changed, replay) {
                    var opts = this.options || {};
                    var ls = (opts.bodyFont && opts.bodyFont.letterSpacing != null) ? opts.bodyFont.letterSpacing : (opts.titleFont && opts.titleFont.letterSpacing);
                    var self = this;
                    return withCanvasLetterSpacing(this.chart && this.chart.ctx, ls, function() {
                        return origTooltipUpdate.call(self, changed, replay);
                    });
                };
            }
            var origGetTitle = TooltipElement.prototype.getTitle;
            if (origGetTitle) {
                TooltipElement.prototype.getTitle = function(context, options) {
                    var lines = origGetTitle.call(this, context, options);
                    var tf = options && options.titleFont && options.titleFont.textTransform;
                    if (!tf || tf === 'none' || !Array.isArray(lines)) return lines;
                    return lines.map(function(l) { return typeof l === 'string' ? applyTextTransform(l, tf) : l; });
                };
            }
            var origGetBody = TooltipElement.prototype.getBody;
            if (origGetBody) {
                TooltipElement.prototype.getBody = function(tooltipItems, options) {
                    var items = origGetBody.call(this, tooltipItems, options);
                    var tf = options && options.bodyFont && options.bodyFont.textTransform;
                    if (!tf || tf === 'none' || !Array.isArray(items)) return items;
                    items.forEach(function(item) {
                        if (!item) return;
                        if (Array.isArray(item.before)) item.before = item.before.map(function(s) { return typeof s === 'string' ? applyTextTransform(s, tf) : s; });
                        if (Array.isArray(item.lines)) item.lines = item.lines.map(function(s) { return typeof s === 'string' ? applyTextTransform(s, tf) : s; });
                        if (Array.isArray(item.after)) item.after = item.after.map(function(s) { return typeof s === 'string' ? applyTextTransform(s, tf) : s; });
                    });
                    return items;
                };
            }
            var origDrawTooltipTitle = TooltipElement.prototype.drawTitle;
            if (origDrawTooltipTitle) {
                TooltipElement.prototype.drawTitle = function(pt, ctx, options) {
                    var tf = (options && options.titleFont) || {};
                    var self = this;
                    withScopedTextDecoration(ctx, tf.size, !!tf.underline, !!tf.strikethrough, tf.letterSpacing, function() {
                        origDrawTooltipTitle.call(self, pt, ctx, options);
                    });
                };
            }
            var origDrawTooltipBody = TooltipElement.prototype.drawBody;
            if (origDrawTooltipBody) {
                TooltipElement.prototype.drawBody = function(pt, ctx, options) {
                    var bf = (options && options.bodyFont) || {};
                    var self = this;
                    withScopedTextDecoration(ctx, bf.size, !!bf.underline, !!bf.strikethrough, bf.letterSpacing, function() {
                        origDrawTooltipBody.call(self, pt, ctx, options);
                    });
                };
            }
            TooltipElement._fontDecorationPatched = true;
        }
    } catch (e) {}

    try {
        var resolveTickFontAt = function(scale, idx, tick) {
            var tickFontOpt = scale && scale.options && scale.options.ticks && scale.options.ticks.font;
            var resolvedBase = typeof tickFontOpt === 'function'
                ? tickFontOpt(scale.getContext ? scale.getContext(idx) : { tick: tick, index: idx })
                : tickFontOpt;
            var baseObj = resolvedBase && typeof resolvedBase === 'object' ? resolvedBase : {};
            var majorCfg = scale && scale.options && scale.options.ticks && scale.options.ticks.major;
            if (tick && tick.major && majorCfg && majorCfg.enabled && majorCfg.font && typeof majorCfg.font === 'object') {
                return Object.assign({}, baseObj, majorCfg.font);
            }
            return baseObj;
        };
        var ScaleClass = Chart.Scale;
        if (ScaleClass && !ScaleClass.prototype._fontDecorationPatched) {
            var origScaleFit = ScaleClass.prototype.fit;
            if (origScaleFit) {
                ScaleClass.prototype.fit = function() {
                    var self = this;
                    var fitLs;
                    if (Array.isArray(this.ticks)) {
                        this.ticks.forEach(function(tick, idx) {
                            if (!tick || tick.label == null) return;
                            var fo = resolveTickFontAt(self, idx, tick);
                            if (fitLs === undefined && typeof fo.letterSpacing === 'number') fitLs = fo.letterSpacing;
                            var t = fo && fo.textTransform;
                            if (tick._rawLabel === undefined) tick._rawLabel = tick.label;
                            tick.label = (t && t !== 'none') ? applyTextTransformToContent(tick._rawLabel, t) : tick._rawLabel;
                        });
                    }
                    return withCanvasLetterSpacing(this.ctx, fitLs, function() { return origScaleFit.call(self); });
                };
            }
            var origScaleDrawLabels = ScaleClass.prototype.drawLabels;
            if (origScaleDrawLabels) {
                ScaleClass.prototype.drawLabels = function(chartArea) {
                    var fo = resolveTickFontAt(this, 0, this.ticks && this.ticks[0]);
                    var self = this;
                    return withCanvasLetterSpacing(this.ctx, fo && fo.letterSpacing, function() {
                        return origScaleDrawLabels.call(self, chartArea);
                    });
                };
            }
            var origGetLabelItems = ScaleClass.prototype.getLabelItems;
            if (origGetLabelItems) {
                ScaleClass.prototype.getLabelItems = function(chartArea) {
                    var items = origGetLabelItems.call(this, chartArea);
                    var self = this;
                    if (Array.isArray(items)) {
                        items.forEach(function(item, idx) {
                            if (!item || !item.options) return;
                            var fo = resolveTickFontAt(self, idx, self.ticks && self.ticks[idx]);
                            if (fo && fo.underline) item.options.underline = true;
                            if (fo && fo.strikethrough) item.options.strikethrough = true;
                        });
                    }
                    return items;
                };
            }
            var origScaleDrawTitle = ScaleClass.prototype.drawTitle;
            if (origScaleDrawTitle) {
                ScaleClass.prototype.drawTitle = function() {
                    var title = this.options && this.options.title;
                    if (!title || !title.display) return origScaleDrawTitle.apply(this, arguments);
                    var font = title.font || {};
                    var tf = font.textTransform;
                    var ul = !!font.underline;
                    var st = !!font.strikethrough;
                    var prev = title.text;
                    if (tf && tf !== 'none' && prev != null) title.text = applyTextTransformToContent(prev, tf);
                    try {
                        var self = this, args = arguments;
                        withScopedTextDecoration(this.ctx, font.size, ul, st, font.letterSpacing, function() {
                            origScaleDrawTitle.apply(self, args);
                        });
                    } finally {
                        if (prev !== undefined) title.text = prev;
                    }
                };
            }
            ScaleClass.prototype._fontDecorationPatched = true;
        }

        var RadialScale = Chart.RadialLinearScale || (Chart.registry && Chart.registry.getScale ? Chart.registry.getScale('radialLinear') : null);
        if (RadialScale && !RadialScale.prototype._fontDecorationPatched) {
            var origGenTicks = RadialScale.prototype.generateTickLabels;
            if (origGenTicks) {
                RadialScale.prototype.generateTickLabels = function(ticks) {
                    origGenTicks.call(this, ticks);
                    var plTf = this.options && this.options.pointLabels && this.options.pointLabels.font && this.options.pointLabels.font.textTransform;
                    if (plTf && plTf !== 'none' && Array.isArray(this._pointLabels)) {
                        this._pointLabels = this._pointLabels.map(function(lbl) { return applyTextTransformToContent(lbl, plTf); });
                    }
                    var self = this;
                    if (Array.isArray(this.ticks)) {
                        this.ticks.forEach(function(tick, idx) {
                            if (!tick || tick.label == null) return;
                            var fo = resolveTickFontAt(self, idx, tick);
                            if (fo && fo.textTransform && fo.textTransform !== 'none') {
                                tick.label = applyTextTransformToContent(tick.label, fo.textTransform);
                            }
                        });
                    }
                };
            }
            var origRadialFit = RadialScale.prototype.fit;
            if (origRadialFit) {
                RadialScale.prototype.fit = function() {
                    var plf = (this.options && this.options.pointLabels && this.options.pointLabels.font) || {};
                    var self = this;
                    return withCanvasLetterSpacing(this.ctx, plf.letterSpacing, function() { return origRadialFit.call(self); });
                };
            }
            var origDrawGrid = RadialScale.prototype.drawGrid;
            if (origDrawGrid) {
                RadialScale.prototype.drawGrid = function() {
                    var plf = (this.options && this.options.pointLabels && this.options.pointLabels.font) || {};
                    var self = this;
                    withScopedTextDecoration(this.ctx, plf.size, !!plf.underline, !!plf.strikethrough, plf.letterSpacing, function() {
                        origDrawGrid.call(self);
                    });
                };
            }
            var origRadialDrawLabels = RadialScale.prototype.drawLabels;
            if (origRadialDrawLabels) {
                RadialScale.prototype.drawLabels = function() {
                    var tf = (this.options && this.options.ticks && typeof this.options.ticks.font === 'object') ? this.options.ticks.font : {};
                    var mf = (this.options && this.options.ticks && this.options.ticks.major && this.options.ticks.major.enabled && typeof this.options.ticks.major.font === 'object') ? this.options.ticks.major.font : null;
                    var ul = !!(tf.underline || (mf && mf.underline));
                    var st = !!(tf.strikethrough || (mf && mf.strikethrough));
                    var ls = tf.letterSpacing != null ? tf.letterSpacing : (mf && mf.letterSpacing);
                    var self = this;
                    withScopedTextDecoration(this.ctx, tf.size, ul, st, ls, function() {
                        origRadialDrawLabels.call(self);
                    });
                };
            }
            RadialScale.prototype._fontDecorationPatched = true;
        }
    } catch (e) {}
})();
`;
}
