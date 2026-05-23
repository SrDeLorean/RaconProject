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
          set({ authError: mensajeError, authLoading: false });
          return { success: false, error: mensajeError };
        }
      },

      // Acción de Registro Asíncrona conectada a la API
      register: async (userData) => {
        set({ authLoading: true, authError: null });
        try {
          // Solicitud POST a Laravel (ej: /register)
          const response = await api.post('/register', userData);
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
          const mensajeError = error.response?.data?.message || 'Error al crear la cuenta. Inténtalo de nuevo.';
          set({ authError: mensajeError, authLoading: false });
          return { success: false, error: mensajeError };
        }
      },

      // Cierre de sesión limpio
      logout: async () => {
        try {
          // Opcional: Avisar a Laravel para que destruya el token en la BD
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
      clearAuthError: () => set({ authError: null })
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