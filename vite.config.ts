import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

dotenv.config();
console.log('VITE_APP:', process.env.VITE_APP);

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1500,
  },
  plugins: [
    react(),
    tailwindcss(),
    process.env.VITE_APP !== 'desktop'
      ? VitePWA({
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
        })
      : undefined,
  ],
});
