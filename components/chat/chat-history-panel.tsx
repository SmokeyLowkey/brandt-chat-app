"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTenant } from "@/providers/tenant-provider";
import { Button } from "@/components/ui/button";
import { PlusCircle, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatHistoryPanelProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => Promise<boolean>;
}

export default function ChatHistoryPanel({
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ChatHistoryPanelProps) {
  const { data: session } = useSession();
  const { tenantId } = useTenant();
  const { notifications } = useNotifications();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch conversations function
  const fetchConversations = useCallback(async () => {
    if (!session || !tenantId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/tenants/${tenantId}/conversations`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session, tenantId]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);
  
  // Listen for conversation deletion notifications
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    
    // Check for conversation deletion notifications
    const deletionNotifications = notifications.filter(
      notification => notification.type === "CONVERSATION_DELETED"
    );
    
    if (deletionNotifications.length > 0) {
      // Process each deletion notification
      deletionNotifications.forEach(notification => {
        const deletedConversationId = notification.metadata?.conversationId;
        
        if (deletedConversationId) {
          // Remove the deleted conversation from the list
          setConversations(prevConversations =>
            prevConversations.filter(conv => conv.id !== deletedConversationId)
          );
          
          // If the deleted conversation is currently selected, trigger a new conversation
          if (selectedConversationId === deletedConversationId) {
            onNewConversation();
          }
        }
      });
    }
  }, [notifications, selectedConversationId, onNewConversation]);

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-64 h-full flex flex-col bg-gray-50 border-r shadow-md overflow-hidden">
      <div className="p-3 border-b bg-white flex-shrink-0">
        <Button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#E31937] to-[#c01730] hover:from-[#c01730] hover:to-[#a01328] text-white shadow-md transition-all py-4 rounded-lg text-sm"
        >
          <PlusCircle className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 max-h-[calc(100vh-140px)]">
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#E31937] border-t-transparent"></div>
              <span className="text-xs text-gray-500 mt-1.5">Loading conversations...</span>
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-gray-500 p-4 flex flex-col items-center">
            <MessageSquare className="h-8 w-8 text-gray-300 mb-1.5" />
            <p className="text-xs font-medium">No conversations yet</p>
            <p className="text-xs mt-0.5">Start a new chat to begin</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "group flex items-center justify-between p-2.5 rounded-lg mb-1.5 cursor-pointer transition-all",
                selectedConversationId === conversation.id
                  ? "bg-gradient-to-r from-[#E31937] to-[#c01730] text-white shadow-md"
                  : "hover:bg-gray-100"
              )}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className={cn(
                  "flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center",
                  selectedConversationId === conversation.id
                    ? "bg-white bg-opacity-20"
                    : "bg-gray-200"
                )}>
                  <MessageSquare className={cn(
                    "h-3.5 w-3.5 flex-shrink-0",
                    selectedConversationId === conversation.id
                      ? "text-white"
                      : "text-gray-600"
                  )} />
                </div>
                <div className="overflow-hidden">
                  <div className="truncate font-medium text-sm">
                    {conversation.title || "New conversation"}
                  </div>
                  <div className={cn(
                    "text-xs truncate",
                    selectedConversationId === conversation.id
                      ? "text-white text-opacity-80"
                      : "text-gray-500"
                  )}>
                    {formatDate(conversation.updatedAt)}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
                  selectedConversationId === conversation.id
                    ? "hover:bg-white hover:bg-opacity-20 text-white"
                    : "hover:bg-gray-200 text-gray-500"
                )}
                onClick={async (e) => {
                  e.stopPropagation();
                  const success = await onDeleteConversation(conversation.id);
                  
                  // If deletion was successful, immediately update the UI
                  if (success) {
                    // Remove the conversation from the local state immediately
                    setConversations(prevConversations =>
                      prevConversations.filter(conv => conv.id !== conversation.id)
                    );
                    
                    // Also refresh the conversation list to ensure it's up-to-date
                    fetchConversations();
                  }
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}