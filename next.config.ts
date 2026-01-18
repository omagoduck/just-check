import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Ignore TypeScript errors during production build for testing
  // TODO: Just for testing the production cases. The git commit to be reverted in real production
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
