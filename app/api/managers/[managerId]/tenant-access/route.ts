import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/managers/[managerId]/tenant-access
// List all tenants a manager has access to
export async function GET(
  req: NextRequest,
  context: { params: { managerId: string } }
) {
  try {
    const params = await context.params;
    const managerId = params.managerId;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins or the manager themselves can view their tenant access
    if (session.user.role !== "ADMIN" && session.user.id !== managerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if the user is a manager
    const manager = await prisma.user.findUnique({
      where: {
        id: managerId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!manager) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 });
    }

    if (manager.role !== "MANAGER") {
      return NextResponse.json(
        { error: "User is not a manager" },
        { status: 400 }
      );
    }

    // Get all tenants the manager has access to
    const accessEntries = await prisma.managerTenantAccess.findMany({
      where: {
        managerId: managerId,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            domain: true,
          },
        },
      },
    });

    // Extract tenant information
    const accessibleTenants = accessEntries.map((entry) => entry.tenant);

    return NextResponse.json(accessibleTenants);
  } catch (error) {
    console.error("Error fetching manager tenant access:", error);
    return NextResponse.json(
      { error: "Failed to fetch tenant access" },
      { status: 500 }
    );
  }
}

// POST /api/managers/[managerId]/tenant-access
// Grant access to a tenant for a manager
export async function POST(
  req: NextRequest,
  context: { params: { managerId: string } }
) {
  try {
    const params = await context.params;
    const managerId = params.managerId;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can grant tenant access
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate request body
    const TenantAccessSchema = z.object({
      tenantId: z.string(),
    });

    const body = await req.json();
    const { tenantId } = TenantAccessSchema.parse(body);

    // Check if the user is a manager
    const manager = await prisma.user.findUnique({
      where: {
        id: managerId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!manager) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 });
    }

    if (manager.role !== "MANAGER") {
      return NextResponse.json(
        { error: "User is not a manager" },
        { status: 400 }
      );
    }

    // Check if the tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check if access already exists
    const existingAccess = await prisma.managerTenantAccess.findUnique({
      where: {
        managerId_tenantId: {
          managerId: managerId,
          tenantId: tenantId,
        },
      },
    });

    if (existingAccess) {
      return NextResponse.json(
        { error: "Manager already has access to this tenant" },
        { status: 400 }
      );
    }

    // Grant access
    const access = await prisma.managerTenantAccess.create({
      data: {
        managerId: managerId,
        tenantId: tenantId,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(access, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error granting tenant access:", error);
    return NextResponse.json(
      { error: "Failed to grant tenant access" },
      { status: 500 }
    );
  }
}

// DELETE /api/managers/[managerId]/tenant-access?tenantId=xxx
// Revoke access to a tenant for a manager
export async function DELETE(
  req: NextRequest,
  context: { params: { managerId: string } }
) {
  try {
    const params = await context.params;
    const managerId = params.managerId;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can revoke tenant access
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the tenant ID from query parameters
    const url = new URL(req.url);
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 }
      );
    }

    // Check if the access exists
    const existingAccess = await prisma.managerTenantAccess.findUnique({
      where: {
        managerId_tenantId: {
          managerId: managerId,
          tenantId: tenantId,
        },
      },
    });

    if (!existingAccess) {
      return NextResponse.json(
        { error: "Manager does not have access to this tenant" },
        { status: 404 }
      );
    }

    // Revoke access
    await prisma.managerTenantAccess.delete({
      where: {
        managerId_tenantId: {
          managerId: managerId,
          tenantId: tenantId,
        },
      },
    });

    return NextResponse.json(
      { message: "Tenant access revoked successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error revoking tenant access:", error);
    return NextResponse.json(
      { error: "Failed to revoke tenant access" },
      { status: 500 }
    );
  }
}