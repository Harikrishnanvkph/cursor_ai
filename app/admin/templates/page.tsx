"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { useRouter } from "next/navigation"
import { dataService } from "@/lib/data-service"
import { TemplateLayout, useTemplateStore } from "@/lib/template-store"
import { Button } from "@/components/ui/button"
import { LayoutTemplate, Plus, Cloud, Globe, Edit, Trash2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export default function AdminTemplatesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [templates, setTemplates] = useState<TemplateLayout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { setDraftTemplate } = useTemplateStore()

  // For deletion
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (user && !user.is_admin) {
      router.push('/')
      return
    }

    fetchTemplates()
  }, [user, router])

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      const res = await dataService.getTemplates(true)
      if (res.error) throw new Error(res.error)

      // Parse database rows into flat TemplateLayout structure
      const parsedTemplates = (res.data || []).map((t: any) => ({
        ...t.template_structure,
        id: t.id,
        name: t.name,
        description: t.description,
        is_official: t.is_official,
        isCloudTemplate: true,
        isCustom: true
      }))

      setTemplates(parsedTemplates)
    } catch (err) {
      console.error("Failed to fetch templates:", err)
      toast.error("Failed to load templates")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePushOfficial = async (id: string, isOfficial: boolean) => {
    try {
      const res = await dataService.setTemplateOfficial(id, isOfficial)
      if (res.error) throw new Error(res.error)

      toast.success(isOfficial ? "Template pushed globally!" : "Template removed from global scope")
      fetchTemplates() // Reload list
    } catch (err) {
      console.error("Failed to update template status:", err)
      toast.error("Failed to update official status")
    }
  }

  const handleEdit = (template: TemplateLayout) => {
    // template is already parsed correctly in fetchTemplates
    setDraftTemplate({ ...template, isCustom: true })
    router.push('/admin/templates/custom-template')
  }

  const handleDeleteClick = (id: string) => {
    setTemplateToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!templateToDelete) return
    try {
      const res = await dataService.deleteTemplate(templateToDelete)
      if (res.error) throw new Error(res.error)

      toast.success("Template deleted")
      fetchTemplates()
    } catch (err: any) {
      console.error("Delete failed:", err)
      toast.error(err.message || "Failed to delete template")
    } finally {
      setDeleteConfirmOpen(false)
      setTemplateToDelete(null)
    }
  }

  const createNewTemplate = () => {
    // Clear draft and let the builder initialize a new one
    useTemplateStore.getState().clearDraft()
    router.push('/admin/templates/custom-template')
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 p-4 pt-6">
      <div className="px-2 mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              title="Back to Admin"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Global Template Manager
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">Manage default and official templates for all users</p>
            </div>
          </div>

          <Button onClick={createNewTemplate} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <Card key={template.id} className="bg-gray-900 border-gray-800 flex flex-col hover:border-purple-500/30 transition-colors">
                <CardContent className="p-3 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-purple-400">
                        <LayoutTemplate className="w-5 h-5" />
                        <h3 className="font-semibold text-lg text-white line-clamp-1">{template.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                          {template.width} × {template.height}
                        </span>
                      </div>
                    </div>
                    {template.is_official && (
                      <span className="flex items-center text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        <Globe className="w-3 h-3 mr-1" /> Global
                      </span>
                    )}
                  </div>

                  {/* Template Skeleton Preview */}
                  {(() => {
                    const containerW = 280;
                    const containerH = 140;
                    const scale = Math.min(containerW / template.width, containerH / template.height, 1);
                    // Calculate a border width that results in roughly 2px visually after scaling
                    const scaledBorder = Math.max(1, 2 / scale);
                    
                    return (
                      <div className="relative w-full h-40 mb-3 bg-gray-950/50 rounded-md border border-gray-800 overflow-hidden shrink-0 flex items-center justify-center">
                        <div 
                          className="relative shadow-sm rounded-sm"
                          style={{
                            width: template.width * scale,
                            height: template.height * scale,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                        >
                          {/* Chart Area */}
                          {template.chartArea && (
                            <div 
                              className="absolute bg-blue-500/20"
                              style={{
                                left: template.chartArea.x * scale,
                                top: template.chartArea.y * scale,
                                width: template.chartArea.width * scale,
                                height: template.chartArea.height * scale,
                                border: `2px solid rgba(96, 165, 250, 0.5)`
                              }}
                            />
                          )}
                          {/* Text Areas */}
                          {template.textAreas?.map((ta) => (
                            <div 
                              key={ta.id}
                              className="absolute"
                              style={{
                                left: ta.position.x * scale,
                                top: ta.position.y * scale,
                                width: ta.position.width * scale,
                                height: ta.position.height * scale,
                                backgroundColor: ta.type === 'title' ? 'rgba(14,165,233,0.2)' : 
                                               ta.type === 'heading' ? 'rgba(22,163,74,0.2)' :
                                               ta.type === 'main' ? 'rgba(234,88,12,0.2)' : 'rgba(124,58,237,0.2)',
                                border: `2px solid ${
                                  ta.type === 'title' ? '#0ea5e9' : 
                                  ta.type === 'heading' ? '#16a34a' :
                                  ta.type === 'main' ? '#ea580c' : '#7c3aed'
                                }`,
                                opacity: ta.visible ? 1 : 0.4
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <p className="text-sm text-gray-400 flex-1 mb-4 line-clamp-2">
                    {template.description || "No description provided."}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-800">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-gray-800 hover:bg-gray-700 border-gray-700 text-white"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="w-4 h-4 mr-2 md:mr-0 lg:mr-2" />
                      <span className="hidden lg:inline">Edit</span>
                    </Button>

                    <Button
                      variant={template.is_official ? "outline" : "default"}
                      size="sm"
                      className={`flex-1 ${template.is_official ? "bg-gray-800 hover:bg-gray-700 border-gray-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                      onClick={() => handlePushOfficial(template.id, !template.is_official)}
                    >
                      <Globe className="w-4 h-4 mr-2 md:mr-0 lg:mr-2" />
                      <span className="hidden lg:inline">{template.is_official ? "Unpush" : "Push"}</span>
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-10 p-0 flex-shrink-0"
                      onClick={() => handleDeleteClick(template.id)}
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {templates.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400 bg-gray-900/50 rounded-xl border border-dashed border-gray-800">
                <LayoutTemplate className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p>No templates found. Create one to get started.</p>
              </div>
            )}
          </div>
        )}

        <ConfirmDialog
          open={deleteConfirmOpen}
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Template"
          description="Are you sure you want to delete this template? This template will be removed from all users if it is official."
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </div>
  )
}
