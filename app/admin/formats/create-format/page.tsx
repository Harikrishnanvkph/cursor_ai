"use client"

import React, { useEffect, useState } from "react"
import { FormatBuilder } from "@/components/format-builder"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { useRouter } from "next/navigation"
import { dataService } from "@/lib/data-service"

export default function AdminCreateFormatPage() {
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')
  const { user, sessionVerified } = useAuth()
  const router = useRouter()
  const [editFormat, setEditFormat] = useState<any>(null)
  const [isLoadingFormat, setIsLoadingFormat] = useState(!!editId)

  // Redirect unauthenticated or non-admin users to admin sign-in
  useEffect(() => {
    if (!sessionVerified) return
    if (!user || !user.is_admin) {
      router.replace('/admin/signin?redirect=/admin/formats/create-format')
    }
  }, [user, sessionVerified, router])

  // Load format for editing if ID is provided
  useEffect(() => {
    if (!sessionVerified) return
    if (!user || !user.is_admin) return

    if (!editId) {
      setIsLoadingFormat(false)
      return
    }

    const loadFormat = async () => {
      try {
        const res = await dataService.getFormat(editId)
        if (res.error) throw new Error(res.error)
        if (res.data) {
          setEditFormat(res.data)
        }
      } catch (err) {
        console.error('Failed to load format for editing:', err)
      } finally {
        setIsLoadingFormat(false)
      }
    }

    loadFormat()
  }, [editId, sessionVerified, user])

  if (!sessionVerified || !user?.is_admin) return null

  if (isLoadingFormat) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          <span className="text-sm text-gray-400">Loading format...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen">
      <FormatBuilder adminMode editFormat={editFormat} />
    </div>
  )
}
