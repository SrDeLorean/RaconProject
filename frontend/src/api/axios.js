import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore'; // Ajusta la ruta relativa según tu estructura

// 1. Crear una instancia personalizada de Axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  timeout: 60000, // 60 segundos para permitir procesamiento de IA e imágenes pesadas
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// =========================================================================
// 2. INTERCEPTOR DE PETICIONES (REQUEST)
// Inyecta automáticamente el token Bearer en cada llamada a Laravel
// =========================================================================
api.interceptors.request.use(
  (config) => {
    // Obtenemos el estado actual de Zustand de manera síncrona sin usar hooks (getState)
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =========================================================================
// 3. INTERCEPTOR DE RESPUESTAS (RESPONSE)
// Manejo global de errores (ej. si el token expira o Laravel da un 401)
// =========================================================================
api.interceptors.response.use(
  (response) => response, // Si la respuesta es exitosa (2xx), la deja pasar intacta
  (error) => {
    // Si el backend responde con 401 (No Autorizado) significa que el token expiró o es inválido
    // Evitamos interceptar peticiones de login, logout o registro para no entrar en bucles o tapar errores de validación
    const isAuthRequest = error.config && error.config.url && (
      error.config.url.includes('/login') || 
      error.config.url.includes('/logout') ||
      error.config.url.includes('/register')
    );

    if (error.response && (error.response.status === 401 || error.response.status === 403) && !isAuthRequest) {
      const state = useAuthStore.getState();
      
      if (state.token || state.isAuthenticated || state.user) {
        console.warn("Sesión expirada o inválida. Forzando logout automático local...");
        
        // Ejecutamos el logout de Zustand en modo local (sin peticiones adicionales) para limpiar almacenamiento
        state.logout(true);
        
        // Redirigir de inmediato al login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;