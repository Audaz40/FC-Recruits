# FC Recruits

LinkedIn-style recruitment platform for EA Sports FC Pro Clubs — players find clubs, clubs find players, with tryout scheduling and ratings.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/fc-recruits run dev` — run the frontend (port 24564, proxied at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db run seed` — seed the database with sample data (8 players, 2 clubs, memberships, tryouts, ratings, notifications)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, wouter (routing), TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle DB schema (players, clubs, members, tryouts, ratings, notifications)
- `artifacts/api-server/src/routes/` — Express route handlers (players, clubs, tryouts, notifications, stats)
- `artifacts/fc-recruits/src/` — React frontend (pages, components)
- `artifacts/fc-recruits/src/lib/utils.ts` — Shared helpers (getOvrColor, getPositionColor, getPlatformColor, getStatusColor, etc.)
- `lib/api-client-react/src/generated/` — Generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — Generated Zod schemas used by server (do not edit)

## Architecture decisions

- Auth is userId-based (localStorage `fc_user_id`). The custom-fetch injects `X-User-Id` header on every request. No OAuth/JWT — this is an MVP.
- All JSON arrays (availableDays, openPositions, playDays) are stored as JSON strings in text columns for simplicity.
- `players/me` returns 404 when the user has no profile yet — the frontend uses this to show a "create profile" prompt.
- The `featured` endpoints for players/clubs are read-only aggregates used on the home page (no pagination needed).
- DB schema uses `real` for pass accuracy and ratings (floats), `integer` for OVR/goals/assists.

## Product

- Player CV: gamertag, platform (PS5/Xbox/PC), position (main + secondary), OVR rating (1-99), stats (goals, assists, pass accuracy, clean sheets), availability schedule, bio
- Club Pages: name, platform, division (1-10), style (casual/competitive/semi-comp), play schedule, open positions, roster
- Player/Club Search: advanced filters by position, platform, country, timezone, rating, free agent status
- Tryout System: request/invite flow, status tracking (pending→accepted→scheduled→completed), mutual ratings (1-5 stars), notifications

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, always run `pnpm --filter @workspace/api-spec run codegen` before building.
- `players/featured` only returns free agents; `clubs/featured` only returns clubs with open positions.
- The `X-User-Id` header must be sent with every mutating request — the custom-fetch does this automatically from localStorage.
- Express 5: use `/{*splat}` not `*` for wildcard routes. Parse `req.params.id` with parseInt before use.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
