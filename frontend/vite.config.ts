import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// The app is local-first: all data lives in the browser's IndexedDB, so `vite dev`
// needs no backend at all. The only server-side piece is the optional email relay
// at api/send-email.ts, which only runs once deployed on Vercel (or via `vercel dev`).

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      // The app registers the service worker itself via the `virtual:pwa-register/react`
      // hook (src/components/PWA/UpdateToast.tsx), so it can show a "Reload to update"
      // toast instead of silently swapping the app under the user mid-session.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'favicon-64.png', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'SMT-C',
        short_name: 'SMT-C',
        description: 'SMT-C — Modern Mobile-first Personal Expense & Loan Management PWA, your data stays on your device',
        theme_color: '#0088b0',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'en',
        categories: ['finance', 'productivity'],
        // Home Screen icon long-press menu (Android/desktop Chrome; iOS has no equivalent yet)
        shortcuts: [
          {
            name: 'Add Expense',
            short_name: 'Add Expense',
            description: 'Log a new expense',
            url: '/?quickadd=expense',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Reminders',
            short_name: 'Reminders',
            description: 'View upcoming dues',
            url: '/?tab=reminders',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
        ],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // The whole app shell is cacheable — there is no data API to keep off the cache anymore.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // The PDF/Excel export libs (jsPDF + its canvas/purify deps, xlsx) are ~1.1MB combined
        // and only ever load when a Reports page visitor actually taps Export (db/exporters.ts
        // dynamic-imports them). Precaching them at install time would double the SW install
        // size for a feature most sessions never touch — excluded here and instead cached at
        // runtime, on first real use, by the CacheFirst rule below.
        globIgnores: ['**/xlsx-*.js', '**/jspdf*.js', '**/html2canvas*.js', '**/purify.es-*.js', '**/index.es-*.js'],
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: ({ url }) => /\/(xlsx|jspdf|html2canvas|purify\.es|index\.es)-.*\.js$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'export-libs',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
