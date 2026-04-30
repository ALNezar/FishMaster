import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { loadEnv } from 'vite'

function runtimeInfoPlugin({ command, mode, apiBaseUrl }) {
  return {
    name: 'fishmaster-runtime-info',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        console.info('\n[FishMaster] Frontend server info')
        console.info(`[FishMaster] command: ${command}`)
        console.info(`[FishMaster] mode: ${mode}`)
        console.info(`[FishMaster] dev mode: ${command === 'serve' ? 'enabled' : 'disabled'}`)
        console.info(`[FishMaster] api base url: ${apiBaseUrl}`)
        console.info('[FishMaster] pwa dev options: enabled')
      })
    }
  }
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8080'

  return {
    plugins: [
      react(),
      runtimeInfoPlugin({ command, mode, apiBaseUrl }),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        includeAssets: ['favicon.ico', 'robots.txt', 'Fishtyi.png'],
        manifest: {
          name: 'FishMaster - Aquarium Management',
          short_name: 'FishMaster',
          description: 'Manage your aquarium tanks and fish with ease',
          start_url: '/',
          display: 'standalone',
          background_color: '#2580ff',
          theme_color: '#e90e2b',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          // Cache API calls with network-first strategy
          runtimeCaching: [
            {
              urlPattern: /^http:\/\/localhost:8080\/.*$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                }
              }
            }
          ],
          // Pre-cache app shell
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
        }
      })
    ]
  }
})
