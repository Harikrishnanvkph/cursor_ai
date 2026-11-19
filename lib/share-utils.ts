"use client"

import { dataService } from "@/lib/data-service"
import { toast } from "sonner"

export interface ResolveShareUrlOptions {
  conversationId: string
  snapshotId?: string | null
  embed?: boolean
}

/**
 * Resolves a public share URL (`/share/<share_id>`) for a saved chart.
 * Uses snapshotId directly when available, otherwise resolves via conversationId.
 */
export async function resolvePublicShareUrl({
  conversationId,
  snapshotId,
  embed = false,
}: ResolveShareUrlOptions): Promise<string> {
  const response = snapshotId
    ? await dataService.generateShareLink(snapshotId)
    : await dataService.generateShareLinkForConversation(conversationId)

  if (response.error || !response.data?.share_id) {
    throw new Error(response.error || "Failed to generate share link")
  }

  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const basePath = `/share/${response.data.share_id}`
  return `${origin}${embed ? `${basePath}?embed=true` : basePath}`
}

/**
 * Generates and copies a public share/embed link to the clipboard.
 */
export async function copyConversationShareLink(
  options: ResolveShareUrlOptions & { toastId?: string }
): Promise<string | null> {
  const { embed = false, toastId = "share-link" } = options
  try {
    toast.loading("Generating share link...", { id: toastId })
    const shareUrl = await resolvePublicShareUrl(options)
    await navigator.clipboard.writeText(shareUrl)
    toast.success(embed ? "Embed link copied to clipboard!" : "Share link copied to clipboard!", {
      id: toastId,
    })
    return shareUrl
  } catch (err: any) {
    toast.error(err?.message || "Failed to generate share link.", { id: toastId })
    console.error("Share link error:", err)
    return null
  }
}

/**
 * Generates a public share/embed link and opens it in a new tab using a popup-safe window handle.
 */
export async function openConversationShareLink(
  options: ResolveShareUrlOptions & { toastId?: string }
): Promise<void> {
  const { toastId = "share-link" } = options
  const newWindow = window.open("about:blank", "_blank")
  if (!newWindow) {
    toast.error("Pop-up blocked! Please allow popups for this site.")
    return
  }

  try {
    toast.loading("Generating share link...", { id: toastId })
    const shareUrl = await resolvePublicShareUrl(options)
    newWindow.location.href = shareUrl
    toast.dismiss(toastId)
  } catch (err: any) {
    newWindow.close()
    toast.error(err?.message || "Failed to generate share link.", { id: toastId })
    console.error("Share link open error:", err)
  }
}
