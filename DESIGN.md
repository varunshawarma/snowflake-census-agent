# Development Process & Future Improvements

## Overview

This document describes the approach taken to build the US Census AI Agent, key decisions made along the way, and what I would improve given more time.

---

## Development Process

### 1. Architecture

The central question was: where should intelligence live — in a custom NL→SQL layer, or delegated to an LLM?

I chose a **tool-calling agentic loop** powered by Claude (claude-sonnet-4) for several reasons:
- Eliminates the need for a custom query parser
- Claude can autonomously inspect the schema before querying, making it robust to schema changes
- Conversation context is naturally preserved by passing message history on every turn
- Guardrails can be encoded directly in the system prompt

The agentic loop works as follows:
1. User message + conversation history → Claude
2. Claude decides to call `execute_sql` with a generated SQL query
3. Backend executes the query against Snowflake, returns rows as JSON
4. Claude receives the data and writes a natural language answer
5. If the first SQL fails, Claude retries with a corrected query (up to 8 iterations)

### 2. Schema Discovery

Early versions hardcoded 7 table descriptions in the system prompt with guessed column names. This caused frequent SQL errors — for example, `B17001e1` (guessed) vs `B17010e1` (actual) for poverty data.

The fix was to load the full schema from Snowflake at server startup:
- Query `INFORMATION_SCHEMA.COLUMNS` for all 32 tables and 8,328 columns
- Build a dynamic system prompt that includes every table name and its first 8 columns
- Cache the prompt in memory — no per-request schema fetching

This eliminated the column-name guessing failures and gave Claude accurate knowledge of all available data.

### 3. Snowflake SQL Quirks

The dataset has non-standard naming conventions that required explicit instruction:
- Table names start with numbers (`2019_CBG_B01`) — must be double-quoted
- `CENSUS_BLOCK_GROUP` is stored uppercase — no quotes needed
- ACS column names are mixed case (`B01001e1`) — must be double-quoted
- `FORMAT()` doesn't exist in Snowflake — use `ROUND()`
- State names require CASE statements (no native lookup table that joins reliably)

These were discovered through iterative testing and encoded as rules in the system prompt.

### 4. Evaluation Framework

Built a 26-test eval suite with Claude Haiku as the grader. Key design decisions:
- **LLM grading** over keyword matching — catches answers that are correct but phrased differently
- **Sequential execution** with 1s delays — avoids Anthropic rate limits
- **7 categories**: population, income, education, race, housing, poverty, multi-turn, guardrails, edge cases
- **4 metrics**: answer rate, guardrail rate, accuracy rate, context retention rate

Final results: 92.3% pass rate, 100% guardrail enforcement, 100% multi-turn context retention.

### 5. Frontend

Built with React + Vite. Key decisions:
- `remark-gfm` for GitHub Flavored Markdown — enables table rendering
- Last 5 messages sent as conversation history (balance between context and token cost)
- Dark navy + amber design system — data journalism aesthetic appropriate for census data
- Example cards organized by data category to guide new users

---

## What I Would Improve With More Time

### High Priority

**1. Response time for complex queries**
Some queries take 60-200 seconds due to multiple SQL retries. The root causes are:
- Claude occasionally tries `FORMAT()` which Snowflake doesn't support
- Multi-metric queries (population + income + poverty) fire 3+ separate SQL calls
- Better few-shot examples in the system prompt would reduce iteration count significantly

**2. Streaming responses**
Currently waits for the full answer before displaying anything. Server-Sent Events (SSE) would make the interface feel dramatically more responsive, especially for 30s+ queries.

**3. State name resolution**
Claude writes `CASE LEFT(CENSUS_BLOCK_GROUP, 2) WHEN '01' THEN 'Alabama'...` in every query — 50+ lines of boilerplate. The `2019_CBG_GEOMETRY` table has a `STATE` column but JOIN reliability is inconsistent. A dedicated state FIPS lookup table would solve this cleanly.

**4. Query caching**
Census data doesn't change. Identical queries (or semantically equivalent ones) could be cached with Redis, reducing both latency and Snowflake compute costs.

### Medium Priority

**5. More complete column documentation**
The system prompt shows only the first 8 columns per table. Tables like B25 (housing) have 1,700+ columns. An ACS data dictionary mapping column codes to human-readable descriptions would dramatically improve query accuracy for complex topics.

**6. Streaming SQL results**
For queries that scan large tables (all census block groups), Snowflake can return results progressively. Streaming rows to Claude would reduce time-to-first-token.

**7. Authentication**
The live demo has no auth. Adding GitHub OAuth or a simple password gate would make it safe to share publicly without abuse risk.

**8. Rate limiting**
No per-IP rate limiting on `/api/chat`. Easy to abuse and run up Anthropic + Snowflake costs.

### Lower Priority

**9. Chart rendering**
For numeric comparisons, automatically render a bar chart or choropleth map alongside the text. The SQL results are already available in the frontend.

**10. Export to CSV**
Allow users to download the raw query results.

**11. Query history**
Persist conversations so users can return to previous sessions.

**12. More eval coverage**
The current 26 tests cover the main happy paths. Edge cases to add: county-level queries, multi-state comparisons, year-over-year trends (if 2020 data is added), questions about specific cities.
