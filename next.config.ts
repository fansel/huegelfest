import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['huegelfest.fansel.dev'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'huegelfest.fansel.dev',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
