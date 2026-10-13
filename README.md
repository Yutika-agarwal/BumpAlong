# Bumpalong

Give and get pregnancy, postpartum and baby items free from neighbors. Bumpalong fixes what makes Buy Nothing groups hard for parents: buried posts, no-shows, unfair "first to comment" claiming, and unsafe baby gear changing hands.

## What's here

| Path | What it is |
|---|---|
| `packages/core` | Shared rules used by the app and the API: the catalog (17 categories across 5 life stages), points tiers, monthly allowance and cap, listing safety checks, and the claim lottery. |
| `apps/api` | Fastify API for listings, interest, the draw, handoff confirmation and the points ledger. Runs on an in-memory store today. |
| `apps/api/db/migrations` | Postgres and PostGIS schema the API moves to next. |
| `docs/prototype.html` | The clickable prototype the product was designed with. Open it in a browser. |

## Run it

```sh
npm install
npm run build -w @bumpalong/core
npm test            # all packages
npm run dev:api     # API on http://localhost:3000
```

Try it:

```sh
curl localhost:3000/catalog
curl -X POST localhost:3000/listings/check -H 'content-type: application/json' \
  -d '{"title":"Crib bumper set","category":"Sleep","subcategory":"Cribs","condition":"Like new"}'
```

Until sign-in lands, requests that need a user pass an `x-user-id` header.

## Key rules (from the PRD)

- New members start with 300 points. Items are Small (50), Medium (150) or Large (300); the giver earns the same amount when a handoff is confirmed.
- Everyone can receive 2 Small and 1 Medium item a month without points, so nobody is shut out at 0.
- Receiving is capped at 8 items a month; Large items count as 2.
- Popular items go to a lottery when the claim window closes. The draw is deterministic per listing, so retries can't change the winner.
- Points only move when the handoff is confirmed, through an append-only ledger with idempotency keys.
- Safety checks block banned items (crib bumpers, inclined sleepers, breast milk and more), expired or crashed car seats, used open-system pumps and personal pump parts, opened formula, modified sleep products, pre-2011 cribs, and used items that must be new.

## Next

1. Postgres store behind the same interface as `MemoryStore`.
2. Sign-in (Apple, Google, email) with phone verification.
3. Expo app for iOS, Android and web, using `@bumpalong/core`.
4. Hold timers and auto-release to backups, pickup slots, chat with masking, reminders.
5. CPSC recall lookup, photo face detection, reports and the admin queue.
