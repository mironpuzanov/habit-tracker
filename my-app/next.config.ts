import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: [],
    appDocumentPreloading: false,
    forceSwcTransforms: true
  },
  // Define which extensions to include in the build
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Add rewrites to handle the (external) routes
  async rewrites() {
    return [
      {
        source: '/external-routes/:path*',
        destination: '/(external)/:path*'
      }
    ];
  }
};

export default nextConfig;
