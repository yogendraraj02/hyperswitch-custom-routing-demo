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
 
