import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Hostinger deployment settings
  // Output standalone for VPS/container deployments
  output: 'standalone',
  
  // Trust proxy headers (for load balancers/proxies)
  trustXForwardedHeaders: true,
};

export default nextConfig;
