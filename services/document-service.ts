import { toast } from "sonner"

export interface Document {
  id: string
  name: string
  type: string
  url: string
  status: "PROCESSED" | "PROCESSING" | "FAILED"
  metadata?: {
    size: number
    uploadedAt: string
    mimeType: string
    namespace?: string
    description?: string
    error?: string
    failedAt?: string
  }
  text_blocks_redacted?: string  // JSON string of text elements with bounding boxes
  tenantId: string
  createdById: string
  createdAt: string
  updatedAt: string
  user?: {
    name: string
    email: string
  }
}

export interface DocumentCreateParams {
  name: string
  type: string
  url: string
  status?: "PROCESSING" | "PROCESSED" | "FAILED"
  metadata?: {
    size: number
    mimeType: string
    uploadedAt: string
    namespace?: string
    description?: string
  }
  text_blocks_redacted?: string  // JSON string of text elements with bounding boxes
}

export interface DocumentUpdateParams {
  name?: string
  status?: "PROCESSING" | "PROCESSED" | "FAILED"
  metadata?: {
    size?: number
    mimeType?: string
    uploadedAt?: string
    namespace?: string
    description?: string
  }
  text_blocks_redacted?: string  // JSON string of text elements with bounding boxes
}

export class DocumentService {
  /**
   * Fetch all documents for a tenant
   */
  static async getDocuments(tenantId: string, search?: string): Promise<Document[]> {
    try {
      // Extract the base tenant ID if it contains a timestamp parameter
      let actualTenantId = tenantId;
      if (tenantId.includes('?')) {
        actualTenantId = tenantId.split('?')[0];
      }
      
      // Build query parameters
      const queryParams = new URLSearchParams()
      if (search) {
        queryParams.append('search', search)
      }
      
      // Add a timestamp to prevent caching issues
      queryParams.append('t', Date.now().toString());
      
      // Use the cleaned tenant ID for the API request
      let url = `/api/tenants/${actualTenantId}/documents`;
      
      // Add query parameters if any
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      console.log("DocumentService.getDocuments - Fetching from URL:", url);
      
      // Make API request
      const response = await fetch(
        url,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from API:', response.status, errorText);
        throw new Error(`Failed to fetch documents: ${response.status} ${errorText}`);
      }

      const data = await response.json()
      
      // Validate that the response is an array
      if (!Array.isArray(data)) {
        console.error('API response is not an array:', data);
        return []; // Return empty array instead of throwing
      }
      
      console.log(`DocumentService.getDocuments - Received ${data.length} documents for tenant ${actualTenantId}`);
      
      // Log when no documents are found
      if (data.length === 0) {
        console.warn(`No documents found for tenant ${actualTenantId}`);
        return [];
      }
      
      // Log any tenant ID mismatches for debugging
      const mismatchedDocs = data.filter(doc => doc.tenantId !== actualTenantId);
      if (mismatchedDocs.length > 0) {
        console.warn(`Found ${mismatchedDocs.length}/${data.length} documents with tenant IDs that don't match the requested tenant ID`);
        console.warn(`Requested tenant ID: ${actualTenantId}`);
        console.warn(`Document tenant IDs: ${[...new Set(data.map(doc => doc.tenantId))].join(', ')}`);
      }
      
      // Log tenant ID distribution
      const tenantCounts: Record<string, number> = {};
      data.forEach(doc => {
        const docTenantId = doc.tenantId;
        tenantCounts[docTenantId] = (tenantCounts[docTenantId] || 0) + 1;
      });
      
      console.log(`Document tenant distribution:`, tenantCounts);
      
      // Return all documents returned by the API
      // The API should have already filtered for the correct tenant
      return data;
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast.error('Failed to fetch documents')
      return []
    }
  }

  /**
   * Get a single document by ID
   */
  static async getDocument(tenantId: string, documentId: string): Promise<Document | null> {
    try {
      const response = await fetch(
        `/api/tenants/${tenantId}/documents/${documentId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch document')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching document:', error)
      toast.error('Failed to fetch document')
      return null
    }
  }

  /**
   * Create a new document
   */
  static async createDocument(
    tenantId: string, 
    documentData: DocumentCreateParams
  ): Promise<Document | null> {
    try {
      const response = await fetch(
        `/api/tenants/${tenantId}/documents`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(documentData),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to create document')
      }

      const document = await response.json()
      toast.success('Document created successfully')
      return document
    } catch (error) {
      console.error('Error creating document:', error)
      toast.error('Failed to create document')
      return null
    }
  }

  /**
   * Update an existing document
   */
  static async updateDocument(
    tenantId: string,
    documentId: string,
    documentData: DocumentUpdateParams
  ): Promise<Document | null> {
    try {
      const response = await fetch(
        `/api/tenants/${tenantId}/documents/${documentId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(documentData),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update document')
      }

      const document = await response.json()
      toast.success('Document updated successfully')
      return document
    } catch (error) {
      console.error('Error updating document:', error)
      toast.error('Failed to update document')
      return null
    }
  }

  /**
   * Delete a document
   */
  static async deleteDocument(tenantId: string, documentId: string): Promise<boolean> {
    try {
      // console.log(`Attempting to delete document: ${documentId} for tenant: ${tenantId}`)
      
      const response = await fetch(
        `/api/tenants/${tenantId}/documents/${documentId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        // Get the error details from the response
        const errorData = await response.text()
        console.error(`Delete document failed with status: ${response.status}, details:`, errorData)
        throw new Error(`Failed to delete document: ${response.status} - ${errorData}`)
      }

      toast.success('Document deleted successfully')
      return true
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return false
    }
  }

  /**
   * Retry processing a failed document
   */
  static async retryDocumentProcessing(tenantId: string, documentId: string): Promise<boolean> {
    try {
      // Make API request to retry processing
      const response = await fetch(
        `/api/tenants/${tenantId}/documents/${documentId}/retry`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error retrying document processing:', response.status, errorText);
        throw new Error(`Failed to retry document processing: ${response.status} ${errorText}`);
      }

      toast.success('Document processing restarted');
      return true
    } catch (error) {
      console.error('Error retrying document processing:', error)
      toast.error(`Failed to retry document processing: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return false
    }
  }
}