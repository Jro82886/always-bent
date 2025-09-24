# OPERATIONS (ABFI)

## Architecture
- One trunk with lanes: Community, Analysis, Trends. No duplicate paths.
- Third‑party data always proxied via /api/* with typed contracts.
- Pages own layout; components are presentational; hooks/services own side effects.

## Types & Contracts
- Zod schemas for every API request/response.
- Versioned frozen JSON for reports/snips.
- Single flags module (src/lib/flags.ts) – typed, no ad‑hoc env checks.

## State & Effects
- Global store only for shared keys (inlet, date, auth, flags).
- Effects live in hooks; idempotent joins; cleanup on unmount.

## Performance & UX
- Skeletons over spinners; timeouts + friendly fallbacks.
- Tile proxies reused; avoid source rebuilds on toggles.

## Testing & CI
- Typecheck, lint, schema check, legacy import guard.
- PR template with Matches/Differences/Missing + Preview QA checklist.

## Deployment
- Tiny PRs; Vercel preview per PR; main → production only.
- Release checklist: env diff, migrations, flags defaults, rollback plan.

## Observability
- Structured logs; /api/*/health; synthetic pings nightly.

## Security
- Env validation (src/lib/env.ts); service role keys server‑only; rate‑limit POSTs.

## Dependency Hygiene
- Monthly deps:safe; lock critical minors; bundlesize diff in CI.
