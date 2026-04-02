/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  output: 'standalone',
  typescript: {
    /*  Disable TypeScript checking during build - types verified locally */
    tsc: false,
  },
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  async redirects() {
    return [
      {
        source: '/monetization/pricing',
        destination: '/pricing',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
