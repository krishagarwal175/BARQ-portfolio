import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler is disabled: react-three-fiber depends on mutable refs and
  // per-frame scene-graph mutation that the compiler's auto-memoization fights.
  reactCompiler: false,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ["@react-three/drei", "leva", "motion"],
  },
};

export default nextConfig;
