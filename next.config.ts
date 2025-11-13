import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Extend API route timeout for long-running AI analysis
  experimental: {
    serverComponentsExternalPackages: ['openai'],
  },
  // Configure headers for longer timeouts
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
