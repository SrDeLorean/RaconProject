import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url'; // <-- 1. Importamos estas utilidades de Node

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // <-- 2. Añadimos el bloque 'resolve' para configurar el alias
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});