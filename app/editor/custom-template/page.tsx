"use client"

import React, { useEffect } from "react"
import { CustomTemplateBuilder } from "@/components/custom-template-builder"
import { useSearchParams } from "next/navigation"
import { useTemplateStore } from "@/lib/template-store"

export default function CustomTemplatePage() {
  const params = useSearchParams()
  const id = params.get('id')
  const { templates, setCurrentTemplate } = useTemplateStore()
  useEffect(()=>{
    if (id) {
      const t = templates.find(t=>t.id===id)
      if (t) setCurrentTemplate({ ...t })
    }
  },[id, templates, setCurrentTemplate])
  return (
    <div className="w-full h-[calc(100vh-0px)]">
      <CustomTemplateBuilder />
    </div>
  )
}


