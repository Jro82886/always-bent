import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow production builds to complete even if there are ESLint errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // This helps with useSearchParams issues in Next.js 15
    missingSuspenseWithCSRBailout: false,
  },
  async redirects() {
    return [
      { source: "/imagery", destination: "/analysis", permanent: false },
      { source: "/v2/imagery", destination: "/analysis", permanent: false },
      { source: "/home", destination: "/analysis", permanent: false },
      { source: "/app", destination: "/analysis", permanent: false },
    ];
  },
};

export default nextConfig;
