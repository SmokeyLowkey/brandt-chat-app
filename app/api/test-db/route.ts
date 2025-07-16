import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

// This is a test endpoint to verify database connectivity and document creation
export async function GET(req: NextRequest) {
  try {
    // console.log("Test DB - Starting database test");
    
    // Test basic database connectivity
    // console.log("Test DB - Testing database connection...");
    const connectionTest = await prisma.$queryRaw`SELECT 1 as connection_test`;
    // console.log("Test DB - Connection test result:", connectionTest);
    
    // Get session to get user and tenant info
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const tenantId = session.user.tenantId;
    
    // console.log("Test DB - User ID:", userId);
    // console.log("Test DB - Tenant ID:", tenantId);
    
    // List all tables in the database
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    // console.log("Test DB - Database tables:", tables);
    
    // Check if documents table exists and has records
    const documentCount = await prisma.$queryRaw`
      SELECT COUNT(*) FROM documents
    `;
    // console.log("Test DB - Document count:", documentCount);
    
    // Try to create a test document using Prisma
    // console.log("Test DB - Creating test document with Prisma...");
    const testDocument = await prisma.document.create({
      data: {
        name: "Test Document",
        type: "pdf",
        url: "https://example.com/test.pdf",
        status: "PROCESSING",
        userId: userId,
        tenantId: tenantId,
        metadata: {
          size: 1024,
          uploadedAt: new Date().toISOString(),
          mimeType: "application/pdf",
          testField: "This is a test document"
        }
      }
    });
    
    // console.log("Test DB - Prisma document created:", testDocument);
    
    // Try to create a test document using raw SQL
    // console.log("Test DB - Creating test document with raw SQL...");
    
    // Generate a UUID for the document
    const uuidResult: any = await prisma.$queryRaw`SELECT gen_random_uuid() as uuid`;
    const documentId = uuidResult[0].uuid;
    
    // Create metadata JSON
    const metadataJson = JSON.stringify({
      size: 2048,
      uploadedAt: new Date().toISOString(),
      mimeType: "application/pdf",
      testField: "This is a SQL test document"
    });
    
    // Insert the document using raw SQL
    await prisma.$executeRaw`
      INSERT INTO "documents" (
        "id", "name", "type", "url", "status", "userId", "tenantId", "metadata", "createdAt", "updatedAt"
      ) VALUES (
        ${documentId}::uuid, 
        'SQL Test Document', 
        'pdf', 
        'https://example.com/sql-test.pdf', 
        'PROCESSING'::text, 
        ${userId}, 
        ${tenantId}, 
        ${metadataJson}::jsonb, 
        NOW(), 
        NOW()
      )
    `;
    
    // console.log("Test DB - SQL document created with ID:", documentId);
    
    // Fetch all documents for this tenant to verify creation
    const documents = await prisma.document.findMany({
      where: {
        tenantId: tenantId
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    });
    
    // console.log("Test DB - Recent documents:", documents.map(d => ({ id: d.id, name: d.name })));
    
    return NextResponse.json({
      success: true,
      connectionTest,
      tables,
      documentCount,
      prismaDocument: testDocument,
      sqlDocumentId: documentId,
      recentDocuments: documents.map(d => ({ id: d.id, name: d.name }))
    });
  } catch (error: any) {
    console.error("Test DB - ERROR:", error);
    console.error("Test DB - Error stack:", error.stack);
    
    if (error.code) {
      console.error("Test DB - Error code:", error.code);
    }
    
    if (error.meta) {
      console.error("Test DB - Error metadata:", error.meta);
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