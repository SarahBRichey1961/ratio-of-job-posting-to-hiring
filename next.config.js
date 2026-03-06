/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  // Ensure API routes properly parse JSON
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
