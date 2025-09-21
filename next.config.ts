import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Force dynamic rendering - fixes Memberstack SSR issues
  eslint: {
    // Allow production builds to complete even if there are ESLint errors.
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      { source: "/imagery", destination: "/legendary/analysis", permanent: false },
      { source: "/v2/imagery", destination: "/legendary/analysis", permanent: false },
      { source: "/home", destination: "/", permanent: false },
      { source: "/app", destination: "/legendary", permanent: false },
    ];
  },
};

export default nextConfig;
