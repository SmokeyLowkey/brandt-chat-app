import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// GET /api/tenants/[tenantId]/documents/[documentId]
export async function GET(
  req: NextRequest,
  context: { params: { tenantId: string; documentId: string } }
) {
  try {
    // Access params inside async context
    const { tenantId, documentId } = context.params;
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

    
    if (!user || user.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch document
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        tenantId: tenantId,
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error("Error fetching document:", error)
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    )
  }
}

// PATCH /api/tenants/[tenantId]/documents/[documentId]
export async function PATCH(
  req: NextRequest,
  context: { params: { tenantId: string; documentId: string } }
) {
  try {
    // Access params inside async context
    const { tenantId, documentId } = context.params;
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

    
    if (!user || user.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if document exists
    const existingDocument = await prisma.document.findUnique({
      where: {
        id: documentId,
        tenantId: tenantId,
      },
    })

    if (!existingDocument) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Validate request body
    const UpdateDocumentSchema = z.object({
      name: z.string().optional(),
      status: z.enum(["PROCESSING", "PROCESSED", "FAILED"]).optional(),
      metadata: z.object({
        size: z.number().optional(),
        mimeType: z.string().optional(),
        uploadedAt: z.string().datetime().optional(),
      }).optional(),
    })

    const body = await req.json()
    const validatedData = UpdateDocumentSchema.parse(body)

    // Update document
    const document = await prisma.document.update({
      where: {
        id: documentId,
      },
      data: validatedData,
    })

    return NextResponse.json(document)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating document:", error)
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    )
  }
}

// DELETE /api/tenants/[tenantId]/documents/[documentId]
export async function DELETE(
  req: NextRequest,
  context: { params: { tenantId: string; documentId: string } }
) {
  try {
    // Access params inside async context
    const { tenantId, documentId } = context.params;
    console.log(`DELETE request for document: ${documentId} in tenant: ${tenantId}`)
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      console.log("DELETE document - Unauthorized: No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has access to this tenant
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    })

    console.log(`DELETE document - User: ${user?.id}, role: ${user?.role}, userTenantId: ${user?.tenantId}`)
    
    // Allow admins to access any tenant, but restrict other users to their assigned tenant
    if (!user || (user.role !== "ADMIN" && user.tenantId !== tenantId)) {
      console.log("DELETE document - Forbidden: User tenant doesn't match requested tenant and user is not an admin")
      return NextResponse.json({ error: "Forbidden - User does not have access to this tenant" }, { status: 403 })
    }

    // Check if document exists
    const existingDocument = await prisma.document.findUnique({
      where: {
        id: documentId,
        tenantId: tenantId,
      },
    })

    if (!existingDocument) {
      console.log(`DELETE document - Not found: Document ${documentId} not found in tenant ${tenantId}`)
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    console.log(`DELETE document - Found document: ${existingDocument.id}, name: ${existingDocument.name}`)

    try {
      // Delete document
      await prisma.document.delete({
        where: {
          id: documentId,
        },
      })
      
      console.log(`DELETE document - Successfully deleted document: ${documentId}`)
      return NextResponse.json({ success: true })
    } catch (deleteError) {
      console.error("Error in Prisma delete operation:", deleteError)
      return NextResponse.json(
        { error: "Database error during document deletion", details: String(deleteError) },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json(
      { error: "Failed to delete document", details: String(error) },
      { status: 500 }
    )
  }
}