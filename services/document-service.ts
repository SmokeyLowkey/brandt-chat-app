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
    error?: string
    failedAt?: string
  }
  tenantId: string
  createdById: string
  createdAt: string
  updatedAt: string
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
  }
}

export interface DocumentUpdateParams {
  name?: string
  status?: "PROCESSING" | "PROCESSED" | "FAILED"
  metadata?: {
    size?: number
    mimeType?: string
    uploadedAt?: string
  }
}

export class DocumentService {
  /**
   * Fetch all documents for a tenant
   */
  static async getDocuments(tenantId: string, search?: string): Promise<Document[]> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams()
      if (search) {
        queryParams.append('search', search)
      }
      
      const url = `/api/tenants/${tenantId}/documents?${queryParams.toString()}`
      // console.log("DocumentService.getDocuments - Fetching from URL:", url)
      
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
      // console.log("DocumentService.getDocuments - Response data length:", data.length)
      return data
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
}