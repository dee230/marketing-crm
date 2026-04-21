import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Output standalone for VPS/container deployments
  output: 'standalone',
  
  // For Hostinger - experimental support
  experimental: {
    // Trust proxy headers (for load balancers/proxies)
  },
};

export default nextConfig;
