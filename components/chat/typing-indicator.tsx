"use client";

import { Bot, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

interface TypingIndicatorProps {
  isRetrying?: boolean;
  waitTime?: number; // Time in ms before showing messages (default 5s)
  queryType?: string; // Type of query: "parts", "vehicle", "pricing", or "general"
}

// General waiting messages
const generalWaitingMessages = [
  "I'm searching for the best information for you...",
  "Just a moment while I find what you're looking for...",
  "Retrieving the most up-to-date information...",
  "Analyzing our database to find the perfect answer...",
  "Working on your request, thanks for your patience...",
  "Connecting to our knowledge base...",
];

// Parts-specific waiting messages
const partsWaitingMessages = [
  "Looking up those part numbers for you...",
  "Searching our parts catalog for the exact match...",
  "Checking inventory and specifications for these parts...",
  "Digging through our extensive parts database...",
  "Finding the right fittings and components...",
  "Locating compatible parts and accessories...",
];

// Vehicle-specific waiting messages
const vehicleWaitingMessages = [
  "Retrieving vehicle specifications and details...",
  "Looking up compatible components for your vehicle...",
  "Checking our database for vehicle-specific information...",
  "Finding the right parts for your truck model...",
  "Analyzing vehicle compatibility data...",
  "Searching for the best solutions for your vehicle...",
];

// Pricing-specific waiting messages
const pricingWaitingMessages = [
  "Calculating the most current pricing information...",
  "Checking for any applicable discounts or promotions...",
  "Retrieving pricing data from our system...",
  "Looking up cost information for these items...",
  "Gathering the latest pricing details for you...",
  "Compiling a comprehensive price overview...",
];

const waitingJokes = [
  "Why don't scientists trust atoms? Because they make up everything!",
  "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "What do you call a fake noodle? An impasta!",
  "Why did the scarecrow win an award? Because he was outstanding in his field!",
  "How do you organize a space party? You planet!",
  "What's the best thing about Switzerland? I don't know, but the flag is a big plus!",
  "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them!",
  "Why don't we tell secrets on a farm? Because the potatoes have eyes and the corn has ears!",
  "What do you call a parade of rabbits hopping backwards? A receding hare-line!",
  "Why did the truck driver bring a ladder? To help with the high-way!",
];

// Truck and parts-related jokes
const truckJokes = [
  "What did the truck say to the car? 'You auto move over!'",
  "Why don't trucks ever get lost? They always follow the right parts!",
  "What's a truck driver's favorite music? Heavy metal!",
  "How do trucks stay in shape? They exercise their brake pads!",
  "What do you call a truck that doesn't share? Selfish!",
  "Why was the truck driver always calm? Nothing could exhaust him!",
  "What did the tire say to the road? 'I'm wheely tired of you!'",
  "How do trucks communicate? They use their horn-ophones!",
  "Why did the truck go to therapy? It had too many issues with its parts!",
  "What's a truck's favorite type of story? A tail-gate!",
];

export default function TypingIndicator({
  isRetrying = false,
  waitTime = 5000,
  queryType = "general"
}: TypingIndicatorProps) {
  const [showMessage, setShowMessage] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageType, setMessageType] = useState<"message" | "joke" | "truckJoke">("message");
  const [messageIndex, setMessageIndex] = useState(0);

  // Start showing messages after waitTime
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMessage(true);
    }, waitTime);

    return () => clearTimeout(timer);
  }, [waitTime]);

  // Rotate through messages every 8 seconds
  useEffect(() => {
    if (!showMessage) return;

    // Set initial message
    updateCurrentMessage();

    const interval = setInterval(() => {
      // Cycle through message types: message -> joke -> truckJoke -> message...
      if (messageType === "message") {
        setMessageType("joke");
      } else if (messageType === "joke") {
        setMessageType("truckJoke");
      } else {
        setMessageType("message");
        // Only increment the index when we've gone through all types
        // Use the maximum length of all message arrays to ensure we cycle through all messages
        const maxLength = Math.max(
          generalWaitingMessages.length,
          partsWaitingMessages.length,
          vehicleWaitingMessages.length,
          pricingWaitingMessages.length
        );
        setMessageIndex((prev) => (prev + 1) % maxLength);
      }
      
      updateCurrentMessage();
    }, 8000);

    return () => clearInterval(interval);
  }, [showMessage, messageType, messageIndex]);

  // Update the current message based on type and index
  const updateCurrentMessage = () => {
    if (messageType === "message") {
      // Select the appropriate message list based on query type
      let messages;
      switch (queryType) {
        case "parts":
          messages = partsWaitingMessages;
          break;
        case "vehicle":
          messages = vehicleWaitingMessages;
          break;
        case "pricing":
          messages = pricingWaitingMessages;
          break;
        default:
          messages = generalWaitingMessages;
      }
      setCurrentMessage(messages[messageIndex % messages.length]);
    } else if (messageType === "joke") {
      setCurrentMessage(waitingJokes[messageIndex % waitingJokes.length]);
    } else {
      setCurrentMessage(truckJokes[messageIndex % truckJokes.length]);
    }
  };

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
            <div className="flex flex-col">
              <div className="flex items-center space-x-3 mb-2">
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
              
              {showMessage && (
                <div className="text-sm text-gray-600 mt-1 transition-opacity duration-500 ease-in-out opacity-100">
                  {currentMessage}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}