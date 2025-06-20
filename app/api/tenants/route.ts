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
    // console.error("[TENANTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/tenants - Create a new tenant (admin only)
export async function POST(req: Request) {
  // console.log("[TENANTS_POST] Received request to create tenant");
  
  try {
    const session = await getServerSession(authOptions);
    // console.log("[TENANTS_POST] Session:", session ? "Found" : "Not found");
    
    if (!session) {
      // console.log("[TENANTS_POST] Unauthorized - No session");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // console.log("[TENANTS_POST] User role:", session.user.role);
    
    // Only admins can create tenants
    if (session.user.role !== "ADMIN") {
      // console.log("[TENANTS_POST] Forbidden - Not an admin");
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    // console.log("[TENANTS_POST] Request body:", body);
    
    const { name, slug, domain, settings } = body;

    if (!name || !slug) {
      // console.log("[TENANTS_POST] Missing required fields");
      return new NextResponse("Name and slug are required", { status: 400 });
    }
    
    // Check if slug already exists
    // console.log("[TENANTS_POST] Checking if tenant with slug exists:", slug);
    const existingTenantWithSlug = await prisma.tenant.findUnique({
      where: {
        slug,
      },
    });

    if (existingTenantWithSlug) {
      // console.log("[TENANTS_POST] Tenant with slug already exists");
      return new NextResponse("Tenant with this slug already exists", { status: 400 });
    }
    
    // Process domain
    let tenantDomain = null;
    
    if (domain && domain.trim() !== "") {
      tenantDomain = domain.trim();
      // console.log("[TENANTS_POST] Using provided domain:", tenantDomain);
    } else {
      // console.log("[TENANTS_POST] No domain provided, using null");
    }

    // console.log("[TENANTS_POST] Creating new tenant");
    // Initialize default settings structure if not provided
    const defaultSettings = {
      theme: "light",
      features: {
        documentUpload: true,
        analytics: true,
      },
      documentNamespaces: [], // Empty array for admin-defined namespaces
    };

    // Ensure settings is properly formatted as JSON
    const tenantSettings = settings ? JSON.parse(JSON.stringify(settings)) : defaultSettings;
    
    // console.log("[TENANTS_POST] Settings to be used:", JSON.stringify(tenantSettings));

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        domain: tenantDomain,
        settings: tenantSettings,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
    
    // console.log("[TENANTS_POST] Tenant created successfully:", tenant.id);
    return NextResponse.json(tenant);
  } catch (error) {
    // console.error("[TENANTS_POST] Error:", error);
    // console.error("[TENANTS_POST] Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Return more specific error message
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new NextResponse(`Internal Error: ${errorMessage}`, { status: 500 });
  }
}