"use client"

import { useState } from "react"
import { Document, DocumentService } from "@/services/document-service"
import { Button } from "@/components/ui/button"
import { FileText, Trash2, Eye, Plus, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { DocumentDetails } from "./document-details"
import { useToast } from "@/components/ui/use-toast"

interface DocumentListProps {
  documents: Document[]
  onDocumentDelete: (documentId: string) => void
}

export function DocumentList({ documents, onDocumentDelete }: DocumentListProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Debug: Log documents being received
  // console.log("DocumentList received documents:", documents)
  
  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }
  
  const createTestDocument = () => {
    window.location.href = "/api/create-test-document"
  }

  const handleViewDetails = (document: Document) => {
    setSelectedDocument(document)
    setIsDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsOpen(false)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PROCESSED":
        return "bg-green-100 text-green-800"
      case "PROCESSING":
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
          <div className="col-span-5">Name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1"></div>
        </div>
        <div className="divide-y">
          {documents.length > 0 ? (
            documents.map((doc) => (
              <div key={doc.id} className="grid grid-cols-12 gap-2 p-4 text-sm items-center">
                <div className="col-span-5 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="font-medium truncate">{doc.name}</span>
                </div>
                <div className="col-span-2">{doc.type.toUpperCase()}</div>
                <div className="col-span-2">{doc.metadata ? formatFileSize(doc.metadata.size) : "Unknown"}</div>
                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(doc.status)}`}
                  >
                    {doc.status.charAt(0) + doc.status.slice(1).toLowerCase()}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${doc.name}"?`)) {
                        onDocumentDelete(doc.id);
                      }
                    }}
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
    </>
  )
}