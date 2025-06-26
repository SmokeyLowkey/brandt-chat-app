"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { Citation } from "@/components/chat/citation-button";
import { getDownloadUrl } from "@/utils/s3";
import { useTenant } from "@/providers/tenant-provider";
import { cn } from "@/lib/utils";

// Add CSS for the pulse animation
const pulseAnimation = `
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(255, 215, 0, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(255, 215, 0, 0);
    }
  }
`;

// Set up the worker for PDF.js
// We'll use a public URL approach that works better with Next.js

interface PDFViewerSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  citation: Citation | null;
}

export function PDFViewerSidePanel({ isOpen, onClose, citation }: PDFViewerSidePanelProps) {
  const { tenantId } = useTenant();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isDocumentLoaded, setIsDocumentLoaded] = useState<boolean>(false);
  const [isPageLoaded, setIsPageLoaded] = useState<boolean>(false);

  // Set up the PDF.js worker
  useEffect(() => {
    // Use a CDN URL that's more reliable for Next.js
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  }, []);

  // Fetch the document when the citation changes
  useEffect(() => {
    if (citation && isOpen && tenantId) {
      fetchDocument(citation.documentId);
      // Set the page number from the citation
      if (citation.pageNumber) {
        setPageNumber(citation.pageNumber);
      }
    }
  }, [citation, isOpen, tenantId]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setPdfUrl(null);
      setError(null);
      setNumPages(null);
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

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsDocumentLoaded(true);
    console.log("PDF document loaded successfully with", numPages, "pages");
  };

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  const goToNextPage = () => {
    if (numPages && pageNumber < numPages) {
      setPageNumber(pageNumber + 1);
    }
  };

  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  // State to store page dimensions for coordinate transformation
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });

  // Handle page render success to get dimensions
  const onPageRenderSuccess = (page: any) => {
    setPageDimensions({
      width: page.width,
      height: page.height,
    });
    setIsPageLoaded(true);
    console.log(`Page ${pageNumber} rendered successfully with dimensions:`, page.width, "x", page.height);
  };

  // Effect to scroll to the highlighted area once the page is loaded
  useEffect(() => {
    if (isDocumentLoaded && isPageLoaded && citation && citation.bbox) {
      // Use a series of timeouts with increasing delays to ensure we catch the render
      const attemptScroll = (attempt = 1, maxAttempts = 5) => {
        if (attempt > maxAttempts) {
          console.warn(`Failed to scroll to highlight after ${maxAttempts} attempts`);
          return;
        }
        
        const delay = attempt * 500; // Increasing delay: 500ms, 1000ms, 1500ms, etc.
        
        console.log(`Scroll attempt ${attempt}/${maxAttempts} scheduled in ${delay}ms`);
        
        const timer = setTimeout(() => {
          try {
            console.log(`Attempt ${attempt}: Trying to scroll to highlight`);
            const highlightElement = document.querySelector('.pdf-highlight');
            console.log(`Attempt ${attempt}: Highlight element found:`, highlightElement);
            
            if (highlightElement) {
              // Try to scroll the parent container
              const container = document.querySelector('.pdf-container');
              console.log(`Attempt ${attempt}: Container element found:`, container);
              
              if (container) {
                // Get the position of the highlight relative to the container
                const highlightRect = highlightElement.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                // Calculate the scroll position
                const scrollTop = highlightRect.top - containerRect.top - (containerRect.height / 2) + container.scrollTop;
                
                // Scroll the container
                container.scrollTo({
                  top: scrollTop,
                  behavior: 'smooth'
                });
                
                console.log(`Attempt ${attempt}: Manually scrolled container to:`, scrollTop);
                
                // Force a reflow to ensure the scroll takes effect
                void (container as HTMLElement).offsetHeight;
                
                // Check if we actually scrolled to the right position
                setTimeout(() => {
                  const newHighlightRect = highlightElement.getBoundingClientRect();
                  const newContainerRect = container.getBoundingClientRect();
                  const highlightVisible =
                    newHighlightRect.top >= newContainerRect.top &&
                    newHighlightRect.bottom <= newContainerRect.bottom;
                  
                  console.log(`Attempt ${attempt}: Highlight visible after scroll:`, highlightVisible);
                  
                  if (!highlightVisible && attempt < maxAttempts) {
                    console.log(`Attempt ${attempt}: Highlight not visible, scheduling next attempt`);
                    attemptScroll(attempt + 1, maxAttempts);
                  }
                }, 100);
              } else {
                // Fallback to scrollIntoView
                highlightElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                console.log(`Attempt ${attempt}: Used scrollIntoView as fallback`);
                
                // Try again if we're not at max attempts
                if (attempt < maxAttempts) {
                  attemptScroll(attempt + 1, maxAttempts);
                }
              }
            } else {
              console.warn(`Attempt ${attempt}: Highlight element not found`);
              
              // Try again if we're not at max attempts
              if (attempt < maxAttempts) {
                attemptScroll(attempt + 1, maxAttempts);
              }
            }
          } catch (err) {
            console.error(`Attempt ${attempt}: Error scrolling to highlight:`, err);
            
            // Try again if we're not at max attempts
            if (attempt < maxAttempts) {
              attemptScroll(attempt + 1, maxAttempts);
            }
          }
        }, delay);
        
        return timer;
      };
      
      // Start the first attempt
      const firstTimer = attemptScroll();
      
      return () => {
        // Clear the first timer if component unmounts
        clearTimeout(firstTimer);
      };
    }
  }, [isDocumentLoaded, isPageLoaded, citation, pageNumber]);

  // Reset page loaded state when page number changes
  useEffect(() => {
    setIsPageLoaded(false);
  }, [pageNumber]);

  // Parse bbox string to coordinates
  const getBboxStyle = () => {
    if (!citation || !citation.bbox || pageDimensions.height === 0) return {};
    
    try {
      // Log the raw bbox string for debugging
      console.log("Raw bbox string:", citation.bbox);
      
      // Try different parsing approaches
      let x1, y1, x2, y2;
      
      if (citation.bbox.includes(',')) {
        // Try comma-separated format
        [x1, y1, x2, y2] = citation.bbox.split(',').map(parseFloat);
      } else if (citation.bbox.includes(' ')) {
        // Try space-separated format
        [x1, y1, x2, y2] = citation.bbox.split(' ').map(parseFloat);
      } else {
        // Try JSON format
        try {
          const bboxObj = JSON.parse(citation.bbox);
          x1 = bboxObj.x1 || bboxObj.left;
          y1 = bboxObj.y1 || bboxObj.top;
          x2 = bboxObj.x2 || (bboxObj.left + bboxObj.width);
          y2 = bboxObj.y2 || (bboxObj.top + bboxObj.height);
        } catch (e) {
          console.error("Failed to parse bbox as JSON:", e);
          throw e;
        }
      }
      
      // Log the parsed coordinates
      console.log("Parsed bbox coordinates:", { x1, y1, x2, y2 });
      console.log("Page dimensions:", pageDimensions);
      console.log("Current scale:", scale);
      
      // Ensure we have valid numbers
      if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
        throw new Error("Invalid bbox coordinates: contains NaN values");
      }
      
      // Transform coordinates from PDF coordinate system (origin at bottom-left)
      // to DOM coordinate system (origin at top-left)
      const left = x1 * scale;
      const top = (pageDimensions.height - y2) * scale;
      const width = Math.max(10, (x2 - x1) * scale); // Ensure minimum width
      const height = Math.max(10, (y2 - y1) * scale); // Ensure minimum height
      
      console.log("Calculated highlight position:", { left, top, width, height });
      
      // Create a more visible style
      return {
        position: 'absolute' as const,
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: 'rgba(255, 0, 0, 0.5)', // Red for better visibility
        border: '3px solid red', // Red border
        pointerEvents: 'all' as const,
        zIndex: 1000, // Very high z-index
        cursor: 'pointer',
      };
    } catch (err) {
      console.error("Error parsing bbox:", err);
      // Fallback to a visible indicator in the center of the page
      return {
        position: 'absolute' as const,
        left: '50%',
        top: '50%',
        width: '100px',
        height: '100px',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(255, 0, 0, 0.7)',
        border: '5px solid red',
        borderRadius: '50%',
        pointerEvents: 'all' as const,
        zIndex: 1000,
        cursor: 'pointer',
      };
    }
  };

  return (
    <>
      {/* Add the style tag for the pulse animation */}
      <style jsx global>{pulseAnimation}</style>
      
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
        
        <div className="flex-1 overflow-auto p-4 bg-gray-50 pdf-container">
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
              {/* Display the source text for reference */}
              {citation && citation.sourceText && (
                <div className="w-full mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md">
                  <h3 className="text-sm font-medium mb-1">Cited Text:</h3>
                  <p className="text-sm italic">{citation.sourceText}</p>
                </div>
              )}
              
              <div className="relative pdf-document-wrapper" style={{ border: '1px solid #ccc' }}>
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={(err) => setError("Failed to load PDF: " + err.message)}
                  loading={<Skeleton className="h-[80vh] w-full" />}
                >
                  {/* Add a key to force re-render when page changes */}
                  <Page
                    key={`page-${pageNumber}-${scale}`}
                    pageNumber={pageNumber}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    onRenderSuccess={onPageRenderSuccess}
                  />
                  
                  {/* Add visible markers at each corner of the page for reference */}
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'blue',
                    opacity: 0.5,
                    zIndex: 999
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'green',
                    opacity: 0.5,
                    zIndex: 999
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'yellow',
                    opacity: 0.5,
                    zIndex: 999
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'purple',
                    opacity: 0.5,
                    zIndex: 999
                  }} />
                  
                  {/* The highlight element */}
                  {citation && citation.bbox && isPageLoaded && (
                    <div
                      className="pdf-highlight"
                      style={{
                        ...getBboxStyle(),
                        cursor: 'pointer',
                        pointerEvents: 'all',
                        boxShadow: '0 0 10px 5px rgba(255, 0, 0, 0.7)',
                        animation: 'pulse 2s infinite'
                      }}
                      data-testid="pdf-highlight"
                      onClick={() => {
                        const element = document.querySelector('.pdf-highlight');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          console.log("Manually triggered scroll on highlight click");
                        }
                      }}
                    />
                  )}
                </Document>
              </div>
              
              {citation && (
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {citation.bbox && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const element = document.querySelector('.pdf-highlight');
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            console.log("Manually triggered scroll from button");
                          }
                        }}
                      >
                        Show Highlight
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Force re-render of the highlight by toggling a state
                          setIsPageLoaded(false);
                          setTimeout(() => setIsPageLoaded(true), 100);
                          console.log("Forced highlight re-render");
                        }}
                      >
                        Refresh Highlight
                      </Button>
                    </>
                  )}
                  
                  {citation.sourceText && (
                    <Button
                      variant="default"
                      onClick={() => {
                        // Use the browser's find functionality to search for the cited text
                        if (window) {
                          // First focus on the PDF container
                          const container = document.querySelector('.pdf-container');
                          if (container) {
                            // Use tabIndex to make the element focusable
                            (container as HTMLElement).tabIndex = -1;
                            (container as HTMLElement).focus();
                            
                            // Get a clean version of the text (first 50 chars to avoid too long searches)
                            const searchText = citation.sourceText.substring(0, 50).trim();
                            console.log("Searching for text:", searchText);
                            
                            // Use the browser's find functionality
                            try {
                              // Try to use the browser's find API if available
                              // @ts-ignore - window.find is not in the TypeScript types but exists in many browsers
                              if (window.find && typeof window.find === 'function') {
                                // @ts-ignore
                                window.find(searchText, false, false, true, false, true, false);
                                console.log("Used window.find() to search for text");
                              } else {
                                // Last resort: simulate keyboard shortcut for find
                                const event = new KeyboardEvent('keydown', {
                                  key: 'f',
                                  code: 'KeyF',
                                  ctrlKey: true,
                                  cancelable: true
                                });
                                document.dispatchEvent(event);
                                console.log("Simulated Ctrl+F keyboard shortcut");
                                
                                // Set a timeout to type the search text
                                setTimeout(() => {
                                  // Try to find the search input and fill it
                                  const searchInputs = Array.from(document.querySelectorAll('input'));
                                  const searchInput = searchInputs.find(input =>
                                    input.getAttribute('type') === 'search' ||
                                    input.getAttribute('aria-label')?.toLowerCase().includes('search') ||
                                    input.getAttribute('placeholder')?.toLowerCase().includes('search')
                                  );
                                  
                                  if (searchInput) {
                                    searchInput.value = searchText;
                                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                                    console.log("Filled search input with text");
                                  }
                                }, 300);
                              }
                            } catch (err) {
                              console.error("Error using find functionality:", err);
                            }
                          }
                        }
                      }}
                    >
                      Find Text in PDF
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Log detailed debugging info
                      console.log("--- DEBUG INFO ---");
                      console.log("Citation:", citation);
                      console.log("Page dimensions:", pageDimensions);
                      console.log("Scale:", scale);
                      console.log("Page number:", pageNumber);
                      console.log("Document loaded:", isDocumentLoaded);
                      console.log("Page loaded:", isPageLoaded);
                      console.log("Highlight element:", document.querySelector('.pdf-highlight'));
                      console.log("Container element:", document.querySelector('.pdf-container'));
                    }}
                  >
                    Debug Info
                  </Button>
                </div>
              )}
              
              <div className="flex items-center justify-between w-full mt-4 bg-white p-2 rounded-md border">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPrevPage}
                    disabled={pageNumber <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {pageNumber} of {numPages || "?"}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNextPage}
                    disabled={!numPages || pageNumber >= numPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={zoomOut}
                    disabled={scale <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">{Math.round(scale * 100)}%</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={zoomIn}
                    disabled={scale >= 3.0}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
      </Sheet>
    </>
  );
}

export default PDFViewerSidePanel;