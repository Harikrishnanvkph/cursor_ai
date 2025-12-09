"use client"

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
  Layers,
  Image,
  Type as TypeIcon
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

// Detailed content data for each section
const guideData = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Sparkles,
    description: "Learn the core concepts of AIChartor and how to navigate the platform.",
    // Explicit headers for the Right Sidebar "On this page" navigation
    headers: [
      { id: "platform-overview", text: "Platform Overview" },
      { id: "when-to-use", text: "When to use AI vs Editor" },
      { id: "navigation-structure", text: "Navigation Structure" }
    ],
    content: (
      <div className="space-y-8">
        <section id="platform-overview" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Platform Overview</h3>
          <p className="leading-7 text-slate-700">
            AIChartor is a dual-mode visualization platform designed to bridge the gap between AI generation and professional design control.
            The workflow typically moves from the <strong>AI Assistant</strong> (for rough drafts) to the <strong>Chart Editor</strong> (for fine-tuning).
          </p>
        </section>

        <section id="when-to-use" className="scroll-mt-24">
          <h3 className="text-xl font-semibold tracking-tight mb-4 text-slate-900">When to use AI vs Editor</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-indigo-50 border-indigo-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-indigo-200 rounded-md text-indigo-700"><Sparkles className="w-4 h-4" /></div>
                  <div className="font-semibold text-indigo-900">Use AI Mode When</div>
                </div>
                <ul className="list-disc pl-4 text-sm text-indigo-800 space-y-2">
                  <li>You have raw text or CSV data to parse.</li>
                  <li>You need ideas for visualization types.</li>
                  <li>You want to generate a quick prototype in seconds.</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-slate-200 rounded-md text-slate-700"><Settings className="w-4 h-4" /></div>
                  <div className="font-semibold text-slate-900">Use Editor Mode When</div>
                </div>
                <ul className="list-disc pl-4 text-sm text-slate-700 space-y-2">
                  <li>You need pixel-perfect axis adjustments.</li>
                  <li>You are refining brand colors and typography.</li>
                  <li>You need to add complex annotations or overlays.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="navigation-structure" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Navigation Structure</h3>
          <p className="leading-7 text-slate-700 mb-4">
            The application is divided into three primary zones accessible via the site header:
          </p>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="mt-1 h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 font-mono text-xs">/</div>
              <div>
                <strong className="block text-slate-900">Landing (AI Chat)</strong>
                <p className="text-slate-600 text-sm">The entry point. Paste your data here to start a new chat session.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="mt-1 h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 font-mono text-xs">/</div>
              <div>
                <strong className="block text-slate-900">Board</strong>
                <p className="text-slate-600 text-sm">Your personal dashboard. View, filter, and manage your saved chart history.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="mt-1 h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 font-mono text-xs">/</div>
              <div>
                <strong className="block text-slate-900">Editor</strong>
                <p className="text-slate-600 text-sm">The deep-dive configuration workspace. This is where customization happens.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    icon: Terminal,
    description: "Leverage natural language processing to generate charts instantly.",
    headers: [
      { id: "chat-workflow", text: "Chat Workflow" },
      { id: "prompt-strategies", text: "Prompt Strategies" },
      { id: "context-history", text: "Context & History" },
    ],
    content: (
      <div className="space-y-8">
        <section id="chat-workflow" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Chat Workflow</h3>
          <p className="leading-7 text-slate-700">
            The AI Assistant uses large language models to interpret your data and intent. It lives primarily in the <code>/landing</code> route.
            When you send a message, the system:
          </p>
          <ol className="list-decimal pl-6 text-slate-700 space-y-2 mt-4 marker:text-slate-500 marker:font-medium">
            <li>Analyzes your text for numerical data and categorical labels.</li>
            <li>Selects the most appropriate Chart.js visualization type (Bar, Line, Pie, etc.).</li>
            <li>Generates a complete JSON configuration for the chart.</li>
            <li>Presents an interactive preview allowing for immediate "Quick Edits".</li>
          </ol>
        </section>

        <section id="prompt-strategies" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Prompt Strategies</h3>
          <p className="leading-7 text-slate-700 mb-4">
            For the best results, structure your prompts to include both data and design intent:
          </p>
          <div className="bg-slate-900 text-slate-50 p-6 rounded-xl font-mono text-sm relative overflow-hidden">
            <div className="absolute top-3 right-3 text-xs text-slate-500 uppercase tracking-wider">Example Prompt</div>
            <p className="whitespace-pre-wrap leading-relaxed">
              "Create a stacked bar chart showing Q1-Q4 revenue for 2024.<br /><br />
              Product A: 20k, 25k, 30k, 45k.<br />
              Product B: 15k, 18k, 20k, 22k.<br /><br />
              Use a blue and green color palette and add a title 'Quarterly Performance'."
            </p>
          </div>
        </section>

        <section id="context-history" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Context & History</h3>
          <p className="leading-7 text-slate-700 text-lg">
            The chat retains context for the duration of your session. You can ask follow-up questions like
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 font-medium mx-1">"Change the colors to red"</span> or
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 font-medium mx-1">"Switch to a line chart"</span>
            without re-pasting the data.
          </p>
        </section>
      </div>
    )
  },
  {
    id: "chart-builder",
    title: "Chart Builder",
    icon: Layout,
    description: "A comprehensive visual environment for managing datasets, styling, and overlays.",
    headers: [
      { id: "core-components", text: "Core Components" },
      { id: "dataset-management", text: "Dataset Management" },
    ],
    content: (
      <div className="space-y-8">
        <section id="core-components" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Core Components</h3>
          <p className="leading-7 text-slate-700 mb-6">
            The Chart Builder (<code>/editor</code>) is organized into three main areas:
          </p>
          <ul className="space-y-6">
            <li className="flex gap-4">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold">1</div>
              <div>
                <strong className="block text-slate-900 text-lg mb-1">Left Sidebar (Config)</strong>
                <span className="text-slate-600">Contains high-level navigation tabs like Types, Design, Data, and Axes. Clicking these changes the controls in the Right Panel.</span>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold">2</div>
              <div>
                <strong className="block text-slate-900 text-lg mb-1">Center Stage (Canvas)</strong>
                <span className="text-slate-600">A resizeable area rendering the <code>ChartPreview</code>. The container supports drag handles at the bottom-right for testing responsiveness.</span>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold">3</div>
              <div>
                <strong className="block text-slate-900 text-lg mb-1">Right Panel (Detail)</strong>
                <span className="text-slate-600">Shows the specific controls for the active sidebar tab (e.g., color pickers for datasets, toggle switches for axes).</span>
              </div>
            </li>
          </ul>
        </section>

        <section id="dataset-management" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Dataset Management</h3>
          <p className="leading-7 text-slate-700">
            Accessible via the <strong>Datasets</strong> panel. Here you can manually parse CSV data, add/remove individual data points,
            and configure dataset-specific properties like <code>label</code>, <code>borderColor</code>, and <code>backgroundColor</code>.
            The editor supports multi-dataset charts (e.g., mixed line/bar charts).
          </p>
        </section>
      </div>
    )
  },
  {
    id: "editor-panels",
    title: "Editor Panels",
    icon: Code2,
    description: "Deep dive into the configuration panels available in the editor.",
    headers: [
      { id: "types-panel", text: "Types & Toggles" },
      { id: "datasets-panel", text: "Datasets & Slices" },
      { id: "design-panel", text: "Design & Styling" },
      { id: "axes-panel", text: "Axes & Scales" }
    ],
    content: (
      <div className="space-y-8">
        <p className="leading-7 text-slate-700 text-lg">
          The editor breaks down Chart.js configuration into granular, user-friendly panels.
          Each panel handles a specific slice of the configuration object.
        </p>

        <Separator className="my-6" />

        <section id="types-panel" className="scroll-mt-24">
          <div className="flex items-center gap-2 mb-3">
            <BarChart className="w-5 h-5 text-indigo-600" />
            <h3 className="text-xl font-semibold text-slate-900">Types & Toggles</h3>
          </div>
          <p className="text-slate-700 mb-4">
            Switch fundamental chart types (Bar, Line, Pie, Doughnut, Radar) and toggle high-level features like
            Stacking, Index Axis (Horizontal/Vertical), and Smooth Curves (Tension).
          </p>
        </section>

        <Separator className="bg-slate-100" />

        <section id="datasets-panel" className="scroll-mt-24">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-5 h-5 text-indigo-600" />
            <h3 className="text-xl font-semibold text-slate-900">Datasets & Slices</h3>
          </div>
          <p className="text-slate-700 mb-4">
            Manage the actual numbers and categories. Supports dynamic addition of new datasets and "slices" (data points).
            Also includes advanced options for adding <strong>Images</strong> to data points (via URL or upload).
          </p>
        </section>

        <Separator className="bg-slate-100" />

        <section id="design-panel" className="scroll-mt-24">
          <div className="flex items-center gap-2 mb-3">
            <Layout className="w-5 h-5 text-indigo-600" />
            <h3 className="text-xl font-semibold text-slate-900">Design & Styling</h3>
          </div>
          <p className="text-slate-700 mb-4">
            Global styling controls. Set the chart background color, font families, active color palette, and padding.
            Also controls the Legend position and styling.
          </p>
        </section>

        <Separator className="bg-slate-100" />

        <section id="axes-panel" className="scroll-mt-24">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 flex items-center justify-center font-mono font-bold text-indigo-600">XY</div>
            <h3 className="text-xl font-semibold text-slate-900">Axes & Scales</h3>
          </div>
          <p className="text-slate-700">
            Critical for Cartesian charts (Bar, Line). Configure Grid lines (display, colors, dash styles),
            Tick marks (fonts, rotation, currency formatting), and Titles for X/Y axes.
          </p>
        </section>
      </div>
    )
  },
  {
    id: "overlay-image-text",
    title: "Overlay Image & Text",
    icon: Layers,
    description: "Add custom images and text annotations on top of your charts for enhanced storytelling.",
    headers: [
      { id: "overlay-overview", text: "Overview" },
      { id: "image-overlays", text: "Image Overlays" },
      { id: "text-overlays", text: "Text Overlays" },
      { id: "positioning-layers", text: "Positioning & Layers" }
    ],
    content: (
      <div className="space-y-8">
        <section id="overlay-overview" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Overview</h3>
          <p className="leading-7 text-slate-700 mb-4">
            The Overlay panel allows you to add custom images and text annotations directly on top of your charts.
            This is perfect for adding logos, watermarks, callouts, data annotations, or any visual elements
            that enhance your chart's storytelling capabilities.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-indigo-50 border-indigo-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-indigo-200 rounded-md text-indigo-700"><Image className="w-4 h-4" /></div>
                  <div className="font-semibold text-indigo-900">Image Overlays</div>
                </div>
                <ul className="list-disc pl-4 text-sm text-indigo-800 space-y-1">
                  <li>Upload from local files or add via URL</li>
                  <li>Multiple shape options (rectangle, circle, rounded)</li>
                  <li>Configurable borders and sizing</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-slate-200 rounded-md text-slate-700"><TypeIcon className="w-4 h-4" /></div>
                  <div className="font-semibold text-slate-900">Text Overlays</div>
                </div>
                <ul className="list-disc pl-4 text-sm text-slate-700 space-y-1">
                  <li>Multi-line text support with wrapping</li>
                  <li>Full typography controls (font, size, color)</li>
                  <li>Background, padding, and rotation options</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="image-overlays" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Image Overlays</h3>
          <p className="leading-7 text-slate-700 mb-6">
            Add images to your chart from local files or external URLs. Each image can be fully customized with
            the following properties:
          </p>

          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-slate-900 mb-3">Adding Images</h4>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-900 border-b border-slate-100">
                    <tr>
                      <th className="p-4 font-semibold w-1/3">Method</th>
                      <th className="p-4 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-4 font-medium text-slate-900">Upload from File</td>
                      <td className="p-4 text-slate-600">Click "Choose Images" to select one or multiple images from your device. Supports all common formats (PNG, JPG, GIF, SVG).</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-4 font-medium text-slate-900">Add from URL</td>
                      <td className="p-4 text-slate-600">Paste an image URL and press Enter or click Add. Great for using images from the web.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <img src="/docs-overlay-add-image.png" alt="Add Image Panel" className="rounded-lg border border-slate-200 shadow-sm mx-auto" style={{ maxWidth: '280px' }} />
                <p className="text-center text-sm text-slate-600 mt-3">The Add Image panel with file upload and URL input options</p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-slate-900 mb-3">Image Properties</h4>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-900 border-b border-slate-100">
                    <tr>
                      <th className="p-4 font-semibold w-1/3">Property</th>
                      <th className="p-4 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-4 font-medium text-slate-900">Position (X, Y)</td>
                      <td className="p-4 text-slate-600">Set the exact pixel position of the image on the chart canvas.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-4 font-medium text-slate-900">Use Natural Size</td>
                      <td className="p-4 text-slate-600">When enabled, the image displays at its original dimensions. Toggle off to set custom width and height.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-4 font-medium text-slate-900">Shape</td>
                      <td className="p-4 text-slate-600">Choose from <strong>Rectangle</strong>, <strong>Circle</strong>, or <strong>Rounded</strong> corners for the image container.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-4 font-medium text-slate-900">Image Fit</td>
                      <td className="p-4 text-slate-600">
                        <strong>Fill:</strong> Stretch to fill container. <strong>Cover:</strong> Maintain aspect ratio, crop if needed. <strong>Contain:</strong> Fit entirely within container.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-4 font-medium text-slate-900">Border</td>
                      <td className="p-4 text-slate-600">Add a border with customizable width (0-10px) and color.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-4 font-medium text-slate-900">Layer Order</td>
                      <td className="p-4 text-slate-600">Control stacking order when multiple overlays exist. Higher values appear on top.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section id="text-overlays" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Text Overlays</h3>
          <p className="leading-7 text-slate-700 mb-6">
            Add custom text annotations anywhere on your chart. Perfect for callouts, labels, footnotes, or any textual information.
          </p>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-900 border-b border-slate-100">
                <tr>
                  <th className="p-4 font-semibold w-1/3">Property</th>
                  <th className="p-4 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-900">Text Content</td>
                  <td className="p-4 text-slate-600">Multi-line text input. Use Enter for new lines within the text box.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-900">Position (X, Y)</td>
                  <td className="p-4 text-slate-600">Precise pixel positioning on the chart canvas.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-900">Font Size & Family</td>
                  <td className="p-4 text-slate-600">Set the font size in pixels and choose from Arial, Helvetica, Times New Roman, Courier New, or Georgia.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-900">Text Color</td>
                  <td className="p-4 text-slate-600">Pick any color for the text using the color picker.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-900">Max Width</td>
                  <td className="p-4 text-slate-600">Set a maximum width for automatic text wrapping. Leave empty for no wrapping.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-900">Background</td>
                  <td className="p-4 text-slate-600">Toggle transparent background or choose a solid background color.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-900">Padding</td>
                  <td className="p-4 text-slate-600">Set horizontal (X) and vertical (Y) padding around the text (0-20px each).</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-900">Border</td>
                  <td className="p-4 text-slate-600">Add a border with customizable width and color around the text box.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-900">Rotation</td>
                  <td className="p-4 text-slate-600">Rotate the text from -180° to 180° for angled annotations.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <img src="/docs-overlay-add-text.png" alt="Add Text Panel" className="rounded-lg border border-slate-200 shadow-sm mx-auto" style={{ maxWidth: '280px' }} />
            <p className="text-center text-sm text-slate-600 mt-3">The Add Text panel with multi-line text input</p>
          </div>
        </section>

        <section id="positioning-layers" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Positioning & Layers</h3>
          <p className="leading-7 text-slate-700 mb-4">
            All overlays support precise positioning and layer management for full control over your chart's composition.
          </p>

          {/* Visual Interaction Guide */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-slate-900 mb-4">Interactive Canvas Controls</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <img src="/docs-overlay-select.jpg" alt="Select overlay" className="w-full border-b border-slate-200" />
                <div className="p-4">
                  <strong className="text-slate-900 block mb-1">1. Select</strong>
                  <p className="text-sm text-slate-600">Click on any overlay to select it. Blue handles appear around the selection boundary.</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <img src="/docs-overlay-drag.jpg" alt="Drag overlay" className="w-full border-b border-slate-200" />
                <div className="p-4">
                  <strong className="text-slate-900 block mb-1">2. Drag</strong>
                  <p className="text-sm text-slate-600">Click and hold inside the overlay, then drag to move it anywhere on the chart canvas.</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <img src="/docs-overlay-resize.jpg" alt="Resize overlay" className="w-full border-b border-slate-200" />
                <div className="p-4">
                  <strong className="text-slate-900 block mb-1">3. Resize</strong>
                  <p className="text-sm text-slate-600">Drag the corner handles to resize the overlay while maintaining full control over dimensions.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="mt-1 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 font-mono text-xs font-bold">1</div>
              <div>
                <strong className="block text-slate-900">Drag & Drop</strong>
                <p className="text-slate-600 text-sm">Select an overlay in the panel, then drag it directly on the chart canvas to reposition.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="mt-1 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 font-mono text-xs font-bold">2</div>
              <div>
                <strong className="block text-slate-900">Precise Input</strong>
                <p className="text-slate-600 text-sm">Enter exact X and Y coordinates in the panel for pixel-perfect placement.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="mt-1 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 font-mono text-xs font-bold">3</div>
              <div>
                <strong className="block text-slate-900">Layer Order (Z-Index)</strong>
                <p className="text-slate-600 text-sm">Control which overlays appear on top. Higher layer order values bring elements forward.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="mt-1 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 font-mono text-xs font-bold">4</div>
              <div>
                <strong className="block text-slate-900">Visibility Toggle</strong>
                <p className="text-slate-600 text-sm">Quickly show/hide individual overlays using the eye icon without deleting them.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="mt-1 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 font-mono text-xs font-bold">5</div>
              <div>
                <strong className="block text-slate-900">Keyboard Shortcuts</strong>
                <p className="text-slate-600 text-sm">Press <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 font-medium">ESC</code> to deselect the currently selected overlay.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  },
  {
    id: "exports",
    title: "Exports & Sharing",
    icon: Share2,
    description: "Getting your charts out of the application and into your work.",
    headers: [
      { id: "export-formats", text: "Supported Formats" },
      { id: "public-sharing", text: "Public Links" }
    ],
    content: (
      <div className="space-y-8">
        <section id="export-formats" className="scroll-mt-24">
          <h3 className="text-xl font-semibold tracking-tight mb-4 text-slate-900">Supported Formats</h3>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-900 border-b border-slate-100">
                <tr>
                  <th className="p-4 font-semibold w-1/4">Format</th>
                  <th className="p-4 font-semibold">Best Used For</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-900">PNG Image</td>
                  <td className="p-4 text-slate-600">Static reports, slide decks, social media.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-900">SVG Vector</td>
                  <td className="p-4 text-slate-600">High-resolution print media, Illustrator editing.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-900">HTML Embed</td>
                  <td className="p-4 text-slate-600">Interactive web pages. Preserves tooltips and animations.</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-900">JSON Config</td>
                  <td className="p-4 text-slate-600">Developer handoff, backups, or moving between workspaces.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="public-sharing" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Public Links</h3>
          <p className="leading-7 text-slate-700">
            You can generate a persistent public URL for any chart. These pages are SEO-optimized and include meta tags
            derived from your chart title and description, making them ideal for social sharing.
          </p>
        </section>
      </div>
    )
  },
  {
    id: "data-storage",
    title: "Data & Storage",
    icon: Database,
    description: "Understanding how AIChartor handles your data persistence.",
    headers: [
      { id: "local-vs-cloud", text: "Local vs Cloud" },
      { id: "version-history", text: "Version History" }
    ],
    content: (
      <div className="space-y-8">
        <section id="local-vs-cloud" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Local vs Cloud State</h3>
          <p className="leading-7 text-slate-700">
            The application uses a hybrid approach:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2 mt-2">
            <li><strong>Zustand Stores</strong>: Handle immediate, ephemeral state while editing (undo/redo stack, current inputs).</li>
            <li><strong>Supabase</strong>: Acts as the persistent source of truth. Every "Save" creates a new snapshot entry associated with your user account.</li>
          </ul>
        </section>

        <section id="version-history" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Version History</h3>
          <p className="leading-7 text-slate-700">
            Every time you click Save or generate a new iteration with AI, a snapshot is stored.
            You can revert to any previous state using the <strong>History Dropdown</strong> in the editor toolbar.
          </p>
        </section>
      </div>
    )
  },
  {
    id: "auth",
    title: "Authentication",
    icon: Shield,
    description: "Security model and access control.",
    headers: [
      { id: "route-protection", text: "Route Protection" }
    ],
    content: (
      <div className="space-y-8">
        <section id="route-protection" className="scroll-mt-24">
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-slate-900">Route Protection</h3>
          <p className="leading-7 text-slate-700">
            We use Next.js Middleware to protect sensitive routes.
            <code>/landing</code>, <code>/board</code>, and <code>/editor</code> require an active Supabase session.
            Unauthenticated users are automatically redirected to <code>/signin</code>.
          </p>
        </section>
      </div>
    )
  },
]

export default function DocumentationPage() {
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
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-sm">
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

          <div className="hidden md:flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer ml-4">
            <Link href="/landing">App</Link>
          </div>

          <div className="ml-auto flex w-full max-w-sm items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Search documentation..."
                className="h-9 w-full rounded-md bg-slate-100 pl-9 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
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

            <div className="mb-4 px-2">
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Guide
              </h4>
            </div>

            <nav className="flex flex-col gap-1 space-y-1">
              {guideData.map((section) => (
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
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
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
              <p className="text-sm text-slate-400 italic">Last updated: December 8, 2025</p>
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
