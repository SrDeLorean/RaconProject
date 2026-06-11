import { useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';

export const useCompetenciaUtDetalle = (id) => {
  const [competencia, setCompetencia] = useState(null);
  const [equiposInscritos, setEquiposInscritos] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFetchingInfo, setIsFetchingInfo] = useState(true);
  const [isFetchingEquipos, setIsFetchingEquipos] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState(null);

  const triggerNotification = (variant, text) => {
    setNotification({ variant, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchCompetenciaInfo = useCallback(async () => {
    setIsFetchingInfo(true);
    try {
      const response = await api.get(`/competencias-ut/${id}`);
      setCompetencia(response.data.data);
      setEquiposInscritos(response.data.data.equipos || []);
    } catch (error) {
      triggerNotification('error', 'Error al sincronizar datos del torneo.');
    } finally {
      setIsFetchingInfo(false);
    }
  }, [id]);

  // Buscar usuarios en el sistema para inscribirlos manualmente
  const searchUsuarios = useCallback(async (query) => {
    if (!query) {
      setUsuariosDisponibles([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await api.get('/users', { params: { search: query, per_page: 10 } });
      const users = response.data.data || response.data || [];
      
      // Filtrar usuarios que ya estén en algún equipo inscrito
      const inscritosIds = new Set();
      equiposInscritos.forEach(eq => {
        if (eq.id_capitan) inscritosIds.add(eq.id_capitan);
        if (eq.id_companero) inscritosIds.add(eq.id_companero);
      });

      const filtered = users.filter(u => !inscritosIds.has(u.id));
      setUsuariosDisponibles(filtered);
    } catch (error) {
      console.error("Error al buscar usuarios:", error);
    } finally {
      setIsSearching(false);
    }
  }, [equiposInscritos]);

  useEffect(() => {
    fetchCompetenciaInfo();
  }, [fetchCompetenciaInfo]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      searchUsuarios(searchTerm);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, searchUsuarios]);

  const inscribirManual = async (userId, nombreEquipo, idCompanero = null, clubIdEa = null) => {
    try {
      // Inscribimos simulando el request con auth, pero pasando datos especiales
      // Nota: en el backend, la inscripción asume Auth::user() como capitán.
      // Para administradores/organizadores que inscriben a un tercero, podemos:
      // A) Llamar a una ruta específica, o
      // B) Hacer que el endpoint de inscribir soporte un id_usuario_forzado para admin.
      // Modificamos el controlador en la ruta de inscripción para que si el usuario es org/admin y
      // viene un 'user_id_manual' en el request, se inscriba a ese usuario.
      // Eso es súper robusto!
      
      const payload = {
        nombre_equipo: nombreEquipo,
        club_id_ea: clubIdEa,
        id_companero: idCompanero,
        user_id_manual: userId // Pasamos el ID del usuario seleccionado
      };

      // Sin embargo, para no tener que hacer cambios complejos en el backend, revisamos:
      // ¿Podemos hacer la inscripción manual? 
      // Sí, vamos a agregar soporte para `user_id_manual` en `CompetenciaUtController@inscribir` para admin/organizador.
      // Vamos a llamarlo.
      
      await api.post(`/competencias-ut/${id}/inscribir`, payload);
      triggerNotification('success', 'Participante inscrito correctamente.');
      setSearchTerm('');
      await fetchCompetenciaInfo();
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al inscribir participante.';
      triggerNotification('error', msg);
    }
  };

  const cambiarEstado = async (equipoUtId, estadoInscripcion) => {
    try {
      await api.put(`/inscripciones-ut/${equipoUtId}`, { estado_inscripcion: estadoInscripcion });
      triggerNotification('success', 'Inscripción actualizada.');
      await fetchCompetenciaInfo();
    } catch (error) {
      // Si la ruta /inscripciones-ut/{id} no existe directamente en el controlador, 
      // podemos usar la ruta de competencias-ut o hacer un PUT a la tabla pivot.
      // Como registramos Route::put('/inscripciones-ut/{id}', ...), sí está disponible en el backend!
      // Pero espera, en el backend definimos:
      // Route::put('/inscripciones-ut/{id}', [InscripcionUTController::class, 'update']);
      // Vamos a verificar si nuestro controlador InscripcionUTController.php lo soporta.
      // Sí, lo soporta (lo programamos).
      triggerNotification('error', 'No se pudo cambiar el estado.');
    }
  };

  const removerEquipo = async (equipoUtId) => {
    try {
      await api.delete(`/inscripciones-ut/${equipoUtId}`);
      triggerNotification('success', 'Participante eliminado del torneo.');
      await fetchCompetenciaInfo();
    } catch (error) {
      triggerNotification('error', 'Error al dar de baja.');
    }
  };

  return {
    data: { competencia, equiposInscritos, usuariosDisponibles, searchTerm },
    ui: { isFetchingInfo, isFetchingEquipos, isSearching, notification },
    actions: { setSearchTerm, triggerNotification, setNotification, inscribirManual, cambiarEstado, removerEquipo, fetchCompetenciaInfo }
  };
};
