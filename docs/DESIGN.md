# Design — matching AI Orbit

All values below were measured from the live site with `node scripts/inspect-aiorbit.mjs`
(Playwright, 1440px and 390px). Raw output: `docs/reference/tokens.json`; screenshots: `docs/reference/*.jpg`.

> `/learn` and `/business` return AI Orbit's 404 page, so listing patterns come from `/tools` and
> `/companies`, and detail patterns from `/tools/chatgpt` (which renders a skeleton layout: header
> panel, then a 2/3 + 1/3 body).

## Measured values

| Token | AI Orbit value | CSS variable |
|---|---|---|
| Page background | `rgb(0,0,0)` | `--bg` |
| Pill / input fill | `rgb(13,13,16)` `#0d0d10` | `--surface` |
| Card / panel fill | `rgb(19,19,22)` `#131316` | `--surface-card` |
| Table row / raised fill | `rgb(24,24,28)` `#18181c` | `--surface-raised` |
| Card border | `rgb(35,35,38)` `#232326`, 1px | `--border` |
| Row divider | `lab(13.8 0.57 -2.0 / 0.6)` ≈ `rgba(35,35,40,.6)` | `--border-subtle` |
| Hover border | zinc-700 `#3f3f46` | `--border-strong` |
| Primary text | `#ffffff` | `--fg` |
| Secondary text | zinc-400 `#a1a1aa` (924 uses on /tools) | `--fg-muted` |
| Tertiary text | zinc-500 `#71717a` | `--fg-subtle` |
| Accent ("Submit Tool") | `rgb(110,86,207)` `#6e56cf` | `--accent` |
| Accent text | lighter violet for 4.5:1 on black | `--accent-fg` |
| Filter pill tints | orange `#ff6b4a`, gold `#ffc53d`, violet `#a78bfa`, green `#34d399`, sky `#38bdf8` at 25% border | `--tint-*` |
| Font | system stack (`-apple-system, Segoe UI, Roboto…`), 16px / 24px | `--font-sans` |
| H1 | 44px, weight 900, letter-spacing −1.1px, line-height 1.15 | `text-[44px] font-black tracking-[-0.025em]` |
| Section eyebrow (h2) | 12px, weight 700, letter-spacing 1.2px, uppercase | `.eyebrow` |
| Card title (h3) | 13px, weight 600 | — |
| Radii | 999px pills (429 uses), 10px controls (315), 12px cards (120), 16px large panels | `--radius-full/control/card/panel` |
| Navbar | sticky, 61px, `rgba(0,0,0,.8)` + `backdrop-filter: blur(12px)`, 1px subtle bottom border | navbar.tsx |
| Primary button | purple pill, 28px high, 11–13px semibold, `hover:brightness-110`, `active:scale-95` | `Button variant="primary"` |
| Secondary button | outlined pill ("Log In"), 1px border on black | `variant="secondary"` |
| Search | 520px wide, 42px, `#0d0d10` fill, 10px radius, icon left, `⌘K` kbd right | learn-search.tsx |
| Page frame | 1440px, 32–44px gutters | `Container` |
| Footer | logo + tagline + socials left, 4 columns (EXPLORE / DISCOVER / ECOSYSTEM / COMPANY) with underlined uppercase headings | footer.tsx |

## Component patterns copied 1:1

- **Hero**: centered 44px/900 headline over a faint warm radial glow, search bar under it, a row of
  tinted filter pills (Trending · Popular · New · Free · Top Rated) → our sort pills.
- **Category rail**: rounded pill buttons with an icon tile; the active one gets a gold border → our type tabs.
- **Sub-category chips**: dark pills, active pill is solid white with black text → our category chips.
- **Directory table** (list view): one bordered 12px panel, uppercase 11px column headers, rows split by
  1px subtle dividers, 40px square logo tile, name + external-link icon, one-line muted description,
  dotted pricing pill, icon buttons (share / save / compare) on the right → `resource-row`.
- **Detail page**: breadcrumb, full-width header panel (`#131316`, 12–16px radius), then a 2/3 main column and
  a 1/3 sticky sidebar of stacked panels.
- **404**: small centered title, muted sentence, single CTA.

## Rules we follow

- Components only use the tokens above (no raw hex in `src/components`).
- Dark only: `color-scheme: dark` on `html`.
- Layouts are grid or list only.
- Motion: 150–200ms colour/border transitions, 2px hover lift on cards, 1.02 image zoom, fade-in on load.

## Small improvements (theme unchanged)

- Grid view of resource cards with 16:9 covers (AI Orbit only has the table) — same card fill, border and radius.
- Subtle gradient placeholder behind covers while images load.
- Hover lift and border brighten on cards; purple focus ring for keyboard users.
- Shimmer skeletons that mirror the exact card and row geometry.
