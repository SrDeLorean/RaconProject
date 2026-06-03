import { useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';
import { useDebounce } from '@/hooks/useDebounce';

export const useJugadores = () => {
  const [jugadores, setJugadores] = useState([]);
  const [activeTab, setActiveTab] = useState('todos'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [notification, setNotification] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedJugador, setSelectedJugador] = useState(null);
  const [jugadorToDelete, setJugadorToDelete] = useState(null);
  
  // 🔥 MEJORA: Estado inicial con todos los campos del nuevo modelo E-Sports
  const defaultForm = { 
    name: '', email: '', password: '', role: 'jugador', status: 'activo',
    gamertag: '', id_ea: '', plataforma: 'crossplay',
    nacionalidad: '', posicion: '', fecha_nacimiento: '', 
    altura: '', peso: '', telefono: ''
  };

  const [formData, setFormData] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});

  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const triggerNotification = (variant, text) => {
    setNotification({ variant, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchJugadores = useCallback(async () => {
    setIsFetching(true);
    try {
      const params = {
        page: currentPage,
        per_page: 10,
        search: debouncedSearchTerm !== '' ? debouncedSearchTerm : undefined,
        role: 'jugador',
        status: activeTab !== 'todos' ? activeTab : undefined,
      };
      
      const response = await api.get('/users', { params });
      const responseData = response.data;
      
      setJugadores(responseData.data || []);
      setTotalPages(responseData.meta?.last_page || responseData.last_page || 1);
      setTotalRecords(responseData.meta?.total || responseData.total || 0);
    } catch (error) {
      triggerNotification('error', 'No se pudo sincronizar el listado de jugadores.');
    } finally {
      setIsFetching(false);
    }
  }, [currentPage, debouncedSearchTerm, activeTab]);

  useEffect(() => {
    fetchJugadores();
  }, [fetchJugadores]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormErrors({});

    const payload = { ...formData, role: 'jugador' };

    try {
      if (selectedJugador) {
        await api.put(`/users/${selectedJugador.id}`, payload);
        triggerNotification('success', 'Perfil de jugador actualizado.');
      } else {
        await api.post('/users', payload);
        triggerNotification('success', 'Jugador inscrito con éxito en la plataforma.');
      }
      await fetchJugadores();
      setIsDrawerOpen(false);
    } catch (error) {
      if (error.response?.status === 422) {
        setFormErrors(error.response.data.errors);
        triggerNotification('error', 'Verifica los datos del competidor.');
      } else {
        triggerNotification('error', error.response?.data?.message || 'Error al procesar la solicitud.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/users/${jugadorToDelete.id}`);
      triggerNotification('success', 'Inscripción del jugador removida.');
      
      if (jugadores.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        await fetchJugadores();
      }
      setIsDeleteModalOpen(false);
    } catch (error) {
      triggerNotification('error', 'No se pudo dar de baja al jugador.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDrawer = useCallback((jugador = null) => {
    setSelectedJugador(jugador);
    setFormErrors({});
    
    // 🔥 MEJORA: Llenado dinámico de la nueva data si estamos editando
    setFormData(jugador 
      ? { 
          name: jugador.name || '', 
          email: jugador.email || '', 
          password: '', 
          role: 'jugador', 
          status: jugador.status || 'activo',
          gamertag: jugador.gamertag || '',
          id_ea: jugador.id_ea || '',
          plataforma: jugador.plataforma || 'crossplay',
          nacionalidad: jugador.nacionalidad || '',
          posicion: jugador.posicion || '',
          fecha_nacimiento: jugador.fecha_nacimiento ? jugador.fecha_nacimiento.substring(0, 10) : '',
          altura: jugador.altura || '',
          peso: jugador.peso || '',
          telefono: jugador.telefono || ''
        }
      : defaultForm
    );
    setIsDrawerOpen(true);
  }, []);

  const confirmDelete = useCallback((jugador) => {
    setJugadorToDelete(jugador);
    setIsDeleteModalOpen(true);
  }, []);

  return {
    data: { jugadores, totalRecords, currentPage, totalPages, searchTerm, activeTab },
    ui: { notification, isDrawerOpen, isDeleteModalOpen, isFetching, isSaving, isDeleting, selectedJugador, jugadorToDelete },
    form: { formData, setFormData, formErrors },
    actions: { 
      setSearchTerm, setCurrentPage, setActiveTab, setNotification,
      openDrawer, closeDrawer: () => setIsDrawerOpen(false),
      confirmDelete, closeDeleteModal: () => setIsDeleteModalOpen(false),
      handleSave, executeDelete 
    }
  };
};