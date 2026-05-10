# Decisions

## What I Built
Cost-aware payment routing proxy that sits in front of Hyperswitch.
Given (currency, amount), it picks the cheapest connector that meets
a minimum success-rate floor (85%). If all connectors fall below the
floor, it falls back to the highest success-rate connector.

## Decision Boundary
- Build a static cost table: connector → currency → fee %
- Mock success rates (current: in-memory, production: pulled from metrics/DB)
- Eligible = supported currency + success_rate >= 0.85
- Winner = cheapest among eligible
- Fallback = highest success_rate if all below floor

## Why This Logic
Clear decision boundary, measurable, gracefully degrades.
Config-driven and extensible.

## What I Skipped
- Real-time fee API calls (static config is good enough for this scope)
- Persistent trace storage (in-memory only)
- GET /v1/payments/:id/routing-trace stores in-memory, resets on restart
- Grafana/Prometheus metrics (would add next)
- BIN-based routing (needs BIN database)

## What I'd Do With Another 4 Hours
- Pull success rates from real Hyperswitch webhook data
- Persist routing traces to Redis
- Add Prometheus metrics per connector per currency
- Add BIN prefix routing for INR/RuPay cards

## What's Broken or Hacky
- Success rates are hardcoded mocks, not real
- In-memory trace store lost on restart
- Retry storms possible - - Idempotency key passed to Hyperswitch but sandbox dummy connectors 
  don't enforce deduplication.


---

## Round 2 Changes

### 1. SQLite over Redis for trace persistence

Chose SQLite over Redis because this is a single-process proxy with no need for shared state across replicas and simpler to implement based on the current use-case. Redis introduces an infrastructure dependency — a running server, connection management, and an explicit persistence vs. speed trade-off — that isn't justified at this scale. SQLite is a file on disk: no extra process, no config, survives restarts by default. If the proxy ever needs to scale horizontally and share traces across instances, Redis would be the right revisit.

### 2. Prometheus metric — what it tracks

The counter uses two labels: `connector` (which connector was selected) and `outcome` (`success`, `fallback`, or `rejected`). The `outcome` label is the key signal: it distinguishes a healthy routing decision from a degraded one (fallback) or a complete failure (rejected). Tracking only the connector without the outcome would hide the cases that matter most operationally — when the system is routing around failures rather than routing optimally.

### 3. Missing test coverage in v1

The fallback branch — where every connector supports the currency but every success rate falls below the floor — had no test. The test that was labelled as covering this case was actually testing unsupported currency, which is the rejected path. These are distinct failure modes: one means the system found eligible connectors and degraded gracefully, the other means no connectors applied at all. Covering the fallback branch required an isolated configuration that forces all connectors below the floor while keeping currency support intact.

 
