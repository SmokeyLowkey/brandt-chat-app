"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface Citation {
  documentId: string;
  pageNumber: number;
  bbox: string;
  sourceText: string;
}

interface CitationButtonProps {
  citation: Citation;
  onViewSource: (citation: Citation) => void;
}

export function CitationButton({ citation, onViewSource }: CitationButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-5 w-5 rounded-full p-0 inline-flex items-center justify-center ml-1 ${
              isHovered ? "bg-gray-200 dark:bg-gray-700" : "bg-transparent"
            }`}
            onClick={() => onViewSource(citation)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label="View source document"
          >
            <FileText className="h-3.5 w-3.5 text-gray-500" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">View source document</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default CitationButton;