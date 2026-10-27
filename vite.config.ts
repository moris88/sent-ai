import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1500,
  },
  // Questa configurazione serve solo alla versione web; Electron usa electron.vite.config.ts.
  define: {
    'import.meta.env.VITE_APP': JSON.stringify('web'),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SentAI Email Refiner',
        short_name: 'SentAI',
        theme_color: '#2563eb',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
});
