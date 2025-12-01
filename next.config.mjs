/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Enable optimization and cache for remote avatars
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
    minimumCacheTTL: 60 * 60 * 24, // 24h cache
  },
  // Webpack configuration to handle chunk loading issues
  webpack: (config, { isServer, dev }) => {
    if (!isServer && dev) {
      // In development, add better error handling for chunk loading
      config.output = {
        ...config.output,
        // Use content hash for better cache invalidation
        chunkFilename: 'static/chunks/[name].[contenthash].js',
      }
    }
    return config
  },
  // Experimental features for better chunk handling
  experimental: {
    // Improve client-side navigation reliability
    optimisticClientCache: false,
  },
  // Generate source maps in development for better debugging
  productionBrowserSourceMaps: false,
  // Disable powered by header
  poweredByHeader: false,
  // Strict mode for better error detection
  reactStrictMode: true,
  // Handle trailing slashes consistently
  trailingSlash: false,
  // Improve build output
  output: 'standalone',
}

export default nextConfig
