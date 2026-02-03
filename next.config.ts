import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  output: 'export',

  basePath: '/sollewitt',
  assetPrefix: '/sollewitt',

  images: {
    unoptimized: true,
  },
}

export default nextConfig
