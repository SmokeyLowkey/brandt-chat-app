import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendChatMessage, ChatMessage, ComponentData } from "@/utils/chat-processing";

export async function POST(
  request: NextRequest,
  context: { params: { tenantId: string } }
) {
  try {
    // Access params inside async context
    const params = await context.params;
    const tenantId = params.tenantId;

    // Get the current user session
    const session = await getServerSession(authOptions);

    // Check if the user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if the user has access to this tenant
    // Allow admins to access any tenant, but restrict other users to their assigned tenant
    if (session.user.role !== "ADMIN" && session.user.tenantId !== tenantId) {
      return NextResponse.json(
        { error: "Forbidden: You don't have access to this tenant" },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { message, conversationId, isRetry } = body;

    // Validate the request
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    let conversation;
    let chatHistory: ChatMessage[] = [];

    // If conversationId is provided, fetch the existing conversation
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId,
          tenantId: tenantId,
          userId: session.user.id,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      // Convert messages to ChatMessage format
      chatHistory = conversation.messages.map(msg => ({
        role: msg.role === "USER" ? "user" : msg.role === "ASSISTANT" ? "assistant" : "system",
        content: msg.content,
        timestamp: msg.createdAt.toISOString(),
      }));
      
      // If this is a retry after fallback mode, add a system message to help maintain context
      if (isRetry) {
        // Find the main topic of conversation by analyzing recent messages
        const recentMessages = conversation.messages.slice(-4);
        let mainTopic = "";
        
        for (const msg of recentMessages) {
          if (msg.role === "USER" && msg.content.length > 20) {
            // Use the longest user message as a potential topic indicator
            if (msg.content.length > mainTopic.length) {
              mainTopic = msg.content.substring(0, 100);
            }
          }
        }
        
        // Add a system message to help the AI maintain context
        chatHistory.unshift({
          role: "system",
          content: `This is a retry after a temporary service disruption. The conversation is about: ${mainTopic}. Please maintain context and provide a relevant response to the user's latest question.`,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      // Check for recent conversations with the same message to prevent duplicates
      // This helps when users retry after timeouts
      const recentConversations = await prisma.conversation.findMany({
        where: {
          tenantId: tenantId,
          userId: session.user.id,
          createdAt: {
            // Look for conversations created in the last 5 minutes
            gte: new Date(Date.now() - 5 * 60 * 1000)
          }
        },
        include: {
          messages: {
            where: {
              role: "USER"
            },
            orderBy: {
              createdAt: "asc"
            },
            take: 1
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 5 // Check the 5 most recent conversations
      });
      
      // Look for a conversation that starts with the same message
      const existingConversation = recentConversations.find(conv =>
        conv.messages.length > 0 &&
        conv.messages[0].content.toLowerCase() === message.toLowerCase()
      );
      
      if (existingConversation) {
        // Use the existing conversation instead of creating a new one
        // console.log(`Found existing conversation with the same message: ${existingConversation.id}`);
        conversation = await prisma.conversation.findUnique({
          where: {
            id: existingConversation.id
          },
          include: {
            messages: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });
        
        // Convert messages to ChatMessage format if conversation exists
        if (conversation) {
          chatHistory = conversation.messages.map(msg => ({
            role: msg.role === "USER" ? "user" : msg.role === "ASSISTANT" ? "assistant" : "system",
            content: msg.content,
            timestamp: msg.createdAt.toISOString(),
          }));
        }
        
        // Add a system message to indicate this is a retry
        if (isRetry) {
          chatHistory.unshift({
            role: "system",
            content: `This is a retry after a temporary service disruption. The user's question is: "${message}". Please provide a relevant response.`,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        // Create a new conversation if no matching one was found
        conversation = await prisma.conversation.create({
          data: {
            title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
            tenantId: tenantId,
            userId: session.user.id,
          },
        });
        
        // If this is a retry for a new conversation, add a system message
        if (isRetry) {
          chatHistory.unshift({
            role: "system",
            content: `This is a retry after a temporary service disruption. The user's question is: "${message}". Please provide a relevant response.`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // Ensure we have a valid conversation
    if (!conversation) {
      return NextResponse.json(
        { error: "Failed to create or retrieve conversation" },
        { status: 500 }
      );
    }

    // Store the user message in the database
    await prisma.message.create({
      data: {
        role: "USER",
        content: message,
        conversationId: conversation.id,
      },
    });

    // Generate a session identifier
    const sessionId = `session_${conversation.id}_${Date.now()}`;

    // Send the message to the n8n webhook
    const response = await sendChatMessage(
      message,
      chatHistory,
      tenantId,
      session.user.id,
      sessionId // Pass the generated session ID
    );
    
    // Check if the response is in fallback mode
    const isFallbackMode = response.isFallbackMode === true;

    // Store the assistant response in the database
    await prisma.message.create({
      data: {
        role: "ASSISTANT",
        content: response.content,
        conversationId: conversation.id,
      },
    });

    // Update conversation title if it's a new conversation
    if (!conversationId && conversation && conversation.title && conversation.title.includes("...")) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { title: message.substring(0, 50) + (message.length > 50 ? "..." : "") },
      });
    }

    // Return the response with conversation info and fallback mode flag
    // Use type assertion to handle the componentData property
    const responseData = {
      content: response.content,
      role: response.role,
      timestamp: response.timestamp,
      conversationId: conversation.id,
      isFallbackMode: response.isFallbackMode === true
    };
    
    // Add componentData if it exists (using type assertion)
    if ('componentData' in response && response.componentData) {
      (responseData as any).componentData = (response as any).componentData;
    }
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error in chat API:", error);
    
    // Create a more specific error message based on the error type
    let errorMessage = "Internal server error";
    let statusCode = 500;
    
    // Check for timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      errorMessage = "Request timed out. The service is taking longer than expected to respond.";
      statusCode = 504; // Gateway Timeout
      console.error("Timeout error details:", error.message);
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('connection refused')) {
      errorMessage = "Could not connect to the chat service. The service may be down.";
      statusCode = 503; // Service Unavailable
    } else if (error.response?.status === 404 || error.message?.includes('not found')) {
      errorMessage = "The requested resource was not found.";
      statusCode = 404; // Not Found
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        isFallbackMode: true,
        content: "I'm sorry, but I'm having trouble connecting to the AI service. Please try again in a moment."
      },
      { status: statusCode }
    );
  }
}