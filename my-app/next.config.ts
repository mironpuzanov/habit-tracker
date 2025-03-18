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
  pageExtensions: ['js', 'jsx', 'ts', 'tsx']
};

export default nextConfig;
