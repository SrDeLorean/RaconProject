import { useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';
import { useDebounce } from '@/hooks/useDebounce'; // 🔥 Importamos el hook de debounce

export const useMiEquipo = () => {
  const [equipo, setEquipo] = useState(null); 
  const [roster, setRoster] = useState([]);
  const [competencias, setCompetencias] = useState([]);
  const [activeTab, setActiveTab] = useState('roster'); 

  // Dynamic Organization context
  const [organizaciones, setOrganizaciones] = useState([]);
  const [organizacionId, setOrganizacionId] = useState(null);

  // Historial de fichajes/transacciones para el log
  const [historialFichajes, setHistorialFichajes] = useState([]);

  const [notification, setNotification] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); 
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); 
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);

  const defaultForm = { nombre: '', abreviatura: '', descripcion: '', plataforma: 'crossplay', club_id_ea: '', logo: '', banner: '', twitter: '', twitch: '' };
  const [formData, setFormData] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});

  // Buscador de jugadores libres
  const [searchJugadorTerm, setSearchJugadorTerm] = useState('');
  const [jugadoresLibres, setJugadoresLibres] = useState([]);
  
  // 🔥 APLICAMOS DEBOUNCE AL TÉRMINO DE BÚSQUEDA
  const debouncedSearchTerm = useDebounce(searchJugadorTerm, 400);

  const [isFetching, setIsFetching] = useState(true);
  const [isSearching, setIsSearching] = useState(false); // 🔥 Nuevo estado para mostrar "Buscando..."
  const [isSaving, setIsSaving] = useState(false);

  const triggerNotification = (variant, text) => {
    setNotification({ variant, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchMiEquipo = useCallback(async (selectedOrgId = null) => {
    setIsFetching(true);
    try {
      const url = selectedOrgId ? `/mi-equipo?organizacion_id=${selectedOrgId}` : '/mi-equipo';
      const response = await api.get(url);
      const equipoData = response.data.data || response.data; 

      if (equipoData && equipoData.id) {
        setEquipo(equipoData);
        setRoster(equipoData.roster || []);
        setCompetencias(equipoData.competencias || []);
        setOrganizaciones(equipoData.organizaciones || []);
        
        // Si no tenemos una organización activa seleccionada en el estado, tomamos la autodetectada
        if (!selectedOrgId && equipoData.organizacion_activa_id) {
          setOrganizacionId(equipoData.organizacion_activa_id);
        } else if (selectedOrgId) {
          setOrganizacionId(selectedOrgId);
        }

        setFormData({
          nombre: equipoData.nombre || '',
          abreviatura: equipoData.abreviatura || '',
          descripcion: equipoData.descripcion || '',
          plataforma: equipoData.plataforma || 'crossplay',
          club_id_ea: equipoData.club_id_ea || '',
          logo: equipoData.logo || '',
          banner: equipoData.banner || '',
          twitter: equipoData.redes_sociales?.twitter || '',
          twitch: equipoData.redes_sociales?.twitch || ''
        });

        // Obtener historial de transacciones/fichajes para el log
        const historyResponse = await api.get('/solicitudes-fichaje?tipo=enviadas');
        setHistorialFichajes(historyResponse.data?.data || historyResponse.data || []);
      } else {
        setEquipo(null);
      }
    } catch (error) {
      console.error("Error obteniendo mi equipo", error);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchMiEquipo();
  }, [fetchMiEquipo]);

  // 🔥 NUEVA LÓGICA DE BÚSQUEDA AUTOMÁTICA (Controlada por el Debounce e incluyendo organizacion_id)
  const buscarJugadoresLibres = useCallback(async (search, orgId) => {
    if (!search || search.trim() === '') {
      setJugadoresLibres([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await api.post('/usuarios/disponibles', { 
        search,
        organizacion_id: orgId 
      });
      setJugadoresLibres(response.data || []);
    } catch (error) {
      console.error("Error buscando jugadores libres:", error);
      setJugadoresLibres([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Dispara la búsqueda SÓLO cuando el usuario deja de escribir y tenemos la organización de contexto
  useEffect(() => {
    if (organizacionId) {
      buscarJugadoresLibres(debouncedSearchTerm, organizacionId);
    }
  }, [debouncedSearchTerm, organizacionId, buscarJugadoresLibres]);

  const handleSaveEquipo = async (e) => {
    if(e) e.preventDefault();
    setIsSaving(true);
    setFormErrors({});

    const payload = {
      ...formData,
      redes_sociales: { twitter: formData.twitter, twitch: formData.twitch }
    };

    try {
      if (equipo) {
        await api.put(`/equipos/${equipo.id}`, payload);
        triggerNotification('success', 'Identidad del club actualizada correctamente.');
      } else {
        await api.post('/equipos', payload);
        triggerNotification('success', '¡Tu club ha sido fundado de manera oficial!');
      }
      await fetchMiEquipo(organizacionId);
      setIsDrawerOpen(false);
    } catch (error) {
      if (error.response?.status === 422) {
        setFormErrors(error.response.data.errors);
        triggerNotification('error', 'Verifica los campos obligatorios.');
      } else {
        triggerNotification('error', 'Ocurrió un problema con la solicitud.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleFicharJugador = async (userId, datosFichaje) => {
    setIsSaving(true);
    try {
      const response = await api.post(`/solicitudes-fichaje`, { 
        user_id: userId, 
        ...datosFichaje 
      });
      triggerNotification('success', response.data.message || 'Propuesta de fichaje enviada con éxito.');
      setSearchJugadorTerm(''); 
      await fetchMiEquipo(organizacionId);
    } catch (error) {
      triggerNotification('error', error.response?.data?.message || 'No se pudo incorporar al jugador.');
    } finally {
      setIsSaving(false);
    }
  };

  const executeDesvincular = async () => {
    setIsSaving(true);
    try {
      await api.delete(`/equipos/${equipo.id}/roster/${jugadorSeleccionado.id}`, {
        params: { organizacion_id: organizacionId }
      });
      triggerNotification('success', 'El jugador ha sido desvinculado del club en esta organización.');
      await fetchMiEquipo(organizacionId);
      setIsDeleteModalOpen(false);
    } catch (error) {
      triggerNotification('error', 'No se pudo procesar la baja del jugador.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRosterJugador = async (userId, tacticalData) => {
    setIsSaving(true);
    try {
      await api.put(`/equipos/${equipo.id}/roster/${userId}`, {
        organizacion_id: organizacionId,
        ...tacticalData
      });
      triggerNotification('success', 'Ficha táctica del jugador actualizada.');
      await fetchMiEquipo(organizacionId);
    } catch (error) {
      triggerNotification('error', error.response?.data?.message || 'No se pudo actualizar la ficha táctica.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInscribirCompetencia = async (competenciaId) => {
    try {
      await api.post(`/equipos/${equipo.id}/inscripciones`, { competencia_id: competenciaId });
      triggerNotification('success', '¡Inscripción completada para el próximo torneo!');
      await fetchMiEquipo(organizacionId);
    } catch (error) {
      triggerNotification('error', error.response?.data?.message || 'Error en la inscripción.');
    }
  };

  const selectOrganizacion = (id) => {
    setOrganizacionId(id);
    fetchMiEquipo(id);
  };

  return {
    data: { equipo, roster, competencias, activeTab, jugadoresLibres, searchJugadorTerm, organizaciones, organizacionId, historialFichajes },
    ui: { notification, isDrawerOpen, isDeleteModalOpen, isFetching, isSearching, isSaving, jugadorSeleccionado },
    form: { formData, setFormData, formErrors },
    actions: {
      setActiveTab, setSearchJugadorTerm, selectOrganizacion,
      openCrearOEditar: () => { setFormErrors({}); setIsDrawerOpen(true); },
      closeDrawer: () => setIsDrawerOpen(false),
      openDesvincular: (jugador) => { setJugadorSeleccionado(jugador); setIsDeleteModalOpen(true); },
      closeDeleteModal: () => setIsDeleteModalOpen(false),
      handleSaveEquipo, handleFicharJugador, executeDesvincular, handleInscribirCompetencia, handleUpdateRosterJugador
    }
  };
};