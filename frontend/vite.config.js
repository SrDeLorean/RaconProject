import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    target: 'esnext',          // Modern browsers: smaller, faster output
    cssCodeSplit: true,         // Lazy-load CSS per chunk
    sourcemap: false,           // No sourcemaps in production
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) {
              return 'vendor-three';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('gsap') || id.includes('lottie-react')) {
              return 'vendor-anim';
            }
            if (id.includes('zustand') || id.includes('axios')) {
              return 'vendor-core';
            }
            return 'vendor-other';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
});