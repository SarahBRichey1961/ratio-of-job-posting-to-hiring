/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  output: 'standalone',
  staticPageGenerationTimeout: 300,
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
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
