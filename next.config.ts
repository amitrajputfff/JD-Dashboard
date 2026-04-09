import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  allowedDevOrigins: ['192.168.41.116'],
};

export default nextConfig;
