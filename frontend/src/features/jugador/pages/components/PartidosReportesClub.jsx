import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/shared/Alert';
import DataTable from '@/components/ui/DataTable';
import CrudHeader from '@/components/shared/CrudHeader';
import Card from '@/components/shared/Card';
import api from '@/api/axios';
import Modal from '@/components/ui/Modal';
import ImageUploader from '@/components/ui/ImageUploader';


export default function PartidosReportesClub({ equipo, roster }) {
  const navigate = useNavigate();
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filtros y Paginación
  const [activeTab, setActiveTab] = useState('pendiente'); // 'todos' | 'por_reportar' | 'pendiente' | 'finalizado'
  const [selectedTemporada, setSelectedTemporada] = useState('todos');
  const [selectedCompetencia, setSelectedCompetencia] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // EA Reporting System States
  const [reportMethod, setReportMethod] = useState('ea'); // 'ea' | 'manual'
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  
  // EA API States
  const [eaMatches, setEaMatches] = useState([]);
  const [eaLoading, setEaLoading] = useState(false);
  const [eaError, setEaError] = useState(null);
  const [selectedEaMatchId, setSelectedEaMatchId] = useState('');
  const [eaClubLocalId, setEaClubLocalId] = useState('');
  const [eaClubVisitanteId, setEaClubVisitanteId] = useState('');
  const [eaProcessing, setEaProcessing] = useState(false);
  const [eaAlertEmpate, setEaAlertEmpate] = useState(false);
  const [eaWarnings, setEaWarnings] = useState(null);
  const [eaMismatchModal, setEaMismatchModal] = useState(null);


  // Manual Input States
  const [statsScoreLocal, setStatsScoreLocal] = useState('');
  const [statsScoreVisitante, setStatsScoreVisitante] = useState('');
  const [teamLocalStats, setTeamLocalStats] = useState({ shots: 10, possession: 50, corners: 4, fouls: 5 });
  const [teamVisitanteStats, setTeamVisitanteStats] = useState({ shots: 10, possession: 50, corners: 4, fouls: 5 });
  const [playerStats, setPlayerStats] = useState([]);
  const [manualProcessing, setManualProcessing] = useState(false);

  // Nuevas capturas de reporte manual (empates y normal)
  const [fotoPartido, setFotoPartido] = useState('');
  const [fotoJugadores, setFotoJugadores] = useState('');
  const [fotoConectados, setFotoConectados] = useState('');
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, variant: 'neutral', message: '', title: '' });

  const showAlert = (message, variant = 'error', title = 'Aviso del Sistema') => {
      setAlertConfig({ isOpen: true, variant, message, title });
  };

  // Estadísticas del propio equipo para reporte manual
  const [teamManualStats, setTeamManualStats] = useState({
    goles_favor: 0,
    goles_en_contra: 0,
    asistencias: 0,
    tiros: 0,
    pases_intentados: 0,
    precision_pases: 0,
    entradas_intentadas: 0,
    entradas_exitosas: 0,
    tarjetas_rojas: 0,
    tarjetas_amarillas: 0,
    atajadas: 0,
    posesion: 0,
    recuperaciones: 0,
    fueras_lugar: 0,
    tiros_esquina: 0,
    tiros_libres: 0,
    penales: 0,
    faltas_cometidas: 0,
    precision_tiros: 0,
    tasa_exito_regates: 0
  });

  const isDraw = statsScoreLocal !== '' && statsScoreVisitante !== '' && Number(statsScoreLocal) === Number(statsScoreVisitante);

  // IA Vision
  const [visionTeamStatsImg, setVisionTeamStatsImg] = useState(null);
  const [visionPlayerStatsImg, setVisionPlayerStatsImg] = useState(null);
  const [visionProcessing, setVisionProcessing] = useState(false);
  const [uploadingTeam, setUploadingTeam] = useState(false);
  const [uploadingPlayer, setUploadingPlayer] = useState(false);

  const handleImageUpload = async (e, setter, type) => {
    const file = e.target.files[0];
    if (file) {
      // 1. Convert to base64 for IA extraction
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result);
      };
      reader.readAsDataURL(file);

      // 2. Upload file to server in background to satisfy screenshot requirements
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'reportes');

      if (type === 'team') setUploadingTeam(true);
      if (type === 'player') setUploadingPlayer(true);

      try {
        const response = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        if (response.data && response.data.url) {
          if (type === 'team') {
            setFotoPartido(response.data.url);
          } else if (type === 'player') {
            setFotoJugadores(response.data.url);
          }
        }
      } catch (err) {
        console.error("Error al subir archivo de respaldo de IA:", err);
      } finally {
        if (type === 'team') setUploadingTeam(false);
        if (type === 'player') setUploadingPlayer(false);
      }
    }
  };

  const handleVisionExtract = async () => {
    if (!visionTeamStatsImg || !visionPlayerStatsImg) {
      showAlert("⚠️ Sube ambas fotos primero (Stats de Equipo y Rendimiento).", "warning");
      return;
    }
    setVisionProcessing(true);
    try {
      const res = await api.post('/partidos/extract-vision', {
        team_stats_image: visionTeamStatsImg,
        player_stats_image: visionPlayerStatsImg
      });
      if (res.data && res.data.data) {
        const data = res.data.data;
        const miNombre = equipo.nombre.toLowerCase();
        const isLocal = selectedMatch.equipo_local_id === equipo.id;
        let misStats = null;
        let statsLocal = null;
        let statsVisitante = null;

        if (data.equipo_1?.nombre?.toLowerCase()?.includes(miNombre)) {
            misStats = data.equipo_1;
            if (isLocal) {
                statsLocal = data.equipo_1?.goles || 0;
                statsVisitante = data.equipo_2?.goles || 0;
            } else {
                statsVisitante = data.equipo_1?.goles || 0;
                statsLocal = data.equipo_2?.goles || 0;
            }
        } else if (data.equipo_2?.nombre?.toLowerCase()?.includes(miNombre)) {
            misStats = data.equipo_2;
            if (isLocal) {
                statsLocal = data.equipo_2?.goles || 0;
                statsVisitante = data.equipo_1?.goles || 0;
            } else {
                statsVisitante = data.equipo_2?.goles || 0;
                statsLocal = data.equipo_1?.goles || 0;
            }
        } else {
            misStats = data.equipo_1;
            statsLocal = data.equipo_1?.goles || 0;
            statsVisitante = data.equipo_2?.goles || 0;
        }

        setStatsScoreLocal(statsLocal);
        setStatsScoreVisitante(statsVisitante);

        if (misStats) {
           setTeamManualStats({
              ...teamManualStats,
              goles_favor: misStats.goles || 0,
              goles_en_contra: data.equipo_1?.goles === misStats.goles ? (data.equipo_2?.goles || 0) : (data.equipo_1?.goles || 0),
              tiros: misStats.tiros || 0,
              pases_intentados: misStats.pases || 0,
              entradas_intentadas: misStats.entradas || 0,
              posesion: misStats.posesion || 0,
              recuperaciones: misStats.recuperaciones || 0,
              fueras_lugar: misStats.fueras_lugar || 0,
              tiros_esquina: misStats.tiros_esquina || 0,
              tiros_libres: misStats.tiros_libres || 0,
              penales: misStats.penales || 0,
              faltas_cometidas: misStats.faltas_cometidas || 0,
              precision_tiros: misStats.precision_tiros || 0,
              tasa_exito_regates: misStats.tasa_exito_regates || 0,
              tarjetas_amarillas: misStats.tarjetas_amarillas || 0,
              tarjetas_rojas: misStats.tarjetas_rojas || 0,
              precision_pases: misStats.precision_pases || 0,
              entradas_exitosas: misStats.entradas_exitosas || 0,
              atajadas: misStats.atajadas || 0,
              asistencias: misStats.asistencias || 0,
           });
        }
        
        if (data.jugadores && Array.isArray(data.jugadores)) {
             const updated = [...playerStats];
             
             const normalize = (str) => str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim() : "";

             data.jugadores.forEach(extractedPlayer => {
                const normExt = normalize(extractedPlayer.nombre);
                
                const matchedIdx = updated.findIndex(p => {
                   const normGamertag = normalize(p.name);
                   if (normGamertag && (normGamertag.includes(normExt) || normExt.includes(normGamertag))) return true;
                   return false;
                });
                if (matchedIdx !== -1) {
                   updated[matchedIdx].goles = extractedPlayer.goles || 0;
                   updated[matchedIdx].asistencias = extractedPlayer.asistencias || 0;
                   updated[matchedIdx].valoracion = extractedPlayer.valoracion || 0;
                   updated[matchedIdx].yellowCard = extractedPlayer.tarjetas_amarillas > 0;
                   updated[matchedIdx].redCard = extractedPlayer.tarjetas_rojas > 0;
                   updated[matchedIdx].jugo = true;
                }
             });
             setPlayerStats(updated);
        }
        showAlert("✨ Estadísticas extraídas con IA. Por favor revisa y corrige si es necesario antes de enviar.", "success", "Extracción Exitosa");
      }
    } catch (err) {
        const errorMsg = err.response?.data?.message || err.message;
        if (errorMsg.includes('503') || err.response?.status === 503) {
          showAlert("⚠️ Actualmente los servidores externos de Inteligencia Artificial (Google Gemini) se encuentran saturados debido a una alta demanda global.\n\nEste no es un error de la aplicación, por favor inténtalo de nuevo en unos minutos.", "warning", "Servidores IA Saturados");
        } else {
          showAlert("❌ Error al extraer estadísticas con IA: " + errorMsg, "error", "Error de Extracción");
        }
      } finally {
      setVisionProcessing(false);
    }
  };

  useEffect(() => {
    if (isDraw) {
      setReportMethod('manual');
    }
  }, [isDraw]);

  // Cargar Partidos
  const fetchPartidos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/partidos?equipo_id=${equipo.id}`);
      setPartidos(res.data || []);
    } catch (err) {
      console.error("Error al obtener partidos del club:", err);
      setError("No se pudieron obtener los partidos oficiales del club.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (equipo?.id) {
      fetchPartidos();
    }
  }, [equipo?.id]);

  // Tabs de CrudHeader
  const tabsConfig = useMemo(() => [
    { id: 'todos', label: 'Todos los Partidos', icon: '🏟️' },
    { id: 'por_reportar', label: 'Por Reportar', icon: '🚨' },
    { id: 'pendiente', label: 'Pendientes / Calendario', icon: '⏳' },
    { id: 'en_revision', label: 'En Revisión', icon: '🔍' },
    { id: 'finalizado', label: 'Finalizados / Reportes', icon: '🟢' },
  ], []);

  // Obtener temporadas únicas a partir de los partidos cargados
  const temporadasDisponibles = useMemo(() => {
    const map = new Map();
    partidos.forEach(p => {
      const temp = p.competencia?.temporada;
      if (temp && !map.has(temp.id)) {
        map.set(temp.id, temp);
      }
    });
    return Array.from(map.values());
  }, [partidos]);

  // Obtener competencias filtradas por temporada
  const competenciasFiltradas = useMemo(() => {
    const map = new Map();
    partidos.forEach(p => {
      const comp = p.competencia;
      if (comp && !map.has(comp.id)) {
        if (selectedTemporada !== 'todos' && comp.temporada_id !== Number(selectedTemporada)) {
          return;
        }
        map.set(comp.id, comp);
      }
    });
    return Array.from(map.values());
  }, [partidos, selectedTemporada]);

  // Filtrar según Pestaña seleccionada, dropdowns y término de búsqueda
  const filteredData = useMemo(() => {
    return partidos.filter(p => {
      // Filtro de Pestaña
      const yaReportado = p.goles_local !== null && p.goles_visitante !== null;
      const isLocal = p.equipo_local_id === equipo?.id;
      const yaReportadoPorMi = (isLocal && p.reporte_local_completado) || (!isLocal && p.reporte_visitante_completado);

      // Pestaña: En Revisión
      if (activeTab === 'en_revision') {
        if (yaReportado) return false;
        if (!yaReportadoPorMi) return false;
      }

      // Pestaña: Finalizados
      if (activeTab === 'finalizado') {
        if (!yaReportado) return false;
      }

      // Pestaña: Pendientes / Calendario
      if (activeTab === 'pendiente') {
        if (yaReportado) return false;
        if (yaReportadoPorMi) return false;
      }

      // Pestaña: Por Reportar
      if (activeTab === 'por_reportar') {
        if (yaReportado) return false;
        if (yaReportadoPorMi) return false;
        if (!p.fecha) return false;
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        if (p.fecha > todayStr) return false;
      }

      // Filtro de Temporada
      if (selectedTemporada !== 'todos' && p.competencia?.temporada_id !== Number(selectedTemporada)) {
        return false;
      }

      // Filtro de Competencia
      if (selectedCompetencia !== 'todos' && p.competencia_id !== Number(selectedCompetencia)) {
        return false;
      }

      // Filtro de Búsqueda
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const localNom = p.local?.nombre?.toLowerCase() || '';
      const visitNom = p.visitante?.nombre?.toLowerCase() || '';
      const compNom = p.competencia?.nombre?.toLowerCase() || '';
      const jornadaNom = p.jornada?.toLowerCase() || '';

      return localNom.includes(q) || visitNom.includes(q) || compNom.includes(q) || jornadaNom.includes(q);
    });
  }, [partidos, activeTab, selectedTemporada, selectedCompetencia, searchTerm, equipo]);

  // Paginación manual en el cliente
  const paginatedData = useMemo(() => {
    const offset = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(offset, offset + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Abrir Modal de Reporte
  const openReportModal = async (match) => {
    setSelectedMatch(match);
    setStatsScoreLocal('');
    setStatsScoreVisitante('');
    setFotoPartido('');
    setFotoJugadores('');
    setFotoConectados('');
    setEaMatches([]);
    setEaError(null);
    setSelectedEaMatchId('');
    setEaClubLocalId('');
    setEaClubVisitanteId('');
    setEaAlertEmpate(false);
    setEaWarnings(null);

    // Si ya existe reporte parcial del equipo en la base de datos, lo pre-cargamos
    const isLocal = match.equipo_local_id === equipo.id;
    const existingReport = isLocal ? match.reporte_local_stats : match.reporte_visitante_stats;

    if (existingReport) {
      setStatsScoreLocal(String(existingReport.goles_local || 0));
      setStatsScoreVisitante(String(existingReport.goles_visitante || 0));
      if (existingReport.fotos) {
        setFotoPartido(existingReport.fotos.partido || '');
        setFotoJugadores(existingReport.fotos.jugadores || '');
        setFotoConectados(existingReport.fotos.conectados || '');
      }
      if (existingReport.team_stats) {
        setTeamManualStats({
          goles_favor: existingReport.team_stats.goles_favor || 0,
          goles_en_contra: existingReport.team_stats.goles_en_contra || 0,
          asistencias: existingReport.team_stats.asistencias || 0,
          tiros: existingReport.team_stats.tiros || 0,
          pases_intentados: existingReport.team_stats.pases_intentados || 0,
          precision_pases: existingReport.team_stats.precision_pases || 0,
          entradas_intentadas: existingReport.team_stats.entradas_intentadas || 0,
          entradas_exitosas: existingReport.team_stats.entradas_exitosas || 0,
          tarjetas_rojas: existingReport.team_stats.tarjetas_rojas || 0,
          tarjetas_amarillas: existingReport.team_stats.tarjetas_amarillas || 0,
          atajadas: existingReport.team_stats.atajadas || 0
        });
      }
      if (existingReport.player_stats) {
        setPlayerStats(existingReport.player_stats.map(p => ({ ...p, jugo: true })));
      }
    } else {
      setTeamManualStats({
        goles_favor: 0,
        goles_en_contra: 0,
        asistencias: 0,
        tiros: 0,
        pases_intentados: 0,
        precision_pases: 0,
        entradas_intentadas: 0,
        entradas_exitosas: 0,
        tarjetas_rojas: 0,
        tarjetas_amarillas: 0,
        atajadas: 0,
        posesion: 0,
        recuperaciones: 0,
        fueras_lugar: 0,
        tiros_esquina: 0,
        tiros_libres: 0,
        penales: 0,
        faltas_cometidas: 0,
        precision_tiros: 0,
        tasa_exito_regates: 0
      });

      // Inicializar estadísticas manuales vacías de jugadores
      const mappedPlayers = roster.map(member => {
        const userObj = member.usuario || member;
        return {
          jugador_id: userObj.id,
          name: userObj.gamertag || userObj.name || 'Jugador',
          valoracion: 6.0,
          goles: 0,
          asistencias: 0,
          pases: 0,
          yellowCard: false,
          redCard: false,
          jugo: false
        };
      });
      setPlayerStats(mappedPlayers);
    }

    // Si el partido ya tiene goles (empate o reporte manual previo)
    const goalsL = match.goles_local;
    const goalsV = match.goles_visitante;
    const isEmpatePre = goalsL !== null && goalsV !== null && Number(goalsL) === Number(goalsV);
    
    if (isEmpatePre) {
      setReportMethod('manual');
    } else {
      setReportMethod('ea');
    }

    setIsStatsModalOpen(true);

    // Intentar pre-cargar partidos de EA
    setEaLoading(true);
    try {
      const res = await api.get(`/partidos/${match.id}/ea-matches`);
      if (res.data && res.data.partidosEA) {
        setEaMatches(res.data.partidosEA);
        
        // Auto-detectar los club IDs de EA
        const localClubEaId = match.local?.club_id_ea;
        const visitClubEaId = match.visitante?.club_id_ea;
        if (localClubEaId) setEaClubLocalId(String(localClubEaId));
        if (visitClubEaId) setEaClubVisitanteId(String(visitClubEaId));
      }
    } catch (err) {
      console.warn("No se pudieron obtener los partidos de EA:", err);
      setEaError(err.response?.data?.message || "No se pudo conectar a la API de EA. Asegúrate de configurar los IDs de Club de EA en la Oficina del Club.");
    } finally {
      setEaLoading(false);
    }
  };

  // Enviar Reporte de EA Sports API
  const handleEaReportSubmit = async (forceReport = false) => {
    if (!selectedEaMatchId || !eaClubLocalId || !eaClubVisitanteId) {
      showAlert("⚠️ Selecciona un partido de EA y confirma los IDs de Club.", "warning");
      return;
    }

    // Doble chequeo de seguridad
    const dbLocalEaId = String(selectedMatch.local?.club_id_ea || '').trim();
    const dbVisitEaId = String(selectedMatch.visitante?.club_id_ea || '').trim();
    const idLocalMap = String(eaClubLocalId).trim();
    const idVisitMap = String(eaClubVisitanteId).trim();

    const matchContainsLocal = idLocalMap === dbLocalEaId || idVisitMap === dbLocalEaId;
    const matchContainsVisit = idLocalMap === dbVisitEaId || idVisitMap === dbVisitEaId;

    if (!matchContainsLocal || !matchContainsVisit) {
      const matchObj = eaMatches.find(m => m.matchId === selectedEaMatchId);
      const keys = matchObj && matchObj.clubs ? Object.keys(matchObj.clubs) : [];
      const clubA = keys[0] ? (matchObj.clubs[keys[0]]?.details?.name || 'Club A') : 'Desconocido';
      const clubB = keys[1] ? (matchObj.clubs[keys[1]]?.details?.name || 'Club B') : 'Desconocido';

      setEaMismatchModal({
        expectedLocal: selectedMatch.local?.nombre || 'Local Oficial',
        expectedVisitante: selectedMatch.visitante?.nombre || 'Visitante Oficial',
        expectedLocalId: dbLocalEaId,
        expectedVisitanteId: dbVisitEaId,
        receivedLocal: clubA,
        receivedVisitante: clubB,
        receivedLocalId: idLocalMap,
        receivedVisitanteId: idVisitMap,
      });
      return;
    }


    setEaProcessing(true);
    setEaWarnings(null);
    try {
      const res = await api.post(`/partidos/${selectedMatch.id}/ea-report`, {
        ea_match_id: selectedEaMatchId,
        club_local_id: eaClubLocalId,
        club_visitante_id: eaClubVisitanteId,
        force: forceReport
      });

      if (res.data && res.data.success) {
        setSuccessMsg("🎉 ¡Partido reportado exitosamente con datos de la API de EA Sports!");
        setIsStatsModalOpen(false);
        fetchPartidos();
      }
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.code === 'VALIDATION_WARNING') {
        setEaWarnings(err.response.data.players);
      } else {
        showAlert("❌ Error al procesar reporte de EA: " + (err.response?.data?.message || err.message), "error");
      }
    } finally {
      setEaProcessing(false);
    }
  };

  // Enviar Reporte Manual
  const handleManualReportSubmit = async (e) => {
    e.preventDefault();

    if (statsScoreLocal === '' || statsScoreVisitante === '') {
      showAlert("⚠️ Por favor ingresa los goles del partido.", "warning");
      return;
    }

    if (!fotoPartido || !fotoJugadores || !fotoConectados) {
      showAlert("⚠️ Es obligatorio subir las 3 fotos (Estadísticas del partido, Estadísticas del jugador, y Jugadores conectados) para completar el reporte.", "warning", "Fotos Incompletas");
      return;
    }

    setManualProcessing(true);
    try {
      const isLocal = selectedMatch.equipo_local_id === equipo.id;
      const statsDisabled = selectedMatch.competencia?.config?.sin_transferencias === true;
      const res = await api.post(`/partidos/${selectedMatch.id}/manual-report`, {
        goles_local: Number(statsScoreLocal),
        goles_visitante: Number(statsScoreVisitante),
        fotos: {
          partido: fotoPartido,
          jugadores: fotoJugadores,
          conectados: fotoConectados
        },
        team_stats: teamManualStats,
        player_stats: statsDisabled ? [] : playerStats.filter(p => p.jugo),
        side: isLocal ? 'local' : 'visitante'
      });

      if (res.data) {
        setSuccessMsg("🎉 ¡Reporte manual unificado enviado con éxito! Pendiente de confirmación del organizador.");
        setIsStatsModalOpen(false);
        fetchPartidos();
      }
    } catch (err) {
      showAlert("❌ Error al enviar el reporte manual: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setManualProcessing(false);
    }
  };

  // Columnas para DataTable
  const columnas = useMemo(() => [
    {
      header: 'Partido / Encuentro',
      render: (row) => {
        const backendBaseUrl = api.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:8000';
        return (
          <div className="flex items-center gap-2">
            {row.local?.logo ? (
              <img 
                src={row.local.logo.startsWith('http') ? row.local.logo : `${backendBaseUrl}${row.local.logo}`} 
                alt="" 
                className="w-6 h-6 rounded object-cover border border-border/40 bg-card shrink-0" 
              />
            ) : (
              <Badge variant="neutral" className="font-mono">{row.local?.abreviatura || 'LOC'}</Badge>
            )}
            <span className="font-bold text-foreground text-xs uppercase truncate max-w-[120px]">{row.local?.nombre || 'TBD'}</span>
            <span className="text-primary font-black font-mono px-2 py-0.5 rounded bg-muted/40 text-xs shrink-0 mx-1">
              {row.goles_local !== null && row.goles_visitante !== null ? `${row.goles_local} - ${row.goles_visitante}` : 'VS'}
            </span>
            <span className="font-bold text-foreground text-xs uppercase truncate max-w-[120px]">{row.visitante?.nombre || 'TBD'}</span>
            {row.visitante?.logo ? (
              <img 
                src={row.visitante.logo.startsWith('http') ? row.visitante.logo : `${backendBaseUrl}${row.visitante.logo}`} 
                alt="" 
                className="w-6 h-6 rounded object-cover border border-border/40 bg-card shrink-0" 
              />
            ) : (
              <Badge variant="neutral" className="font-mono">{row.visitante?.abreviatura || 'VIS'}</Badge>
            )}
          </div>
        );
      }
    },
    {
      header: 'Torneo / Competencia',
      render: (row) => (
        <span className="text-xs font-bold text-foreground uppercase truncate max-w-[150px]">
          🏆 {row.competencia?.nombre || 'Competencia'}
        </span>
      )
    },
    {
      header: 'Jornada',
      render: (row) => (
        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">
          {row.jornada} {row.grupo ? `• Grupo ${row.grupo}` : ''}
        </span>
      )
    },
    {
      header: 'Fecha y Hora',
      render: (row) => (
        <div className="flex flex-col text-[10px] font-mono text-muted-foreground">
          <span>📅 {row.fecha || 'Sin fecha'}</span>
          <span>🕒 {row.hora || '22:00'}</span>
        </div>
      )
    },
    {
      header: 'Estado',
      render: (row) => {
        const yaRep = row.goles_local !== null && row.goles_visitante !== null;
        const yaReportadoPorMi = (row.equipo_local_id === equipo.id && row.reporte_local_completado) || (row.equipo_visitante_id === equipo.id && row.reporte_visitante_completado);
        if (yaRep) {
          return <Badge variant="success">Finalizado</Badge>;
        }
        if (yaReportadoPorMi) {
          return (
            <Badge variant="primary" className="border border-blue-500/20 bg-blue-500/10 text-blue-400">
              En Revisión
            </Badge>
          );
        }
        return <Badge variant="warning">Pendiente</Badge>;
      }
    },
    {
      header: 'Acciones',
      render: (row) => {
        const yaRep = row.goles_local !== null && row.goles_visitante !== null;
        const yaReportadoPorMi = (row.equipo_local_id === equipo.id && row.reporte_local_completado) || (row.equipo_visitante_id === equipo.id && row.reporte_visitante_completado);
        return (
          <div className="flex items-center gap-2">
            {yaRep ? (
              <Button
                size="sm"
                disabled
                className="h-8 px-3 text-[10px] bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 font-display font-black uppercase tracking-wider cursor-not-allowed whitespace-nowrap shrink-0"
              >
                ✅ Finalizado
              </Button>
            ) : yaReportadoPorMi ? (
              <Button
                size="sm"
                disabled
                className="h-8 px-3 text-[10px] bg-blue-600/10 text-blue-400 border border-blue-500/20 font-display font-black uppercase tracking-wider cursor-not-allowed whitespace-nowrap shrink-0 animate-pulse"
              >
                ⏳ En Revisión
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => openReportModal(row)}
                className="h-8 px-3 text-[10px] bg-gradient-to-r from-primary to-destructive text-primary-foreground border-none font-display font-black uppercase tracking-wider shadow-md whitespace-nowrap shrink-0"
              >
                🛡️ Ficha / Reportar
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => navigate(`/partidos/${row.id}`)}
              className={`h-8 px-3 text-[10px] font-display font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-1 transition-all whitespace-nowrap shrink-0 border border-border/45 ${
                yaRep 
                  ? 'bg-sky-600/15 hover:bg-sky-600 text-sky-400 hover:text-white border-sky-500/30' 
                  : 'bg-card/60 hover:bg-muted text-foreground'
              }`}
            >
              📊 {yaRep ? 'Ver Reporte' : 'Ver Previa'}
            </Button>
          </div>
        );
      }
    }
  ], [navigate, equipo]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative">
      
      {successMsg && (
        <Alert variant="success" className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {error && (
        <Alert variant="error" className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <CrudHeader 
        title="Calendario y Reporte de Partidos"
        description={`Visualiza y gestiona las fichas de partidos oficiales de ${equipo.nombre}.`}
        buttonText={null}
        tabs={tabsConfig}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          setSearchTerm('');
          setCurrentPage(1);
        }}
      />

      {/* SECCIÓN DE FILTROS ADICIONALES (TEMPORADA Y COMPETENCIA) */}
      <Card padding="p-5" className="grid grid-cols-1 sm:grid-cols-2 gap-6" withGlow={true}>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">📅 Filtrar por Temporada</label>
          <select
            value={selectedTemporada}
            onChange={(e) => {
              setSelectedTemporada(e.target.value);
              setSelectedCompetencia('todos'); // Resetear competencia
              setCurrentPage(1);
            }}
            className="w-full h-10 px-3 text-xs bg-background border border-border/60 rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer font-bold"
          >
            <option value="todos">Todas las Temporadas</option>
            {temporadasDisponibles.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">🏆 Filtrar por Competencia / División</label>
          <select
            value={selectedCompetencia}
            onChange={(e) => {
              setSelectedCompetencia(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-10 px-3 text-xs bg-background border border-border/60 rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer font-bold"
          >
            <option value="todos">Todas las Competencias</option>
            {competenciasFiltradas.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </Card>

      <div className="relative">
        <DataTable 
          title={`Lista de Partidos (${filteredData.length})`}
          columns={columnas}
          data={paginatedData}
          searchPlaceholder="Buscar por equipo o torneo..."
          onSearch={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filteredData.length}
          perPage={itemsPerPage}
          isLoading={loading && partidos.length === 0}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ESTADÍSTICAS DEL PARTIDO & REPORTES DE JUGADORES / EA API          */}
      {/* ========================================================================= */}
      {isStatsModalOpen && selectedMatch && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[120] overflow-y-auto flex justify-center p-4 sm:p-10">
          <div className="w-full max-w-2xl bg-card border border-border/50 shadow-2xl rounded-2xl p-6 space-y-5 my-auto animate-fade-in relative">
            
            {/* Cabecera del Dialogo */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/40 pb-3 gap-3">
              <div>
                <h3 className="text-lg font-display font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                  🛡️ Reportar Ficha del Encuentro
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Elige un método para sincronizar las estadísticas tácticas.</p>
              </div>

              {/* Selector de Pestañas del Reporte */}
              <div className="flex flex-wrap gap-1 bg-muted/40 p-1 rounded-lg border border-border/40 shrink-0">
                <button 
                  disabled={isDraw}
                  onClick={() => setReportMethod('ea')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 ${reportMethod === 'ea' ? 'bg-background text-primary shadow-sm border border-border/20' : 'text-muted-foreground hover:text-foreground'} ${isDraw ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isDraw ? "Los empates requieren reporte manual obligatorio" : ""}
                >
                  🎮 EA API
                </button>
                <button 
                  onClick={() => setReportMethod('ia')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 ${reportMethod === 'ia' ? 'bg-background text-primary shadow-sm border border-border/20' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  ✨ IA Vision
                </button>
                <button 
                  onClick={() => setReportMethod('manual')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors ${reportMethod === 'manual' ? 'bg-background text-primary shadow-sm border border-border/20' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  📝 Manual
                </button>
              </div>
            </div>

            {/* ========================================== */}
            {/* OPCION 1: EA SPORTS API                   */}
            {/* ========================================== */}
            {reportMethod === 'ea' && (
              <div className="space-y-4">
                
                {/* Cargando */}
                {eaLoading && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    <span className="text-[10px] font-bold tracking-widest text-primary uppercase animate-pulse">Estableciendo enlace con EA Sports...</span>
                  </div>
                )}

                {/* Error de EA API */}
                {!eaLoading && eaError && (
                  <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      ⚠️ Sin conexión con EA Sports
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {eaError}
                    </p>
                    <div className="text-[10px] text-amber-500 font-semibold bg-amber-500/10 p-2.5 rounded-lg">
                      💡 Confirma que tu club tenga ingresado su <strong>ID de Club de EA</strong> en la sección <strong>Oficina</strong> de la sede de tu equipo.
                    </div>
                  </div>
                )}

                {/* No Matches */}
                {!eaLoading && !eaError && eaMatches.length === 0 && (
                  <div className="text-center py-10 border border-dashed border-border/50 rounded-2xl bg-muted/5 space-y-2">
                    <div className="text-3xl">🎮</div>
                    <p className="text-xs font-bold text-foreground">Sin amistosos recientes en EA</p>
                    <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                      No se encontraron enfrentamientos en los servidores del Pro Clubs de EA para tu ID de Club.
                    </p>
                  </div>
                )}

                {/* Seleccion de Partidos EA */}
                {!eaLoading && !eaError && eaMatches.length > 0 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">
                        Selecciona el partido correspondiente de la lista oficial de EA Sports:
                      </label>
                      <Select
                        value={selectedEaMatchId}
                        onChange={(e) => {
                          const mId = e.target.value;
                          setSelectedEaMatchId(mId);
                          
                          const matchObj = eaMatches.find(m => m.matchId === mId);
                          if (matchObj && matchObj.clubs) {
                            const keys = Object.keys(matchObj.clubs);
                            if (keys.length === 2) {
                              const dbLocalEaId = String(selectedMatch.local?.club_id_ea || '').trim();
                              const dbVisitEaId = String(selectedMatch.visitante?.club_id_ea || '').trim();
                              
                              const key0 = String(keys[0]).trim();
                              const key1 = String(keys[1]).trim();
                              
                              const isMatch0Local = key0 === dbLocalEaId;
                              const isMatch1Local = key1 === dbLocalEaId;
                              
                              const hasLocal = isMatch0Local || isMatch1Local;
                              const hasVisit = key0 === dbVisitEaId || key1 === dbVisitEaId;
                              
                              if (!hasLocal || !hasVisit) {
                                const clubA = matchObj.clubs[keys[0]]?.details?.name || 'Club A';
                                const clubB = matchObj.clubs[keys[1]]?.details?.name || 'Club B';
                                setEaMismatchModal({
                                  expectedLocal: selectedMatch.local?.nombre || 'Local Oficial',
                                  expectedVisitante: selectedMatch.visitante?.nombre || 'Visitante Oficial',
                                  expectedLocalId: dbLocalEaId,
                                  expectedVisitanteId: dbVisitEaId,
                                  receivedLocal: clubA,
                                  receivedVisitante: clubB,
                                  receivedLocalId: key0,
                                  receivedVisitanteId: key1,
                                });
                                setSelectedEaMatchId('');
                                setEaClubLocalId('');
                                setEaClubVisitanteId('');
                                setEaAlertEmpate(false);
                                return;
                              }

                              
                              if (isMatch0Local) {
                                setEaClubLocalId(key0);
                                setEaClubVisitanteId(key1);
                              } else {
                                setEaClubLocalId(key1);
                                setEaClubVisitanteId(key0);
                              }

                              const goalsL = Number(matchObj.clubs[keys[0]]?.goals || 0);
                              const goalsV = Number(matchObj.clubs[keys[1]]?.goals || 0);
                              setEaAlertEmpate(goalsL === goalsV);
                            }
                          }
                        }}
                        options={[
                          { value: '', label: 'Seleccionar partido reciente del historial...' },
                          ...eaMatches.map(m => {
                            const keys = Object.keys(m.clubs || {});
                            const clubA = m.clubs[keys[0]]?.details?.name || 'Club A';
                            const clubB = m.clubs[keys[1]]?.details?.name || 'Club B';
                            const goalsA = m.clubs[keys[0]]?.goals || '0';
                            const goalsB = m.clubs[keys[1]]?.goals || '0';
                            const timeAgo = m.timeAgo ? `${m.timeAgo.number} ${m.timeAgo.unit} ago` : 'Reciente';
                            return {
                              value: m.matchId,
                              label: `🎮 ${clubA} ${goalsA} - ${goalsB} ${clubB} (${timeAgo})`
                            };
                          })
                        ]}
                      />
                    </div>

                    {eaAlertEmpate && (
                      <Alert variant="warning" className="text-xs">
                        <strong>⚠️ Empate Detectado en EA Sports API:</strong> Las ligas oficiales no admiten empates absolutos. Si este partido se definió en penales, te recomendamos usar la pestaña **Entrada Manual**.
                      </Alert>
                    )}

                    {selectedEaMatchId && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-border/40 bg-muted/10 rounded-xl p-4">
                        <div className="space-y-1">
                          <label className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">ID Club EA Local</label>
                          <input type="text" readOnly className="w-full h-9 px-3 text-xs rounded-lg bg-background/50 border border-border/60 text-muted-foreground font-mono" value={eaClubLocalId} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">ID Club EA Visitante</label>
                          <input type="text" readOnly className="w-full h-9 px-3 text-xs rounded-lg bg-background/50 border border-border/60 text-muted-foreground font-mono" value={eaClubVisitanteId} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Warnings de Jugadores No Registrados / Desalineados */}
                {eaWarnings && (
                  <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-4 space-y-3 animate-fade-in">
                    <p className="text-xs font-bold text-red-400 flex items-center gap-1.5 uppercase font-display tracking-wide">
                      🚨 Advertencia de Inscripción de Jugadores
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Los siguientes jugadores que participaron en el encuentro de EA Sports no están inscritos correctamente en el sistema:
                    </p>
                    
                    <ul className="text-[10px] space-y-1.5 font-mono bg-black/35 p-3 rounded-lg divide-y divide-white/5 max-h-36 overflow-y-auto">
                      {eaWarnings.map((w, idx) => (
                        <li key={idx} className="pt-1.5 first:pt-0 flex flex-col sm:flex-row sm:justify-between gap-1">
                          <span className="text-primary font-black uppercase">{w.playername} ({w.club})</span>
                          <span className="text-destructive/90 italic font-sans text-right">{w.reason}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="text-[10px] text-yellow-500 font-semibold leading-relaxed">
                      💡 Hablar con un administrador u organizador para actualizar este tema, de lo contrario el equipo rival puede reclamar los puntos por no jugar en las condiciones pactadas.
                    </p>

                    <div className="flex justify-end pt-1.5 border-t border-border/20">
                      <Button 
                        size="sm"
                        onClick={() => handleEaReportSubmit(true)}
                        className="h-8 text-[9px] uppercase tracking-wider font-black bg-gradient-to-r from-red-600 to-amber-600 text-white border-none shadow-md hover:shadow-red-900/40"
                      >
                        Reportar de todas formas
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-3">
                  <Button onClick={() => setIsStatsModalOpen(false)} variant="outline" className="h-10 text-[10px]">Cancelar</Button>
                  <Button 
                    onClick={() => handleEaReportSubmit(false)}
                    isLoading={eaProcessing}
                    disabled={!selectedEaMatchId || eaLoading || eaWarnings !== null}
                    className="h-10 text-[10px] bg-gradient-to-r from-primary to-destructive text-primary-foreground border-none font-display font-black uppercase tracking-wider shadow-lg"
                  >
                    ⚽ Confirmar Reporte EA
                  </Button>
                </div>
              </div>
            )}

            {(reportMethod === 'manual' || reportMethod === 'ia') && (
              <div className="space-y-5">
                
                {reportMethod === 'ia' && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                    <h4 className="text-[11px] font-black uppercase text-primary mb-2 flex items-center gap-1.5">
                      ✨ Autocompletar con IA (Gemini Vision)
                    </h4>
                    <p className="text-[10px] text-muted-foreground mb-3">
                      Sube las capturas de pantalla del partido (Estadísticas del Equipo y Rendimiento de Jugadores) para extraer los datos automáticamente.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">
                          Foto: Stats de Equipo {fotoPartido && <span className="text-emerald-500 font-bold ml-1">✓ Cargada</span>}
                        </label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, setVisionTeamStatsImg, 'team')}
                          className="w-full text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                        {uploadingTeam && <p className="text-[9px] text-amber-500 animate-pulse font-semibold">Subiendo copia al servidor...</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">
                          Foto: Rendimiento Jugadores {fotoJugadores && <span className="text-emerald-500 font-bold ml-1">✓ Cargada</span>}
                        </label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, setVisionPlayerStatsImg, 'player')}
                          className="w-full text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                        {uploadingPlayer && <p className="text-[9px] text-amber-500 animate-pulse font-semibold">Subiendo copia al servidor...</p>}
                      </div>
                    </div>
                    <Button 
                      onClick={handleVisionExtract}
                      isLoading={visionProcessing}
                      disabled={!visionTeamStatsImg || !visionPlayerStatsImg}
                      className="w-full h-8 text-[10px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-wider shadow border-none"
                    >
                      🚀 Extraer Estadísticas
                    </Button>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-primary font-black uppercase tracking-wider block truncate">Goles {selectedMatch.local.nombre} (Local)</label>
                    <Input type="number" min="0" value={statsScoreLocal} onChange={(e) => setStatsScoreLocal(e.target.value)} placeholder="Goles Local" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-primary font-black uppercase tracking-wider block truncate">Goles {selectedMatch.visitante.nombre} (Visitante)</label>
                    <Input type="number" min="0" value={statsScoreVisitante} onChange={(e) => setStatsScoreVisitante(e.target.value)} placeholder="Goles Visitante" />
                  </div>
                </div>



                {/* Subida de Fotos */}
                <div className={`grid grid-cols-1 ${reportMethod === 'manual' ? 'sm:grid-cols-3' : 'sm:grid-cols-1'} gap-4 border border-border/40 p-4 rounded-xl bg-muted/10`}>
                  {reportMethod === 'manual' && (
                    <>
                      <div className="space-y-1.5">
                        <ImageUploader 
                          label="Estadísticas Partido *" 
                          value={fotoPartido} 
                          onChange={setFotoPartido}
                          folder="reportes"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <ImageUploader 
                          label="Valoraciones Plantilla *" 
                          value={fotoJugadores} 
                          onChange={setFotoJugadores}
                          folder="reportes"
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-1.5">
                    <ImageUploader 
                      label="Jugadores Conectados *" 
                      value={fotoConectados} 
                      onChange={setFotoConectados}
                      folder="reportes"
                    />
                  </div>
                </div>

                {/* Estadísticas de Equipo */}
                <div className="space-y-2 border-t border-border/30 pt-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Estadísticas del Club ({equipo.nombre})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-muted-foreground">Goles a Favor</label>
                      <input type="number" min="0" className="w-full h-8 px-2 text-xs rounded bg-background border border-border/60 text-center font-mono font-bold" value={teamManualStats.goles_favor} onChange={(e) => setTeamManualStats({...teamManualStats, goles_favor: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-muted-foreground">Goles en Contra</label>
                      <input type="number" min="0" className="w-full h-8 px-2 text-xs rounded bg-background border border-border/60 text-center font-mono font-bold" value={teamManualStats.goles_en_contra} onChange={(e) => setTeamManualStats({...teamManualStats, goles_en_contra: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-muted-foreground">Asistencias</label>
                      <input type="number" min="0" className="w-full h-8 px-2 text-xs rounded bg-background border border-border/60 text-center font-mono font-bold" value={teamManualStats.asistencias} onChange={(e) => setTeamManualStats({...teamManualStats, asistencias: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-muted-foreground">Tiros</label>
                      <input type="number" min="0" className="w-full h-8 px-2 text-xs rounded bg-background border border-border/60 text-center font-mono font-bold" value={teamManualStats.tiros} onChange={(e) => setTeamManualStats({...teamManualStats, tiros: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-muted-foreground">Pases Intentados</label>
                      <input type="number" min="0" className="w-full h-8 px-2 text-xs rounded bg-background border border-border/60 text-center font-mono font-bold" value={teamManualStats.pases_intentados} onChange={(e) => setTeamManualStats({...teamManualStats, pases_intentados: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-muted-foreground">Precisión de Pases (%)</label>
                      <input type="number" min="0" max="100" className="w-full h-8 px-2 text-xs rounded bg-background border border-border/60 text-center font-mono font-bold" value={teamManualStats.precision_pases} onChange={(e) => setTeamManualStats({...teamManualStats, precision_pases: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-muted-foreground">Entradas Intentadas</label>
                      <input type="number" min="0" className="w-full h-8 px-2 text-xs rounded bg-background border border-border/60 text-center font-mono font-bold" value={teamManualStats.entradas_intentadas} onChange={(e) => setTeamManualStats({...teamManualStats, entradas_intentadas: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-muted-foreground">Entradas Exitosas</label>
                      <input type="number" min="0" className="w-full h-8 px-2 text-xs rounded bg-background border border-border/60 text-center font-mono font-bold" value={teamManualStats.entradas_exitosas} onChange={(e) => setTeamManualStats({...teamManualStats, entradas_exitosas: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-muted-foreground">Tarjetas Rojas</label>
                      <input type="number" min="0" className="w-full h-8 px-2 text-xs rounded bg-background border border-border/60 text-center font-mono font-bold" value={teamManualStats.tarjetas_rojas} onChange={(e) => setTeamManualStats({...teamManualStats, tarjetas_rojas: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-muted-foreground">Tarjetas Amarillas</label>
                      <input type="number" min="0" className="w-full h-8 px-2 text-xs rounded bg-background border border-border/60 text-center font-mono font-bold" value={teamManualStats.tarjetas_amarillas} onChange={(e) => setTeamManualStats({...teamManualStats, tarjetas_amarillas: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-muted-foreground">Atajadas</label>
                      <input type="number" min="0" className="w-full h-8 px-2 text-xs rounded bg-background border border-border/60 text-center font-mono font-bold" value={teamManualStats.atajadas} onChange={(e) => setTeamManualStats({...teamManualStats, atajadas: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>

                {/* Estadísticas de Plantilla (Condicionado a sin_transferencias) */}
                {selectedMatch?.competencia?.config?.sin_transferencias === true ? (
                  <div className="border border-border/40 bg-muted/5 rounded-xl p-3.5 text-center text-xs space-y-1">
                    <span className="text-sm">🚫</span>
                    <p className="font-bold text-muted-foreground">Estadísticas Individuales Deshabilitadas</p>
                    <p className="text-[10px] text-muted-foreground/80 leading-relaxed font-light">
                      En competencias sin transferencias, no se permite ingresar estadísticas individuales de jugadores en reportes manuales o por foto.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 border-t border-border/30 pt-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Rendimiento de Plantilla ({equipo.nombre})</h4>
                    <div className="max-h-48 overflow-y-auto border border-border/40 rounded-xl bg-muted/5 divide-y divide-border/20 pr-1">
                      {playerStats.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground text-center py-4">No hay jugadores registrados en el roster.</p>
                      ) : (
                        playerStats.map((p, idx) => (
                          <div key={p.jugador_id || p.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-2.5 gap-2 text-[11px] font-semibold transition-colors ${!p.jugo ? 'opacity-50 grayscale' : ''}`}>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <label className="flex items-center gap-1 cursor-pointer shrink-0">
                                  <input type="checkbox" checked={p.jugo} onChange={(e) => { const c = [...playerStats]; c[idx].jugo = e.target.checked; setPlayerStats(c); }} className="w-3.5 h-3.5 rounded border-border/60 text-primary" />
                                </label>
                                <span className="text-foreground font-bold truncate w-24 text-left">{p.name}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] uppercase text-muted-foreground">Val:</span>
                                <input disabled={!p.jugo} type="number" min="0" max="10" step="0.1" value={p.valoracion} onChange={(e) => { const c = [...playerStats]; c[idx].valoracion = Number(e.target.value); setPlayerStats(c); }} className="w-11 h-7 text-center rounded bg-background border border-border/60 font-mono font-bold" />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] uppercase text-muted-foreground">Goles:</span>
                                <input disabled={!p.jugo} type="number" min="0" value={p.goles} onChange={(e) => { const c = [...playerStats]; c[idx].goles = Number(e.target.value); setPlayerStats(c); }} className="w-9 h-7 text-center rounded bg-background border border-border/60 font-mono font-bold" />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] uppercase text-muted-foreground">Asists:</span>
                                <input disabled={!p.jugo} type="number" min="0" value={p.asistencias} onChange={(e) => { const c = [...playerStats]; c[idx].asistencias = Number(e.target.value); setPlayerStats(c); }} className="w-9 h-7 text-center rounded bg-background border border-border/60 font-mono font-bold" />
                              </div>
                              <div className="flex gap-2">
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input disabled={!p.jugo} type="checkbox" checked={p.yellowCard} onChange={(e) => { const c = [...playerStats]; c[idx].yellowCard = e.target.checked; setPlayerStats(c); }} className="w-3.5 h-3.5 rounded border-border/60 text-primary" />
                                  <span className="text-[8px] font-black text-amber-500">🟨</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input disabled={!p.jugo} type="checkbox" checked={p.redCard} onChange={(e) => { const c = [...playerStats]; c[idx].redCard = e.target.checked; setPlayerStats(c); }} className="w-3.5 h-3.5 rounded border-border/60 text-primary" />
                                  <span className="text-[8px] font-black text-destructive">🟥</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-3">
                  <Button onClick={() => setIsStatsModalOpen(false)} variant="outline" className="h-10 text-[10px]">Cancelar</Button>
                  <Button onClick={handleManualReportSubmit} isLoading={manualProcessing} className="h-10 text-[10px] bg-primary border-none text-primary-foreground font-display font-black uppercase tracking-wider shadow-lg">💾 Enviar Reporte Manual</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal de Mismatch de Clubes EA Sports */}
      <Modal
        isOpen={eaMismatchModal !== null}
        onClose={() => setEaMismatchModal(null)}
        title="⚠️ Discrepancia de Clubes EA Sports"
        maxWidth="max-w-xl"
        zIndex="z-[130]"
      >
        <div className="space-y-6 text-center font-sans text-xs pt-2">
          {/* Icono con resplandor neón */}
          <div className="relative py-2">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-amber-500/15 rounded-full blur-xl animate-pulse pointer-events-none"></div>
            <div className="relative w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center text-xl mx-auto mb-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              ⚠️
            </div>
            <h4 className="text-base font-display font-black text-foreground uppercase tracking-wider">
              Conflicto de Identificación de Clubes
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed max-w-md mx-auto mt-1">
              Los clubes reportados desde la API de EA Sports no coinciden con los configurados en el partido oficial programado.
            </p>
          </div>

          {/* Comparación visual lado a lado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {/* Partido Programado Oficial */}
            <div className="relative p-4 rounded-xl bg-card border border-border/60 shadow-md overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
              <h5 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-border/20 pb-2 mb-3 flex items-center gap-1.5">
                <span>📌</span> Partido Programado (DB)
              </h5>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-muted/20 p-2 rounded-lg border border-border/30">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-muted-foreground uppercase font-black">Local</span>
                    <span className="font-bold text-foreground text-xs truncate max-w-[150px]">{eaMismatchModal?.expectedLocal}</span>
                  </div>
                  <code className="text-[9px] bg-background px-2 py-0.5 rounded font-mono font-bold text-primary border border-border/40">
                    ID: {eaMismatchModal?.expectedLocalId || 'Sin ID'}
                  </code>
                </div>

                <div className="flex justify-between items-center bg-muted/20 p-2 rounded-lg border border-border/30">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-muted-foreground uppercase font-black">Visitante</span>
                    <span className="font-bold text-foreground text-xs truncate max-w-[150px]">{eaMismatchModal?.expectedVisitante}</span>
                  </div>
                  <code className="text-[9px] bg-background px-2 py-0.5 rounded font-mono font-bold text-primary border border-border/40">
                    ID: {eaMismatchModal?.expectedVisitanteId || 'Sin ID'}
                  </code>
                </div>
              </div>
            </div>

            {/* Partido Detectado en EA */}
            <div className="relative p-4 rounded-xl bg-card border border-border/60 shadow-md overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
              <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-widest border-b border-border/20 pb-2 mb-3 flex items-center gap-1.5">
                <span>🎮</span> Detectado en EA Sports
              </h5>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-muted/20 p-2 rounded-lg border border-border/30">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-muted-foreground uppercase font-black">Club A</span>
                    <span className="font-bold text-amber-400 text-xs truncate max-w-[150px]">{eaMismatchModal?.receivedLocal}</span>
                  </div>
                  <code className="text-[9px] bg-background px-2 py-0.5 rounded font-mono font-bold text-amber-500 border border-border/40">
                    ID: {eaMismatchModal?.receivedLocalId || 'Sin ID'}
                  </code>
                </div>

                <div className="flex justify-between items-center bg-muted/20 p-2 rounded-lg border border-border/30">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-muted-foreground uppercase font-black">Club B</span>
                    <span className="font-bold text-amber-400 text-xs truncate max-w-[150px]">{eaMismatchModal?.receivedVisitante}</span>
                  </div>
                  <code className="text-[9px] bg-background px-2 py-0.5 rounded font-mono font-bold text-amber-500 border border-border/40">
                    ID: {eaMismatchModal?.receivedVisitanteId || 'Sin ID'}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Ayuda táctica */}
          <div className="p-3 bg-muted/30 border border-border/40 rounded-xl text-left">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              💡 <strong>¿Cómo solucionarlo?</strong> Asegúrate de seleccionar el partido correcto en la lista de encuentros de EA Sports. Si el problema persiste, verifica que los Capitanes hayan configurado los <strong>IDs de Club EA correctos</strong> en la Oficina del Club.
            </p>
          </div>

          {/* Acciones */}
          <div className="flex justify-end pt-2 border-t border-border/20">
            <Button 
              onClick={() => setEaMismatchModal(null)} 
              className="px-5 h-9 text-xs bg-primary hover:bg-primary/95 text-primary-foreground border-none font-bold rounded-lg shadow-md hover:shadow-primary/20 transition-all font-display uppercase tracking-wider"
            >
              Entendido
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Alertas del Sistema */}
      <Modal isOpen={alertConfig.isOpen} onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })} title={alertConfig.title} maxWidth="max-w-md" zIndex="z-[200]">
        <div className="p-4 sm:p-6 space-y-4">
          <Alert variant={alertConfig.variant}>
            {alertConfig.message.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i !== alertConfig.message.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </Alert>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setAlertConfig({ ...alertConfig, isOpen: false })} className="w-full sm:w-auto h-10 text-[11px] bg-primary text-primary-foreground font-black uppercase tracking-wider">Entendido</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

