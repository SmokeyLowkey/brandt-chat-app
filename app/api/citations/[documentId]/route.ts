import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize the S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ca-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// GET /api/citations/[documentId]
export async function GET(
  req: NextRequest,
  context: { params: { documentId: string } }
) {
  try {
    // Access params inside async context
    const params = await context.params;
    const { documentId } = params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch document without tenant restriction
    // This is specifically for the citation feature
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
      select: {
        id: true,
        name: true,
        metadata: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Extract the S3 key from the document metadata
    const s3Key = (document.metadata as any)?.s3Key;
    
    if (!s3Key) {
      return NextResponse.json({ error: "S3 key not found in document metadata" }, { status: 404 });
    }

    // Create the S3 command
    const getCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET || 'brandt-chat-app',
      Key: s3Key,
    });
    
    // Generate the pre-signed URL for download
    const downloadUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 3600, // URL expires in 1 hour
    });

    return NextResponse.json({
      id: document.id,
      name: document.name,
      downloadUrl: downloadUrl,
    });
  } catch (error) {
    console.error("Error fetching citation document:", error);
    return NextResponse.json(
      { error: "Failed to fetch citation document" },
      { status: 500 }
    );
  }
}