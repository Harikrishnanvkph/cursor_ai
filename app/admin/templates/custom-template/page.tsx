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
  const { user, sessionVerified } = useAuth()
  const router = useRouter()

  // Redirect unauthenticated or non-admin users to admin sign-in
  useEffect(() => {
    if (!sessionVerified) return
    if (!user || !user.is_admin) {
      router.replace('/admin/signin?redirect=/admin/templates/custom-template')
    }
  }, [user, sessionVerified, router])

  // Load template for editing if ID is provided
  useEffect(() => {
    if (id) {
      const t = templates.find(t => t.id === id)
      if (t) setDraftTemplate({ ...t, isCustom: true })
    }
  }, [id, templates, setDraftTemplate])

  if (!sessionVerified || !user?.is_admin) return null

  return (
    <div className="w-full h-[calc(100vh-0px)]">
      <CustomTemplateBuilder adminMode />
    </div>
  )
}
