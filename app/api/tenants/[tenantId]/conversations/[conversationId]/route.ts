import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/tenants/[tenantId]/conversations/[conversationId]
export async function GET(
  req: NextRequest,
  context: { params: { tenantId: string; conversationId: string } }
) {
  try {
    // Access params inside async context
    const params = await context.params;
    const { tenantId, conversationId } = params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this tenant
    // Allow admins to access any tenant, but restrict other users to their assigned tenant
    if (session.user.role !== "ADMIN" && session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch conversation with messages
    const conversation = await prisma.conversation.findUnique({
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
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

// DELETE /api/tenants/[tenantId]/conversations/[conversationId]
export async function DELETE(
  req: NextRequest,
  context: { params: { tenantId: string; conversationId: string } }
) {
  try {
    // Access params inside async context
    const params = await context.params;
    const { tenantId, conversationId } = params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this tenant
    // Allow admins to access any tenant, but restrict other users to their assigned tenant
    if (session.user.role !== "ADMIN" && session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if conversation exists and belongs to the user
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        tenantId: tenantId,
        userId: session.user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Delete all messages in the conversation first
    await prisma.message.deleteMany({
      where: {
        conversationId: conversationId,
      },
    });

    // Delete the conversation
    await prisma.conversation.delete({
      where: {
        id: conversationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}