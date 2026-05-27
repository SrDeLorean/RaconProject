import { useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';
import { useDebounce } from '@/hooks/useDebounce';

export const useTemporadas = () => {
  const [temporadas, setTemporadas] = useState([]);
  const [activeTab, setActiveTab] = useState('todas');
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

  const [selectedTemporada, setSelectedTemporada] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    estado_mercado: 'abierto',
    fecha_inicio: '',
    fecha_fin: '',
    activa: true
  });

  const triggerNotification = (variant, text) => {
    setNotification({ variant, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchTemporadas = useCallback(async () => {
    setIsFetching(true);
    try {
      const params = {
        page: currentPage,
        per_page: 10,
        search: debouncedSearchTerm !== '' ? debouncedSearchTerm : undefined,
        // Filtro por pestaña: todas, activas (1), inactivas (0)
        activa: activeTab !== 'todas' ? (activeTab === 'activas' ? '1' : '0') : undefined,
      };

      const response = await api.get('/temporadas', { params });
      const responseData = response.data;

      setTemporadas(responseData.data || responseData || []);
      setTotalPages(responseData.meta?.last_page || responseData.last_page || 1);
      setTotalRecords(responseData.meta?.total || responseData.total || 0);
    } catch (error) {
      triggerNotification('error', 'No se pudo sincronizar el historial de temporadas.');
    } finally {
      setIsFetching(false);
    }
  }, [currentPage, debouncedSearchTerm, activeTab]);

  useEffect(() => {
    fetchTemporadas();
  }, [fetchTemporadas]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setFormErrors({});

    try {
      if (selectedTemporada) {
        await api.put(`/temporadas/${selectedTemporada.id}`, formData);
        triggerNotification('success', 'Ciclo de temporada actualizado.');
      } else {
        await api.post('/temporadas', formData);
        triggerNotification('success', 'Nueva temporada inaugurada con éxito.');
      }
      await fetchTemporadas();
      setIsDrawerOpen(false);
    } catch (error) {
        console.error("Error al guardar temporada:", error);
      if (error.response?.status === 422) {
        setFormErrors(error.response.data.errors);
        triggerNotification('error', 'Verifica las reglas cronológicas de las fechas.');
      } else {
        triggerNotification('error', error.response?.data?.message || 'Error al procesar el ciclo.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/temporadas/${itemToDelete.id}`);
      triggerNotification('success', 'Temporada archivada correctamente.');
      
      if (temporadas.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        await fetchTemporadas();
      }
      setIsDeleteModalOpen(false);
    } catch (error) {
      triggerNotification('error', 'No se puede eliminar una temporada con competencias en curso.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDrawer = (temporada = null) => {
    setSelectedTemporada(temporada);
    setFormErrors({});
    setFormData(temporada 
      ? { 
          nombre: temporada.nombre, 
          slug: temporada.slug, 
          estado_mercado: temporada.estado_mercado, 
          fecha_inicio: temporada.fecha_inicio || '', 
          fecha_fin: temporada.fecha_fin || '', 
          activa: temporada.activa 
        }
      : { nombre: '', slug: '', estado_mercado: 'abierto', fecha_inicio: '', fecha_fin: '', activa: true }
    );
    setIsDrawerOpen(true);
  };

  return {
    data: { temporadas, totalRecords, currentPage, totalPages, searchTerm, activeTab },
    ui: { notification, isDrawerOpen, isDeleteModalOpen, isFetching, isSaving, isDeleting, selectedTemporada, itemToDelete },
    form: { formData, setFormData, formErrors },
    actions: {
      setSearchTerm, setCurrentPage, setActiveTab, setNotification,
      openDrawer, closeDrawer: () => setIsDrawerOpen(false),
      confirmDelete: (item) => { setItemToDelete(item); setIsDeleteModalOpen(true); },
      closeDeleteModal: () => setIsDeleteModalOpen(false),
      handleSave, executeDelete
    }
  };
};