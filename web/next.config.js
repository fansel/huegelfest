/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',
  productionBrowserSourceMaps: false,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignoriere optionale MongoDB-Module, die von Agenda verwendet werden
      config.externals = config.externals || [];
      config.externals.push({
        'snappy': 'commonjs snappy',
        'aws4': 'commonjs aws4',
        'mongodb-client-encryption': 'commonjs mongodb-client-encryption',
        'snappy/package.json': 'commonjs snappy/package.json',
        'bson-ext': 'commonjs bson-ext',
        'kerberos': 'commonjs kerberos',
        '@mongodb-js/zstd': 'commonjs @mongodb-js/zstd'
      });
      
      // Fallback für fehlende Module
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'snappy': false,
        'aws4': false,
        'mongodb-client-encryption': false,
        'bson-ext': false,
        'kerberos': false,
        '@mongodb-js/zstd': false
      };
    }

    // Unterdrücke kritische Abhängigkeits-Warnungen von MongoDB
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // Add specific webpack externals for MongoDB dependencies
    if (isServer) {
      config.externals.push(/^mongodb-client-encryption$/);
    }

    // Ignoriere spezifische kritische Abhängigkeits-Warnungen
    const originalWarnings = config.ignoreWarnings || [];
    config.ignoreWarnings = [
      ...originalWarnings,
      // MongoDB kritische Abhängigkeits-Warnungen unterdrücken
      /Critical dependency: the request of a dependency is an expression/,
      // Agenda-spezifische Warnungen
      /node_modules[\/\\]agenda[\/\\]/,
      /node_modules[\/\\]mongodb[\/\\]/,
      // Spezifische MongoDB Utils Warnung
      /node_modules[\/\\]mongodb[\/\\]lib[\/\\]utils\.js/,
    ];

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'huegelfest.fansel.dev',
      },
      {
        protocol: 'https',
        hostname: '*.cloudflare.com',
      },
      {
        protocol: 'https',
        hostname: '*.soundcloud.com',
      },
      {
        protocol: 'https',
        hostname: 'i1.sndcdn.com',
      }
    ],
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'huegelfest.fansel.dev'],
    }
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  reactStrictMode: true,
  compiler: {
    removeConsole: false,
  },
  devIndicators: {
    position: 'top-left',
  },
  env: {
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://huegelfest.fansel.dev https://*.cloudflare.com; worker-src 'self' blob:; child-src 'self' blob:; frame-src 'self' https://*.soundcloud.com; media-src 'self' https://*.soundcloud.com;"
          }
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
}

export default nextConfig; 