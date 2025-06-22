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
    const { key, url, name, size, type, overrideTenantId, namespace, description } = body;
    
    // Get tenant ID from session or use override for admins
    let tenantId = session.user.tenantId;
    const userId = session.user.id;
    
    // Allow admins to override the tenant ID
    if (session.user.role === "ADMIN" && overrideTenantId) {
      console.log(`Admin ${userId} overriding tenant ID to ${overrideTenantId}`);
      tenantId = overrideTenantId;
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
      // Create document in database with initial metadata
      // Note: Status will default to PROCESSING due to schema constraints,
      // but we'll add a flag in metadata to indicate it's not yet being processed by n8n
      const document = await prisma.document.create({
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
      
      // Now send the real document to processing service
      await sendDocumentToProcessing({
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
      });
      
      return NextResponse.json({ 
        success: true,
        documentId: document.id
      });
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