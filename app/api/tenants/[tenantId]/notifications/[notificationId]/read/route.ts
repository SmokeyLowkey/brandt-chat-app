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
    if (session.user.role !== "ADMIN" && session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mark notification as read
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        tenantId,
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