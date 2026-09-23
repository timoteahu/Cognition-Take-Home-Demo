Playbook: Build a new internal tool

## Overview
Build a new internal tool in the internal-tools monorepo (timoteahu/Cognition-Take-Home-Demo). Every tool is a set of routes inside the single hub app, `apps/hub`, served on one dev server at http://localhost:3000. Existing tools live at `/kyc` and `/chargebacks`; the new tool lives at `/<tool>`. Tools reuse `@internal-tools/framework` for bearer auth, RBAC permissions, audit logging, the Prisma/SQLite database, health checks, and test helpers, and `@internal-tools/ui` for layout and components. The reusable asset is the framework plus this process — not any single tool — so the output must stay strictly within the shared conventions.

## What's Needed From User
- Tool name in kebab-case (e.g. `refunds`) — used as the URL segment `/<tool>` and the permission prefix `<tool>:read` / `<tool>:write` — and the domain workflow it manages.
- The one or two entities the tool tracks and the actions users take on a record (e.g. claim, approve, escalate, reject).
- Which roles may read vs. act (defaults: `viewer` → `<tool>:read`, `builder` → `<tool>:read` + `<tool>:write`, `admin` → `*`).

## Procedure
1. Model the domain: add the tool's entities to `packages/framework/prisma/schema.prisma`, then `npm run db:migrate -- --name add_<entities>` (e.g. `add_refund_requests`). All entities live in this shared schema — never a second schema or database.
2. Register permissions: append `<tool>:read` / `<tool>:write` to the existing `registerRole` calls in `apps/hub/lib/permissions.ts` (`builder` gets both, `viewer` gets read; `admin` already has `*`). Do not edit the framework's `ROLE_PERMISSIONS` table.
3. Implement API routes under `apps/hub/app/api/<entities>/route.ts` (list + create) and `apps/hub/app/api/<entities>/[id]/route.ts` (read + PATCH action), mirroring `apps/hub/app/api/cases/`. Import `"../../../lib/permissions"` (adjust depth) so the roles are registered, and wrap every handler in `withAuth("<tool>:<perm>", handler)`. Every mutating handler also calls `logAudit({ actorId: user.id, action: "<entity>.<verb>", entity, entityId, metadata })`. Return `Response.json` with 400/404/409 for validation, missing records, and conflicts.
4. Build the UI as server components with `export const dynamic = "force-dynamic"`, reading through `prisma` directly:
   - `apps/hub/app/<tool>/page.tsx` — the work queue, mirroring `apps/hub/app/kyc/page.tsx`: `AppShell` (with `hubUrl="/"`), `PageHeader` with `<DemoControls tool="<tool>" />` as `actions`, a `StatGrid` of status counts, and a `Card` per record with a status `Badge`.
   - `apps/hub/app/<tool>/<entities>/[id]/page.tsx` — record detail plus audit trail from `listAuditEvents`, mirroring `apps/hub/app/kyc/cases/[id]/page.tsx`.
   - A `"use client"` `apps/hub/components/<entity>-actions.tsx` for the record actions, mirroring `case-actions.tsx`: calls the PATCH route with `Bearer dev-builder-token` (dev-only) and `router.refresh()`.
   Use `@internal-tools/ui` components and its `theme.css` classes (`btn`, `btn-primary`, `stack`, `row-between`, `card-title`, …) — no inline-style one-offs, no new CSS files. Keep mutations in the API routes.
5. Add demo data and controls so the tool can be driven live:
   - Add `demo<Entities>()` (canned dataset, as a function so time-relative fields stay fresh) and any random-value lists to `apps/hub/lib/demo-data.mjs`. This file must stay plain JavaScript — no type annotations or `as const` — because `seed.mjs` imports it under plain Node.
   - Add a `<tool>` entry to the `TOOLS` map in `apps/hub/app/api/demo/reset/[tool]/route.ts` (permission, entity name, reset transaction, count) and update its 400 error message to list the new tool.
   - Add a `<tool>` entry to `TOOL_CONFIG` in `apps/hub/components/demo-controls.tsx` (create endpoint, `resetPath: "/api/demo/reset/<tool>"`, random-record generator).
   - In `packages/framework/prisma/seed.mjs`, import `demo<Entities>()` from `apps/hub/lib/demo-data.mjs`, seed it, and add a `Tool` registry entry (name, description, `url: "/<tool>"`) so the tool appears on the hub directory at `/`.
6. Add tests in `apps/hub/test/<entities>.test.ts` mirroring `cases.test.ts`, using `authedRequest` (and `makeTestUser` / `tokenStoreFor` as needed): cover the happy path, 401 without a token, and 403 when a viewer attempts a write. Tests hit the real `dev.db` — clean up the rows and audit events they create in `afterAll`.
7. Validate: run `npm run lint`, `npm test`, and `npm run build` from the repo root, then `npm run db:seed`. Boot everything with `npm run dev` (one server, :3000) and check:
   - `/` lists the new tool and its card opens `/<tool>`.
   - `curl localhost:3000/api/health` → `{"status":"ok","app":"hub",…}`.
   - One read endpoint with `dev-viewer-token` (200), and one write endpoint with `dev-viewer-token` (403) and `dev-builder-token` (success plus an `AuditEvent` row).
   - `POST /api/demo/reset/<tool>` with `dev-builder-token` restores the canned set.
8. Open the PR with a summary listing the entities, routes (UI + API), and permission strings added.

## Specifications
- After `npm install` and `npm run db:seed`, `npm run dev` serves the new tool at `http://localhost:3000/<tool>` — no extra servers, ports, external services, or secrets.
- The tool contains no reimplemented auth, permission checks, database client, or UI shell; all such logic comes from `@internal-tools/framework` and `@internal-tools/ui`.
- Every mutating route produces an AuditEvent in the shared audit trail.
- `npm run lint`, `npm test`, and `npm run build` pass; the PR's CI is green.

## Advice and Pointers
- Dev tokens for curl: `dev-viewer-token` (read), `dev-builder-token` (read/write), `dev-admin-token` (all). `TOOL_DEV_TOKENS` env JSON overrides them.
- This repo uses Next.js 16, whose conventions differ from older versions — read `node_modules/next/dist/docs/` before writing app code. Route handler `params` is a Promise (`await context.params`).
- The KYC tool (`/kyc`, `/api/cases`) is the reference implementation for every step; copy its shape.
- Keep scope tight: one or two entities, a queue list view, and the actions on a record are enough to demonstrate a workflow.
- Only if a tool needs its own deploy or ownership boundary: `npm run new-tool -- <name>` scaffolds a separate app under `apps/<name>` on the same framework, and its `Tool.url` points wherever it is deployed. This is not the default path.

## Forbidden Actions
- Never add real credentials or secrets — dev bearer tokens only.
- Never modify framework `ROLE_PERMISSIONS` to add tool permissions — use `registerRole` in `apps/hub/lib/permissions.ts`.
- Never create a second Prisma schema or database — all entities go in `packages/framework/prisma/schema.prisma`.
- Never add a separate app or dev server for a new tool unless the user explicitly asks to split it out.
