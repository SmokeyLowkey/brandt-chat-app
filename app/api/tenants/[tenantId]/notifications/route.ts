import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/tenants/[tenantId]/notifications
export async function GET(
  request: NextRequest,
  context: { params: { tenantId: string } }
) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tenant ID from params - make sure to await it
    const params = await context.params;
    const tenantId = params.tenantId;

    // Check if user has access to this tenant
    if (session.user.role !== "ADMIN" && session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const since = url.searchParams.get("since");
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    
    // Build query
    const query: any = {
      where: {
        tenantId: tenantId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    };
    
    // Add since filter if provided
    if (since) {
      query.where.createdAt = {
        gt: new Date(since),
      };
    }

    // Get notifications
    const notifications = await prisma.notification.findMany(query);

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: `Error fetching notifications: ${error.message}` },
      { status: 500 }
    );
  }
}

// POST /api/tenants/[tenantId]/notifications
export async function POST(
  request: NextRequest,
  context: { params: { tenantId: string } }
) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tenant ID from params - make sure to await it
    const params = await context.params;
    const tenantId = params.tenantId;

    // Check if user has access to this tenant
    if (session.user.role !== "ADMIN" && session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { type, title, message, metadata } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        metadata: metadata || {},
        tenantId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: `Error creating notification: ${error.message}` },
      { status: 500 }
    );
  }
}