import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore'; // Ajusta la ruta relativa según tu estructura

// 1. Crear una instancia personalizada de Axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 10000, // 10 segundos de tiempo de espera máximo antes de abortar
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
    if (error.response && error.response.status === 401) {
      console.warn("Sesión expirada o inválida. Forzando logout automático...");
      
      // Ejecutamos el logout de Zustand para limpiar el localStorage y redirigir al login
      useAuthStore.getState().logout();
      
      // Opcional: Forzar una redirección limpia de la ventana si no estás dentro de un componente React
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;