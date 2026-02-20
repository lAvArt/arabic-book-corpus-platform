import type { NextConfig } from "next";
import path from "node:path";

const monorepoRoot = path.resolve(process.cwd(), "../..");

const config: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  turbopack: {
    root: monorepoRoot
  }
};

export default config;
