import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: [],
    appDocumentPreloading: false,
    forceSwcTransforms: true
  }
};

export default nextConfig;
