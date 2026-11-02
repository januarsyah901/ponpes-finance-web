import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@ponpes-finance/db'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
