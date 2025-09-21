import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Force dynamic rendering - fixes Memberstack SSR issues
  eslint: {
    // Allow production builds to complete even if there are ESLint errors.
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      // Legacy redirects for old bookmarks
      { source: "/v2/:path*", destination: "/legendary/debug/v2/:path*", permanent: false },
      { source: "/imagery", destination: "/legendary/analysis", permanent: false },
      { source: "/v2/imagery", destination: "/legendary/analysis", permanent: false },
      { source: "/home", destination: "/", permanent: false },
      { source: "/app", destination: "/legendary", permanent: false },
      // Redirect old non-trunk routes
      { source: "/maptest", destination: "/legendary/debug/maptest", permanent: false },
      { source: "/gfw", destination: "/legendary/debug/gfw", permanent: false },
      { source: "/status", destination: "/legendary/debug/status", permanent: false },
    ];
  },
};

export default nextConfig;
