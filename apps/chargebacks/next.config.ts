import path from "path";
import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

// Shared env lives at the repo root so every app reads the same config.
loadEnv({ path: path.resolve(process.cwd(), "../../.env") });

const nextConfig: NextConfig = {
  transpilePackages: ["@internal-tools/framework", "@internal-tools/ui"],
};

export default nextConfig;
