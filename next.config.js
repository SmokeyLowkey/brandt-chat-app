/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Moved from experimental to top-level per Next.js 15.2.4
  serverExternalPackages: [],
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Other experimental options can go here
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