import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure external packages
  serverExternalPackages: ['openai'],
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
