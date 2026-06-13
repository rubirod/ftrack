import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
// Деплой на GitHub Pages: https://<user>.github.io/ftrack/
export default defineConfig({
    base: '/ftrack/',
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'Калории',
                short_name: 'Калории',
                theme_color: '#0A0908',
                background_color: '#0A0908',
                display: 'standalone',
                orientation: 'portrait',
                icons: [
                    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                // Данные ходят через внешние API (Airtable/Anthropic) — их не кэшируем,
                // service worker должен пропускать такие запросы в сеть.
                navigateFallbackDenylist: [/^https:\/\/api\./],
                runtimeCaching: [],
            },
        }),
    ],
});
