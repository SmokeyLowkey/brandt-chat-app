# Multi-Tenant LLM Assistant for Aftersales Parts Industry

## Overview

This application is a multi-tenant LLM assistant designed specifically for the aftersales parts industry. It allows companies to upload their technical documentation, parts catalogs, and service manuals, then enables their support agents to query this information using natural language. The system is built with complete tenant isolation, ensuring that each company's data remains private and secure.

## Architecture

### Tech Stack

- **Frontend**: Next.js 14 with App Router, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with JWT
- **File Storage**: UploadThing
- **Workflow Automation**: n8n
- **Vector Database**: Pinecone
- **LLM Integration**: OpenAI API

### Core Components

1. **Multi-Tenant System**
   - Complete data isolation between tenants
   - Tenant-specific settings and configurations
   - Admin interface for tenant management

2. **Authentication & Authorization**
   - Role-based access control (Admin, Manager, Support Agent)
   - JWT-based session management
   - Secure password handling

3. **Document Management**
   - Document upload and storage
   - Metadata extraction and management
   - Document processing pipeline
   - Document search and filtering

4. **Chat Interface**
   - Streaming responses from LLM
   - Conversation history
   - Document references in responses
   - Context management

5. **Workflow Automation**
   - Document processing workflows
   - LLM query handling
   - Webhook integrations
   - Error handling and retry mechanisms

6. **Analytics & Reporting**
   - Usage tracking per tenant
   - Performance monitoring
   - Export functionality
   - Scheduled reports

## Data Flow

1. **Document Processing**
   - User uploads document through UI
   - Document is stored in UploadThing
   - Metadata is saved to PostgreSQL
   - Webhook triggers n8n workflow
   - n8n processes document (text extraction, chunking)
   - Text chunks are embedded and stored in Pinecone
   - Document status is updated in PostgreSQL

2. **Query Processing**
   - User submits question through chat interface
   - Question is embedded and relevant documents are retrieved from Pinecone
   - Context is constructed from retrieved documents
   - Query and context are sent to LLM
   - Response is streamed back to user
   - Conversation is stored in PostgreSQL

## Multi-Tenant Architecture

### Tenant Isolation

- **Database Level**: Tenant ID foreign key on all tenant-specific tables
- **API Level**: Middleware checks tenant ID in JWT token
- **UI Level**: Tenant context provider ensures correct data display

### Tenant Management

- **Admin Portal**: Create, update, and manage tenants
- **Tenant Settings**: Configure tenant-specific settings
- **User Management**: Manage users within each tenant

## Security Considerations

1. **Data Isolation**
   - Complete tenant isolation at database level
   - API routes protected by tenant middleware
   - JWT tokens include tenant information

2. **Authentication**
   - Secure password handling
   - JWT token-based authentication
   - Role-based access control

3. **API Security**
   - Input validation with Zod
   - Rate limiting
   - CSRF protection

4. **Document Security**
   - Secure document storage
   - Document access control
   - Webhook security for document processing

## User Roles

1. **System Admin**
   - Manage tenants
   - Configure system settings
   - Access analytics across all tenants

2. **Tenant Admin**
   - Manage users within their tenant
   - Configure tenant settings
   - Access tenant analytics

3. **Manager**
   - View analytics for their team
   - Manage document library
   - Access all conversations

4. **Support Agent**
   - Upload documents
   - Chat with the AI assistant
   - Access their own conversation history

## Implementation Phases

See the [Implementation Plan](./IMPLEMENTATION_PLAN.md) for detailed phases and tasks.

1. **Phase 1: Foundation**
   - Database setup
   - Authentication system
   - Multi-tenant infrastructure

2. **Phase 2: Core Functionality**
   - Document management
   - Chat interface enhancement
   - n8n integration

3. **Phase 3: Advanced Features & Polish**
   - Analytics & reporting
   - User experience improvements
   - Testing & optimization

4. **Phase 4: Deployment & Launch**
   - Deployment setup
   - Security audit
   - Documentation & training

## Future Enhancements

1. **Advanced Analytics**
   - Conversation quality metrics
   - Document usage analytics
   - User performance tracking

2. **Integration Capabilities**
   - CRM integration
   - ERP integration
   - Ticketing system integration

3. **Enhanced AI Features**
   - Multi-modal support (images, diagrams)
   - Custom fine-tuning per tenant
   - Automated knowledge extraction

4. **Collaboration Features**
   - Shared conversations
   - Team workspaces
   - Knowledge sharing between agents