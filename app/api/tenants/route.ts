import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/tenants - List all tenants (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only admins can list all tenants
    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return NextResponse.json(tenants);
  } catch (error) {
    console.error("[TENANTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/tenants - Create a new tenant (admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only admins can create tenants
    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { name, slug, domain, settings } = body;

    if (!name || !slug) {
      return new NextResponse("Name and slug are required", { status: 400 });
    }

    // Check if tenant with slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: {
        slug,
      },
    });

    if (existingTenant) {
      return new NextResponse("Tenant with this slug already exists", { status: 400 });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        domain,
        settings: settings || {},
      },
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("[TENANTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}