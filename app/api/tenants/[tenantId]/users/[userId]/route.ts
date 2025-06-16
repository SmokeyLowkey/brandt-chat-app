import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { hash } from "bcryptjs";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/tenants/[tenantId]/users/[userId] - Get a specific user
export async function GET(
  req: Request,
  { params }: { params: { tenantId: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only admins, tenant admins, or the user themselves can access user details
    if (
      session.user.role !== "ADMIN" &&
      session.user.tenantId !== params.tenantId &&
      session.user.id !== params.userId
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: params.userId,
        tenantId: params.tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        settings: true,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[TENANT_USER_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PATCH /api/tenants/[tenantId]/users/[userId] - Update a user
export async function PATCH(
  req: Request,
  { params }: { params: { tenantId: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only admins, tenant admins, or the user themselves can update user details
    const isSelf = session.user.id === params.userId;
    const isAdmin = session.user.role === "ADMIN";
    const isTenantAdmin = session.user.tenantId === params.tenantId && session.user.role === "ADMIN";

    if (!isAdmin && !isTenantAdmin && !isSelf) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role, settings } = body;

    // Regular users can only update their own name, email, password, and settings
    if (isSelf && !isAdmin && !isTenantAdmin && role) {
      return new NextResponse("Cannot update role", { status: 403 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (settings !== undefined) updateData.settings = settings;

    // Only update role if provided and user has permission
    if (role !== undefined && (isAdmin || isTenantAdmin)) {
      // Validate role
      const validRoles = ["ADMIN", "MANAGER", "SUPPORT_AGENT"];
      if (!validRoles.includes(role)) {
        return new NextResponse("Invalid role", { status: 400 });
      }
      updateData.role = role;
    }

    // Hash password if provided
    if (password) {
      updateData.password = await hash(password, 12);
    }

    const user = await prisma.user.update({
      where: {
        id: params.userId,
        tenantId: params.tenantId,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[TENANT_USER_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE /api/tenants/[tenantId]/users/[userId] - Delete a user
export async function DELETE(
  req: Request,
  { params }: { params: { tenantId: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only admins or tenant admins can delete users
    if (
      session.user.role !== "ADMIN" &&
      (session.user.tenantId !== params.tenantId || session.user.role !== "ADMIN")
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.user.delete({
      where: {
        id: params.userId,
        tenantId: params.tenantId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[TENANT_USER_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}