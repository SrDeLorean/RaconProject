import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./assets/css/main.css";
import App from "./App.jsx";

// ⚡ RESOLUCIÓN DINÁMICA DE IMÁGENES Y MEDIA: Evita rutas hardcodeadas a localhost:8000
// y construye las URLs utilizando el baseURL de la API (soporta local, XAMPP y producción cPanel).
window.mediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  // Limpiar /api al final de la URL base (incluyendo subcarpetas como /api/public/api)
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
  const cleanBase = apiBaseUrl.replace(/\/api$/, '');
  
  const safePath = path.startsWith('/') ? path : '/' + path;
  return `${cleanBase}${safePath}`;
};

// ⚡ RECUPERACIÓN AUTOMÁTICA DE BUNDLES: Detecta fallas en la importación de módulos JS (por cambios de hash en cPanel)
// y recarga la página para obtener los archivos más recientes. Evita bucles de recarga usando sessionStorage.
const handleChunkError = (error) => {
  const errorMessage = error?.message || '';
  if (
    errorMessage.includes('Failed to fetch dynamically imported module') ||
    errorMessage.includes('Expected a JavaScript-or-Wasm module script') ||
    errorMessage.includes('ChunkLoadError')
  ) {
    const lastReload = sessionStorage.getItem('last-chunk-reload');
    const now = Date.now();
    
    // Si ya recargamos hace menos de 10 segundos, no lo volvemos a hacer en bucle
    if (!lastReload || now - parseInt(lastReload) > 10000) {
      sessionStorage.setItem('last-chunk-reload', now.toString());
      console.warn("Error de carga de módulo detectado. Recargando página para obtener bundles actualizados...");
      window.location.reload();
    } else {
      console.error("El error de módulo persiste tras recarga. Deteniendo para evitar bucle.");
    }
  }
};

window.addEventListener('error', (event) => {
  handleChunkError(event.error || event);
}, true);

window.addEventListener('unhandledrejection', (event) => {
  handleChunkError(event.reason);
});

// 🌟 PREVENCIÓN FOUC: Inyecta el tema oscuro/claro de inmediato antes de que React despierte
if (
  localStorage.theme === 'dark' || 
  (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);