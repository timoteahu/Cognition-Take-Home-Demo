---
name: testing-internal-tools
description: How to run and end-to-end test the internal-tools npm-workspaces repo (starter Next.js app, framework package, dev tokens, SQLite DB).
---

# Testing the internal-tools monorepo

## Environment
- Node 22 is at `/home/ubuntu/node22/bin` and may not be on PATH: `export PATH=/home/ubuntu/node22/bin:$PATH`.
- Root `.env` provides `DATABASE_URL="file:./dev.db"`; the SQLite DB lives at `packages/framework/prisma/dev.db` (path resolves relative to the schema dir).
- If deps/DB are missing: `npm install`, `npx prisma generate`, `npm run db:migrate`, `npm run db:seed` (all from repo root).

## Running the app
- `npm run dev` at repo root serves `apps/starter` on http://localhost:3000 (Next.js 16/Turbopack, ready in ~250ms).
- A scaffolded tool runs with `npm run dev -w <name> -- -p <port>` — pass a port or it collides with :3000.

## Auth for API testing (curl is the intended path — no UI form exists)
Bearer tokens, defined in `packages/framework/src/auth.ts` (overridable via `TOOL_DEV_TOKENS` env JSON):
- `dev-viewer-token` → viewer → `tools:read` only (POST → 403)
- `dev-builder-token` → builder → `tools:read` + `tools:write`
- `dev-admin-token` → admin → `*` (wildcard)
- Missing/invalid token → 401 `{"error":"Missing or invalid bearer token"}`; insufficient permission → 403 `{"error":"Missing permission: <perm>"}`.

## Expected behavior
- `GET /` — server component, lists all tools from DB ordered by name; reflects POSTs immediately on reload (force-dynamic).
- `GET /api/tools` → `{"tools":[...]}`; `POST /api/tools` `{name,description}` → 201 `{"tool":{...}}`, 400 missing fields, 409 duplicate name, writes an `AuditEvent` (action `tool.create`, entity `Tool`, entityId = new id, actorId = user id like `u-builder`).
- `GET /api/health` (no auth) → `{status:"ok", app:"<name>", time}`.
- Inspect DB/audit rows from repo root: `node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.auditEvent.findMany().then(r=>console.log(r)).finally(()=>p.$disconnect())"` (escape `$` in shell).

## Real tools built on the framework
- `kyc-queue`: `GET/POST /api/cases`, `GET/PATCH /api/cases/[id]` (PATCH `{decision: approve|reject|escalate}`); `kyc:read`/`kyc:write` perms; `KycCase` model; queue UI at `/`, detail+audit trail at `/cases/[id]`.
- `chargebacks`: `GET/POST /api/disputes`, `GET/PATCH /api/disputes/[id]` (PATCH `{action: submit_evidence|win|lose}`); `chargebacks:read`/`chargebacks:write` perms; `Chargeback` model; disputes UI at `/`, detail+audit trail at `/disputes/[id]`.
- Tests: `npx vitest run apps/<name>` — they hit the real dev.db, so run `npx prisma migrate deploy` first on a fresh checkout (CI does this in `.github/workflows/ci.yml`).

## Scaffolding
- `npm run new-tool -- <kebab-case-name>` copies `apps/starter` → `apps/<name>`, rewrites package name + layout title + `createHealthHandler("<name>")`, strips `.next`/`node_modules`. Then `npm install` (creates workspace symlink) before dev. Verify the health handler reports the new app name.
- New tools must import a `lib/permissions.ts` that calls `registerRole` to grant `<tool>:read`/`<tool>:write` onto viewer/builder — never edit `ROLE_PERMISSIONS` in the framework.
- New entities go in `packages/framework/prisma/schema.prisma` + `npm run db:migrate`; remove the copied `app/api/tools` route (starter-registry demo, not the tool's own API).
- Removing a scaffolded `apps/<name>` dir leaves a stale `"extraneous": true` entry in `package-lock.json` after `npm install` — `git checkout package-lock.json` to clean.

## Devin Secrets Needed
- None — all credentials are dev-only tokens hardcoded in the framework.
