/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['i1.sndcdn.com', 'i2.sndcdn.com', 'i3.sndcdn.com', 'i4.sndcdn.com', 'i.scdn.co'],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    appDir: true,
  },
  // Deaktiviere das Next.js Logo
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
};

module.exports = nextConfig; 