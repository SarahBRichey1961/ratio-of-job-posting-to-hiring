/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
}

module.exports = nextConfig
