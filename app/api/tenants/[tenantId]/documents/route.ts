import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { hasUserTenantAccess } from "@/utils/access-control"

// GET /api/tenants/[tenantId]/documents
export async function GET(
  req: NextRequest,
  context: { params: { tenantId: string } }
) {
  try {
    // Access params inside async context
    const params = await context.params;
    const tenantId = params.tenantId;
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has access to this tenant
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    })

    
    // console.log("API - User:", {
    //   id: user?.id,
    //   email: user?.email,
    //   role: user?.role,
    //   tenantId: user?.tenantId
    // })
    // console.log("API - Requested tenantId:", tenantId)
    
    // Check if user has access to this tenant using the access control utility
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    const hasAccess = await hasUserTenantAccess(
      user.id,
      tenantId,
      user.role,
      user.tenantId
    )
    
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get query parameters
    const url = new URL(req.url)
    const status = url.searchParams.get("status")
    const search = url.searchParams.get("search")
    
    // Build the where clause
    const where: any = {
      tenantId: tenantId, // This ensures documents are filtered by the active tenant
    }
    
    // Log the tenant ID being used for filtering
    console.log(`Filtering documents for tenant ID: ${tenantId}`)
    
    // Log the current user's information
    console.log(`Current user: ${user.name} (${user.id}), role: ${user.role}, home tenant: ${user.tenantId}`)
    console.log(`Requested tenant: ${tenantId}`)
    console.log(`Is user accessing their home tenant: ${user.tenantId === tenantId ? 'Yes' : 'No'}`)
    
    // Check if the user has access to other tenants
    const userAccessibleTenants = await prisma.managerTenantAccess.findMany({
      where: {
        managerId: user.id,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    console.log(`User has access to ${userAccessibleTenants.length} additional tenants`);
    if (userAccessibleTenants.length > 0) {
      console.log(`Accessible tenants: ${userAccessibleTenants.map(access => access.tenant.name).join(', ')}`);
    }
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      }
    }

    // console.log("API GET /documents - Query parameters:", { tenantId, status, search })
    // console.log("API GET /documents - Where clause:", where)
    
    // Ensure we're filtering by the correct tenant ID
    console.log(`Filtering documents for tenant ID: ${tenantId}`)
    
    // Double-check that the tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true }
    });
    
    if (!tenant) {
      console.error(`Tenant with ID ${tenantId} not found`);
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }
    
    console.log(`Found tenant: ${tenant.name} (${tenant.id})`);
    
    // Fetch documents for the tenant
    // For ADMIN and MANAGER roles, show all documents for the tenant
    // For SUPPORT_AGENT role, show only their own documents
    const documents = await prisma.document.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            tenantId: true,
            role: true
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })
    
    // Log the number of documents found
    console.log(`Found ${documents.length} documents for tenant ${tenantId} (${tenant.name})`)
    
    // Log detailed information about each document
    console.log(`Document details for tenant ${tenantId}:`);
    documents.forEach((doc, index) => {
      if (index < 5) { // Only log the first 5 documents to avoid excessive logging
        console.log(`Document ${index + 1}/${documents.length}:`);
        console.log(`- ID: ${doc.id}`);
        console.log(`- Name: ${doc.name}`);
        console.log(`- Status: ${doc.status}`);
        console.log(`- Document's tenant ID: ${doc.tenantId}`);
        console.log(`- Document's tenant name: ${doc.tenant.name}`);
        console.log(`- Created by user: ${doc.user.name} (${doc.user.id})`);
        console.log(`- User's home tenant ID: ${doc.user.tenantId}`);
        console.log(`- User's role: ${doc.user.role}`);
        
        // Check if the document's tenant matches the user's home tenant
        if (doc.tenantId !== doc.user.tenantId) {
          console.warn(`  ⚠️ MISMATCH: Document's tenant (${doc.tenantId}) doesn't match user's home tenant (${doc.user.tenantId})`);
        }
        
        // Check if the document's tenant matches the requested tenant
        if (doc.tenantId !== tenantId) {
          console.warn(`  ⚠️ MISMATCH: Document's tenant (${doc.tenantId}) doesn't match requested tenant (${tenantId})`);
        }
      }
    });
    
    // Log tenant ID distribution for debugging
    const tenantCounts: Record<string, number> = {};
    documents.forEach(doc => {
      const docTenantId = doc.tenantId;
      tenantCounts[docTenantId] = (tenantCounts[docTenantId] || 0) + 1;
    });
    
    console.log(`Document tenant distribution:`, tenantCounts);
    
    // Check if any documents were created by users from a different tenant
    const userTenantMismatchDocs = documents.filter(doc => doc.user.tenantId !== doc.tenantId);
    if (userTenantMismatchDocs.length > 0) {
      console.warn(`Warning: ${userTenantMismatchDocs.length}/${documents.length} documents were created by users from a different tenant`);
      
      // Log the first mismatched document for debugging
      if (userTenantMismatchDocs.length > 0) {
        console.warn(`Example user-tenant mismatch document:`, {
          id: userTenantMismatchDocs[0].id,
          name: userTenantMismatchDocs[0].name,
          documentTenantId: userTenantMismatchDocs[0].tenantId,
          userTenantId: userTenantMismatchDocs[0].user.tenantId,
          userName: userTenantMismatchDocs[0].user.name
        });
      }
    }
    
    // Return all documents found by the query
    // The query should have already filtered by tenant ID
    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
    // Return an empty array instead of an error object to ensure consistent response type
    return NextResponse.json([])
  }
}

// POST /api/tenants/[tenantId]/documents
export async function POST(
  req: NextRequest,
  context: { params: { tenantId: string } }
) {
  try {
    // Access params inside async context
    const params = await context.params;
    const tenantId = params.tenantId;
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has access to this tenant
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    })

    
    // Check if user has access to this tenant using the access control utility
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    const hasAccess = await hasUserTenantAccess(
      user.id,
      tenantId,
      user.role,
      user.tenantId
    )
    
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Validate request body
    const DocumentSchema = z.object({
      name: z.string(),
      type: z.string(),
      url: z.string().url(),
      status: z.enum(["PROCESSING", "PROCESSED", "FAILED"]).default("PROCESSING"),
      metadata: z.object({
        size: z.number(),
        mimeType: z.string(),
        uploadedAt: z.string().datetime(),
      }).optional(),
    })

    const body = await req.json()
    const validatedData = DocumentSchema.parse(body)

    // Create document
    const document = await prisma.document.create({
      data: {
        ...validatedData,
        tenantId: tenantId,
        userId: session.user.id,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating document:", error)
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    )
  }
}