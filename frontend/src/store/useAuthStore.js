import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios'; // Importamos el cliente personalizado

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      authLoading: false, // Controla spinners globales en formularios de login/registro
      authError: null,    // Almacena errores devueltos por Laravel para mostrarlos en el front

      // Acción de Login Asíncrona conectada directamente a la API
      login: async (credentials) => {
        set({ authLoading: true, authError: null });
        try {
          // Solicitud POST a Laravel (ej: /login) usando nuestra instancia de Axios
          const response = await api.post('/login', credentials);
          const { user, token } = response.data;

          set({ 
            user, 
            token, 
            isAuthenticated: true, 
            authLoading: false,
            authError: null 
          });
          return { success: true };
        } catch (error) {
          const mensajeError = error.response?.data?.message || 'Credenciales inválidas o error de servidor.';
          const isUnverified = error.response?.status === 403 && error.response?.data?.status === 'unverified';
          const email = error.response?.data?.email;
          set({ authError: mensajeError, authLoading: false });
          return { 
            success: false, 
            error: mensajeError, 
            isUnverified, 
            email 
          };
        }
      },

      // Acción de Registro Asíncrona conectada a la API
      register: async (userData) => {
        set({ authLoading: true, authError: null });
        try {
          // Solicitud POST a Laravel (ej: /register)
          const response = await api.post('/register', userData);
          
          set({ 
            authLoading: false,
            authError: null 
          });
          return { success: true, email: response.data.email, message: response.data.message };
        } catch (error) {
          let mensajeError = 'Error al crear la cuenta. Inténtalo de nuevo.';
          if (error.response?.data) {
            if (error.response.data.errors) {
              const validationErrors = error.response.data.errors;
              const firstKey = Object.keys(validationErrors)[0];
              if (firstKey && Array.isArray(validationErrors[firstKey]) && validationErrors[firstKey].length > 0) {
                mensajeError = validationErrors[firstKey][0];
              } else {
                mensajeError = error.response.data.message || mensajeError;
              }
            } else {
              mensajeError = error.response.data.message || mensajeError;
            }
          }
          set({ authError: mensajeError, authLoading: false });
          return { success: false, error: mensajeError };
        }
      },

      // Cierre de sesión limpio (con opción de limpieza local inmediata si el token no es válido)
      logout: async (localOnly = false) => {
        if (localOnly) {
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false,
            authLoading: false,
            authError: null
          });
          return;
        }
        try {
          // Avisar a Laravel para que destruya el token en la BD
          await api.post('/logout'); 
        } catch (error) {
          console.error("Error al cerrar sesión en el servidor", error);
        } finally {
          // Sin importar si falla el backend, limpiamos el frontend
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false,
            authLoading: false,
            authError: null
          });
        }
      },

      // Limpiar errores manualmente (útil al cambiar de vista o escribir)
      clearAuthError: () => set({ authError: null }),

      // Actualizar los datos del usuario en el store
      setUser: (user) => {
        const normalized = (user && user.data && typeof user.data === 'object' && user.data.email) ? user.data : user;
        if (Array.isArray(normalized)) {
          console.warn("Intento de guardar un array en el estado de usuario bloqueado.");
          return;
        }
        set({ user: normalized });
      }
    }),
    {
      name: 'auth-storage',
      // Solo persistimos el usuario, token e isAuthenticated. Evitamos persistir loadings o errores antiguos.
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);