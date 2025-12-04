import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverRuntimeConfig: {
    // Will only be available on the server side
    bayerApiUrl: process.env.BAYER_API_URL,
    bayerApiKey: process.env.BAYER_API_KEY,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
  },
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
