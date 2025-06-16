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
        isLastInGroup ? "mb-3" : "mb-0.5"
      )}
    >
      <div className={cn("flex max-w-[85%]", isUser ? "flex-row-reverse" : "", "group")}>
        {/* Only show avatar for first message in a group */}
        {isFirstInGroup && (
          <div
            className={cn(
              "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
              isUser
                ? "bg-gradient-to-br from-gray-800 to-black text-white shadow-md ml-3"
                : "bg-gradient-to-br from-[#E31937] to-[#c01730] text-white shadow-md mr-3"
            )}
          >
            {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
          </div>
        )}

        {/* Spacer div to align consecutive messages */}
        {!isFirstInGroup && (
          <div className={cn("flex-shrink-0 w-10", isUser ? "ml-3" : "mr-3")}></div>
        )}

        <div className="max-w-full">
          <div
            className={cn(
              "p-4 rounded-2xl shadow-sm transition-all",
              isUser
                ? "bg-gradient-to-r from-[#E31937] to-[#c01730] text-white"
                : "bg-white border border-gray-200 hover:border-gray-300",
              isFirstInGroup && !isUser ? "rounded-tl-sm" : "",
              isFirstInGroup && isUser ? "rounded-tr-sm" : ""
            )}
          >
            {/* Format message content with markdown-like styling */}
            <div className={cn(
              "prose max-w-none",
              isUser ? "prose-invert" : "",
              "text-base leading-relaxed"
            )}>
              {/* Process the content as a whole to better handle multi-line lists */}
              {(() => {
                // Split content into lines
                const lines = content.split('\n');
                const formattedContent = [];
                let currentList = null;
                let currentListType = null;
                let currentCodeBlock = null;
                let inCodeBlock = false;

                // Process each line
                for (let i = 0; i < lines.length; i++) {
                  const line = lines[i];
                  
                  // Handle code blocks
                  if (line.startsWith('```')) {
                    if (inCodeBlock) {
                      // End of code block
                      formattedContent.push(
                        <pre key={`code-${i}`} className={cn(
                          "text-sm rounded-md bg-gray-100 p-3 overflow-x-auto my-3",
                          isUser ? "bg-opacity-20" : ""
                        )}>
                          <code>{currentCodeBlock}</code>
                        </pre>
                      );
                      inCodeBlock = false;
                      currentCodeBlock = null;
                    } else {
                      // Start of code block
                      inCodeBlock = true;
                      currentCodeBlock = '';
                    }
                    continue;
                  }

                  if (inCodeBlock) {
                    currentCodeBlock += line + '\n';
                    continue;
                  }

                  // Handle bullet lists (starting with "- " or "• ")
                  if (line.match(/^[\s]*[-•]\s/)) {
                    const content = line.replace(/^[\s]*[-•]\s/, '');
                    
                    if (currentListType !== 'bullet') {
                      // Start a new bullet list
                      if (currentList) {
                        // Push the previous list if it exists
                        formattedContent.push(currentList);
                      }
                      currentList = [<li key={`bullet-${i}`} className="mb-1">{content}</li>];
                      currentListType = 'bullet';
                    } else {
                      // Add to existing bullet list
                      if (currentList) {
                        currentList.push(<li key={`bullet-${i}`} className="mb-1">{content}</li>);
                      }
                    }
                    continue;
                  }

                  // Handle numbered lists (starting with "1. ", "2. ", etc.)
                  if (line.match(/^[\s]*\d+\.\s/)) {
                    const content = line.replace(/^[\s]*\d+\.\s/, '');
                    
                    if (currentListType !== 'number') {
                      // Start a new numbered list
                      if (currentList) {
                        // Push the previous list if it exists
                        formattedContent.push(currentList);
                      }
                      currentList = [<li key={`number-${i}`} className="mb-1">{content}</li>];
                      currentListType = 'number';
                    } else {
                      // Add to existing numbered list
                      if (currentList) {
                        currentList.push(<li key={`number-${i}`} className="mb-1">{content}</li>);
                      }
                    }
                    continue;
                  }

                  // If we reach here, we're not in a list anymore
                  if (currentList) {
                    // Push the current list before moving on
                    if (currentListType === 'bullet') {
                      formattedContent.push(
                        <ul key={`ul-${i}`} className="list-disc pl-5 mb-3 mt-2 space-y-1">
                          {currentList}
                        </ul>
                      );
                    } else if (currentListType === 'number') {
                      formattedContent.push(
                        <ol key={`ol-${i}`} className="list-decimal pl-5 mb-3 mt-2 space-y-1">
                          {currentList}
                        </ol>
                      );
                    }
                    currentList = null;
                    currentListType = null;
                  }

                  // Handle empty lines as paragraph breaks
                  if (line.trim() === '') {
                    formattedContent.push(<div key={`br-${i}`} className="h-2"></div>);
                    continue;
                  }

                  // Handle regular paragraphs with inline formatting
                  const parts = line.split('`');
                  if (parts.length > 1) {
                    // Has inline code
                    formattedContent.push(
                      <p key={`p-${i}`} className="mb-2">
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
                                  "px-1.5 py-0.5 rounded font-mono text-sm",
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
                  } else {
                    // Regular paragraph
                    formattedContent.push(
                      <p key={`p-${i}`} className="mb-2">
                        {line.split(/(https?:\/\/[^\s]+)/).map((text, j) => {
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
                  }
                }

                // Don't forget to add the last list if there is one
                if (currentList) {
                  if (currentListType === 'bullet') {
                    formattedContent.push(
                      <ul key="ul-last" className="list-disc pl-5 mb-3 mt-2 space-y-1">
                        {currentList}
                      </ul>
                    );
                  } else if (currentListType === 'number') {
                    formattedContent.push(
                      <ol key="ol-last" className="list-decimal pl-5 mb-3 mt-2 space-y-1">
                        {currentList}
                      </ol>
                    );
                  }
                }

                // If we're still in a code block at the end, add it
                if (inCodeBlock && currentCodeBlock) {
                  formattedContent.push(
                    <pre key="code-last" className={cn(
                      "text-sm rounded-md bg-gray-100 p-3 overflow-x-auto my-3",
                      isUser ? "bg-opacity-20" : ""
                    )}>
                      <code>{currentCodeBlock}</code>
                    </pre>
                  );
                }

                return formattedContent;
              })()}
            </div>
          </div>

          {/* Only show timestamp for last message in a group */}
          {isLastInGroup && (
            <div
              className={cn(
                "text-xs text-gray-400 mt-1.5",
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