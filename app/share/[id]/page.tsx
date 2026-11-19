"use client"

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { useParams } from "next/navigation"
import { dataService } from "@/lib/data-service"
import { Chart as ChartJS } from "chart.js"
import "@/lib/chart-registration"
import {
  Loader2,
  AlertCircle,
  Hand,
  Share2,
  Check,
  Plus,
  Minus,
  Sparkles,
  Download,
  ChevronDown,
  MousePointerClick,
  Sun,
  Moon,
  Maximize2,
  SlidersHorizontal,
  BarChart3,
  Image as ImageIcon,
  Code2,
  ArrowUpRight,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { downloadChartAsHTML } from "@/lib/html-exporter"
import { downloadTemplateExport, downloadFormatExport } from "@/lib/template-export"
import { getBackgroundConfig, parseDimension } from "@/lib/utils/dimension-utils"
import { getProxiedImageUrl, requiresProxy } from "@/lib/utils/image-proxy-utils"
import { renderFormat } from "@/lib/variant-engine"
import { FormatRenderer } from "@/components/gallery/FormatRenderer"
import { type DecorationShape } from "@/lib/stores/decoration-store"
import { DecorationShapeRenderer } from "@/components/decorations/DecorationShapeRenderer"
import { getPatternCSS } from "@/lib/utils"
import { ChartGenerator } from "@/lib/chart_generator"
import { sanitizeHTML } from "@/lib/utils/sanitize"
import { useZoomPan } from "@/lib/hooks/use-zoom-pan"

interface SharedChart {
  chart_type: string
  chart_data: any
  chart_config: any
  created_at: string
  template_structure?: any
  template_content?: any
}

const ZOOM_VALUES = [10, 25, 50, 75, 100, 125, 150, 200, 300, 400, 500]

const hexToRgba = (hex: string, opacity: number): string => {
  if (!hex || typeof hex !== "string") return `rgba(255, 255, 255, ${opacity})`
  if (hex === "transparent") return "transparent"
  if (!hex.startsWith("#")) return hex
  let clean = hex.replace("#", "")
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("")
  }
  if (clean.length !== 6) return hex
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return hex
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

const getBackgroundSize = (fit?: string): string => {
  switch (fit) {
    case "fill":
      return "100% 100%"
    case "contain":
      return "contain"
    case "cover":
      return "cover"
    case "none":
    case "scale-down":
      return "auto"
    default:
      return "cover"
  }
}

export default function SharedChartPage() {
  const params = useParams()
  const shareId = params.id as string

  const [chart, setChart] = useState<SharedChart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dimensionMode, setDimensionMode] = useState<"original" | "responsive" | "manual">("original")
  const [manualWidth, setManualWidth] = useState<number>(800)
  const [manualHeight, setManualHeight] = useState<number>(600)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isExportingImage, setIsExportingImage] = useState(false)

  const [theme, setTheme] = useState<"dark" | "light">("light")
  const [isEmbed, setIsEmbed] = useState<boolean>(false)

  const zoomPan = useZoomPan()
  const {
    zoom,
    panMode,
    isDragging,
    panOffset,
    setZoom,
    setPanMode,
    setPanOffset,
    handleZoomIn: rawZoomIn,
    handleZoomOut: rawZoomOut,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    attachTouchHandlers,
  } = zoomPan

  const mainContainerRef = useRef<HTMLDivElement>(null)
  const canvasWrapperRef = useRef<HTMLDivElement>(null)
  const hasUserZoomedRef = useRef<boolean>(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search)
      setIsEmbed(searchParams.get("embed") === "true" || searchParams.get("embed") === "1")
      const savedTheme = localStorage.getItem("share-page-theme") as "dark" | "light" | null
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme)
      } else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
        setTheme("dark")
      }
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
    localStorage.setItem("share-page-theme", nextTheme)
  }

  const isDark = theme === "dark"

  // Determine rendering modes
  const isFormat = !!chart?.template_structure?.zones
  const isTemplate = !!chart?.template_structure && !isFormat

  // Derive chart mode cleanly from saved config/data without mutating global stores
  const inferredMode = useMemo<"single" | "grouped">(() => {
    if (chart?.chart_config?.mode === "single" || chart?.chart_config?.mode === "grouped") {
      return chart.chart_config.mode
    }
    const datasets = chart?.chart_data?.datasets || []
    if (datasets.length > 1) return "grouped"
    if (datasets[0]?.mode === "single" || datasets[0]?.mode === "grouped") {
      return datasets[0].mode
    }
    if (datasets.some((d: any) => typeof d.groupId === "string")) {
      return "grouped"
    }
    return "single"
  }, [chart])

  const decorations = useMemo<DecorationShape[]>(() => {
    if (!chart) return []
    const raw =
      chart.chart_config?.decorationShapes ||
      chart.chart_config?.decorations ||
      chart.template_structure?.decorations
    return Array.isArray(raw) ? raw : []
  }, [chart])

  const resolvedContentPackage = useMemo(() => {
    if (!isFormat || !chart) return null
    const basePkg = chart.chart_config?.formatData?.contentPackage || chart.template_content || {}
    const contentPkg = { ...basePkg }
    if (chart.chart_data) {
      contentPkg.chartData = chart.chart_data
    }
    if (chart.chart_config) {
      const { formatData, ...cleanConfig } = chart.chart_config
      contentPkg.chartConfig = cleanConfig
    }
    return contentPkg
  }, [isFormat, chart])

  const renderedFormat = useMemo(() => {
    if (!isFormat || !chart || !resolvedContentPackage) return null
    try {
      const blueprint = {
        id: "shared-format",
        name: "Shared Format",
        skeleton: chart.template_structure,
      }
      const ctxImage = chart.chart_config?.formatData?.contextualImageUrl || undefined
      const safeChartType =
        chart.chart_type && chart.chart_type !== "format"
          ? chart.chart_type
          : resolvedContentPackage?.suggestedChartTypes?.[0] || "bar"
      return renderFormat(blueprint as any, resolvedContentPackage, safeChartType, ctxImage)
    } catch (err) {
      console.error("Failed to render shared format", err)
      return null
    }
  }, [isFormat, chart, resolvedContentPackage])

  // Single source of truth for intrinsic chart dimensions across fit, canvas, decorations, and export
  const intrinsicDimensions = useMemo(() => {
    if (!chart) return { width: 800, height: 600 }
    if (isFormat) {
      return {
        width: Math.max(100, parseDimension(chart.template_structure?.dimensions?.width, 800)),
        height: Math.max(100, parseDimension(chart.template_structure?.dimensions?.height, 600)),
      }
    }
    if (isTemplate) {
      return {
        width: Math.max(100, parseDimension(chart.template_structure?.width, 800)),
        height: Math.max(100, parseDimension(chart.template_structure?.height, 600)),
      }
    }
    if (dimensionMode === "manual") {
      return {
        width: Math.max(100, manualWidth || 800),
        height: Math.max(100, manualHeight || 600),
      }
    }
    return {
      width: Math.max(100, parseDimension(chart.chart_config?.width, 800)),
      height: Math.max(100, parseDimension(chart.chart_config?.height, 600)),
    }
  }, [chart, isFormat, isTemplate, dimensionMode, manualWidth, manualHeight])

  // Override dimension flags on configOverride when the viewer switches view modes
  const effectiveChartConfig = useMemo(() => {
    if (!chart?.chart_config) return undefined
    if (isFormat || isTemplate) return chart.chart_config
    const base = { ...chart.chart_config }
    if (dimensionMode === "responsive") {
      return {
        ...base,
        responsive: true,
        manualDimensions: false,
        width: "100%",
        height: "100%",
      }
    }
    return {
      ...base,
      responsive: false,
      manualDimensions: true,
      width: `${intrinsicDimensions.width}px`,
      height: `${intrinsicDimensions.height}px`,
    }
  }, [chart?.chart_config, isFormat, isTemplate, dimensionMode, intrinsicDimensions])

  // Fetch shared chart
  useEffect(() => {
    if (!shareId) return

    const fetchSharedChart = async () => {
      try {
        setLoading(true)
        setError(null)
        hasUserZoomedRef.current = false

        const response = await dataService.getSharedChart(shareId)
        if (response?.error || !response?.data) {
          const errMsg = response?.error || ""
          if (
            response?.status === 404 ||
            errMsg.includes("Shared chart not found") ||
            errMsg.includes("HTTP 404") ||
            errMsg.toLowerCase().includes("not found")
          ) {
            setError("This shared chart is no longer available or has been removed.")
          } else {
            setError(errMsg || "Unable to load this shared chart. Please try again later.")
          }
          setChart(null)
          return
        }

        const fetchedChart: SharedChart = { ...response.data }

        // Fall back to embedded formatSnapshot skeleton if server-side template_structure lacks zones
        if (
          !fetchedChart.template_structure?.zones &&
          fetchedChart.chart_config?.formatData?.formatSnapshot?.skeleton?.zones
        ) {
          fetchedChart.template_structure = fetchedChart.chart_config.formatData.formatSnapshot.skeleton
        }

        setChart(fetchedChart)

        const config = fetchedChart.chart_config
        if (config) {
          setManualWidth(Math.max(100, parseDimension(config.width, 800)))
          setManualHeight(Math.max(100, parseDimension(config.height, 600)))

          if (fetchedChart.template_structure || fetchedChart.chart_type === "format") {
            setDimensionMode("original")
          } else if (
            config.responsive &&
            !config.templateDimensions &&
            !config.originalDimensions &&
            !config.manualDimensions
          ) {
            setDimensionMode("responsive")
          } else {
            setDimensionMode("original")
          }
        }
      } catch (err) {
        console.error("Error loading shared chart:", err)
        setError("Failed to load chart")
      } finally {
        setLoading(false)
      }
    }

    fetchSharedChart()
  }, [shareId])

  const handleFitToScreen = useCallback(() => {
    if (!mainContainerRef.current || !chart || dimensionMode === "responsive") return
    const cw = mainContainerRef.current.clientWidth
    const ch = mainContainerRef.current.clientHeight
    if (cw <= 0 || ch <= 0) return

    // Leave comfortable breathing room around the chart & clear the floating bottom bar
    const isSmallScreen = cw < 640
    const isTabletScreen = cw >= 640 && cw < 1024
    const padX = isEmbed ? (isSmallScreen ? 16 : 32) : isSmallScreen ? 24 : isTabletScreen ? 48 : 72
    const padY = isEmbed ? (isSmallScreen ? 16 : 32) : isSmallScreen ? 92 : isTabletScreen ? 104 : 112

    const availW = Math.max(80, cw - padX)
    const availH = Math.max(80, ch - padY)

    const scaleW = availW / intrinsicDimensions.width
    const scaleH = availH / intrinsicDimensions.height
    const fitScale = Math.max(0.1, Math.min(scaleW, scaleH, 1))

    hasUserZoomedRef.current = false
    setZoom((prev) => (Math.abs(prev - fitScale) < 0.0005 ? prev : fitScale))
    setPanOffset((prev) => (prev.x === 0 && prev.y === 0 ? prev : { x: 0, y: 0 }))
  }, [chart, dimensionMode, intrinsicDimensions, isEmbed, setZoom, setPanOffset])

  // Auto-fit on load, dimension changes, and viewport resize/rotation (until user manually zooms)
  useEffect(() => {
    if (!chart || dimensionMode === "responsive" || !mainContainerRef.current) return
    const el = mainContainerRef.current

    const fitIfAuto = () => {
      if (!hasUserZoomedRef.current) {
        requestAnimationFrame(() => handleFitToScreen())
      }
    }

    fitIfAuto()

    const observer = new ResizeObserver(() => {
      fitIfAuto()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [chart, dimensionMode, intrinsicDimensions, handleFitToScreen])

  // Attach mobile/tablet pinch-to-zoom & single-finger pan
  useEffect(() => {
    const el = mainContainerRef.current
    if (!el || dimensionMode === "responsive") return
    const cleanupTouch = attachTouchHandlers(el)

    const markManualPinch = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        hasUserZoomedRef.current = true
      }
    }
    el.addEventListener("touchstart", markManualPinch, { passive: true })

    return () => {
      cleanupTouch()
      el.removeEventListener("touchstart", markManualPinch)
    }
  }, [attachTouchHandlers, dimensionMode, chart])

  // Desktop Ctrl/Cmd + Wheel zoom
  useEffect(() => {
    const el = mainContainerRef.current
    if (!el || dimensionMode === "responsive") return

    const handleWheel = (e: WheelEvent) => {
      if (!el.contains(e.target as Node)) return
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        e.stopPropagation()
        hasUserZoomedRef.current = true
        const zoomFactor = 1.06
        setZoom((prev) => {
          const next = e.deltaY < 0 ? prev * zoomFactor : prev / zoomFactor
          return Math.min(Math.max(next, 0.1), 5)
        })
      }
    }

    window.addEventListener("wheel", handleWheel, { passive: false })
    return () => window.removeEventListener("wheel", handleWheel)
  }, [dimensionMode, setZoom, chart])

  const handleZoomIn = () => {
    hasUserZoomedRef.current = true
    rawZoomIn()
  }

  const handleZoomOut = () => {
    hasUserZoomedRef.current = true
    rawZoomOut()
  }

  const handleSetExactZoom = (targetZoom: number) => {
    hasUserZoomedRef.current = true
    setZoom(targetZoom)
    setPanOffset({ x: 0, y: 0 })
  }

  const currentZoomPct = Math.round(zoom * 100)
  let closestIndex = 4
  let minDiff = Infinity
  for (let i = 0; i < ZOOM_VALUES.length; i++) {
    const diff = Math.abs(ZOOM_VALUES[i] - currentZoomPct)
    if (diff < minDiff) {
      minDiff = diff
      closestIndex = i
    }
  }

  const handleSliderChange = (value: number[]) => {
    hasUserZoomedRef.current = true
    setZoom(ZOOM_VALUES[value[0]] / 100)
  }

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href
      const titleText =
        chart?.chart_config?.plugins?.title?.text ||
        chart?.chart_config?.options?.plugins?.title?.text ||
        "AIChartor Shared Chart"

      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title: String(titleText),
            url: shareUrl,
          })
          return
        } catch (shareErr: any) {
          if (shareErr?.name === "AbortError") return
        }
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const input = document.createElement("input")
        input.value = shareUrl
        document.body.appendChild(input)
        input.select()
        document.execCommand("copy")
        document.body.removeChild(input)
      }

      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
      toast.success("Link copied!", {
        description: "Public link copied to clipboard.",
      })
    } catch (err) {
      console.error("Failed to share link:", err)
      toast.error("Failed to copy link")
    }
  }

  const handleDownloadImage = async () => {
    if (!chart || isExportingImage) return
    setIsExportingImage(true)

    const canvasReplacements: { canvas: HTMLCanvasElement; img: HTMLImageElement }[] = []
    const imageSrcRestores: { img: HTMLImageElement; origSrc: string }[] = []

    try {
      // Formats & templates: capture the full rendered wrapper DOM with canvas snapshot & CORS image inlining
      if ((isFormat || isTemplate) && canvasWrapperRef.current) {
        toast.loading("Preparing image export...", { id: "share-img-export" })
        const target = canvasWrapperRef.current
        const exportW = intrinsicDimensions.width
        const exportH = intrinsicDimensions.height

        const canvases = Array.from(target.querySelectorAll("canvas"))
        for (const canvas of canvases) {
          try {
            const data = canvas.toDataURL("image/png")
            const img = document.createElement("img")
            img.src = data
            img.className = canvas.className
            img.style.cssText = canvas.style.cssText
            img.style.width = `${canvas.clientWidth || canvas.offsetWidth}px`
            img.style.height = `${canvas.clientHeight || canvas.offsetHeight}px`
            canvas.parentNode?.insertBefore(img, canvas)
            canvas.style.display = "none"
            canvasReplacements.push({ canvas, img })
          } catch (e) {
            console.warn("Failed to snapshot canvas for export:", e)
          }
        }

        const allImages = Array.from(target.querySelectorAll("img")).filter(
          (img) => !canvasReplacements.some((cr) => cr.img === img)
        )
        await Promise.all(
          allImages.map(async (img) => {
            const src = img.src || img.getAttribute("src") || ""
            if (!src || src.startsWith("data:")) return
            try {
              const proxiedUrl = requiresProxy(src) ? getProxiedImageUrl(src) : src
              const response = await fetch(proxiedUrl)
              const blob = await response.blob()
              const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve((reader.result as string) || "")
                reader.onerror = () => resolve("")
                reader.readAsDataURL(blob)
              })
              if (dataUrl) {
                imageSrcRestores.push({ img, origSrc: src })
                img.src = dataUrl
              }
            } catch (e) {
              console.warn("Failed to inline image for export:", src, e)
            }
          })
        )

        if (typeof document !== "undefined" && "fonts" in document) {
          try {
            await Promise.race([
              (document.fonts as any).ready,
              new Promise((resolve) => setTimeout(resolve, 1200)),
            ])
          } catch {}
        }

        const { domToPng } = await import("modern-screenshot")
        const dataUrl = await domToPng(target, {
          scale: 2,
          width: exportW,
          height: exportH,
          style: {
            transform: "none",
            transformOrigin: "top left",
          },
        })

        const link = document.createElement("a")
        link.download = `chart-${chart.chart_type || "export"}-${new Date().toISOString().slice(0, 10)}.png`
        link.href = dataUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("Image downloaded!", { id: "share-img-export" })
        return
      }

      // Plain chart: locate local ChartJS canvas instance
      const canvas = canvasWrapperRef.current?.querySelector("canvas")
      const chartInstance: any = canvas ? ChartJS.getChart(canvas) : null
      if (!chartInstance) {
        toast.error("Chart is not ready for export")
        return
      }

      const bgConfig = getBackgroundConfig(chart?.chart_config)
      if (chartInstance.exportToImage) {
        await chartInstance.exportToImage({
          background: bgConfig,
          fileNamePrefix: `chart-${chart?.chart_type || "export"}`,
          quality: 1.0,
          exportScale: 3,
          width: dimensionMode === "responsive" ? undefined : intrinsicDimensions.width,
          height: dimensionMode === "responsive" ? undefined : intrinsicDimensions.height,
        })
      } else {
        const url = chartInstance.toBase64Image("image/png", 1.0)
        const link = document.createElement("a")
        link.download = `chart-${new Date().toISOString().slice(0, 10)}.png`
        link.href = url
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (err) {
      console.error("Failed to export image:", err)
      toast.error("Failed to export image", { id: "share-img-export" })
    } finally {
      for (const { img, origSrc } of imageSrcRestores) {
        img.src = origSrc
      }
      for (const { canvas, img } of canvasReplacements) {
        canvas.style.display = ""
        if (img && img.parentNode) {
          img.parentNode.removeChild(img)
        }
      }
      setIsExportingImage(false)
    }
  }

  const handleDownloadHTML = async () => {
    if (!chart) return
    try {
      const config = effectiveChartConfig || chart.chart_config
      const baseFileName = `chart-${chart.chart_type}-${new Date().toISOString().slice(0, 10)}`

      if (isFormat && renderedFormat) {
        await downloadFormatExport(renderedFormat, decorations, {
          fileName: baseFileName,
          htmlOptions: {
            chartTypeOverride:
              chart.chart_type && chart.chart_type !== "format"
                ? chart.chart_type
                : renderedFormat.chartType,
            chartDataOverride: chart.chart_data,
            chartConfigOverride: config,
            chartModeOverride: inferredMode,
            contentPackageOverride: resolvedContentPackage,
          },
        })
        toast.success("Interactive HTML downloaded!")
        return
      }

      if (isTemplate && chart.template_structure) {
        const templateForExport = {
          id: "shared-template",
          name: config?.plugins?.title?.text || "Shared Chart",
          description: "",
          ...chart.template_structure,
        }
        await downloadTemplateExport(templateForExport, null, chart.chart_data, config, {
          format: "html",
          fileName: baseFileName,
          htmlOptions: {
            chartTypeOverride: chart.chart_type,
            chartDataOverride: chart.chart_data,
            chartConfigOverride: config,
            chartModeOverride: inferredMode,
            decorationShapesOverride: decorations,
          },
        })
        toast.success("Interactive HTML downloaded!")
        return
      }

      const width = intrinsicDimensions.width
      const height = intrinsicDimensions.height
      const title = config?.plugins?.title?.text || "Chart Export"
      const subtitle = config?.plugins?.subtitle?.display ? config.plugins.subtitle.text : undefined
      const bgConfig = getBackgroundConfig(config)

      const visualSettings = config?.visualSettings || {}
      const showImages = visualSettings.showImages ?? true
      const showLabels = visualSettings.showLabels ?? false
      const fillArea = visualSettings.fillArea ?? true
      const showBorder = visualSettings.showBorder ?? true

      const result = await downloadChartAsHTML({
        title: title as string,
        subtitle: subtitle as string | undefined,
        width,
        height,
        backgroundColor: bgConfig.color || "#ffffff",
        includeResponsive: true,
        includeAnimations: true,
        includeTooltips: true,
        includeLegend: true,
        fileName: `${baseFileName}.html`,
        template: "plain",
        dragState: config?.dragState || {},
        showImages,
        showLabels,
        fillArea,
        showBorder,
        chartTypeOverride: chart.chart_type,
        chartDataOverride: chart.chart_data,
        chartConfigOverride: config,
        chartModeOverride: inferredMode,
        decorationShapesOverride: decorations,
      })

      if (result && !result.success) {
        console.error("Export failed:", result.error)
        toast.error("Failed to download HTML")
      } else {
        toast.success("Interactive HTML downloaded!")
      }
    } catch (err) {
      console.error("Error downloading HTML:", err)
      toast.error("Failed to download HTML")
    }
  }

  // Template background style helper
  const getTemplateBackgroundStyle = (template: any): React.CSSProperties => {
    const bg = template.background
    if (!bg || bg.type === "transparent") {
      return { backgroundColor: template.backgroundColor || "transparent" }
    }
    const opacity = (bg.opacity ?? 100) / 100
    if (bg.type === "color") {
      const color = bg.color || "#ffffff"
      return { backgroundColor: hexToRgba(color, opacity) }
    }
    if (bg.type === "pattern") {
      const patternColor = bg.patternColor || "#e2e8f0"
      const patternType = bg.patternType || "dots"
      const rgbaColor = hexToRgba(patternColor, opacity)
      const { backgroundImage, backgroundSize, backgroundRepeat } = getPatternCSS(patternType, rgbaColor, 1)
      return { backgroundImage, backgroundSize, backgroundRepeat }
    }
    if (bg.type === "gradient") {
      const color1 = bg.gradientColor1 || "#ffffff"
      const color2 = bg.gradientColor2 || "#000000"
      const gradientType = bg.gradientType || "linear"
      const direction = bg.gradientDirection || "to right"
      const rgbaColor1 = hexToRgba(color1, opacity)
      const rgbaColor2 = hexToRgba(color2, opacity)
      if (gradientType === "radial") {
        return { backgroundImage: `radial-gradient(circle, ${rgbaColor1}, ${rgbaColor2})` }
      }
      return { backgroundImage: `linear-gradient(${direction}, ${rgbaColor1}, ${rgbaColor2})` }
    }
    if (bg.type === "image" && bg.imageUrl) {
      const proxiedUrl = getProxiedImageUrl(bg.imageUrl)
      if (opacity < 1) {
        return {
          backgroundImage: `linear-gradient(rgba(255, 255, 255, ${1 - opacity}), rgba(255, 255, 255, ${1 - opacity})), url("${proxiedUrl}")`,
          backgroundSize: getBackgroundSize(bg.imageFit),
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      }
      return {
        backgroundImage: `url("${proxiedUrl}")`,
        backgroundSize: getBackgroundSize(bg.imageFit),
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    }
    return { backgroundColor: template.backgroundColor || "#ffffff" }
  }

  const renderTemplateTextAreas = (template: any) => {
    return (template.textAreas || [])
      .filter((textArea: any) => textArea.visible)
      .map((textArea: any) => {
        let content = textArea.content
        if (!content && chart?.template_content && chart.template_content[textArea.type]) {
          content = chart.template_content[textArea.type]
          if (Array.isArray(content)) {
            content = content[0]
          }
        }

        const isHTML =
          textArea.contentType === "html" ||
          (typeof content === "string" && /<[a-z][\s\S]*>/i.test(content))

        const style: React.CSSProperties = {
          position: "absolute",
          left: textArea.position.x,
          top: textArea.position.y,
          width: textArea.position.width,
          height: textArea.position.height,
          fontSize: `${textArea.style.fontSize}px`,
          fontFamily: textArea.style.fontFamily,
          fontWeight: textArea.style.fontWeight,
          color: textArea.style.color,
          textAlign: textArea.style.textAlign,
          lineHeight: textArea.style.lineHeight,
          letterSpacing: `${textArea.style.letterSpacing}px`,
          wordBreak: "break-word",
          whiteSpace: isHTML ? "normal" : "pre-wrap",
          padding: "8px",
        }

        if (textArea.background && textArea.background.type !== "transparent") {
          const opacity = (textArea.background.opacity ?? 100) / 100
          if (textArea.background.type === "color") {
            style.backgroundColor = hexToRgba(textArea.background.color || "#ffffff", opacity)
          } else if (textArea.background.type === "gradient") {
            const c1 = hexToRgba(textArea.background.gradientColor1 || "#ffffff", opacity)
            const c2 = hexToRgba(textArea.background.gradientColor2 || "#000000", opacity)
            const dir = textArea.background.gradientDirection || "to right"
            style.backgroundImage =
              textArea.background.gradientType === "radial"
                ? `radial-gradient(circle, ${c1}, ${c2})`
                : `linear-gradient(${dir}, ${c1}, ${c2})`
          } else if (textArea.background.type === "image" && textArea.background.imageUrl) {
            const proxiedUrl = getProxiedImageUrl(textArea.background.imageUrl)
            style.backgroundImage =
              opacity < 1
                ? `linear-gradient(rgba(255, 255, 255, ${1 - opacity}), rgba(255, 255, 255, ${1 - opacity})), url("${proxiedUrl}")`
                : `url("${proxiedUrl}")`
            style.backgroundSize = getBackgroundSize(textArea.background.imageFit)
            style.backgroundPosition = "center"
            style.backgroundRepeat = "no-repeat"
          }
        }

        return (
          <div key={textArea.id} style={style} className="template-text-area overflow-hidden">
            {isHTML ? (
              <div
                className="html-content-area"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(content || "") }}
                style={{
                  width: "100%",
                  height: "100%",
                  fontSize: "inherit",
                  fontFamily: "inherit",
                  fontWeight: "inherit",
                  color: "inherit",
                  textAlign: "inherit",
                  lineHeight: "inherit",
                  letterSpacing: "inherit",
                }}
              />
            ) : (
              content
            )}
          </div>
        )
      })
  }

  /* ─────────────── LOADING STATE ─────────────── */
  if (loading) {
    return (
      <div
        className={`h-screen supports-[height:100dvh]:h-[100dvh] flex items-center justify-center font-sans transition-colors ${
          isDark ? "bg-[#09090b] text-zinc-100" : "bg-[#f7f8fa] text-zinc-900"
        }`}
      >
        <div className="flex flex-col items-center gap-3.5 px-6 text-center">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-sm ${
              isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200/80"
            }`}
          >
            <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
          </div>
          <p className={`text-sm font-medium ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            Loading chart…
          </p>
        </div>
      </div>
    )
  }

  /* ─────────────── ERROR / NOT FOUND STATE ─────────────── */
  if (error || !chart) {
    return (
      <div
        className={`min-h-screen supports-[min-height:100dvh]:min-h-[100dvh] flex flex-col font-sans transition-colors ${
          isDark ? "bg-[#09090b] text-zinc-100" : "bg-[#f7f8fa] text-zinc-900"
        }`}
      >
        {!isEmbed && (
          <header
            className={`h-12 sm:h-[52px] border-b flex items-center justify-between px-4 sm:px-6 shrink-0 backdrop-blur-xl ${
              isDark
                ? "bg-zinc-950/80 border-zinc-800/80"
                : "bg-white/80 border-zinc-200/80"
            }`}
          >
            <a href="/" className="flex items-center gap-2">
              <img src="/svg/aichartor-icon-top-rounded.svg" alt="AIChartor" className="w-7 h-7 object-contain" />
              <span className="text-sm font-semibold tracking-tight">AIChartor</span>
            </a>

            <div className="flex items-center gap-2">
              <Button
                onClick={toggleTheme}
                size="icon"
                variant="ghost"
                className={`w-8 h-8 rounded-lg ${
                  isDark
                    ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button
                asChild
                size="sm"
                className="h-8 px-3.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-sm"
              >
                <a href="/editor">Create Chart</a>
              </Button>
            </div>
          </header>
        )}

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 sm:p-8 text-center shadow-sm ${
              isDark
                ? "bg-zinc-900/70 border-zinc-800"
                : "bg-white border-zinc-200/80"
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h1 className="text-lg sm:text-xl font-semibold tracking-tight mb-2">
              Chart Unavailable
            </h1>

            <p className={`text-sm leading-relaxed mb-6 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              {error || "This shared chart has been removed or is no longer public."}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Button
                asChild
                className="w-full sm:w-auto h-9 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold"
              >
                <a href="/editor" className="inline-flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Create Your Own
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className={`w-full sm:w-auto h-9 px-4 rounded-lg text-xs font-semibold ${
                  isDark
                    ? "border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <a href="/">Go Home</a>
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const sizeLabel =
    dimensionMode === "original"
      ? "Original"
      : dimensionMode === "responsive"
      ? "Fill"
      : "Custom"

  const sizeFullLabel =
    dimensionMode === "original"
      ? "Original Size"
      : dimensionMode === "responsive"
      ? "Fill Screen"
      : "Custom Size"

  const isPlainChartTransparent =
    chart?.chart_config?.background?.type === "transparent"

  /* ─────────────── MAIN VIEWPORT ─────────────── */
  return (
    <div
      className={`h-screen supports-[height:100dvh]:h-[100dvh] flex flex-col font-sans overflow-hidden select-none transition-colors duration-200 ${
        isDark ? "bg-[#09090b] text-zinc-100" : "bg-[#f7f8fa] text-zinc-900"
      }`}
    >
      {/* 1. Minimal Glassmorphic Header (hidden in embed mode) */}
      {!isEmbed && (
        <header
          className={`h-12 sm:h-[52px] border-b flex items-center justify-between px-3 sm:px-5 shrink-0 z-30 relative backdrop-blur-xl transition-colors duration-200 ${
            isDark
              ? "bg-zinc-950/80 border-zinc-800/80"
              : "bg-white/80 border-zinc-200/80"
          }`}
        >
          {/* Left: Brand + Size Mode Selector */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <a
              href="/"
              className="flex items-center gap-2 shrink-0 group focus:outline-none"
              title="AIChartor"
            >
              <img src="/svg/aichartor-icon-top-rounded.svg" alt="AIChartor" className="w-7 h-7 object-contain" />
              <span className="text-[13px] sm:text-sm font-semibold tracking-tight">
                AIChartor
              </span>
            </a>

            {!chart.template_structure && (
              <>
                <div
                  className={`w-px h-4 shrink-0 ${
                    isDark ? "bg-zinc-800" : "bg-zinc-200"
                  }`}
                />

                <div className="flex items-center gap-1.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 gap-1.5 px-2 sm:px-2.5 rounded-lg text-xs font-medium transition-colors ${
                          isDark
                            ? "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                        }`}
                        title={`View size: ${sizeFullLabel}`}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 opacity-75 shrink-0" />
                        <span className="hidden xs:inline sm:hidden">{sizeLabel}</span>
                        <span className="hidden sm:inline">{sizeFullLabel}</span>
                        <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className={`w-44 p-1 rounded-xl shadow-xl z-40 ${
                        isDark
                          ? "bg-zinc-900 border-zinc-800 text-zinc-200"
                          : "bg-white border-zinc-200 text-zinc-800"
                      }`}
                    >
                      {(
                        [
                          { id: "original", label: "Original Size" },
                          { id: "responsive", label: "Fill Screen" },
                          { id: "manual", label: "Custom Size" },
                        ] as const
                      ).map((opt) => (
                        <DropdownMenuItem
                          key={opt.id}
                          onClick={() => {
                            hasUserZoomedRef.current = false
                            setDimensionMode(opt.id)
                          }}
                          className={`cursor-pointer rounded-lg text-xs py-2 px-2.5 flex items-center justify-between font-medium ${
                            dimensionMode === opt.id
                              ? isDark
                                ? "bg-zinc-800 text-white"
                                : "bg-zinc-100 text-zinc-950"
                              : isDark
                              ? "hover:bg-zinc-800/60"
                              : "hover:bg-zinc-50"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {dimensionMode === opt.id && (
                            <Check className="w-3.5 h-3.5 text-indigo-500" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Inline Custom Size Inputs on Tablet/Desktop (md+) */}
                  {dimensionMode === "manual" && (
                    <div
                      className={`hidden md:flex items-center rounded-lg px-2 gap-1 border h-8 ${
                        isDark
                          ? "bg-zinc-900 border-zinc-800"
                          : "bg-zinc-50 border-zinc-200"
                      }`}
                    >
                      <Input
                        type="number"
                        min={100}
                        max={4000}
                        value={manualWidth || ""}
                        onChange={(e) => {
                          hasUserZoomedRef.current = false
                          setManualWidth(Math.max(0, parseInt(e.target.value, 10) || 0))
                        }}
                        onBlur={() => setManualWidth((w) => Math.max(100, w || 800))}
                        className="w-12 h-6 text-[11px] bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-center font-medium tabular-nums"
                        aria-label="Width"
                      />
                      <span className="text-[11px] text-zinc-400">×</span>
                      <Input
                        type="number"
                        min={100}
                        max={4000}
                        value={manualHeight || ""}
                        onChange={(e) => {
                          hasUserZoomedRef.current = false
                          setManualHeight(Math.max(0, parseInt(e.target.value, 10) || 0))
                        }}
                        onBlur={() => setManualHeight((h) => Math.max(100, h || 600))}
                        className="w-12 h-6 text-[11px] bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-center font-medium tabular-nums"
                        aria-label="Height"
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right: Theme, Share, Download, Try Now */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <Button
              onClick={toggleTheme}
              size="icon"
              variant="ghost"
              className={`w-8 h-8 rounded-lg transition-colors ${
                isDark
                  ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <Button
              onClick={handleShare}
              size="sm"
              variant="ghost"
              className={`h-8 w-8 sm:w-auto px-0 sm:px-2.5 gap-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDark
                  ? "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
              title="Share link"
              aria-label="Share link"
            >
              {copiedLink ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{copiedLink ? "Copied" : "Share"}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isExportingImage}
                  className={`h-8 w-8 sm:w-auto px-0 sm:px-2.5 gap-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isDark
                      ? "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                  title="Download"
                  aria-label="Download chart"
                >
                  {isExportingImage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className={`w-52 p-1 rounded-xl shadow-xl z-40 ${
                  isDark
                    ? "bg-zinc-900 border-zinc-800 text-zinc-200"
                    : "bg-white border-zinc-200 text-zinc-800"
                }`}
              >
                <DropdownMenuItem
                  onClick={handleDownloadImage}
                  className={`cursor-pointer gap-2.5 py-2 px-2.5 rounded-lg ${
                    isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-md ${
                      isDark ? "bg-indigo-500/15 text-indigo-400" : "bg-indigo-50 text-indigo-600"
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-xs">PNG Image</span>
                    <span className="text-[10px] text-zinc-400">High-resolution export</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDownloadHTML}
                  className={`cursor-pointer gap-2.5 py-2 px-2.5 rounded-lg ${
                    isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-md ${
                      isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-xs">Interactive HTML</span>
                    <span className="text-[10px] text-zinc-400">Tooltips & animations</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              asChild
              size="sm"
              className="h-8 px-2.5 sm:px-3.5 ml-0.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <a href="/editor" className="inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 opacity-90" />
                <span className="sm:hidden">Try</span>
                <span className="hidden sm:inline">Try Now</span>
              </a>
            </Button>
          </div>
        </header>
      )}

      {/* Mobile & Small Tablet Floating Custom Size Bar (< md) */}
      {!isEmbed && !chart.template_structure && dimensionMode === "manual" && (
        <div className="md:hidden fixed top-14 left-1/2 -translate-x-1/2 z-30">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-xl shadow-lg text-xs ${
              isDark
                ? "bg-zinc-900/90 border-zinc-800 text-zinc-200"
                : "bg-white/90 border-zinc-200/90 text-zinc-800"
            }`}
          >
            <span className="text-[11px] font-medium text-zinc-400">Size</span>
            <Input
              type="number"
              min={100}
              max={4000}
              value={manualWidth || ""}
              onChange={(e) => {
                hasUserZoomedRef.current = false
                setManualWidth(Math.max(0, parseInt(e.target.value, 10) || 0))
              }}
              onBlur={() => setManualWidth((w) => Math.max(100, w || 800))}
              className={`w-14 h-6 text-xs bg-transparent border rounded-md focus-visible:ring-1 p-0 text-center font-medium tabular-nums ${
                isDark ? "border-zinc-700" : "border-zinc-300/70"
              }`}
              aria-label="Width"
            />
            <span className="text-zinc-400">×</span>
            <Input
              type="number"
              min={100}
              max={4000}
              value={manualHeight || ""}
              onChange={(e) => {
                hasUserZoomedRef.current = false
                setManualHeight(Math.max(0, parseInt(e.target.value, 10) || 0))
              }}
              onBlur={() => setManualHeight((h) => Math.max(100, h || 600))}
              className={`w-14 h-6 text-xs bg-transparent border rounded-md focus-visible:ring-1 p-0 text-center font-medium tabular-nums ${
                isDark ? "border-zinc-700" : "border-zinc-300/70"
              }`}
              aria-label="Height"
            />
          </div>
        </div>
      )}

      {/* 2. Main Canvas Area */}
      <main
        ref={mainContainerRef}
        onMouseDown={dimensionMode !== "responsive" && panMode ? handleMouseDown : undefined}
        onMouseMove={dimensionMode !== "responsive" && panMode && isDragging ? handleMouseMove : undefined}
        onMouseUp={dimensionMode !== "responsive" && isDragging ? handleMouseUp : undefined}
        className={`flex-1 relative overflow-hidden flex items-center justify-center transition-colors duration-200 ${
          dimensionMode !== "responsive" && panMode
            ? isDragging
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-default"
        }`}
        style={{
          padding:
            dimensionMode === "responsive"
              ? isEmbed
                ? "12px"
                : "12px 12px 24px 12px"
              : undefined,
          touchAction:
            dimensionMode !== "responsive" && panMode ? "none" : "manipulation",
          backgroundImage: isDark
            ? "radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)"
            : "radial-gradient(rgba(15, 23, 42, 0.09) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        <div
          className="relative flex-shrink-0 bg-transparent"
          style={
            dimensionMode === "responsive"
              ? { width: "100%", height: "100%", minHeight: 0 }
              : {
                  width: intrinsicDimensions.width * Math.max(0.1, zoom),
                  height: intrinsicDimensions.height * Math.max(0.1, zoom),
                  transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0px)`,
                  transformOrigin: "center center",
                  willChange: isDragging ? "transform" : undefined,
                }
          }
        >
          {isFormat && renderedFormat ? (
            <div
              ref={canvasWrapperRef}
              className={`relative flex-shrink-0 ${
                dimensionMode !== "responsive"
                  ? isDark
                    ? "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.08] rounded-lg overflow-hidden"
                    : "shadow-[0_12px_40px_-10px_rgba(15,23,42,0.14)] ring-1 ring-zinc-950/[0.06] rounded-lg overflow-hidden"
                  : ""
              }`}
              style={
                dimensionMode !== "responsive"
                  ? {
                      width: intrinsicDimensions.width,
                      height: intrinsicDimensions.height,
                      transform: `scale(${Math.max(0.1, zoom)})`,
                      transformOrigin: "top left",
                      position: "absolute",
                      top: 0,
                      left: 0,
                      backgroundColor: "#ffffff",
                    }
                  : {
                      width: "100%",
                      height: "100%",
                      backgroundColor: "transparent",
                    }
              }
            >
              <FormatRenderer
                rendered={renderedFormat}
                scale={1}
                interactive={false}
                panMode={panMode}
                forceRealChart={true}
                renderLocalCanvas={true}
                isolatedChart={true}
                zoomLevel={zoom}
              />
              {decorations.length > 0 && (
                <DecorationShapeRenderer
                  containerWidth={intrinsicDimensions.width}
                  containerHeight={intrinsicDimensions.height}
                  shapes={decorations}
                  readOnly={true}
                  panMode={panMode}
                  zoom={zoom}
                />
              )}
            </div>
          ) : isTemplate ? (
            <div
              ref={canvasWrapperRef}
              className={`relative origin-[0_0] flex-shrink-0 ${
                dimensionMode !== "responsive"
                  ? isDark
                    ? "bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.08] rounded-lg overflow-hidden"
                    : "bg-white shadow-[0_12px_40px_-10px_rgba(15,23,42,0.14)] ring-1 ring-zinc-950/[0.06] rounded-lg overflow-hidden"
                  : ""
              }`}
              style={
                dimensionMode !== "responsive"
                  ? {
                      width: intrinsicDimensions.width,
                      height: intrinsicDimensions.height,
                      transform: `scale(${Math.max(0.1, zoom)})`,
                      transformOrigin: "top left",
                      position: "absolute",
                      top: 0,
                      left: 0,
                    }
                  : {
                      width: "100%",
                      height: "100%",
                      backgroundColor: "transparent",
                    }
              }
            >
              {/* Main template background layer */}
              {dimensionMode !== "responsive" && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    ...getTemplateBackgroundStyle(chart.template_structure),
                    border: `${chart.template_structure.borderWidth || 0}px solid ${
                      chart.template_structure.borderColor || "transparent"
                    }`,
                  }}
                />
              )}

              {/* Chart Area */}
              {chart.template_structure.chartArea && (
                <div
                  className="absolute template-chart-area"
                  style={{
                    left: chart.template_structure.chartArea.x,
                    top: chart.template_structure.chartArea.y,
                    width: chart.template_structure.chartArea.width,
                    height: chart.template_structure.chartArea.height,
                    border: "none",
                    backgroundColor: "transparent",
                    borderRadius: "4px",
                    pointerEvents: panMode ? "none" : "auto",
                  }}
                >
                  <ChartGenerator
                    isolated
                    isTemplateOrFormat={true}
                    dataOverride={chart.chart_data}
                    configOverride={effectiveChartConfig}
                    typeOverride={chart.chart_type}
                    chartModeOverride={inferredMode}
                    devicePixelRatioMultiplier={Math.max(1, zoom)}
                    responsiveWidth={parseDimension(chart.template_structure.chartArea.width, 400)}
                    responsiveHeight={parseDimension(chart.template_structure.chartArea.height, 300)}
                  />
                </div>
              )}

              {/* Text Areas */}
              {chart.template_structure.textAreas &&
                renderTemplateTextAreas(chart.template_structure)}

              {/* Decorations */}
              {decorations.length > 0 && (
                <DecorationShapeRenderer
                  containerWidth={intrinsicDimensions.width}
                  containerHeight={intrinsicDimensions.height}
                  shapes={decorations}
                  readOnly={true}
                  panMode={panMode}
                  zoom={zoom}
                />
              )}
            </div>
          ) : (
            <div
              ref={canvasWrapperRef}
              className={`relative flex-shrink-0 overflow-hidden ${
                chart?.chart_config?.borderWidth > 0 ? "" : "rounded-xl"
              } ${
                dimensionMode !== "responsive"
                  ? isDark
                    ? "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.08]"
                    : "shadow-[0_12px_40px_-10px_rgba(15,23,42,0.14)] ring-1 ring-zinc-950/[0.06]"
                  : isDark
                  ? "ring-1 ring-white/[0.08] shadow-lg"
                  : "ring-1 ring-zinc-950/[0.06] shadow-sm"
              }`}
              style={
                dimensionMode !== "responsive"
                  ? {
                      width: `${intrinsicDimensions.width}px`,
                      height: `${intrinsicDimensions.height}px`,
                      borderRadius:
                        chart?.chart_config?.borderWidth > 0
                          ? `${chart?.chart_config?.chartBorderRadius || 0}px`
                          : undefined,
                      backgroundColor: isPlainChartTransparent ? "transparent" : "#ffffff",
                      transform: `scale(${Math.max(0.1, zoom)})`,
                      transformOrigin: "top left",
                      position: "absolute",
                      top: 0,
                      left: 0,
                    }
                  : {
                      width: "100%",
                      height: "100%",
                      borderRadius:
                        chart?.chart_config?.borderWidth > 0
                          ? `${chart?.chart_config?.chartBorderRadius || 0}px`
                          : undefined,
                      backgroundColor: isPlainChartTransparent ? "transparent" : "#ffffff",
                    }
              }
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  padding: 0,
                  pointerEvents: panMode ? "none" : "auto",
                }}
              >
                <ChartGenerator
                  isolated
                  dataOverride={chart.chart_data}
                  configOverride={effectiveChartConfig}
                  typeOverride={chart.chart_type}
                  chartModeOverride={inferredMode}
                  devicePixelRatioMultiplier={dimensionMode === "responsive" ? 1 : Math.max(1, zoom)}
                  {...(dimensionMode !== "responsive"
                    ? {
                        responsiveWidth: intrinsicDimensions.width,
                        responsiveHeight: intrinsicDimensions.height,
                      }
                    : {})}
                />
                {decorations.length > 0 && dimensionMode !== "responsive" && (
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
                    <DecorationShapeRenderer
                      containerWidth={intrinsicDimensions.width}
                      containerHeight={intrinsicDimensions.height}
                      shapes={decorations}
                      readOnly={true}
                      panMode={panMode}
                      zoom={zoom}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 3. Subtle Floating Brand Pill (Desktop/Tablet) & Floating Canvas Dock */}
      {!isEmbed && (
        <>
          <a
            href="/"
            className={`hidden lg:inline-flex items-center gap-1.5 fixed bottom-4 left-4 z-30 px-3 py-1.5 rounded-full border backdrop-blur-xl text-[11px] font-medium transition-colors ${
              isDark
                ? "bg-zinc-900/75 border-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                : "bg-white/75 border-zinc-200/80 text-zinc-500 hover:text-zinc-900 shadow-sm"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Powered by AIChartor</span>
            <ArrowUpRight className="w-3 h-3 opacity-60" />
          </a>

          {dimensionMode !== "responsive" && (
            <div
              className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-1.5 py-1 rounded-full border backdrop-blur-xl transition-colors ${
                isDark
                  ? "bg-zinc-900/85 border-zinc-800 text-zinc-200 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                  : "bg-white/85 border-zinc-200/90 text-zinc-700 shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
              }`}
            >
              {/* Select / Interact Mode */}
              <button
                onClick={() => setPanMode(false)}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                  !panMode
                    ? "bg-indigo-600 text-white shadow-sm"
                    : isDark
                    ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
                title="Interact & Tooltips"
                aria-label="Interact mode"
              >
                <MousePointerClick className="w-3.5 h-3.5" />
              </button>

              {/* Hand Pan Mode */}
              <button
                onClick={() => setPanMode(true)}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                  panMode
                    ? "bg-indigo-600 text-white shadow-sm"
                    : isDark
                    ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
                title="Pan Canvas"
                aria-label="Pan mode"
              >
                <Hand className="w-3.5 h-3.5" />
              </button>

              <div className={`w-px h-4 mx-0.5 ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`} />

              {/* Quick Zoom Out */}
              <button
                onClick={handleZoomOut}
                className={`hidden xs:flex w-7 h-7 items-center justify-center rounded-full transition-colors ${
                  isDark
                    ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
                title="Zoom Out"
                aria-label="Zoom out"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              {/* Zoom Percentage Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`h-7 px-2 rounded-full text-xs font-semibold tabular-nums flex items-center gap-1 transition-colors ${
                      isDark
                        ? "text-zinc-200 hover:bg-zinc-800"
                        : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                    title="Zoom options"
                  >
                    <span>{currentZoomPct}%</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  sideOffset={10}
                  className={`w-52 p-1.5 rounded-xl shadow-xl z-40 ${
                    isDark
                      ? "bg-zinc-900 border-zinc-800 text-zinc-200"
                      : "bg-white border-zinc-200 text-zinc-800"
                  }`}
                >
                  <DropdownMenuItem
                    onClick={handleFitToScreen}
                    className={`cursor-pointer font-medium rounded-lg text-xs py-1.5 px-2.5 ${
                      isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"
                    }`}
                  >
                    Fit to Screen
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSetExactZoom(1.0)}
                    className={`cursor-pointer font-medium rounded-lg text-xs py-1.5 px-2.5 ${
                      isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"
                    }`}
                  >
                    100% (Original Size)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSetExactZoom(1.5)}
                    className={`cursor-pointer font-medium rounded-lg text-xs py-1.5 px-2.5 ${
                      isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"
                    }`}
                  >
                    150%
                  </DropdownMenuItem>

                  <DropdownMenuSeparator
                    className={`my-1.5 ${isDark ? "bg-zinc-800" : "bg-zinc-100"}`}
                  />

                  <div className="px-2.5 py-2" onClick={(e) => e.stopPropagation()}>
                    <Slider
                      min={0}
                      max={ZOOM_VALUES.length - 1}
                      step={1}
                      value={[closestIndex]}
                      onValueChange={handleSliderChange}
                      className={`cursor-pointer ${isDark ? "dark" : ""}`}
                    />
                  </div>

                  <DropdownMenuSeparator
                    className={`my-1.5 ${isDark ? "bg-zinc-800" : "bg-zinc-100"}`}
                  />

                  <div className="flex items-center justify-between gap-1 px-1">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleZoomOut()
                      }}
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-lg"
                      title="Zoom Out"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-[11px] font-medium tabular-nums text-zinc-400">
                      {currentZoomPct}%
                    </span>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleZoomIn()
                      }}
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-lg"
                      title="Zoom In"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Quick Zoom In */}
              <button
                onClick={handleZoomIn}
                className={`hidden xs:flex w-7 h-7 items-center justify-center rounded-full transition-colors ${
                  isDark
                    ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
                title="Zoom In"
                aria-label="Zoom in"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <div className={`w-px h-4 mx-0.5 ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`} />

              {/* One-Tap Fit to Screen */}
              <button
                onClick={handleFitToScreen}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                  isDark
                    ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
                title="Fit to Screen"
                aria-label="Fit to screen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
