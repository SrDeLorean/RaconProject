import { useState, useEffect, useCallback } from 'react';
import api from '@/api/axios'; // Tu instancia de axios configurada
import { useDebounce } from '@/hooks/useDebounce'; // Asegúrate de tener este hook

export const useOrganizaciones = () => {
  // 1. Estados de Datos y Paginación
  const [organizaciones, setOrganizaciones] = useState([]);
  const [usuariosOrganizadores, setUsuariosOrganizadores] = useState([]);
  const [activeTab, setActiveTab] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  // 2. Estados de UI
  const [notification, setNotification] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 3. Estados de Entidades
  const [selectedOrganizacion, setSelectedOrganizacion] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [formData, setFormData] = useState({ 
    nombre: '', 
    slug: '', 
    owner_id: '', 
    is_verified: false, 
    estado: 'activo' 
  });

  const triggerNotification = (variant, text) => {
    setNotification({ variant, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // A. Obtener usuarios tipo organizador (para el SELECT)
  const fetchUsuariosOrganizadores = useCallback(async () => {
    try {
      const response = await api.get('/usuarios', { params: { role: 'organizador' } });
      setUsuariosOrganizadores(response.data.data || response.data);
    } catch (error) {
      console.error("Error al cargar organizadores:", error);
    }
  }, []);

  // B. Obtener Organizaciones (Paginado y Filtrado)
  const fetchOrganizaciones = useCallback(async () => {
    setIsFetching(true);
    try {
      const params = {
        page: currentPage,
        per_page: 10,
        search: debouncedSearchTerm !== '' ? debouncedSearchTerm : undefined,
        estado: activeTab !== 'todas' ? activeTab : undefined,
      };
      
      // LA RUTA DEBE SER EXACTAMENTE ESTA
      const response = await api.get('/organizaciones', { params });
      const responseData = response.data;
      
      setOrganizaciones(responseData.data || []);
      setTotalPages(responseData.meta?.last_page || responseData.last_page || 1);
      setTotalRecords(responseData.meta?.total || responseData.total || 0);
    } catch (error) {
      triggerNotification('error', 'No se pudieron sincronizar las organizaciones.');
    } finally {
      setIsFetching(false);
    }
  }, [currentPage, debouncedSearchTerm, activeTab]);

  useEffect(() => {
    fetchUsuariosOrganizadores();
  }, [fetchUsuariosOrganizadores]);

  useEffect(() => {
    fetchOrganizaciones();
  }, [fetchOrganizaciones]);

  // C. Guardar / Editar
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      if (selectedOrganizacion) {
        await api.put(`/organizaciones/${selectedOrganizacion.id}`, formData);
        triggerNotification('success', 'Organización actualizada.');
      } else {
        await api.post('/organizaciones', formData);
        triggerNotification('success', 'Organización creada.');
      }
      await fetchOrganizaciones();
      setIsDrawerOpen(false);
    } catch (error) {
      triggerNotification('error', error.response?.data?.message || 'Error en la petición.');
    } finally {
      setIsSaving(false);
    }
  };

  // D. Eliminar
  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/organizaciones/${itemToDelete.id}`);
      triggerNotification('success', 'Eliminado correctamente.');
      
      if (organizaciones.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        await fetchOrganizaciones();
      }
      setIsDeleteModalOpen(false);
    } catch (error) {
      triggerNotification('error', 'Error al eliminar.');
    } finally {
      setIsDeleting(false);
    }
  };

  // E. Controladores
  const openDrawer = (org = null) => {
    setSelectedOrganizacion(org);
    setFormData(org 
      ? { nombre: org.nombre, slug: org.slug, owner_id: org.owner_id, is_verified: org.is_verified, estado: org.estado }
      : { nombre: '', slug: '', owner_id: '', is_verified: false, estado: 'activo' }
    );
    setIsDrawerOpen(true);
  };

  return {
    data: { organizaciones, usuariosOrganizadores, totalRecords, currentPage, totalPages, searchTerm, activeTab },
    ui: { notification, isDrawerOpen, isDeleteModalOpen, isFetching, isSaving, isDeleting, selectedOrganizacion, itemToDelete },
    form: { formData, setFormData },
    actions: { 
      setSearchTerm, setCurrentPage, setActiveTab, setNotification,
      openDrawer, closeDrawer: () => setIsDrawerOpen(false),
      confirmDelete: (item) => { setItemToDelete(item); setIsDeleteModalOpen(true); },
      closeDeleteModal: () => setIsDeleteModalOpen(false),
      handleSave, executeDelete 
    }
  };
};