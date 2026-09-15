import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png'],
      manifest: {
        name: 'Digital Planner',
        short_name: 'Planner',
        description: 'A paper-style planner backed by Google Calendar and Google Tasks.',
        start_url: '/',
        display: 'standalone',
        background_color: '#fbf9f4',
        theme_color: '#c9ead1',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache the app shell; Google API calls always go to the network
        // (they're per-session and auth-scoped, not something to cache).
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
})
