# Ricoz — influencer marketing agent for small online stores

Ricoz does the job of an influencer marketing manager for D2C brands. A brand pays a flat $1,500 a month.

The first slice finds YouTube creators, ranks them, and sends a personalized email to the ones the brand approves. Negotiation and post tracking are in the product for later, with teammates.

Example instruction: “Find dog-training YouTubers with 10K to 100K followers, and offer 10% to 15% commission.” The agent will not offer above the top of that range.

## Tech Stack

- **Frontend**: Next.js (TypeScript) — deployed on Vercel
- **Backend**: Node.js + Express.js (TypeScript) — deployed on Vercel as a single Function
- **Database**: MongoDB (Mongoose ODM)
- **AI**: Google Gemini API (email generation)
- **Data**: YouTube Data API v3

## Features

1. **Auth**: JWT-based signup/login
2. **Brand Setup**: Name, niche, target audience, regions, tone, min audience size
3. **Creator Discovery**: YouTube API search with quota tracking (10K units/day)
4. **Fit Scoring**: 0–100 score (niche match 40%, engagement 35%, consistency 25%) with plain-language reasons
5. **Approve/Reject**: User approves or rejects each discovered creator
6. **Outreach**: LLM-generated personalized emails with compliance footer (sender, address, unsubscribe)
7. **Follow-ups**: Capped follow-up generation per creator
8. **Do-Not-Contact**: DNC list management
9. **Test-Only Sending**: Emails are sent only to a configurable test address
10. **TTL Indexes**: YouTube data auto-expires after 30 days (MongoDB TTL)

## Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd ricoz

# Backend
cd backend
cp .env.example .env    # Fill in your credentials
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment Variables

**Backend `.env`:**
```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/influencer-agent
JWT_SECRET=your-secret
# CORS — must be the exact origin of the deployed frontend, e.g.
# FRONTEND_URL=https://your-app.vercel.app
FRONTEND_URL=http://localhost:3000
# Optional: the API boots without these (auth/brands/campaigns keep working),
# only YouTube discovery and AI email generation are disabled.
YOUTUBE_API_KEY=your-youtube-data-api-v3-key
GEMINI_API_KEY=your-google-gemini-api-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
TEST_EMAIL=test@example.com
SENDER_NAME=Your Brand
SENDER_EMAIL=your-email@gmail.com
PHYSICAL_ADDRESS=123 Main St, City, State, ZIP
```

**Frontend `.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

### 4. Deploy (Vercel — two projects from one repo)

The repo root has no `package.json`, so **Root Directory matters** — create two Vercel projects from this repo.

**Project 1 — Frontend**

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Next.js (auto-detected) |
| Env var | `NEXT_PUBLIC_API_URL` = `https://<backend-project>.vercel.app/api` |

**Project 2 — Backend**

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Framework Preset | Other — Vercel picks up `src/index.ts` (`export default app`) as one Function |
| Build Command | `npm run build` |
| Env vars | `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL` (= `https://<frontend-project>.vercel.app`), plus optional `YOUTUBE_API_KEY`, `GEMINI_API_KEY`, `SMTP_*` |

**Notes:**
- `NEXT_PUBLIC_API_URL` is inlined at **build** time — after changing it you must **redeploy** the frontend.
- It must be `https://…/api` with no trailing slash, otherwise the browser blocks the call and the UI only shows "Registration failed".
- `FRONTEND_URL` decides which origins CORS allows. If it is wrong, every request from the site is rejected by the browser (login *and* register).
- Keep `MONGODB_URI` / `JWT_SECRET` / `YOUTUBE_API_KEY` / `GEMINI_API_KEY` defined; `YOUTUBE_API_KEY` and `GEMINI_API_KEY` are optional but the others are required or the API will not boot.

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| CRUD | `/api/brands` | Brand management |
| POST | `/api/agent/brief` | Turn one instruction into a YouTube search and commission guardrails |
| POST | `/api/discovery/:brandId/search` | Discover creators |
| GET | `/api/discovery/:brandId/creators` | List creators |
| PATCH | `/api/discovery/creators/:id/status` | Approve/reject |
| POST | `/api/outreach/:brandId/generate` | Generate emails |
| POST | `/api/outreach/:id/send` | Send test email |
| POST | `/api/outreach/:id/followup` | Follow-up email |
| POST/GET | `/api/outreach/dnc/*` | DNC management |

## License

MIT
