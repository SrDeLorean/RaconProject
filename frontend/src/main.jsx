import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./assets/css/main.css";
import App from "./App.jsx";

// ⚡ RESOLUCIÓN DINÁMICA DE IMÁGENES Y MEDIA: Evita rutas hardcodeadas a localhost:8000
// y construye las URLs utilizando el baseURL de la API (soporta local, XAMPP y producción cPanel).
window.mediaUrl = (path, fallbackType) => {
  const isDefault = !path || 
                    path === 'default.png' || 
                    path === '/default.png' || 
                    path.includes('default-user.png') || 
                    path.includes('default-org-logo') || 
                    path.includes('default-org-banner') || 
                    path.includes('default-team-logo') || 
                    path.includes('default-team-banner');

  if (isDefault) {
    if (fallbackType === 'user' || fallbackType === 'usuario') {
      return '/images/users/default-user.png';
    }
    if (fallbackType === 'org_logo' || fallbackType === 'organizacion_logo') {
      return '/images/default-org-logo.svg';
    }
    if (fallbackType === 'org_banner' || fallbackType === 'organizacion_banner') {
      return '/images/default-org-banner.svg';
    }
    if (fallbackType === 'team_logo' || fallbackType === 'equipo_logo') {
      return '/images/default-team-logo.svg';
    }
    if (fallbackType === 'team_banner' || fallbackType === 'equipo_banner') {
      return '/images/default-team-banner.svg';
    }
    
    // Auto-detect based on path keywords if fallbackType is not provided
    if (path) {
      if (path.includes('default-user.png') || path.includes('users')) {
        return '/images/users/default-user.png';
      }
      if (path.includes('default-org-logo')) {
        return '/images/default-org-logo.svg';
      }
      if (path.includes('default-org-banner')) {
        return '/images/default-org-banner.svg';
      }
      if (path.includes('default-team-logo') || path === 'default.png' || path === '/default.png') {
        return '/images/default-team-logo.svg';
      }
      if (path.includes('default-team-banner')) {
        return '/images/default-team-banner.svg';
      }
    }
    return '';
  }

  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  // Limpiar /api al final de la URL base (incluyendo subcarpetas como /api/public/api)
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
  const cleanBase = apiBaseUrl.replace(/\/api$/, '');
  
  const safePath = path.startsWith('/') ? path : '/' + path;
  return `${cleanBase}${safePath}`;
};

// ⚡ SOPORTE DE IMÁGENES DEFECTIVAS (CLIENT-SIDE): Reemplaza la fuente de las imágenes rotas (404) dinámicamente
window.handleImageError = (e, fallbackType) => {
  e.target.onerror = null; // Evitar bucles infinitos
  if (fallbackType === 'user' || fallbackType === 'usuario') {
    e.target.src = '/images/users/default-user.png';
  } else if (fallbackType === 'org_logo' || fallbackType === 'organizacion_logo') {
    e.target.src = '/images/default-org-logo.svg';
  } else if (fallbackType === 'org_banner' || fallbackType === 'organizacion_banner') {
    e.target.src = '/images/default-org-banner.svg';
  } else if (fallbackType === 'team_logo' || fallbackType === 'equipo_logo') {
    e.target.src = '/images/default-team-logo.svg';
  } else if (fallbackType === 'team_banner' || fallbackType === 'equipo_banner') {
    e.target.src = '/images/default-team-banner.svg';
  }
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