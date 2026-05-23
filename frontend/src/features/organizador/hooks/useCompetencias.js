import { useState, useCallback } from 'react';
import api from '@/api/axios';

export const useCompetencias = (torneoId = null) => {
  const [competencias, setCompetencias] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCompetencia, setSelectedCompetencia] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '', format: 'liga', prize_pool: 0, entry_fee: 0, max_participantes: 16, estado: 'borrador'
  });

  const fetchCompetencias = useCallback(async () => {
    setIsFetching(true);
    try {
      // Si tienes un torneoId, filtramos por él. Si no, traemos todas las del organizador.
      const url = torneoId ? `/competencias?torneo_id=${torneoId}` : '/competencias';
      const response = await api.get(url);
      setCompetencias(response.data.data || response.data);
    } catch (error) {
      console.error("Error al cargar competencias:", error);
    } finally {
      setIsFetching(false);
    }
  }, [torneoId]);

  const handleSave = async (data) => {
    try {
      if (selectedCompetencia) {
        await api.put(`/competencias/${selectedCompetencia.id}`, data);
      } else {
        await api.post('/competencias', { ...data, torneo_id: torneoId });
      }
      await fetchCompetencias();
      setIsDrawerOpen(false);
    } catch (error) {
      throw error; // Manejado por el componente de UI
    }
  };

  return {
    competencias, isFetching, isDrawerOpen, selectedCompetencia, formData,
    setFormData, fetchCompetencias, handleSave, setIsDrawerOpen, setSelectedCompetencia
  };
};