import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '@/api/axios';
import { useDebounce } from '@/hooks/useDebounce';

export const useCompetencias = () => {
  const location = useLocation();
  const initialTemporadaId = location.state?.filterTemporadaId || '';
  const [competencias, setCompetencias] = useState([]);
  const [temporadasList, setTemporadasList] = useState([]);
  const [filterTemporadaId, setFilterTemporadaId] = useState(initialTemporadaId); // 🔥 Filtro para la tabla principal o pre-cargado desde state
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
    temporada_id: '', // Se seleccionará manualmente en el drawer
    nombre: '',
    slug: '',
    logo: '',
    banner: '',
    color_tema: '#ef4444',
    formato: 'liga',
    plataforma: 'crossplay',
    prize_pool: 0,
    entry_fee: 0,
    max_participantes: 16,
    es_publico: true,
    estado: 'borrador',
    fecha_inicio_inscripciones: '',
    fecha_fin_inscripciones: '',
    fecha_inicio_competencia: ''
  };

  const [formData, setFormData] = useState(defaultForm);

  const triggerNotification = (variant, text) => {
    setNotification({ variant, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // Cargar las temporadas de la organización para los selectores del front
  const fetchTemporadasDisponibles = useCallback(async () => {
    try {
      const response = await api.get('/temporadas', { params: { per_page: 100 } });
      const dataArray = response.data.data ? response.data.data : (Array.isArray(response.data) ? response.data : []);
      setTemporadasList(dataArray);
    } catch (error) {
      console.error("Error al cargar pool de temporadas", error);
    }
  }, []);

  // Carga global o filtrada de competencias
  const fetchCompetencias = useCallback(async () => {
    setIsFetching(true);
    try {
      const params = {
        temporada_id: filterTemporadaId !== '' ? filterTemporadaId : undefined, // 🔥 Filtro dinámico opcional
        page: currentPage,
        per_page: 10,
        search: debouncedSearchTerm !== '' ? debouncedSearchTerm : undefined,
        estado: activeTab !== 'todos' ? activeTab : undefined,
        for_organizer: true,
      };

      const response = await api.get('/competencias', { params });
      const responseData = response.data;

      const dataArray = responseData.data ? responseData.data : (Array.isArray(responseData) ? responseData : []);
      
      setCompetencias(dataArray);
      setTotalPages(responseData.meta?.last_page || responseData.last_page || 1);
      setTotalRecords(responseData.meta?.total || responseData.total || dataArray.length);
    } catch (error) {
      triggerNotification('error', 'No se pudieron sincronizar las divisiones.');
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
        await api.put(`/competencias/${selectedCompetencia.id}`, formData);
        triggerNotification('success', 'División actualizada correctamente.');
      } else {
        await api.post('/competencias', formData);
        triggerNotification('success', 'Nueva división creada con éxito.');
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
      await api.delete(`/competencias/${itemToDelete.id}`);
      triggerNotification('success', 'División eliminada.');
      if (competencias.length === 1 && currentPage > 1) setCurrentPage(prev => prev - 1);
      else await fetchCompetencias();
      setIsDeleteModalOpen(false);
    } catch (error) {
      triggerNotification('error', 'No se pudo eliminar la competencia.');
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
          slug: competencia.slug,
          logo: competencia.logo || '',
          banner: competencia.banner || '',
          color_tema: competencia.color_tema || '#ef4444',
          formato: competencia.formato || 'liga',
          plataforma: competencia.plataforma || 'crossplay',
          prize_pool: competencia.prize_pool || 0,
          entry_fee: competencia.entry_fee || 0,
          max_participantes: competencia.max_participantes || 16,
          es_publico: competencia.es_publico ?? true,
          estado: competencia.estado || 'borrador',
          fecha_inicio_inscripciones: formatDateTime(competencia.fecha_inicio_inscripciones),
          fecha_fin_inscripciones: formatDateTime(competencia.fecha_fin_inscripciones),
          fecha_inicio_competencia: formatDateTime(competencia.fecha_inicio_competencia)
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