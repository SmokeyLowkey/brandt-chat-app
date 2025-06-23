import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

/**
 * Interface for chat message
 */
export interface ComponentData {
  component: string;
  props: Record<string, any>;
}

// Interface for ProductSpecs component
export interface ProductSpec {
  key: string;
  value: string;
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

  // Get more context by including more messages (last 6 instead of 4)
  const recentMessages = chatHistory.slice(-6);
  
  // Extract product mentions, part numbers, and vehicle models
  const productMentions: string[] = [];
  const partNumbers: string[] = [];
  const vehicleModels: string[] = [];
  let contextualQuestion = currentMessage;
  
  // Regular expressions for identifying important entities
  const partNumberRegex = /\b([A-Z0-9]{5,10})\b/g;
  const vehicleModelRegex = /\b(\d{3})\s*(peterbilt|kenworth|freightliner|volvo|mack|international)\b|\b(peterbilt|kenworth|freightliner|volvo|mack|international)\s*(\d{3})\b/gi;
  
  // Extract key entities from conversation history
  for (const msg of recentMessages) {
    // Skip system messages
    if (msg.role === 'system') continue;
    
    // Extract potential product mentions
    const words = msg.content.toLowerCase().split(/\s+/);
    const potentialProducts = words.filter(word =>
      word.length > 3 &&
      !['what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how', 'this', 'that', 'these', 'those', 'there', 'their', 'they', 'them'].includes(word)
    );
    
    productMentions.push(...potentialProducts);
    
    // Extract part numbers
    const partMatches = [...msg.content.matchAll(partNumberRegex)];
    if (partMatches) {
      partMatches.forEach(match => {
        if (match[1] && !partNumbers.includes(match[1])) {
          partNumbers.push(match[1]);
        }
      });
    }
    
    // Extract vehicle models
    const vehicleMatches = [...msg.content.matchAll(vehicleModelRegex)];
    if (vehicleMatches) {
      vehicleMatches.forEach(match => {
        const model = match[0].toLowerCase();
        if (!vehicleModels.includes(model)) {
          vehicleModels.push(model);
        }
      });
    }
  }
  
  // Count occurrences of each product mention
  const productCounts: Record<string, number> = {};
  for (const product of productMentions) {
    productCounts[product] = (productCounts[product] || 0) + 1;
  }
  
  // Get the top 3 most frequent product mentions
  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);
  
  // Build a rich context string
  let contextElements: string[] = [];
  
  // Add product mentions
  if (topProducts.length > 0) {
    contextElements.push(`products: ${topProducts.join(', ')}`);
  }
  
  // Add part numbers
  if (partNumbers.length > 0) {
    contextElements.push(`part numbers: ${partNumbers.join(', ')}`);
  }
  
  // Add vehicle models
  if (vehicleModels.length > 0) {
    contextElements.push(`vehicles: ${vehicleModels.join(', ')}`);
  }
  
  // Create a context-preserving query
  if (contextElements.length > 0) {
    contextualQuestion = `Regarding ${contextElements.join('; ')}, ${currentMessage}`;
  }
  
  // For short questions or follow-ups, add explicit conversation context
  if (currentMessage.length < 40 || !currentMessage.includes('?')) {
    // Get the last 2 user messages and the last assistant message
    const lastUserMessages = recentMessages
      .filter(msg => msg.role === 'user')
      .slice(-2);
    
    const lastBotMessage = recentMessages
      .filter(msg => msg.role === 'assistant')
      .slice(-1)[0];
    
    if (lastUserMessages.length > 0 && lastBotMessage) {
      // Create a more detailed context string
      const userContext = lastUserMessages
        .map(msg => `"${msg.content}"`)
        .join(' and then ');
      
      const botContext = lastBotMessage.content.length > 100
        ? `"${lastBotMessage.content.substring(0, 100)}..."`
        : `"${lastBotMessage.content}"`;
      
      contextualQuestion = `In the context of our conversation where I previously asked ${userContext} and you told me about ${botContext}, my new question is: ${currentMessage}`;
    }
  }
  
  return contextualQuestion;
}

/**
 * Extracts part numbers from chat history
 */
function extractPartNumbers(chatHistory: ChatMessage[]): string[] {
  const partNumbers: string[] = [];
  const partNumberRegex = /\b([A-Z0-9]{5,10})\b/g;
  
  for (const msg of chatHistory) {
    const matches = [...msg.content.matchAll(partNumberRegex)];
    if (matches) {
      matches.forEach(match => {
        if (match[1] && !partNumbers.includes(match[1])) {
          partNumbers.push(match[1]);
        }
      });
    }
  }
  
  return partNumbers;
}

/**
 * Extracts vehicle models from chat history
 */
function extractVehicleModels(chatHistory: ChatMessage[]): string[] {
  const vehicleModels: string[] = [];
  const vehicleModelRegex = /\b(\d{3})\s*(peterbilt|kenworth|freightliner|volvo|mack|international)\b|\b(peterbilt|kenworth|freightliner|volvo|mack|international)\s*(\d{3})\b/gi;
  
  for (const msg of chatHistory) {
    const matches = [...msg.content.matchAll(vehicleModelRegex)];
    if (matches) {
      matches.forEach(match => {
        const model = match[0].toLowerCase();
        if (!vehicleModels.includes(model)) {
          vehicleModels.push(model);
        }
      });
    }
  }
  
  return vehicleModels;
}

/**
 * Extracts product types from chat history
 */
function extractProductTypes(chatHistory: ChatMessage[]): string[] {
  const productTypes: string[] = [];
  const productKeywords = [
    'air spring', 'fuel tank', 'brake', 'belt', 'belts', 'fluid', 'oil', 'seal', 
    'filter', 'engine', 'transmission', 'fasteners', 'hose', 'pump',
    'exhaust', 'suspension', 'steering', 'axle', 'wheel', 'tire', 'light',
    'battery', 'alternator', 'starter', 'radiator', 'clutch', 'driveshaft'
  ];
  
  for (const msg of chatHistory) {
    const content = msg.content.toLowerCase();
    
    for (const keyword of productKeywords) {
      if (content.includes(keyword) && !productTypes.includes(keyword)) {
        productTypes.push(keyword);
      }
    }
  }
  
  return productTypes;
}

/**
 * Helper function to delay execution
 * @param ms Milliseconds to delay
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Detects if a response is from Anthropic and extracts the component data
 * Anthropic responses typically have text followed by JSON
 * @returns An object with the extracted component data and the cleaned text
 */
function processAnthropicResponse(text: string): { componentData: ComponentData | null, cleanedText: string } {
  // Check if this looks like an Anthropic response (text followed by JSON)
  const jsonStartIndex = text.indexOf('{');
  if (jsonStartIndex <= 0) {
    // Not an Anthropic response or JSON is at the beginning
    return { componentData: null, cleanedText: text };
  }
  
  try {
    // Try to find the JSON part
    let jsonEndIndex = -1;
    let bracketCount = 0;
    let inString = false;
    
    for (let i = jsonStartIndex; i < text.length; i++) {
      const char = text[i];
      
      // Handle string boundaries
      if (char === '"' && (i === 0 || text[i-1] !== '\\')) {
        inString = !inString;
      }
      
      // Only count brackets outside of strings
      if (!inString) {
        if (char === '{') bracketCount++;
        if (char === '}') {
          bracketCount--;
          if (bracketCount === 0) {
            jsonEndIndex = i + 1;
            break;
          }
        }
      }
    }
    
    if (jsonEndIndex === -1) {
      // Couldn't find matching closing bracket
      return { componentData: null, cleanedText: text };
    }
    
    // Extract the JSON part
    const jsonPart = text.substring(jsonStartIndex, jsonEndIndex);
    
    // Parse the JSON
    const parsedData = JSON.parse(jsonPart);
    
    // Check if it's a valid component
    if (parsedData && parsedData.component && parsedData.props) {
      // Extract the text part (without the JSON)
      const cleanedText = text.substring(0, jsonStartIndex).trim();
      
      // Log the extracted component data
      console.log("Extracted component data from Anthropic response:", JSON.stringify(parsedData));
      
      return {
        componentData: parsedData,
        cleanedText
      };
    }
  } catch (e) {
    console.warn("Failed to process Anthropic response:", e);
  }
  
  // Default return if anything fails
  return { componentData: null, cleanedText: text };
}

/**
 * Extracts JSON objects from text that may contain a mix of text and JSON
 * This is particularly useful for handling Anthropic responses where text precedes JSON
 */
function extractJsonFromText(text: string): any | null {
  // Look for patterns that might indicate JSON objects
  const jsonRegex = /\{[\s\S]*\}/g;
  const matches = text.match(jsonRegex);
  
  if (matches && matches.length > 0) {
    try {
      // Try to parse the first match as JSON
      const jsonData = JSON.parse(matches[0]);
      return jsonData;
    } catch (e) {
      console.warn("Failed to parse extracted JSON:", e);
      return null;
    }
  }
  
  return null;
}

/**
 * Sends a chat message to the n8n webhook for processing
 * Includes retry mechanism for improved reliability
 */
export async function sendChatMessage(
  message: string,
  chatHistory: ChatMessage[],
  tenantId: string,
  userId: string,
  sessionId?: string,
  maxRetries: number = 2 // Default to 2 retries
) {
  // Use the chat webhook URL from environment variables
  // const n8nChatWebhookUrl = process.env.N8N_CHAT_WEBHOOK_URL;
  const n8nChatWebhookUrl = process.env.N8N_CHAT_WEBHOOK_URL;

  if (!n8nChatWebhookUrl) {
    console.warn("N8N_CHAT_WEBHOOK_URL and N8N_CHAT_TEST_WEBHOOK_URL not configured");
    
    // If n8n webhook is not configured, return a fallback response
    return {
      role: "assistant",
      content: "I'm sorry, the chat service is not properly configured. Please contact support.",
      timestamp: new Date().toISOString()
    };
  }

  // console.log("Using webhook URL:", n8nChatWebhookUrl);

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

  // console.log(`Using JWT algorithm: ${jwtAlgorithm}`);

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
    
    // Fetch all documents for this tenant to extract namespaces
    const tenantDocuments = await prisma.document.findMany({
      where: { tenantId: tenantId },
      select: { metadata: true }
    });
    
    // Extract unique namespaces from document metadata
    const tenantNamespaces = new Set<string>();
    
    tenantDocuments.forEach(doc => {
      const docNamespace = (doc.metadata as any)?.namespace;
      if (docNamespace && typeof docNamespace === 'string') {
        tenantNamespaces.add(docNamespace);
      }
    });
    
    // If no namespaces were found, don't add any default
    
    // Convert Set to Array
    const namespaceArray = Array.from(tenantNamespaces);
    
    // Prepare the payload for the webhook
    // Format the payload according to the n8n workflow expectations
    const payload = {
      message,
      chatHistory,
      tenantId,
      userId,
      sessionId: sessionId || `session_${Date.now()}`, // Include session ID or generate one
      timestamp: new Date().toISOString(),
      namespaces: namespaceArray, // Include array of all tenant namespaces
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
      // Add enhanced context field to help the AI maintain context
      context: extractContextFromHistory(chatHistory, message),
      // Add structured context data to help with entity recognition
      contextData: {
        recentMessages: chatHistory.slice(-6),
        extractedEntities: {
          partNumbers: extractPartNumbers(chatHistory),
          vehicleModels: extractVehicleModels(chatHistory),
          productTypes: extractProductTypes(chatHistory)
        }
      }
    };
    
    // Send the message to the webhook
    let responseData;
    let retries = 0;
    let lastError: any = null;
    
    // Implement retry logic
    while (retries <= maxRetries) {
      try {
        if (retries > 0) {
          // console.log(`Retry attempt ${retries}/${maxRetries} for webhook request...`);
          // Exponential backoff: wait longer between each retry
          await delay(1000 * Math.pow(2, retries - 1)); // 1s, 2s, 4s, etc.
        }
        
        // console.log("Sending request to webhook with payload:", JSON.stringify(payload));
        // console.log("Using headers:", JSON.stringify(headers));
        
        const response = await axios.post(n8nChatWebhookUrl, payload, {
          headers,
          // Significantly increased timeout to allow more time for webhook processing in production
          timeout: 180000, // 180 seconds (3 minutes) instead of 60 seconds
          validateStatus: (status) => status < 500 // Don't throw for 4xx errors
        });
        
        // console.log("Webhook response status:", response.status);
        // console.log("Webhook response data:", JSON.stringify(response.data));
        
        // If we get here, the request was successful, so break out of the retry loop
        lastError = null;
        
        // Log the type of response data for debugging
        // console.log("Webhook response data type:", typeof response.data);
        if (Array.isArray(response.data)) {
          // console.log("Webhook response is an array with length:", response.data.length);
          if (response.data.length > 0) {
            // console.log("First item in array:", JSON.stringify(response.data[0]));
            // console.log("First item type:", typeof response.data[0]);
          }
        }
        
        responseData = response.data;
        break; // Exit the retry loop on success
      
      } catch (error: any) {
        lastError = error;
        console.warn(`Webhook error (attempt ${retries + 1}/${maxRetries + 1}):`, error.message);
        
        // If we've reached the maximum number of retries, handle the error
        if (retries >= maxRetries) {
          console.error("Maximum retries reached. Full error:", error);
          
          // Create a more specific message based on the error type
          let fallbackMessage = "I'm currently operating in fallback mode. The AI service is temporarily unavailable, but I've saved your message and will process it when the service is restored.";
          
          // Add specific handling for timeout errors
          if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            console.error("Request timeout error:", error.message);
            fallbackMessage = "I apologize, but the request is taking longer than expected to process. Your message has been saved and will be processed when the service is available. Please try again in a moment.";
          }
          
          // Use a fallback response
          responseData = {
            message: fallbackMessage,
            isFallbackMode: true // Add a flag to indicate fallback mode
          };
        }
        
        retries++;
      }
    }
    
    // Create a chat message from the response
    let responseContent = "";
    let componentData: ComponentData | undefined = undefined;
    
    // Handle different response formats
    if (typeof responseData === 'string') {
      // Handle string response
      try {
        // Check if the string starts with triple backticks for code blocks
        let jsonString = responseData;
        if (responseData.trim().startsWith('```json')) {
          // Extract the JSON content from the code block
          jsonString = responseData.trim()
            .replace(/^```json\n/, '')
            .replace(/\n```$/, '');
        }
        
        // Parse the JSON content
        const parsedData = JSON.parse(jsonString);
        if (parsedData.component && parsedData.props) {
          componentData = parsedData;
          
          // Log the extracted component data from string response
          console.log("Extracted component data from string response:", JSON.stringify(parsedData));
          
          // Handle different component types
          if (parsedData.component === "SimpleText") {
            responseContent = parsedData.props.text || "Component response";
          } else if (parsedData.component === "ProductSpecs") {
            // Extract text from ProductSpecs component
            const intro = parsedData.props.introduction || "";
            const specs = parsedData.props.specs || [];
            const note = parsedData.props.note || "";
            
            // Format specs into readable text
            const specsText = specs.map((spec: ProductSpec) => `${spec.key}: ${spec.value}`).join("\n");
            
            // Combine all parts into a coherent response
            responseContent = `${intro}\n\n${specsText}${note ? "\n\n" + note : ""}`;
          } else {
            // Default fallback for other component types
            responseContent = parsedData.props.text || JSON.stringify(parsedData.props) || "Component response";
          }
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
            // First check if this is an Anthropic response (text followed by JSON)
            const anthropicResult = processAnthropicResponse(webhookOutput);
            if (anthropicResult.componentData) {
              // It's an Anthropic response
              // console.log("Detected Anthropic response format");
              componentData = anthropicResult.componentData;
              responseContent = anthropicResult.cleanedText;
              
              // Log the extracted component data from array response (Anthropic format)
              console.log("Extracted component data from array response (Anthropic format):",
                JSON.stringify(anthropicResult.componentData));
            } else {
              // Not an Anthropic response, proceed with original logic
              // Check if the string starts with triple backticks for code blocks
              let jsonString = webhookOutput;
              if (webhookOutput.trim().startsWith('```json')) {
                // Extract the JSON content from the code block
                jsonString = webhookOutput.trim()
                  .replace(/^```json\n/, '')
                  .replace(/\n```$/, '');
              }
              
              // Try to parse the entire string as JSON
              try {
                const parsedOutput = JSON.parse(jsonString);
                if (parsedOutput.component && parsedOutput.props) {
                  // Store component data for rendering
                  componentData = parsedOutput;
                  // console.log("Successfully extracted component data:", parsedOutput.component);
                  
                  // Handle different component types
                  if (parsedOutput.component === "SimpleText") {
                    responseContent = parsedOutput.props.text || "Component response";
                  } else if (parsedOutput.component === "ProductSpecs") {
                    // Extract text from ProductSpecs component
                    const intro = parsedOutput.props.introduction || "";
                    const specs = parsedOutput.props.specs || [];
                    const note = parsedOutput.props.note || "";
                    
                    // Format specs into readable text
                    const specsText = specs.map((spec: ProductSpec) => `${spec.key}: ${spec.value}`).join("\n");
                    
                    // Combine all parts into a coherent response
                    responseContent = `${intro}\n\n${specsText}${note ? "\n\n" + note : ""}`;
                  } else {
                    // Default fallback for other component types
                    responseContent = parsedOutput.props.text || JSON.stringify(parsedOutput.props) || "Component response";
                  }
                } else {
                  responseContent = webhookOutput;
                }
              } catch (e) {
                // If it's not valid JSON, use it as-is
                responseContent = webhookOutput;
              }
            }
          } catch (e) {
            console.error("Error processing webhook output:", e);
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
            // First check if this is an Anthropic response (text followed by JSON)
            const anthropicResult = processAnthropicResponse(firstItem.output);
            if (anthropicResult.componentData) {
              // It's an Anthropic response
              // console.log("Detected Anthropic response format");
              componentData = anthropicResult.componentData;
              responseContent = anthropicResult.cleanedText;
            } else {
              // Not an Anthropic response, proceed with original logic
              // Check if the string starts with triple backticks for code blocks
              let jsonString = firstItem.output;
              if (firstItem.output.trim().startsWith('```json')) {
                // Extract the JSON content from the code block
                jsonString = firstItem.output.trim()
                  .replace(/^```json\n/, '')
                  .replace(/\n```$/, '');
              }
              
              // Try to parse the entire string as JSON
              try {
                const parsedOutput = JSON.parse(jsonString);
                if (parsedOutput.component && parsedOutput.props) {
                  // Store component data for rendering
                  componentData = parsedOutput;
                  // console.log("Successfully extracted component data:", parsedOutput.component);
                  
                  // Handle different component types
                  if (parsedOutput.component === "SimpleText") {
                    responseContent = parsedOutput.props.text || "Component response";
                  } else if (parsedOutput.component === "ProductSpecs") {
                    // Extract text from ProductSpecs component
                    const intro = parsedOutput.props.introduction || "";
                    const specs = parsedOutput.props.specs || [];
                    const note = parsedOutput.props.note || "";
                    
                    // Format specs into readable text
                    const specsText = specs.map((spec: ProductSpec) => `${spec.key}: ${spec.value}`).join("\n");
                    
                    // Combine all parts into a coherent response
                    responseContent = `${intro}\n\n${specsText}${note ? "\n\n" + note : ""}`;
                  } else {
                    // Default fallback for other component types
                    responseContent = parsedOutput.props.text || JSON.stringify(parsedOutput.props) || "Component response";
                  }
                } else {
                  responseContent = firstItem.output;
                }
              } catch (e) {
                // If it's not valid JSON, use it as-is
                responseContent = firstItem.output;
              }
            }
          } catch (e) {
            console.error("Error processing firstItem.output:", e);
            // If it's not valid JSON, use it as-is
            responseContent = firstItem.output;
          }
        } else if (typeof firstItem.output === 'object' && firstItem.output !== null) {
          // Handle direct object output
          if (firstItem.output.component && firstItem.output.props) {
            componentData = firstItem.output;
            responseContent = firstItem.output.props.text || "Component response";
          } else {
            // Convert object to string if it's not a component
            responseContent = JSON.stringify(firstItem.output);
          }
        } else {
          responseContent = String(firstItem.output || "");
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
              // First check if this is an Anthropic response (text followed by JSON)
              const anthropicResult = processAnthropicResponse(webhookResponse.output);
              if (anthropicResult.componentData) {
                // It's an Anthropic response
                // console.log("Detected Anthropic response format");
                componentData = anthropicResult.componentData;
                responseContent = anthropicResult.cleanedText;
                
                // Log the extracted component data from object response
                console.log("Extracted component data from object response:",
                  JSON.stringify(anthropicResult.componentData));
              } else {
                // Not an Anthropic response, proceed with original logic
                // Check if the string starts with triple backticks for code blocks
                let jsonString = webhookResponse.output;
                if (webhookResponse.output.trim().startsWith('```json')) {
                  // Extract the JSON content from the code block
                  jsonString = webhookResponse.output.trim()
                    .replace(/^```json\n/, '')
                    .replace(/\n```$/, '');
                }
                
                // Try to parse the entire string as JSON
                try {
                  const parsedOutput = JSON.parse(jsonString);
                  if (parsedOutput.component && parsedOutput.props) {
                    // Store component data for rendering
                    componentData = parsedOutput;
                    // console.log("Successfully extracted component data:", parsedOutput.component);
                    
                    // Handle different component types
                    if (parsedOutput.component === "SimpleText") {
                      responseContent = parsedOutput.props.text || "Component response";
                    } else if (parsedOutput.component === "ProductSpecs") {
                      // Extract text from ProductSpecs component
                      const intro = parsedOutput.props.introduction || "";
                      const specs = parsedOutput.props.specs || [];
                      const note = parsedOutput.props.note || "";
                      
                      // Format specs into readable text
                      const specsText = specs.map((spec: ProductSpec) => `${spec.key}: ${spec.value}`).join("\n");
                      
                      // Combine all parts into a coherent response
                      responseContent = `${intro}\n\n${specsText}${note ? "\n\n" + note : ""}`;
                    } else {
                      // Default fallback for other component types
                      responseContent = parsedOutput.props.text || JSON.stringify(parsedOutput.props) || "Component response";
                    }
                  } else {
                    responseContent = webhookResponse.output;
                  }
                } catch (e) {
                  // If it's not valid JSON, use it as-is
                  responseContent = webhookResponse.output;
                }
              }
            } catch (e) {
              console.error("Error processing webhookResponse.output:", e);
              // If it's not valid JSON, use it as-is
              responseContent = webhookResponse.output;
            }
          } else if (typeof webhookResponse.output === 'object' && webhookResponse.output !== null) {
            // Handle direct object output
            if (webhookResponse.output.component && webhookResponse.output.props) {
              componentData = webhookResponse.output;
              responseContent = webhookResponse.output.props.text || "Component response";
            } else {
              // Convert object to string if it's not a component
              responseContent = JSON.stringify(webhookResponse.output);
            }
          } else {
            responseContent = String(webhookResponse.output || "");
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
    
    // Log the final formatted assistant message
    console.log("Final formatted assistant message:", JSON.stringify(assistantMessage));
    
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