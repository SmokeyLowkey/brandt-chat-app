import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
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
    // Allow admins and managers to access any tenant
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
    // Allow admins and managers to access any tenant
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