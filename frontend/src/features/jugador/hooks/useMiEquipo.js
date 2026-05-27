import { useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';

export const useMiEquipo = () => {
  const [equipo, setEquipo] = useState(null); // null significa que no tiene equipo creado
  const [roster, setRoster] = useState([]);
  const [competencias, setCompetencias] = useState([]);
  const [activeTab, setActiveTab] = useState('roster'); // roster, competencias, configuracion

  const [notification, setNotification] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Para fichar o editar config
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Para dar de baja un jugador
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);

  // Formulario híbrido: Sirve para crear el equipo o actualizarlo
  const defaultForm = { nombre: '', abreviatura: '', descripcion: '', plataforma: 'crossplay', twitter: '', twitch: '' };
  const [formData, setFormData] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});

  // Buscador de jugadores libres para el roster
  const [searchJugadorTerm, setSearchJugadorTerm] = useState('');
  const [jugadoresLibres, setJugadoresLibres] = useState([]);

  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const triggerNotification = (variant, text) => {
    setNotification({ variant, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // Obtener el equipo del usuario autenticado
  const fetchMiEquipo = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await api.get('/mi-equipo');
      
      // Verificamos si existe response.data.data (lo que envía Laravel Resource)
      const equipo = response.data.data || response.data; 

      if (equipo && equipo.id) {
        setEquipo(equipo);
        setRoster(equipo.roster || []);
        setCompetencias(equipo.competencias || []);
        
        setFormData({
          nombre: equipo.nombre || '',
          // ... resto de campos
        });
      } else {
        setEquipo(null);
      }
    } catch (error) {
       // ...
    } finally {
      setIsFetching(false);
    }
}, []);

  useEffect(() => {
    fetchMiEquipo();
  }, [fetchMiEquipo]);

  // Buscar jugadores sin equipo para poder ficharlos
  const buscarJugadoresLibres = async (search) => {
    if (!search) return setJugadoresLibres([]);
    try {
      const response = await api.get('/users/disponibles', { params: { search } });
      setJugadoresLibres(response.data || []);
    } catch (error) {
      console.error("Error buscando jugadores libres");
    }
  };

  // Guardar (Crear o Editar Club)
  const handleSaveEquipo = async (e) => {
    e.preventDefault();
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
      await fetchMiEquipo();
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Error guardando el equipo:", error);
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

  // Fichar un jugador y meterlo al Roster
  const handleFicharJugador = async (userId, datosFichaje) => {
    setIsSaving(true);
    try {
      await api.post(`/equipos/${equipo.id}/roster`, { user_id: userId, ...datosFichaje });
      triggerNotification('success', 'Contratación registrada. El jugador se unió al roster.');
      await fetchMiEquipo();
      setIsDrawerOpen(false);
    } catch (error) {
      triggerNotification('error', error.response?.data?.message || 'No se pudo incorporar al jugador.');
    } finally {
      setIsSaving(false);
    }
  };

  // Expulsar o dar de baja a un jugador del roster
  const executeDesvincular = async () => {
    setIsSaving(true);
    try {
      await api.delete(`/equipos/${equipo.id}/roster/${jugadorSeleccionado.id}`);
      triggerNotification('success', 'El jugador ha sido desvinculado del club.');
      await fetchMiEquipo();
      setIsDeleteModalOpen(false);
    } catch (error) {
      triggerNotification('error', 'No se pudo procesar la baja del jugador.');
    } finally {
      setIsSaving(false);
    }
  };

  // Inscribir al equipo en una competencia disponible
  const handleInscribirCompetencia = async (competenciaId) => {
    try {
      await api.post(`/equipos/${equipo.id}/inscripciones`, { competencia_id: competenciaId });
      triggerNotification('success', '¡Inscripción completada para el próximo torneo!');
      await fetchMiEquipo();
    } catch (error) {
      triggerNotification('error', error.response?.data?.message || 'Error en la inscripción.');
    }
  };

  return {
    data: { equipo, roster, competencias, activeTab, jugadoresLibres, searchJugadorTerm },
    ui: { notification, isDrawerOpen, isDeleteModalOpen, isFetching, isSaving, jugadorSeleccionado },
    form: { formData, setFormData, formErrors },
    actions: {
      setActiveTab, setSearchJugadorTerm, buscarJugadoresLibres,
      openCrearOEditar: () => { setFormErrors({}); setIsDrawerOpen(true); },
      closeDrawer: () => setIsDrawerOpen(false),
      openDesvincular: (jugador) => { setJugadorSeleccionado(jugador); setIsDeleteModalOpen(true); },
      closeDeleteModal: () => setIsDeleteModalOpen(false),
      handleSaveEquipo, handleFicharJugador, executeDesvincular, handleInscribirCompetencia
    }
  };
};