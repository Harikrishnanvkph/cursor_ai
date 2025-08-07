"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useChartStore } from "./chart-store"

// Template text area types
export interface TemplateTextArea {
  id: string
  type: 'title' | 'heading' | 'custom' | 'main'
  content: string
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  style: {
    fontSize: number
    fontFamily: string
    fontWeight: string
    color: string
    textAlign: 'left' | 'center' | 'right' | 'justify'
    lineHeight: number
    letterSpacing: number
  }
  visible: boolean
}

// Template layout types
export interface TemplateLayout {
  id: string
  name: string
  description: string
  width: number
  height: number
  chartArea: {
    x: number
    y: number
    width: number
    height: number
  }
  textAreas: TemplateTextArea[]
  backgroundColor: string
  borderColor: string
  borderWidth: number
  padding: number
}

// Editor mode types
export type EditorMode = 'chart' | 'template'

// Template store interface
interface TemplateStore {
  // Current template state
  currentTemplate: TemplateLayout | null
  selectedTextAreaId: string | null
  
  // Editor mode state
  editorMode: EditorMode
  templateInBackground: TemplateLayout | null // Keep template when in chart mode
  
  // Template management
  templates: TemplateLayout[]
  setCurrentTemplate: (template: TemplateLayout | null) => void
  addTemplate: (template: TemplateLayout) => void
  updateTemplate: (id: string, updates: Partial<TemplateLayout>) => void
  deleteTemplate: (id: string) => void
  
  // Text area management
  addTextArea: (textArea: Omit<TemplateTextArea, 'id'>) => void
  updateTextArea: (id: string, updates: Partial<TemplateTextArea>) => void
  deleteTextArea: (id: string) => void
  setSelectedTextAreaId: (id: string | null) => void
  
  // Template operations
  applyTemplate: (templateId: string) => void
  resetTemplate: () => void
  
  // Mode management
  setEditorMode: (mode: EditorMode) => void
  shouldShowTemplate: () => boolean
}

// Default templates based on the wireframes
const defaultTemplates: TemplateLayout[] = [
  {
    id: "template-1",
    name: "Standard Report",
    description: "Chart with title, heading, and main explanation area",
    width: 1200,
    height: 800,
    chartArea: {
      x: 50,
      y: 120,
      width: 1100,
      height: 400
    },
    textAreas: [
      {
        id: "title-1",
        type: "title",
        content: "Chart Title",
        position: { x: 50, y: 20, width: 1100, height: 40 },
        style: {
          fontSize: 28,
          fontFamily: "Arial, sans-serif",
          fontWeight: "bold",
          color: "#000000",
          textAlign: "center",
          lineHeight: 1.2,
          letterSpacing: 0
        },
        visible: true
      },
      {
        id: "heading-1",
        type: "heading",
        content: "Subtitle or Description",
        position: { x: 50, y: 70, width: 1100, height: 30 },
        style: {
          fontSize: 16,
          fontFamily: "Arial, sans-serif",
          fontWeight: "normal",
          color: "#666666",
          textAlign: "center",
          lineHeight: 1.3,
          letterSpacing: 0
        },
        visible: true
      },
      {
        id: "main-1",
        type: "main",
        content: "Main explanation text area for detailed descriptions, analysis, or supporting information related to the chart above.",
        position: { x: 50, y: 540, width: 1100, height: 240 },
        style: {
          fontSize: 14,
          fontFamily: "Arial, sans-serif",
          fontWeight: "normal",
          color: "#333333",
          textAlign: "left",
          lineHeight: 1.5,
          letterSpacing: 0
        },
        visible: true
      }
    ],
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    padding: 20
  },
  {
    id: "template-2",
    name: "Side-by-Side Layout",
    description: "Chart on left, text information on right",
    width: 1200,
    height: 800,
    chartArea: {
      x: 50,
      y: 50,
      width: 700,
      height: 700
    },
    textAreas: [
      {
        id: "title-2",
        type: "title",
        content: "Chart Title",
        position: { x: 800, y: 50, width: 350, height: 40 },
        style: {
          fontSize: 24,
          fontFamily: "Arial, sans-serif",
          fontWeight: "bold",
          color: "#000000",
          textAlign: "left",
          lineHeight: 1.2,
          letterSpacing: 0
        },
        visible: true
      },
      {
        id: "heading-2",
        type: "heading",
        content: "Subtitle",
        position: { x: 800, y: 100, width: 350, height: 30 },
        style: {
          fontSize: 16,
          fontFamily: "Arial, sans-serif",
          fontWeight: "normal",
          color: "#666666",
          textAlign: "left",
          lineHeight: 1.3,
          letterSpacing: 0
        },
        visible: true
      },
      {
        id: "main-2",
        type: "main",
        content: "Detailed explanation and analysis of the chart data. This area provides context, insights, and supporting information.",
        position: { x: 800, y: 150, width: 350, height: 600 },
        style: {
          fontSize: 14,
          fontFamily: "Arial, sans-serif",
          fontWeight: "normal",
          color: "#333333",
          textAlign: "left",
          lineHeight: 1.6,
          letterSpacing: 0
        },
        visible: true
      }
    ],
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    padding: 20
  },
  {
    id: "template-3",
    name: "Compact Layout",
    description: "Chart with title, heading, custom text, and main explanation",
    width: 1200,
    height: 800,
    chartArea: {
      x: 400,
      y: 120,
      width: 750,
      height: 400
    },
    textAreas: [
      {
        id: "title-3",
        type: "title",
        content: "Chart Title",
        position: { x: 50, y: 20, width: 300, height: 40 },
        style: {
          fontSize: 20,
          fontFamily: "Arial, sans-serif",
          fontWeight: "bold",
          color: "#000000",
          textAlign: "left",
          lineHeight: 1.2,
          letterSpacing: 0
        },
        visible: true
      },
      {
        id: "heading-3",
        type: "heading",
        content: "Subtitle",
        position: { x: 50, y: 70, width: 300, height: 30 },
        style: {
          fontSize: 14,
          fontFamily: "Arial, sans-serif",
          fontWeight: "normal",
          color: "#666666",
          textAlign: "left",
          lineHeight: 1.3,
          letterSpacing: 0
        },
        visible: true
      },
      {
        id: "custom-3",
        type: "custom",
        content: "Custom text area for additional information or context.",
        position: { x: 50, y: 120, width: 300, height: 150 },
        style: {
          fontSize: 12,
          fontFamily: "Arial, sans-serif",
          fontWeight: "normal",
          color: "#555555",
          textAlign: "left",
          lineHeight: 1.4,
          letterSpacing: 0
        },
        visible: true
      },
      {
        id: "main-3",
        type: "main",
        content: "Main explanation text area for detailed descriptions and analysis.",
        position: { x: 50, y: 540, width: 1100, height: 240 },
        style: {
          fontSize: 14,
          fontFamily: "Arial, sans-serif",
          fontWeight: "normal",
          color: "#333333",
          textAlign: "left",
          lineHeight: 1.5,
          letterSpacing: 0
        },
        visible: true
      }
    ],
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    padding: 20
  },
  {
    id: "template-4",
    name: "Full Width Chart",
    description: "Chart spanning full width with text areas above and below",
    width: 1200,
    height: 800,
    chartArea: {
      x: 50,
      y: 120,
      width: 1100,
      height: 400
    },
    textAreas: [
      {
        id: "title-4",
        type: "title",
        content: "Chart Title",
        position: { x: 50, y: 20, width: 1100, height: 40 },
        style: {
          fontSize: 28,
          fontFamily: "Arial, sans-serif",
          fontWeight: "bold",
          color: "#000000",
          textAlign: "center",
          lineHeight: 1.2,
          letterSpacing: 0
        },
        visible: true
      },
      {
        id: "heading-4",
        type: "heading",
        content: "Subtitle or Description",
        position: { x: 50, y: 70, width: 1100, height: 30 },
        style: {
          fontSize: 16,
          fontFamily: "Arial, sans-serif",
          fontWeight: "normal",
          color: "#666666",
          textAlign: "center",
          lineHeight: 1.3,
          letterSpacing: 0
        },
        visible: true
      },
      {
        id: "main-4",
        type: "main",
        content: "Main explanation text area for detailed descriptions, analysis, or supporting information related to the chart above.",
        position: { x: 50, y: 540, width: 1100, height: 240 },
        style: {
          fontSize: 14,
          fontFamily: "Arial, sans-serif",
          fontWeight: "normal",
          color: "#333333",
          textAlign: "left",
          lineHeight: 1.5,
          letterSpacing: 0
        },
        visible: true
      }
    ],
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    padding: 20
  }
]

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set, get) => ({
      currentTemplate: null,
      selectedTextAreaId: null,
      templates: defaultTemplates,
      editorMode: 'chart',
      templateInBackground: null,
      
      setCurrentTemplate: (template) => set({ currentTemplate: template }),
      
      addTemplate: (template) => set((state) => ({
        templates: [...state.templates, template]
      })),
      
      updateTemplate: (id, updates) => set((state) => ({
        templates: state.templates.map(t => t.id === id ? { ...t, ...updates } : t),
        currentTemplate: state.currentTemplate?.id === id 
          ? { ...state.currentTemplate, ...updates }
          : state.currentTemplate
      })),
      
      deleteTemplate: (id) => set((state) => ({
        templates: state.templates.filter(t => t.id !== id),
        currentTemplate: state.currentTemplate?.id === id ? null : state.currentTemplate
      })),
      
      addTextArea: (textArea) => set((state) => {
        const newTextArea = { ...textArea, id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }
        if (state.currentTemplate) {
          return {
            currentTemplate: {
              ...state.currentTemplate,
              textAreas: [...state.currentTemplate.textAreas, newTextArea]
            }
          }
        }
        return state
      }),
      
      updateTextArea: (id, updates) => set((state) => {
        if (state.currentTemplate) {
          return {
            currentTemplate: {
              ...state.currentTemplate,
              textAreas: state.currentTemplate.textAreas.map(ta => 
                ta.id === id ? { ...ta, ...updates } : ta
              )
            }
          }
        }
        return state
      }),
      
      deleteTextArea: (id) => set((state) => {
        if (state.currentTemplate) {
          return {
            currentTemplate: {
              ...state.currentTemplate,
              textAreas: state.currentTemplate.textAreas.filter(ta => ta.id !== id)
            }
          }
        }
        return state
      }),
      
      setSelectedTextAreaId: (id) => set({ selectedTextAreaId: id }),
      
      applyTemplate: (templateId) => {
        const template = get().templates.find(t => t.id === templateId)
        if (template) {
          set({ 
            currentTemplate: { ...template },
            templateInBackground: { ...template },
            editorMode: 'template'
          })
        }
      },
      
      resetTemplate: () => {
        // Reset template state
        set({ 
          currentTemplate: null, 
          selectedTextAreaId: null,
          templateInBackground: null,
          editorMode: 'chart'
        })
        
        // Also reset chart to default state
        const chartStore = useChartStore.getState()
        chartStore.resetChart()
      },
      
      setEditorMode: (mode) => set((state) => {
        if (mode === 'template' && state.templateInBackground) {
          // Switch to template mode - show the template
          return {
            editorMode: mode,
            currentTemplate: state.templateInBackground
          }
        } else if (mode === 'chart' && state.currentTemplate) {
          // Switch to chart mode - hide template but keep it in background
          return {
            editorMode: mode,
            templateInBackground: state.currentTemplate,
            currentTemplate: null
          }
        }
        return { editorMode: mode }
      }),
      
      shouldShowTemplate: () => {
        const state = get()
        return state.editorMode === 'template' && (state.currentTemplate !== null || state.templateInBackground !== null)
      }
    }),
    {
      name: 'template-store',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return {
            currentTemplate: persistedState.currentTemplate || null,
            selectedTextAreaId: persistedState.selectedTextAreaId || null,
            templates: persistedState.templates || defaultTemplates,
            editorMode: 'chart',
            templateInBackground: null
          }
        }
        return persistedState
      }
    }
  )
) 