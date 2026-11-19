"use client"

import React, { useState, useRef, useEffect } from "react"
import { ImagePlus, Upload, Search, Link as LinkIcon, Trash2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { checkContentSafety } from "@/lib/safety/content-filter"
import { getProxiedImageUrl } from "@/lib/utils/image-proxy-utils"
import type { UnifiedPhoto } from "@/lib/utils/stock-image-search"
import { StockImageSearch } from "./stock-image-search"

export interface AddImageResult {
  url: string
  source: "file" | "url" | "search"
  file?: File
  photo?: UnifiedPhoto
  dimensions?: { width: number; height: number }
}

interface AddImageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectImage: (result: AddImageResult) => void | Promise<void>
  title?: string
  showSearchTab?: boolean
}

export function AddImageModal({
  open,
  onOpenChange,
  onSelectImage,
  title = "Add Image",
  showSearchTab = true,
}: AddImageModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "search">("upload")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const [previewDims, setPreviewDims] = useState<{ width: number; height: number } | undefined>(undefined)
  const [inputUrl, setInputUrl] = useState("")
  const [urlError, setUrlError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const blobUrlRef = useRef<string | null>(null)

  const revokeCurrentBlob = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }

  const resetState = () => {
    revokeCurrentBlob()
    setActiveTab("upload")
    setSelectedFile(null)
    setFilePreviewUrl(null)
    setPreviewDims(undefined)
    setInputUrl("")
    setUrlError(null)
    setIsSubmitting(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  useEffect(() => {
    if (!open) {
      resetState()
    }
    return () => {
      revokeCurrentBlob()
    }
  }, [open])

  const handleFilePicked = (file: File) => {
    revokeCurrentBlob()
    const blobUrl = URL.createObjectURL(file)
    blobUrlRef.current = blobUrl

    setSelectedFile(file)
    setFilePreviewUrl(blobUrl)
    setInputUrl("")
    setUrlError(null)
    setPreviewDims(undefined)

    const img = new Image()
    img.onload = () => {
      setPreviewDims({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.src = blobUrl
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFilePicked(file)
    }
    e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      handleFilePicked(file)
    }
  }

  const handleUrlChange = (val: string) => {
    setInputUrl(val)
    if (selectedFile || filePreviewUrl) {
      revokeCurrentBlob()
      setSelectedFile(null)
      setFilePreviewUrl(null)
      setPreviewDims(undefined)
    }
    const trimmed = val.trim()
    if (!trimmed) {
      setUrlError(null)
      return
    }
    const safety = checkContentSafety(trimmed)
    if (safety.isDisallowed) {
      setUrlError("This image URL contains restricted or adult keywords.")
    } else {
      setUrlError(null)
    }
  }

  const trimmedUrl = inputUrl.trim()
  const canConfirmUploadTab =
    !isSubmitting &&
    ((Boolean(selectedFile) && Boolean(filePreviewUrl)) ||
      (Boolean(trimmedUrl) && !urlError))

  const handleConfirmUpload = async () => {
    if (!canConfirmUploadTab) return
    setIsSubmitting(true)
    try {
      if (selectedFile && filePreviewUrl) {
        // Detach blob ownership so caller (e.g. decorationFileRegistry) can use it if needed;
        // resetState won't revoke if we clear ref only when caller owns blob, or callers use file directly.
        const dims = previewDims
        const file = selectedFile
        const url = filePreviewUrl
        blobUrlRef.current = null
        await onSelectImage({
          url,
          source: "file",
          file,
          dimensions: dims,
        })
      } else if (trimmedUrl && !urlError) {
        await onSelectImage({
          url: trimmedUrl,
          source: "url",
        })
      }
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSearchSelect = async (photo: UnifiedPhoto) => {
    setIsSubmitting(true)
    try {
      await onSelectImage({
        url: photo.fullUrl,
        source: "search",
        photo,
        dimensions: { width: photo.width, height: photo.height },
      })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const activePreviewSrc = filePreviewUrl || (trimmedUrl && !urlError ? getProxiedImageUrl(trimmedUrl) : null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        forceBodyPortal
        disableAnimation
        className={cn(
          "w-[calc(100vw-16px)] max-w-[420px] flex flex-col overflow-hidden p-3 min-[340px]:p-4 gap-3 bg-white border-slate-200 rounded-xl shadow-sm",
          showSearchTab ? "h-[min(460px,88dvh)]" : "h-[min(410px,88dvh)]"
        )}
      >
        <DialogHeader className="text-left space-y-0.5 pr-6 shrink-0">
          <DialogTitle className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <ImagePlus className="w-4 h-4 text-slate-700 shrink-0" />
            <span className="truncate">{title}</span>
          </DialogTitle>
        </DialogHeader>

        {showSearchTab && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={cn(
                "py-1.5 px-1.5 rounded-md text-[11px] min-[320px]:text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer min-w-0",
                activeTab === "upload"
                  ? "bg-white text-slate-900 font-semibold border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Upload Image</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("search")}
              className={cn(
                "py-1.5 px-1.5 rounded-md text-[11px] min-[320px]:text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer min-w-0",
                activeTab === "search"
                  ? "bg-white text-slate-900 font-semibold border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Search Image</span>
            </button>
          </div>
        )}

        {activeTab === "upload" && (
          <div className="flex-1 min-h-0 flex flex-col justify-between gap-2 min-w-0">
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-0.5">
              {/* Local File Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 rounded-lg p-3 min-[340px]:p-4 text-center cursor-pointer space-y-1.5"
                >
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center mx-auto">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-800 truncate">
                      {selectedFile ? selectedFile.name : "Upload from device"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Click or drop PNG, JPG, WebP, SVG
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Image URL */}
              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                  <LinkIcon className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>Image URL</span>
                </Label>
                <Input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canConfirmUploadTab) {
                      e.preventDefault()
                      handleConfirmUpload()
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="h-8 text-xs border-slate-200 bg-white min-w-0"
                />
                {urlError && (
                  <p className="text-[11px] text-red-600">{urlError}</p>
                )}
              </div>

              {/* Compact Preview */}
              {activePreviewSrc && (
                <div className="relative h-28 min-[340px]:h-32 w-full rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                  <img
                    src={activePreviewSrc}
                    alt="Preview"
                    crossOrigin="anonymous"
                    className="max-w-full max-h-full object-contain p-1.5"
                    onError={(e) => {
                      const img = e.currentTarget
                      img.style.display = "none"
                      const fallback = img.nextElementSibling as HTMLElement | null
                      if (fallback) fallback.style.display = "flex"
                    }}
                    onLoad={(e) => {
                      const img = e.currentTarget
                      img.style.display = "block"
                      const fallback = img.nextElementSibling as HTMLElement | null
                      if (fallback) fallback.style.display = "none"
                    }}
                  />
                  <div className="hidden items-center gap-1.5 text-xs text-slate-400">
                    <ImageIcon className="w-4 h-4" />
                    <span>Preview unavailable</span>
                  </div>
                  {previewDims && (
                    <span className="absolute bottom-1.5 left-1.5 bg-slate-900/75 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                      {previewDims.width} × {previewDims.height}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      revokeCurrentBlob()
                      setSelectedFile(null)
                      setFilePreviewUrl(null)
                      setPreviewDims(undefined)
                      setInputUrl("")
                      setUrlError(null)
                    }}
                    className="absolute top-1.5 right-1.5 bg-white border border-slate-200 text-slate-600 hover:text-red-600 p-1 rounded-md cursor-pointer"
                    title="Clear"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <DialogFooter className="flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 text-xs text-slate-600"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!canConfirmUploadTab}
                onClick={handleConfirmUpload}
                className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white px-3.5"
              >
                {isSubmitting ? "Adding..." : "Add Image"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {showSearchTab && activeTab === "search" && (
          <StockImageSearch onSelectPhoto={handleSearchSelect} />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface AddImageButtonProps {
  onSelectImage: (result: AddImageResult) => void | Promise<void>
  label?: string
  modalTitle?: string
  showSearchTab?: boolean
  disabled?: boolean
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function AddImageButton({
  onSelectImage,
  label = "Add Image",
  modalTitle = "Add Image",
  showSearchTab = true,
  disabled = false,
  variant = "outline",
  size = "sm",
  className,
}: AddImageButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn("h-8 text-xs min-w-0 cursor-pointer", className)}
      >
        <ImagePlus className="h-3.5 w-3.5 mr-1.5 shrink-0" />
        <span className="truncate">{label}</span>
      </Button>
      <AddImageModal
        open={open}
        onOpenChange={setOpen}
        onSelectImage={onSelectImage}
        title={modalTitle}
        showSearchTab={showSearchTab}
      />
    </>
  )
}
