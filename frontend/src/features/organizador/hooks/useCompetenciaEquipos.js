import { useState, useCallback, useEffect } from 'react';
import api from '@/api/axios';
import { useDebounce } from '@/hooks/useDebounce';

export const useCompetenciaEquipos = (competenciaId) => {
  const [equiposInscritos, setEquiposInscritos] = useState([]);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const triggerNotification = (variant, text) => {
    setNotification({ variant, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Obtener equipos ya en la competencia
  const fetchInscritos = useCallback(async () => {
    if (!competenciaId) return;
    setIsFetching(true);
    try {
      const response = await api.get(`/competencias/${competenciaId}/equipos`);
      setEquiposInscritos(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  }, [competenciaId]);

  // 2. Buscar equipos globales para añadir
  const fetchDisponibles = useCallback(async () => {
    if (!competenciaId) return;
    setIsSearching(true);
    try {
      const response = await api.get(`/competencias/${competenciaId}/equipos/disponibles`, {
        params: { search: debouncedSearchTerm }
      });
      setEquiposDisponibles(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  }, [competenciaId, debouncedSearchTerm]);

  useEffect(() => {
    fetchInscritos();
  }, [fetchInscritos]);

  useEffect(() => {
    fetchDisponibles();
  }, [fetchDisponibles]);

  // 3. Agregar equipo
  const asignarEquipo = async (equipoId) => {
    try {
      await api.post(`/competencias/${competenciaId}/equipos`, { equipo_id: equipoId });
      triggerNotification('success', 'Equipo asignado al torneo.');
      fetchInscritos(); // Refrescar lista de inscritos
      fetchDisponibles(); // Quitarlo de la lista de disponibles
    } catch (error) {
      triggerNotification('error', error.response?.data?.message || 'Error al asignar.');
    }
  };

  // 4. Actualizar Estado (Pendiente/Aprobado)
  const cambiarEstado = async (equipoId, nuevoEstado) => {
    try {
      await api.put(`/competencias/${competenciaId}/equipos/${equipoId}`, { estado_inscripcion: nuevoEstado });
      fetchInscritos();
    } catch (error) {
      triggerNotification('error', 'Error al cambiar el estado.');
    }
  };

  // 5. Eliminar (Dar de baja)
  const removerEquipo = async (equipoId) => {
    try {
      await api.delete(`/competencias/${competenciaId}/equipos/${equipoId}`);
      triggerNotification('success', 'Club dado de baja de la división.');
      fetchInscritos();
      fetchDisponibles();
    } catch (error) {
      triggerNotification('error', 'No se pudo dar de baja al club.');
    }
  };

  return {
    data: { equiposInscritos, equiposDisponibles, searchTerm },
    ui: { isFetching, isSearching, notification },
    actions: { setSearchTerm, asignarEquipo, cambiarEstado, removerEquipo, setNotification }
  };
};