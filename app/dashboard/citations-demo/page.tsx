"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PDFViewerIframe } from "@/components/document/pdf-viewer-iframe";
import { Citation } from "@/components/chat/citation-button";
import { CitedAnswer } from "@/components/chat/cited-answer";
import { usePdfViewer } from "@/hooks/use-pdf-viewer";

export default function CitationsDemoPage() {
  const { isOpen, selectedCitation, openPdfViewer, closePdfViewer } = usePdfViewer();

  // Example citation data with a real document ID
  const exampleCitation: Citation = {
    documentId: "cmcc401sy000dd8kcugb9qufb", // Real document ID from the system
    pageNumber: 1,
    bbox: "107.39669799804688,-2.9035072326660156,689.21533203125,38.168479919433594", // Example bbox coordinates
    sourceText: "REPLACEMENT PARTS GUIDE 8RT Final Tier 4 (FT4) Series Track Tractors [PHONE_REDACTED]00) – 8320RT, 8345RT, 8370RT FILTER OVERVIEW WITH SERVICE INTERVALS RX535027 ENGINE ENGINE CAB Jan 2024. Release Date. FUEL TANK VENT FILTER H216169 Replace after every 1500 hours."
  };

  // Example cited answer data
  const exampleCitedAnswer = {
    answer: "This is an example answer with a citation that demonstrates how the citation feature works.",
    citations: [exampleCitation]
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Citations Feature Demo</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Example Chat Message with Citation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-white rounded-lg border">
              <CitedAnswer 
                answer={exampleCitedAnswer.answer} 
                citations={exampleCitedAnswer.citations}
                onViewSource={openPdfViewer}
              />
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">How to Use</h3>
              <p className="text-gray-700 mb-4">
                Click on the citation icon (document symbol) to open the PDF viewer side panel.
                The PDF will be displayed with the relevant text highlighted.
              </p>
              
              <div className="flex space-x-4">
                <Button 
                  onClick={() => openPdfViewer(exampleCitation)}
                  className="bg-[#E31937] hover:bg-[#c01730]"
                >
                  Open PDF Viewer Manually
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* PDF Viewer Side Panel */}
      <PDFViewerIframe
        isOpen={isOpen}
        onClose={closePdfViewer}
        citation={selectedCitation}
      />
    </div>
  );
}