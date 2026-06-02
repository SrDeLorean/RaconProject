import { useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';
import { useDebounce } from '@/hooks/useDebounce';

export const useEquipos = () => {
  const [equipos, setEquipos] = useState([]);
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

  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [capitanesList, setCapitanesList] = useState([]);
  
  const [formData, setFormData] = useState({
    nombre: '',
    abreviatura: '',
    descripcion: '',
    logo: '',
    banner: '',
    plataforma: 'crossplay',
    club_id_ea: '',
    redes_sociales: { twitter: '', twitch: '' },
    estado: true,
    id_capitan: ''
  });

  const triggerNotification = (variant, text) => {
    setNotification({ variant, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load captains (users list) for select list
  useEffect(() => {
    const fetchCapitanes = async () => {
      try {
        const response = await api.get('/users', { params: { per_page: 200, role: 'jugador' } });
        setCapitanesList(response.data.data || response.data || []);
      } catch (error) {
        console.error("Error al obtener capitanes:", error);
      }
    };
    fetchCapitanes();
  }, []);

  const fetchEquipos = useCallback(async () => {
    setIsFetching(true);
    try {
      const params = {
        page: currentPage,
        per_page: 10,
        search: debouncedSearchTerm !== '' ? debouncedSearchTerm : undefined,
        plataforma: activeTab !== 'todos' ? activeTab : undefined
      };

      const response = await api.get('/equipos', { params });
      // The API endpoint returns EquipoResource collections
      const responseData = response.data;
      
      setEquipos(responseData.data || responseData || []);
      setTotalPages(responseData.meta?.last_page || responseData.last_page || 1);
      setTotalRecords(responseData.meta?.total || responseData.total || 0);
    } catch (error) {
      triggerNotification('error', 'No se pudo sincronizar el listado de equipos.');
    } finally {
      setIsFetching(false);
    }
  }, [currentPage, debouncedSearchTerm, activeTab]);

  useEffect(() => {
    fetchEquipos();
  }, [fetchEquipos]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setFormErrors({});

    try {
      if (selectedEquipo) {
        await api.put(`/equipos/${selectedEquipo.id}`, formData);
        triggerNotification('success', 'Datos del club actualizados.');
      } else {
        await api.post('/equipos', formData);
        triggerNotification('success', 'Nuevo equipo creado.');
      }
      await fetchEquipos();
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Error al guardar equipo:", error);
      if (error.response?.status === 422) {
        setFormErrors(error.response.data.errors);
        triggerNotification('error', 'Por favor verifica los campos obligatorios y únicos.');
      } else {
        triggerNotification('error', error.response?.data?.message || 'Error al procesar el club.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/equipos/${itemToDelete.id}`);
      triggerNotification('success', 'Equipo eliminado correctamente.');
      
      if (equipos.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        await fetchEquipos();
      }
      setIsDeleteModalOpen(false);
    } catch (error) {
      triggerNotification('error', 'Error al eliminar el club.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDrawer = (equipo = null) => {
    setSelectedEquipo(equipo);
    setFormErrors({});
    if (equipo) {
      let redes = { twitter: '', twitch: '' };
      if (equipo.redes_sociales) {
        try {
          redes = typeof equipo.redes_sociales === 'string' 
            ? JSON.parse(equipo.redes_sociales) 
            : { twitter: equipo.redes_sociales.twitter || '', twitch: equipo.redes_sociales.twitch || '' };
        } catch (e) {
          redes = { twitter: '', twitch: '' };
        }
      }
      setFormData({
        nombre: equipo.nombre || '',
        abreviatura: equipo.abreviatura || '',
        descripcion: equipo.descripcion || '',
        logo: equipo.logo || '',
        banner: equipo.banner || '',
        plataforma: equipo.plataforma || 'crossplay',
        club_id_ea: equipo.club_id_ea || '',
        redes_sociales: redes,
        estado: equipo.estado !== undefined ? !!equipo.estado : true,
        id_capitan: equipo.id_capitan || ''
      });
    } else {
      setFormData({
        nombre: '',
        abreviatura: '',
        descripcion: '',
        logo: '',
        banner: '',
        plataforma: 'crossplay',
        club_id_ea: '',
        redes_sociales: { twitter: '', twitch: '' },
        estado: true,
        id_capitan: ''
      });
    }
    setIsDrawerOpen(true);
  };

  return {
    data: { equipos, totalRecords, currentPage, totalPages, searchTerm, activeTab, capitanesList },
    ui: { notification, isDrawerOpen, isDeleteModalOpen, isFetching, isSaving, isDeleting, selectedEquipo, itemToDelete },
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
