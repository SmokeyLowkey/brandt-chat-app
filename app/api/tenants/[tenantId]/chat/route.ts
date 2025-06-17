import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendChatMessage, ChatMessage } from "@/utils/chat-processing";

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
    const { message, conversationId } = body;

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
    } else {
      // Create a new conversation
      conversation = await prisma.conversation.create({
        data: {
          title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
          tenantId: tenantId,
          userId: session.user.id,
        },
      });
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

    // Store the assistant response in the database
    await prisma.message.create({
      data: {
        role: "ASSISTANT",
        content: response.content,
        conversationId: conversation.id,
      },
    });

    // Update conversation title if it's a new conversation
    if (!conversationId && conversation.title && conversation.title.includes("...")) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { title: message.substring(0, 50) + (message.length > 50 ? "..." : "") },
      });
    }

    // Return the response with conversation info
    return NextResponse.json({
      ...response,
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}