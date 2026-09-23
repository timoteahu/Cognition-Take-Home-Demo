# Cognition Take Home Demo

Starter for building internal tools with Devin: a shared framework package that
every tool reuses, plus one workspace folder per tool. No external services to
run — the database is a local SQLite file via Prisma.

## Layout

```
apps/                  # one folder per tool
  hub/                 # single Next.js app serving every tool on :3000
                       # (/ = tool directory, /kyc, /chargebacks)
  starter/             # minimal reference tool + scaffold template
packages/
  framework/           # shared infra: db, auth, RBAC, audit, health, testing
    prisma/            # shared schema, migrations, seed (SQLite dev.db)
    test/              # framework test suite (vitest)
  ui/                  # shared design system (theme tokens + React primitives)
scripts/
  create-tool.mjs      # scaffolds a new tool under apps/
```

## What the framework provides

Every tool gets these for free by importing `@internal-tools/framework`:

- `prisma` — shared database client (schema in `packages/framework/prisma`)
- `getUser` / `requireUser` — bearer-token auth (`TokenStore` interface is
  swappable for real SSO/directory in production)
- `requirePermission` / `registerRole` — role-based permissions
- `withAuth(permission, handler)` — wraps a route handler so auth + permission
  checks are one line (see `apps/starter/app/api/tools/route.ts`)
- `logAudit` / `listAuditEvents` — append-only audit trail on the shared db
  (who did what — required for regulated workflows like KYC/refunds)
- `createHealthHandler(name)` — standard `GET /api/health` endpoint per tool
- `makeTestUser` / `authedRequest` / `tokenStoreFor` — test helpers so every
  tool tests authz the same way

UI primitives (`AppShell`, `Card`, `Badge`, `StatGrid`, …) live in
`@internal-tools/ui` so every tool shares one look.

## Setup

One-time (or after pulling schema changes):

```bash
npm install            # installs all workspaces
cp .env.example .env   # DATABASE_URL points at the shared sqlite file
npm run db:migrate     # applies packages/framework/prisma migrations
npm run db:seed        # loads example tools + sample KYC cases / chargebacks
```

## Run

```bash
npm run dev
```

The hub at http://localhost:3000 lists every registered tool; cards link to
the tool's `url` from the `Tool` table (seeded to `/kyc` and `/chargebacks`,
served by the same app — no separate ports). The tools share the framework's
auth, permissions, audit trail, and database, so every tool is protected
identically.

Dev tokens (framework defaults, dev-only): `dev-viewer-token` (read),
`dev-builder-token` (read/write), `dev-admin-token` (all).

```bash
curl -H "Authorization: Bearer dev-builder-token" localhost:3000/api/tools
curl localhost:3000/api/health
```

## Checks

`npm run lint`, `npm test`, and `npm run build` all run across workspaces and
are enforced by `.github/workflows/ci.yml` on every PR.

## Adding a new tool

```bash
npm run new-tool -- <kebab-case-name>   # scaffolds apps/<name> from starter
```

Then: keep business logic in the app's own routes/components; use the framework
for auth, permissions, audit, and the db client — don't reimplement them. New
data shapes go in `packages/framework/prisma/schema.prisma` + `npm run db:migrate`.

`packages/framework` is pure TypeScript (no Next.js dependency), so the same
auth/permissions/db layer can back any app type, not just Next.
