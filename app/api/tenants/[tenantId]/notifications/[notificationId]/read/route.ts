import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: { tenantId: string; notificationId: string } }
) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tenant ID and notification ID from params - make sure to await it
    const params = await context.params;
    const { tenantId, notificationId } = params;

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

    // First check if the notification exists and belongs to the tenant
    const existingNotification = await prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
    });

    if (!existingNotification) {
      console.log(`Notification ${notificationId} not found`);
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    if (existingNotification.tenantId !== tenantId) {
      console.log(`Notification ${notificationId} belongs to tenant ${existingNotification.tenantId}, not ${tenantId}`);
      return NextResponse.json({ error: "Notification not found in this tenant" }, { status: 404 });
    }

    // Mark notification as read
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json(notification);
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: `Error marking notification as read: ${error.message}` },
      { status: 500 }
    );
  }
}