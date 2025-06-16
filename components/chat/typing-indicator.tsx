"use client";

import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex mb-4 justify-start mt-6">
      <div className="flex max-w-[80%]">
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-[#E31937] to-[#c01730] text-white flex items-center justify-center mr-2 shadow-md">
          <Bot className="h-5 w-5" />
        </div>
        <div className="p-3.5 rounded-2xl rounded-tl-sm bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-[#E31937] bg-opacity-30 rounded-full animate-pulse"></div>
            <div
              className="w-2.5 h-2.5 bg-[#E31937] bg-opacity-50 rounded-full animate-pulse"
              style={{ animationDelay: "0.3s" }}
            ></div>
            <div
              className="w-2.5 h-2.5 bg-[#E31937] bg-opacity-70 rounded-full animate-pulse"
              style={{ animationDelay: "0.6s" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}