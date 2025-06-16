import { prisma } from "@/lib/prisma"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Updates a document's status and handles any related processing
 */
export async function updateDocumentStatus(
  documentId: string,
  status: "PROCESSING" | "PROCESSED" | "FAILED",
  options?: {
    error?: string;
    chunks?: Array<{ content: string; chunkIndex: number }>;
  }
) {
  try {
    // Update document status
    await prisma.document.update({
      where: { id: documentId },
      data: { status },
    })

    // If processing was successful and chunks are provided, store them
    if (status === "PROCESSED" && options?.chunks && Array.isArray(options.chunks)) {
      // Create document chunks
      await prisma.documentChunk.createMany({
        data: options.chunks.map((chunk, index) => ({
          documentId,
          content: chunk.content,
          chunkIndex: chunk.chunkIndex || index,
        })),
      })
    }

    // If processing failed, store the error in metadata
    if (status === "FAILED" && options?.error) {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: { metadata: true },
      })

      const metadata = document?.metadata as any || {}

      await prisma.document.update({
        where: { id: documentId },
        data: {
          metadata: {
            ...metadata,
            error: options.error,
            failedAt: new Date().toISOString(),
          },
        },
      })
    }

    return true
  } catch (error) {
    console.error(`Error updating document ${documentId} status:`, error)
    return false
  }
}

/**
 * Generate a pre-signed URL for downloading a file from S3
 */
async function generateS3PresignedUrl(s3Key: string): Promise<string> {
  try {
    // Initialize the S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ca-central-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    // Create the S3 command
    const getCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET || 'brandt-chat-app',
      Key: s3Key,
    });
    
    // Generate the pre-signed URL for download (valid for 24 hours)
    const presignedUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 86400, // 24 hours
    });

    return presignedUrl;
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    throw error;
  }
}

/**
 * Sends a document to the n8n processing webhook
 */
export async function sendDocumentToProcessing(document: {
  id: string;
  url: string;
  type: string;
  name: string;
  tenantId: string;
  userId: string;
  size?: number;
  mimeType?: string;
}) {
  // Always use the production webhook URL
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL

  if (!n8nWebhookUrl) {
    console.warn("N8N_WEBHOOK_URL not configured")
    
    // If n8n webhook is not configured, update document status to PROCESSED
    // This is just for development/testing purposes
    await updateDocumentStatus(document.id, "PROCESSED")
    return true
  }

  try {
    // Import axios and jsonwebtoken dynamically to avoid issues with SSR
    const axios = (await import("axios")).default
    const jwt = (await import("jsonwebtoken")).default
    
    // Get JWT secret and algorithm for authentication
    const jwtSecret = process.env.JWT_SECRET
    const jwtAlgorithm = process.env.JWT_ALGORITHM || 'HS512'
    
    if (!jwtSecret) {
      console.warn("JWT_SECRET not configured, webhook authentication will fail");
    }
    
    console.log(`Using JWT algorithm: ${jwtAlgorithm}`);
    
    // Create headers with authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    // Generate a JWT token with the specified algorithm
    const token = jwt.sign(
      {
        documentId: document.id,
        tenantId: document.tenantId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
      },
      jwtSecret || 'fallback-secret-for-development-only',
      { algorithm: jwtAlgorithm as any }
    );
    
    // Add the JWT token to the Authorization header
    headers['Authorization'] = `Bearer ${token}`
    
    try {
      // Get the document with its metadata from the database
      const documentRecord = await prisma.document.findUnique({
        where: { id: document.id },
        select: {
          id: true,
          name: true,
          url: true,
          type: true,
          status: true,
          tenantId: true,
          userId: true,
          metadata: true,
          tenant: {
            select: { name: true, slug: true, domain: true }
          },
          user: {
            select: { name: true, email: true, role: true }
          }
        }
      });
      
      if (!documentRecord) {
        console.error("Document processing - Document not found in database:", document.id);
        throw new Error(`Document with ID ${document.id} not found in database`);
      }

      // Extract the S3 key from the URL
      // The URL format is: https://[bucket].s3.[region].amazonaws.com/[key]
      const urlParts = document.url.split('.amazonaws.com/');
      const s3Key = urlParts.length > 1 ? urlParts[1] : null;
      
      if (!s3Key) {
        console.error("Document processing - Could not extract S3 key from URL:", document.url);
        throw new Error("Could not extract S3 key from URL");
      }
      
      // Generate a pre-signed URL for the document
      const presignedUrl = await generateS3PresignedUrl(s3Key);
      
      // Send document info to n8n for processing
      const payload = {
        documentId: document.id,
        documentUrl: document.url, // The permanent S3 URL
        presignedUrl: presignedUrl, // The pre-signed URL for temporary access
        documentType: document.type,
        documentName: document.name,
        tenantId: document.tenantId,
        fileSize: document.size,
        fileMimeType: document.mimeType || document.type,
        // Add comprehensive metadata for processing
        metadata: {
          document: {
            id: document.id,
            name: document.name,
            type: document.type,
            uploadedAt: new Date().toISOString(),
            processingStartedAt: new Date().toISOString(),
            size: document.size,
            mimeType: document.mimeType || document.type
          },
          tenant: {
            id: document.tenantId,
            name: documentRecord?.tenant?.name || "Unknown Tenant",
            slug: documentRecord?.tenant?.slug || "unknown",
            domain: documentRecord?.tenant?.domain || null
          },
          user: {
            id: document.userId,
            name: documentRecord?.user?.name || "Unknown User",
            email: documentRecord?.user?.email || "unknown",
            role: documentRecord?.user?.role || "SUPPORT_AGENT"
          }
        }
      };
      
      const response = await axios.post(n8nWebhookUrl, payload, { headers });
      
      // Check if the response indicates successful processing
      const isSuccessful =
        // Check for array response format
        (Array.isArray(response.data) &&
         response.data[0]?.response?.body === "DOCUMENT[S] PROCESSED SUCCESSFULLY") ||
        // Check for direct string response format
        (typeof response.data === 'string' &&
         response.data === "DOCUMENT[S] PROCESSED SUCCESSFULLY");
      
      if (isSuccessful) {
        // Update document status to PROCESSED
        await updateDocumentStatus(document.id, "PROCESSED");
      }
      
      return true;
    } catch (dbError) {
      console.error("Document processing - Error preparing document:", dbError);
      throw dbError;
    }
  } catch (error) {
    console.error("Error triggering n8n webhook:", error);
    
    // Update document status to FAILED if webhook call fails
    await updateDocumentStatus(document.id, "FAILED", {
      error: "Failed to send to processing service",
    });
    
    return false;
  }
}