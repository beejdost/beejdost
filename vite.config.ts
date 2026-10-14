import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'icons/*.png'],
      manifest: {
        name: 'Beej Dost - Pakistan Seed Exchange & Marketplace',
        short_name: 'Beej Dost',
        description: 'Pakistan-wide agricultural seed exchange and marketplace connecting farmers and seed keepers.',
        theme_color: '#1b4332',
        background_color: '#f8faf9',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Only precache public static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/auth/, /^\/api/],
        // Do NOT cache private API responses, chat messages, authentication responses, or private user data
        runtimeCaching: [
          {
            // Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            // Google Fonts webfont files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            // STRICT SECURITY RULE: NetworkOnly for Supabase Auth, Realtime, and Private Data
            // Chat messages, direct messages, user profiles, and auth sessions MUST NEVER be cached publicly
            urlPattern: /^https:\/\/.*\.supabase\.co\/(auth|rest\/v1\/(messages|user_profiles|direct_messages|conversations)|realtime)\/.*/i,
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'auth-and-private-network-only',
                options: {
                  maxRetentionTime: 0,
                },
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
