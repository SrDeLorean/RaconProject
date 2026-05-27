import { useState, useCallback, useEffect } from 'react';
import api from '@/api/axios';
import { useDebounce } from '@/hooks/useDebounce';

export const useCompetenciaDetalle = (competenciaId) => {
  const [competencia, setCompetencia] = useState(null);
  const [equiposInscritos, setEquiposInscritos] = useState([]);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const [isFetchingInfo, setIsFetchingInfo] = useState(true);
  const [isFetchingEquipos, setIsFetchingEquipos] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState(null);

  const triggerNotification = (variant, text) => {
    setNotification({ variant, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Cargar la información base del torneo
  const fetchCompetenciaInfo = useCallback(async () => {
    if (!competenciaId) return;
    setIsFetchingInfo(true);
    try {
      const response = await api.get(`/competencias/${competenciaId}`);
      setCompetencia(response.data.data || response.data);
    } catch (error) {
      triggerNotification('error', 'Error al cargar los datos del torneo.');
    } finally {
      setIsFetchingInfo(false);
    }
  }, [competenciaId]);

  // 2. Cargar los equipos inscritos
  const fetchInscritos = useCallback(async () => {
    if (!competenciaId) return;
    setIsFetchingEquipos(true);
    try {
      const response = await api.get(`/competencias/${competenciaId}/equipos`);
      setEquiposInscritos(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetchingEquipos(false);
    }
  }, [competenciaId]);

  // 3. Buscar equipos en el mercado global
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
    fetchCompetenciaInfo();
    fetchInscritos();
  }, [fetchCompetenciaInfo, fetchInscritos]);

  useEffect(() => {
    fetchDisponibles();
  }, [fetchDisponibles]);

  const asignarEquipo = async (equipoId) => {
    try {
      await api.post(`/competencias/${competenciaId}/equipos`, { equipo_id: equipoId });
      triggerNotification('success', 'Equipo asignado al torneo.');
      fetchInscritos(); 
      fetchDisponibles(); 
    } catch (error) {
      triggerNotification('error', error.response?.data?.message || 'Error al asignar.');
    }
  };

  const cambiarEstado = async (equipoId, nuevoEstado) => {
    try {
      await api.put(`/competencias/${competenciaId}/equipos/${equipoId}`, { estado_inscripcion: nuevoEstado });
      fetchInscritos();
    } catch (error) {
      triggerNotification('error', 'Error al cambiar el estado.');
    }
  };

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
    data: { competencia, equiposInscritos, equiposDisponibles, searchTerm },
    ui: { isFetchingInfo, isFetchingEquipos, isSearching, notification },
    actions: { setSearchTerm, asignarEquipo, cambiarEstado, removerEquipo, setNotification }
  };
};