import { NextRequest, NextResponse } from "next/server"
import { updateDocumentStatus } from "@/utils/document-processing"

// This webhook will be called by n8n after document processing
export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret if needed
    // const webhookSecret = process.env.DOCUMENT_PROCESSING_WEBHOOK_SECRET
    // const signature = req.headers.get("x-webhook-signature")
    // if (!signature || signature !== webhookSecret) {
    //   return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 })
    // }

    const body = await req.json()
    
    // Expected payload from n8n:
    // {
    //   documentId: string,
    //   status: "PROCESSED" | "FAILED",
    //   chunks?: Array<{ content: string, chunkIndex: number }>,
    //   error?: string
    // }
    
    const { documentId, status, chunks, error } = body
    
    if (!documentId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    // Update document status using our utility function
    await updateDocumentStatus(documentId, status, {
      chunks,
      error,
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing document webhook:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}