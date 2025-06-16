# AWS S3 Integration for Document Storage

This document explains how the application uses AWS S3 for document storage and retrieval.

## Overview

The application uses AWS S3 (Simple Storage Service) to store and manage document files. This replaces the previous UploadThing integration.

## Configuration

AWS S3 is configured using environment variables in the `.env` file:

```
# AWS S3 Configuration
AWS_REGION="ca-central-1"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_S3_BUCKET="your-bucket-name"

# Public AWS S3 Configuration (accessible from client-side)
NEXT_PUBLIC_AWS_REGION="ca-central-1"
NEXT_PUBLIC_AWS_S3_BUCKET="your-bucket-name"
```

## File Structure

The S3 integration consists of the following files:

- `utils/s3.ts` - Client-side utility functions for S3 operations
- `app/api/s3/generate-upload-url/route.ts` - API route for generating pre-signed upload URLs
- `app/api/s3/generate-download-url/route.ts` - API route for generating pre-signed download URLs
- `app/api/s3/document-created/route.ts` - API route for creating document records after upload
- `utils/document-processing.ts` - Server-side utilities for document processing and webhook integration

## How It Works

### Document Upload Process

1. When a user selects one or more files to upload, the application requests a pre-signed upload URL for each file from the server.
2. The server generates a unique file key and a pre-signed URL that allows the client to upload directly to S3.
3. The client uploads each file directly to S3 using the pre-signed URLs.
4. After each successful upload, the client notifies the server about the uploaded document.
5. The server creates a document record in the database and sends the document for processing.

### Document Processing Workflow

1. When a document is created, the system sends it to an n8n webhook for processing.
2. The document is sent with a pre-signed download URL that allows n8n to access the file.
3. The n8n workflow processes the document and returns a response.
4. The system checks the response and updates the document status accordingly.
5. When processing is successful, the document status is updated to "PROCESSED".

### Document Retrieval Process

1. When a user wants to view or download a document, the application requests a pre-signed download URL from the server.
2. The server generates a pre-signed URL that allows temporary access to the file in S3.
3. The client uses this URL to download or view the document.

## Multi-File Upload Support

The application supports uploading multiple files simultaneously:

1. Users can select multiple files via the file browser or drag-and-drop.
2. Files are displayed in a scrollable list with the ability to remove individual files.
3. The upload process handles each file sequentially, with individual progress tracking.
4. The UI shows overall progress and individual file status.

## File Naming and Organization

Files in S3 are organized by tenant ID and include a unique identifier:

```
{tenantId}/{uuid}-{originalFilename}
```

For example:
```
tenant-123/550e8400-e29b-41d4-a716-446655440000-example.pdf
```

This ensures:
- Files are organized by tenant
- Filenames are unique to prevent collisions
- Original filenames are preserved for user reference

## Webhook Integration

The application integrates with n8n for document processing:

1. Documents uploaded to S3 are sent to an n8n webhook for processing using the production webhook URL defined in the `N8N_WEBHOOK_URL` environment variable.
2. The webhook request includes:
   - Document metadata
   - Permanent S3 URL
   - Pre-signed download URL (valid for 24 hours)
   - JWT authentication token

3. The n8n workflow processes the document and returns a response in one of two formats:

   **Array Format:**
   ```json
   [
     {
       "response": {
         "body": "DOCUMENT[S] PROCESSED SUCCESSFULLY",
         "headers": {},
         "statusCode": 200
       }
     }
   ]
   ```

   **String Format:**
   ```
   "DOCUMENT[S] PROCESSED SUCCESSFULLY"
   ```

4. The application checks this response and updates the document status to "PROCESSED" when successful, supporting both response formats.

## Security Considerations

- Access to S3 is controlled through pre-signed URLs with limited validity periods
- Direct access to S3 is not exposed to clients
- Server-side authentication is required to generate pre-signed URLs
- Tenant isolation is enforced to prevent cross-tenant access
- JWT authentication is used for webhook communication
- Pre-signed download URLs for n8n are valid for 24 hours

## API Reference

### Generate Upload URL

```typescript
// Request
POST /api/s3/generate-upload-url
{
  "filename": "example.pdf",
  "contentType": "application/pdf"
}

// Response
{
  "uploadUrl": "https://bucket-name.s3.region.amazonaws.com/...",
  "key": "tenant-id/uuid-example.pdf",
  "fileUrl": "https://bucket-name.s3.region.amazonaws.com/tenant-id/uuid-example.pdf"
}
```

### Generate Download URL

```typescript
// Request
POST /api/s3/generate-download-url
{
  "key": "tenant-id/uuid-example.pdf"
}

// Response
{
  "downloadUrl": "https://bucket-name.s3.region.amazonaws.com/..."
}
```

### Document Created

```typescript
// Request
POST /api/s3/document-created
{
  "key": "tenant-id/uuid-example.pdf",
  "url": "https://bucket-name.s3.region.amazonaws.com/tenant-id/uuid-example.pdf",
  "name": "example.pdf",
  "size": 12345,
  "type": "application/pdf"
}

// Response
{
  "success": true,
  "documentId": "document-uuid"
}
```

## Client Utilities

The `utils/s3.ts` file provides the following utility functions:

- `getUploadUrl(filename, contentType)` - Get a pre-signed URL for uploading a file
- `getDownloadUrl(key)` - Get a pre-signed URL for downloading a file
- `uploadFileToS3(file, onProgress)` - Upload a file to S3 with progress tracking
- `getPublicS3Url(key)` - Get the public URL for a file in S3

## Server Utilities

The `utils/document-processing.ts` file provides the following server-side utilities:

- `updateDocumentStatus(documentId, status, options)` - Update a document's status and handle related processing
- `generateS3PresignedUrl(s3Key)` - Generate a pre-signed URL for downloading a file from S3
- `sendDocumentToProcessing(document)` - Send a document to the n8n processing webhook and handle the response

The document processing workflow includes:

1. Generating a JWT token for webhook authentication
2. Retrieving document details from the database
3. Extracting the S3 key from the document URL
4. Generating a pre-signed URL for the document
5. Sending the document information to the n8n webhook
6. Processing the webhook response to update the document status
   - Supports both array and string response formats
   - Updates document status to "PROCESSED" when processing is successful

## Recent Improvements

The following improvements have been made to the S3 integration:

### 1. Enhanced Webhook Response Handling

The system now properly handles both response formats from the n8n webhook:
- Array format: `[{ response: { body: "DOCUMENT[S] PROCESSED SUCCESSFULLY" } }]`
- Direct string format: `"DOCUMENT[S] PROCESSED SUCCESSFULLY"`

This ensures that document status is updated from "PROCESSING" to "PROCESSED" regardless of which format the webhook returns.

### 2. Production Webhook URL Usage

Modified the webhook URL selection to always use the production webhook URL:
- Now using `N8N_WEBHOOK_URL` environment variable exclusively
- Removed fallback to test webhook URL

### 3. Console Log Cleanup

Removed unnecessary console logs from the document processing workflow:
- Removed informational logs about document processing steps
- Kept essential error logging for troubleshooting
- Improved performance by eliminating string concatenation and JSON stringification operations
- Made terminal output cleaner and easier to read

These improvements ensure a more robust document processing workflow with proper status updates and cleaner code.

## Related Documentation

For information about the chat functionality and n8n webhook integration, see [CHAT_INTEGRATION.md](./CHAT_INTEGRATION.md).