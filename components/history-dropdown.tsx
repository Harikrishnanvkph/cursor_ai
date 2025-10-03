"use client";

import { useState, useEffect } from "react"
import { useHistoryStore, type Conversation } from "@/lib/history-store"
import { useChatStore } from "@/lib/chat-store"
import { History, ChevronDown, ChevronUp, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useRouter } from "next/navigation"

interface HistoryDropdownProps {
  variant?: 'full' | 'compact'
}

export function HistoryDropdown({ variant = 'full' }: HistoryDropdownProps) {
  const [open, setOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const { conversations, restoreConversation, clearAllConversations, deleteConversation } = useHistoryStore()
  const { startNewConversation, historyConversationId, clearUndoStack } = useChatStore()
  const router = useRouter()

  // Add null check and provide default empty array
  const safeConversations = conversations || []

  const handleConversationClick = (conversationId: string) => {
    restoreConversation(conversationId)
    // Clear undo/redo stack when switching to a different conversation
    // since the undo operations from the previous conversation are no longer relevant
    clearUndoStack()
    setOpen(false)
    router.push('/landing')
  }

  const handleDeleteConversation = (conversationId: string) => {
    // Check if we're deleting the currently active conversation
    const isCurrentConversation = historyConversationId === conversationId
    
    deleteConversation(conversationId)
    setDeleteConfirmId(null)
    
    // If we deleted the currently active conversation, start a new one
    // This will automatically clear the undo/redo stack since it's no longer relevant
    if (isCurrentConversation) {
      startNewConversation() // This already clears undo stack as part of startNewConversation
    }
    // Note: If it's not the current conversation, we don't clear the undo stack
    // because the user is still working on their current conversation
  }

  const handleClearHistory = () => {
    clearAllConversations()
    setClearConfirmOpen(false)
    setOpen(false)
    
    // Always start a new conversation after clearing all history
    // This will automatically clear the undo/redo stack as well
    startNewConversation()
  }

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation()
    setDeleteConfirmId(conversationId)
  }

  const handleClearClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setClearConfirmOpen(true)
  }

  if (variant === 'compact') {
    // Compact mode: icon only with dropdown indicator
    return (
      <>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              data-history-dropdown
              aria-label="Open history"
              variant="default"
              size="sm"
              className="inline-flex items-center gap-1 h-10 px-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-transparent"
            >
              <p className="text-black">History</p>
              {/* <History className="h-5 w-5 text-gray-700" /> */}
              {
                open ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />
              }
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
                    <div key={conversation.id} className="relative group">
                      {deleteConfirmId === conversation.id ? (
                        // Delete confirmation
                        <div className="p-2 bg-red-50 border border-red-200 rounded-lg m-1">
                          <p className="text-xs text-red-700 mb-2">Delete this conversation?</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleDeleteConversation(conversation.id)}
                            >
                              Yes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              No
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Normal conversation item
                        <DropdownMenuItem
                          className="cursor-pointer py-2 hover:bg-gray-50 transition-colors duration-150 pr-12"
                          onClick={() => handleConversationClick(conversation.id)}
                        >
                          <div className="flex items-center w-full">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {conversation.title || 'Untitled Chat'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {new Date(conversation.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {/* Delete button - visible on hover */}
                          <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100"
                            onClick={(e) => handleDeleteClick(e, conversation.id)}
                            title="Delete conversation"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </DropdownMenuItem>
                      )}
                    </div>
                  ))}
                </div>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="cursor-pointer py-2 text-red-600 focus:text-red-600 focus:bg-red-50 hover:bg-red-50 transition-colors duration-150"
                  onClick={handleClearClick}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span className="text-sm">Clear History</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

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

  // Full mode: text + icon + dropdown (for new chat pages)
  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
        <button
          data-history-dropdown
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium whitespace-nowrap hover:bg-gray-50 transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        >
          <History className="h-4 w-4 text-gray-700" />
          <span>History ({safeConversations.length})</span>
          {open ? <ChevronUp className="h-4 w-4 text-gray-700" /> : <ChevronDown className="h-4 w-4 text-gray-700" />}
        </button>
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
                  <div key={conversation.id} className="relative group">
                    {deleteConfirmId === conversation.id ? (
                      // Delete confirmation
                      <div className="p-2 bg-red-50 border border-red-200 rounded-lg m-1">
                        <p className="text-xs text-red-700 mb-2">Delete this conversation?</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleDeleteConversation(conversation.id)}
                          >
                            Yes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            No
                          </Button>
                        </div>
              </div>
            ) : (
                      // Normal conversation item
                      <DropdownMenuItem
                        className="cursor-pointer py-2 hover:bg-gray-50 transition-colors duration-150 pr-12"
                        onClick={() => handleConversationClick(conversation.id)}
                      >
                        <div className="flex items-center w-full">
                    <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversation.title || 'Untitled Chat'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {new Date(conversation.timestamp).toLocaleDateString()}
                            </p>
                      </div>
                    </div>
                        {/* Delete button - visible on hover */}
                    <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100"
                          onClick={(e) => handleDeleteClick(e, conversation.id)}
                      title="Delete conversation"
                    >
                          <Trash2 className="h-3 w-3" />
                    </button>
                      </DropdownMenuItem>
                    )}
                  </div>
                ))}
              </div>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                className="cursor-pointer py-2 text-red-600 focus:text-red-600 focus:bg-red-50 hover:bg-red-50 transition-colors duration-150"
                onClick={handleClearClick}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span className="text-sm">Clear History</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
