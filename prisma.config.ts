// Loads .env so `env("DATABASE_URL")` in schema.prisma resolves for CLI commands.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: "packages/framework/prisma/schema.prisma",
  migrations: {
    path: "packages/framework/prisma/migrations",
  },
});
