import { useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';

/**
 * Hook para cargar y recargar de forma asíncrona parcial la ficha de un torneo,
 * que incluye la clasificación (standings), el calendario y los equipos inscritos.
 * 
 * @param {string|number} competenciaId ID del torneo a consultar
 */
export const useTorneoData = (competenciaId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTorneoData = useCallback(async (isSilent = false) => {
    if (!competenciaId) return;
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/competencias/${competenciaId}`);
      setData(response.data?.data || response.data);
    } catch (err) {
      console.error('Error al recargar ficha del torneo:', err);
      setError('No se pudo actualizar los datos del torneo.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [competenciaId]);

  useEffect(() => {
    fetchTorneoData();
  }, [fetchTorneoData]);

  const refreshData = useCallback(async () => {
    await fetchTorneoData(true);
  }, [fetchTorneoData]);

  return {
    data,
    loading,
    error,
    refreshData
  };
};
