"use client";

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { useHistoryStore, type Conversation } from "@/lib/history-store"
import { useChatStore } from "@/lib/chat-store"
import { History, ChevronDown, ChevronUp, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"

interface HistoryDropdownProps {
  variant?: 'full' | 'compact' | 'inline'
}

export function HistoryDropdown({ variant = 'full' }: HistoryDropdownProps) {
  const [open, setOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const { conversations, restoreConversation, clearAllConversations, deleteConversation, loadConversationsFromBackend, loading } = useHistoryStore()
  const { startNewConversation, historyConversationId, clearUndoStack } = useChatStore()
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Load conversations from backend when user is authenticated
  useEffect(() => {
    if (user && open) {
      loadConversationsFromBackend()
    }
  }, [user, open, loadConversationsFromBackend])

  // Add null check and provide default empty array
  const safeConversations = conversations || []

  const handleConversationClick = (conversationId: string) => {
    restoreConversation(conversationId)
    // Clear undo/redo stack when switching to a different conversation
    // since the undo operations from the previous conversation are no longer relevant
    clearUndoStack()
    setOpen(false)

    // Only route to landing if we're not already on a valid chart page
    // If we're on editor, docs, or other chart-related pages, stay there
    if (pathname === '/landing' || pathname === '/') {
      router.push('/landing')
    }
    // For other pages like /editor, /docs, etc., don't navigate - just restore the conversation
  }

  const handleDeleteConversation = async (conversationId: string) => {
    // Check if we're deleting the currently active conversation
    const isCurrentConversation = historyConversationId === conversationId

    try {
      await deleteConversation(conversationId)
      setDeleteConfirmId(null)
      toast.success("Conversation deleted successfully")

      // If we deleted the currently active conversation, start a new one
      // This will automatically clear the undo/redo stack since it's no longer relevant
      if (isCurrentConversation) {
        startNewConversation() // This already clears undo stack as part of startNewConversation
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      toast.error("Failed to delete conversation")
      setDeleteConfirmId(null)
    }
  }

  const handleClearHistory = async () => {
    try {
      await clearAllConversations()
      setClearConfirmOpen(false)
      setOpen(false)
      toast.success("All history cleared successfully")

      // Always start a new conversation after clearing all history
      // This will automatically clear the undo/redo stack as well
      startNewConversation()
    } catch (error) {
      console.error('Failed to clear all history:', error)
      toast.error("Failed to clear all history")
      setClearConfirmOpen(false)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation()
    setDeleteConfirmId(conversationId)
    setOpen(false) // Close dropdown when delete confirmation opens
  }

  const handleClearClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setClearConfirmOpen(true)
  }

  if (variant === 'compact') {
    // Compact mode: icon only with dropdown indicator (for collapsed sidebar)
    return (
      <>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              data-history-dropdown
              aria-label="Open history"
              variant="outline"
              size="sm"
              className="h-10 w-10 p-0 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-transparent"
            >
              <History className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-72 mt-2 rounded-lg" align="end" forceMount>
            <div className="p-2 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Chat History</h3>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
              ) : safeConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No conversations yet</div>
              ) : (
                safeConversations.map((conversation: Conversation) => (
                  <DropdownMenuItem
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation.id)}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">
                        {conversation.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {new Date(conversation.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteClick(e, conversation.id)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </DropdownMenuItem>
                ))
              )}
            </div>

            {safeConversations.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleClearClick}
                  className="flex items-center gap-2 p-2 text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="text-sm">Clear All History</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <ConfirmDialog
          open={deleteConfirmId !== null}
          onCancel={() => setDeleteConfirmId(null)}
          title="Delete Conversation"
          description="Are you sure you want to delete this conversation? This action cannot be undone."
          onConfirm={() => deleteConfirmId && handleDeleteConversation(deleteConfirmId)}
        />

        {/* Modal for Clear All Confirmation */}
        {clearConfirmOpen && (
          <ConfirmDialog
            open={clearConfirmOpen}
            onConfirm={handleClearHistory}
            onCancel={() => setClearConfirmOpen(false)}
            title="Clear History"
            description="This will permanently remove all chat history."
            confirmText="Clear All"
            cancelText="Cancel"
          />
        )}
      </>
    )
  }

  if (variant === 'inline') {
    // Inline mode: matches Save/Cancel button styling (for expanded sidebar)
    return (
      <>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              data-history-dropdown
              aria-label="Open history"
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-transparent"
            >
              <History className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-72 mt-2 rounded-lg" align="end" forceMount>
            <div className="p-2 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Chat History</h3>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
              ) : safeConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No conversations yet</div>
              ) : (
                safeConversations.map((conversation: Conversation) => (
                  <DropdownMenuItem
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation.id)}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">
                        {conversation.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {new Date(conversation.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteClick(e, conversation.id)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </DropdownMenuItem>
                ))
              )}
            </div>

            {safeConversations.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleClearClick}
                  className="flex items-center gap-2 p-2 text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="text-sm">Clear All History</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <ConfirmDialog
          open={deleteConfirmId !== null}
          onCancel={() => setDeleteConfirmId(null)}
          title="Delete Conversation"
          description="Are you sure you want to delete this conversation? This action cannot be undone."
          onConfirm={() => deleteConfirmId && handleDeleteConversation(deleteConfirmId)}
        />

        <ConfirmDialog
          open={clearConfirmOpen}
          onCancel={() => setClearConfirmOpen(false)}
          title="Clear All History"
          description="Are you sure you want to delete all conversations? This action cannot be undone."
          onConfirm={handleClearHistory}
        />
      </>
    )
  }

  // Default full variant
  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            data-history-dropdown
            aria-label="Open history"
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2 h-8 px-3 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-transparent"
          >
            <History className="w-3 h-3 text-gray-700" />
            <span className="text-gray-700">
              History {safeConversations.length > 0 && `(${safeConversations.length})`}
            </span>
            {open ? <ChevronUp className="w-3 h-3 text-gray-700" /> : <ChevronDown className="w-3 h-3 text-gray-700" />}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-72 mt-2 rounded-lg" align="end" forceMount>
          <div className="p-2 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Chat History</h3>
            <p className="text-xs text-gray-500">Your previous conversations</p>
          </div>

          {safeConversations.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">No chat history yet</p>
            </div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto">
                {safeConversations.map((conversation) => (
                  <DropdownMenuItem
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation.id)}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">
                        {conversation.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {new Date(conversation.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteClick(e, conversation.id)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </DropdownMenuItem>
                ))}
              </div>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleClearClick}
                className="flex items-center gap-2 p-2 text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-sm">Clear All History</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={deleteConfirmId !== null}
        onCancel={() => setDeleteConfirmId(null)}
        title="Delete Conversation"
        description="Are you sure you want to delete this conversation? This action cannot be undone."
        onConfirm={() => deleteConfirmId && handleDeleteConversation(deleteConfirmId)}
      />

      <ConfirmDialog
        open={clearConfirmOpen}
        onCancel={() => setClearConfirmOpen(false)}
        title="Clear All History"
        description="Are you sure you want to delete all conversations? This action cannot be undone."
        onConfirm={handleClearHistory}
      />
    </>
  )
}