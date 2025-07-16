import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

// This endpoint creates a test document directly in the database
export async function GET(req: NextRequest) {
  try {
    // console.log("Create Test Document - Starting");
    
    // Get session to get user and tenant info
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const tenantId = session.user.tenantId;
    
    // console.log("Create Test Document - User ID:", userId);
    // console.log("Create Test Document - Tenant ID:", tenantId);
    
    // Create a test document using Prisma
    // console.log("Create Test Document - Creating test document with Prisma...");
    
    // Generate a random file key for S3 that includes the filename
    const filename = "Test Document.pdf";
    const uuid = `test-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `${tenantId}/${uuid}-${sanitizedFilename}`;
    
    // Generate S3 URL
    const s3Bucket = process.env.AWS_S3_BUCKET || 'brandt-chat-app';
    const s3Region = process.env.AWS_REGION || 'ca-central-1';
    const fileUrl = `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${fileKey}`;
    
    // Create the document
    const document = await prisma.document.create({
      data: {
        name: "Test Document.pdf",
        type: "pdf",
        url: fileUrl,
        status: "PROCESSING",
        userId: userId,
        tenantId: tenantId,
        metadata: {
          size: 1024,
          uploadedAt: new Date().toISOString(),
          mimeType: "application/pdf",
          s3Key: fileKey,
          testDocument: true
        }
      }
    });
    
    // console.log("Create Test Document - Document created:", document);
    
    // Redirect to the documents page
    return NextResponse.redirect(new URL("/dashboard/documents", req.url));
  } catch (error: any) {
    console.error("Create Test Document - ERROR:", error);
    console.error("Create Test Document - Error stack:", error.stack);
    
    if (error.code) {
      console.error("Create Test Document - Error code:", error.code);
    }
    
    if (error.meta) {
      console.error("Create Test Document - Error metadata:", error.meta);
    }
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    }, { status: 500 });
  }
}