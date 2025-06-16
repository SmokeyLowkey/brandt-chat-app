# Chat Integration with n8n Webhook

This document explains how the application implements chat functionality with n8n webhook integration.

## Overview

The application provides a chat interface that allows users to interact with an AI assistant. The chat functionality is integrated with an n8n webhook for processing messages and generating responses. The system supports conversation history, allowing users to maintain context across multiple messages.

## Configuration

The chat integration is configured using environment variables in the `.env` file:

```
# n8n webhook secret
JWT_SECRET="your-jwt-secret"
JWT_ALGORITHM="HS512"

# n8n chat webhook URL
N8N_CHAT_WEBHOOK_URL="https://your-n8n-instance.com/webhook/chatEnd"
N8N_CHAT_TEST_WEBHOOK_URL="https://your-n8n-instance.com/webhook-test/chatEnd"
```

## File Structure

The chat integration consists of the following files:

- `utils/chat-processing.ts` - Server-side utility functions for chat message processing
- `app/api/tenants/[tenantId]/chat/route.ts` - API route for sending chat messages
- `app/api/tenants/[tenantId]/conversations/route.ts` - API route for managing conversations
- `app/api/tenants/[tenantId]/conversations/[conversationId]/route.ts` - API route for specific conversation operations
- `components/chat/chat-history-panel.tsx` - UI component for displaying conversation history
- `app/dashboard/page.tsx` - Main chat interface page

## How It Works

### Chat Message Flow

1. When a user sends a message, the application sends it to the server via the chat API route.
2. The server creates or updates a conversation record in the database.
3. The server sends the message to the n8n webhook for processing.
4. The n8n workflow processes the message and returns a response.
5. The server stores the response in the database and returns it to the client.
6. The client displays the response in the chat interface.

### Conversation Management

1. Users can create new conversations, which start with a welcome message.
2. Users can select existing conversations from the history panel.
3. Users can delete conversations they no longer need.
4. Conversations are stored in the database with associated messages.

### Webhook Integration

The application integrates with n8n for chat message processing:

1. Messages are sent to an n8n webhook for processing using the URL defined in the `N8N_CHAT_WEBHOOK_URL` environment variable.
2. The webhook request includes:
   - Message content
   - Chat history
   - Tenant and user information
   - Session ID
   - JWT authentication token

3. The n8n workflow processes the message and returns a response in the following format:

   ```json
   {
     "RESPONSE FROM WEBHOOK SUCCEEDED": [
       {
         "output": "Response content here"
       }
     ]
   }
   ```

4. The application extracts the response content and displays it in the chat interface.

## Security Considerations

- JWT authentication is used for webhook communication
- The JWT token is signed using the HS512 algorithm
- The JWT secret is stored in the environment variables
- Tenant isolation is enforced to prevent cross-tenant access
- Session IDs are generated for each conversation to maintain context

## API Reference

### Send Chat Message

```typescript
// Request
POST /api/tenants/[tenantId]/chat
{
  "message": "Hello, how can I help you?",
  "conversationId": "optional-conversation-id"
}

// Response
{
  "role": "assistant",
  "content": "Response from the assistant",
  "timestamp": "2025-06-16T07:57:11.956Z",
  "conversationId": "conversation-id"
}
```

### List Conversations

```typescript
// Request
GET /api/tenants/[tenantId]/conversations

// Response
[
  {
    "id": "conversation-id",
    "title": "Conversation title",
    "createdAt": "2025-06-16T07:57:11.956Z",
    "updatedAt": "2025-06-16T07:57:11.956Z",
    "tenantId": "tenant-id",
    "userId": "user-id"
  }
]
```

### Get Conversation

```typescript
// Request
GET /api/tenants/[tenantId]/conversations/[conversationId]

// Response
{
  "id": "conversation-id",
  "title": "Conversation title",
  "createdAt": "2025-06-16T07:57:11.956Z",
  "updatedAt": "2025-06-16T07:57:11.956Z",
  "tenantId": "tenant-id",
  "userId": "user-id",
  "messages": [
    {
      "id": "message-id",
      "role": "USER",
      "content": "User message",
      "createdAt": "2025-06-16T07:57:11.956Z",
      "conversationId": "conversation-id"
    },
    {
      "id": "message-id",
      "role": "ASSISTANT",
      "content": "Assistant response",
      "createdAt": "2025-06-16T07:57:11.956Z",
      "conversationId": "conversation-id"
    }
  ]
}
```

### Delete Conversation

```typescript
// Request
DELETE /api/tenants/[tenantId]/conversations/[conversationId]

// Response
{
  "success": true
}
```

## Client Components

### Chat History Panel

The `components/chat/chat-history-panel.tsx` component provides the following features:

- Displays a list of conversations for the current tenant
- Allows users to select a conversation to view
- Provides a button to create a new conversation
- Allows users to delete conversations
- Shows loading state while fetching conversations

### Chat Interface

The main chat interface in `app/dashboard/page.tsx` provides:

- Message display with user and assistant messages
- Message input field with send button
- Loading state with typing animation
- Integration with the chat history panel
- Automatic scrolling to the latest message

## Server Utilities

The `utils/chat-processing.ts` file provides the following server-side utilities:

- `sendChatMessage(message, chatHistory, tenantId, userId, sessionId)` - Send a chat message to the n8n webhook and process the response

The chat processing workflow includes:

1. Generating a JWT token for webhook authentication
2. Retrieving tenant and user information from the database
3. Preparing the payload with message, chat history, and metadata
4. Sending the message to the n8n webhook
5. Processing the webhook response to extract the assistant's message
6. Handling various response formats, including the nested structure from n8n

## Recent Improvements

The following improvements have been made to the chat integration:

### 1. Added Conversation History

- Implemented a chat history panel to display past conversations
- Added API routes for creating, listing, and deleting conversations
- Integrated the conversation history with the chat interface
- Stored conversations and messages in the database for persistence

### 2. Enhanced Webhook Integration

- Added proper JWT token generation using the HS512 algorithm
- Created an environment variable for specifying the JWT algorithm
- Updated the chat processing utility to handle various response formats
- Added support for the specific nested response structure from n8n

### 3. Improved User Experience

- Added a typing animation while waiting for responses
- Implemented session ID tracking for improved conversation context
- Enhanced error handling with fallback responses
- Added detailed logging for debugging webhook responses

### 4. Fixed Authentication Issues

- Fixed the "jwt malformed" error by properly signing the token
- Updated both chat and document processing utilities to use the same JWT configuration
- Added proper error handling for authentication failures

These improvements provide a more robust and user-friendly chat experience with persistent conversation history and reliable webhook integration.