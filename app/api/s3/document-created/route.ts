import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendDocumentToProcessing } from "@/utils/document-processing";

export async function POST(request: NextRequest) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { key, url, name, size, type } = body;
    
    // Get tenant ID from session
    const tenantId = session.user.tenantId;
    const userId = session.user.id;

    if (!tenantId || !key || !url || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    try {
      // Create document in database
      const document = await prisma.document.create({
        data: {
          name,
          type: name.split(".").pop() || "unknown",
          url,
          status: "PROCESSING",
          userId,
          tenantId,
          metadata: {
            size,
            uploadedAt: new Date().toISOString(),
            mimeType: type,
            s3Key: key
          },
        },
        select: {
          id: true
        }
      });
      
    //   console.log("Document created with ID:", document.id);
      
      // Send document to processing service
      await sendDocumentToProcessing({
        id: document.id,
        url,
        type,
        name,
        tenantId,
        userId,
        size,
        mimeType: type,
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