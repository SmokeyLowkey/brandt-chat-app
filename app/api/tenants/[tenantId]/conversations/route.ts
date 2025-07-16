import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/tenants/[tenantId]/conversations
export async function GET(
  req: NextRequest,
  context: { params: { tenantId: string } }
) {
  try {
    // Access params inside async context
    const params = await context.params;
    const tenantId = params.tenantId;
    
    // Get the chat mode from the query parameters
    const { searchParams } = new URL(req.url);
    const chatMode = searchParams.get('mode') || 'aftermarket';
    
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this tenant
    // Allow admins and managers to access any tenant, but restrict other users to their assigned tenant
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER" && session.user.tenantId !== tenantId) {
      console.log(`Access denied: User ${session.user.id} (${session.user.role}) tried to access tenant ${tenantId}`);
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
        console.log(`Access denied: Manager ${session.user.id} does not have access to tenant ${tenantId}`);
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Fetch conversations for the user in this tenant
    const conversations = await prisma.conversation.findMany({
      where: {
        tenantId: tenantId,
        userId: session.user.id,
        mode: chatMode, // Filter by chat mode
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST /api/tenants/[tenantId]/conversations
export async function POST(
  req: NextRequest,
  context: { params: { tenantId: string } }
) {
  try {
    // Access params inside async context
    const params = await context.params;
    const tenantId = params.tenantId;
    
    // Get the chat mode from the query parameters
    const { searchParams } = new URL(req.url);
    const chatMode = searchParams.get('mode') || 'aftermarket';
    
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this tenant
    // Allow admins and managers to access any tenant, but restrict other users to their assigned tenant
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER" && session.user.tenantId !== tenantId) {
      console.log(`Access denied: User ${session.user.id} (${session.user.role}) tried to access tenant ${tenantId}`);
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
        console.log(`Access denied: Manager ${session.user.id} does not have access to tenant ${tenantId}`);
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Validate request body
    const ConversationSchema = z.object({
      title: z.string().optional(),
      mode: z.enum(['aftermarket', 'catalog']).optional(),
    });

    const body = await req.json();
    const validatedData = ConversationSchema.parse(body);

    // Determine the final mode to use
    const finalMode = validatedData.mode || chatMode;

    // Validate catalog chat mode access
    if (finalMode === 'catalog') {
      // Fetch the tenant to check its slug
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { slug: true }
      });

      if (!tenant || (tenant.slug !== 'brandt-cf' && tenant.slug !== 'brandt-ag')) {
        return NextResponse.json(
          { error: "Catalog chat is not available for this tenant" },
          { status: 403 }
        );
      }
    }

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        title: validatedData.title || "New conversation",
        tenantId: tenantId,
        userId: session.user.id,
        mode: finalMode,
      },
    });

    // Create initial system message if provided
    if (body.systemMessage) {
      await prisma.message.create({
        data: {
          role: "SYSTEM",
          content: body.systemMessage,
          conversationId: conversation.id,
        },
      });
    }

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}