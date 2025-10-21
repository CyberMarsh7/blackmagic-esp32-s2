Digital Secretary Web Application
=================================

Full-stack Next.js application that serves as a digital secretary / receptionist for a personal domain. It logs visitors, provides real-time availability status with SSE, supports a chat interface backed by a conversational AI, and includes admin endpoints.

Features
--------
- Visitor logging (SQLite dev via Prisma)
- Real-time status updates (Server-Sent Events)
- Messaging queue and read state
- Conversational AI chat with stored history (OpenAI or Anthropic)
- Admin auth via JWT and settings endpoints
- CORS, rate limiting, input validation (Zod)

Tech Stack
---------
- Next.js 15 (App Router), TypeScript, Tailwind CSS
- Prisma ORM (SQLite dev, compatible with Postgres prod)
- Zod validation, jose JWT, SSE
- OpenAI and Anthropic SDKs (optional)

Getting Started
---------------
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   - Edit `.env` and set values:
     - `JWT_SECRET` (required)
     - `DEVICE_API_KEY` (for external status updates)
     - `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` if using AI
3. Initialize DB:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Run dev server:
   ```bash
   npm run dev
   ```

Key API Endpoints
-----------------
- GET `/api/status` – current availability
- POST `/api/status` – update from device (header: `x-api-key`)
- PUT `/api/status/manual` – admin manual override (Bearer token)
- GET `/api/status/stream` – SSE stream for status changes
- POST `/api/visitors` – log new visitor
- GET `/api/visitors` – list visitors (admin)
- GET `/api/visitors/:id` – visitor details (admin)
- POST `/api/messages` – submit message
- GET `/api/messages` – list messages (admin)
- PATCH `/api/messages/:id/read` – toggle read status (admin)
- POST `/api/chat` – send message to AI
- GET `/api/chat/history/:session_id` – conversation history
- POST `/api/admin/login` – admin login (returns JWT)
- GET `/api/admin/dashboard` – basic stats
- PUT `/api/admin/settings` – update settings

Security
--------
- Public endpoints are rate-limited
- Admin routes require `Authorization: Bearer <token>`
- Device updates require `X-API-Key: <DEVICE_API_KEY>`
- CORS allowed origins configurable via `CORS_ALLOWED_ORIGINS`

Deploy
------
- Set production environment variables
- Switch Prisma datasource to Postgres in `prisma/schema.prisma` and `DATABASE_URL`
- Run `prisma migrate deploy`
