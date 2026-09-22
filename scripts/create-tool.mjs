#!/usr/bin/env node
// Scaffold a new tool: `npm run new-tool -- <name>`
// Copies the starter app so the tool starts with framework wiring, lint, and
// the standard health endpoint already in place.

import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

const name = process.argv[2];
if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error(
    "Usage: npm run new-tool -- <kebab-case-name>  (e.g. npm run new-tool -- kyc-queue)",
  );
  process.exit(1);
}

const root = process.cwd();
const src = join(root, "apps/starter");
const dest = join(root, "apps", name);

if (existsSync(dest)) {
  console.error(`apps/${name} already exists`);
  process.exit(1);
}

cpSync(src, dest, {
  recursive: true,
  filter: (path) =>
    !["node_modules", ".next", "next-env.d.ts"].some((part) =>
      path.includes(part),
    ),
});

const pkgPath = join(dest, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.name = name;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

for (const file of ["app/layout.tsx"]) {
  const p = join(dest, file);
  const contents = readFileSync(p, "utf8");
  writeFileSync(
    p,
    contents.replaceAll("Internal Tools", name.replaceAll("-", " ")),
  );
}

const healthPath = join(dest, "app/api/health/route.ts");
writeFileSync(
  healthPath,
  readFileSync(healthPath, "utf8").replace('createHealthHandler("starter")', `createHealthHandler("${name}")`),
);

rmSync(join(dest, ".next"), { recursive: true, force: true });

console.log(`Created apps/${name}`);
console.log(`Next: npm install, then npm run dev -w ${name}`);
