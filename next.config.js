/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  output: 'standalone',
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
