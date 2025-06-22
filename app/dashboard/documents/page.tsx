"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useTenant } from "@/providers/tenant-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, FileText, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { FileUploader } from "@/components/document/file-uploader"
import { DocumentList } from "@/components/document/document-list"
import { DocumentService, Document as DocumentType } from "@/services/document-service"


export default function DocumentsPage() {
  const { data: session } = useSession()
  const { tenantId, tenantName } = useTenant()
  const [documents, setDocuments] = useState<DocumentType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch documents from the API using DocumentService
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!session || !tenantId) return

      try {
        setIsLoading(true)
        
        // Fetch documents using the service with the tenant ID from useTenant
        // console.log("Fetching documents for tenantId:", tenantId)
        // console.log("Current tenant name:", tenantName)
        // console.log("Current user role:", session.user.role)
        // console.log("Current user ID:", session.user.id)
        
        const data = await DocumentService.getDocuments(tenantId, searchQuery)
        // console.log("Documents fetched:", data)
        setDocuments(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocuments()
  }, [session, tenantId, searchQuery])

  const handleDocumentUpload = async (documentId: string) => {
    toast.success(`Document uploaded with ID: ${documentId}`)
    
    // Refresh the document list
    if (session && tenantId) {
      const data = await DocumentService.getDocuments(tenantId)
      setDocuments(data)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!session || !tenantId) {
      toast.error("Authentication error. Please log in again.")
      return
    }
    
    try {
      // Find the document name for better user feedback
      const documentToDelete = documents.find(doc => doc.id === documentId)
      const documentName = documentToDelete?.name || "document"
      
      // Show loading toast
      toast.loading(`Deleting ${documentName}...`)
      
      const success = await DocumentService.deleteDocument(tenantId, documentId)
      
      if (success) {
        // Remove the document from the local state
        setDocuments(documents.filter((doc) => doc.id !== documentId))
        toast.dismiss()
        toast.success(`"${documentName}" deleted successfully`)
      } else {
        toast.dismiss()
        toast.error(`Failed to delete "${documentName}". Please try again.`)
      }
    } catch (error) {
      console.error("Error in handleDeleteDocument:", error)
      toast.dismiss()
      toast.error(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleRetryDocument = async (documentId: string) => {
    if (!session || !tenantId) {
      toast.error("Authentication error. Please log in again.")
      return
    }
    
    try {
      // Find the document name for better user feedback
      const documentToRetry = documents.find(doc => doc.id === documentId)
      const documentName = documentToRetry?.name || "document"
      
      // Show loading toast
      toast.loading(`Retrying processing for ${documentName}...`)
      
      const success = await DocumentService.retryDocumentProcessing(tenantId, documentId)
      
      if (success) {
        // Get the current URL and reload it with a cache-busting parameter
        const url = new URL(window.location.href);
        url.searchParams.set('t', Date.now().toString());
        window.location.href = url.toString();
        
        toast.dismiss()
        toast.success(`Processing restarted for "${documentName}"`)
      } else {
        toast.dismiss()
        toast.error(`Failed to restart processing for "${documentName}". Please try again.`)
      }
    } catch (error) {
      console.error("Error in handleRetryDocument:", error)
      toast.dismiss()
      toast.error(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const filteredDocuments = documents.filter((doc) => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "Unknown"
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Document Management {tenantName && `- ${tenantName}`}</h1>
        <p className="text-gray-500">Upload and manage documents for the AI assistant</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <TabsList>
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="processed">Processed</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search documents..."
                className="pl-9 w-full sm:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>
                Upload documents to train the AI assistant. Supported formats: PDF, DOCX, TXT, XLSX.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader onUploadComplete={handleDocumentUpload} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Library</CardTitle>
              <CardDescription>Manage your uploaded documents</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="p-4 text-center border rounded-md">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E31937] mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading documents...</p>
                </div>
              ) : (
                <DocumentList
                  documents={filteredDocuments}
                  onDocumentDelete={handleDeleteDocument}
                  onDocumentRetry={handleRetryDocument}
                />
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-gray-500">
                Showing {filteredDocuments.length} of {documents.length} documents
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="processed">
          <Card>
            <CardContent className="p-6">
              <DocumentList
                documents={documents.filter((doc) => doc.status === "PROCESSED")}
                onDocumentDelete={handleDeleteDocument}
                onDocumentRetry={handleRetryDocument}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing">
          <Card>
            <CardContent className="p-6">
              <DocumentList
                documents={documents.filter((doc) => doc.status === "PROCESSING")}
                onDocumentDelete={handleDeleteDocument}
                onDocumentRetry={handleRetryDocument}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed">
          <Card>
            <CardContent className="p-6">
              <DocumentList
                documents={documents.filter((doc) => doc.status === "FAILED")}
                onDocumentDelete={handleDeleteDocument}
                onDocumentRetry={handleRetryDocument}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
