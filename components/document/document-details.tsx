"use client"

import { useState, useEffect } from "react"
import { Document } from "@/services/document-service"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, HardDrive, AlertTriangle, CheckCircle, Clock, Download } from "lucide-react"
import { getDownloadUrl } from "@/utils/s3"

interface DocumentDetailsProps {
  document: Document
  isOpen: boolean
  onClose: () => void
}

export function DocumentDetails({ document, isOpen, onClose }: DocumentDetailsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  
  // Get the S3 key from metadata
  const metadata = document.metadata as any;
  const s3Key = metadata?.s3Key ||
                metadata?.fileKey ||
                document.url.split('.amazonaws.com/')[1];
  
  // Generate a pre-signed download URL when the dialog is opened
  useEffect(() => {
    if (isOpen && s3Key) {
      setIsLoading(true);
      getDownloadUrl(s3Key)
        .then(url => {
          setDownloadUrl(url);
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Error generating download URL:", error);
          setDownloadUrl(null);
          setIsLoading(false);
        });
    } else {
      setDownloadUrl(null);
    }
  }, [isOpen, s3Key]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "Unknown"
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PROCESSED":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "PROCESSING":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "FAILED":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PROCESSED":
        return "bg-green-100 text-green-800 border-green-200"
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl w-[95%] md:w-[600px]" style={{ maxHeight: 'fit-content' }}>
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <FileText className="h-6 w-6 flex-shrink-0 text-[#E31937]" />
            <div className="max-w-[calc(100%-3rem)] overflow-hidden">
              <div className="truncate font-bold" title={document.name}>{document.name}</div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-sm mt-2">Document details and metadata</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6 px-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge className={`flex items-center gap-1 px-3 py-1.5 ${getStatusColor(document.status)}`}>
              {getStatusIcon(document.status)}
              <span className="text-sm">{document.status.charAt(0) + document.status.slice(1).toLowerCase()}</span>
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Type:</span>
            <span className="text-sm">{document.type.toUpperCase()}</span>
          </div>

          {document.metadata?.size && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Size:</span>
              <div className="flex items-center gap-1 text-sm">
                <HardDrive className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                <span>{formatFileSize(document.metadata.size)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Created:</span>
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
              <span title={formatDate(document.createdAt)}>
                {formatDate(document.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Updated:</span>
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
              <span title={formatDate(document.updatedAt)}>
                {formatDate(document.updatedAt)}
              </span>
            </div>
          </div>

          {/* Display namespace if available */}
          {(document.metadata as any)?.namespace && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Namespace:</span>
              <span className="text-sm" title={(document.metadata as any).namespace}>
                {(document.metadata as any).namespace}
              </span>
            </div>
          )}

          {/* Display description if available */}
          {(document.metadata as any)?.description && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Description:</span>
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm whitespace-pre-line break-words leading-relaxed">{(document.metadata as any).description}</p>
              </div>
            </div>
          )}

          {/* Show retry information if available */}
          {(document.metadata as any)?.retryAttempt && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Retry:</span>
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                <span>Retried on {formatDate((document.metadata as any).retryAt)}</span>
              </div>
            </div>
          )}

          {document.status === "FAILED" && document.metadata?.error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
              <div className="flex items-start">
                <AlertTriangle className="mr-3 h-5 w-5 text-red-500 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Processing Error</h4>
                  <p className="mt-2 text-sm text-red-700 break-words leading-relaxed">{document.metadata.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between pt-4">
          <Button
            variant="outline"
            size="default"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            variant="default"
            size="default"
            disabled={isLoading || !downloadUrl}
            asChild={!isLoading && !!downloadUrl}
            className="bg-[#E31937] hover:bg-[#c01730]"
          >
            {isLoading ? (
              <span>Loading...</span>
            ) : downloadUrl ? (
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer" download={document.name}>
                <Download className="mr-2 h-4 w-4" />
                Download Document
              </a>
            ) : (
              <span>Download Unavailable</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}