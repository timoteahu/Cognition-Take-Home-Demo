# Cognition Take Home Demo

Bare-bones starter app: a Next.js page listing internal tools from a local
SQLite database via Prisma. No external services to run.

## Stack

- **Next.js** (App Router) — UI + server in one stack
- **Prisma + SQLite** — zero-infrastructure database (a file at `prisma/dev.db`),
  with a clean upgrade path to Postgres later

## Setup

```bash
npm install
cp .env.example .env
npm run db:migrate   # creates prisma/dev.db from prisma/schema.prisma
npm run db:seed      # loads a couple of example tools
npm run dev          # http://localhost:3000
```

## Layout

- `app/` — Next.js App Router pages (`app/page.tsx` lists tools)
- `lib/prisma.ts` — shared Prisma client
- `prisma/schema.prisma` — data model (`Tool`)
- `prisma/migrations/` — schema history
- `prisma/seed.mjs` — seed data
