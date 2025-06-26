"use client";

import { useState } from "react";
import { Citation, CitationButton } from "@/components/chat/citation-button";
import { PDFViewerSidePanel } from "@/components/document/pdf-viewer-side-panel";

export interface CitedAnswerProps {
  answer: string;
  citations: Citation[];
  onViewSource?: (citation: Citation) => void;
}

export function CitedAnswer({ answer, citations, onViewSource }: CitedAnswerProps) {
  // Use local state only if no external handler is provided
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  const handleViewSource = (citation: Citation) => {
    if (onViewSource) {
      // Use the external handler if provided
      onViewSource(citation);
    } else {
      // Otherwise use local state
      setSelectedCitation(citation);
      setIsViewerOpen(true);
    }
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
  };

  // Function to insert citation buttons at the end of the answer
  const renderAnswerWithCitations = () => {
    return (
      <div>
        <span>{answer}</span>
        {citations.length > 0 && (
          <span className="inline-flex items-center">
            {citations.map((citation, index) => (
              <CitationButton 
                key={`${citation.documentId}-${index}`} 
                citation={citation} 
                onViewSource={handleViewSource} 
              />
            ))}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      {renderAnswerWithCitations()}
      
      {/* Only render the PDF viewer if we're using local state */}
      {!onViewSource && (
        <PDFViewerSidePanel
          isOpen={isViewerOpen}
          onClose={handleCloseViewer}
          citation={selectedCitation}
        />
      )}
    </>
  );
}

export default CitedAnswer;