# ShatterApp

A companion web app for **Star Wars: Shatterpoint**, the skirmish miniatures game by Atomic Mass Games.

ShatterApp lets you browse units, plan your Strike Force, and track your collection — all from a clean, mobile-first interface optimised for use at the game table.

> **Data source:** Unit and product data is sourced from [pointbreaksw.com](https://www.pointbreaksw.com).
> Huge thanks to the author of Point Break for maintaining such a comprehensive and well-structured Shatterpoint database — this app would not exist without their work.

---

## Features

### Browse
- **Unit grid** — browse all characters with thumbnail cards showing unit type, cost, era icons, and FP
- **Search** — instant text search by name or tag
- **Filters** — filter by unit type (Primary / Secondary / Support), era, and tag; combine multiple filters simultaneously
- **Tag type-ahead** — start typing in the tag filter input to get live autocomplete suggestions
- **SWP pack badges** — each card shows its pack code (e.g. `SWP44`); click it to filter the grid to that pack
- **Character profile drawer** — tap any card to open a full profile with card images, stance images, flip animation, and all stats
- **Clickable tags** — tag pills in a profile navigate back to the browse grid pre-filtered by that tag
- **Related units** — profile footer shows other characters from the same pack as a tappable scroll strip
- **Keyword glossary** — tag pills with a known definition show an ⓘ icon; tap it for an in-place popover with the game definition
- **Unit comparison** — tap the `=` button on any two cards to open a side-by-side stat comparison modal, with green highlighting on the better value
- **Favorites** — heart icon on each card persists your favourites across sessions; filter the grid to favourites-only with one tap

### Build
- **Strike Force builder** — assemble two squads, each with a Primary, Secondary, and Support unit
- **Live validation** — squads show green/red validity with a plain-English reason (points exceeded or incompatible eras)
- **Mission picker** — search and assign a mission to your Strike Force
- **Premiere mode toggle** — mark a Strike Force as Premiere format
- **Unit search in picker** — the unit picker drawer has its own search bar scoped to the correct unit type

### Collection
- **Pack tracking** — tap any product card to mark it as owned; state persists across sessions
- **Stats dashboard** — at a glance: packs owned / total, total units owned, and a per-era progress bar

### Reference
- **Icon reference** — a searchable, category-grouped grid of game icons (add your own via `/public/data/icons.json`)
- **Rulebook viewer** — embedded PDF viewer for the official Shatterpoint Core Rules, with Download and Open-in-tab fallbacks

### App
- **PWA / offline support** — installable as a home-screen app; service worker caches the app shell, images, and API responses for use at the table with poor Wi-Fi
- **Portrait-locked** — optimised for phone use; shows a rotation prompt in landscape

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| State | Pinia (with `pinia-plugin-persistedstate`) |
| Backend | Express 5 + SQLite via Drizzle ORM |
| Scraper | Custom TypeScript scraper → `public/data/*.json` |
| PWA | `vite-plugin-pwa` (Workbox) |
| Tests | Vitest + happy-dom + Supertest |

## Getting Started

```bash
# Install dependencies
npm install

# (Optional) Fetch latest data from pointbreaksw.com
npm run scrape

# Seed the local SQLite database
npm run seed

# Start the API server and Vite dev server together
npm run dev:all
```

The frontend runs on **http://localhost:5179** and the API on **http://localhost:3001**.

## Testing

```bash
npm test              # run all tests once
npm run test:watch    # watch mode
npm run test:coverage # coverage report (60 %+ threshold)
```
