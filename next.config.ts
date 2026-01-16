import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Ensure Turbopack resolves the correct workspace root in monorepo-like setups.
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
