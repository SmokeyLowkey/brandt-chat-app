import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

/**
 * Interface for chat message
 */
export interface ComponentData {
  component: string;
  props: Record<string, any>;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  isFallbackMode?: boolean;
  componentData?: ComponentData;
}

/**
 * Interface for chat history
 */
export interface ChatHistory {
  messages: ChatMessage[];
}

/**
 * Extracts relevant context from chat history to help maintain conversation flow
 * This is especially useful when recovering from fallback mode
 */
function extractContextFromHistory(chatHistory: ChatMessage[], currentMessage: string): string {
  // If there's no history, just return the current message
  if (!chatHistory || chatHistory.length === 0) {
    return currentMessage;
  }

  // Get the last 4 messages (or fewer if there aren't that many)
  const recentMessages = chatHistory.slice(-4);
  
  // Extract the main topic from the conversation
  let mainTopics: string[] = [];
  let contextualQuestion = currentMessage;
  
  // Look for key nouns and topics in the conversation
  for (const msg of recentMessages) {
    // Skip system messages
    if (msg.role === 'system') continue;
    
    // Extract potential topics (simple approach - look for repeated nouns)
    const words = msg.content.toLowerCase().split(/\s+/);
    const potentialTopics = words.filter(word =>
      word.length > 3 &&
      !['what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how', 'this', 'that', 'these', 'those', 'there', 'their', 'they', 'them'].includes(word)
    );
    
    mainTopics = [...mainTopics, ...potentialTopics];
  }
  
  // Count occurrences of each topic
  const topicCounts: Record<string, number> = {};
  for (const topic of mainTopics) {
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  }
  
  // Get the top 3 most frequent topics
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);
  
  // Create a context-preserving query
  if (topTopics.length > 0) {
    contextualQuestion = `Regarding ${topTopics.join(', ')}, ${currentMessage}`;
  }
  
  // For short questions like "what's the standard size?", add explicit context
  if (currentMessage.length < 30 && recentMessages.length >= 2) {
    const lastUserMessage = recentMessages.filter(msg => msg.role === 'user').slice(-2)[0];
    const lastBotMessage = recentMessages.filter(msg => msg.role === 'assistant').slice(-1)[0];
    
    if (lastUserMessage && lastBotMessage) {
      contextualQuestion = `In the context of our conversation about ${topTopics.join(', ')}, where I previously asked "${lastUserMessage.content}" and you told me about "${lastBotMessage.content.substring(0, 50)}...", ${currentMessage}`;
    }
  }
  
  return contextualQuestion;
}

/**
 * Sends a chat message to the n8n webhook for processing
 */
export async function sendChatMessage(
  message: string,
  chatHistory: ChatMessage[],
  tenantId: string,
  userId: string,
  sessionId?: string
) {
  // Use the chat webhook URL from environment variables
  const n8nChatWebhookUrl = process.env.N8N_CHAT_WEBHOOK_URL || process.env.N8N_CHAT_TEST_WEBHOOK_URL;

  if (!n8nChatWebhookUrl) {
    console.warn("N8N_CHAT_WEBHOOK_URL and N8N_CHAT_TEST_WEBHOOK_URL not configured");
    
    // If n8n webhook is not configured, return a fallback response
    return {
      role: "assistant",
      content: "I'm sorry, the chat service is not properly configured. Please contact support.",
      timestamp: new Date().toISOString()
    };
  }

  console.log("Using webhook URL:", n8nChatWebhookUrl);

  // Use the JWT_SECRET and JWT_ALGORITHM directly from environment variables
  const jwtSecret = process.env.JWT_SECRET;
  const jwtAlgorithm = process.env.JWT_ALGORITHM || 'HS512';
  
  if (!jwtSecret) {
    console.warn("JWT_SECRET not configured, webhook authentication will fail");
    return {
      role: "assistant",
      content: "I'm sorry, the chat service is not properly configured. JWT_SECRET is missing.",
      timestamp: new Date().toISOString()
    };
  }

  console.log(`Using JWT algorithm: ${jwtAlgorithm}`);

  try {
    // Import axios dynamically to avoid issues with SSR
    const axios = (await import("axios")).default;
    
    // Generate a proper JWT token using the specified algorithm
    const token = jwt.sign(
      {
        // Payload data
        userId: userId,
        tenantId: tenantId,
        sessionId: sessionId, // Include session ID in the token
        timestamp: new Date().toISOString()
      },
      jwtSecret,
      {
        algorithm: jwtAlgorithm as jwt.Algorithm,
        expiresIn: '1h'
      }
    );

    // Create headers with authentication
    // The n8n webhook expects the JWT token in the Authorization header with the Bearer prefix
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // Get tenant and user information
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, slug: true, domain: true }
    });
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, role: true }
    });
    
    if (!tenant || !user) {
      throw new Error("Tenant or user not found");
    }
    
    // Prepare the payload for the webhook
    // Format the payload according to the n8n workflow expectations
    const payload = {
      message,
      chatHistory,
      tenantId,
      userId,
      sessionId: sessionId || `session_${Date.now()}`, // Include session ID or generate one
      timestamp: new Date().toISOString(),
      metadata: {
        tenant: {
          id: tenantId,
          name: tenant.name,
          slug: tenant.slug,
          domain: tenant.domain
        },
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      // Add query field for the n8n workflow with context preservation
      query: message,
      // Add context field to help the AI maintain context after fallback mode
      context: extractContextFromHistory(chatHistory, message)
    };
    
    // Send the message to the webhook
    let responseData;
    try {
      console.log("Sending request to webhook with payload:", JSON.stringify(payload));
      console.log("Using headers:", JSON.stringify(headers));
      
      const response = await axios.post(n8nChatWebhookUrl, payload, {
        headers,
        // Add timeout and additional options
        timeout: 10000,
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      });
      
      console.log("Webhook response status:", response.status);
      console.log("Webhook response data:", JSON.stringify(response.data));
      
      // Log the type of response data for debugging
      console.log("Webhook response data type:", typeof response.data);
      if (Array.isArray(response.data)) {
        console.log("Webhook response is an array with length:", response.data.length);
        if (response.data.length > 0) {
          console.log("First item in array:", JSON.stringify(response.data[0]));
          console.log("First item type:", typeof response.data[0]);
        }
      }
      
      responseData = response.data;
    } catch (error: any) {
      console.warn("Webhook error:", error.message);
      console.error("Full error:", error);
      
      // Use a fallback response when the webhook is unavailable
      responseData = {
        message: "I'm currently operating in fallback mode. The AI service is temporarily unavailable, but I've saved your message and will process it when the service is restored.",
        isFallbackMode: true // Add a flag to indicate fallback mode
      };
    }
    
    // Create a chat message from the response
    let responseContent = "";
    let componentData: ComponentData | undefined = undefined;
    
    // Handle different response formats
    if (typeof responseData === 'string') {
      // Handle string response
      try {
        // Check if it's a JSON string containing component data
        const parsedData = JSON.parse(responseData);
        if (parsedData.component && parsedData.props) {
          componentData = parsedData;
          responseContent = parsedData.props.text || "Component response";
        } else {
          responseContent = responseData || "";
        }
      } catch (e) {
        // If it's not valid JSON, use it as-is
        responseContent = responseData || "";
      }
    } else if (Array.isArray(responseData) && responseData.length > 0) {
      // Handle array response format from n8n webhook
      const firstItem = responseData[0];
      
      // Check if this is a response object with nested structure
      if (firstItem.response && firstItem.response.body &&
          firstItem.response.body["RESPONSE FROM WEBHOOK SUCCEEDED"]) {
        
        const webhookOutput = firstItem.response.body["RESPONSE FROM WEBHOOK SUCCEEDED"][0]?.output;
        
        // Try to parse the output as JSON if it's a string
        if (webhookOutput && typeof webhookOutput === 'string') {
          try {
            // Check if it's a JSON string containing component data
            const parsedOutput = JSON.parse(webhookOutput);
            if (parsedOutput.component && parsedOutput.props) {
              // Store component data for rendering
              componentData = parsedOutput;
              // Extract text content for message history
              responseContent = parsedOutput.props.text || "Component response";
            } else {
              responseContent = webhookOutput;
            }
          } catch (e) {
            // If it's not valid JSON, use it as-is
            responseContent = webhookOutput;
          }
        } else if (webhookOutput) {
          responseContent = webhookOutput;
        }
      } else if (firstItem.output) {
        // Try to parse the output as JSON if it's a string
        if (typeof firstItem.output === 'string') {
          try {
            // Check if it's a JSON string containing component data
            const parsedOutput = JSON.parse(firstItem.output);
            if (parsedOutput.component && parsedOutput.props) {
              // Store component data for rendering
              componentData = parsedOutput;
              // Extract text content for message history
              responseContent = parsedOutput.props.text || "Component response";
            } else {
              responseContent = firstItem.output;
            }
          } catch (e) {
            // If it's not valid JSON, use it as-is
            responseContent = firstItem.output;
          }
        } else {
          responseContent = firstItem.output;
        }
      } else if (firstItem.response) {
        responseContent = firstItem.response;
      } else if (firstItem.message) {
        responseContent = firstItem.message;
      } else if (firstItem.content) {
        responseContent = firstItem.content;
      }
    } else if (responseData && typeof responseData === 'object') {
      // Handle object response with various formats
      
      // Check for the specific format from the webhook
      if (responseData["RESPONSE FROM WEBHOOK SUCCEEDED"] &&
          Array.isArray(responseData["RESPONSE FROM WEBHOOK SUCCEEDED"]) &&
          responseData["RESPONSE FROM WEBHOOK SUCCEEDED"].length > 0) {
        
        const webhookResponse = responseData["RESPONSE FROM WEBHOOK SUCCEEDED"][0];
        if (webhookResponse.output) {
          // Try to parse the output as JSON if it's a string
          if (typeof webhookResponse.output === 'string') {
            try {
              // Check if it's a JSON string containing component data
              const parsedOutput = JSON.parse(webhookResponse.output);
              if (parsedOutput.component && parsedOutput.props) {
                // Store component data for rendering
                componentData = parsedOutput;
                // Extract text content for message history
                responseContent = parsedOutput.props.text || "Component response";
              } else {
                responseContent = webhookResponse.output;
              }
            } catch (e) {
              // If it's not valid JSON, use it as-is
              responseContent = webhookResponse.output;
            }
          } else {
            responseContent = webhookResponse.output;
          }
        } else if (webhookResponse.response) {
          responseContent = webhookResponse.response;
        } else if (webhookResponse.message) {
          responseContent = webhookResponse.message;
        } else if (webhookResponse.content) {
          responseContent = webhookResponse.content;
        }
      } else {
        // Try standard object properties
        responseContent = responseData.message || responseData.content || responseData.response || responseData.output || "";
      }
    }
    
    // If no content was extracted, return an empty response
    // The UI will show a typing animation instead of a fallback message
    if (!responseContent) {
      console.warn("No content extracted from webhook response, returning empty response");
      console.warn("Full response data:", JSON.stringify(responseData));
    }
    
    // Create the assistant message with the extracted content
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: responseContent,
      timestamp: new Date().toISOString(),
      isFallbackMode: responseData.isFallbackMode === true,
      componentData: componentData
    };
    
    return assistantMessage;
  } catch (error) {
    console.error("Error sending chat message to webhook:", error);
    
    // Return an error message
    return {
      role: "assistant",
      content: "I'm sorry, there was an error processing your message. Please try again later.",
      timestamp: new Date().toISOString(),
      isFallbackMode: true
    };
  }
}