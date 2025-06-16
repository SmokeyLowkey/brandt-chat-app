import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this tenant
    if (session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch conversations for the user in this tenant
    const conversations = await prisma.conversation.findMany({
      where: {
        tenantId: tenantId,
        userId: session.user.id,
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
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this tenant
    if (session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate request body
    const ConversationSchema = z.object({
      title: z.string().optional(),
    });

    const body = await req.json();
    const validatedData = ConversationSchema.parse(body);

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        title: validatedData.title || "New conversation",
        tenantId: tenantId,
        userId: session.user.id,
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