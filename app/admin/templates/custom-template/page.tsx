"use client"

import React, { useEffect } from "react"
import { CustomTemplateBuilder } from "@/components/custom-template-builder"
import { useSearchParams } from "next/navigation"
import { useTemplateStore } from "@/lib/template-store"
import { useAuth } from "@/components/auth/AuthProvider"
import { useRouter } from "next/navigation"

export default function AdminCustomTemplatePage() {
  const params = useSearchParams()
  const id = params.get('id')
  const { templates, setDraftTemplate } = useTemplateStore()
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect non-admin users
  useEffect(() => {
    if (!loading && user && !user.is_admin) {
      router.push('/')
    }
    if (!loading && !user) {
      router.push('/signin')
    }
  }, [user, loading, router])

  // Load template for editing if ID is provided
  useEffect(() => {
    if (id) {
      const t = templates.find(t => t.id === id)
      if (t) setDraftTemplate({ ...t, isCustom: true })
    }
  }, [id, templates, setDraftTemplate])

  if (loading || !user?.is_admin) return null

  return (
    <div className="w-full h-[calc(100vh-0px)]">
      <CustomTemplateBuilder adminMode />
    </div>
  )
}
