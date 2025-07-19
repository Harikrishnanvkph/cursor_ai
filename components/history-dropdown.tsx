"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Clock, MessageSquare } from "lucide-react";
import { useHistoryStore } from "@/lib/history-store";
import { Portal } from "@radix-ui/react-portal";

export function HistoryDropdown() {
  const [open, setOpen] = useState(false);
  const { conversations, deleteConversation, restoreConversation } = useHistoryStore();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getConversationPreview = (messages: any[]) => {
    const userMessages = messages.filter(msg => msg.role === 'user');
    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[userMessages.length - 1];
      return lastUserMessage.content.length > 40 
        ? lastUserMessage.content.slice(0, 40) + '...' 
        : lastUserMessage.content;
    }
    return 'No user messages';
  };

  return (
    <div>
      <div className="relative">
        <button
          data-history-dropdown
          onClick={() => setOpen((o) => !o)}
          className="bg-white/90 border shadow rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-semibold backdrop-blur-md whitespace-nowrap hover:bg-white transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          History ({conversations.length})
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {open && (
          <Portal>
            <div className="absolute right-0 mt-1 bg-white/95 border shadow-lg rounded-lg max-h-[60vh] w-80 overflow-y-auto z-[1000]" style={{right: '1rem', top: '3.5rem', position: 'fixed'}}>
            {conversations.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                No conversation history yet.
                <br />
                <span className="text-xs">Your chart conversations will appear here.</span>
              </div>
            ) : (
              <div className="py-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="group flex items-start justify-between gap-2 p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 transition-colors"
                    onClick={() => {
                      restoreConversation(conv.id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {conv.title}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(conv.timestamp)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {getConversationPreview(conv.messages)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {conv.messages.length} messages • {conv.snapshot.chartType} chart
                      </div>
                    </div>
                    <button
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      title="Delete conversation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          </Portal>
        )}
      </div>
    </div>
  );
}
