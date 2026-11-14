import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    devOptions: { enabled: false },
    manifest: {
      name: 'Kostara', short_name: 'Kostara', description: 'Cari dan bandingkan kos dengan mudah.',
      start_url: '/', scope: '/', display: 'standalone', background_color: '#f4f8f4', theme_color: '#1f5130',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      runtimeCaching: [
        {
          urlPattern: ({ url }) => url.pathname.startsWith('/api/v1') && !url.pathname.includes('auth'),
          handler: 'NetworkFirst', options: { cacheName: 'kostara-api', networkTimeoutSeconds: 5 }
        },
        {
          urlPattern: ({ request }) => request.destination === 'image',
          handler: 'CacheFirst', options: { cacheName: 'kostara-img', expiration: { maxEntries: 60 } }
        },
      ],
    },
  })],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
})
