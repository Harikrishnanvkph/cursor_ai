"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useChartStore } from "./chart-store"

// Template text area types
export interface TemplateTextArea {
  id: string
  type: 'title' | 'heading' | 'custom' | 'main'
  content: string
  contentType?: 'text' | 'html' // Support both plain text and HTML content
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
  background?: {
    type: 'color' | 'gradient' | 'image' | 'transparent'
    color?: string
    gradientType?: 'linear' | 'radial'
    gradientDirection?: 'to right' | 'to left' | 'to top' | 'to bottom' | '135deg'
    gradientColor1?: string
    gradientColor2?: string
    opacity?: number
    imageUrl?: string
    imageFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
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
  isCustom?: boolean
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
  background?: {
    type: 'color' | 'gradient' | 'image' | 'transparent'
    color?: string
    gradientType?: 'linear' | 'radial'
    gradientDirection?: 'to right' | 'to left' | 'to top' | 'to bottom' | '135deg'
    gradientColor1?: string
    gradientColor2?: string
    opacity?: number
    imageUrl?: string
    imageFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
  }
}

// Editor mode types
export type EditorMode = 'chart' | 'template'

// Template store interface
interface ChartDimensionState {
  manualDimensions?: boolean
  responsive?: boolean
  dynamicDimension?: boolean
  width?: string | number
  height?: string | number
  maintainAspectRatio?: boolean
}

interface TemplateStore {
  // Current template state
  currentTemplate: TemplateLayout | null
  selectedTextAreaId: string | null
  // Draft template state (used for creating/editing without affecting current)
  draftTemplate: TemplateLayout | null
  setDraftTemplate: (template: TemplateLayout | null) => void
  clearDraft: () => void
  
  // Generate mode (chart or template)
  generateMode: 'chart' | 'template'
  setGenerateMode: (mode: 'chart' | 'template') => void
  
  // Editor mode state
  editorMode: EditorMode
  templateInBackground: TemplateLayout | null // Keep template when in chart mode
  chartDimensionBackup: ChartDimensionState | null // Preserve chart dimensions when switching modes
  
  // Template management
  templates: TemplateLayout[]
  setCurrentTemplate: (template: TemplateLayout | null) => void
  addTemplate: (template: TemplateLayout) => void
  updateTemplate: (id: string, updates: Partial<TemplateLayout>) => void
  deleteTemplate: (id: string) => Promise<void>
  
  // Cloud sync
  syncTemplatesFromCloud: () => Promise<void>
  isSyncing: boolean
  
  // Text area management
  addTextArea: (textArea: Omit<TemplateTextArea, 'id'>) => void
  updateTextArea: (id: string, updates: Partial<TemplateTextArea>) => void
  deleteTextArea: (id: string) => void
  setSelectedTextAreaId: (id: string | null) => void

  // Draft text area management
  addDraftTextArea: (textArea: Omit<TemplateTextArea, 'id'>) => void
  updateDraftTextArea: (id: string, updates: Partial<TemplateTextArea>) => void
  deleteDraftTextArea: (id: string) => void
  
  // Template operations
  applyTemplate: (templateId: string) => void
  resetTemplate: () => void
  
  // Content transfer from Current Cloud Template
  originalCloudTemplateContent: TemplateLayout | null // Store original Current Cloud Template content
  modifiedCloudTemplateContent: TemplateLayout | null // Store modified Current Cloud Template (if modified before switching)
  unusedContents: Array<{ type: string; content: string; style?: any }> // Content that doesn't fit in destination
  setOriginalCloudTemplateContent: (template: TemplateLayout | null) => void
  setModifiedCloudTemplateContent: (template: TemplateLayout | null) => void
  clearUnusedContents: () => void
  removeUnusedContent: (index: number) => void
  updateUnusedContent: (index: number, content: string) => void
  
  // Mode management
  setEditorMode: (mode: EditorMode) => void
  shouldShowTemplate: () => boolean
  
  // Content type preferences for AI generation
  contentTypePreferences: Record<string, 'text' | 'html'> // { textAreaId: 'text' | 'html' }
  setContentTypePreferences: (preferences: Record<string, 'text' | 'html'>) => void
  
  // Section notes for AI generation guidance
  sectionNotes: Record<string, string> // { textAreaId: "note text" }
  setSectionNotes: (notes: Record<string, string>) => void
  updateSectionNote: (textAreaId: string, note: string) => void
  clearSectionNote: (textAreaId: string) => void
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
      draftTemplate: null,
      generateMode: 'chart',
      templates: defaultTemplates,
      editorMode: 'chart',
      templateInBackground: null,
      chartDimensionBackup: null,
      isSyncing: false,
      originalCloudTemplateContent: null,
      modifiedCloudTemplateContent: null,
      contentTypePreferences: {},
      sectionNotes: {},
      unusedContents: [],
      
      setDraftTemplate: (template) => set({ draftTemplate: template }),
      clearDraft: () => set({ draftTemplate: null }),
      setGenerateMode: (mode) => set({ generateMode: mode }),

      setCurrentTemplate: (template) => {
        const state = get()
        // If setting to null, also clear content type preferences and section notes
        if (template === null) {
          set({ 
            currentTemplate: null,
            contentTypePreferences: {},
            sectionNotes: {}
          })
          return
        }
        // If this is the Current Cloud Template, store it as original source
        if (template?.id === 'current-cloud-template' && !state.originalCloudTemplateContent) {
          set({ 
            currentTemplate: template,
            originalCloudTemplateContent: { ...template } // Store original for content transfer
          })
        } else {
          set({ currentTemplate: template })
        }
      },
      
      addTemplate: (template) => set((state) => ({
        templates: [...state.templates, template]
      })),
      
      updateTemplate: (id, updates) => set((state) => ({
        templates: state.templates.map(t => t.id === id ? { ...t, ...updates } : t),
        currentTemplate: state.currentTemplate?.id === id 
          ? { ...state.currentTemplate, ...updates }
          : state.currentTemplate
      })),
      
      deleteTemplate: async (id) => {
        const state = get()
        const template = state.templates.find(t => t.id === id)
        
        // Check if this is a cloud template (UUID format)
        // If the ID is a UUID, it's definitely from cloud (Supabase generates UUIDs)
        const idStr = String(id || '').trim()
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        const isCloudTemplate = uuidRegex.test(idStr)
        
        // Delete from cloud if it's a cloud template
        if (isCloudTemplate) {
          try {
            const { dataService } = await import('./data-service')
            const { toast } = await import('sonner')
            
            const response = await dataService.deleteTemplate(id)
            
            if (response.error) {
              console.error('Failed to delete template from cloud:', response.error)
              toast.error('Template deleted locally but failed to delete from cloud')
            } else {
              toast.success('Template deleted successfully')
            }
          } catch (error: any) {
            console.error('Error deleting template from cloud:', error)
            const { toast } = await import('sonner')
            toast.error('Template deleted locally but failed to delete from cloud')
          }
        } else {
          // Local-only template deletion
          const { toast } = await import('sonner')
          toast.success('Template deleted successfully')
        }
        
        // Delete from local state
        const remaining = state.templates.filter(t => t.id !== id)
        const deletedWasCurrent = state.currentTemplate?.id === id
        const deletedWasBackground = state.templateInBackground?.id === id
        const fallback = defaultTemplates[0]

        const next: any = { templates: remaining }

        if (deletedWasCurrent) {
          next.currentTemplate = { ...fallback }
          next.templateInBackground = state.editorMode === 'template' ? { ...fallback } : state.templateInBackground

          const chartStore = useChartStore.getState()
          chartStore.updateChartConfig({
            ...chartStore.chartConfig,
            manualDimensions: true,
            width: `${fallback.chartArea.width}px`,
            height: `${fallback.chartArea.height}px`,
            responsive: false,
            maintainAspectRatio: false
          })
        } else if (deletedWasBackground) {
          next.templateInBackground = { ...fallback }
        }

        set(next)
      },
      
      addTextArea: (textArea) => set((state) => {
        const newTextArea = { ...textArea, id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }
        // Enforce uniqueness of singletons
        if (["title","heading","main"].includes(textArea.type)) {
          if (state.currentTemplate?.textAreas.some(t => t.type === textArea.type)) {
            return state
          }
        }
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
        const updateTextAreas = (template: TemplateLayout | null) => {
          if (!template) return null
          return {
            ...template,
            textAreas: template.textAreas.map(ta => 
              ta.id === id ? { ...ta, ...updates } : ta
            )
          }
        }

        // Update both currentTemplate and templateInBackground to preserve changes
        return {
          currentTemplate: updateTextAreas(state.currentTemplate),
          templateInBackground: updateTextAreas(state.templateInBackground)
        }
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

      // Draft text area operations
      addDraftTextArea: (textArea) => set((state) => {
        const newTextArea = { ...textArea, id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }
        // Enforce uniqueness of singletons
        if (["title","heading","main"].includes(textArea.type)) {
          if (state.draftTemplate?.textAreas.some(t => t.type === textArea.type)) {
            return state
          }
        }
        if (state.draftTemplate) {
          return {
            draftTemplate: {
              ...state.draftTemplate,
              textAreas: [...state.draftTemplate.textAreas, newTextArea]
            }
          }
        }
        return state
      }),
      updateDraftTextArea: (id, updates) => set((state) => {
        if (state.draftTemplate) {
          return {
            draftTemplate: {
              ...state.draftTemplate,
              textAreas: state.draftTemplate.textAreas.map(ta => 
                ta.id === id ? { ...ta, ...updates } : ta
              )
            }
          }
        }
        return state
      }),
      deleteDraftTextArea: (id) => set((state) => {
        if (state.draftTemplate) {
          return {
            draftTemplate: {
              ...state.draftTemplate,
              textAreas: state.draftTemplate.textAreas.filter(ta => ta.id !== id)
            }
          }
        }
        return state
      }),
      
      applyTemplate: (templateId) => {
        const state = get()
        const template = state.templates.find(t => t.id === templateId)
        if (!template) return
        
        // Before switching, if current template is Current Cloud Template, save its modified state
        if (state.currentTemplate?.id === 'current-cloud-template') {
          // Store the current modified version before switching away
          set({ modifiedCloudTemplateContent: { ...state.currentTemplate } })
        }
        
        // Get source content (always from Current Cloud Template if available)
        const sourceTemplate = state.originalCloudTemplateContent || state.modifiedCloudTemplateContent
        
        // If no source template, just apply the template without content transfer
        if (!sourceTemplate) {
          set({ 
            currentTemplate: { ...template },
            templateInBackground: { ...template },
            editorMode: 'template',
            unusedContents: [] // Clear unused contents
          })
          
          // Update chart dimensions
          const chartStore = useChartStore.getState()
          chartStore.updateChartConfig({
            ...chartStore.chartConfig,
            manualDimensions: true,
            width: `${template.chartArea.width}px`,
            height: `${template.chartArea.height}px`,
            responsive: false,
            maintainAspectRatio: false
          })
          return
        }
        
        // Transfer content from source to destination
        const sourceTextAreas = sourceTemplate.textAreas || []
        const destinationTextAreas = template.textAreas || []
        
        // Group source areas by type
        const sourceByType: Record<string, TemplateTextArea[]> = {}
        sourceTextAreas.forEach(area => {
          if (!sourceByType[area.type]) {
            sourceByType[area.type] = []
          }
          sourceByType[area.type].push(area)
        })
        
        // Group destination areas by type
        const destByType: Record<string, TemplateTextArea[]> = {}
        destinationTextAreas.forEach(area => {
          if (!destByType[area.type]) {
            destByType[area.type] = []
          }
          destByType[area.type].push(area)
        })
        
        // Transfer content and collect unused
        const unusedContents: Array<{ type: string; content: string; style?: any; contentType?: 'text' | 'html' }> = []
        const updatedTextAreas = destinationTextAreas.map(destArea => {
          const sourceAreas = sourceByType[destArea.type] || []
          
          if (sourceAreas.length > 0) {
            // Use first source area for this destination area
            const sourceArea = sourceAreas[0]
            // Remove used source area
            sourceByType[destArea.type] = sourceAreas.slice(1)
            
            // Preserve styles, content, AND contentType from source but adapt position to destination
            return {
              ...destArea,
              content: sourceArea.content,
              contentType: sourceArea.contentType, // IMPORTANT: Preserve contentType (html/text) from source
              style: sourceArea.style, // Preserve style from source
              // Position stays as destination (already set in template structure)
            }
          }
          
          // No matching source, keep destination as is (empty content)
          return destArea
        })
        
        // Collect remaining unused content (including contentType for proper rendering later)
        Object.keys(sourceByType).forEach(type => {
          sourceByType[type].forEach(area => {
            unusedContents.push({
              type,
              content: area.content,
              style: area.style,
              contentType: area.contentType // Include contentType in unused contents
            })
          })
        })
        
        // Apply template with transferred content
        set({ 
          currentTemplate: { 
            ...template, 
            textAreas: updatedTextAreas 
          },
          templateInBackground: { 
            ...template, 
            textAreas: updatedTextAreas 
          },
          editorMode: 'template',
          unusedContents
        })
        
        // Update chart dimensions to match template chart area
        const chartStore = useChartStore.getState()
        chartStore.updateChartConfig({
          ...chartStore.chartConfig,
          manualDimensions: true,
          width: `${template.chartArea.width}px`,
          height: `${template.chartArea.height}px`,
          responsive: false,
          maintainAspectRatio: false
        })
      },
      
      resetTemplate: () => {
        const state = get()
        if (state.currentTemplate) {
          // Find the original template to get the initial text areas
          const originalTemplate = state.templates.find(t => t.id === state.currentTemplate!.id)
          if (originalTemplate) {
            // Reset only the text areas to their initial state
            set({
              currentTemplate: {
                ...state.currentTemplate,
                textAreas: [...originalTemplate.textAreas] // Restore original text areas
              },
              // Also reset content type preferences and section notes to defaults
              contentTypePreferences: {},
              sectionNotes: {}
            })
          }
        }
      },
      
      setEditorMode: (mode) => set((state) => {
        if (mode === state.editorMode) {
          return state
        }

        const chartStore = useChartStore.getState()
        const chartConfig = chartStore.chartConfig as any

        const captureDimensions = (): ChartDimensionState => ({
          manualDimensions: chartConfig.manualDimensions,
          responsive: chartConfig.responsive,
          dynamicDimension: chartConfig.dynamicDimension,
          width: chartConfig.width,
          height: chartConfig.height,
          maintainAspectRatio: chartConfig.maintainAspectRatio
        })

        if (mode === 'template') {
          const activeTemplate =
            state.currentTemplate ||
            state.templateInBackground ||
            state.templates[0] ||
            null

          if (!activeTemplate) {
            return { editorMode: mode }
          }

          const dimensionBackup = state.chartDimensionBackup || captureDimensions()

          chartStore.updateChartConfig({
            ...chartConfig,
            manualDimensions: true,
            responsive: false,
            dynamicDimension: false,
            width: `${activeTemplate.chartArea.width}px`,
            height: `${activeTemplate.chartArea.height}px`,
            maintainAspectRatio: false
          })

          return {
            editorMode: mode,
            currentTemplate: activeTemplate,
            templateInBackground: activeTemplate,
            chartDimensionBackup: dimensionBackup
          }
        }

        if (mode === 'chart') {
          // When switching back to chart mode, we want to KEEP the dimensions
          // that were applied in template mode (which already copied the
          // template's chartArea width/height into chartConfig and enabled
          // manualDimensions). This ensures that in the Layout & Dimensions
          // section the Manual Dimensions option remains selected with the
          // template's width/height.
          //
          // So we intentionally DO NOT restore the previous backup dimensions here.
          // We simply switch the logical editorMode flag and preserve:
          // - chartConfig.width / height (already set from template)
          // - chartConfig.manualDimensions = true (from template mode)
          // - chartDimensionBackup (in case we need it for a future flow)
          // - currentTemplate (so saves still include template structure)

          return {
            editorMode: mode,
            templateInBackground: state.currentTemplate || state.templateInBackground,
            currentTemplate: state.currentTemplate,
            chartDimensionBackup: state.chartDimensionBackup
          }
        }

        return { editorMode: mode }
      }),
      
      shouldShowTemplate: () => {
        const state = get()
        return state.editorMode === 'template' && (state.currentTemplate !== null || state.templateInBackground !== null)
      },
      
      // Content transfer management
      setOriginalCloudTemplateContent: (template) => set({ originalCloudTemplateContent: template }),
      setModifiedCloudTemplateContent: (template) => set({ modifiedCloudTemplateContent: template }),
      clearUnusedContents: () => set({ unusedContents: [] }),
      
      // Content type preferences for AI generation
      setContentTypePreferences: (preferences) => set({ contentTypePreferences: preferences }),
      
      // Section notes for AI generation
      setSectionNotes: (notes) => set({ sectionNotes: notes }),
      updateSectionNote: (textAreaId, note) => set((state) => ({
        sectionNotes: {
          ...state.sectionNotes,
          [textAreaId]: note
        }
      })),
      clearSectionNote: (textAreaId) => set((state) => {
        const { [textAreaId]: _, ...rest } = state.sectionNotes
        return { sectionNotes: rest }
      }),
      
      removeUnusedContent: (index) => set((state) => ({
        unusedContents: state.unusedContents.filter((_, i) => i !== index)
      })),
      updateUnusedContent: (index, content) => set((state) => ({
        unusedContents: state.unusedContents.map((item, i) => 
          i === index ? { ...item, content } : item
        )
      })),
      
      // Sync templates from cloud (merge with local, cloud takes precedence)
      syncTemplatesFromCloud: async () => {
        const state = get()
        if (state.isSyncing) return
        
        set({ isSyncing: true })
        
        try {
          // Dynamic import to avoid circular dependencies
          const { dataService } = await import('./data-service')
          
          const response = await dataService.getTemplates(true)
          
          if (response.error) {
            console.warn('Failed to sync templates from cloud:', response.error)
            set({ isSyncing: false })
            return
          }
          
          if (response.data && response.data.length > 0) {
            // Merge cloud templates with local templates
            // Cloud templates take precedence (they have cloud IDs)
            // IMPORTANT: Put id, name, description AFTER spreading template_structure
            // to ensure cloud IDs are preserved (template_structure might have old local IDs)
            const cloudTemplates = response.data.map((t: any) => {
              const template = {
                ...t.template_structure, // Spread the complete template structure first
                id: t.id, // Override with cloud ID (this ensures UUID is preserved)
                name: t.name,
                description: t.description,
                isCustom: true
              }
              console.log('☁️ Syncing cloud template:', { cloudId: t.id, templateId: template.id, name: template.name })
              return template
            })
            
            // Get default template IDs to preserve them
            const defaultIds = new Set(defaultTemplates.map(t => t.id))
            
            // Keep default templates and merge with cloud templates
            // If a template with same ID exists in cloud, use cloud version
            const localTemplates = state.templates.filter(t => defaultIds.has(t.id))
            const cloudTemplateIds = new Set(cloudTemplates.map((t: any) => t.id))
            const localCustomTemplates = state.templates.filter(
              t => !defaultIds.has(t.id) && !cloudTemplateIds.has(t.id)
            )
            
            // Combine: defaults + cloud + local-only custom templates
            const mergedTemplates = [
              ...localTemplates,
              ...cloudTemplates,
              ...localCustomTemplates
            ]
            
            set({ 
              templates: mergedTemplates,
              isSyncing: false 
            })
            
            console.log(`✅ Synced ${cloudTemplates.length} templates from cloud`)
          } else {
            set({ isSyncing: false })
          }
        } catch (error) {
          console.error('Error syncing templates from cloud:', error)
          set({ isSyncing: false })
        }
      }
    }),
    {
      name: (() => {
        if (typeof window !== 'undefined') {
          const userId = localStorage.getItem('user-id') || 'anonymous';
          return `template-store-${userId}`;
        }
        return 'template-store-anonymous';
      })(),
      version: 2,
      migrate: (persistedState: any, version: number) => {
        // Initial structure -> v1
        if (version === 0) {
          return {
            currentTemplate: persistedState.currentTemplate || null,
            selectedTextAreaId: persistedState.selectedTextAreaId || null,
            templates: persistedState.templates || defaultTemplates,
            editorMode: 'chart',
            templateInBackground: null
          }
        }
        // v1 -> v2: ensure isCustom is set for previously saved templates
        if (version === 1) {
          const defaultIds = new Set(defaultTemplates.map(t => t.id))
          const migratedTemplates = (persistedState.templates || []).map((t: any) => {
            if (typeof t.isCustom === 'boolean') return t
            const looksCustom = String(t.id || '').startsWith('custom-') || /custom/i.test(String(t.name || '')) || !defaultIds.has(t.id)
            return { ...t, isCustom: !!looksCustom }
          })
          return {
            ...persistedState,
            templates: migratedTemplates
          }
        }
        return persistedState
      }
    }
  )
) 