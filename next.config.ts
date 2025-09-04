import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow production builds to complete even if there are ESLint errors.
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      { source: "/app", destination: "/imagery", permanent: true },
      { source: "/home", destination: "/imagery", permanent: true },
    ];
  },
};

export default nextConfig;
