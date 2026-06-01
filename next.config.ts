import type { NextConfig } from 'next'
import { initOpenNextCloudflareForDev } from '@cloudflare/next-on-pages/next-dev'

// Enable Cloudflare bindings in local dev (no-op in production)
if (process.env.NODE_ENV === 'development') {
  await initOpenNextCloudflareForDev()
}

const nextConfig: NextConfig = {
  // Compress responses
  compress: true,

  // Don't expose Next.js in headers
  poweredByHeader: false,

  // Tree-shake large icon/component libraries — massive HMR speedup in dev
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
    ],
  },

  images: {
    // Avoid unnecessary image resizing work
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'vumbnail.com' },
    ],
  },
}

export default nextConfig
