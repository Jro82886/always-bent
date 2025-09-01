import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/app", destination: "/imagery", permanent: true },
      { source: "/home", destination: "/imagery", permanent: true },
    ];
  },
};

export default nextConfig;
