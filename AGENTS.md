<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Building internal tools in this repo

- Every tool is a set of routes inside `apps/hub`, served by one dev server (`npm run dev`, http://localhost:3000). Do not add a separate app or port for a new tool unless explicitly asked.
- To build a new tool, follow `docs/PLAYBOOK.md` step by step. The KYC tool (`apps/hub/app/kyc`, `apps/hub/app/api/cases`) is the reference implementation.
- To run and verify, see `.agents/skills/testing-internal-tools/SKILL.md`.
