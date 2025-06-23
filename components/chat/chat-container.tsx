"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTenant } from "@/providers/tenant-provider";
import { Card, CardContent } from "@/components/ui/card";
import ChatHistoryPanel from "@/components/chat/chat-history-panel";
import ChatMessage from "@/components/chat/chat-message";
import TypingIndicator from "@/components/chat/typing-indicator";
import ChatInput from "@/components/chat/chat-input";

import { ComponentData } from "@/utils/chat-processing";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  componentData?: ComponentData;
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
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [queryType, setQueryType] = useState<string>("general");
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
        // Extract componentData from jsonData if it exists
        componentData: msg.jsonData?.componentData || undefined
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
  const sendMessage = async (messageText: string, isRetry = false) => {
    if (!messageText.trim() || !session || !tenantId) return;
    
    // Store the last user message for potential retries
    if (!isRetry) {
      setLastUserMessage(messageText);
      setRetryCount(0);
    } else {
      setIsRetrying(true);
    }
    
    setIsLoading(true);
    setLoadingStartTime(Date.now());
    
    // Try to determine query type for more relevant waiting messages
    const lowerMessage = messageText.toLowerCase();
    if (lowerMessage.includes("part") || lowerMessage.includes("number") || lowerMessage.includes("pn")) {
      setQueryType("parts");
    } else if (lowerMessage.includes("truck") || lowerMessage.includes("vehicle") || lowerMessage.includes("engine")) {
      setQueryType("vehicle");
    } else if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("quote")) {
      setQueryType("pricing");
    } else {
      setQueryType("general");
    }

    try {
      // Send message to API with increased timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout
      
      const response = await fetch(`/api/tenants/${tenantId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          conversationId: selectedConversationId,
          isRetry: isRetry
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to get response from chat API');
      }

      // Get the response from the API
      const responseData = await response.json();

      // Check if we're in fallback mode
      if (responseData.isFallbackMode === true) {
        // console.log("Detected fallback mode response");
        
        // If this is already a retry and we've reached the max retry count, just show the fallback message
        if (isRetry && retryCount >= 2) {
          // console.log(`Max retry count (${retryCount}) reached, showing fallback message`);
          
          const fallbackMessage: Message = {
            role: "assistant",
            content: responseData.content,
            timestamp: new Date(),
          };
          
          setMessages((prev) => [...prev, fallbackMessage]);
          setIsRetrying(false);
        } else {
          // If we're in fallback mode, add an apologetic message and schedule a retry
          const apologeticMessage: Message = {
            role: "assistant",
            content: isRetry
              ? "I'm still having trouble connecting to the AI service. Trying again..."
              : "I apologize, but I'm having trouble connecting to the AI service. Let me try again...",
            timestamp: new Date(),
          };
          
          setMessages((prev) => [...prev, apologeticMessage]);
          
          // Increment retry count
          setRetryCount((prev) => prev + 1);
          
          // Schedule a retry after a delay
          setTimeout(() => {
            // console.log(`Retrying message, attempt ${retryCount + 1}`);
            
            // For better context preservation, if this is a short question,
            // we can enhance it with context from previous messages
            let enhancedMessage = messageText;
            
            // If it's a short question (less than 30 chars), add context from previous messages
            if (messageText.length < 30 && messages.length >= 3) {
              // Find the last user and assistant messages before this one
              const prevUserMessages = messages.filter(m => m.role === "user");
              const prevAssistantMessages = messages.filter(m => m.role === "assistant");
              
              if (prevUserMessages.length >= 2 && prevAssistantMessages.length >= 1) {
                const prevUserMessage = prevUserMessages[prevUserMessages.length - 2];
                const prevAssistantMessage = prevAssistantMessages[prevAssistantMessages.length - 1];
                
                // Create a context-enhanced message
                enhancedMessage = `Continuing our conversation about ${prevUserMessage.content.substring(0, 50)}... where you previously told me about ${prevAssistantMessage.content.substring(0, 50)}..., ${messageText}`;
                
                // console.log("Enhanced retry message with context:", enhancedMessage);
              }
            }
            
            sendMessage(enhancedMessage, true);
          }, 10000); // 10 second delay before retry
          
          setIsLoading(false);
          return;
        }
      } else if (responseData.content) {
        // Normal response with content
        const assistantMessage: Message = {
          role: "assistant",
          content: responseData.content,
          timestamp: new Date(),
          componentData: responseData.componentData
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        setIsRetrying(false);
      } else {
        // If no content, keep loading state active
        // This will show the typing animation
        // console.log("Empty response from API, keeping loading state active");
        
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
          setIsRetrying(false);
        }, 10000);
        
        // Return early to keep loading state active
        return;
      }
      
      // Update selected conversation ID if this was a new conversation
      if (!selectedConversationId && responseData.conversationId) {
        setSelectedConversationId(responseData.conversationId);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Add specific error message based on error type
      let errorContent = "I'm sorry, I encountered an error processing your request. Please try again later.";
      
      // Check if it's a timeout error
      if (error.name === 'AbortError' || error.message?.includes('timeout') || error.message?.includes('network')) {
        errorContent = "I'm sorry, the request is taking longer than expected to process. The server might be experiencing high load. Please try again in a moment.";
        
        // If this wasn't already a retry, schedule an automatic retry
        if (!isRetry && retryCount < 2) {
          errorContent = "The request is taking longer than expected. I'll automatically try again in a moment...";
          
          // Increment retry count
          setRetryCount((prev) => prev + 1);
          
          // Schedule a retry after a longer delay
          setTimeout(() => {
            sendMessage(messageText, true);
          }, 10000); // 10 second delay before retry
        }
      }
      
      const errorMessage: Message = {
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      setIsRetrying(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full max-h-screen">
      <ChatHistoryPanel
        selectedConversationId={selectedConversationId}
        onSelectConversation={loadConversation}
        onNewConversation={createNewConversation}
        onDeleteConversation={deleteConversation}
      />
      
      <div className="flex flex-col flex-1 h-full max-h-screen overflow-hidden p-3">
        <div className="mb-3 flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-800">Chat with Brandt AI</h1>
          <p className="text-sm text-gray-500">Ask questions about products, orders, or company information</p>
        </div>

        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          <Card className="flex flex-col flex-1 overflow-hidden border-gray-200 shadow-md rounded-xl">
            <CardContent className="p-1 flex flex-col flex-1">
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50 max-h-[calc(100vh-290px)]">
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
                      componentData={message.componentData}
                    />
                  );
                })}
                {isLoading && (
                  <TypingIndicator
                    isRetrying={isRetrying}
                    waitTime={loadingStartTime && Date.now() - loadingStartTime > 3000 ? 0 : 3000}
                    queryType={queryType}
                  />
                )}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}