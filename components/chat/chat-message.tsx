"use client";

import { Bot, User, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import React from 'react';

import { ComponentData } from "@/utils/chat-processing";
import { CitedAnswer } from "@/components/chat/cited-answer";
import { CitationButton } from "@/components/chat/citation-button";

interface ChatMessageProps {
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  componentData?: ComponentData;
  onViewSource?: (citation: any) => void;
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Simple text component for rendering plain text
function SimpleText({ text }: { text: string }) {
  return <p className="mb-1.5">{text}</p>;
}

// Product specs component for rendering structured product information
function ProductSpecs({ introduction, specs, note, onViewSource }: {
  introduction: string;
  specs: Array<{
    key: string;
    value: string;
    citations?: Array<{
      documentId: string;
      pageNumber: number;
      bbox: string;
      sourceText: string;
    }>;
  }>;
  note?: string;
  onViewSource?: (citation: any) => void;
}) {
  return (
    <div className="mb-2">
      {introduction && <p className="mb-2 font-medium">{introduction}</p>}
      
      <div className="bg-gray-50 rounded-md p-3 mb-2">
        {specs.map((spec, index) => (
          <div key={index} className={`flex ${index !== specs.length - 1 ? 'border-b border-gray-200 pb-2 mb-2' : ''}`}>
            <div className="w-1/3 font-medium text-gray-700">{spec.key}</div>
            <div className="w-2/3 text-gray-900">
              {spec.value}
              {spec.citations && spec.citations.length > 0 && onViewSource && (
                <span className="inline-flex items-center">
                  {spec.citations.map((citation, citIndex) => (
                    <CitationButton
                      key={`${citation.documentId}-${citIndex}`}
                      citation={citation}
                      onViewSource={onViewSource}
                    />
                  ))}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {note && <p className="text-sm text-gray-600 italic">{note}</p>}
    </div>
  );
}

// Function to render the appropriate component based on componentData
function renderComponent(componentData: ComponentData, onViewSource?: (citation: any) => void) {
  switch (componentData.component) {
    case 'SimpleText':
      return <SimpleText text={componentData.props.text} />;
    case 'ProductSpecs':
      return (
        <ProductSpecs
          introduction={componentData.props.introduction || ''}
          specs={componentData.props.specs || []}
          note={componentData.props.note}
          onViewSource={onViewSource}
        />
      );
    case 'CitedAnswer':
      return (
        <CitedAnswer
          answer={componentData.props.answer || ''}
          citations={componentData.props.citations || []}
          onViewSource={onViewSource}
        />
      );
    default:
      return <p className="mb-2 text-amber-600">Unknown component type: {componentData.component}</p>;
  }
}

export default function ChatMessage({
  content,
  role,
  timestamp,
  isFirstInGroup,
  isLastInGroup,
  componentData,
  onViewSource,
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
              "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
              isUser
                ? "bg-gradient-to-br from-gray-800 to-black text-white shadow-md ml-2"
                : "bg-gradient-to-br from-[#E31937] to-[#c01730] text-white shadow-md mr-2"
            )}
          >
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </div>
        )}

        {/* Spacer div to align consecutive messages */}
        {!isFirstInGroup && (
          <div className={cn("flex-shrink-0 w-8", isUser ? "ml-2" : "mr-2")}></div>
        )}

        <div className="max-w-full">
          <div
            className={cn(
              "p-3 rounded-xl shadow-sm transition-all",
              isUser
                ? "bg-gradient-to-r from-[#E31937] to-[#c01730] text-white"
                : "bg-white border border-gray-200 hover:border-gray-300",
              isFirstInGroup && !isUser ? "rounded-tl-sm" : "",
              isFirstInGroup && isUser ? "rounded-tr-sm" : ""
            )}
          >
            {/* Render component if componentData is available, otherwise format message content */}
            <div className={cn(
              "prose max-w-none",
              isUser ? "prose-invert" : "",
              "text-sm leading-relaxed"
            )}>
              {componentData ? (
                renderComponent(componentData, onViewSource)
              ) : role === 'assistant' && !isUser ? (
                // Use ReactMarkdown for assistant messages to properly render markdown
                <ReactMarkdown
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-3 mb-2" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-md font-bold mt-3 mb-2" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-base font-bold mt-2 mb-1" {...props} />,
                    p: ({node, ...props}) => <p className="mb-2" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 mt-1.5 space-y-0.5" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 mt-1.5 space-y-0.5" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    a: ({node, href, children, ...props}) => {
                      // Check if the children is just a URL
                      const isUrlText = React.Children.count(children) === 1 &&
                        typeof children === 'string' &&
                        children.toString().startsWith('http');
                      
                      return (
                        <a
                          href={href}
                          className="text-blue-600 underline hover:text-blue-800"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.preventDefault();
                            if (href) window.open(href, '_blank');
                          }}
                          {...props}
                        >
                          {children}
                          <ExternalLink size={12} className="inline-block ml-1 mb-1" />
                        </a>
                      );
                    },
                    code: ({node, ...props}) => <code className="px-1 py-0.5 rounded font-mono text-xs bg-gray-100" {...props} />,
                    pre: ({node, ...props}) => <pre className="rounded-md bg-gray-100 p-2 overflow-x-auto my-2 text-xs" {...props} />,
                    hr: ({node, ...props}) => <hr className="my-4 border-gray-200" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                    em: ({node, ...props}) => <em className="italic" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="pl-4 border-l-4 border-gray-200 italic" {...props} />,
                  }}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                /* Process the content as a whole to better handle multi-line lists for user messages */
                (() => {
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
                          "text-xs rounded-md bg-gray-100 p-2 overflow-x-auto my-2",
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
                        <ul key={`ul-${i}`} className="list-disc pl-4 mb-2 mt-1.5 space-y-0.5 text-sm">
                          {currentList}
                        </ul>
                      );
                    } else if (currentListType === 'number') {
                      formattedContent.push(
                        <ol key={`ol-${i}`} className="list-decimal pl-4 mb-2 mt-1.5 space-y-0.5 text-sm">
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
                      <p key={`p-${i}`} className="mb-1.5 text-sm">
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
                                  "px-1 py-0.5 rounded font-mono text-xs",
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
                      <p key={`p-${i}`} className="mb-1.5 text-sm">
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
                      <ul key="ul-last" className="list-disc pl-4 mb-2 mt-1.5 space-y-0.5 text-sm">
                        {currentList}
                      </ul>
                    );
                  } else if (currentListType === 'number') {
                    formattedContent.push(
                      <ol key="ol-last" className="list-decimal pl-4 mb-2 mt-1.5 space-y-0.5 text-sm">
                        {currentList}
                      </ol>
                    );
                  }
                }

                // If we're still in a code block at the end, add it
                if (inCodeBlock && currentCodeBlock) {
                  formattedContent.push(
                    <pre key="code-last" className={cn(
                      "text-xs rounded-md bg-gray-100 p-2 overflow-x-auto my-2",
                      isUser ? "bg-opacity-20" : ""
                    )}>
                      <code>{currentCodeBlock}</code>
                    </pre>
                  );
                }

                return formattedContent;
              })())}
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