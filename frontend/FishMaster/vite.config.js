import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'FishMaster',
        short_name: 'FishMaster',
        start_url: '/',
        display: 'standalone',
        background_color: '#2580ffff',
        theme_color: '#e90e2bff',
        icons: [
          {
            src: 'FishMaterAppLogo.ico',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'FishMaterAppLogo.ico',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
