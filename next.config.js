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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ]
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false }
    return config
  },
}

module.exports = nextConfig
