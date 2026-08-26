# AutoAnbud

AutoAnbud is a Norwegian car marketplace for matching buyers with verified dealers. The product is built around curated buyer requests, dealer assignment controls, quality-focused offers, and clear buyer/dealer role separation.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Drizzle ORM with PostgreSQL
- Stack Auth
- Vercel Blob image uploads
- Sentry analytics/error tracking
- Vitest for unit tests

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Required local environment values are documented in `.env.example`.

## Common Commands

```bash
npm run lint
npm test -- --run
npx tsc --noEmit
npm run build
npm run db:generate
npm run db:push
npm run backfill:assignments
```

## Project Structure

- `src/app` - Next.js routes, server actions, route handlers, and page-level UI
- `src/components` - shared UI and marketing components
- `src/db` - Drizzle schema and database exports
- `src/lib` - services, validation, algorithms, auth helpers, analytics, storage
- `scripts` - operational scripts
- `drizzle` - generated migrations and metadata
- `docs` - product, release, testing, and prompt documentation

## Documentation

- Product direction: `docs/product/agents.md`
- Implementation roadmap: `docs/product/ROADMAP.md`
- Matching notes: `docs/product/MATCHING_ALGORITHM.md`
- Release checklist: `docs/release/production-checklist.md`
- Test notes: `docs/testing/README.md`
- Homepage prompts: `docs/prompts/`
