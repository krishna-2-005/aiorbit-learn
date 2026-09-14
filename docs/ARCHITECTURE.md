# Architecture

## Overview

```
Browser ── Next.js App Router (Vercel, sin1)
            ├─ Server Components  → src/server/* ─┐
            ├─ Route handlers     → src/server/* ─┼─ Prisma ── PostgreSQL (Neon / Docker)
            └─ Client Components  → TanStack Query → /api/learn/*
```

- **Server Components** render the first paint of every page (listing, detail, library, submit) by calling
  `src/server/*` directly — no HTTP round trip, and the HTML is complete for SEO.
- **Client Components** take over for interaction. They hydrate TanStack Query with the server's data
  (`initialData`) and then talk to the JSON API in `src/app/api/learn/*`.
- `src/server/*` is `server-only`: all Prisma access lives there, so the API routes and the pages share one
  data layer.

## Folders

| Path | What lives there |
|---|---|
| `src/app` | Routes, `loading.tsx` / `error.tsx` / `not-found.tsx` states, API route handlers |
| `src/components/ui` | Design-system primitives (button, chip, badge, dialog, drawer, tabs, …) re-skinned to AI Orbit tokens |
| `src/components/layout` | Navbar, footer, container, logo |
| `src/components/learn` | Module components: explorer, cards/rows, filters, search, library, submit |
| `src/components/learn/detail` | Detail page: curriculum, reviews, actions, section nav |
| `src/server` | `learn.ts` (list, facets, detail, related), `activity.ts` (reviews, saves, progress, library, submit), `users.ts` |
| `src/lib` | Prisma client, Auth.js config, API envelope, cursor codec, Zod schemas, URL filter parsers, formatting |
| `src/hooks` | TanStack Query hooks (`use-resources`, `use-saved`, `use-resource-activity`) and `use-learn-filters` (nuqs) |
| `prisma` | Schema, migrations, seed |
| `scripts` | `inspect-aiorbit.mjs`, `screenshot.mjs`, `a11y.mjs`, `smoke.sh` |

## Key decisions

**URL is the state.** Every filter, sort, tab, view and search term is a query param managed by `nuqs`
(`src/lib/learn-filters.ts`). The same parsers run on the server (`createSearchParamsCache`) and the client,
and both serialise filters to one canonical query string. That string is the TanStack Query key, so the
server-rendered first page is reused as `initialData` only when it matches, and Back/Forward just works.

**Keyset (cursor) pagination.** `GET /api/learn` orders by `(sortKey, id)` and the opaque cursor stores the
last row's pair. Pages never repeat or skip rows when ratings or save counts change between requests.
`scripts/smoke.sh` walks every page for all five sorts.

**Facet counts ignore their own filter.** Each facet group is counted with every filter except its own, so
selecting "Beginner" still shows how many Intermediate resources exist.

**Consistent rating math.** Creating a review runs in a transaction that locks the resource row
(`SELECT … FOR UPDATE`), inserts, re-aggregates and writes `ratingAvg`/`ratingCount`, so concurrent reviews
can't leave the average stale. One review per user is enforced by a unique index (→ 409).

**Optimistic UI.** Saving, lesson ticks, mark complete/reset and reviews update the Query cache first and roll
back with an error toast if the server disagrees.

**Auth.** Auth.js v5 credentials provider with JWT sessions and bcrypt hashes. Protected API routes call
`requireUser()` (401 envelope). Library and submit render an in-page sign-in prompt instead of redirecting,
so the URL stays shareable; middleware only bounces signed-in users away from `/login` and `/signup`.

**Submissions** are stored as `PENDING` (never listed) and rate-limited to 5 per user per rolling 24h. The
limit is counted in Postgres, so it holds across serverless instances.

**Errors.** Route handlers are wrapped in `route()`: Zod errors become
`{ ok: false, error: { code, message, details, fieldErrors } }` with 400; `ApiError`s map to 401/404/409/429;
anything else is logged and returned as a generic 500.

## Data model

`Resource` (type, level, pricing, format, duration, counters, outcomes, prerequisites, tools, FAQ JSON) belongs to
a `Provider`, a `Category` and optionally an `Author`, has many `Tag`s and `Section → Lesson`s.
`Review`, `SavedResource` and `Progress` join `User` and `Resource`. See `prisma/schema.prisma`.

## Quality checks

| Command | What it checks |
|---|---|
| `pnpm typecheck` | TypeScript strict + `noUncheckedIndexedAccess` |
| `pnpm lint` | ESLint (Next core-web-vitals + TypeScript) |
| `pnpm build` | Production build |
| `pnpm smoke` | 107 API assertions: filters, every sort's pagination, 400/401/404/409/429, save/progress/review/submit flows |
| `pnpm a11y` | axe WCAG 2.1 AA on 14 page states at 1280px and 375px, logged out and in |
| `pnpm screenshot` | README screenshots at 375 / 768 / 1280 |
