// @ts-check
const pkg = require('./package.json')

// Starts a command line process to get the git hash.
const commitHash = require('child_process')
  .execSync('git rev-parse HEAD')
  .toString()
  .trim()

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false }
    return config
  },
}

module.exports = nextConfig
