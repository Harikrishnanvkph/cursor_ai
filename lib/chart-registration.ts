"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  // Controllers
  BarController,
  LineController,
  PieController,
  DoughnutController,
  PolarAreaController,
  RadarController,
  Title,
  SubTitle,
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler,
  ScatterController,
  BubbleController,
  TimeScale
} from "chart.js"

// Import plugins
import { universalImagePlugin } from "./plugins/universal-image-plugin"
import { customLabelPlugin } from "./custom-label-plugin"
import exportPlugin from "./export-plugin"
import { overlayPlugin } from "./overlay-plugin"
import { enhancedTitlePlugin } from "./enhanced-title-plugin"

// Date adapter for time scales - auto-registers with Chart.js
import 'chartjs-adapter-date-fns'

// Register all Chart.js components globally
ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  // Controllers
  BarController,
  LineController,
  PieController,
  DoughnutController,
  PolarAreaController,
  RadarController,
  Title,
  SubTitle,
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler,
  ScatterController,
  BubbleController,
  TimeScale,
  // Plugins
  universalImagePlugin,
  customLabelPlugin,
  exportPlugin,
  overlayPlugin,
  enhancedTitlePlugin
)

// Chart.js registration completed

export default ChartJS
