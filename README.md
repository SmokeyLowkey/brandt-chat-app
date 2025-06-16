# Brandt Chat Application

A modern chat application for Brandt Group of Companies that leverages company data to provide real-time, accurate information to customers and support agents.

## Features

- **Modern Chat Interface**: Sleek, responsive design with message grouping, rich text formatting, and visual feedback
- **Multi-tenant Architecture**: Support for multiple organizations with isolated data
- **Document Management**: Upload and process documents for AI context
- **Authentication**: Secure login and role-based access control
- **Conversation History**: Save and retrieve past conversations

## Recent Enhancements

### Modern Chat UI Implementation

The chat interface has been completely redesigned with a focus on user experience and modern design principles:

- **Enhanced Message Display**
  - Beautiful message bubble design with gradients, subtle shadows, and rounded corners
  - Message grouping to visually connect consecutive messages from the same sender
  - Support for rich text formatting including code blocks, inline code, links, and lists
  - Hover effects that reveal message timestamps for a cleaner interface
  - Improved typing indicator with a more subtle, branded animation

- **Improved UI Components**
  - Redesigned chat history sidebar with better visual hierarchy and hover states
  - Modern input area with rounded styling and clear visual feedback
  - Enhanced color scheme using Brandt's brand colors
  - Subtle animations and transitions for a more polished feel

- **Better Code Architecture**
  - Refactored the chat interface into reusable components:
    - `ChatMessage`: Handles individual message rendering and formatting
    - `ChatInput`: Manages the message input and sending
    - `TypingIndicator`: Shows when the AI is "thinking"
    - `ChatContainer`: Orchestrates the entire chat experience
  - Improved code maintainability and separation of concerns
  - Made the components more reusable for potential future features

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Storage**: AWS S3 for document storage
- **AI Integration**: Custom webhook integration for AI processing

## Getting Started

1. Clone the repository
2. Install dependencies: `yarn install`
3. Set up environment variables (see `.env.example`)
4. Run the development server: `yarn dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=your_database_connection_string
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
JWT_SECRET=your_jwt_secret
JWT_ALGORITHM=HS512
N8N_CHAT_WEBHOOK_URL=your_webhook_url
RESEND_API_KEY=your_resend_api_key
```

## Production Deployment

### Setting Up the Admin User

For production deployment, you need to set up the root admin user securely. We've provided a setup script that guides you through this process:

1. Run the setup script:
   ```
   node setup-production-admin.js
   ```

2. Follow the prompts to enter:
   - Tenant information (name, slug, domain)
   - Admin user details (name, email, password)

3. The script will run the seed command with these values to create the admin user

4. For actual deployment to Vercel or another platform, add these environment variables:
   ```
   NODE_ENV=production
   SEED_TENANT_NAME="Your Company Name"
   SEED_TENANT_SLUG="your-company"
   SEED_TENANT_DOMAIN="yourcompany.com"
   SEED_ROOT_ADMIN_EMAIL="admin@yourcompany.com"
   SEED_ROOT_ADMIN_NAME="System Administrator"
   SEED_ROOT_ADMIN_PASSWORD="your-secure-password"
   ```

### Security Considerations

- Use a strong, unique password for the root admin user
- Store environment variables securely in your deployment platform
- Never commit sensitive information to the repository
- Regularly rotate your JWT_SECRET and NEXTAUTH_SECRET
- Consider using environment variable groups in Vercel to manage different environments

## License

Proprietary - All rights reserved