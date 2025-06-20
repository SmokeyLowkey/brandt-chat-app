import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/tenants/[tenantId] - Get a specific tenant
export async function GET(
  req: Request,
  context: { params: { tenantId: string } }
) {
  try {
    // Access params inside async context
    const params = await context.params;
    const tenantId = params.tenantId;
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only admins or users from the same tenant can access tenant details
    if (session.user.role !== "ADMIN" && session.user.tenantId !== tenantId) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
      include: {
        _count: {
          select: {
            users: true,
            documents: true,
            conversations: true,
          },
        },
      },
    });

    if (!tenant) {
      return new NextResponse("Tenant not found", { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("[TENANT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PATCH /api/tenants/[tenantId] - Update a tenant
export async function PATCH(
  req: Request,
  context: { params: { tenantId: string } }
) {
  try {
    // Access params inside async context
    const params = await context.params;
    const tenantId = params.tenantId;
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only admins or tenant admins can update tenant details
    if (
      session.user.role !== "ADMIN" &&
      (session.user.tenantId !== tenantId || session.user.role !== "ADMIN")
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { name, domain, settings } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (domain !== undefined) updateData.domain = domain;
    if (settings !== undefined) updateData.settings = settings;

    const tenant = await prisma.tenant.update({
      where: {
        id: tenantId,
      },
      data: updateData,
      include: {
        _count: {
          select: {
            users: true,
            documents: true,
            conversations: true,
          },
        },
      },
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("[TENANT_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE /api/tenants/[tenantId] - Delete a tenant
export async function DELETE(
  req: Request,
  context: { params: { tenantId: string } }
) {
  try {
    // Access params inside async context
    const params = await context.params;
    const tenantId = params.tenantId;
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only super admins can delete tenants
    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.tenant.delete({
      where: {
        id: tenantId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[TENANT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}