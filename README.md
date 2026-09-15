# 🔷 Vanguard Intelligence

> **AI-powered Predictive Budgeting & Financial Early-Warning System**

Vanguard Intelligence reads your company's **Slack messages and Gmail** in real time, detects *future spending intentions* from natural conversation, and surfaces them as predicted financial commitments — giving finance teams **22+ days of advance notice** before invoices arrive.

---

## 🏗️ Architecture

```
┌─────────────────────┐     Slack Event API     ┌──────────────────────────┐
│   React + TypeScript│ ◄──── REST API ─────────► │  Spring Boot 3 Backend   │
│   Vite + Tailwind   │                           │  Java 21 + Spring AI     │
│   Recharts, Lucide  │                           │  Gemini 1.5 Flash (LLM)  │
└─────────────────────┘                           └────────────┬─────────────┘
                                                               │
                                                     ┌─────────▼────────┐
                                                     │  H2 / PostgreSQL │
                                                     │  (4 tables)      │
                                                     └──────────────────┘
```

## ✨ Key Features

- 🤖 **AI Spend Intent Detection** — Gemini 1.5 Flash analyzes messages for purchase intent
- 💡 **Benchmark Price Model** — auto-estimates market rate when no price is mentioned
- 🔁 **Thread Reconciliation** — multiple messages about same topic update a single record
- 📅 **22+ Day Early Warning** — predicts spend date from natural language
- 📊 **6 Timeframe Horizons** — 7d / 30d / 90d / Future / History / All Time
- 🔐 **Slack OAuth 2.0** — official bot connection with workspace isolation
- 📧 **Gmail Ingestion** — email signals parsed alongside Slack
- 🏢 **Multi-tenant** — full workspace isolation, JWT-scoped APIs
- ✅ **Approve / Reject Workflow** — finance team controls each prediction

---

## 🚀 Quick Start

### Prerequisites
- Java 21+
- Node.js 18+
- Maven 3.8+

### 1. Backend Setup

```bash
cd backend

# Copy example config and fill in your secrets
cp src/main/resources/application.example.properties src/main/resources/application.properties
# Edit application.properties with your keys (see Environment Variables below)

# Run the Spring Boot server
mvn spring-boot:run
# Server starts at http://localhost:8080
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# App available at http://localhost:5173
```

---

## 🔑 Environment Variables

Copy `backend/src/main/resources/application.example.properties` → `application.properties` and fill in:

| Variable | Where to Get | Description |
|---|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://makersuite.google.com/app/apikey) | Gemini 1.5 Flash API key |
| `SLACK_CLIENT_ID` | [Slack API Apps](https://api.slack.com/apps) | Your Slack app's Client ID |
| `SLACK_CLIENT_SECRET` | [Slack API Apps](https://api.slack.com/apps) | Your Slack app's Client Secret |
| `SLACK_REDIRECT_URI` | — | OAuth callback URL (default: `http://localhost:8080/api/slack/oauth/callback`) |
| `JWT_SECRET` | — | 32+ character random string for JWT signing |

> ⚠️ **Never commit `application.properties` with real secrets to git.**

---

## 🛠️ Slack App Setup

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps) → **Create New App**
2. Enable **Event Subscriptions** → Request URL: `https://your-domain/api/slack/webhook`
3. Subscribe to bot events: `message.channels`, `message.groups`
4. Enable **OAuth & Permissions** → Redirect URL: `https://your-domain/api/slack/oauth/callback`
5. Required Scopes: `channels:history`, `channels:read`, `chat:write`, `groups:history`, `groups:read`
6. Copy **Client ID** and **Client Secret** into `application.properties`
7. Install app to your workspace

---

## 🗂️ Project Structure

```
projectVanguard/
├── backend/                          # Spring Boot application
│   └── src/main/java/com/vanguard/
│       ├── controller/               # 6 REST controllers (14+ endpoints)
│       ├── service/                  # Business logic
│       │   ├── ExpenseExtractionService.java  # Core AI pipeline (709 lines)
│       │   ├── CloudCapacityEstimator.java    # Infrastructure cost estimator
│       │   ├── SlackClientService.java        # Slack API integration
│       │   └── AuthService.java               # JWT auth
│       ├── model/                    # JPA entities (5 models)
│       ├── repository/               # Spring Data repositories
│       ├── security/                 # JWT filter, UserPrincipal
│       └── config/                   # Security, RestTemplate config
│
└── frontend/                         # React + TypeScript
    └── src/
        ├── components/               # Dashboard, Table, Charts, Modals
        ├── hooks/                    # useExpenses (polling hook)
        ├── context/                  # AuthContext (JWT)
        ├── api/                      # Axios API client
        └── types/                    # TypeScript interfaces
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register company + create workspace |
| `POST` | `/api/auth/login` | JWT login |
| `GET` | `/api/expenses` | Get predicted expenses (timeframe filter) |
| `GET` | `/api/expenses/summary` | Dashboard KPI cards |
| `PATCH` | `/api/expenses/{id}/status` | Approve / Reject prediction |
| `POST` | `/api/expenses/extract` | Trigger AI extraction manually |
| `GET` | `/api/slack/oauth/authorize-url` | Get Slack OAuth URL |
| `GET` | `/api/slack/oauth/callback` | Slack OAuth callback |
| `POST` | `/api/slack/webhook` | Receive Slack events (Event API) |
| `POST` | `/api/slack/sync` | Sync all monitored channels |

---

## 🧠 AI Pipeline

```
Slack Message / Gmail
        │
        ▼
  Topic Key Deduction ──► Thread Reconciliation (dedup by thread_ts)
        │
        ▼
  Cloud Capacity Estimator (infrastructure-specific rules)
        │ No match
        ▼
  Gemini 1.5 Flash API ──► JSON extraction (has_expense, item, cost, confidence)
        │ API fail / no key
        ▼
  Heuristic Fallback Engine (regex + keyword matching)
        │
        ▼
  Benchmark Price Model (auto-price when no amount stated)
        │
        ▼
  PredictedExpense stored with:
  - estimatedAmount, confidenceScore, predictedDate
  - costRangeMin / costRangeMax (±15%)
  - conversationContext (full negotiation history)
  - advanceDaysNotice (lead time in days)
  - isBenchmarkEstimate flag
```

---

## 🎨 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Java 21, Spring Boot 3, Spring Security, JPA/Hibernate |
| **Database** | H2 (dev) / PostgreSQL (prod) |
| **AI** | Google Gemini 1.5 Flash via REST API |
| **Auth** | JWT Bearer Tokens |
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS (custom palette) |
| **Charts** | Recharts |
| **Fonts** | Sora + DM Sans + JetBrains Mono |
| **Icons** | Lucide React |
| **Integrations** | Slack OAuth 2.0, Slack Events API, Gmail |

---

## 📄 License

MIT — feel free to fork, build on, and contribute.

---

<p align="center">Built with ❤️ — <strong>Vanguard Intelligence</strong> | Autonomous Financial Early-Warning</p>
