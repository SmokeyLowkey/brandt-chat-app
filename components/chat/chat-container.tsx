"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTenant } from "@/providers/tenant-provider";
import { Card, CardContent } from "@/components/ui/card";
import ChatHistoryPanel from "@/components/chat/chat-history-panel";
import ChatMessage from "@/components/chat/chat-message";
import TypingIndicator from "@/components/chat/typing-indicator";
import ChatInput from "@/components/chat/chat-input";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatContainer() {
  const { data: session } = useSession();
  const { tenantId } = useTenant();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your Brandt AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset chat state when tenant changes
  useEffect(() => {
    // Reset to initial state when tenant changes
    createNewConversation();
    setSelectedConversationId(null);
  }, [tenantId]);

  // Load conversation
  const loadConversation = async (conversationId: string) => {
    if (!session || !tenantId) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/tenants/${tenantId}/conversations/${conversationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }
      
      const conversation = await response.json();
      
      // Convert messages to the format expected by the UI
      const loadedMessages: Message[] = conversation.messages.map((msg: any) => ({
        role: msg.role === "USER" ? "user" : "assistant",
        content: msg.content,
        timestamp: new Date(msg.createdAt),
      }));
      
      setMessages(loadedMessages);
      setSelectedConversationId(conversationId);
    } catch (error) {
      console.error('Error loading conversation:', error);
      
      // Show error message
      setMessages([{
        role: "assistant",
        content: "I'm sorry, I couldn't load the conversation. Please try again later.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create new conversation
  const createNewConversation = () => {
    setMessages([{
      role: "assistant",
      content: "Hello! I'm your Brandt AI assistant. How can I help you today?",
      timestamp: new Date(),
    }]);
    setSelectedConversationId(null);
  };
  
  // Delete conversation
  const deleteConversation = async (conversationId: string) => {
    if (!session || !tenantId) return;
    
    try {
      const response = await fetch(`/api/tenants/${tenantId}/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }
      
      // If the deleted conversation was selected, create a new one
      if (selectedConversationId === conversationId) {
        createNewConversation();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  // Send message to API
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !session || !tenantId) return;
    
    setIsLoading(true);

    try {
      // Send message to API
      const response = await fetch(`/api/tenants/${tenantId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          conversationId: selectedConversationId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from chat API');
      }

      // Get the response from the API
      const responseData = await response.json();

      // Only add assistant message if there's content
      if (responseData.content) {
        const assistantMessage: Message = {
          role: "assistant",
          content: responseData.content,
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // If no content, keep loading state active
        // This will show the typing animation
        console.log("Empty response from API, keeping loading state active");
        
        // Try again after a short delay
        setTimeout(() => {
          // Add a default message if we still don't have a response after 10 seconds
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "I'm processing your request. Please wait a moment...",
              timestamp: new Date(),
            }
          ]);
          setIsLoading(false);
        }, 10000);
        
        // Return early to keep loading state active
        return;
      }
      
      // Update selected conversation ID if this was a new conversation
      if (!selectedConversationId && responseData.conversationId) {
        setSelectedConversationId(responseData.conversationId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      <ChatHistoryPanel
        selectedConversationId={selectedConversationId}
        onSelectConversation={loadConversation}
        onNewConversation={createNewConversation}
        onDeleteConversation={deleteConversation}
      />
      
      <div className="flex flex-col flex-1 h-full px-4 py-3">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Chat with Brandt AI</h1>
          <p className="text-gray-500">Ask questions about products, orders, or company information</p>
        </div>

        <Card className="flex-1 overflow-hidden mb-4 border-gray-200 shadow-md rounded-xl">
          <CardContent className="p-0 h-[calc(100vh-240px)]">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
                {messages.map((message, index) => {
                  // Check if this message is from the same sender as the previous one
                  const prevMessage = index > 0 ? messages[index - 1] : null;
                  const isConsecutive = prevMessage && prevMessage.role === message.role;
                  
                  // Determine if this is the first or last message in a group
                  const isFirstInGroup = !isConsecutive;
                  const isLastInGroup = index === messages.length - 1 || messages[index + 1].role !== message.role;
                  
                  return (
                    <ChatMessage
                      key={index}
                      content={message.content}
                      role={message.role}
                      timestamp={message.timestamp}
                      isFirstInGroup={isFirstInGroup}
                      isLastInGroup={isLastInGroup}
                    />
                  );
                })}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              <ChatInput
                onSendMessage={(message) => {
                  if (!message.trim() || !session || !tenantId) return;
                  
                  // Add user message
                  const userMessage: Message = {
                    role: "user",
                    content: message,
                    timestamp: new Date(),
                  };
                  
                  setMessages((prev) => [...prev, userMessage]);
                  
                  // Send the message to the API
                  sendMessage(message);
                }}
                isLoading={isLoading}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}