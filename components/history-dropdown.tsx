"use client";

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { useHistoryStore, type Conversation } from "@/lib/history-store"
import { useChatStore } from "@/lib/chat-store"
import { useChartStore } from "@/lib/chart-store"
import { History, ChevronDown, ChevronUp, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Helper to format chart/template dimensions
const formatDimensions = (width?: string, height?: string) => {
  if (!width || !height) return null;
  const cleanW = width.replace("px", "").trim();
  const cleanH = height.replace("px", "").trim();
  
  if (cleanW === "100%" || cleanW === "responsive" || cleanH === "100%") {
    return "Responsive";
  }
  return `${cleanW} × ${cleanH} px`;
};

interface HistoryDropdownProps {
  className?: string
  variant?: 'full' | 'compact' | 'inline' | 'sidebar' | 'icon-badge'
  onConversationRestored?: () => void
}

export function HistoryDropdown({ variant = 'full', className, onConversationRestored }: HistoryDropdownProps) {
  const [open, setOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  // Dropdown filter state: 'All' | 'Single Chart' | 'Group Chart' | 'Template Chart'
  const [filterType, setFilterType] = useState<'All' | 'Single Chart' | 'Group Chart' | 'Template Chart'>('All')

  const { conversations, restoreConversation, clearAllConversations, deleteConversation, loadConversationsFromBackend, loading } = useHistoryStore()
  const { startNewConversation, historyConversationId } = useChatStore()
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Reset filter when history dropdown is opened, or when historyConversationId changes (e.g. chart cleared)
  useEffect(() => {
    if (open || variant === 'sidebar') {
      setFilterType('All')
    }
  }, [open, historyConversationId, variant])

  // Load conversations from backend when user is authenticated
  useEffect(() => {
    if (user && (open || variant === 'sidebar')) {
      loadConversationsFromBackend()
    }
  }, [user, open, variant, loadConversationsFromBackend])

  // Add null check and provide default empty array
  const safeConversations = conversations || []

  // Filter conversations
  const filteredConversations = safeConversations.filter(conv => {
    if (filterType === 'All') return true;
    if (filterType === 'Template Chart') return conv.is_template_mode;
    if (filterType === 'Group Chart') return conv.chart_mode === 'grouped' && !conv.is_template_mode;
    if (filterType === 'Single Chart') return conv.chart_mode === 'single' && !conv.is_template_mode;
    return true;
  });

  const handleConversationClick = (conversationId: string) => {
    restoreConversation(conversationId)
    // Clear undo/redo stack when switching to a different conversation
    // since the undo operations from the previous conversation are no longer relevant
    try { useChartStore.temporal.getState().clear() } catch (e) { /* temporal not available */ }
    setOpen(false)

    if (onConversationRestored) {
      onConversationRestored()
    }

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

  if (variant === 'compact' || variant === 'icon-badge') {
    // Compact mode / Icon-Badge mode
    return (
      <>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            {variant === 'icon-badge' ? (
              <button
                data-history-dropdown
                aria-label="Open history"
                className={cn(
                  "relative p-1.5 transition-all duration-200 focus-visible:outline-none rounded-full bg-white shadow-sm h-9 w-9 border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300",
                  className
                )}
              >
                <History className="h-4 w-4" />
              </button>
            ) : (
              <Button
                data-history-dropdown
                aria-label="Open history"
                variant="outline"
                size="sm"
                className={cn(
                  "p-0 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800",
                  variant === 'compact' ? "h-8 w-8" : "",
                  className
                )}
              >
                <History className="h-4 w-4" />
              </Button>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-72 mt-2 rounded-lg" align="end" forceMount>
            <div className="p-2 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">Chat History</h3>
              <select
                value={filterType}
                onChange={(e: any) => setFilterType(e.target.value)}
                className="text-xs border-gray-200 rounded px-1 py-0.5 text-gray-600 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="All">All</option>
                <option value="Single Chart">Single Chart</option>
                <option value="Group Chart">Group Chart</option>
                <option value="Template Chart">Template Chart</option>
              </select>
            </div>

            <div className="max-h-64 overflow-y-auto p-1 space-y-1">
              {loading ? (
                <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No conversations yet</div>
              ) : (
                filteredConversations.map((conversation: Conversation) => {
                  const dimStr = formatDimensions(conversation.width, conversation.height);
                  return (
                    <DropdownMenuItem
                      key={conversation.id}
                      onClick={() => handleConversationClick(conversation.id)}
                      className={cn(
                        "flex items-center justify-between p-1.5 px-2 hover:bg-slate-50 cursor-pointer rounded-lg border border-transparent transition-all duration-200 text-left",
                        historyConversationId === conversation.id ? "bg-blue-50/50 border-blue-100/50" : ""
                      )}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className={cn(
                          "font-semibold text-sm truncate mb-0.5",
                          historyConversationId === conversation.id ? "text-blue-900" : "text-slate-800"
                        )}>
                          {conversation.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                          {conversation.is_template_mode ? (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/30 shrink-0">
                              Template
                            </span>
                          ) : (
                            <span className={cn(
                              "px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border shrink-0",
                              conversation.chart_mode === 'grouped'
                                ? "bg-purple-50 text-purple-700 border-purple-200/30"
                                : "bg-indigo-50 text-indigo-700 border-indigo-200/30"
                            )}>
                              {conversation.chart_mode === 'grouped' ? 'Grouped' : 'Single'}
                            </span>
                          )}
                          {dimStr && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                              <span className="font-medium text-slate-500">{dimStr}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(e, conversation.id)}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-md shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuItem>
                  );
                })
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
              className={cn(
                "px-3 text-xs border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 h-8",
                className
              )}
            >
              <History className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-72 mt-2 rounded-lg" align="end" forceMount>
            <div className="p-2 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">Chat History</h3>
              <select
                value={filterType}
                onChange={(e: any) => setFilterType(e.target.value)}
                className="text-xs border-gray-200 rounded px-1 py-0.5 text-gray-600 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="All">All</option>
                <option value="Single Chart">Single Chart</option>
                <option value="Group Chart">Group Chart</option>
                <option value="Template Chart">Template Chart</option>
              </select>
            </div>

            <div className="max-h-64 overflow-y-auto p-1 space-y-1">
              {loading ? (
                <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No conversations yet</div>
              ) : (
                filteredConversations.map((conversation: Conversation) => {
                  const dimStr = formatDimensions(conversation.width, conversation.height);
                  return (
                    <DropdownMenuItem
                      key={conversation.id}
                      onClick={() => handleConversationClick(conversation.id)}
                      className={cn(
                        "flex items-center justify-between p-1.5 px-2 hover:bg-slate-50 cursor-pointer rounded-lg border border-transparent transition-all duration-200 text-left",
                        historyConversationId === conversation.id ? "bg-blue-50/50 border-blue-100/50" : ""
                      )}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className={cn(
                          "font-semibold text-sm truncate mb-0.5",
                          historyConversationId === conversation.id ? "text-blue-900" : "text-slate-800"
                        )}>
                          {conversation.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                          {conversation.is_template_mode ? (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/30 shrink-0">
                              Template
                            </span>
                          ) : (
                            <span className={cn(
                              "px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border shrink-0",
                              conversation.chart_mode === 'grouped'
                                ? "bg-purple-50 text-purple-700 border-purple-200/30"
                                : "bg-indigo-50 text-indigo-700 border-indigo-200/30"
                            )}>
                              {conversation.chart_mode === 'grouped' ? 'Grouped' : 'Single'}
                            </span>
                          )}
                          {dimStr && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                              <span className="font-medium text-slate-500">{dimStr}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(e, conversation.id)}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-md shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuItem>
                  );
                })
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

  if (variant === 'sidebar') {
    // Sidebar mode: inline rendering for mobile/tablet sidebars without a wrapping popover
    return (
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div className="pl-[18px] pr-3 py-2 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-slate-700">
            <History className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-sm">History</span>
          </div>
          <select
            value={filterType}
            onChange={(e: any) => setFilterType(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-300 focus:outline-none transition-colors cursor-pointer"
          >
            <option value="All">All</option>
            <option value="Single Chart">Single Chart</option>
            <option value="Group Chart">Group Chart</option>
            <option value="Template Chart">Template Chart</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading history...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
              <History className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">No history yet</p>
            <p className="text-xs text-gray-500">Your conversations will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 bg-transparent">
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-1.5 space-y-1.5">
              {filteredConversations.map((conversation: Conversation) => {
                const dimStr = formatDimensions(conversation.width, conversation.height);
                const isActive = historyConversationId === conversation.id;
                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation.id)}
                    className={cn(
                      "flex items-center justify-between p-1.5 px-2.5 cursor-pointer rounded-lg border transition-all duration-200 group text-left mx-2 w-[calc(100%-16px)]",
                      isActive
                        ? "bg-blue-50/70 border-blue-200 shadow-xs"
                        : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 hover:shadow-xs"
                    )}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className={cn(
                        "font-semibold text-sm truncate mb-0.5",
                        isActive ? "text-blue-900" : "text-slate-800"
                      )}>
                        {conversation.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                        {conversation.is_template_mode ? (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/30 shrink-0">
                            Template
                          </span>
                        ) : (
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border shrink-0",
                            conversation.chart_mode === 'grouped'
                              ? "bg-purple-50 text-purple-700 border-purple-200/30"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200/30"
                          )}>
                            {conversation.chart_mode === 'grouped' ? 'Grouped' : 'Single'}
                          </span>
                        )}
                        {dimStr && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                            <span className="font-medium text-slate-500">{dimStr}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteClick(e, conversation.id)}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0 opacity-100 transition-all rounded-md"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="p-2 border-t border-slate-100 bg-slate-50/30 flex-shrink-0">
              <Button
                variant="outline"
                onClick={handleClearClick}
                className="mx-2 w-[calc(100%-16px)] flex items-center justify-center gap-1.5 text-red-600 hover:bg-red-50 border-slate-200 hover:text-red-700 hover:border-red-200 h-8 rounded-lg transition-colors text-xs font-semibold"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All History</span>
              </Button>
            </div>
          </div>
        )}

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
      </div>
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
            className="relative inline-flex items-center gap-2 h-8 px-3 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-transparent"
          >
            <History className="w-3 h-3 text-gray-700" />
            <span className="text-gray-700">
              History
            </span>
            {open ? <ChevronUp className="w-3 h-3 text-gray-700" /> : <ChevronDown className="w-3 h-3 text-gray-700" />}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-72 mt-2 rounded-lg" align="end" forceMount>
          <div className="p-2 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Chat History</h3>
            </div>
            <select
              value={filterType}
              onChange={(e: any) => setFilterType(e.target.value)}
              className="text-xs border-gray-200 rounded px-1 py-0.5 text-gray-600 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All</option>
              <option value="Single Chart">Single Chart</option>
              <option value="Group Chart">Group Chart</option>
              <option value="Template Chart">Template Chart</option>
            </select>
          </div>

          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">No chat history yet</p>
            </div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto p-1 space-y-1">
                {filteredConversations.map((conversation) => {
                  const dimStr = formatDimensions(conversation.width, conversation.height);
                  return (
                    <DropdownMenuItem
                      key={conversation.id}
                      onClick={() => handleConversationClick(conversation.id)}
                      className={cn(
                        "flex items-center justify-between p-1.5 px-2 hover:bg-slate-50 cursor-pointer rounded-lg border border-transparent transition-all duration-200 text-left",
                        historyConversationId === conversation.id ? "bg-blue-50/50 border-blue-100/50" : ""
                      )}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className={cn(
                          "font-semibold text-sm truncate mb-0.5",
                          historyConversationId === conversation.id ? "text-blue-900" : "text-slate-800"
                        )}>
                          {conversation.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                          {conversation.is_template_mode ? (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/30 shrink-0">
                              Template
                            </span>
                          ) : (
                            <span className={cn(
                              "px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border shrink-0",
                              conversation.chart_mode === 'grouped'
                                ? "bg-purple-50 text-purple-700 border-purple-200/30"
                                : "bg-indigo-50 text-indigo-700 border-indigo-200/30"
                            )}>
                              {conversation.chart_mode === 'grouped' ? 'Grouped' : 'Single'}
                            </span>
                          )}
                          {dimStr && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                              <span className="font-medium text-slate-500">{dimStr}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(e, conversation.id)}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-md shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuItem>
                  );
                })}
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