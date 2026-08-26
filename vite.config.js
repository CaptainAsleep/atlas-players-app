import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", // service worker checks for a new version and swaps in silently, no manual "reload to update" prompt needed at this stage
      includeAssets: ["apple-touch-icon.png", "favicon-32.png", "favicon-16.png", "logo.jpg"],
      manifest: {
        name: "Atlas",
        short_name: "Atlas",
        description: "Find airsoft fields and events near you.",
        theme_color: "#002C48", // matches the app's ink/brand token
        background_color: "#F2F2ED", // matches the app's page background — keeps the splash screen from flashing a mismatched color before the app paints
        display: "standalone",
        start_url: "/atlas-players-app/",
        scope: "/atlas-players-app/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Caches the built app shell (JS/CSS/HTML/icons) so the app launches
        // instantly and works offline for anything already loaded. This is
        // app-shell caching, not full offline data sync — live Firestore
        // data still needs a real connection. Full offline mode (queued
        // actions, offline QR check-in, etc.) is separate, bigger work.
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-stylesheets" },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  base: "/atlas-players-app/",
});
