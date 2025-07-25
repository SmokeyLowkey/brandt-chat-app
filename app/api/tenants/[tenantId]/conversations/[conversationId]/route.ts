import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
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
    // Allow admins and managers to access any tenant, but restrict other users to their assigned tenant
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER" && session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // For managers, verify they have access to the tenant
    if (session.user.role === "MANAGER" && session.user.tenantId !== tenantId) {
      // Check if the manager has access to this tenant
      const managerAccess = await prisma.managerTenantAccess.findFirst({
        where: {
          managerId: session.user.id,
          tenantId: tenantId
        }
      });
      
      if (!managerAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
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
          // Explicitly include the jsonData field
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
            jsonData: true
          }
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
    // Allow admins and managers to access any tenant, but restrict other users to their assigned tenant
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER" && session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // For managers, verify they have access to the tenant
    if (session.user.role === "MANAGER" && session.user.tenantId !== tenantId) {
      // Check if the manager has access to this tenant
      const managerAccess = await prisma.managerTenantAccess.findFirst({
        where: {
          managerId: session.user.id,
          tenantId: tenantId
        }
      });
      
      if (!managerAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
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

    // Create a notification for real-time updates
    await prisma.notification.create({
      data: {
        type: "CONVERSATION_DELETED",
        title: "Conversation deleted",
        message: "A conversation has been deleted",
        metadata: {
          conversationId: conversationId,
          tenantId: tenantId,
          userId: session.user.id
        },
        tenantId: tenantId,
        userId: session.user.id,
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