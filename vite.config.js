import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/shinycolors-stickers/',
  build: {
    outDir: 'build',
  },
  server: {
    open: true,
    port: 3000,
    // host: true,
  },
});