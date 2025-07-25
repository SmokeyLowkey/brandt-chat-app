import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { randomUUID } from "crypto";

// Initialize the S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ca-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { filename, contentType, overrideTenantId } = body;
    
    // Get tenant ID from session or use override for admins
    let tenantId = session.user.tenantId;
    
    // Allow admins to override the tenant ID
    if (session.user.role === "ADMIN" && overrideTenantId) {
      // console.log(`Admin ${session.user.id} overriding tenant ID to ${overrideTenantId} for upload URL generation`);
      tenantId = overrideTenantId;
    }

    if (!tenantId || !filename) {
      return NextResponse.json(
        { error: "Tenant ID and filename are required" },
        { status: 400 }
      );
    }

    // Check if the file is a PDF
    const isPdf =
      contentType?.includes('pdf') ||
      filename.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Generate a unique file key while preserving the original filename
    const uuid = randomUUID();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${tenantId}/${uuid}-${sanitizedFilename}`;

    // Create the S3 command
    const putCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: contentType || 'application/octet-stream',
    });
    
    // Generate the pre-signed URL for upload
    const uploadUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: 900, // URL expires in 15 minutes
    });

    // Generate the public URL for the file
    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({ 
      uploadUrl, 
      key,
      fileUrl
    });
  } catch (error) {
    // console.error('Error generating pre-signed URL:', error);
    return NextResponse.json(
      { error: 'Error generating upload URL' },
      { status: 500 }
    );
  }
}