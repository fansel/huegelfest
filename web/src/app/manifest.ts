import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hügelfest',
    short_name: 'Hügelfest',
    description: 'Die offizielle Progressive Web App für das Hügelfest',
    start_url: '/',
    display: 'standalone',
    background_color: '#460b6c',
    theme_color: '#460b6c',
    orientation: 'portrait',
    prefer_related_applications: false,
    categories: ['entertainment', 'events'],
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ]
  }
} 