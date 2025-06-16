"use client";

import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatMessage({
  content,
  role,
  timestamp,
  isFirstInGroup,
  isLastInGroup,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex",
        isUser ? "justify-end" : "justify-start",
        isFirstInGroup ? "mt-6" : "mt-1",
        isLastInGroup ? "mb-2" : "mb-0"
      )}
    >
      <div className={cn("flex max-w-[80%]", isUser ? "flex-row-reverse" : "", "group")}>
        {/* Only show avatar for first message in a group */}
        {isFirstInGroup && (
          <div
            className={cn(
              "flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center",
              isUser
                ? "bg-gradient-to-br from-gray-800 to-black text-white shadow-md ml-2"
                : "bg-gradient-to-br from-[#E31937] to-[#c01730] text-white shadow-md mr-2"
            )}
          >
            {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
          </div>
        )}

        {/* Spacer div to align consecutive messages */}
        {!isFirstInGroup && (
          <div className={cn("flex-shrink-0 w-9", isUser ? "ml-2" : "mr-2")}></div>
        )}

        <div className="max-w-full">
          <div
            className={cn(
              "p-3.5 rounded-2xl shadow-sm transition-all",
              isUser
                ? "bg-gradient-to-r from-[#E31937] to-[#c01730] text-white"
                : "bg-white border border-gray-100 hover:border-gray-200",
              isFirstInGroup && !isUser ? "rounded-tl-sm" : "",
              isFirstInGroup && isUser ? "rounded-tr-sm" : ""
            )}
          >
            {/* Format message content with markdown-like styling */}
            <div className="prose prose-sm max-w-none">
              {content.split('\n').map((paragraph, i) => {
                // Handle code blocks
                if (paragraph.startsWith('```') && paragraph.endsWith('```')) {
                  return (
                    <pre key={i} className={cn(
                      "text-sm rounded bg-gray-100 p-2 overflow-x-auto",
                      isUser ? "bg-opacity-20" : ""
                    )}>
                      <code>{paragraph.slice(3, -3)}</code>
                    </pre>
                  );
                }

                // Handle inline code
                const parts = paragraph.split('`');
                if (parts.length > 1) {
                  return (
                    <p key={i} className="mb-2 last:mb-0">
                      {parts.map((part, j) => {
                        if (j % 2 === 0) {
                          // Process links in text parts
                          return part.split(/(https?:\/\/[^\s]+)/).map((text, k) => {
                            if (text.match(/^https?:\/\//)) {
                              return (
                                <a
                                  key={k}
                                  href={text}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={cn(
                                    "underline",
                                    isUser ? "text-blue-100" : "text-blue-600"
                                  )}
                                >
                                  {text}
                                </a>
                              );
                            }
                            return text;
                          });
                        } else {
                          return (
                            <code
                              key={j}
                              className={cn(
                                "px-1.5 py-0.5 rounded",
                                isUser
                                  ? "bg-white bg-opacity-20"
                                  : "bg-gray-100"
                              )}
                            >
                              {part}
                            </code>
                          );
                        }
                      })}
                    </p>
                  );
                }

                // Handle lists
                if (paragraph.startsWith('- ')) {
                  return (
                    <ul key={i} className="list-disc pl-5 mb-2 last:mb-0">
                      <li>{paragraph.substring(2)}</li>
                    </ul>
                  );
                }

                if (/^\d+\.\s/.test(paragraph)) {
                  return (
                    <ol key={i} className="list-decimal pl-5 mb-2 last:mb-0">
                      <li>{paragraph.replace(/^\d+\.\s/, '')}</li>
                    </ol>
                  );
                }

                // Process links in regular paragraphs
                return (
                  <p key={i} className="mb-2 last:mb-0">
                    {paragraph.split(/(https?:\/\/[^\s]+)/).map((text, j) => {
                      if (text.match(/^https?:\/\//)) {
                        return (
                          <a
                            key={j}
                            href={text}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "underline",
                              isUser ? "text-blue-100" : "text-blue-600"
                            )}
                          >
                            {text}
                          </a>
                        );
                      }
                      return text;
                    })}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Only show timestamp for last message in a group */}
          {isLastInGroup && (
            <div
              className={cn(
                "text-xs text-gray-400 mt-1",
                isUser ? "text-right mr-1" : "ml-1",
                "opacity-0 group-hover:opacity-100 transition-opacity"
              )}
            >
              {formatTime(timestamp)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}