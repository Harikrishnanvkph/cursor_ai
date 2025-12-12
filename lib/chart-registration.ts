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
  SubTitle,
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

// Chart.js registration completed

export default ChartJS
