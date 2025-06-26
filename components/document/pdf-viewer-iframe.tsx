"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { X, ExternalLink, ChevronLeft } from "lucide-react";
import { Citation } from "@/components/chat/citation-button";
import { getDownloadUrl } from "@/utils/s3";
import { useTenant } from "@/providers/tenant-provider";
import { cn } from "@/lib/utils";

interface PDFViewerIframeProps {
  isOpen: boolean;
  onClose: () => void;
  citation: Citation | null;
}

export function PDFViewerIframe({ isOpen, onClose, citation }: PDFViewerIframeProps) {
  const { tenantId } = useTenant();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Fetch the document when the citation changes
  useEffect(() => {
    if (citation && isOpen && tenantId) {
      fetchDocument(citation.documentId);
    }
  }, [citation, isOpen, tenantId]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setPdfUrl(null);
      setError(null);
    }
  }, [isOpen]);

  const fetchDocument = async (documentId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the new citation-specific API endpoint
      const response = await fetch(`/api/citations/${documentId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch document: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      setDocumentTitle(data.name || "Document " + documentId);
      
      // Use the pre-signed URL directly from the API response
      setPdfUrl(data.downloadUrl);
    } catch (err: any) {
      console.error("Error fetching document:", err);
      // Handle S3 permission errors specifically
      if (err.message && err.message.includes("AccessDenied")) {
        setError("Access denied to document. S3 permissions may need to be configured.");
      } else {
        setError(err.message || "Failed to load document");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to highlight the citation text
  const highlightCitation = () => {
    if (!citation || !citation.sourceText) return null;
    
    // Simple text highlighting approach
    return (
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="text-sm font-medium mb-2">Cited Text:</h3>
        <p className="text-sm italic">{citation.sourceText}</p>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className={cn(
          "w-full p-0 flex flex-col transition-all duration-300",
          isExpanded
            ? "sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl"
            : "sm:max-w-xl md:max-w-2xl lg:max-w-3xl"
        )}
      >
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mr-2"
                aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
              >
                <ChevronLeft className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
              </Button>
              <SheetTitle className="text-lg font-semibold truncate max-w-[calc(100%-2rem)]">
                {documentTitle || "Document Viewer"}
              </SheetTitle>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full">
              <Skeleton className="h-[80vh] w-full" />
              <p className="mt-4 text-sm text-gray-500">Loading document...</p>
            </div>
          )}
          
          {error && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md">
                <h3 className="text-red-800 font-medium">Error loading document</h3>
                <p className="text-red-700 mt-2">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => citation && fetchDocument(citation.documentId)}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}
          
          {pdfUrl && !isLoading && !error && (
            <div className="flex flex-col items-center">
              {/* Display the citation text */}
              {highlightCitation()}
              
              {/* Use an iframe to display the PDF */}
              <div className="w-full mt-4 h-[70vh] border border-gray-200 rounded-md overflow-hidden">
                <iframe 
                  src={pdfUrl} 
                  className="w-full h-full" 
                  title={documentTitle}
                />
              </div>
              
              {/* Open in new tab button */}
              <div className="w-full mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(pdfUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in new tab
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default PDFViewerIframe;