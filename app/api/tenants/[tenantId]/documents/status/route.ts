import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

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
    const { documentIds } = body;

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid document IDs" },
        { status: 400 }
      );
    }

    // Get status for the requested documents
    // Ensure we're filtering by tenant ID to get the correct documents
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        tenantId: tenantId, // This ensures we only get documents for the current tenant
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            tenantId: true,
          }
        }
      }
    });
    
    console.log(`Found ${documents.length} documents for status update in tenant ${tenantId}`);
    
    // Log tenant ID information for debugging
    const tenantCounts: Record<string, number> = {};
    documents.forEach(doc => {
      const docTenantId = doc.tenantId;
      tenantCounts[docTenantId] = (tenantCounts[docTenantId] || 0) + 1;
    });
    
    console.log(`Document status tenant distribution:`, tenantCounts);
    
    // Check if any documents were created by users from a different tenant
    const userTenantMismatchDocs = documents.filter(doc => doc.user?.tenantId !== doc.tenantId);
    if (userTenantMismatchDocs.length > 0) {
      console.warn(`Warning: ${userTenantMismatchDocs.length}/${documents.length} documents were created by users from a different tenant`);
    }

    // Format the response
    const statusUpdates = documents.map((doc) => {
      const metadata = doc.metadata as any || {};
      return {
        id: doc.id,
        status: doc.status,
        error: metadata.error || null,
      };
    });

    return NextResponse.json(statusUpdates);
  } catch (error: any) {
    console.error("Error fetching document status:", error);
    return NextResponse.json(
      { error: `Error fetching document status: ${error.message}` },
      { status: 500 }
    );
  }
}