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
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler,
  ScatterController,
  BubbleController,
  TimeScale
} from "chart.js"

// Import plugins
import { universalImagePlugin } from "./chart-store"
import { customLabelPlugin } from "./custom-label-plugin"
import exportPlugin from "./export-plugin"
import { overlayPlugin } from "./overlay-plugin"

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
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler,
  ScatterController,
  BubbleController,
  TimeScale,
  universalImagePlugin,
  customLabelPlugin,
  exportPlugin,
  overlayPlugin
)

// Verify registration in development
console.log('🟢🟢🟢 CHART.JS REGISTRATION STARTING 🟢🟢🟢')
console.log('🟢 Registered controllers:', Object.keys(ChartJS.registry.controllers))
console.log('🟢 Registered plugins:', Object.keys(ChartJS.registry.plugins))
console.log('🟢 Looking for overlayPlugin:', ChartJS.registry.plugins.overlayPlugin ? 'FOUND' : 'NOT FOUND')
console.log('🟢🟢🟢 CHART.JS REGISTRATION COMPLETED 🟢🟢🟢')

export default ChartJS 