"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="border-t border-gray-100 p-4 bg-white shadow-sm">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Button 
          type="button" 
          size="icon" 
          variant="ghost" 
          className="flex-shrink-0 rounded-full hover:bg-gray-100 transition-colors"
        >
          <Paperclip className="h-5 w-5 text-gray-500" />
          <span className="sr-only">Attach file</span>
        </Button>
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-full border-gray-200 focus:border-[#E31937] focus:ring-[#E31937] focus:ring-opacity-20 shadow-sm"
        />
        <Button
          type="submit"
          size="icon"
          className={`flex-shrink-0 rounded-full shadow-md transition-all ${
            isLoading || !input.trim() 
              ? "bg-gray-300 hover:bg-gray-300" 
              : "bg-gradient-to-r from-[#E31937] to-[#c01730] hover:from-[#c01730] hover:to-[#a01328]"
          }`}
          disabled={isLoading || !input.trim()}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}