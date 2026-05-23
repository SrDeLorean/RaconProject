import api from '@/api/axios';

export const loginUser = async (credentials) => {
  const response = await api.post('/login', credentials);
  console.log('Respuesta del servidor:', response.data); // Agrega este log para depuración
  return response.data;
};

// NUEVA FUNCIÓN: Envía los datos de registro a Laravel
export const registerUser = async (userData) => {
  const response = await api.post('/register', userData);
  return response.data;
};