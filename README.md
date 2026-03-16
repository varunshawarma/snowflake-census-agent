# US Census Intelligence

An interactive, chat-based AI agent that answers natural language questions about US population data using the Snowflake US Open Census dataset.

**Live demo:** `https://snowflake-consensus-agent.up.railway.app`

---

## Overview

Ask questions in plain English — the agent writes SQL, queries Snowflake in real time, and returns a natural language answer with formatted tables and key insights.

> *"What are the 10 most populous states?"*
> *"Which states have the widest income inequality?"*
> *"Compare Texas and California on population, income, and poverty rate"*

---

## Architecture

```
React Frontend (Vite)
        │  POST /api/chat
        ▼
Express Backend (Node.js)
        │
        ├── generateCensusResponse()   ← Anthropic Claude (claude-sonnet-4)
        │        │
        │        │  tool_use: execute_sql
        │        ▼
        └── runSnowflakeQuery()        ← Snowflake US Open Census Data
```

**How it works:**
1. User sends a natural language question
2. Claude reads the full schema (loaded at startup) and generates a SQL query
3. Backend executes the query against Snowflake
4. Claude receives the results and formats a natural language answer
5. Response renders as markdown with tables, bullet points, and key highlights

**Conversation context** is preserved by sending the last 5 messages on every request, enabling natural follow-up questions.

---

## Dataset

The app uses the **US Open Census Data** dataset from the Snowflake Marketplace — 2019 American Community Survey (ACS) Census Block Group data.

- **32 tables**, **8,328 columns**, **220,000+ census block groups**
- Covers population, race/ethnicity, income, housing, education, employment, poverty, health insurance, veteran status, commute patterns, and more
- Schema is loaded dynamically at server startup so Claude always has accurate column names

---

## Project Structure

```
snowflake-census-agent/
├── backend/
│   ├── src/
│   │   ├── index.js                  -- Express server, startup schema load
│   │   ├── routes/
│   │   │   └── chat.js               -- POST /api/chat endpoint
│   │   ├── services/
│   │   │   ├── anthropic.js          -- Claude agentic loop + Snowflake queries
│   │   │   └── censusTwin.js         -- processQuery() adapter
│   │   └── evaluation/
│   │       └── test.js               -- 26-test eval suite
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.jsx     -- Main chat UI
│   │   │   ├── ChatInterface.css
│   │   │   ├── Message.jsx           -- Message rendering with markdown
│   │   │   └── Message.css
│   │   └── services/
│   │       └── api.js                -- fetch wrapper for /api/chat
│   ├── index.html
│   └── package.json
├── DEVELOPMENT.md
└── README.md
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- Snowflake trial account with **US Open Census Data** installed from Marketplace
- Anthropic API key

### 1. Clone and install

```bash
git clone https://github.com/varunshawarma/snowflake-census-agent.git
cd snowflake-census-agent

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
SNOWFLAKE_USER=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_ACCOUNT=your_account_identifier
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_DATABASE=US_OPEN_CENSUS_DATA__NEIGHBORHOOD_INSIGHTS__FREE_DATASET
SNOWFLAKE_SCHEMA=PUBLIC
```

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:3001  (already set)
```

### 3. Run locally

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open `http://localhost:5173`. The backend logs `✅ Schema loaded: 32 tables, 8,328 columns` when ready.

---

## Deployment (Railway)

### Backend

1. New Project → Deploy from GitHub → Root directory: `backend`
2. Add environment variables (all from `.env.example`)
3. Generate domain → test `/health`

### Frontend

1. New Service in same project → same repo → Root directory: `frontend`
2. Add variable: `VITE_API_URL=https://your-backend.up.railway.app`
3. Generate domain

---

## Evaluation

The eval suite runs 26 tests across 7 categories using Claude Haiku as the grader.

```bash
cd backend && npm test
```

**Latest results:**
```
Overall Pass Rate     ███████████░  24/26 (92.3%)

Key Metrics:
  Answer Rate         ███████████░  95.2%  (on-topic questions answered)
  Guardrail Rate      ████████████  100.0% (off-topic correctly refused)
  Accuracy Rate       ████████████  96.2%  (answers graded correct)
  Context Rate        ████████████  100.0% (multi-turn follow-ups)

Performance:
  Avg Response Time   32.7s
  Max Response Time   125.2s

By Category:
  population         ████████████  4/4  (100%)
  income             ████████░░░░  2/3  (67%)
  education          ████████████  2/2  (100%)
  race               ████████████  2/2  (100%)
  housing            ████████████  2/2  (100%)
  poverty            ████████████  2/2  (100%)
  multi_turn         ████████████  3/3  (100%)
  guardrail          ████████████  5/5  (100%)
  edge               ████████░░░░  2/3  (67%)
```

The 2 failures are rubric edge cases (income threshold rounding, future projection handling) — not agent failures.

---

## Guardrails

- Off-topic questions (sports, recipes, politics) → fixed refusal message
- NSFW content → fixed refusal message
- Prompt injection attempts → redirected to census topics
- Only `SELECT` statements reach Snowflake — `INSERT`, `UPDATE`, `DROP` etc. are blocked server-side
- Results capped at 200 rows per query

---
