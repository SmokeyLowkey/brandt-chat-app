"use client"

import { useState } from "react"
import { Document, DocumentService } from "@/services/document-service"
import { Button } from "@/components/ui/button"
import { FileText, Trash2, Eye, Plus, RefreshCw, RotateCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { DocumentDetails } from "./document-details"
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog"
import { useToast } from "@/components/ui/use-toast"

interface DocumentListProps {
  documents: Document[]
  onDocumentDelete: (documentId: string) => void
  onDocumentRetry?: (documentId: string) => void
}

export function DocumentList({ documents, onDocumentDelete, onDocumentRetry }: DocumentListProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [retryingDocuments, setRetryingDocuments] = useState<Set<string>>(new Set())
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Debug: Log documents being received
  // console.log("DocumentList received documents:", documents)
  
  const handleRefresh = () => {
    setIsRefreshing(true)
    
    // Get the current URL and reload it with a cache-busting parameter
    const url = new URL(window.location.href);
    url.searchParams.set('t', Date.now().toString());
    window.location.href = url.toString();
  }
  
  const createTestDocument = () => {
    window.location.href = "/api/create-test-document"
  }

  const handleRetry = async (documentId: string, tenantId: string) => {
    // Add document to retrying set
    setRetryingDocuments(prev => new Set(prev).add(documentId))
    
    try {
      // Call the retry function from DocumentService
      const success = await DocumentService.retryDocumentProcessing(tenantId, documentId)
      
      if (success) {
        toast({
          title: "Processing restarted",
          description: "Document processing has been restarted",
        })
        
        // If there's a custom handler, call it
        if (onDocumentRetry) {
          onDocumentRetry(documentId)
        }
        
        // Get the current URL and reload it with a cache-busting parameter
        const url = new URL(window.location.href);
        url.searchParams.set('t', Date.now().toString());
        window.location.href = url.toString();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restart document processing",
        variant: "destructive",
      })
    } finally {
      // Remove document from retrying set
      setRetryingDocuments(prev => {
        const newSet = new Set(prev)
        newSet.delete(documentId)
        return newSet
      })
    }
  }

  const handleViewDetails = (document: Document) => {
    setSelectedDocument(document)
    setIsDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsOpen(false)
  }

  const handleDeleteClick = (doc: Document) => {
    setDocumentToDelete(doc)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      onDocumentDelete(documentToDelete.id)
    }
    setDocumentToDelete(null)
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setDocumentToDelete(null)
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown"
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const getStatusColor = (status: string, doc?: Document) => {
    switch (status) {
      case "PROCESSED":
        return "bg-green-100 text-green-800"
      case "PROCESSING":
        // Check if the document has been in processing state for too long (over 10 minutes)
        if (doc) {
          const metadata = doc.metadata as any || {};
          const processingStartedAt = metadata.processingStartedAt ? new Date(metadata.processingStartedAt) : null;
          const now = new Date();
          const tenMinutesInMs = 10 * 60 * 1000;
          
          if (processingStartedAt && (now.getTime() - processingStartedAt.getTime() > tenMinutesInMs)) {
            // If processing for too long, show a warning color
            return "bg-yellow-100 text-yellow-800"
          }
        }
        return "bg-blue-100 text-blue-800"
      case "FAILED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Documents</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
        </div>
      </div>
      
      <div className="rounded-md border">
        <div className="grid grid-cols-12 gap-2 border-b bg-gray-50 p-4 text-sm font-medium text-gray-500">
          <div className="col-span-4">Name</div>
          <div className="col-span-2">Namespace</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1"></div>
        </div>
        <div className="divide-y">
          {documents.length > 0 ? (
            documents.map((doc) => (
              <div key={doc.id} className="grid grid-cols-12 gap-2 p-4 text-sm items-center">
                <div className="col-span-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="font-medium truncate max-w-[250px]" title={doc.name}>{doc.name}</span>
                </div>
                <div className="col-span-2">
                  <span className="truncate max-w-[120px] inline-block" title={(doc.metadata as any)?.namespace || "General"}>
                    {(doc.metadata as any)?.namespace || "General"}
                  </span>
                </div>
                <div className="col-span-1">{doc.type.toUpperCase()}</div>
                <div className="col-span-2">{doc.metadata ? formatFileSize(doc.metadata.size) : "Unknown"}</div>
                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(doc.status, doc)}`}
                  >
                    {doc.status === "PROCESSING" ? (
                      <>
                        <span className="mr-1">Processing</span>
                        <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                      </>
                    ) : (
                      doc.status.charAt(0) + doc.status.slice(1).toLowerCase()
                    )}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewDetails(doc)}
                    title="View details"
                  >
                    <Eye className="h-4 w-4 text-gray-500" />
                  </Button>
                  
                  {/* Retry button for failed documents that haven't been retried yet */}
                  {doc.status === "FAILED" && !(doc.metadata as any)?.retryAttempt && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRetry(doc.id, doc.tenantId)}
                      disabled={retryingDocuments.has(doc.id)}
                      title="Retry processing"
                    >
                      <RotateCw className={`h-4 w-4 ${retryingDocuments.has(doc.id) ? 'animate-spin text-blue-500' : 'text-gray-500'}`} />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(doc)}
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">No documents found</div>
          )}
        </div>
      </div>

      {selectedDocument && (
        <DocumentDetails
          document={selectedDocument}
          isOpen={isDetailsOpen}
          onClose={handleCloseDetails}
        />
      )}

      {documentToDelete && (
        <DeleteConfirmationDialog
          documentName={documentToDelete.name}
          isOpen={isDeleteDialogOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  )
}