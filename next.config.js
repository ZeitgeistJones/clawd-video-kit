/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@remotion/bundler',
      '@remotion/renderer',
      'remotion',
    ],
  },
}

module.exports = nextConfig
