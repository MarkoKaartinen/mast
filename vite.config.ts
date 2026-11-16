import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
  // The version shown in the app comes from package.json
  define: { __APP_VERSION__: JSON.stringify(version) },
  // Static assets (icons) live in static/, the build goes to public/ for the web server
  publicDir: 'static',
  resolve: { alias: { $lib: new URL('./src/lib', import.meta.url).pathname } },
  build: { outDir: 'public', emptyOutDir: true },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Mastodon Tools',
        short_name: 'MAST',
        description: 'Notifications, mentions, messages and posts of several Mastodon accounts',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#1e1e2e',
        theme_color: '#1e1e2e',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: { include: ['src/**/*.test.ts'] },
});
