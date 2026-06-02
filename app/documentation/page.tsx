"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Terminal,
  Code2,
  Share2,
  Database,
  Shield,
  Layout,
  Menu,
  X,
  FileText,
  BarChart,
  Settings,
  AlignEndHorizontal,
  PanelTop,
  Tag,
  Grid,
  SlidersHorizontal,
  Download,
  Component
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import { SimpleDropdown } from "@/components/ui/simple-dropdown"

function BackgroundAndLegendDocs() {
  const [activeSubTab, setActiveSubTab] = useState<"background" | "title" | "legend">("background")

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash === '#title-tab-section') {
        setActiveSubTab('title')
      } else if (hash === '#legend-tab-section') {
        setActiveSubTab('legend')
      } else if (hash === '#background-tab-section') {
        setActiveSubTab('background')
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    handleHashChange() // Initial check
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Dynamic Tab Switchers */}
      <div className="flex bg-slate-100 p-1.5 rounded-lg border border-slate-200/50 w-full max-w-md">
        <button
          onClick={() => {
            setActiveSubTab("background")
            window.location.hash = "background-tab-section"
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
            activeSubTab === "background"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          Background
        </button>
        <button
          onClick={() => {
            setActiveSubTab("title")
            window.location.hash = "title-tab-section"
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
            activeSubTab === "title"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          Title
        </button>
        <button
          onClick={() => {
            setActiveSubTab("legend")
            window.location.hash = "legend-tab-section"
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
            activeSubTab === "legend"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          Legend
        </button>
      </div>

      {/* Tab Contents */}
      {activeSubTab === "background" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <section id="background-tab-section" className="scroll-mt-24">
            <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Background Layer Configurator</h3>
            <p className="leading-7 text-slate-700">
              The **Background** settings panel enables you to structure rich, responsive backdrops using solid color schemes, multi-stop transitions, image backdrops, repeating vector patterns, or complete transparencies.
            </p>
            
            <div className="my-6 border border-slate-200 rounded-xl overflow-hidden shadow-lg bg-slate-50 max-w-sm mx-auto">
              <img 
                src="/docs-background-editor.png" 
                alt="Infographic Background Settings Panel" 
                className="w-full h-auto object-cover" 
              />
              <div className="p-3 bg-indigo-900 text-white text-xs font-mono text-center">
                Real Crop: Background Tab displaying Linear/Radial selectors, Color timelines, and Border radius sliders
              </div>
            </div>
          </section>

          <section className="scroll-mt-24">
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-slate-900">1. Background Type Presets</h3>
            <p className="leading-7 text-slate-700">
              Select your backdrop styling foundation from the dropdown selector:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-700">
              <li><strong>Color:</strong> Apply a solid background fill. Inputs support instant color pickers or hexadecimal code coordinates.</li>
              <li><strong>Gradient:</strong> Set linear directional vectors or radial circular outflows:
                <ul className="list-circle pl-6 space-y-1.5 mt-2 text-xs">
                  <li><em>Gradient Type:</em> Toggle between <strong>Linear</strong> (flow across angles) and <strong>Radial</strong> (outward glow circles).</li>
                  <li><em>Gradient Direction:</em> Lock to directional presets (Left→Right, Right→Left, Top→Bottom, Bottom→Top, Diagonal 135deg).</li>
                  <li><em>Gradient Colors:</em> Specify dual color stops (Color 1 and Color 2) to build transitions.</li>
                </ul>
              </li>
              <li><strong>Image:</strong> Upload local files (PNG, JPG, SVG) or input web URLs to serve as backdrops. Adjust <em>Image Fit</em> (Cover crops, Contain scaling, or Fill stretch), white base underlays, opacity levels, and apply a <strong>Blur filter slider</strong> (0px to 20px) to guarantee text legibility.</li>
              <li><strong>Transparent:</strong> Strips background layers completely, perfect for exporting self-contained HTML cards and vector SVGs to place in pitch decks.</li>
            </ul>
          </section>

          <section className="scroll-mt-24">
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-slate-900">2. Canvas Border Settings</h3>
            <p className="leading-7 text-slate-700">
              Surround your visual workspace with elegant boundaries. The border customizer exposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-700">
              <li><strong>Border Width:</strong> Adjust a slider (0px to 20px) to define frame thickness.</li>
              <li><strong>Border Color:</strong> Select custom outline color picks or enter manual hex variables.</li>
              <li><strong>Border Radius:</strong> Configure rounded container boundaries using a slider (0px to 50px) to create smooth, modern layout frames.</li>
            </ul>
          </section>
        </div>
      )}

      {activeSubTab === "title" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <section id="title-tab-section" className="scroll-mt-24">
            <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Chart Title & Subtitle Customizer</h3>
            <p className="leading-7 text-slate-700">
              The **Title** settings tab equips you with comprehensive typographic parameters to write branded, descriptive headers and sub-captions for publication layouts.
            </p>
          </section>

          <section className="scroll-mt-24">
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-slate-900">1. Global Title Block</h3>
            <p className="leading-7 text-slate-700">
              Toggle the Title switch to add your primary heading:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-700">
              <li><strong>Title Text:</strong> Type standard text headers directly.</li>
              <li><strong>Font Families:</strong> Select typefaces (Arial, Helvetica, Times New Roman, Courier New, Georgia, Verdana, Impact, Comic Sans MS).</li>
              <li><strong>Font Weights:</strong> Choose weights (Light 400, Normal 700, Bold 800).</li>
              <li><strong>Sizing & Color:</strong> Specify precise Font Size (px) and color palettes (using standard pickers or hex inputs).</li>
              <li><strong>Alignment & Position:</strong> Position titles on the **Top** or **Bottom** of the canvas, aligning text Left, Center, or Right.</li>
              <li><strong>Padding Offsets:</strong> Increase margins using a slider (0px to 50px) to separate the title from axes grids.</li>
            </ul>
          </section>

          <section className="scroll-mt-24">
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-slate-900">2. Secondary Subtitle Block</h3>
            <p className="leading-7 text-slate-700">
              Need secondary context? Toggle the Subtitle switch to display a sub-caption directly below the main heading. Subtitle blocks inherit independent text inputs, separate sizes, weights, and color tokens, allowing you to format visual summaries cleanly.
            </p>
          </section>
        </div>
      )}

      {activeSubTab === "legend" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <section id="legend-tab-section" className="scroll-mt-24">
            <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Legend Layouts & Positions</h3>
            <p className="leading-7 text-slate-700">
              The **Legend** settings panel provides control over data keys, layout distributions, symbol markers, and spacing configurations to help users interpret your multi-series visual charts.
            </p>
          </section>

          <section className="scroll-mt-24">
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-slate-900">1. Core Legend Mapping</h3>
            <p className="leading-7 text-slate-700">
              Toggle the global legend display. Once active, customize:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-700">
              <li><strong>Legend Type:</strong> Display keys for **Slices Only** (pie segments), **Datasets Only** (grouped bar series), **Both**, or specialized **Waterfall Legends** (to customize specific Increase, Decrease, and Total labels).</li>
              <li><strong>Positions & Alignments:</strong> Dock the legend to the **Top**, **Bottom**, **Left**, **Right**, or place it directly in the **Chart Area** overlay. Align keys to the Start, Center, or End.</li>
              <li><strong>Orientation:</strong> Distribute keys **Horizontally** (row flow) or **Vertically** (column stack).</li>
            </ul>
          </section>

          <section className="scroll-mt-24">
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-slate-900">2. Symbol Styles & Typography</h3>
            <p className="leading-7 text-slate-700">
              Customize keys using individual styling:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-700">
              <li><strong>Point Style Symbols:</strong> Swap standard legend boxes for specialized point markers (Rectangle, Circle, Cross, Star, Triangle, Dash, Line, Rounded Rect, Diamond).</li>
              <li><strong>Symbol Sizing:</strong> Sliders to adjust Box Width (10px to 100px) and Box Height (5px to 50px) to balance symbol grids.</li>
              <li><strong>Fonts Customizer:</strong> Set unique size variables, hex color, family typefaces, and normal/bold weights.</li>
            </ul>
          </section>

          <section className="scroll-mt-24">
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-slate-900">3. Spacing & Advanced Layouts</h3>
            <p className="leading-7 text-slate-700">
              For complex multi-series lists, fine-tune alignment parameters:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-700">
              <li><strong>Item Padding:</strong> Spacing slider (0px to 50px) between legend keys to prevent text overlapping.</li>
              <li><strong>Max Columns:</strong> Specify column limits (1 to 10) to format keys into grids.</li>
              <li><strong>Logical Swaps:</strong>
                <ul className="list-circle pl-6 space-y-1.5 mt-2 text-xs">
                  <li><em>Reverse Order:</em> Reverses the list sequence of series keys.</li>
                  <li><em>RTL Icon Swap:</em> Places legend symbols to the right of text labels.</li>
                  <li><em>Text Direction:</em> Choose Left-to-Right (LTR) or Right-to-Left (RTL) text flows.</li>
                </ul>
              </li>
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}

function StylingAndLabelsDocs() {
  const [activeSubTab, setActiveSubTab] = useState<"presets" | "js" | "conditional" | "sorting">("presets")

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash === '#js-formatters') {
        setActiveSubTab('js')
      } else if (hash === '#conditional-styling') {
        setActiveSubTab('conditional')
      } else if (hash === '#sorting-thresholds') {
        setActiveSubTab('sorting')
      } else if (hash === '#numerical-presets') {
        setActiveSubTab('presets')
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    handleHashChange()
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sub-navigation Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-lg border border-slate-200/50 w-full max-w-xl">
        <button
          onClick={() => {
            setActiveSubTab("presets")
            window.location.hash = "numerical-presets"
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all \${
            activeSubTab === "presets"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          Format Presets
        </button>
        <button
          onClick={() => {
            setActiveSubTab("js")
            window.location.hash = "js-formatters"
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all \${
            activeSubTab === "js"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          JS Formatters
        </button>
        <button
          onClick={() => {
            setActiveSubTab("conditional")
            window.location.hash = "conditional-styling"
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all \${
            activeSubTab === "conditional"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          Conditional Styling
        </button>
        <button
          onClick={() => {
            setActiveSubTab("sorting")
            window.location.hash = "sorting-thresholds"
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all \${
            activeSubTab === "sorting"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          Sorting & Slices
        </button>
      </div>

      {/* Tab Contents */}
      {activeSubTab === "presets" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <section id="numerical-presets" className="scroll-mt-24">
            <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Numerical Formatting Presets</h3>
            <p className="leading-7 text-slate-700">
              Powered by the integrated <code>customLabelPlugin</code>, the editor features a powerful label formatting engine that allows you to instantly scale axis numbers, tooltips, and data labels:
            </p>
            <ul className="list-disc pl-6 space-y-2.5 mt-3 text-slate-700">
              <li><strong>Precision Decimal Locks:</strong> Explicitly force a specific decimal scale (e.g. <code>2</code> decimals for currency) or select <em>Auto</em> to let the engine render proportional decimals matching the data magnitude.</li>
              <li><strong>Regional Separators:</strong> Swap decimal and thousands markers to support localized notation (e.g., standard US <code>1,250.50</code> vs. European <code>1.250,50</code>).</li>
              <li><strong>Format Classification:</strong> Instant toggles for:
                <ul className="list-circle pl-6 space-y-1 mt-1 text-slate-650 text-xs">
                  <li><em>Currencies:</em> Prepend customizable symbol marks (<code>$</code>, <code>€</code>, <code>£</code>, <code>¥</code>).</li>
                  <li><em>Percentages:</em> Automatically multiply ratios by 100 and append <code>%</code> tags.</li>
                  <li><em>Compact Notation:</em> Auto-scale millions, billions, or thousands with clean letter abbreviations (e.g. <code>1,250,000</code> turns to <code>1.25M</code>).</li>
                </ul>
              </li>
            </ul>

            <div className="my-6 border border-slate-200 rounded-xl overflow-hidden shadow-md bg-slate-50">
              <img 
                src="/docs-styling-labels.png" 
                alt="Data Labels and Axis Styling Panel" 
                className="w-full h-auto object-cover max-h-[380px]" 
              />
              <div className="p-3 bg-slate-900 text-white text-xs font-mono text-center">
                Real Screenshot: Styling & Labels Panel exposing Show Data Labels, Position offsets, and typography configurations
              </div>
            </div>

            <div className="mt-8">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-550 mb-3">Preset Formatting Reference</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="p-3 text-left font-semibold">Format Class</th>
                      <th className="p-3 text-left font-semibold">Raw Input</th>
                      <th className="p-3 text-left font-semibold">Settings Configuration</th>
                      <th className="p-3 text-left font-semibold">Rendered Output</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-650 bg-white">
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Currency</td>
                      <td className="p-3 font-mono">14500.5</td>
                      <td className="p-3">Decimals: <code>2</code>, Symbol: <code>$</code>, Sep: <code>US</code></td>
                      <td className="p-3 font-mono text-indigo-650 font-bold">$14,500.50</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Percentage</td>
                      <td className="p-3 font-mono">0.842</td>
                      <td className="p-3">Decimals: <code>1</code>, Suffix: <code>%</code></td>
                      <td className="p-3 font-mono text-indigo-650 font-bold">84.2%</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Compact scale</td>
                      <td className="p-3 font-mono">2700000</td>
                      <td className="p-3">Decimals: <code>1</code>, Mode: <code>Compact</code></td>
                      <td className="p-3 font-mono text-indigo-650 font-bold">2.7M</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Localized EU</td>
                      <td className="p-3 font-mono">9800.75</td>
                      <td className="p-3">Decimals: <code>2</code>, Sep: <code>EU (. ,)</code></td>
                      <td className="p-3 font-mono text-indigo-650 font-bold">9.800,75</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeSubTab === "js" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <section id="js-formatters" className="scroll-mt-24">
            <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Custom JS Formatter Strings</h3>
            <p className="leading-7 text-slate-700">
              When standard presets are insufficient, write lightweight, sandbox-compiled javascript statements directly in the formatter input boxes. The system executes this code client-side inside safe contextual limits:
            </p>
            
            <div className="bg-slate-950 text-slate-100 p-6 rounded-xl font-mono text-sm relative overflow-hidden shadow-md border border-slate-800 my-6">
              <div className="absolute top-3 right-3 text-2xs text-indigo-400 uppercase tracking-widest font-bold">Live Execution Context</div>
              <div className="space-y-2">
                <p className="text-indigo-300">// Variables available in scope:</p>
                <p><strong>value</strong>: <span className="text-amber-400">number</span> <span className="text-slate-400">// The numerical coordinate value</span></p>
                <p><strong>index</strong>: <span className="text-amber-400">number</span> <span className="text-slate-400">// The coordinate data index</span></p>
                <p><strong>label</strong>: <span className="text-amber-400">string</span> <span className="text-slate-400">// The label corresponding to this value</span></p>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-550">Practical JS Code Recipes</h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">1. Delta Growth Direction Arrow</h5>
                    <p className="text-xs text-slate-650 mb-3 leading-relaxed">Prepends a directional indicator triangle depending on whether growth metrics are positive or negative.</p>
                  </div>
                  <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-[11px] font-mono overflow-x-auto leading-normal">
{"const delta = value > 0 ? \"▲ +\" : \"▼ \";\nreturn delta + value.toFixed(1) + \"%\";"}
                  </pre>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">2. Dual Units Converter</h5>
                    <p className="text-xs text-slate-650 mb-3 leading-relaxed">Presents coordinate metrics in secondary units (e.g. converting Liters to Gallons side-by-side).</p>
                  </div>
                  <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-[11px] font-mono overflow-x-auto leading-normal">
{"const gallons = (value * 0.264).toFixed(0);\nreturn value + \"L (\" + gallons + \" gal)\";"}
                  </pre>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">3. Metric Milliseconds Clock</h5>
                    <p className="text-xs text-slate-650 mb-3 leading-relaxed">Converts raw duration timestamps into standardized minutes and seconds format.</p>
                  </div>
                  <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-[11px] font-mono overflow-x-auto leading-normal">
{"const min = Math.floor(value / 60);\nconst sec = Math.round(value % 60);\nreturn min + \"m \" + (sec < 10 ? \"0\" : \"\") + sec + \"s\";"}
                  </pre>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h5 className="font-semibold text-slate-900 mb-2">4. Scientific Ratio Abbreviation</h5>
                    <p className="text-xs text-slate-650 mb-3 leading-relaxed">Shortens massive metric counts with scientific powers of ten representation.</p>
                  </div>
                  <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-[11px] font-mono overflow-x-auto leading-normal">
{"if (value === 0) return \"0\";\nconst exponent = Math.floor(Math.log10(value));\nreturn (value / Math.pow(10, exponent)).toFixed(2) + \"e\" + exponent;"}
                  </pre>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeSubTab === "conditional" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <section id="conditional-styling" className="scroll-mt-24">
            <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Conditional Color Styling Rules</h3>
            <p className="leading-7 text-slate-700">
              Transform static charts into responsive risk maps by creating logical rules that trigger styling updates on specific value ranges. Highlight safety margins, negative quotas, or extreme spikes instantly:
            </p>
            
            <ul className="list-disc pl-6 space-y-3 mt-3 text-slate-700">
              <li><strong>Target Fields:</strong> Choose to evaluate conditions against the *Value* itself, the coordinate *Index*, or matches on the text *Label*.</li>
              <li><strong>Logical Operators:</strong> Define boundaries with standard matching logic:
                <ul className="list-circle pl-6 space-y-1.5 mt-1.5 text-xs text-slate-650">
                  <li><code>Greater Than (&gt;)</code> or <code>Greater/Equal (&ge;)</code></li>
                  <li><code>Less Than (&lt;)</code> or <code>Less/Equal (&le;)</code></li>
                  <li><code>Equal To (=)</code> or <code>Not Equal To (&ne;)</code></li>
                  <li><code>Contains</code> (for matching specific string subtitles)</li>
                </ul>
              </li>
              <li><strong>Color Action Blocks:</strong> Apply drop-in CSS configurations when a rule matches:
                <ul className="list-circle pl-6 space-y-1.5 mt-1.5 text-xs text-slate-650">
                  <li><em>Text Fill:</em> Alters the data labels' typography colors.</li>
                  <li><em>Background Base:</em> Adjusts the backdrop capsule fill surrounding the labels.</li>
                  <li><em>Border Outlines:</em> Places custom highlighted lines around matching labels to emphasize milestones.</li>
                </ul>
              </li>
            </ul>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl leading-relaxed text-slate-750 text-sm flex gap-3 items-start">
              <span className="text-amber-500 shrink-0 font-bold">💡 Design Tip:</span>
              <p>
                Keep contrast ratios high when applying background colors. Use a semi-transparent underlay (e.g. <code>rgba(220,38,38,0.1)</code>) coupled with a solid dark red text parameter to preserve legibility without blocking behind canvas lines.
              </p>
            </div>
          </section>
        </div>
      )}

      {activeSubTab === "sorting" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <section id="sorting-thresholds" className="scroll-mt-24">
            <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Quick Slices Sorting & Thresholds</h3>
            <p className="leading-7 text-slate-700">
              Clean up visual clutter in pie, doughnut, polar, or bar layouts. Reorder columns or filter out insignificant data points to ensure visual focus:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 my-6">
              <div className="p-5 border border-slate-200 rounded-xl bg-white space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
                  Sorting Directives
                </h4>
                <p className="text-xs text-slate-650 leading-relaxed">
                  Avoid pre-sorting your Excel sheets. The editor lets you reorganise the data array directly on the fly:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-2xs text-slate-550 leading-relaxed">
                  <li><strong>Alphabetical (A-Z / Z-A):</strong> Groups categorical variables cleanly in text sequence.</li>
                  <li><strong>Value (Ascending / Descending):</strong> Ranks slices by magnitude. Perfect for showcasing Top 5 lists or descending market share.</li>
                </ul>
              </div>

              <div className="p-5 border border-slate-200 rounded-xl bg-white space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-indigo-500" />
                  Threshold Limiter Cutoffs
                </h4>
                <p className="text-xs text-slate-650 leading-relaxed">
                  Charts with 20 tiny slices are impossible to read. The threshold engine solves this elegantly:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-2xs text-slate-550 leading-relaxed">
                  <li><strong>Percent Threshold Slider:</strong> Set a percentage limit (e.g. <code>4%</code>).</li>
                  <li><strong>Auto-Collapsing:</strong> Slices contributing less than the threshold limit are stripped and summed together.</li>
                  <li><strong>"Other" Capsule:</strong> Re-renders the collapsed elements under a single unified "Other" tag automatically, restoring clarity.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function AxesSettingsDocs() {
  const [activeSubTab, setActiveSubTab] = useState<"cartesian" | "radial" | "circular">("cartesian")

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash === '#axes-ticks' || hash === '#axes-cartesian') {
        setActiveSubTab('cartesian')
      } else if (hash === '#axes-radial') {
        setActiveSubTab('radial')
      } else if (hash === '#axes-circular') {
        setActiveSubTab('circular')
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    handleHashChange()
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sub-navigation Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-lg border border-slate-200/50 w-full max-w-xl">
        <button
          onClick={() => {
            setActiveSubTab("cartesian")
            window.location.hash = "axes-cartesian"
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all \${
            activeSubTab === "cartesian"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          Cartesian (X/Y)
        </button>
        <button
          onClick={() => {
            setActiveSubTab("radial")
            window.location.hash = "axes-radial"
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all \${
            activeSubTab === "radial"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          Radial Axes
        </button>
        <button
          onClick={() => {
            setActiveSubTab("circular")
            window.location.hash = "axes-circular"
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all \${
            activeSubTab === "circular"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          Circular Layout
        </button>
      </div>

      {/* Tab Contents */}
      {activeSubTab === "cartesian" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <section id="axes-cartesian" className="scroll-mt-24">
            <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Cartesian X/Y Axes</h3>
            <p className="leading-7 text-slate-700">
              For Cartesian charts (such as **Bar, Line, Area, Scatter, and Bubble**), the editor provides independent controls for both the X-axis and Y-axis scale elements:
            </p>
            <ul className="list-disc pl-6 space-y-2.5 mt-3 text-slate-700">
              <li><strong>Scale Visibility & Titles:</strong> Independently toggle X or Y axes on the canvas. Add custom scale labels, configure margins, weights, and color values.</li>
              <li><strong>Grid Lines Styling:</strong> Customize backing grid meshes. Select solid, dashed, or dotted arrays, control color opacities, and change line thickness parameters.</li>
              <li><strong>Ticks Spacing & Spacing Interval:</strong> Rotate tick values (0°, 45°, 90°) to prevent coordinate label overlaps on long categories. Hardcode custom min/max range boundaries to restrict blank chart areas.</li>
            </ul>

            <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden shadow-md bg-slate-50">
              <div className="p-4 bg-slate-950 text-white text-xs font-mono">
                <span className="text-indigo-400 font-bold">// TS Config mapping example (Cartesian)</span>
                <pre className="mt-2 text-emerald-400">
{"scales: {\n  x: {\n    grid: { color: \"rgba(0,0,0,0.05)\", borderDash: [5, 5] },\n    ticks: { maxRotation: 45, minRotation: 0 }\n  },\n  y: {\n    min: 0,\n    max: 100,\n    title: { display: true, text: \"Revenue ($)\" }\n  }\n}"}
                </pre>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeSubTab === "radial" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <section id="axes-radial" className="scroll-mt-24">
            <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Radial Scale Axes (Radar & Polar Area)</h3>
            <p className="leading-7 text-slate-700">
              Radial charts use coordinate vertices mapped in angular concentric paths instead of classic horizontal/vertical lines. In **Radar and Polar Area** designs, the "Axes" panel exposes deep radial configurations:
            </p>
            <ul className="list-disc pl-6 space-y-2.5 mt-3 text-slate-700">
              <li><strong>Polygonal Grids:</strong> Choose between traditional *Circular concentric circles* or *Polygonal grids* that create sharp angular panels reflecting radar nodes.</li>
              <li><strong>Concentric Grid Color & Dashes:</strong> Style the web outlines. Adjust stroke widths, dash separations, and color opacities.</li>
              <li><strong>Point Labels & Typography:</strong> Customize the labels that sit at the outer tips of the radar vertices. Set margins, typography weights, font scales, and background capsules.</li>
              <li><strong>Scale Constraints:</strong> Set absolute boundaries for radial scores (e.g. mapping evaluation scores strictly between 0 and 100).</li>
            </ul>

            <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden shadow-md bg-slate-50">
              <div className="p-4 bg-slate-950 text-white text-xs font-mono">
                <span className="text-indigo-400 font-bold">// TS Config mapping example (Radial)</span>
                <pre className="mt-2 text-emerald-400">
{"scales: {\n  r: {\n    grid: { circular: false, color: \"rgba(99, 102, 241, 0.15)\" },\n    pointLabels: { font: { size: 12, weight: \"bold\" }, color: \"#1e293b\" },\n    angleLines: { display: true, color: \"rgba(0, 0, 0, 0.08)\" },\n    suggestedMin: 0,\n    suggestedMax: 100\n  }\n}"}
                </pre>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeSubTab === "circular" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <section id="axes-circular" className="scroll-mt-24">
            <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Circular Geometry Layouts (Pie, Doughnut, Gauge)</h3>
            <p className="leading-7 text-slate-700">
              Circular charts (such as **Pie, Doughnut, and Dial Gauges**) have no Cartesian grid or radial lines. In their case, coordinate dimensions are controlled by circle arc geometry properties. The "Axes" settings are replaced by corresponding geometry fields:
            </p>
            <ul className="list-disc pl-6 space-y-2.5 mt-3 text-slate-700">
              <li><strong>Inner Cutout Radius (Doughnut):</strong> Specify the core hollow cutout value (0% for full Pie charts, up to 90% for thin Doughnuts).</li>
              <li><strong>Start Angle Offset:</strong> Rotate the slice distribution. Rotate the starting boundary from the standard 12 o'clock position (e.g., set to <code>-90°</code> or <code>180°</code>) to align segments logically.</li>
              <li><strong>Arc Circumference limits:</strong> Restrict the maximum arc scope (standard <code>360°</code> for round wheels, or <code>180°</code> for semi-circle speedometer dial shapes).</li>
              <li><strong>Slice Spacing & Borders:</strong> Control visual breathing room. Expand arc border widths (0px to 10px) and apply solid separator colors to pull slices apart.</li>
            </ul>

            <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden shadow-md bg-slate-50">
              <div className="p-4 bg-slate-950 text-white text-xs font-mono">
                <span className="text-indigo-400 font-bold">// TS Config mapping example (Circular Geometry)</span>
                <pre className="mt-2 text-emerald-400">
{"options: {\n  cutout: \"65%\", // Doughnut hollow core\n  rotation: -90, // Start drawing at the top center\n  circumference: 180, // Render a perfect semi-circle gauge\n  borderWidth: 3,\n  borderColor: \"#ffffff\" // Clean white segment separators\n}"}
                </pre>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function DecorationsSettingsDocs() {
  const [activeSubTab, setActiveSubTab] = useState<"shapes" | "branding" | "positioning" | "layers">("shapes")

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash === '#shape-layers' || hash === '#decorations-shapes') {
        setActiveSubTab('shapes')
      } else if (hash === '#decorations-branding') {
        setActiveSubTab('branding')
      } else if (hash === '#position-handles' || hash === '#decorations-positioning') {
        setActiveSubTab('positioning')
      } else if (hash === '#depth-layering' || hash === '#decorations-layers') {
        setActiveSubTab('layers')
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    handleHashChange()
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sub-navigation Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-lg border border-slate-200/50 w-full max-w-xl">
        <button
          onClick={() => {
            setActiveSubTab("shapes")
            window.location.hash = "decorations-shapes"
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all \${
            activeSubTab === "shapes"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          Vector Shapes
        </button>
        <button
          onClick={() => {
            setActiveSubTab("branding")
            window.location.hash = "decorations-branding"
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all \${
            activeSubTab === "branding"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          Branding & SVGs
        </button>
        <button
          onClick={() => {
            setActiveSubTab("positioning")
            window.location.hash = "decorations-positioning"
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all \${
            activeSubTab === "positioning"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          Resizing & Position
        </button>
        <button
          onClick={() => {
            setActiveSubTab("layers")
            window.location.hash = "decorations-layers"
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all \${
            activeSubTab === "layers"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20"
              : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          Styling Layers
        </button>
      </div>

      {/* Tab Contents */}
      {activeSubTab === "shapes" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <section id="decorations-shapes" className="scroll-mt-24">
            <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Vector Shapes Overlay</h3>
            <p className="leading-7 text-slate-700">
              The **Decorations Engine** is a full graphic design canvas overlay that allows you to draw vector objects directly on top of active charts. Circular targets can pinpoint data outliers, while rectangular shading zones can divide chart categories:
            </p>

            <div className="grid md:grid-cols-2 gap-6 my-6">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <img 
                  src="/docs-overlay-select.jpg" 
                  alt="Selecting decoration shapes" 
                  className="w-full h-auto object-cover max-h-[220px]" 
                />
                <div className="p-2.5 bg-slate-900 text-white text-2xs font-mono text-center">
                  Real Application: Selecting Rectangles to Group Axes Categories
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <img 
                  src="/docs-overlay-add-text.png" 
                  alt="Adding text annotation overlays" 
                  className="w-full h-auto object-cover max-h-[220px]" 
                />
                <div className="p-2.5 bg-slate-900 text-white text-2xs font-mono text-center">
                  Real Application: Placing Annotation Overlays & Horizontal Markers
                </div>
              </div>
            </div>

            <ul className="list-disc pl-6 space-y-2.5 mt-3 text-slate-700">
              <li><strong>Basic Geometries:</strong> Overlay basic rectangles, circles, stars, hexagons, and custom polygons with zero pixel distortion.</li>
              <li><strong>Marker Threshold Guidelines:</strong> Draw single-point linear arrows or reference bounds to mark targets.</li>
              <li><strong>Annotation Callouts:</strong> Customize typography parameters, font families, line heights, and margins to draw explanatory texts.</li>
            </ul>
          </section>
        </div>
      )}

      {activeSubTab === "branding" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <section id="decorations-branding" className="scroll-mt-24">
            <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Branding, Logos & Custom SVGs</h3>
            <p className="leading-7 text-slate-700">
              Make charts publication-ready. Overlay institutional logos, dynamic SVGs, or custom graphic media blocks onto your visual reports:
            </p>

            <div className="my-6 border border-slate-200 rounded-xl overflow-hidden shadow-md bg-slate-50 max-w-lg mx-auto">
              <img 
                src="/docs-overlay-add-image.png" 
                alt="Adding branding logo image overlays" 
                className="w-full h-auto object-cover max-h-[300px]" 
              />
              <div className="p-3 bg-slate-900 text-white text-xs font-mono text-center">
                Real Application: Uploading SVG Branding Logos and custom chart imagery
              </div>
            </div>

            <ul className="list-disc pl-6 space-y-2.5 mt-3 text-slate-700">
              <li><strong>Institutional Branding:</strong> Upload vector SVG files or local image files (PNG, JPG) and position them in margins as copyright signatures.</li>
              <li><strong>Image Fit Rules:</strong> Adjust container alignment scales (Cover scale, Contain stretch, or Center crop) to align logo marks.</li>
              <li><strong>SVG Filters:</strong> Control SVG base colors, adjust stroke outlines, and lock ratios.</li>
            </ul>
          </section>
        </div>
      )}

      {activeSubTab === "positioning" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <section id="decorations-positioning" className="scroll-mt-24">
            <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Precise Resizing & Position Handles</h3>
            <p className="leading-7 text-slate-700">
              Visual components are fully synchronized. Click on any vector element to launch drag handles that allow pixel-perfect adjustments:
            </p>

            <div className="grid md:grid-cols-2 gap-6 my-6">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <img 
                  src="/docs-overlay-drag.jpg" 
                  alt="Dragging visual asset shapes" 
                  className="w-full h-auto object-cover max-h-[220px]" 
                />
                <div className="p-2.5 bg-slate-900 text-white text-2xs font-mono text-center">
                  Real Application: Arranging Layer Positions on Canvas
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <img 
                  src="/docs-overlay-resize.jpg" 
                  alt="Resizing visual asset bounds" 
                  className="w-full h-auto object-cover max-h-[220px]" 
                />
                <div className="p-2.5 bg-slate-900 text-white text-2xs font-mono text-center">
                  Real Application: Adjusting Layout Dimensions via Corner Resize Handles
                </div>
              </div>
            </div>

            <ul className="list-disc pl-6 space-y-2.5 mt-3 text-slate-700">
              <li><strong>Direct Canvas Dragging:</strong> Left-click and slide any element across the canvas for rapid positioning.</li>
              <li><strong>Responsive Bound Resize Handles:</strong> Grab any of the eight visual perimeter points to scale coordinates cleanly. Hold <code>Shift</code> to preserve locked shape dimensions.</li>
              <li><strong>Exact Position Panel:</strong> Key numerical coordinate values (X, Y, Width, and Height) in the right sidebar for pixel-level mathematical alignment.</li>
            </ul>
          </section>
        </div>
      )}

      {activeSubTab === "layers" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <section id="decorations-layers" className="scroll-mt-24">
            <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Styling, Shadows & Depth Layering</h3>
            <p className="leading-7 text-slate-700">
              Overlay shapes feature professional, independent styling controls. Format elements into rich design layouts:
            </p>
            <ul className="list-disc pl-6 space-y-2.5 mt-3 text-slate-700">
              <li><strong>Fill Colors & Stroked Outlines:</strong> Select solid colors or gradients, adjust transparency opacities, and choose border weights or dash paths.</li>
              <li><strong>Blur Filters & Glow Shadows:</strong> Add dropshadow offsets (X and Y parameters), control blur radius indices, and set drop shadow colors to make layers lift from behind.</li>
              <li><strong>Z-Index Depth Layering:</strong> Push visual indicators backwards behind chart grids to serve as background zones, or pull them forward to serve as focal overlays.</li>
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}

// Fully detailed content data for each section categorized under AI Chat or Editor
// Covers 100% of the graphic design and visualization workspace tools.
const guideData = [
  // =============================================
  // AI CHAT CATEGORY TOPICS
  // =============================================
  {
    id: "getting-started",
    category: "ai-chat",
    title: "Getting Started",
    icon: Sparkles,
    description: "Learn the core concepts of AIChartor and navigate the AI conversational workspace.",
    headers: [
      { id: "platform-mission", text: "Platform Mission & Concept" },
      { id: "dual-engine", text: "The Dual-Engine Workflow" },
      { id: "workspace-navigation", text: "AI Launchpad Portal" }
    ],
    content: (
      <div className="space-y-8">
        <section id="platform-mission" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Platform Mission & Concept</h3>
          <p className="leading-7 text-slate-700">
            AIChartor is a next-generation data visualization platform designed to reconcile the speed of generative draft pipelines with the pixel-level manual visual editing controls demanded by professional publishers.
            Instead of forcing users to build charts from cell inputs or deal with rigid generative engines that output static, non-editable images, AIChartor provides an interactive workspace where conversational concepts instantly transition into fully editable designs.
          </p>
          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 text-sm leading-relaxed">
            <strong>The Core Goal:</strong> Empower designers, marketers, and analysts to bootstrap fully structured, rich infographics in seconds using simple text inputs, and then visually customize every parameter to brand standards in a visual canvas.
          </div>
        </section>

        <section id="dual-engine" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">The Dual-Engine Workflow</h3>
          <p className="leading-7 text-slate-700 mb-6">
            The platform is built around a hybrid, dual-mode engine where state is fully synchronized across both workspaces:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-indigo-200 rounded-md text-indigo-700"><Sparkles className="w-4 h-4" /></div>
                  <div className="font-semibold text-indigo-950">1. AI Chat Draft Engine</div>
                </div>
                <p className="text-sm text-indigo-900 leading-relaxed mb-3">
                  Interpret raw logs, copy-pasted matrices, or verbal concepts to generate a complete visual draft with color palettes, structured headings, and smart metadata tags.
                </p>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">Conversational Phase</Badge>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-slate-50 to-zinc-100 border-slate-200 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-slate-200 rounded-md text-slate-700"><Settings className="w-4 h-4" /></div>
                  <div className="font-semibold text-slate-900">2. Manual Visual Editor</div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed mb-3">
                  Refine curves, configure grid lines, apply smart javascript label formatters, insert custom coordinate images, and surrounding custom HTML templates.
                </p>
                <Badge variant="secondary" className="bg-slate-200 text-slate-800 border-slate-300">Design Refinement Phase</Badge>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="workspace-navigation" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">AI Launchpad Portal</h3>
          <p className="leading-7 text-slate-700 mb-6">
            Navigating the AI Chat workspace is straightforward and revolves around the following interactive structures:
          </p>
          <div className="space-y-4">
            <div className="flex gap-4 items-start p-3.5 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
              <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 text-xs font-mono font-bold">1</div>
              <div>
                <strong className="block text-slate-900">Conversational Workspace (`/landing`)</strong>
                <p className="text-slate-600 text-sm mt-0.5">The creative launchpad. Enter text prompts, select model parameters, load pre-built coordinate formats, and review immediate live chart draft previews.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-3.5 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
              <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 text-xs font-mono font-bold">2</div>
              <div>
                <strong className="block text-slate-900">Dashboard Deck (`/board`)</strong>
                <p className="text-slate-600 text-sm mt-0.5">Tracks your creation metrics. Review total chart metrics, weekly creation trends, grid/list toggle filters, and select historical snapshots to edit or share instantly.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  },
  {
    id: "data-prompts",
    category: "ai-chat",
    title: "Data Parsing & Prompts",
    icon: Terminal,
    description: "Convert messy spreadsheets, tabular columns, and colloquial statements into clean chart arrays.",
    headers: [
      { id: "data-parsing", text: "Data Parsing Capabilities" },
      { id: "prompting-techniques", text: "Prompt Structuring" },
      { id: "nested-prompts", text: "Multi-Series Examples" }
    ],
    content: (
      <div className="space-y-8">
        <section id="data-parsing" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Data Parsing Capabilities</h3>
          <p className="leading-7 text-slate-700">
            The AI engine is backed by a robust tokenization model designed to parse unstructured data formats automatically. You do not need to convert spreadsheets into CSVs to get started. The system cleanly extracts numerical matrices and coordinate titles from:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-700">
            <li><strong>Spreadsheet Copy-Pastes:</strong> Directly copy columns and cells from Excel or Google Sheets.</li>
            <li><strong>CSV with Custom Tokens:</strong> Reads commas, pipes, or tab-delimited values.</li>
            <li><strong>Colloquial Text Lists:</strong> Extracts data from natural sentences (e.g. *"Product A revenue was forty thousand, Product B reached fifteen thousand"*).</li>
          </ul>
        </section>

        <section id="prompting-techniques" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Prompt Structuring</h3>
          <p className="leading-7 text-slate-700 mb-4">
            To achieve ideal visual drafts in a single command, structure your prompts by combining the **numerical data block** with clear **styling directives**:
          </p>
          <div className="bg-slate-900 text-slate-50 p-6 rounded-xl font-mono text-sm relative overflow-hidden shadow-sm border border-slate-800">
            <div className="absolute top-3 right-3 text-xs text-indigo-400 uppercase tracking-wider font-semibold">Structured Instruction Template</div>
            <p className="whitespace-pre-wrap leading-relaxed">
              "[Instruction: Type of chart, axes titles, and color palette preferences]
              
              [Data Block: Text, spreadsheet grids, or CSV blocks]
              
              [Optional: Custom notes for text area summaries]"
            </p>
          </div>
        </section>

        <section id="nested-prompts" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Multi-Series Examples</h3>
          <p className="leading-7 text-slate-700 mb-4">
            For multi-dataset configurations, clearly label your series. The AI engine automatically detects complex matrices and initializes corresponding datasets and color palettes:
          </p>
          <div className="bg-slate-900 text-slate-50 p-6 rounded-xl font-mono text-sm relative overflow-hidden shadow-sm border border-slate-800">
            <div className="absolute top-3 right-3 text-xs text-emerald-400 uppercase tracking-wider font-semibold">Real Multi-Dataset Prompt</div>
            <p className="whitespace-pre-wrap leading-relaxed">
              "Create a grouped bar chart comparing regional sales performance.
              Use soft violet for West and amber orange for East.
              
              Quarter, West Region Sales (USD), East Region Sales (USD)
              Q1 2025, 45000, 38000
              Q2 2025, 52000, 48000
              Q3 2025, 61000, 59000
              Q4 2025, 78000, 72000"
            </p>
          </div>
        </section>
      </div>
    )
  },
  {
    id: "context-resolution",
    category: "ai-chat",
    title: "Context & History",
    icon: Database,
    description: " conversational editing with intelligent pronoun mapping and memory preservation.",
    headers: [
      { id: "memory-stack", text: "Conversation Memory Stack" },
      { id: "pronoun-mapping", text: "Context Resolution Mapping" },
      { id: "chaining-actions", text: "Chaining Conversational Edits" }
    ],
    content: (
      <div className="space-y-8">
        <section id="memory-stack" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Conversation Memory Stack</h3>
          <p className="leading-7 text-slate-700">
            During an active session, the AI Chat Assistant maintains a historical window of the last five messages. The backend engine serializes this history alongside a **slimmed down version of the current chart state** (preserving variables like coordinate data, labels, and active colors while stripping redundant visual styling to conserve tokens). This allows you to apply rapid visual adjustments without re-pasting your dataset.
          </p>
        </section>

        <section id="pronoun-mapping" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Context Resolution Mapping</h3>
          <p className="leading-7 text-slate-700">
            The processing engine resolves implicit references by analyzing the semantic context of previous instructions:
          </p>
          <div className="mt-4 p-4 bg-slate-50 border rounded-xl space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-xs text-slate-500 font-mono">User Query</span>
              <span className="text-xs text-indigo-600 font-semibold">Resolved Attribute Action</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <strong className="text-xs font-mono text-slate-800">"make it smooth"</strong>
              <span className="text-xs text-slate-600 text-right">Locates active line dataset → Sets <code>tension: 0.4</code></span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <strong className="text-xs font-mono text-slate-800">"border color to black" → "increase its width"</strong>
              <span className="text-xs text-slate-600 text-right">Maps "its width" to the active border attribute → Increases <code>borderWidth</code></span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <strong className="text-xs font-mono text-slate-800">"make the title bigger"</strong>
              <span className="text-xs text-slate-600 text-right">Finds global title configuration → Increases title <code>fontSize</code></span>
            </div>
          </div>
        </section>

        <section id="chaining-actions" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Chaining Conversational Edits</h3>
          <p className="leading-7 text-slate-700">
            You can chain complex logical sequences together in conversational commands, such as:
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs leading-relaxed text-slate-700">
            *"Change the chart type to line, make the curves smooth, set the grid lines to dashed grey, and set the line color to blue."*
          </div>
          <p className="leading-7 text-slate-700 mt-2">
            The AI engine parses these chained commands, identifies individual styling hooks, and applies a consolidated update package to the chart state.
          </p>
        </section>
      </div>
    )
  },
  {
    id: "model-selection",
    category: "ai-chat",
    title: "Model Selection",
    icon: Shield,
    description: "Select the ideal Large Language Model to balance generation speed, structural reasoning, and visual intelligence.",
    headers: [
      { id: "model-classes", text: "Model Classes Registry" },
      { id: "latency-tier", text: "Latency vs Accuracy Tiers" }
    ],
    content: (
      <div className="space-y-8">
        <section id="model-classes" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Model Classes Registry</h3>
          <p className="leading-7 text-slate-700">
            AIChartor interfaces with diverse AI architectures to support multiple speeds and generation techniques:
          </p>
          <ul className="space-y-4 mt-4">
            <li className="p-4 border rounded-xl hover:bg-slate-50/50 transition-colors">
              <strong className="text-slate-950 font-semibold block text-base">🤖 Gemini 2.5 Flash</strong>
              <span className="text-sm text-slate-600 mt-1 block">Fast execution. Best for drafting standard categorical models (Bar, Line, Pie) from simple text arrays in real-time.</span>
            </li>
            <li className="p-4 border rounded-xl hover:bg-slate-50/50 transition-colors">
              <strong className="text-slate-950 font-semibold block text-base">🧠 Gemini 2.5 Pro</strong>
              <span className="text-sm text-slate-600 mt-1 block">Maximum reasoning. Excels at complex data extraction, resolving nested datasets, and executing multi-step conversational style edits.</span>
            </li>
            <li className="p-4 border rounded-xl hover:bg-slate-50/50 transition-colors">
              <strong className="text-slate-950 font-semibold block text-base">⚡ DeepSeek R1 / OpenRouter fallback</strong>
              <span className="text-sm text-slate-600 mt-1 block">Specialized models optimized for structural layout analysis, large CSV tables, and dense math arrays.</span>
            </li>
          </ul>
        </section>

        <section id="latency-tier" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Latency vs Accuracy Tiers</h3>
          <p className="leading-7 text-slate-700">
            Depending on your model selection, visual coordinate generations range from **~800ms** (Flash) to **~3000ms** (Pro). Flash is highly recommended for quick data iterations, while Pro is ideal for complex nested modifications where preserving exact visual variables from the existing config is key.
          </p>
        </section>
      </div>
    )
  },
  {
    id: "smart-images-templates",
    category: "ai-chat",
    title: "Smart Image Binding",
    icon: Sparkles,
    description: "Automatically match category terms with graphics and pre-populate rich infographic text spaces.",
    headers: [
      { id: "point-images", text: "Smart Coordinate Graphics" },
      { id: "template-generation", text: "Text & HTML Area Generation" }
    ],
    content: (
      <div className="space-y-8">
        <section id="point-images" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Smart Coordinate Graphics</h3>
          <p className="leading-7 text-slate-700">
            If the AI detects keywords indicative of physical entities—such as *"flags"*, *"country icons"*, *"company logos"*, or *"emojis"*—it invokes the `universalImagePlugin`. 
            The parser injects verified image URLs into `dataset.pointImages` and defines coordinates inside `dataset.pointImageConfig` (e.g. {"{ type: 'circle', size: 24, position: 'center' }"}) to render graphics directly on data point markers.
          </p>
        </section>

        <section id="template-generation" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Text & HTML Area Generation</h3>
          <p className="leading-7 text-slate-700">
            When a template format is active, the chat engine generates both the structured chart JSON and the surrounding context content. Based on the data's trends and user-specified notes, it generates plain text subtitles or fully styled HTML summaries (headers, dynamic lists, metrics calls) for active template regions.
          </p>
          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-950 text-xs font-mono leading-relaxed">
            "templateContent": &#123;<br />
            &nbsp;&nbsp;"title": "Sales Surge Q3",<br />
            &nbsp;&nbsp;"heading": "A study of post-marketing investments",<br />
            &nbsp;&nbsp;"main": "&lt;h3&gt;Key Takeaways&lt;/h3&gt;&lt;ul&gt;&lt;li&gt;&lt;strong&gt;Growth:&lt;/strong&gt; Revenue surged by 24%...&lt;/li&gt;&lt;/ul&gt;"<br />
            &#125;
          </div>
        </section>
      </div>
    )
  },

  // =============================================
  // EDITOR CATEGORY TOPICS
  // =============================================
  {
    id: "editor-workspace",
    category: "editor",
    title: "Editor Workspace",
    icon: Layout,
    description: "Pixel-perfect manual refinements of axes, styles, presets, and canvas responsive scales.",
    headers: [
      { id: "workspace-layout", text: "Visual Workspace Structure" },
      { id: "resizeable-canvas", text: "Resizeable Center Stage" },
      { id: "layout-zones", text: "Multi-Zone Infographic Grids" },
      { id: "rich-text-tiptap", text: "Tiptap Rich-Text Summaries" }
    ],
    content: (
      <div className="space-y-8">
        <section id="workspace-layout" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Visual Workspace Structure</h3>
          <p className="leading-7 text-slate-700">
            The manual editor (accessible via the <code>/editor</code> route) isolates configuration controls from the live rendering zone, providing a streamlined professional environment:
          </p>
          <ul className="space-y-4 mt-4">
            <li className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="h-6 w-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">1</span>
              <div>
                <strong className="block text-slate-950 text-sm">Left Config Sidebar:</strong>
                <span className="text-xs text-slate-600">Quickly toggle between primary setting categories: Types, Design, Datasets, Axes, Templates, and Exports.</span>
              </div>
            </li>
            <li className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="h-6 w-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">2</span>
              <div>
                <strong className="block text-slate-950 text-sm">Right Control Panel:</strong>
                <span className="text-xs text-slate-600">Displays contextual options for the selected sidebar category, including sliders, color pickers, and toggle switches.</span>
              </div>
            </li>
            <li className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="h-6 w-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">3</span>
              <div>
                <strong className="block text-slate-950 text-sm">Center Stage Canvas:</strong>
                <span className="text-xs text-slate-600">A floating, resizeable container displaying the interactive chart and surrounding rich templates.</span>
              </div>
            </li>
          </ul>
        </section>

        <section id="resizeable-canvas" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Resizeable Center Stage</h3>
          <p className="leading-7 text-slate-700">
            To ensure visual charts scale correctly across varying screen formats (desktops, tablets, mobile presentations), the center canvas features an **interactive, drag-and-drop resizing boundary**.
          </p>

          <div className="my-6 border border-slate-200 rounded-xl overflow-hidden shadow-md bg-slate-50">
            <img 
              src="/docs-overlay-resize.jpg" 
              alt="Resizeable Center Stage Handles" 
              className="w-full h-auto object-cover max-h-[350px]" 
            />
            <div className="p-3 bg-slate-900 text-white text-xs font-mono text-center">
              Real Screenshot: Resizing Canvas using Drag Handles to Test Mobile Responsiveness
            </div>
          </div>

          <p className="leading-7 text-slate-700">
            Hover over the bottom-right corner of the canvas to activate the resize handles. Dragging the handles dynamically changes the layout dimensions on-the-fly, allowing you to quickly verify layout responsiveness and font legibility.
          </p>
        </section>

        <section id="layout-zones" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Multi-Zone Infographic Grids</h3>
          <p className="leading-7 text-slate-700">
            For complex publication assets, do not settle for a single canvas layout. Use **Layout Zones** to divide the infographic space into grid segments. The template editor allows you to configure split columns (e.g. 50/50 two-column layouts, or 70/30 sidebar divisions) with adjustable gutters and padding.
          </p>
          <p className="leading-7 text-slate-700 mt-2">
            Each layout zone can host a specific component. You can assign the visual chart canvas to one zone (e.g. the left column) while populating adjacent zones with dynamic rich text, KPI highlight cards, or uploaded graphics, ensuring the entire infographic aligns beautifully.
          </p>
        </section>

        <section id="rich-text-tiptap" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Tiptap Rich-Text Summaries</h3>
          <p className="leading-7 text-slate-700">
            Surround your charts with engaging textual analysis:
          </p>

          <div className="my-6 border border-slate-200 rounded-xl overflow-hidden shadow-md bg-slate-50">
            <img 
              src="/docs-overlay-add-text.png" 
              alt="Rich text Tiptap editing screenshot" 
              className="w-full h-auto object-cover max-h-[350px]" 
            />
            <div className="p-3 bg-slate-900 text-white text-xs font-mono text-center">
              Real Screenshot: Using Tiptap Rich Text Editor to Compose Graphic Descriptions
            </div>
          </div>

          <p className="leading-7 text-slate-700">
            Click directly inside any active template text zone (such as titles, headings, custom cards, or summary areas) to activate the editor toolbar. Tiptap provides immediate wysiwyg shortcuts to format headings, bulleted or numbered lists, bold highlights, links, and code snippets, compiling the edits into clean, responsive HTML blocks.
          </p>
        </section>
      </div>
    )
  },
  {
    id: "types-toggles",
    category: "editor",
    title: "Types and Toggles",
    icon: AlignEndHorizontal,
    description: "Switch between 16+ Standard and 3D chart representations, toggle visual elements, and use quick data filters or layout transformations.",
    headers: [
      { id: "visual-controller", text: "Visual Controller Overview" },
      { id: "workspace-modes", text: "Workspace Mode: Chart vs Template" },
      { id: "chart-types", text: "Standard & 3D Chart Formats" },
      { id: "control-toggles", text: "Visual Control Toggles" },
      { id: "quick-slice-filter", text: "Quick Slice Filters" },
      { id: "quick-transform-tools", text: "Quick Data Transformations" },
      { id: "layout-dimensions", text: "Layout, Dimensions & Margins" }
    ],
    content: (
      <div className="space-y-8 animate-in fade-in duration-300">
        <section id="visual-controller" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Visual Controller Overview</h3>
          <p className="leading-7 text-slate-700">
            The **Types & Toggles** sidebar is the graphical command center of your visual asset. Adjust chart categories, visibility toggles, data transformations, and canvas scales from a single panel.
          </p>
          
          <div className="my-6 border border-slate-200 rounded-xl overflow-hidden shadow-lg bg-slate-50 max-w-sm mx-auto">
            <img 
              src="/docs-types-toggles.png" 
              alt="Types & Toggles Panel Screenshot" 
              className="w-full h-auto object-cover" 
            />
            <div className="p-3 bg-indigo-900 text-white text-xs font-mono text-center">
              Real Crop: Types & Toggles Sidebar showcasing dropdown selects, five visual toggle switches, and responsive sections
            </div>
          </div>
        </section>

        <section id="workspace-modes" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Workspace Mode: Chart vs Template</h3>
          <p className="leading-7 text-slate-700">
            At the top of the sidebar panel, toggle between two primary visual layout methods:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-700">
            <li><strong>Chart Mode:</strong> Isolates the active chart canvas. Perfect for precise customization of axes, labels, data segments, and series coordinates.</li>
            <li><strong>Template Mode:</strong> Holistic infographic layout. Wraps your chart inside sophisticated grid columns, supporting wysiwyg rich-text descriptions, headings, and branding banners. Manual canvas dimensions are locked to auto-fill the grid.</li>
          </ul>
        </section>

        <section id="chart-types" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Standard & 3D Chart Formats</h3>
          <p className="leading-7 text-slate-700">
            AIChartor houses 16+ professional charting engines. Switch representations instantly via the <strong>Chart Type</strong> dropdown selection:
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 shadow-sm">
              <strong className="block text-indigo-900 text-base mb-2">Standard Charts</strong>
              <div className="text-sm text-slate-700 space-y-1">
                <p>• <strong>Bar & Horizontal Bar:</strong> Compare discrete category aggregates.</p>
                <p>• <strong>Line & Area:</strong> Trace temporal trends (supports tension and dashed borders).</p>
                <p>• <strong>Pie & Doughnut:</strong> Show relative percentages (doughnut supports radius cuts).</p>
                <p>• <strong>Radar & Polar Area:</strong> Plot multi-dimensional indexes on polar grids.</p>
                <p>• <strong>Scatter & Bubble:</strong> Track coordinates distribution and weight dimensions.</p>
                <p>• <strong>Waterfall:</strong> Renders cumulative steps, highlighting incremental gains or losses.</p>
                <p>• <strong>Funnel:</strong> Displays step-by-step conversion drop-offs.</p>
                <p>• <strong>Gauge Speedometer:</strong> Projects metrics on a speedometer radial range with pointer needles.</p>
              </div>
            </div>
            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 shadow-sm">
              <strong className="block text-blue-900 text-base mb-2">3D Isometric Projections</strong>
              <div className="text-sm text-slate-700 space-y-1">
                <p>• <strong>3D Pie:</strong> Perspective pie chart with extruded isometric depth layers.</p>
                <p>• <strong>3D Doughnut:</strong> Ring chart with perspective depth angles.</p>
                <p>• <strong>3D Bar:</strong> Renders standard bars as columns with 3D coordinate grids.</p>
                <p>• <strong>3D Horizontal Bar:</strong> Renders horizontal bars with perspective depth offsets.</p>
              </div>
              <div className="mt-3 p-3 bg-amber-50 rounded-lg text-amber-800 text-xs border border-amber-200">
                <strong>Depth Rendering Note:</strong> The 3D pipeline uses SVG perspective filters and drop-shadow offsets to add volumetric depth, helping your key metrics pop.
              </div>
            </div>
          </div>
        </section>

        <section id="control-toggles" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Visual Control Toggles</h3>
          <p className="leading-7 text-slate-700 mb-4">
            Five quick-switch toggles allow you to control critical SVG elements directly on the active coordinate series:
          </p>
          
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-900 border-b">
                <tr>
                  <th className="p-4 font-semibold w-1/4">Toggle Switch</th>
                  <th className="p-4 font-semibold w-1/4">Action</th>
                  <th className="p-4 font-semibold">Smart Handling / Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-light">
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Fill</td>
                  <td className="p-4">Toggles background fills.</td>
                  <td className="p-4">Automatically disabled and grayed out for standard <strong>Line</strong> charts to ensure the baseline remains sleek and uncluttered.</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Border</td>
                  <td className="p-4">Toggles segment borders.</td>
                  <td className="p-4">Dependent on <strong>Fill</strong>; automatically disabled when Fill is off to prevent invisible boundaries.</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Image</td>
                  <td className="p-4">Toggles point icons.</td>
                  <td className="p-4">Renders category point images (flags, corporate logos, emojis) directly on coordinate nodes.</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Label</td>
                  <td className="p-4">Toggles data labels.</td>
                  <td className="p-4">Displays exact numerical values alongside markers. Configure precision and fonts in <em>Styling & Labels</em>.</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Legend</td>
                  <td className="p-4">Toggles legends.</td>
                  <td className="p-4">Instantly toggles key guides. Setup alignment positions in the <em>Background & Legend</em> sub-panel.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="quick-slice-filter" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Quick Slice Filters</h3>
          <p className="leading-7 text-slate-700">
            Click to expand the **Quick Slice Filter** accordion. The UI displays interactive capsules for every coordinate label in your dataset. Toggle capsules to hide or show individual slices instantly. Ideal for highlighting specific categories or filtering out baseline outliers dynamically.
          </p>
        </section>

        <section id="quick-transform-tools" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Quick Data Transformations</h3>
          <p className="leading-7 text-slate-700">
            Apply automated calculations and ordering operations instantly using the **Quick Tools** block:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-700">
            <li><strong>🔄 Reordering:</strong> Sort values in Ascending (Low to High), Descending (High to Low), Alphabetical A-Z, Alphabetical Z-A, or completely reverse coordinates.</li>
            <li><strong>🔍 Filtering:</strong> Highlight metrics by slicing down to the Top 5, Top 10, or setting a dynamic Above/Below Threshold filter.</li>
            <li><strong>📈 Transformations:</strong> Normalize all coordinates to a standard 0-100 scale, convert elements to relative percentages, round floats to 1 or 2 decimals, or scale values by doubling (x2) or halving (x0.5).</li>
            <li><strong>↩️ Revert to Draft:</strong> Click <em>Reset to Original</em> to wipe out all active transformations and return to your raw parsed data draft.</li>
          </ul>
        </section>

        <section id="layout-dimensions" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Layout, Dimensions & Margins</h3>
          <p className="leading-7 text-slate-700">
            Fine-tune the size and responsive behavior of the canvas viewport:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-700">
            <li><strong>Responsive Fit:</strong> Auto-scales the SVG coordinate grid to the parent HTML element boundary, perfect for dashboard placements.</li>
            <li><strong>Fixed Dimensions:</strong> Lock exact height and width variables. Supports multiple unit presets: **Pixels (px)**, **Millimeters (mm)**, or **Centimeters (cm)** for high-fidelity print exports.</li>
            <li><strong>Interactive Resizing:</strong> Enable drag-to-resize handles on the chart canvas staging area for responsive dragging tests.</li>
            <li><strong>Padding Margins:</strong> Adjust sliders for Top, Bottom, Left, and Right padding grids to prevent ticks or axes labels from clipping.</li>
          </ul>
        </section>
      </div>
    )
  },
  {
    id: "datasets-slices",
    category: "editor",
    title: "Datasets and Slices",
    icon: Database,
    description: "Manage data series, active groups, visual color modes, custom coordinate images, and execute bulk-editing data operations.",
    headers: [
      { id: "visual-panel-overview", text: "Visual Panel Overview" },
      { id: "workspace-modes", text: "Single vs Grouped Modes" },
      { id: "convert-grouped", text: "Conversion & Group Creation" },
      { id: "dataset-manager", text: "Dataset Tab (Series, Colors, Images)" },
      { id: "slice-controller", text: "Slice Tab (Data & Custom Markers)" },
      { id: "full-edit-modal", text: "Full Edit Spreadsheet Modal" }
    ],
    content: (
      <div className="space-y-8 animate-in fade-in duration-300">
        <section id="visual-panel-overview" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Visual Panel Overview</h3>
          <p className="leading-7 text-slate-700">
            The **Datasets and Slices** manager is the absolute database engine of your visualization canvas. Divided into two master tabs—<strong>Datasets</strong> (for global series, group operations, colors, and markers) and <strong>Slices</strong> (for individual coordinate values and segment-level overrides)—it provides pixel-perfect management of categorical entries.
          </p>
          
          <div className="my-6 border border-slate-200 rounded-xl overflow-hidden shadow-lg bg-slate-50 max-w-sm mx-auto">
            <img 
              src="/docs-datasets-slices.png" 
              alt="Datasets and Slices Sidebar Panel" 
              className="w-full h-auto object-cover" 
            />
            <div className="p-3 bg-indigo-900 text-white text-xs font-mono text-center">
              Real Crop: Datasets & Slices Sidebar presenting the dual Datasets/Slices tabs, dropdown selectors, and sub-tabs
            </div>
          </div>
        </section>

        <section id="workspace-modes" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Single vs Grouped Modes</h3>
          <p className="leading-7 text-slate-700">
            The database engine operates in one of two structural paradigms depending on your project's layout needs:
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 shadow-sm">
              <strong className="block text-indigo-900 text-base mb-2">Single Mode (Isolated)</strong>
              <p className="text-sm text-slate-700 leading-relaxed mb-3">
                Each dataset acts as a standalone series on the canvas with its own completely isolated configuration. Under Single Mode, you can:
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>Choose active datasets via the dropdown to customize styles separately.</li>
                <li>Assign different chart types (e.g., violet bar series alongside dashed red trendlines).</li>
                <li>Independently configure ticks and styling for each series.</li>
              </ul>
            </div>
            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 shadow-sm">
              <strong className="block text-blue-900 text-base mb-2">Grouped Mode (Bound)</strong>
              <p className="text-sm text-slate-700 leading-relaxed mb-3">
                Datasets are mapped to unified comparison categories. Grouped mode relies on two layout schemes:
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li><strong>Uniform Mode:</strong> Every dataset series automatically inherits group-wide colors, margins, and legend shapes to maximize visual cohesion.</li>
                <li><strong>Mixed Mode:</strong> Allow discrete series within the group to override base settings, perfect for layered line/bar dashboard widgets.</li>
                <li><strong>Active Groups:</strong> Dropdown to filter active groups, create custom multi-series groupings, or delete entire groups at once.</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="convert-grouped" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Conversion & Group Creation</h3>
          <p className="leading-7 text-slate-700">
            Easily scale single-series drafts into robust multi-series dashboards using the **Convert to Grouped** action. Located inside the General tab, this utility migrates existing structures:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-700">
            <li><strong>Auto-Migration:</strong> Reads active chart titles or first-series labels and automatically instantiates a new Group (e.g., "Group 0").</li>
            <li><strong>Type Alignment:</strong> Detects coordinates type (categorical bar/line vs scatter/bubble coordinates) and locks the new group's base chart format.</li>
            <li><strong>Synchronized State:</strong> Swaps mode properties to grouped, mirrors coordinate matrices to grouped state stores, and resets Single Mode caches.</li>
          </ul>
        </section>

        <section id="dataset-manager" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Dataset Tab (Series, Colors, Images)</h3>
          <p className="leading-7 text-slate-700">
            The **Datasets** tab controls settings across your data series. Access options using three sub-tabs:
          </p>
          <ul className="space-y-4 mt-4">
            <li className="p-4 border rounded-xl hover:bg-slate-50/50 transition-colors">
              <strong className="text-slate-950 font-semibold block text-sm">📁 General</strong>
              <span className="text-xs text-slate-600 mt-1 block">Lists active series, allows switching active targets, provides quick tiles to add new datasets, and fires deletion dialogues. Includes a shortcut button to trigger the Full Edit spreadsheet layout.</span>
            </li>
            <li className="p-4 border rounded-xl hover:bg-slate-50/50 transition-colors">
              <strong className="text-slate-950 font-semibold block text-sm">🎨 Colors</strong>
              <span className="text-xs text-slate-600 mt-1 block">Adjust dataset-wide opacity percentages (0% to 100%). Choose Border Color modes (Auto-darkens background fills by 20% to guarantee premium contrast, or manual Hex selection). Switch Color Modes between <em>Dataset Color</em> (uniform color across all elements in the series) and <em>Slice Color</em> (independent color palette assigned per segment).</span>
            </li>
            <li className="p-4 border rounded-xl hover:bg-slate-50/50 transition-colors">
              <strong className="text-slate-950 font-semibold block text-sm">🖼️ Images</strong>
              <span className="text-xs text-slate-600 mt-1 block">Customize coordinate marker graphics under the universalImagePlugin. Choose image categories (regular vector pins, shape fills, directional arrows, or custom uploaded URL assets). Refine marker sizing (px), vertical offset alignments (center, top, bottom, left, right), and arrow line pointers.</span>
            </li>
          </ul>
        </section>

        <section id="slice-controller" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Slice Tab (Data & Custom Markers)</h3>
          <p className="leading-7 text-slate-700">
            Manage data points within the active dataset under the **Slices** tab. Includes three sub-tabs:
          </p>
          <ul className="space-y-4 mt-4">
            <li className="p-4 border rounded-xl hover:bg-slate-50/50 transition-colors">
              <strong className="text-slate-950 font-semibold block text-sm">📊 Data</strong>
              <span className="text-xs text-slate-600 mt-1 block">
                Presents editable rows for each slice. Fields adapt dynamically to active chart types:
                <span className="block mt-2 font-mono text-2xs text-indigo-700 bg-indigo-50 p-2 rounded">
                  • Standard (Bar/Line/Pie): [Label Name input] | [Numeric Value input]<br />
                  • Coordinates (Scatter/Bubble): [Label Name] | [X input] | [Y input] | [Radius Size input (Bubble only)]
                </span>
                Click the trash icon to delete slices. In Grouped Mode, coordinate additions/deletions propagate uniformly across all group series automatically to prevent alignment errors.
              </span>
            </li>
            <li className="p-4 border rounded-xl hover:bg-slate-50/50 transition-colors">
              <strong className="text-slate-950 font-semibold block text-sm">🎨 Colors</strong>
              <span className="text-xs text-slate-600 mt-1 block">Assign custom colors to specific slices using interactive pickers. This allows you to highlight specific segments (e.g., highlighting Q3 performance in gold while keeping others standard blue).</span>
            </li>
            <li className="p-4 border rounded-xl hover:bg-slate-50/50 transition-colors">
              <strong className="text-slate-950 font-semibold block text-sm">🖼️ Images</strong>
              <span className="text-xs text-slate-600 mt-1 block">Upload files or input URL paths to bind graphics to individual slice markers, perfect for comparative flags or category icons.</span>
            </li>
          </ul>
        </section>

        <section id="full-edit-modal" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Full Edit Spreadsheet Modal</h3>
          <p className="leading-7 text-slate-700">
            Clicking **Full Edit** launches a modal that displays your dataset as a structured data table. 
            This modal allows you to bulk-edit:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-700">
            <li><strong>Names & Labels:</strong> Change category rows in a clean list without reloading.</li>
            <li><strong>Numerical Coordinates:</strong> Edit values (or X/Y/R coordinates) in a fast, tab-navigable grid.</li>
            <li><strong>Slice Colors:</strong> Swap multiple color pickers rapidly or toggle the master Color Mode (Slice vs Dataset-wide color) directly from the header.</li>
            <li><strong>Individual Images:</strong> Map custom graphic URLs to specific data points.</li>
          </ul>
        </section>
      </div>
    )
  },
  {
    id: "background-legend",
    category: "editor",
    title: "Background & Legend",
    icon: PanelTop,
    description: "Design multi-stop gradients, vector pattern fills, blurred backdrops, and format headers or legend placements.",
    headers: [
      { id: "background-tab-section", text: "Background Editor" },
      { id: "title-tab-section", text: "Title Customizer" },
      { id: "legend-tab-section", text: "Legend Positioning" }
    ],
    content: <BackgroundAndLegendDocs />
  },
  {
    id: "styling-labels",
    category: "editor",
    title: "Styling & Labels",
    icon: Tag,
    description: "Apply precision decimal locks, dynamic currency compact notations, and custom JavaScript tick templates.",
    headers: [
      { id: "numerical-presets", text: "Numerical Formatting Presets" },
      { id: "js-formatters", text: "Custom JS Formatter Strings" },
      { id: "conditional-styling", text: "Conditional Color Styling Rules" },
      { id: "sorting-thresholds", text: "Quick Slices Sorting & Thresholds" }
    ],
    content: <StylingAndLabelsDocs />
  },
  {
    id: "axes-settings",
    category: "editor",
    title: "Axes",
    icon: Grid,
    description: "Fine-tune grid lines, tick rotations, intervals, titles, scale constraints, and layout offsets.",
    headers: [
      { id: "axes-cartesian", text: "Cartesian X/Y Axes" },
      { id: "axes-radial", text: "Radial Scale Axes" },
      { id: "axes-circular", text: "Circular Geometry Layouts" }
    ],
    content: <AxesSettingsDocs />
  },
  {
    id: "decorations-panel",
    category: "editor",
    title: "Decorations",
    icon: Component,
    description: "Overlay vector shapes, icons, custom SVGs, and mark coordinate highlights manually.",
    headers: [
      { id: "decorations-shapes", text: "Vector Shapes Overlay" },
      { id: "decorations-branding", text: "Branding & SVGs" },
      { id: "decorations-positioning", text: "Resizing & Position" },
      { id: "decorations-layers", text: "Styling Layers" }
    ],
    content: <DecorationsSettingsDocs />
  },
  {
    id: "advanced-settings",
    category: "editor",
    title: "Advanced",
    icon: SlidersHorizontal,
    description: "Revert edits instantly using the temporal client history or persistent database snapshots.",
    headers: [
      { id: "zundo-temporal", text: "Zustand Zundo Client Stack" },
      { id: "database-sync", text: "Supabase Snapshot Versioning" },
      { id: "tooltip-designer", text: "Interactive Tooltip Designer" },
      { id: "watermark-branding", text: "Branding & Watermarks Engine" }
    ],
    content: (
      <div className="space-y-8">
        <section id="zundo-temporal" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Zustand Zundo Client Stack</h3>
          <p className="leading-7 text-slate-700">
            The visual editor implements client-side history using **Zundo**. The store tracks all visual configuration changes, dataset edits, and template updates in a 50-step memory stack. You can immediately trigger undo or redo actions using standard keyboard shortcuts (<code>Ctrl + Z</code> / <code>Ctrl + Y</code>) or the toolbar buttons on the top menu.
          </p>

          <div className="my-6 border border-slate-200 rounded-xl overflow-hidden shadow-md bg-slate-50">
            <img 
              src="/docs-advanced-settings.png" 
              alt="Advanced customization panel settings screenshot" 
              className="w-full h-auto object-cover max-h-[380px]" 
            />
            <div className="p-3 bg-slate-900 text-white text-xs font-mono text-center">
              Real Screenshot: Advanced settings tab exposing Tooltip controls, Easing animations, and copyright Watermark pickers
            </div>
          </div>
        </section>

        <section id="database-sync" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Supabase Snapshot Versioning</h3>
          <p className="leading-7 text-slate-700">
            For long-term preservation, saving a chart pushes a persistent snapshot to the Supabase database. 
            The editor includes a **History Dropdown Menu** in the header. Clicking this dropdown retrieves database records and displays a timeline of previous saves. You can select any historical timestamp to instantly restore that specific visual state.
          </p>
        </section>

        <section id="tooltip-designer" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Interactive Tooltip Designer</h3>
          <p className="leading-7 text-slate-700">
            Configure fully responsive visual hover cards to provide data details to your audience on-the-fly:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-700">
            <li><strong>Display Mode:</strong> Set interactive display rules (Slice Values, Dataset values, X Axis / Y Axis scales matching).</li>
            <li><strong>Typography & Borders:</strong> Select custom font families, size in pixels, border width coordinates, text color tokens, and custom card border radius curves.</li>
            <li><strong>Translucence Opacity:</strong> Adjust the transparent background color opacity of the hover card (0% to 100%) to match your brand style guides.</li>
          </ul>
        </section>

        <section id="watermark-branding" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Branding & Watermarks Engine</h3>
          <p className="leading-7 text-slate-700">
            Add secure copyrights or visual brand logos directly inside the chart background rendering zone:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-700">
            <li><strong>Watermark Mode:</strong> Switch between **Tiled Repeating Pattern** (creates a continuous, security repeating overlay) and **Single Position** (places a single logo inside Top-Left, Top-Right, Bottom-Left, Bottom-Right, or Center of the chart canvas).</li>
            <li><strong>Custom Text / Images:</strong> Type standard text marks (e.g. copyright notices) or input direct image URLs (branded PNG logos) to render graphics on the fly.</li>
            <li><strong>Angles & Spacing:</strong> Use interactive sliders to rotate branding marks (0° to 360°), decrease overall opacities, scale sizes, and configure Tile X/Y offsets.</li>
          </ul>
        </section>
      </div>
    )
  },
  {
    id: "export-settings",
    category: "editor",
    title: "Export",
    icon: Download,
    description: "Export high-resolution assets, package self-contained interactive web HTMLs, share public view links, and download raw data as CSV.",
    headers: [
      { id: "export-general-settings", text: "General Settings" },
      { id: "export-manual-dimensions", text: "Manual Dimensions" },
      { id: "export-chart-image", text: "Chart Image Export" },
      { id: "export-share-online", text: "Share Online" },
      { id: "export-html", text: "HTML Export" },
      { id: "export-configuration", text: "Configuration (JSON)" },
      { id: "export-data-csv", text: "Data Export (CSV)" },
      { id: "export-format-reference", text: "Format Comparison" }
    ],
    content: (
      <div className="space-y-10">
        {/* ── General Settings ────────────────────────── */}
        <section id="export-general-settings" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">General Settings</h3>
          <p className="leading-7 text-slate-700 mb-4">
            The <strong>General</strong> card at the top of the Export panel controls two global parameters that influence every export action beneath it:
          </p>

          <div className="my-6 border border-slate-200 rounded-xl overflow-hidden shadow-md bg-slate-50">
            <img
              src="/docs-export-general.png"
              alt="Export General Settings Panel"
              className="w-full h-auto object-cover max-h-[340px]"
            />
            <div className="p-3 bg-slate-900 text-white text-xs font-mono text-center">
              General Settings — Export Mode selector and Dimension controls with live canvas readout
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-900 border-b">
                <tr>
                  <th className="p-4 font-semibold w-1/3">Control</th>
                  <th className="p-4 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-light">
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Export Mode</td>
                  <td className="p-4">Choose between <strong>Chart Only</strong> (exports the raw chart canvas) or <strong>Chart Template</strong> (exports the chart wrapped inside the active template layout with header, footer, and surrounding decorations).</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Dimension</td>
                  <td className="p-4">Toggle between <strong>Auto (Responsive)</strong> — the chart fills the available container width and adapts to viewport changes — or <strong>Manual</strong> — you lock the exact pixel, millimeter, or centimeter dimensions for print-quality output.</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Canvas Readout</td>
                  <td className="p-4">In Auto mode, a live blue info badge displays the current canvas size (e.g. <code>📐 1200 × 600 px</code>), so you always know the exact output resolution before exporting.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <strong>⚠️ Template Mode Lock:</strong> When the editor is in global Template mode, the Dimension selector is automatically locked to <strong>Auto (Responsive)</strong> and cannot be changed — template dimensions are always driven by the template layout itself.
          </div>
        </section>

        {/* ── Manual Dimensions ────────────────────────── */}
        <section id="export-manual-dimensions" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Manual Dimensions</h3>
          <p className="leading-7 text-slate-700 mb-4">
            Switching the Dimension control to <strong>Manual</strong> reveals precision dimension inputs that sync bidirectionally with the <em>Layout &amp; Dimensions</em> settings of your chart:
          </p>

          <div className="my-6 border border-slate-200 rounded-xl overflow-hidden shadow-md bg-slate-50">
            <img
              src="/docs-export-dimensions.png"
              alt="Manual Dimension Inputs"
              className="w-full h-auto object-cover max-h-[340px]"
            />
            <div className="p-3 bg-slate-900 text-white text-xs font-mono text-center">
              Manual Dimensions — Unit selector (px / mm / cm), Width &amp; Height fields with live pixel conversion
            </div>
          </div>

          <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-700">
            <li><strong>Unit Selector:</strong> Choose from <code>Pixels (px)</code>, <code>Millimeters (mm)</code>, or <code>Centimeters (cm)</code>. When using mm/cm, the editor displays an approximate pixel equivalent (e.g. <code>≈ 1200 × 600 px</code>) for reference.</li>
            <li><strong>Width &amp; Height Inputs:</strong> Type exact numeric values. The minimum allowed in pixel mode is <strong>250 px</strong>. Values are validated on blur and clamped to the minimum if invalid.</li>
            <li><strong>Live Canvas Resize:</strong> Changing either dimension immediately resizes the live chart canvas and updates the <code>chartConfig</code> store — so the preview reflects the exact export frame in real-time.</li>
            <li><strong>Bidirectional Sync:</strong> Dimension changes in the Export panel automatically update the Layout &amp; Dimensions tab, and vice-versa. Switching back to Auto restores responsive mode.</li>
          </ul>
        </section>

        {/* ── Chart Image Export ────────────────────────── */}
        <section id="export-chart-image" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Chart Image Export</h3>
          <p className="leading-7 text-slate-700 mb-4">
            The <strong>Chart Image</strong> card generates high-resolution raster images of your chart, complete with background layers, gradient fills, image overlays, and decoration shapes composited on top.
          </p>

          <div className="my-6 border border-slate-200 rounded-xl overflow-hidden shadow-md bg-slate-50">
            <img
              src="/docs-export-image.png"
              alt="Chart Image Export Panel"
              className="w-full h-auto object-cover max-h-[340px]"
            />
            <div className="p-3 bg-slate-900 text-white text-xs font-mono text-center">
              Chart Image — Format selector, Scale / Quality multiplier, and one-click Export button
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-900 border-b">
                <tr>
                  <th className="p-4 font-semibold w-1/3">Option</th>
                  <th className="p-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-light">
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Format</td>
                  <td className="p-4"><strong>PNG (Recommended)</strong> — lossless compression with transparency support. <strong>JPG</strong> — lossy compression, auto-fills transparent backgrounds with white for compatibility.</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Scale / Quality</td>
                  <td className="p-4"><strong>1×</strong> Standard (screen). <strong>2×</strong> High (Retina displays). <strong>4×</strong> Ultra (print-quality). Higher scale multiplies the pixel dimensions for sharper output at the cost of larger file size.</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Background Compositing</td>
                  <td className="p-4">The export engine renders a temporary canvas, draws the current background (solid color, gradient, or image with blur/opacity), composites the chart on top, then overlays any SVG decoration shapes — all in a single pass.</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Template Mode</td>
                  <td className="p-4">When Export Mode is set to <strong>Chart Template</strong>, the entire template layout (header, footer, padding, border decorations) is rendered to the image, not just the raw chart canvas.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Share Online ────────────────────────── */}
        <section id="export-share-online" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Share Online</h3>
          <p className="leading-7 text-slate-700 mb-4">
            Generate a <strong>public, unauthenticated share link</strong> (<code>/share/[share_id]</code>) that anyone can open — no login required. Perfect for pasting into Slack messages, emails, documentation, or project boards.
          </p>

          <div className="my-6 border border-slate-200 rounded-xl overflow-hidden shadow-md bg-slate-50">
            <img
              src="/docs-export-share.png"
              alt="Share Online Panel"
              className="w-full h-auto object-cover max-h-[340px]"
            />
            <div className="p-3 bg-slate-900 text-white text-xs font-mono text-center">
              Share Online — One-click link generation with clipboard copy and loading spinner
            </div>
          </div>

          <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-700">
            <li><strong>How it works:</strong> The panel calls <code>dataService.generateShareLink()</code> with the current snapshot ID. Supabase generates a unique share identifier, and the full URL is automatically copied to your clipboard.</li>
            <li><strong>Prerequisite:</strong> The chart must be <strong>saved to a conversation</strong> first. If no snapshot exists, the button is disabled and an amber warning appears: <em>&quot;You must save this chart to a conversation first.&quot;</em></li>
            <li><strong>Loading State:</strong> While the link is being generated, a spinning animation and &quot;Generating...&quot; text replace the button label. Toast notifications confirm success or report errors.</li>
            <li><strong>Viral Engagement:</strong> The public share page includes a <strong>&quot;Create Similar&quot;</strong> button, allowing viewers to duplicate your exact chart configuration in a single click — driving organic adoption.</li>
          </ul>
        </section>

        {/* ── HTML Export ────────────────────────── */}
        <section id="export-html" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">HTML Export</h3>
          <p className="leading-7 text-slate-700 mb-4">
            The <strong>HTML Export</strong> card packages your chart into a <strong>single self-contained HTML file</strong> that works offline. The generated file links Chart.js via CDN, preserves interactive tooltips, animations, legend click interactions, and decoration overlays.
          </p>

          <div className="my-6 border border-slate-200 rounded-xl overflow-hidden shadow-md bg-slate-50">
            <img
              src="/docs-export-html.png"
              alt="HTML Export Panel"
              className="w-full h-auto object-cover max-h-[340px]"
            />
            <div className="p-3 bg-slate-900 text-white text-xs font-mono text-center">
              HTML Export — Custom file name, template style selector, and Download button
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white mt-4">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-900 border-b">
                <tr>
                  <th className="p-4 font-semibold w-1/3">Control</th>
                  <th className="p-4 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-light">
                <tr>
                  <td className="p-4 font-semibold text-slate-900">File Name</td>
                  <td className="p-4">Customize the download filename. Defaults to <code>chart-YYYY-MM-DD.html</code> using the current date.</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Style (Template)</td>
                  <td className="p-4">Select an HTML wrapper template from the available styles. The <strong>Plain</strong> template provides a minimal page with just the chart canvas, background layers, and decorations SVG.</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Interactive Features</td>
                  <td className="p-4">The exported HTML preserves <strong>tooltips on hover</strong>, <strong>entry animations</strong>, <strong>legend click-to-hide</strong> interactions, and the <strong>zero-line baseline highlight</strong> for negative value charts.</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Template Mode</td>
                  <td className="p-4">When Export Mode is <strong>Chart Template</strong>, the HTML output wraps the chart inside the full template layout with headers, footers, and custom template sizing — including decoration shapes rendered as inline SVG.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <strong>💡 Tip:</strong> The generated HTML file includes the complete Chart.js plugin system (custom labels, waterfall, funnel, data images, etc.) inline — so all advanced chart types render correctly without any external dependencies beyond the Chart.js CDN.
          </div>
        </section>

        {/* ── Configuration (JSON) ────────────────────────── */}
        <section id="export-configuration" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Configuration (JSON)</h3>
          <p className="leading-7 text-slate-700 mb-4">
            The <strong>Configuration</strong> card provides direct access to the raw Chart.js configuration object — including chart type, dataset arrays, and all option overrides.
          </p>

          <div className="my-6 border border-slate-200 rounded-xl overflow-hidden shadow-md bg-slate-50">
            <img
              src="/docs-export-config.png"
              alt="Configuration Export Panel"
              className="w-full h-auto object-cover max-h-[340px]"
            />
            <div className="p-3 bg-slate-900 text-white text-xs font-mono text-center">
              Configuration — Download JSON, Copy to clipboard, and live config preview textarea
            </div>
          </div>

          <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-700">
            <li><strong>Download JSON:</strong> Exports a <code>chart-config.json</code> file containing the complete <code>{`{ type, data, options }`}</code> structure. Use this to back up chart layouts, version-control configurations, or import them into other Chart.js projects.</li>
            <li><strong>Copy to Clipboard:</strong> Copies the same JSON payload to your clipboard instantly — ready to paste into code editors, API requests, or documentation.</li>
            <li><strong>Live Config Preview:</strong> A read-only monospace textarea displays the current config in real-time with pretty-printed JSON indentation. Any changes you make in the editor are reflected here immediately.</li>
          </ul>
        </section>

        {/* ── Data Export (CSV) ────────────────────────── */}
        <section id="export-data-csv" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Data Export (CSV)</h3>
          <p className="leading-7 text-slate-700 mb-4">
            The <strong>Data Export</strong> card generates a clean <code>.csv</code> file from your chart&apos;s currently visible data — perfect for importing into Excel, Google Sheets, or data analysis tools.
          </p>

          <div className="my-6 border border-slate-200 rounded-xl overflow-hidden shadow-md bg-slate-50">
            <img
              src="/docs-export-csv.png"
              alt="Data Export CSV Panel"
              className="w-full h-auto object-cover max-h-[340px]"
            />
            <div className="p-3 bg-slate-900 text-white text-xs font-mono text-center">
              Data Export — Single-click CSV download filtered by current view state
            </div>
          </div>

          <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-700">
            <li><strong>Intelligent Filtering:</strong> The CSV export respects the current view state — <strong>single vs. grouped dataset mode</strong>, <strong>active dataset index</strong>, <strong>legend visibility filters</strong>, and <strong>active group</strong> selections. You export exactly what you see.</li>
            <li><strong>Format:</strong> The first row contains column headers (<code>Label, Dataset1, Dataset2, ...</code>), followed by one row per data point. Downloads as <code>chart-data.csv</code>.</li>
            <li><strong>Use Cases:</strong> Share underlying data with stakeholders who need spreadsheet access, create backup data snapshots, or feed exported CSVs into other reporting pipelines.</li>
          </ul>
        </section>

        {/* ── Format Comparison Reference ────────────────────────── */}
        <section id="export-format-reference" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Format Comparison</h3>
          <p className="leading-7 text-slate-700 mb-4">
            Quick reference for choosing the right export format based on your use case:
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-900 border-b">
                <tr>
                  <th className="p-4 font-semibold">Format</th>
                  <th className="p-4 font-semibold">Interactive</th>
                  <th className="p-4 font-semibold">Best For</th>
                  <th className="p-4 font-semibold">Background Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-light">
                <tr>
                  <td className="p-4 font-semibold text-slate-900">PNG</td>
                  <td className="p-4">❌ Static</td>
                  <td className="p-4">Presentations, documents, social media</td>
                  <td className="p-4">✅ Color, gradient, image, transparent</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">JPG</td>
                  <td className="p-4">❌ Static</td>
                  <td className="p-4">Email embeds, web thumbnails (smaller file)</td>
                  <td className="p-4">✅ Color, gradient, image (no transparency)</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">HTML</td>
                  <td className="p-4">✅ Full</td>
                  <td className="p-4">Web embeds, offline dashboards, stakeholder reports</td>
                  <td className="p-4">✅ Color, gradient, image, transparent</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">JSON</td>
                  <td className="p-4">— Config only</td>
                  <td className="p-4">Backup, version control, programmatic re-import</td>
                  <td className="p-4">— N/A</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">CSV</td>
                  <td className="p-4">— Data only</td>
                  <td className="p-4">Spreadsheets, data analysis, ETL pipelines</td>
                  <td className="p-4">— N/A</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Share Link</td>
                  <td className="p-4">✅ Full</td>
                  <td className="p-4">Slack, email, documentation — live viewer access</td>
                  <td className="p-4">✅ Renders live from Supabase snapshot</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    )
  }
]

export default function DocumentationPage() {
  const [activeCategory, setActiveCategory] = useState<"ai-chat" | "editor">("ai-chat")
  const [activeSectionId, setActiveSectionId] = useState("getting-started")
  const [activeHeaderId, setActiveHeaderId] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Get current section data
  const activeSection = guideData.find(s => s.id === activeSectionId) || guideData[0]

  // Robust scroll spy
  useEffect(() => {
    const visibleHeaders = new Map<string, IntersectionObserverEntry>()

    if (activeSection.headers?.[0]) {
      setActiveHeaderId(activeSection.headers[0].id)
    }

    const callback = (entries: IntersectionObserverEntry[]) => {
      // Update the map of visible elements
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleHeaders.set(entry.target.id, entry)
        } else {
          visibleHeaders.delete(entry.target.id)
        }
      })

      // Logic to determine which header is "active"

      // 1. Priority: Bottom of page
      // If the user has scrolled to the bottom, force the last item to be active
      const scrolledToBottom = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 50
      if (scrolledToBottom && activeSection.headers) {
        const lastId = activeSection.headers[activeSection.headers.length - 1].id
        setActiveHeaderId(lastId)
        return
      }

      // 2. Priority: Top-most visible element
      // We want the element that is closest to the top of the viewport
      if (visibleHeaders.size > 0) {
        const sorted = Array.from(visibleHeaders.values()).sort((a, b) => {
          return a.boundingClientRect.top - b.boundingClientRect.top
        })

        // Use the top-most visible element
        if (sorted[0]) {
          setActiveHeaderId(sorted[0].target.id)
        }
      }
    }

    const observer = new IntersectionObserver(callback, {
      rootMargin: "-80px 0px -40% 0px", // Offset for sticky header (80px) and bottom fade
      threshold: [0, 1]
    })

    const headers = activeSection.headers || []
    headers.forEach((header) => {
      const element = document.getElementById(header.id)
      if (element) {
        observer.observe(element)
      }
    })

    // Add a simple scroll listener JUST for the bottom check since IO doesn't always fire exactly at bottom
    // We make it passive for better performance
    const handleScroll = () => {
      const scrolledToBottom = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 50
      if (scrolledToBottom && activeSection.headers) {
        setActiveHeaderId(activeSection.headers[activeSection.headers.length - 1].id)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", handleScroll)
    }
  }, [activeSectionId, activeSection])

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Navbar / Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2 font-bold text-slate-900">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span>Docs</span>
          </div>

          <div className="hidden md:flex items-center ml-4">
            <SimpleDropdown
              trigger={
                <div className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors select-none cursor-pointer">
                  <span>Go To</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
              }
              align="start"
              className="w-48 p-1"
            >
              <Link
                href="/board"
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-md transition-all duration-150 font-medium"
              >
                <Layout className="h-4 w-4 text-slate-400" />
                <span>Board</span>
              </Link>
              <Link
                href="/landing"
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-md transition-all duration-150 font-medium"
              >
                <Sparkles className="h-4 w-4 text-slate-400" />
                <span>AI Chat</span>
              </Link>
              <Link
                href="/editor"
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-md transition-all duration-150 font-medium"
              >
                <BarChart className="h-4 w-4 text-slate-400" />
                <span>Editor page</span>
              </Link>
            </SimpleDropdown>
          </div>

          <div className="ml-auto flex w-full max-w-md items-center gap-4">
            <div className="relative w-full flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Search documentation..."
                className="h-9 w-full rounded-md bg-slate-100 pl-9 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <SimpleProfileDropdown size="sm" />
          </div>
        </div>
      </header >

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 items-start">
        {/* Left Sidebar - Navigation */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-white transition-transform duration-300 ease-in-out md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <div className="flex h-full flex-col overflow-y-auto py-6 px-4">
            <div className="flex items-center justify-between md:hidden mb-6">
              <span className="font-semibold">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Workspace Category Filter Buttons */}
            <div className="mb-6 px-2">
              <h4 className="mb-3 text-2xs font-bold uppercase tracking-wider text-slate-400">
                Workspace Pillars
              </h4>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/50">
                <button
                  onClick={() => {
                    setActiveCategory("ai-chat")
                    setActiveSectionId("getting-started")
                    window.scrollTo({ top: 0, behavior: 'instant' })
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                    activeCategory === "ai-chat"
                      ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
                  }`}
                >
                  AI Chat
                </button>
                <button
                  onClick={() => {
                    setActiveCategory("editor")
                    setActiveSectionId("editor-workspace")
                    window.scrollTo({ top: 0, behavior: 'instant' })
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                    activeCategory === "editor"
                      ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
                  }`}
                >
                  Editor
                </button>
              </div>
            </div>

            <div className="mb-2 px-2">
              <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Topics
              </h4>
            </div>

            <nav className="flex flex-col gap-1 space-y-1">
              {guideData
                .filter(section => section.category === activeCategory)
                .map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSectionId(section.id)
                      setSidebarOpen(false)
                      window.scrollTo({ top: 0, behavior: 'instant' })
                    }}
                    className={`group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${activeSectionId === section.id
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                  >
                    <span className="flex items-center gap-3">
                      <section.icon className={`h-4 w-4 ${activeSectionId === section.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-500"
                        }`} />
                      {section.title}
                    </span>
                    {activeSectionId === section.id && (
                      <ChevronRight className="h-4 w-4 text-indigo-400" />
                    )}
                  </button>
                ))}
            </nav>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-12 md:py-12">
          <div className="prose prose-slate max-w-none animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="mb-10 border-b pb-8">
              <div className="flex bg-indigo-50 w-fit p-3 rounded-xl mb-6 text-indigo-600 shadow-sm border border-indigo-100">
                <activeSection.icon className="h-8 w-8" />
              </div>
              <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 text-slate-900">
                {activeSection.title}
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed font-light">
                {activeSection.description}
              </p>
            </div>

            {/* Render Active Section Content */}
            <div className="relative">
              {activeSection.content}
            </div>

            <div className="mt-16 flex justify-between border-t border-slate-100 pt-8">
              <p className="text-sm text-slate-400 italic">Last updated: May 23, 2026</p>
            </div>
          </div>
        </main>

        {/* Right Sidebar - On This Page */}
        <aside className="sticky top-14 hidden w-64 shrink-0 h-[calc(100vh-3.5rem)] overflow-y-auto border-l border-slate-200 py-10 px-6 xl:block">
          <div className="space-y-1">
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              On this page
            </h4>
            <nav className="flex flex-col gap-2 text-sm text-slate-600">
              {activeSection.headers && activeSection.headers.map((header) => (
                <Link
                  key={header.id}
                  href={`#${header.id}`}
                  className={`block border-l-2 py-1 pl-4 text-sm transition-colors -ml-[2px] ${activeHeaderId === header.id
                    ? "border-indigo-600 font-medium text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                >
                  {header.text}
                </Link>
              ))}

              {(!activeSection.headers || activeSection.headers.length === 0) && (
                <span className="text-slate-400 italic text-xs">No subsections</span>
              )}
            </nav>

            <div className="pt-6">
              <div className="rounded-lg bg-indigo-50 p-4">
                <p className="mb-2 text-sm font-medium text-indigo-900">
                  Ready to build?
                </p>
                <p className="mb-3 text-xs text-indigo-700">
                  Jump into the editor and start creating charts with AI.
                </p>
                <Link href="/editor">
                  <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-0">
                    Open Editor <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div >
  )
}
