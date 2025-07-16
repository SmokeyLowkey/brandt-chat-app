import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options"
import { prisma } from "@/lib/prisma"
import { sendDocumentToProcessing } from "@/utils/document-processing"

// POST /api/tenants/[tenantId]/documents/[documentId]/retry
export async function POST(
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
    
    // Allow admins to access any tenant, but restrict other users to their assigned tenant
    if (!user || (user.role !== "ADMIN" && user.tenantId !== tenantId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch document with all necessary details
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        tenantId: tenantId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check if document has already been retried
    if ((document.metadata as any)?.retryAttempt) {
      return NextResponse.json(
        { error: "Document has already been retried" },
        { status: 400 }
      )
    }

    // Update document metadata to indicate retry attempt
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "PROCESSING", // Set status back to PROCESSING
        metadata: {
          ...(document.metadata as any || {}),
          retryAttempt: 1,
          retryAt: new Date().toISOString(),
          previousStatus: document.status,
        }
      }
    })

    // Extract metadata from document
    const metadata = document.metadata as any || {}
    
    // Send document to processing service
    await sendDocumentToProcessing({
      id: document.id,
      url: document.url,
      type: document.type,
      name: document.name,
      tenantId: document.tenantId,
      userId: document.userId,
      size: metadata.size,
      mimeType: metadata.mimeType || document.type,
      namespace: metadata.namespace || "General",
      description: metadata.description || "",
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error retrying document processing:", error)
    return NextResponse.json(
      { error: "Failed to retry document processing", details: String(error) },
      { status: 500 }
    )
  }
}