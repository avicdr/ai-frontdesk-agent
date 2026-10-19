# 🤖 AI Front Desk SaaS — Production Architecture

A multi-tenant, production-ready AI Front Desk SaaS built for dental clinics and appointment-based practices.

Clinics independently register, customize their AI receptionist's tone and services, connect their WhatsApp Business number, sync their Google Calendar, and subscribe via UPI (without Razorpay) — with **zero developer intervention**.

---

## 🏗️ Architecture & Technical Highlights

```
                                      ┌─────────────────────────────────┐
                                      │   WhatsApp Patient / Customer   │
                                      └────────────────┬────────────────┘
                                                       │
                                            (Meta WhatsApp Cloud API)
                                                       │
                                                       ▼
                                      ┌─────────────────────────────────┐
                                      │   Inbound Webhook Verification  │
                                      │   & Deduplication Idempotency   │
                                      └────────────────┬────────────────┘
                                                       │
                                   ┌───────────────────┴───────────────────┐
                                   ▼                                       ▼
                       ┌───────────────────────┐               ┌───────────────────────┐
                       │  Gemini 1.5 Flash     │ (Failover)    │   OpenAI GPT-4o-mini  │
                       │  (Primary AI Engine)  │──────────────>│   (Automated Fallback)│
                       └───────────┬───────────┘               └───────────┬───────────┘
                                   │                                       │
                                   └───────────────────┬───────────────────┘
                                                       ▼
                                      ┌─────────────────────────────────┐
                                      │   Server-Side Tool Orchestrator │
                                      │  • getClinicServices            │
                                      │  • getClinicHours               │
                                      │  • checkAvailability            │
                                      │  • createAppointment            │
                                      │  • cancelAppointment            │
                                      │  • requestHumanHandoff          │
                                      └────────────────┬────────────────┘
                                                       │
                           ┌───────────────────────────┼───────────────────────────┐
                           ▼                           ▼                           ▼
              ┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
              │    Google Calendar      │ │     Supabase RLS DB     │ │  Real-time Clinic Inbox │
              │  2-Way Schedule Sync    │ │  Multi-Tenant Isolation │ │ Human Takeover Toggle   │
              └─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
```

### Key Pillars
- **Strict Tenant Isolation**: All clinic contexts, services, appointments, conversations, and usage records are isolated via Supabase Row-Level Security (RLS) and verified server-side.
- **Provider Fallback Engine**: Primary natural language processing with Google Gemini 1.5 Flash with automated failover to OpenAI GPT-4o-mini on errors or rate limits.
- **Calendar Synchronization**: Google OAuth 2.0 with automatic token refresh, timezone support, and conflict detection.
- **Direct UPI Billing (Without Razorpay)**: Cashfree payment order integration and manual 12-digit UTR verification queue with super-admin approval.
- **8-Step Self-Service Onboarding**: End-to-end setup wizard covering clinic details, AI receptionist persona, dental fee schedule, operating hours, booking rules, WhatsApp, calendar, and activation.
- **Interactive AI Playground**: Real-time browser WhatsApp simulator with live tool call execution inspection and token latency telemetry.

---

## 🚀 Quick Start & Development

### 1. Prerequisites
- Node.js 20+
- A free Supabase account ([supabase.com](https://supabase.com))
- Google AI Studio API Key ([ai.google.dev](https://ai.google.dev))
- Meta Developer Account for WhatsApp Cloud API ([developers.facebook.com](https://developers.facebook.com))
- Google Cloud Console Project for Calendar API ([console.cloud.google.com](https://console.cloud.google.com))

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Generate a secure 32-byte hex encryption key for credentials:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Database Migration
In your Supabase project's SQL Editor, execute:
1. `supabase/migrations/001_initial_schema.sql` (Tables, indexes, triggers, and RLS policies)
2. `supabase/seed.sql` (Default subscription plans and demo clinic)

### 4. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

### 5. Run Automated Tests
```bash
npm test
```

---

## 📱 WhatsApp Business Cloud API Integration

1. Go to **Meta App Dashboard** → Add **WhatsApp** product.
2. Under **API Setup**:
   - Copy **Phone Number ID** and **WhatsApp Business Account ID (WABA ID)**.
   - Generate a **Permanent System User Access Token** with `whatsapp_business_messaging` permissions.
3. Under **Configuration** → **Webhook**:
   - Callback URL: `https://your-domain.com/api/v1/webhooks/whatsapp`
   - Verify Token: Enter the value defined in `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
   - Subscribe to the `messages` webhook field.

---

## 🗓️ Google Calendar 2-Way Sync Setup

1. In **Google Cloud Console**, enable **Google Calendar API**.
2. Configure **OAuth Consent Screen** (External, add scopes `.../auth/calendar` and `.../auth/calendar.events`).
3. Under **Credentials**, create an **OAuth 2.0 Client ID**:
   - Application Type: Web application
   - Authorized redirect URIs: `https://your-domain.com/api/v1/integrations/calendar/callback`
4. Store `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in environment variables.

---

## 💳 UPI Subscription & Billing (Without Razorpay)

1. **Automated Cashfree UPI**:
   - Create account on [Cashfree Payments](https://www.cashfree.com).
   - Add `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, and `CASHFREE_WEBHOOK_SECRET`.
   - Set webhook endpoint to `https://your-domain.com/api/v1/webhooks/payments`.
2. **Manual UPI / QR Fallback**:
   - Set `PLATFORM_UPI_ID` (e.g. `clinicfront@icici`).
   - Clinic owners scan the dynamically generated QR code, pay via GPay / PhonePe / Paytm, and submit the 12-digit bank UTR reference.
   - The platform super-admin reviews and approves payments in `/admin/payments`, activating the subscription instantaneously.

---

## 🛡️ Security & Tenant Safety

- **AES-256-GCM Token Encryption**: All WhatsApp system tokens and Google OAuth tokens are encrypted at rest.
- **Tenant Context Verification**: All tool executions and database mutations resolve tenant ownership from authenticated session cookies, never trusted from client parameters.
- **Calendar-Month Arithmetic**: Expirations accurately handle variable month lengths (Jan 31 → Feb 28/29).
- **Daily Expiration Cron**: Vercel cron runs `/api/v1/cron` daily to manage grace periods and pause inactive receptionists.
