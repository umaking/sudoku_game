/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.svg', 'maskable-icon-512.svg'],
      manifest: {
        name: 'Sudoku Lab — 변형 스도쿠',
        short_name: 'Sudoku Lab',
        description: 'Classic / Parity / Sum-Diff 변형 스도쿠',
        theme_color: '#15171a',
        background_color: '#fafaf7',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'maskable-icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@state': path.resolve(__dirname, 'src/state'),
      '@variants': path.resolve(__dirname, 'src/variants'),
      '@test': path.resolve(__dirname, 'src/test'),
    },
  },
  server: {
    allowedHosts: ['{your domain}'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
