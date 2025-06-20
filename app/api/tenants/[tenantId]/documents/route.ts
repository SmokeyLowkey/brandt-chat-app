import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

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
    
    // Allow admins to access any tenant, but restrict other users to their assigned tenant
    if (!user || (user.role !== "ADMIN" && user.tenantId !== tenantId)) {
      // console.log("API - Access denied: User tenant doesn't match requested tenant and user is not an admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get query parameters
    const url = new URL(req.url)
    const status = url.searchParams.get("status")
    const search = url.searchParams.get("search")
    
    // Build the where clause
    const where: any = {
      tenantId: tenantId,
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
    
    // Fetch documents
    const documents = await prisma.document.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    })
    
    // console.log("API GET /documents - Found documents:", documents.length)
    // console.log("API GET /documents - Document IDs:", documents.map(doc => doc.id))
    // console.log("API GET /documents - First few documents:", documents.slice(0, 2))

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
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

    
    // Allow admins to access any tenant, but restrict other users to their assigned tenant
    if (!user || (user.role !== "ADMIN" && user.tenantId !== tenantId)) {
      // console.log("API - Access denied: User tenant doesn't match requested tenant and user is not an admin")
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