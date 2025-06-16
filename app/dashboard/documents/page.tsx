"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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
  const [documents, setDocuments] = useState<DocumentType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch documents from the API using DocumentService
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!session) return

      try {
        setIsLoading(true)
        
        // Get the current tenant ID from the URL
        const pathParts = window.location.pathname.split('/')
        const tenantId = pathParts[2] === 'admin' && pathParts[3] === 'tenants'
          ? pathParts[4] // Admin viewing a specific tenant
          : session.user.tenantId // Regular user viewing their tenant
        
        // Fetch documents using the service
        console.log("Fetching documents for tenantId:", tenantId)
        console.log("Current user role:", session.user.role)
        console.log("Current user ID:", session.user.id)
        
        const data = await DocumentService.getDocuments(tenantId, searchQuery)
        console.log("Documents fetched:", data)
        setDocuments(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocuments()
  }, [session, searchQuery])

  const handleDocumentUpload = async (documentId: string) => {
    toast.success(`Document uploaded with ID: ${documentId}`)
    
    // Refresh the document list
    if (session) {
      const pathParts = window.location.pathname.split('/')
      const tenantId = pathParts[2] === 'admin' && pathParts[3] === 'tenants'
        ? pathParts[4] // Admin viewing a specific tenant
        : session.user.tenantId // Regular user viewing their tenant
      
      const data = await DocumentService.getDocuments(tenantId)
      setDocuments(data)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!session) return
    
    // Get the current tenant ID
    const pathParts = window.location.pathname.split('/')
    const tenantId = pathParts[2] === 'admin' && pathParts[3] === 'tenants'
      ? pathParts[4] // Admin viewing a specific tenant
      : session.user.tenantId // Regular user viewing their tenant
    
    const success = await DocumentService.deleteDocument(tenantId, documentId)
    
    if (success) {
      // Remove the document from the local state
      setDocuments(documents.filter((doc) => doc.id !== documentId))
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
        <h1 className="text-2xl font-bold">Document Management</h1>
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
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
