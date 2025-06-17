"use client";

import { Bot, RefreshCw } from "lucide-react";

interface TypingIndicatorProps {
  isRetrying?: boolean;
}

export default function TypingIndicator({ isRetrying = false }: TypingIndicatorProps) {
  return (
    <div className="flex mb-4 justify-start mt-6">
      <div className="flex max-w-[85%]">
        <div className={`flex-shrink-0 h-10 w-10 rounded-full ${isRetrying ? 'bg-amber-500' : 'bg-gradient-to-br from-[#E31937] to-[#c01730]'} text-white flex items-center justify-center mr-3 shadow-md`}>
          {isRetrying ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Bot className="h-5 w-5" />
          )}
        </div>
        <div className="p-4 rounded-2xl rounded-tl-sm bg-white border border-gray-200 shadow-sm">
          {isRetrying ? (
            <div className="text-sm text-amber-600 font-medium">Retrying connection...</div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-[#E31937] bg-opacity-30 rounded-full animate-pulse"></div>
              <div
                className="w-3 h-3 bg-[#E31937] bg-opacity-50 rounded-full animate-pulse"
                style={{ animationDelay: "0.3s" }}
              ></div>
              <div
                className="w-3 h-3 bg-[#E31937] bg-opacity-70 rounded-full animate-pulse"
                style={{ animationDelay: "0.6s" }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}