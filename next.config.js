/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Use valid Next.js experimental options
    serverComponentsExternalPackages: [],
  },
  // NODE_OPTIONS cannot be set in env, use it in package.json scripts instead
  webpack: (config, { isServer }) => {
    // Optimize webpack configuration
    if (!isServer) {
      // Reduce client-side bundle size
      config.optimization.splitChunks.chunks = 'all';
      config.optimization.minimize = true;
    }
    return config;
  },
}

module.exports = nextConfig