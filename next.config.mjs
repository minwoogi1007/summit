import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1년
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30일
        },
      },
    },
    {
      urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firestore',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 1일
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Windows 파일 시스템 문제 해결
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: ['**/node_modules/**', '**/.next/**'],
    };
    return config;
  },
};

export default pwaConfig(nextConfig);

