"use client"

import React, { useEffect } from "react"
import { useSidebarPortal } from "@/components/sidebar-portal-context"

export interface ConfirmDialogProps {
  open: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  alternateText?: string
  onConfirm: () => void
  onCancel: () => void
  onAlternate?: () => void
  dismissible?: boolean
}

export function ConfirmDialog({
  open,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  alternateText,
  onConfirm,
  onCancel,
  onAlternate,
  dismissible = true,
}: ConfirmDialogProps) {
  const { sidebarContainer } = useSidebarPortal()

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && dismissible) {
        e.preventDefault()
        onCancel()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, dismissible, onCancel])

  if (!open) return null

  // If we're in a sidebar context, render inside the sidebar container
  const container = sidebarContainer || (typeof document !== 'undefined' ? document.body : null)

  const dialogContent = (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-black/40"
        onClick={() => (dismissible ? onCancel() : undefined)}
      />
      <div className="relative z-[131] w-[92vw] max-w-sm rounded-lg bg-white border border-gray-200 shadow-xl p-4">
        <div className="mb-2">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
        <div className="mt-4 flex items-center justify-evenly gap-2">
          <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center justify-center h-9 rounded-md bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 shadow-sm transition-colors"
            >
              {confirmText}
            </button>
          {alternateText && onAlternate && (
            <button
              type="button"
              onClick={onAlternate}
              className="inline-flex items-center justify-center h-9 rounded-md border border-orange-300 bg-white px-4 text-sm font-medium text-orange-700 hover:bg-orange-50 hover:border-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 transition-colors"
            >
              {alternateText}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center h-9 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  )

  // Portal to sidebar container if available, otherwise render normally
  if (sidebarContainer && typeof window !== 'undefined') {
    return createPortal(dialogContent, sidebarContainer)
  }

  return dialogContent
}

export default ConfirmDialog


