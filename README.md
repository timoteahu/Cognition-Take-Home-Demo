# Cognition Take Home Demo

Starter for building internal tools with Devin: a shared framework package that
every tool reuses, plus one workspace folder per tool. No external services to
run — the database is a local SQLite file via Prisma.

## Layout

```
apps/                  # one folder per tool
  starter/             # reference tool (Next.js App Router)
packages/
  framework/           # shared infra: db client, bearer auth, RBAC, withAuth()
    prisma/            # shared schema, migrations, seed (SQLite dev.db)
```

Tools consume `@internal-tools/framework` for the pieces every internal tool
needs — `prisma` (shared client), `getUser`/`requireUser` (token auth),
`requirePermission` (role-based permissions), and `withAuth` (route wrapper that
enforces both). `apps/starter/app/api/tools/route.ts` shows the pattern:
`GET` requires `tools:read`, `POST` requires `tools:write`.

## Setup

```bash
npm install            # installs all workspaces
cp .env.example .env   # DATABASE_URL points at the shared sqlite file
npm run db:migrate     # applies packages/framework/prisma migrations
npm run db:seed        # loads a couple of example tools
npm run dev            # serves apps/starter at http://localhost:3000
```

Dev tokens (framework defaults, dev-only): `dev-viewer-token` (read),
`dev-builder-token` (read/write), `dev-admin-token` (all).

```bash
curl -H "Authorization: Bearer dev-builder-token" localhost:3000/api/tools
```

## Adding a new tool

1. `mkdir apps/<name>` and copy `apps/starter` as the starting point.
2. Keep business logic in the app's own routes/components; use the framework
   for auth, permissions, and the db client — don't reimplement them.
3. If the tool needs new data, extend `packages/framework/prisma/schema.prisma`
   and run `npm run db:migrate`.

`packages/framework` is pure TypeScript (no Next.js dependency), so the same
auth/permissions/db layer can back any app type, not just Next.
