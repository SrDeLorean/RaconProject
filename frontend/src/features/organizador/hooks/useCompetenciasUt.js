import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '@/api/axios';
import { useDebounce } from '@/hooks/useDebounce';

export const useCompetenciasUt = () => {
  const location = useLocation();
  const initialTemporadaId = location.state?.filterTemporadaId || '';
  const [competencias, setCompetencias] = useState([]);
  const [temporadasList, setTemporadasList] = useState([]);
  const [filterTemporadaId, setFilterTemporadaId] = useState(initialTemporadaId);
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const [notification, setNotification] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedCompetencia, setSelectedCompetencia] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const defaultForm = {
    temporada_id: '',
    nombre: '',
    descripcion: '',
    reglas: '',
    logo: '',
    banner: '',
    color_tema: '#ef4444',
    tipo: '1vs1', // 1vs1 | 2vs2
    formato: 'liga', // liga | copa | eliminatoria
    plataforma: 'crossplay',
    prize_pool: 0,
    entry_fee: 0,
    max_participantes: 16,
    es_publico: true,
    estado: 'borrador',
    fecha_inicio_inscripciones: '',
    fecha_fin_inscripciones: '',
    fecha_inicio_competencia: '',
    config: {
      cantidad_grupos: 1,
      clasificados_por_grupo: 2,
      modo_playoff: 'doble',
      auto_avanzar_fase: false
    }
  };

  const [formData, setFormData] = useState(defaultForm);

  const triggerNotification = (variant, text) => {
    setNotification({ variant, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchTemporadasDisponibles = useCallback(async () => {
    try {
      const response = await api.get('/temporadas', { params: { per_page: 100 } });
      const dataArray = response.data.data ? response.data.data : (Array.isArray(response.data) ? response.data : []);
      setTemporadasList(dataArray);
    } catch (error) {
      console.error("Error al cargar pool de temporadas", error);
    }
  }, []);

  const fetchCompetencias = useCallback(async () => {
    setIsFetching(true);
    try {
      const params = {
        temporada_id: filterTemporadaId !== '' ? filterTemporadaId : undefined,
        page: currentPage,
        per_page: 10,
        search: debouncedSearchTerm !== '' ? debouncedSearchTerm : undefined,
        estado: activeTab !== 'todos' ? activeTab : undefined,
        for_organizer: true,
      };

      const response = await api.get('/competencias-ut', { params });
      const responseData = response.data;

      const dataArray = responseData.data ? responseData.data : (Array.isArray(responseData) ? responseData : []);
      
      setCompetencias(dataArray);
      setTotalPages(responseData.meta?.last_page || responseData.last_page || 1);
      setTotalRecords(responseData.meta?.total || responseData.total || dataArray.length);
    } catch (error) {
      triggerNotification('error', 'No se pudieron sincronizar los torneos UT.');
    } finally {
      setIsFetching(false);
    }
  }, [currentPage, debouncedSearchTerm, activeTab, filterTemporadaId]);

  useEffect(() => {
    fetchTemporadasDisponibles();
  }, [fetchTemporadasDisponibles]);

  useEffect(() => {
    fetchCompetencias();
  }, [fetchCompetencias]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setFormErrors({});

    try {
      if (selectedCompetencia) {
        await api.put(`/competencias-ut/${selectedCompetencia.id}`, formData);
        triggerNotification('success', 'Torneo UT actualizado correctamente.');
      } else {
        await api.post('/competencias-ut', formData);
        triggerNotification('success', 'Nuevo torneo UT creado con éxito.');
      }
      await fetchCompetencias();
      setIsDrawerOpen(false);
    } catch (error) {
      if (error.response?.status === 422) {
        setFormErrors(error.response.data.errors);
        triggerNotification('error', 'Por favor, revisa las reglas de validación del formulario.');
      } else {
        triggerNotification('error', 'Error al procesar la solicitud.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/competencias-ut/${itemToDelete.id}`);
      triggerNotification('success', 'Torneo UT eliminado.');
      if (competencias.length === 1 && currentPage > 1) setCurrentPage(prev => prev - 1);
      else await fetchCompetencias();
      setIsDeleteModalOpen(false);
    } catch (error) {
      triggerNotification('error', 'No se pudo eliminar el torneo UT.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDrawer = (competencia = null) => {
    setSelectedCompetencia(competencia);
    setFormErrors({});
    
    const formatDateTime = (dateString) => dateString ? dateString.substring(0, 16) : '';

    setFormData(competencia 
      ? {
          temporada_id: competencia.temporada_id || '',
          nombre: competencia.nombre,
          descripcion: competencia.descripcion || '',
          reglas: competencia.reglas || '',
          logo: competencia.logo || '',
          banner: competencia.banner || '',
          color_tema: competencia.color_tema || '#ef4444',
          tipo: competencia.tipo || '1vs1',
          formato: competencia.formato || 'liga',
          plataforma: competencia.plataforma || 'crossplay',
          prize_pool: competencia.prize_pool || 0,
          entry_fee: competencia.entry_fee || 0,
          max_participantes: competencia.max_participantes || 16,
          es_publico: competencia.es_publico ?? true,
          estado: competencia.estado || 'borrador',
          fecha_inicio_inscripciones: formatDateTime(competencia.fecha_inicio_inscripciones),
          fecha_fin_inscripciones: formatDateTime(competencia.fecha_fin_inscripciones),
          fecha_inicio_competencia: formatDateTime(competencia.fecha_inicio_competencia),
          config: competencia.config || {
            cantidad_grupos: 1,
            clasificados_por_grupo: 2,
            modo_playoff: 'doble',
            auto_avanzar_fase: false
          }
        }
      : defaultForm
    );
    setIsDrawerOpen(true);
  };

  return {
    data: { competencias, temporadasList, filterTemporadaId, totalRecords, currentPage, totalPages, searchTerm, activeTab },
    ui: { notification, isDrawerOpen, isDeleteModalOpen, isFetching, isSaving, isDeleting, selectedCompetencia, itemToDelete },
    form: { formData, setFormData, formErrors },
    actions: { setSearchTerm, setCurrentPage, setActiveTab, setFilterTemporadaId, setNotification, openDrawer, closeDrawer: () => setIsDrawerOpen(false), confirmDelete: (item) => { setItemToDelete(item); setIsDeleteModalOpen(true); }, closeDeleteModal: () => setIsDeleteModalOpen(false), handleSave, executeDelete }
  };
};
