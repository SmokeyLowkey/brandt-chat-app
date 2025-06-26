"use client";

import { useState } from "react";
import { Citation } from "@/components/chat/citation-button";

export function usePdfViewer() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  const openPdfViewer = (citation: Citation) => {
    setSelectedCitation(citation);
    setIsOpen(true);
  };

  const closePdfViewer = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    selectedCitation,
    openPdfViewer,
    closePdfViewer,
  };
}

export default usePdfViewer;