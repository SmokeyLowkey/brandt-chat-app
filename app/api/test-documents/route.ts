import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's information
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        accessibleTenants: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all tenants the user has access to
    const accessibleTenants = [
      { id: user.tenantId, name: user.tenant.name, slug: user.tenant.slug, isHomeTenant: true },
      ...user.accessibleTenants.map(access => ({
        id: access.tenant.id,
        name: access.tenant.name,
        slug: access.tenant.slug,
        isHomeTenant: false
      }))
    ];

    // Get URL parameters
    const url = new URL(req.url);
    const tenantId = url.searchParams.get("tenantId") || user.tenantId;

    // Get documents for the specified tenant
    const documents = await prisma.document.findMany({
      where: {
        tenantId: tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            tenantId: true,
            role: true,
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Analyze document-tenant relationships
    const documentAnalysis = {
      totalDocuments: documents.length,
      documentsMatchingRequestedTenant: documents.filter(doc => doc.tenantId === tenantId).length,
      documentsCreatedByUsersFromDifferentTenant: documents.filter(doc => doc.user.tenantId !== doc.tenantId).length,
      documentsCreatedByCurrentUser: documents.filter(doc => doc.user.id === user.id).length,
      tenantIds: [...new Set(documents.map(doc => doc.tenantId))],
      userTenantIds: [...new Set(documents.map(doc => doc.user.tenantId))],
    };

    // Return the results
    return NextResponse.json({
      currentUser: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        homeTenantId: user.tenantId,
        homeTenantName: user.tenant.name,
      },
      accessibleTenants,
      requestedTenantId: tenantId,
      isHomeTenant: tenantId === user.tenantId,
      documentAnalysis,
      documents: documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        status: doc.status,
        tenantId: doc.tenantId,
        tenantName: doc.tenant.name,
        createdBy: doc.user.name,
        createdByTenantId: doc.user.tenantId,
        tenantMismatch: doc.tenantId !== tenantId,
        userTenantMismatch: doc.user.tenantId !== doc.tenantId,
      })),
    });
  } catch (error) {
    console.error("Error in test-documents API:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents for testing" },
      { status: 500 }
    );
  }
}