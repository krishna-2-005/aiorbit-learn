# AI Orbit — Learn

A full-stack **Learn** module for [AI Orbit](https://aiorbit.club): a hub of AI courses, guides, eBooks, video
tutorials and newsletters that you can browse, filter, save, track progress on and review. It is built to look
and feel like AI Orbit itself.

- **Live:** _deployment link — see [Deploy](#deploy)_
- **Repo:** https://github.com/krishna-2-005/aiorbit-learn
- **Demo login:** `demo@aiorbit.dev` / `password123` (has saved, in-progress and completed resources)

**Module:** Learn · **Role:** Full Stack · **Stack:** Next.js 15 / Prisma / Postgres / Auth.js, the same as my
CollegePick demo task.

![Listing, grid view](docs/screenshots/listing-grid-1280.jpg)

## Why Learn

AI Orbit already maps tools, companies and models; the obvious next question from its users is *how do I
learn to use them?* Learn connects the directory to education. It has the richest set of screens
(listing, detail with curriculum, personal library, submissions) and exercises every part of the stack: faceted
search, cursor pagination, auth-gated mutations, optimistic UI and transactional rating updates.

## Features

**Listing — `/learn`**
- Hero with typeahead search (titles and providers, arrow-key navigation, `/` and `⌘K` to focus) and AI Orbit's tinted quick-sort pills
- Type rail: All · Courses · Guides · eBooks · Tutorials · Newsletters, with live counts
- Sticky filter bar: category chips, Level / Price / Format / Duration / Provider menus (the provider menu is searchable), sort, **Grid | List** toggle
- Facet counts that update with the other filters; active-filter chips with × and "Clear all"
- Every filter, sort, tab, view and search term lives in the URL — shareable links, and Back undoes a change
- Cursor-based "Load 12 more" with the remaining count; Editor's picks when no filters are applied
- Skeletons that match the card and row geometry; empty, error and retry states
- Mobile: filters in a bottom drawer, single-column cards

**Category pages — `/learn/category/[slug]`** — the same explorer, pre-filtered, with a category hero.

**Detail — `/learn/[slug]`**
- Breadcrumb; header with provider logo and verified tick, type/level/price badges, rating, saves, views
- CTA ("Start course" / "Read guide" / "Download eBook"…) that opens in a new tab, Save, and Share (native share sheet or copy link + toast)
- Sticky section nav; overview, what you'll learn, curriculum accordion (free-preview lessons marked), prerequisites, tools covered (linking to AI Orbit tool pages), instructor, reviews, FAQ, related resources
- **Progress:** mark as started, tick lessons, % complete bar, mark complete, reset — all optimistic
- **Reviews:** rating distribution, paginated list, "Write a review" dialog with validation, optimistic insert, one review per user
- Sticky sidebar with price, facts and actions; sticky CTA bar on mobile
- `generateMetadata`, Open Graph and JSON-LD (`Course` / `Book` / `LearningResource`); `loading`, `error` and `not-found` states

**My Library — `/learn/library`** — Saved · In progress · Completed tabs with progress overlays, empty states per tab,
and a sign-in card for guests.

**Submit — `/learn/submit`** — Zod-validated form with field-level errors, pending state, success screen and
server errors. Submissions are stored as `PENDING` and limited to 5 per day.

**Auth — `/login`, `/signup`** — email + password with validation, wrong-password and duplicate-email handling.

## Screenshots

| | 375 | 768 | 1280 |
|---|---|---|---|
| Listing (grid) | ![](docs/screenshots/listing-grid-375.jpg) | ![](docs/screenshots/listing-grid-768.jpg) | ![](docs/screenshots/listing-grid-1280.jpg) |
| Listing (list) | ![](docs/screenshots/listing-list-375.jpg) | ![](docs/screenshots/listing-list-768.jpg) | ![](docs/screenshots/listing-list-1280.jpg) |
| Detail | ![](docs/screenshots/detail-375.jpg) | ![](docs/screenshots/detail-768.jpg) | ![](docs/screenshots/detail-1280.jpg) |
| Category | ![](docs/screenshots/category-375.jpg) | ![](docs/screenshots/category-768.jpg) | ![](docs/screenshots/category-1280.jpg) |
| Library | ![](docs/screenshots/library-375.jpg) | ![](docs/screenshots/library-768.jpg) | ![](docs/screenshots/library-1280.jpg) |
| Submit | ![](docs/screenshots/submit-375.jpg) | ![](docs/screenshots/submit-768.jpg) | ![](docs/screenshots/submit-1280.jpg) |
| Login | ![](docs/screenshots/login-375.jpg) | ![](docs/screenshots/login-768.jpg) | ![](docs/screenshots/login-1280.jpg) |

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript strict |
| Styling | Tailwind CSS v4 with AI Orbit design tokens, `tailwind-merge` |
| Database | PostgreSQL — Neon in production, Docker Postgres 16 locally |
| ORM | Prisma 6 |
| Auth | Auth.js (next-auth v5 beta), credentials + bcrypt |
| Validation | Zod 4 |
| Data fetching | TanStack Query 5 on the client, server functions in `src/server` |
| URL state | nuqs |
| UI | lucide-react, framer-motion (subtle), sonner |
| Tooling | pnpm, ESLint 9, Playwright (screenshots, axe a11y, AI Orbit inspection), faker seed |

Architecture notes: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Design tokens: [docs/DESIGN.md](docs/DESIGN.md).

## Run locally

Requires Node 22, pnpm 10 and Docker.

```bash
pnpm install
cp .env.example .env            # then set AUTH_SECRET: openssl rand -base64 32
docker compose up -d            # Postgres 16 on localhost:5434
pnpm db:migrate                 # apply migrations
pnpm db:seed                    # 84 resources, 1.5k reviews, demo user
pnpm dev                        # http://localhost:3000/learn
```

Checks (with the app running for the last three):

```bash
pnpm typecheck && pnpm lint && pnpm build
pnpm smoke        # 107 API assertions
pnpm a11y         # axe, WCAG 2.1 AA, 1280px + 375px
pnpm screenshot   # docs/screenshots at 375 / 768 / 1280
```

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection (Neon: the pooled `-pooler` string) |
| `DIRECT_URL` | Direct connection used by `prisma migrate` |
| `AUTH_SECRET` | Auth.js signing secret |
| `AUTH_URL` / `NEXT_PUBLIC_APP_URL` | Public base URL (optional on Vercel) |

## API reference

All responses use one envelope: `{ ok: true, data, meta? }` or
`{ ok: false, error: { code, message, details?, fieldErrors? } }`.

| Method & path | Auth | Purpose |
|---|---|---|
| `GET /api/learn` | — | List. `q, type, category, level, pricing, format, duration, provider, sort, cursor, limit (≤24)` → `data[]`, `meta { total, nextCursor }` |
| `GET /api/learn/facets` | — | Counts per type, category, level, pricing and format for the current filters |
| `GET /api/learn/suggest?q=` | — | Typeahead: matching titles and providers |
| `GET /api/learn/categories` | — | Categories with counts |
| `GET /api/learn/providers` | — | Providers with counts |
| `GET /api/learn/[slug]` | optional | Detail with sections, lessons, tags, rating distribution; `meta.viewer { saved, progress, hasReviewed }`. Counts a view |
| `GET /api/learn/[slug]/related` | — | 4 related resources (category → provider → tags) |
| `GET /api/learn/[slug]/reviews` | optional | Reviews, newest first, cursor-paginated |
| `POST /api/learn/[slug]/reviews` | required | Create a review (one per user → 409); recomputes the average in a transaction |
| `PUT` / `DELETE /api/learn/[slug]/save` | required | Save / unsave (idempotent), updates `saveCount` |
| `PUT /api/learn/[slug]/progress` | required | `{ start: true }`, `{ lessonId, done }` or `{ complete: true }` → recomputed progress |
| `DELETE /api/learn/[slug]/progress` | required | Reset progress |
| `GET /api/learn/saved` | required | Slugs of saved resources (bookmark state on cards) |
| `GET /api/learn/library` | required | Saved, in-progress and completed resources |
| `POST /api/learn/submit` | required | Submit a resource as `PENDING` (5 per day → 429) |
| `POST /api/auth/signup` | — | Create an account (duplicate email → 409) |

Status codes: 400 validation · 401 not logged in · 404 unknown slug · 409 duplicate · 429 rate limit · 500 unexpected.

## Design decisions vs AI Orbit

The theme was **kept, not reinvented**. Colours, radii, type and component shapes were measured from aiorbit.club
with Playwright (`scripts/inspect-aiorbit.mjs`, results in [docs/DESIGN.md](docs/DESIGN.md)):
black page, `#131316` cards with `#232326` 1px borders, zinc-400 secondary text, the `#6e56cf` "Submit Tool"
purple, 10/12px radii and pill buttons, the system font stack with 900-weight headlines, a blurred black navbar
and the four-column footer.

Patterns copied from AI Orbit: centered hero with search and tinted quick-filter pills, the icon-tile category
rail with a gold active outline, white-filled active chips, the bordered directory table (our list view), dotted
pricing pills, and the header panel + 2/3–1/3 detail layout.

Small improvements, within the same identity:
- **Grid view** of cards alongside the table-style list view (layouts are grid or list only)
- **Generated "orbit" cover art** per category (icon, concentric rings, dotted grid, tinted glow) instead of random stock photos
- Hover states: 2px card lift, brighter border, arrow nudge; `active:scale` press feedback on pills
- Faint warm/purple radial glow behind heroes and the detail header
- Shimmer skeletons that mirror the final geometry, and a 200ms fade-in for results
- A purple focus ring for keyboard users, and the tertiary grey lifted slightly (`#71717a` → `#8b8b94`) so small meta text passes WCAG AA
- Toasts restyled as AI Orbit cards

## Deploy

Production runs on Vercel (region `sin1`) with a Neon Postgres database in Singapore.

```bash
vercel link
vercel env add DATABASE_URL      # Neon pooled URL
vercel env add DIRECT_URL        # Neon direct URL
vercel env add AUTH_SECRET
DATABASE_URL=… DIRECT_URL=… pnpm db:deploy && pnpm db:seed
vercel --prod
```
