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
      triggerNotification('error', error.response?.data?.message || 'No se pudo dar de baja al club.');
      throw error;
    }
  };

  const darWOEquipo = async (equipoId) => {
    try {
      await api.post(`/competencias/${competenciaId}/equipos/${equipoId}/wo`);
      triggerNotification('success', 'Se ha registrado Walkover para todos los partidos del club.');
      await fetchCompetenciaInfo();
      await fetchInscritos();
    } catch (error) {
      triggerNotification('error', error.response?.data?.message || 'Error al aplicar Walkover.');
    }
  };

  const reemplazarEquipo = async (equipoId, nuevoEquipoId) => {
    try {
      await api.post(`/competencias/${competenciaId}/equipos/${equipoId}/reemplazar`, {
        nuevo_equipo_id: nuevoEquipoId
      });
      triggerNotification('success', 'El club ha sido reemplazado en la competencia.');
      await fetchCompetenciaInfo();
      await fetchInscritos();
      await fetchDisponibles();
    } catch (error) {
      triggerNotification('error', error.response?.data?.message || 'Error al reemplazar el club.');
    }
  };

  const finalizarCompetencia = async (podioData) => {
    try {
      await api.put(`/competencias/${competenciaId}`, {
        ...competencia,
        estado: 'finalizada',
        campeon_id: podioData.campeon_id,
        subcampeon_id: podioData.subcampeon_id,
        tercer_lugar_id: podioData.tercer_lugar_id
      });
      triggerNotification('success', 'División finalizada oficialmente. ¡Podio registrado!');
      await fetchCompetenciaInfo();
    } catch (error) {
      triggerNotification('error', 'Error al finalizar la división.');
    }
  };

  return {
    data: { competencia, equiposInscritos, equiposDisponibles, searchTerm },
    ui: { isFetchingInfo, isFetchingEquipos, isSearching, notification },
    actions: { setSearchTerm, asignarEquipo, cambiarEstado, removerEquipo, darWOEquipo, reemplazarEquipo, setNotification, finalizarCompetencia, fetchCompetenciaInfo }
  };
};