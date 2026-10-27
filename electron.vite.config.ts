import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';

export default defineConfig({
  main: {
    build: {
      externalizeDeps: true,
      lib: {
        entry: resolve(__dirname, 'electron/main.ts'),
      },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        external: ['electron'],
        output: {
          format: 'cjs',
        },
      },
      lib: {
        entry: resolve(__dirname, 'electron/preload.ts'),
        fileName: () => 'preload.cjs',
      },
    },
  },

  renderer: {
    root: '.',
    // La build Electron è sempre desktop, indipendentemente da VITE_APP nel file .env:
    // da questo valore dipendono il salvataggio su file e l'esclusione della pulizia bozze.
    define: {
      'import.meta.env.VITE_APP': JSON.stringify('desktop'),
    },
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'index.html'),
      },
    },
    plugins: [react(), tailwindcss()],
  },
});
