Playbook: Build a new internal tool

## Overview
Build a new internal tool in the internal-tools monorepo (timoteahu/Cognition-Take-Home-Demo). Every tool is a Next.js app under `apps/<name>` that reuses the shared `@internal-tools/framework` package for bearer auth, RBAC permissions, audit logging, the Prisma/SQLite database, health checks, and test helpers. The reusable asset is the framework plus this process — not any single tool — so the output must stay strictly within the shared conventions.

## What's Needed From User
- Tool name in kebab-case (e.g. `kyc-queue`) and the domain workflow it manages.
- The one or two entities the tool tracks and the actions users take on a record (e.g. claim, approve, escalate, reject).
- Which roles may read vs. act (defaults: `viewer` → `<tool>:read`, `builder` → `<tool>:read` + `<tool>:write`, `admin` → `*`).

## Procedure
1. Scaffold the app from the repo root: `npm run new-tool -- <kebab-case-name>`, then `npm install` to create the workspace symlink.
2. Model the domain: add the tool's entities to `packages/framework/prisma/schema.prisma`, then `npm run db:migrate` with a migration named after the entity (e.g. `add_kyc_cases`). All entities live in this shared schema — never a second schema or database.
3. Register the tool's permissions via `registerRole` in a small `lib/permissions.ts` imported by the app's routes: grant `builder` and `admin` `<tool>:read` + `<tool>:write`, `viewer` `<tool>:read`. Do not edit the framework's `ROLE_PERMISSIONS` table.
4. Implement API routes under `apps/<name>/app/api/`: wrap every handler in `withAuth("<tool>:<perm>", handler)` mirroring `apps/starter/app/api/tools/route.ts`. Every mutating handler also calls `logAudit({ actorId: user.id, action: "<entity>.<verb>", entity, entityId, metadata })`. Return `Response.json` with 400/404/409 for validation, missing records, and conflicts.
5. Build the UI as server components in `apps/<name>/app/page.tsx` (plus subpages if needed) that read through `prisma` directly and render the work queue and record detail. Keep mutations in the API routes — the UI stays read-only except the demo controls added in step 8, which call the same routes from the browser. Match the starter's minimal inline-style presentation.
6. Add tests in `apps/<name>/test/` using `makeTestUser`, `authedRequest`, and `tokenStoreFor`: cover the happy path, 401 without a token, and 403 when a viewer attempts a write.
7. Verify `app/api/health/route.ts` calls `createHealthHandler("<name>")` (the scaffolder rewrites it — confirm the tool name is correct).
8. Add demo controls so the tool can be driven live in a demo:
   - `lib/demo-data.ts` exporting a `demo<Entities>()` function with the canned dataset and random-value lists for generating extra records.
   - `POST /api/demo/reset` wrapped in `withAuth("<tool>:write")` — transactionally deletes the entity's rows and its AuditEvents, recreates `demo<Entities>()`, and logs a `demo.reset` audit event.
   - A `"use client"` `components/demo-controls.tsx` rendered above the queue list: an "Add random X" button that POSTs a randomized record through the entity's own API route, and a "Reset demo data" button that calls `/api/demo/reset`, both with `Bearer dev-builder-token` (dev-only) and `router.refresh()` after each action.
   - Update `packages/framework/prisma/seed.mjs` to import `demo<Entities>()` from the app so the seeded and reset datasets stay identical, and add/update the `Tool` registry entry (name + `url` = the tool's dev port) so it appears on the hub.
9. Validate: run `npm run lint`, `npm test`, and `npm run build` from the repo root. Boot the app with `npm run dev -w <name> -- -p <port>` and curl `/api/health`, one read endpoint with `dev-viewer-token`, and one write endpoint with both `dev-viewer-token` (expect 403) and `dev-builder-token` (expect success and an AuditEvent row).
10. Open the PR with a summary listing the entities, endpoints, and permission strings added.

## Specifications
- After `npm install`, the tool runs with `npm run dev -w <name>` alone — no new external services or secrets.
- The app contains no reimplemented auth, permission checks, or database client; all such logic comes from `@internal-tools/framework`.
- Every mutating route produces an AuditEvent in the shared audit trail.
- `npm run lint`, `npm test`, and `npm run build` pass; the PR's CI is green.

## Advice and Pointers
- Dev tokens for curl: `dev-viewer-token` (read), `dev-builder-token` (read/write), `dev-admin-token` (all). `TOOL_DEV_TOKENS` env JSON overrides them.
- This repo uses Next.js 16, whose conventions differ from older versions — read `node_modules/next/dist/docs/` before writing app code.
- Keep scope tight: one or two entities, a queue list view, and the actions on a record are enough to demonstrate a workflow.

## Forbidden Actions
- Never add real credentials or secrets — dev bearer tokens only.
- Never modify framework `ROLE_PERMISSIONS` to add tool permissions — use `registerRole`.
- Never create a second Prisma schema or database — all entities go in `packages/framework/prisma/schema.prisma`.
