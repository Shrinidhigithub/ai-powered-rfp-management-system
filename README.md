
# AI-Powered RFP Management System

A single-user web application for procurement managers to create, manage, and evaluate Requests for Proposals (RFPs) using AI-powered natural language processing, real email integration, and real-time dashboard updates.


## Features

- **Create RFPs from Natural Language**: Describe procurement needs in plain English, AI converts to structured data
- **Vendor Management**: Manage vendors and contacts
- **Email Integration**: Send RFPs via Gmail SMTP, receive replies via Gmail API poller
- **AI-Powered Response Parsing**: Extract pricing, terms, and conditions from vendor replies
- **Proposal Comparison**: AI-assisted scoring and recommendations
- **Real-Time Dashboard**: Live updates using socket.io



## Tech Stack

- Frontend: React 18, Vite, Tailwind CSS, socket.io-client
- Backend: Node.js, Express, Prisma ORM, socket.io
- Database: PostgreSQL
- AI Provider: Groq (Llama 3.3 70B)
- Email Service: Gmail API (inbound), Nodemailer (Gmail SMTP)
- Validation: Zod


## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Groq API key (free at https://console.groq.com)
- Gmail account & Google Cloud project (for Gmail API)
- Gmail API credentials (credentials.json, token.json)


## Project Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd rfp-management-system

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb rfp_management

# Or using psql
psql -c "CREATE DATABASE rfp_management;"
```


### 3. Environment Configuration

Create `.env` file in the backend folder:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/rfp_management?schema=public"

# Groq AI
GROQ_API_KEY="gsk-your-groq-api-key"

# Gmail SMTP (for sending)
GMAIL_USER="your-email@gmail.com"
GMAIL_PASS="your-app-password"

# Gmail API (for receiving)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Server
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

### 4. Initialize Database

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed with sample vendors
npm run db:seed
```

### 5. Run the Application

```bash
# Option 1: Run everything with one script (Recommended)
./start-all.sh

# Option 2: Run manually
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Start Email Poller (Required for auto-replies)
cd backend
node gmail/poll-inbox.js
```

Open http://localhost:5173 in your browser.


## Email Configuration

### Gmail SMTP (Sending RFPs)
1. Enable 2FA on your Gmail account and create an App Password
2. Add GMAIL_USER and GMAIL_PASS to your `.env`
3. Nodemailer is used for sending emails

### Gmail API (Receiving Vendor Responses)
1. Create a Google Cloud project
2. Enable Gmail API, set up OAuth consent screen
3. Download credentials.json and place in backend/gmail/
4. Run gmail/poll-inbox.js to generate token.json (first time)
5. The poller script runs every 5 min, parses RFP replies, and creates proposals automatically

For local testing, use the **Simulate Response** feature in the app

## API Documentation


### Vendors

- GET `/api/vendors`: List all vendors
- GET `/api/vendors/:id`: Get vendor details
- POST `/api/vendors`: Create vendor
- PUT `/api/vendors/:id`: Update vendor
- DELETE `/api/vendors/:id`: Delete vendor

**Create Vendor Request:**
```json
{
  "name": "TechSupply Co.",
  "email": "sales@techsupply.com",
  "contactPerson": "John Smith",
  "phone": "+1-555-0101",
  "address": "123 Tech Street"
}
```


### RFPs

- GET `/api/rfps`: List all RFPs
- GET `/api/rfps/:id`: Get RFP with proposals
- POST `/api/rfps`: Create RFP from natural language
- POST `/api/rfps/:id/send`: Send RFP to vendors
- DELETE `/api/rfps/:id`: Delete RFP

**Create RFP Request:**
```json
{
  "rawInput": "I need to procure 20 laptops with 16GB RAM and 15 monitors 27-inch. Budget is $50,000. Delivery within 30 days. Payment terms net 30, 1 year warranty required."
}
```

**Create RFP Response:**
```json
{
  "id": "uuid",
  "title": "Office IT Equipment Procurement",
  "budget": 50000,
  "deliveryDays": 30,
  "paymentTerms": "Net 30",
  "warrantyMonths": 12,
  "items": [
    { "name": "Laptop", "quantity": 20, "specifications": { "ram": "16GB" } },
    { "name": "Monitor", "quantity": 15, "specifications": { "size": "27-inch" } }
  ]
}
```


### Proposals

- GET `/api/proposals`: List proposals (filter by rfpId)
- GET `/api/proposals/:id`: Get proposal details
- GET `/api/proposals/compare/:rfpId`: AI comparison of proposals
- POST `/api/proposals/:rfpId/award/:vendorId`: Award RFP to vendor


### Webhooks

- POST `/api/webhooks/inbound-email`: Gmail inbound email webhook
- POST `/api/webhooks/simulate-response`: Simulate vendor response (testing)


## Architecture & Design

### High-Level Architecture

- **Frontend**: React SPA with Vite, Tailwind CSS, socket.io-client for real-time updates
- **Backend**: Node.js/Express REST API, Prisma ORM, socket.io server for dashboard events
- **Database**: PostgreSQL with normalized tables for RFPs, vendors, proposals; JSONB for flexible fields
- **AI Integration**: Groq Llama 3.3 for natural language parsing and proposal comparison
- **Email**: Nodemailer (Gmail SMTP) for sending, Gmail API poller for receiving and automating proposal creation

### Key Flows
- RFP creation: User enters plain English, AI parses to structured RFP
- Vendor management: CRUD for vendors
- Email send: RFP sent to vendors via Gmail SMTP
- Inbound email: Gmail API poller fetches replies, parses, and creates proposals
- Proposal comparison: AI scores proposals, dashboard updates in real time

### Database Schema

- **PostgreSQL** chosen for relational integrity between RFPs, vendors, and proposals
- **JSONB columns** used for flexible storage of AI-parsed data and item specifications
- **Prisma ORM** for type-safe database access and easy migrations

### AI Integration

1. **RFP Creation**: Groq Llama 3.3 parses natural language into structured JSON with title, items, budget, terms
2. **Response Parsing**: Extracts pricing, delivery, warranty from messy vendor emails
3. **Comparison**: Scores proposals (0-100) based on price (40%), requirements (30%), delivery (15%), terms (15%)


### Email Strategy
- **Nodemailer (Gmail SMTP)** for sending RFPs
- **Gmail API poller** for receiving and automating proposal creation
- **Simulate Response** feature allows testing without real email configuration
- RFP ID embedded in emails to match responses to correct RFP

### UI/UX Decisions

- **Chat-style RFP creation** for intuitive natural language input
- **Dashboard view** for RFP status at a glance
- **Side-by-side comparison** with AI scores and recommendations
- **Responsive design** with Tailwind CSS


## Decisions & Assumptions

### Key Design Decisions
- Relational DB for integrity, JSONB for flexibility
- AI parses both RFPs and vendor replies
- Real-time updates via socket.io
- Inbound email handled by Gmail API poller, not webhook
- RFP ID embedded in emails for matching

### Assumptions
1. Single-user system (no authentication)
2. Vendors reply to the same Gmail address
3. Only emails with RFP ID in subject/body are processed
4. AI parsing handles common formats; edge cases may need manual review
5. Budget is in USD
6. Gmail API polling interval is 5 min

## AI Tools Usage

### Tools Used
- **GitHub Copilot** (GPT-4.1): Project scaffolding, code generation, debugging
- **ChatGPT**: Prompt engineering, architecture advice, error troubleshooting

### What They Helped With
- Initial project structure and boilerplate
- Prisma schema design
- React component patterns
- API route implementations
- AI prompt engineering for Groq integration
- Gmail API setup and polling logic
- Real-time socket.io integration

### Prompts/Approaches
- Used structured output (JSON mode) for reliable AI responses
- Designed prompts with clear field definitions and examples
- Temperature set low (0.2-0.3) for consistent parsing

## Known Limitations

1. Email attachments (PDFs) are not parsed—only email body text
2. Gmail API poller runs every 5 min (not instant)
3. Limited error handling for AI parsing failures
4. No email tracking or delivery confirmation