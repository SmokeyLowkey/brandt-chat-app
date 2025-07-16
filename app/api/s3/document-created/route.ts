import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendDocumentToProcessing } from "@/utils/document-processing";
import { createNotification } from "@/services/notification-service";

export async function POST(request: NextRequest) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { key, url, name, size, type, overrideTenantId, namespace, description, text_blocks_redacted } = body;
    
    // Get tenant ID from session or use override for admins and managers
    let tenantId = session.user.tenantId;
    const userId = session.user.id;
    const userRole = session.user.role;
    
    // Allow admins and managers to override the tenant ID
    if ((userRole === "ADMIN" || userRole === "MANAGER") && overrideTenantId) {
      console.log(`User ${userId} (${userRole}) overriding tenant ID from ${tenantId} to ${overrideTenantId}`);
      
      // For managers, verify they have access to the override tenant
      if (userRole === "MANAGER" && tenantId !== overrideTenantId) {
        // Check if the manager has access to the override tenant
        const hasAccess = await prisma.managerTenantAccess.findFirst({
          where: {
            managerId: userId,
            tenantId: overrideTenantId
          }
        });
        
        if (hasAccess) {
          console.log(`Manager ${userId} has verified access to tenant ${overrideTenantId}`);
          tenantId = overrideTenantId;
        } else {
          console.warn(`Manager ${userId} attempted to override to tenant ${overrideTenantId} without access`);
          // Keep the original tenant ID
        }
      } else if (userRole === "ADMIN") {
        // Admins can override to any tenant
        tenantId = overrideTenantId;
      }
    }

    if (!tenantId || !key || !url || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if the file is a PDF
    const isPdf =
      type.includes('pdf') ||
      name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    try {
      // Check if a document with the same name already exists in this tenant
      const existingDocument = await prisma.document.findFirst({
        where: {
          name,
          tenantId,
        },
        select: {
          id: true,
          status: true,
          metadata: true,
        }
      });
      
      let document;
      
      if (existingDocument) {
        console.log(`Document with name "${name}" already exists in tenant ${tenantId}, updating instead of creating new`);
        
        // If the document exists but is in FAILED state, we can retry processing
        if (existingDocument.status === "FAILED") {
          // Update the existing document
          document = await prisma.document.update({
            where: {
              id: existingDocument.id,
            },
            data: {
              status: "PROCESSING", // Reset status to PROCESSING
              url, // Update URL in case it changed
              metadata: {
                ...(existingDocument.metadata as any || {}),
                size,
                uploadedAt: new Date().toISOString(),
                mimeType: type,
                s3Key: key,
                namespace: namespace || "General",
                description: description || "",
                processingState: "UPLOADED_TO_S3", // Custom flag to track actual state
                sentToProcessing: false, // Will be set to true in sendDocumentToProcessing
                retryCount: ((existingDocument.metadata as any)?.retryCount || 0) + 1,
                retryAt: new Date().toISOString(),
              }
            },
            select: {
              id: true
            }
          });
        } else {
          // If the document is already in PROCESSING or PROCESSED state, just return it
          document = existingDocument;
          
          // Log that we're not creating a new document
          console.log(`Document ${existingDocument.id} is already in ${existingDocument.status} state, not creating a new one`);
        }
      } else {
        // Create a new document in database with initial metadata
        document = await prisma.document.create({
          data: {
            name,
            type: name.split(".").pop() || "unknown",
            url,
            userId,
            tenantId,
            metadata: {
              size,
              uploadedAt: new Date().toISOString(),
              mimeType: type,
              s3Key: key,
              namespace: namespace || "General",
              description: description || "",
              processingState: "UPLOADED_TO_S3", // Custom flag to track actual state
              sentToProcessing: false // Will be set to true in sendDocumentToProcessing
            }
          },
          select: {
            id: true
          }
        });
      }
      
      // Create notification for the tenant
      await createNotification({
        type: "document_uploaded",
        title: "New Document Uploaded",
        message: `${name} has been uploaded and is being processed.`,
        metadata: {
          documentId: document.id,
          documentName: name,
          documentType: type,
          uploadedBy: userId,
          namespace: namespace || "General",
        },
        tenantId,
        userId,
      });
      
      // Return success immediately to prevent timeout
      // We'll process the document asynchronously
      const response = NextResponse.json({
        success: true,
        documentId: document.id
      });
      
      // Start document processing in the background without awaiting
      // This prevents API timeout issues
      sendDocumentToProcessing({
        id: document.id,
        url,
        type,
        name,
        tenantId,
        userId,
        size,
        mimeType: type,
        namespace: namespace || "General",
        description: description || "",
        text_blocks_redacted: text_blocks_redacted ? JSON.stringify(text_blocks_redacted) : undefined,
      }).catch(error => {
        console.error(`Background processing error for document ${document.id}:`, error);
      });
      
      return response;
    } catch (error: any) {
      console.error("Error creating document:", error);
      return NextResponse.json(
        { error: `Error creating document: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error processing document creation:", error);
    return NextResponse.json(
      { error: `Error processing document creation: ${error.message}` },
      { status: 500 }
    );
  }
}