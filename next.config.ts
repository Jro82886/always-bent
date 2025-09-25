import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow production builds to complete even if there are ESLint errors.
    ignoreDuringBuilds: true,
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

// Sentry configuration
export default withSentryConfig(nextConfig, {
  // Suppresses source map uploading logs during build
  silent: true,
  org: "always-bent",
  project: "abfi-web",
  
  // Upload source maps during build
  widenClientFileUpload: true,
  
  // Routes to tunnel sentry requests through our server
  tunnelRoute: "/monitoring",
  
  // Hides source maps from generated client bundles
  sourcemaps: {
    disable: true
  },
  
  // Automatically tree-shake Sentry logger statements
  disableLogger: true,
});
