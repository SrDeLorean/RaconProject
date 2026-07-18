import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '@/components/ui/DataTable';
import CrudHeader from '@/components/shared/CrudHeader';
import PageHelp from '@/components/shared/PageHelp';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import api from '@/api/axios';
import Modal from '@/components/ui/Modal';


export default function PartidosUtCRUD() {
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
  const [reportMethod, setReportMethod] = useState('manual'); // 'ea' | 'manual'
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
  
  // Plantilla oficial cargada bajo demanda para estadísticas de jugadores
  const [localRoster, setLocalRoster] = useState([]);
  const [visitanteRoster, setVisitanteRoster] = useState([]);
  const [localPlayerStats, setLocalPlayerStats] = useState([]);
  const [visitantePlayerStats, setVisitantePlayerStats] = useState([]);
  const [manualProcessing, setManualProcessing] = useState(false);

  // Confirm Manual Report States
  const [selectedConfirmMatch, setSelectedConfirmMatch] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmProcessing, setConfirmProcessing] = useState(false);

  // States for the unified editor in the confirmation modal
  const [confirmScoreLocal, setConfirmScoreLocal] = useState('');
  const [confirmScoreVisitante, setConfirmScoreVisitante] = useState('');
  const [confirmTeamLocalStats, setConfirmTeamLocalStats] = useState({});
  const [confirmTeamVisitanteStats, setConfirmTeamVisitanteStats] = useState({});
  const [confirmLocalPlayers, setConfirmLocalPlayers] = useState([]);
  const [confirmVisitantePlayers, setConfirmVisitantePlayers] = useState([]);
  const [readOnlyLocalPlayers, setReadOnlyLocalPlayers] = useState([]);
  const [readOnlyVisitantePlayers, setReadOnlyVisitantePlayers] = useState([]);
  const [confirmActiveTab, setConfirmActiveTab] = useState('local');

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const backendBaseUrl = api.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:8000';
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${backendBaseUrl}${cleanPath}`;
  };

  const fetchPartidos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/partidos-ut', { params: { for_organizer: true } });
      setPartidos(res.data || []);
    } catch (err) {
      console.error("Error al obtener partidos:", err);
      setError("No se pudieron obtener los partidos oficiales.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartidos();
  }, []);

  // Cargar rosters bajo demanda cuando se activa el reporte manual
  useEffect(() => {
    if (selectedMatch && reportMethod === 'manual') {
      // 1. Cargar local
      const localRosterList = [];
      if (selectedMatch.local?.capitan) {
        localRosterList.push(selectedMatch.local.capitan);
      }
      if (selectedMatch.local?.companero) {
        localRosterList.push(selectedMatch.local.companero);
      }
      setLocalRoster(localRosterList);
      setLocalPlayerStats(localRosterList.map(userObj => ({
        id: userObj.id,
        name: userObj.gamertag || userObj.name || 'Jugador',
        equipo_id: selectedMatch.equipo_ut_local_id || selectedMatch.equipo_local_id,
        goals: 0,
        assists: 0,
        yellowCard: false,
        redCard: false
      })));

      // 2. Cargar visitante
      const visitanteRosterList = [];
      if (selectedMatch.visitante?.capitan) {
        visitanteRosterList.push(selectedMatch.visitante.capitan);
      }
      if (selectedMatch.visitante?.companero) {
        visitanteRosterList.push(selectedMatch.visitante.companero);
      }
      setVisitanteRoster(visitanteRosterList);
      setVisitantePlayerStats(visitanteRosterList.map(userObj => ({
        id: userObj.id,
        name: userObj.gamertag || userObj.name || 'Jugador',
        equipo_id: selectedMatch.equipo_ut_visitante_id || selectedMatch.equipo_visitante_id,
        goals: 0,
        assists: 0,
        yellowCard: false,
        redCard: false
      })));
    }
  }, [selectedMatch, reportMethod]);

  // Abrir Modal de Reporte
  const openReportModal = async (match) => {
    setSelectedMatch(match);
    setStatsScoreLocal(match.goles_local !== null ? String(match.goles_local) : '');
    setStatsScoreVisitante(match.goles_visitante !== null ? String(match.goles_visitante) : '');
    setReportMethod('manual');
    setLocalRoster([]);
    setVisitanteRoster([]);
    setLocalPlayerStats([]);
    setVisitantePlayerStats([]);

    setIsStatsModalOpen(true);
  };

  // Enviar Reporte de EA Sports API
  const handleEaReportSubmit = async (forceReport = false) => {
    if (!selectedEaMatchId || !eaClubLocalId || !eaClubVisitanteId) {
      alert("⚠️ Selecciona un partido de EA y confirma los IDs de Club.");
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
      const res = await api.post(`/partidos-ut/${selectedMatch.id}/ea-report`, {
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
        alert("❌ Error al procesar reporte de EA: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setEaProcessing(false);
    }
  };

  // Enviar Reporte Manual
  const handleManualReportSubmit = async () => {
    if (statsScoreLocal === '' || statsScoreVisitante === '') {
      alert("⚠️ Por favor ingresa los goles del partido.");
      return;
    }

    setManualProcessing(true);
    try {
      const res = await api.put(`/partidos-ut/${selectedMatch.id}`, {
        goles_local: Number(statsScoreLocal),
        goles_visitante: Number(statsScoreVisitante),
        stats: {
          teamLocal: teamLocalStats,
          teamVisitante: teamVisitanteStats,
          players: []
        }
      });

      if (res.data) {
        setSuccessMsg("🎉 ¡Marcador y estadísticas reportadas manualmente con éxito!");
        setIsStatsModalOpen(false);
        fetchPartidos();
      }
    } catch (err) {
      alert("❌ Error al enviar el reporte manual: " + (err.response?.data?.message || err.message));
    } finally {
      setManualProcessing(false);
    }
  };

  // Abrir Modal de Confirmación
  const openConfirmModal = async (match) => {
    setSelectedConfirmMatch(match);
    
    const rLocal = match.reporte_local_stats || {};
    const rVisit = match.reporte_visitante_stats || {};

    // Goles oficiales pre-llenados
    const scoreLocal = rLocal.goles_local !== undefined ? String(rLocal.goles_local) : (rVisit.goles_local !== undefined ? String(rVisit.goles_local) : '');
    const scoreVisitante = rLocal.goles_visitante !== undefined ? String(rLocal.goles_visitante) : (rVisit.goles_visitante !== undefined ? String(rVisit.goles_visitante) : '');

    setConfirmScoreLocal(scoreLocal);
    setConfirmScoreVisitante(scoreVisitante);

    // Estadísticas de equipo
    setConfirmTeamLocalStats({
      goles_favor: rLocal.team_stats?.goles_favor !== undefined ? rLocal.team_stats.goles_favor : (scoreLocal ? Number(scoreLocal) : 0),
      goles_en_contra: rLocal.team_stats?.goles_en_contra !== undefined ? rLocal.team_stats.goles_en_contra : (scoreVisitante ? Number(scoreVisitante) : 0),
      asistencias: rLocal.team_stats?.asistencias || 0,
      tiros: rLocal.team_stats?.tiros || 0,
      pases_intentados: rLocal.team_stats?.pases_intentados || 0,
      precision_pases: rLocal.team_stats?.precision_pases || 0,
      entradas_intentadas: rLocal.team_stats?.entradas_intentadas || 0,
      entradas_exitosas: rLocal.team_stats?.entradas_exitosas || 0,
      tarjetas_rojas: rLocal.team_stats?.tarjetas_rojas || 0,
      tarjetas_amarillas: rLocal.team_stats?.tarjetas_amarillas || 0,
      atajadas: rLocal.team_stats?.atajadas || 0
    });

    setConfirmTeamVisitanteStats({
      goles_favor: rVisit.team_stats?.goles_favor !== undefined ? rVisit.team_stats.goles_favor : (scoreVisitante ? Number(scoreVisitante) : 0),
      goles_en_contra: rVisit.team_stats?.goles_en_contra !== undefined ? rVisit.team_stats.goles_en_contra : (scoreLocal ? Number(scoreLocal) : 0),
      asistencias: rVisit.team_stats?.asistencias || 0,
      tiros: rVisit.team_stats?.tiros || 0,
      pases_intentados: rVisit.team_stats?.pases_intentados || 0,
      precision_pases: rVisit.team_stats?.precision_pases || 0,
      entradas_intentadas: rVisit.team_stats?.entradas_intentadas || 0,
      entradas_exitosas: rVisit.team_stats?.entradas_exitosas || 0,
      tarjetas_rojas: rVisit.team_stats?.tarjetas_rojas || 0,
      tarjetas_amarillas: rVisit.team_stats?.tarjetas_amarillas || 0,
      atajadas: rVisit.team_stats?.atajadas || 0
    });

    setConfirmActiveTab('local');

    // Cargar Roster Local y Combinar con reporte si existe
    let localPlayersList = [];
    if (match.equipo_ut_local_id || match.equipo_local_id) {
      try {
        const roster = [];
        if (match.local?.capitan) {
          roster.push(match.local.capitan);
        }
        if (match.local?.companero) {
          roster.push(match.local.companero);
        }
        const reportedMap = new Map();
        if (rLocal.player_stats) {
          rLocal.player_stats.forEach(p => reportedMap.set(Number(p.jugador_id), p));
        }
        localPlayersList = roster.map(userObj => {
          const reported = reportedMap.get(Number(userObj.id));
          return {
            jugador_id: userObj.id,
            name: userObj.gamertag || userObj.name || 'Jugador',
            valoracion: reported ? Number(reported.valoracion ?? 6.0) : 6.0,
            goles: reported ? Number(reported.goles ?? 0) : 0,
            asistencias: reported ? Number(reported.asistencias ?? 0) : 0,
            yellowCard: reported ? !!reported.yellowCard : false,
            redCard: reported ? !!reported.redCard : false,
          };
        });
      } catch (err) {
        console.warn("Error cargando roster local para confirmación:", err);
        localPlayersList = rLocal.player_stats || [];
      }
    } else {
      localPlayersList = rLocal.player_stats || [];
    }
    setConfirmLocalPlayers(localPlayersList);
    setReadOnlyLocalPlayers(localPlayersList);

    // Cargar Roster Visitante y Combinar con reporte si existe
    let visitantePlayersList = [];
    if (match.equipo_ut_visitante_id || match.equipo_visitante_id) {
      try {
        const roster = [];
        if (match.visitante?.capitan) {
          roster.push(match.visitante.capitan);
        }
        if (match.visitante?.companero) {
          roster.push(match.visitante.companero);
        }
        const reportedMap = new Map();
        if (rVisit.player_stats) {
          rVisit.player_stats.forEach(p => reportedMap.set(Number(p.jugador_id), p));
        }
        visitantePlayersList = roster.map(userObj => {
          const reported = reportedMap.get(Number(userObj.id));
          return {
            jugador_id: userObj.id,
            name: userObj.gamertag || userObj.name || 'Jugador',
            valoracion: reported ? Number(reported.valoracion ?? 6.0) : 6.0,
            goles: reported ? Number(reported.goles ?? 0) : 0,
            asistencias: reported ? Number(reported.asistencias ?? 0) : 0,
            yellowCard: reported ? !!reported.yellowCard : false,
            redCard: reported ? !!reported.redCard : false,
          };
        });
      } catch (err) {
        console.warn("Error cargando roster visitante para confirmación:", err);
        visitantePlayersList = rVisit.player_stats || [];
      }
    } else {
      visitantePlayersList = rVisit.player_stats || [];
    }
    setConfirmVisitantePlayers(visitantePlayersList);
    setReadOnlyVisitantePlayers(visitantePlayersList);

    setIsConfirmModalOpen(true);
  };

  // Enviar Confirmación de Reporte Manual (Organizador)
  const handleConfirmReportSubmit = async () => {
    if (confirmScoreLocal === '' || confirmScoreVisitante === '') {
      alert("⚠️ Por favor ingresa los goles oficiales.");
      return;
    }

    setConfirmProcessing(true);
    try {
      const res = await api.post(`/partidos-ut/${selectedConfirmMatch.id}/confirm-report`, {
        goles_local: Number(confirmScoreLocal),
        goles_visitante: Number(confirmScoreVisitante),
        local_stats: {
          team_stats: confirmTeamLocalStats,
          player_stats: []
        },
        visitante_stats: {
          team_stats: confirmTeamVisitanteStats,
          player_stats: []
        }
      });

      if (res.data) {
        setSuccessMsg("🎉 ¡Ficha unificada y estadísticas confirmadas exitosamente!");
        setIsConfirmModalOpen(false);
        fetchPartidos();
      }
    } catch (err) {
      alert("❌ Error al confirmar el reporte: " + (err.response?.data?.message || err.message));
    } finally {
      setConfirmProcessing(false);
    }
  };

  // Tabs de CrudHeader
  const tabsConfig = useMemo(() => [
    { id: 'todos', label: 'Todos los Partidos', icon: '🏟️' },
    { id: 'por_reportar', label: 'Por Reportar', icon: '🚨' },
    { id: 'por_confirmar', label: 'Por Confirmar', icon: '🛡️' },
    { id: 'pendiente', label: 'Pendientes', icon: '⏳' },
    { id: 'finalizado', label: 'Finalizados', icon: '🟢' },
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
      const yaReportado = p.goles_local !== null && p.goles_visitante !== null;
      const porConfirmar = (p.reporte_local_completado || p.reporte_visitante_completado) && !p.reporte_confirmado;

      // Filtro de Pestaña
      if (activeTab === 'por_confirmar') {
        if (!porConfirmar) return false;
      } else if (activeTab === 'pendiente') {
        if (yaReportado || porConfirmar) return false;
      } else if (activeTab === 'finalizado') {
        if (!yaReportado && !p.reporte_confirmado) return false;
      } else if (activeTab === 'por_reportar') {
        if (yaReportado || porConfirmar) return false;
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
      const compNom  = p.competencia?.nombre?.toLowerCase() || '';
      const jornadaNom = p.jornada?.toLowerCase() || '';

      return localNom.includes(q) || visitNom.includes(q) || compNom.includes(q) || jornadaNom.includes(q);
    });
  }, [partidos, activeTab, selectedTemporada, selectedCompetencia, searchTerm]);

  // Paginación manual en el cliente
  const paginatedData = useMemo(() => {
    const offset = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(offset, offset + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Columnas para DataTable
  const columnas = useMemo(() => [
    {
      header: 'Partido / Encuentro',
      render: (row) => {
        const backendBaseUrl = api.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:8000';
        const getUrl = (path) => typeof window.mediaUrl === 'function' ? window.mediaUrl(path) : `${backendBaseUrl}${path}`;
        return (
          <div className="flex items-center gap-2">
            {row.local?.logo ? (
              <img 
                src={row.local.logo.startsWith('http') ? row.local.logo : getUrl(row.local.logo)} 
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
                src={row.visitante.logo.startsWith('http') ? row.visitante.logo : getUrl(row.visitante.logo)} 
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
        const porConfirmar = (row.reporte_local_completado || row.reporte_visitante_completado) && !row.reporte_confirmado;
        if (porConfirmar) {
          return <Badge variant="warning">Por Confirmar</Badge>;
        }
        return (
          <Badge variant={yaRep ? 'success' : 'warning'}>
            {yaRep ? 'Finalizado' : 'Pendiente'}
          </Badge>
        );
      }
    },
    {
      header: 'Acciones',
      render: (row) => {
        const yaRep = row.goles_local !== null && row.goles_visitante !== null;
        const porConfirmar = (row.reporte_local_completado || row.reporte_visitante_completado) && !row.reporte_confirmado;
        return (
          <div className="flex items-center gap-2 flex-wrap">
            {!row.reporte_confirmado ? (
              <>
                <Button
                  size="sm"
                  onClick={() => openConfirmModal(row)}
                  className="h-8 px-3 text-xs bg-amber-500 hover:bg-amber-600 text-white border-none font-display font-black uppercase tracking-wider shadow-md whitespace-nowrap shrink-0"
                >
                  🛡️ Revisar/Confirmar
                </Button>
                {!row.reporte_local_completado && !row.reporte_visitante_completado && (
                  <Button
                    size="sm"
                    onClick={() => openReportModal(row)}
                    className="h-8 px-3 text-xs bg-gradient-to-r from-primary to-destructive text-primary-foreground border-none font-display font-black uppercase tracking-wider shadow-md whitespace-nowrap shrink-0"
                  >
                    🛡️ Ficha / Reportar
                  </Button>
                )}
              </>
            ) : null}
            <Button
              size="sm"
              onClick={() => navigate(`/partidos-ut/${row.id}`)}
              className={`h-8 px-3 text-xs font-display font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-1 transition-all whitespace-nowrap shrink-0 border border-border/45 ${
                yaRep || row.reporte_confirmado 
                  ? 'bg-sky-600/15 hover:bg-sky-600 text-sky-400 hover:text-white border-sky-500/30' 
                  : 'bg-card/60 hover:bg-muted text-foreground'
              }`}
            >
              📊 {yaRep || row.reporte_confirmado ? 'Ver Reporte' : 'Ver Previa'}
            </Button>
          </div>
        );
      }
    }
  ], []);

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
        title="Partidos UT y Calendarios"
        description="Monitorea y reporta los marcadores e incidentes oficiales de las competencias de Ultimate Team."
        buttonText={null} // No se crean desde aquí (se generan en el Matchmaker)
        tabs={tabsConfig}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          setSearchTerm('');
          setCurrentPage(1);
        }}
      />

      {/* SECCIÓN DE FILTROS ADICIONALES (TEMPORADA Y COMPETENCIA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-border/50 bg-card/25 backdrop-blur-md p-4 rounded-xl shadow-sm">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">📅 Filtrar por Temporada</label>
          <select
            value={selectedTemporada}
            onChange={(e) => {
              setSelectedTemporada(e.target.value);
              setSelectedCompetencia('todos'); // Resetear competencia
              setCurrentPage(1);
            }}
            className="w-full h-10 px-3 text-xs bg-muted/30 border border-border/60 rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer font-bold"
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
            className="w-full h-10 px-3 text-xs bg-muted/30 border border-border/60 rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer font-bold"
          >
            <option value="todos">Todas las Competencias</option>
            {competenciasFiltradas.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

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
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-card border border-border/50 shadow-2xl rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-fade-in relative">
            
            {/* Cabecera del Dialogo */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/40 pb-3 gap-3">
              <div>
                <h3 className="text-lg font-display font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                  🛡️ Reportar Ficha del Encuentro
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Reporte administrativo del encuentro oficial.</p>
              </div>
            </div>

            <div className="space-y-5">
              
              {/* Ingreso de Marcadores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-primary font-black uppercase tracking-wider block truncate">
                    Goles {selectedMatch.local.nombre} (Local)
                  </label>
                  <Input 
                    type="number" 
                    min="0"
                    value={statsScoreLocal} 
                    onChange={(e) => setStatsScoreLocal(e.target.value)} 
                    placeholder="Goles Local"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-primary font-black uppercase tracking-wider block truncate">
                    Goles {selectedMatch.visitante.nombre} (Visitante)
                  </label>
                  <Input 
                    type="number" 
                    min="0"
                    value={statsScoreVisitante} 
                    onChange={(e) => setStatsScoreVisitante(e.target.value)} 
                    placeholder="Goles Visitante"
                  />
                </div>
              </div>

              {/* Estadísticas Básicas de Equipos */}
              <div className="grid grid-cols-2 gap-4 border-t border-border/30 pt-3">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Estadísticas Local</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-muted-foreground">Tiros</label>
                      <input 
                        type="number"
                        className="w-full h-8 px-2 text-xs rounded bg-background border border-border/60 text-center font-mono font-bold"
                        value={teamLocalStats.shots} 
                        onChange={(e) => setTeamLocalStats({...teamLocalStats, shots: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-muted-foreground">Posesión %</label>
                      <input 
                        type="number"
                        className="w-full h-8 px-2 text-xs rounded bg-background border border-border/60 text-center font-mono font-bold"
                        value={teamLocalStats.possession} 
                        onChange={(e) => setTeamLocalStats({...teamLocalStats, possession: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Estadísticas Visitante</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-muted-foreground">Tiros</label>
                      <input 
                        type="number"
                        className="w-full h-8 px-2 text-xs rounded bg-background border border-border/60 text-center font-mono font-bold"
                        value={teamVisitanteStats.shots} 
                        onChange={(e) => setTeamVisitanteStats({...teamVisitanteStats, shots: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-muted-foreground">Posesión %</label>
                      <input 
                        type="number"
                        className="w-full h-8 px-2 text-xs rounded bg-background border border-border/60 text-center font-mono font-bold"
                        value={teamVisitanteStats.possession} 
                        onChange={(e) => setTeamVisitanteStats({...teamVisitanteStats, possession: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-2 justify-end pt-3">
                <Button onClick={() => setIsStatsModalOpen(false)} variant="outline" className="h-10 text-[10px]">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleManualReportSubmit}
                  isLoading={manualProcessing}
                  className="h-10 text-[10px] bg-primary border-none text-primary-foreground font-display font-black uppercase tracking-wider shadow-lg"
                >
                  💾 Enviar Reporte Manual
                </Button>
              </div>

            </div>

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

      {/* Modal de Revisión y Confirmación de Reporte Manual */}
      {isConfirmModalOpen && selectedConfirmMatch && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title={`🛡️ Revisar y Confirmar Reporte: ${selectedConfirmMatch.local?.nombre} vs ${selectedConfirmMatch.visitante?.nombre}`}
          maxWidth="max-w-6xl w-full"
          zIndex="z-[120]"
        >
          <div className="space-y-6 text-left">
            {/* COMPARATIVA DE ESTADÍSTICAS EN TIEMPO REAL */}
            <div className="space-y-3 p-4 border border-border/40 rounded-xl bg-card">
              <h3 className="text-xs md:text-sm font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-border/30">
                <span>📊</span> Comparativa de Estadísticas de Equipo (Actualizado en tiempo real)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/30">
                      <th className="p-2 font-bold text-muted-foreground uppercase text-left">Estadística</th>
                      <th className="p-2 font-bold text-primary uppercase text-center w-1/3">Local ({selectedConfirmMatch.local?.nombre || 'Local'})</th>
                      <th className="p-2 font-bold text-destructive uppercase text-center w-1/3">Visitante ({selectedConfirmMatch.visitante?.nombre || 'Visitante'})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20 font-mono">
                    {[
                      { label: 'Goles a Favor', key: 'goles_favor' },
                      { label: 'Goles en Contra', key: 'goles_en_contra' },
                      { label: 'Asistencias', key: 'asistencias' },
                      { label: 'Tiros', key: 'tiros' },
                      { label: 'Pases Intentados', key: 'pases_intentados' },
                      { label: 'Precisión Pases', key: 'precision_pases', suffix: '%' },
                      { label: 'Entradas Intentadas', key: 'entradas_intentadas' },
                      { label: 'Entradas Exitosas', key: 'entradas_exitosas' },
                      { label: 'Atajadas', key: 'atajadas' },
                      { label: 'T. Amarillas', key: 'tarjetas_amarillas' },
                      { label: 'T. Rojas', key: 'tarjetas_rojas' },
                    ].map((row) => {
                      const valLocal = confirmTeamLocalStats[row.key] !== undefined ? confirmTeamLocalStats[row.key] : '-';
                      const valVisit = confirmTeamVisitanteStats[row.key] !== undefined ? confirmTeamVisitanteStats[row.key] : '-';
                      return (
                        <tr key={row.key} className="hover:bg-muted/10">
                          <td className="p-2 text-foreground font-sans font-bold">{row.label}</td>
                          <td className="p-2 text-center text-primary font-bold">{valLocal !== '-' ? `${valLocal}${row.suffix || ''}` : '-'}</td>
                          <td className="p-2 text-center text-destructive font-bold">{valVisit !== '-' ? `${valVisit}${row.suffix || ''}` : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECCIÓN EDITOR CON PESTAÑAS */}
            <div className="space-y-4">
              <div className="flex bg-muted/20 p-1 rounded-xl border border-border/40">
                <button
                  type="button"
                  onClick={() => setConfirmActiveTab('local')}
                  className={`flex-1 py-2 text-xs md:text-sm font-black uppercase tracking-wider rounded-lg transition-all ${
                    confirmActiveTab === 'local'
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Local: {selectedConfirmMatch.local?.nombre}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmActiveTab('visitante')}
                  className={`flex-1 py-2 text-xs md:text-sm font-black uppercase tracking-wider rounded-lg transition-all ${
                    confirmActiveTab === 'visitante'
                      ? 'bg-destructive/10 text-destructive border border-destructive/20 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Visitante: {selectedConfirmMatch.visitante?.nombre}
                </button>
              </div>

              {confirmActiveTab === 'local' ? (
                /* VISTA / EDITOR LOCAL */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in align-top">
                  {/* COLUMNA IZQUIERDA: REPORTE ORIGINAL CAPITÁN LOCAL */}
                  <div className="space-y-4 border-r border-border/10 pr-0 lg:pr-6 text-left">
                    <h4 className="text-xs md:text-sm font-black text-amber-500 uppercase tracking-widest pb-1 border-b border-border/20">
                      📋 Reporte Original del Capitán Local
                    </h4>
                    
                    <div className="p-3 rounded-xl bg-card border border-border/40 text-center">
                      <span className="text-[11px] md:text-xs text-muted-foreground uppercase font-black block">Marcador Reportado</span>
                      <span className="text-lg font-extrabold text-primary">
                        {selectedConfirmMatch.reporte_local_completado && selectedConfirmMatch.reporte_local_stats
                          ? `${selectedConfirmMatch.reporte_local_stats.goles_local} - ${selectedConfirmMatch.reporte_local_stats.goles_visitante}`
                          : 'Sin Reporte'}
                      </span>
                    </div>

                    {/* Capturas de Pantalla */}
                    <div className="space-y-2">
                      <span className="text-[11px] md:text-xs font-black uppercase text-muted-foreground tracking-widest block">Evidencias (Fotos)</span>
                      {selectedConfirmMatch.reporte_local_completado && selectedConfirmMatch.reporte_local_stats?.fotos ? (
                        <div className="grid grid-cols-2 gap-2">
                          {['partido', 'conectados'].map((key) => {
                            const path = selectedConfirmMatch.reporte_local_stats.fotos[key];
                            if (!path) return <div key={key} className="h-16 flex items-center justify-center text-[10px] md:text-xs border border-dashed border-border/30 text-muted-foreground rounded bg-muted/5">Sin foto</div>;
                            return (
                              <a href={getImageUrl(path)} target="_blank" rel="noopener noreferrer" key={key} className="block group relative">
                                <img src={getImageUrl(path)} alt={key} className="w-full h-16 md:h-20 object-cover rounded border border-border/30 group-hover:scale-95 transition-transform" />
                                <span className="absolute bottom-0 inset-x-0 text-[9px] md:text-xs text-center bg-black/60 text-white font-bold py-0.5 rounded-b uppercase truncate">{key}</span>
                              </a>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No se subieron capturas.</p>
                      )}
                    </div>
                  </div>

                  {/* COLUMNA DERECHA: EDITOR OFICIAL LOCAL */}
                  <div className="space-y-4 text-left">
                    <h4 className="text-xs md:text-sm font-black text-primary uppercase tracking-widest pb-1 border-b border-border/20">
                      ✏️ Editor de Estadísticas Oficiales (Local)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-card p-3 rounded-xl border border-border/40">
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">Goles a Favor</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamLocalStats.goles_favor || 0} onChange={(e) => {
                          const val = Number(e.target.value);
                          setConfirmTeamLocalStats(prev => ({ ...prev, goles_favor: val }));
                          setConfirmScoreLocal(String(val));
                          setConfirmTeamVisitanteStats(prev => ({ ...prev, goles_en_contra: val }));
                        }} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">Goles en Contra</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamLocalStats.goles_en_contra || 0} onChange={(e) => {
                          const val = Number(e.target.value);
                          setConfirmTeamLocalStats(prev => ({ ...prev, goles_en_contra: val }));
                          setConfirmScoreVisitante(String(val));
                          setConfirmTeamVisitanteStats(prev => ({ ...prev, goles_favor: val }));
                        }} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">Asistencias</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamLocalStats.asistencias || 0} onChange={(e) => setConfirmTeamLocalStats({...confirmTeamLocalStats, asistencias: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">Tiros</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamLocalStats.tiros || 0} onChange={(e) => setConfirmTeamLocalStats({...confirmTeamLocalStats, tiros: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">Pases Intentados</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamLocalStats.pases_intentados || 0} onChange={(e) => setConfirmTeamLocalStats({...confirmTeamLocalStats, pases_intentados: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">Precisión Pases (%)</label>
                        <input type="number" min="0" max="100" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamLocalStats.precision_pases || 0} onChange={(e) => setConfirmTeamLocalStats({...confirmTeamLocalStats, precision_pases: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">Entradas Intent.</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamLocalStats.entradas_intentadas || 0} onChange={(e) => setConfirmTeamLocalStats({...confirmTeamLocalStats, entradas_intentadas: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">Entradas Exit.</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamLocalStats.entradas_exitosas || 0} onChange={(e) => setConfirmTeamLocalStats({...confirmTeamLocalStats, entradas_exitosas: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">Atajadas</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamLocalStats.atajadas || 0} onChange={(e) => setConfirmTeamLocalStats({...confirmTeamLocalStats, atajadas: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">T. Amarillas</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamLocalStats.tarjetas_amarillas || 0} onChange={(e) => setConfirmTeamLocalStats({...confirmTeamLocalStats, tarjetas_amarillas: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">T. Rojas</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamLocalStats.tarjetas_rojas || 0} onChange={(e) => setConfirmTeamLocalStats({...confirmTeamLocalStats, tarjetas_rojas: Number(e.target.value)})} />
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <span className="text-[11px] md:text-xs font-black uppercase text-muted-foreground tracking-widest block">Rendimiento Plantilla Local (Modificable)</span>
                      <div className="max-h-52 overflow-y-auto pr-1">
                        {confirmLocalPlayers.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic text-center py-4">Sin datos de jugadores.</p>
                        ) : (
                          <div className="overflow-x-auto border border-border/40 rounded-xl bg-card">
                            <table className="w-full text-left border-collapse text-xs md:text-sm">
                              <thead>
                                <tr className="border-b border-border/30 bg-muted/30">
                                  <th className="p-2 font-bold text-muted-foreground uppercase text-left">Jugador</th>
                                  <th className="p-2 font-bold text-muted-foreground uppercase text-center w-16">Val.</th>
                                  <th className="p-2 font-bold text-muted-foreground uppercase text-center w-14">Goles</th>
                                  <th className="p-2 font-bold text-muted-foreground uppercase text-center w-14">Asist.</th>
                                  <th className="p-2 font-bold text-muted-foreground uppercase text-center w-10">🟨</th>
                                  <th className="p-2 font-bold text-muted-foreground uppercase text-center w-10">🟥</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/20">
                                {confirmLocalPlayers.map((p, idx) => (
                                  <tr key={p.jugador_id || idx} className="hover:bg-muted/10">
                                    <td className="p-2 text-foreground font-bold truncate max-w-[100px]" title={p.name}>{p.name || 'Jugador'}</td>
                                    <td className="p-2 text-center">
                                      <input type="number" step="0.1" min="0" max="10" className="w-14 h-8 text-center rounded bg-background border border-border/60 font-mono text-xs md:text-sm font-bold text-foreground" value={p.valoracion || 6.0} onChange={(e) => { const c = [...confirmLocalPlayers]; c[idx].valoracion = Number(e.target.value); setConfirmLocalPlayers(c); }} title="Val" />
                                    </td>
                                    <td className="p-2 text-center">
                                      <input type="number" min="0" className="w-12 h-8 text-center rounded bg-background border border-border/60 font-mono text-xs md:text-sm font-bold text-foreground" value={p.goles || 0} onChange={(e) => { const c = [...confirmLocalPlayers]; c[idx].goles = Number(e.target.value); setConfirmLocalPlayers(c); }} title="Goles" />
                                    </td>
                                    <td className="p-2 text-center">
                                      <input type="number" min="0" className="w-12 h-8 text-center rounded bg-background border border-border/60 font-mono text-xs md:text-sm font-bold text-foreground" value={p.asistencias || 0} onChange={(e) => { const c = [...confirmLocalPlayers]; c[idx].asistencias = Number(e.target.value); setConfirmLocalPlayers(c); }} title="Asists" />
                                    </td>
                                    <td className="p-2 text-center">
                                      <input type="checkbox" checked={p.yellowCard || false} onChange={(e) => { const c = [...confirmLocalPlayers]; c[idx].yellowCard = e.target.checked; setConfirmLocalPlayers(c); }} className="w-4 h-4 md:w-5 md:h-5 rounded border-border/60 text-primary focus:ring-0" />
                                    </td>
                                    <td className="p-2 text-center">
                                      <input type="checkbox" checked={p.redCard || false} onChange={(e) => { const c = [...confirmLocalPlayers]; c[idx].redCard = e.target.checked; setConfirmLocalPlayers(c); }} className="w-4 h-4 md:w-5 md:h-5 rounded border-border/60 text-primary focus:ring-0" />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* VISTA / EDITOR VISITANTE */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in align-top">
                  {/* COLUMNA IZQUIERDA: REPORTE ORIGINAL CAPITÁN VISITANTE */}
                  <div className="space-y-4 border-r border-border/10 pr-0 lg:pr-6 text-left">
                    <h4 className="text-xs md:text-sm font-black text-amber-500 uppercase tracking-widest pb-1 border-b border-border/20">
                      📋 Reporte Original del Capitán Visitante
                    </h4>
                    
                    <div className="p-3 rounded-xl bg-card border border-border/40 text-center">
                      <span className="text-[11px] md:text-xs text-muted-foreground uppercase font-black block">Marcador Reportado</span>
                      <span className="text-base font-extrabold text-destructive">
                        {selectedConfirmMatch.reporte_visitante_completado && selectedConfirmMatch.reporte_visitante_stats
                          ? `${selectedConfirmMatch.reporte_visitante_stats.goles_local} - ${selectedConfirmMatch.reporte_visitante_stats.goles_visitante}`
                          : 'Sin Reporte'}
                      </span>
                    </div>

                    {/* Capturas de Pantalla */}
                    <div className="space-y-2">
                      <span className="text-[11px] md:text-xs font-black uppercase text-muted-foreground tracking-widest block">Evidencias (Fotos)</span>
                      {selectedConfirmMatch.reporte_visitante_completado && selectedConfirmMatch.reporte_visitante_stats?.fotos ? (
                        <div className="grid grid-cols-2 gap-2">
                          {['partido', 'conectados'].map((key) => {
                            const path = selectedConfirmMatch.reporte_visitante_stats.fotos[key];
                            if (!path) return <div key={key} className="h-16 flex items-center justify-center text-[10px] md:text-xs border border-dashed border-border/30 text-muted-foreground rounded bg-muted/5">Sin foto</div>;
                            return (
                              <a href={getImageUrl(path)} target="_blank" rel="noopener noreferrer" key={key} className="block group relative">
                                <img src={getImageUrl(path)} alt={key} className="w-full h-16 md:h-20 object-cover rounded border border-border/30 group-hover:scale-95 transition-transform" />
                                <span className="absolute bottom-0 inset-x-0 text-[9px] md:text-xs text-center bg-black/60 text-white font-bold py-0.5 rounded-b uppercase truncate">{key}</span>
                              </a>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No se subieron capturas.</p>
                      )}
                    </div>
                  </div>

                  {/* COLUMNA DERECHA: EDITOR OFICIAL VISITANTE */}
                  <div className="space-y-4 text-left">
                    <h4 className="text-xs md:text-sm font-black text-destructive uppercase tracking-widest pb-1 border-b border-border/20">
                      ✏️ Editor de Estadísticas Oficiales (Visitante)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-card p-3 rounded-xl border border-border/40">
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">Goles a Favor</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamVisitanteStats.goles_favor || 0} onChange={(e) => {
                          const val = Number(e.target.value);
                          setConfirmTeamVisitanteStats(prev => ({ ...prev, goles_favor: val }));
                          setConfirmScoreVisitante(String(val));
                          setConfirmTeamLocalStats(prev => ({ ...prev, goles_en_contra: val }));
                        }} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">Goles en Contra</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamVisitanteStats.goles_en_contra || 0} onChange={(e) => {
                          const val = Number(e.target.value);
                          setConfirmTeamVisitanteStats(prev => ({ ...prev, goles_en_contra: val }));
                          setConfirmScoreLocal(String(val));
                          setConfirmTeamLocalStats(prev => ({ ...prev, goles_favor: val }));
                        }} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">Asistencias</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamVisitanteStats.asistencias || 0} onChange={(e) => setConfirmTeamVisitanteStats({...confirmTeamVisitanteStats, asistencias: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">Tiros</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamVisitanteStats.tiros || 0} onChange={(e) => setConfirmTeamVisitanteStats({...confirmTeamVisitanteStats, tiros: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">Pases Intentados</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamVisitanteStats.pases_intentados || 0} onChange={(e) => setConfirmTeamVisitanteStats({...confirmTeamVisitanteStats, pases_intentados: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">Precisión Pases (%)</label>
                        <input type="number" min="0" max="100" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamVisitanteStats.precision_pases || 0} onChange={(e) => setConfirmTeamVisitanteStats({...confirmTeamVisitanteStats, precision_pases: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">Entradas Intent.</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamVisitanteStats.entradas_intentadas || 0} onChange={(e) => setConfirmTeamVisitanteStats({...confirmTeamVisitanteStats, entradas_intentadas: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">Entradas Exit.</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamVisitanteStats.entradas_exitosas || 0} onChange={(e) => setConfirmTeamVisitanteStats({...confirmTeamVisitanteStats, entradas_exitosas: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">Atajadas</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamVisitanteStats.atajadas || 0} onChange={(e) => setConfirmTeamVisitanteStats({...confirmTeamVisitanteStats, atajadas: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">T. Amarillas</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamVisitanteStats.tarjetas_amarillas || 0} onChange={(e) => setConfirmTeamVisitanteStats({...confirmTeamVisitanteStats, tarjetas_amarillas: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-xs font-black uppercase text-muted-foreground">T. Rojas</label>
                        <input type="number" min="0" className="w-full h-10 px-3 text-sm rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground focus:ring-1 focus:ring-primary" value={confirmTeamVisitanteStats.tarjetas_rojas || 0} onChange={(e) => setConfirmTeamVisitanteStats({...confirmTeamVisitanteStats, tarjetas_rojas: Number(e.target.value)})} />
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <span className="text-[11px] md:text-xs font-black uppercase text-muted-foreground tracking-widest block">Rendimiento Plantilla Visitante (Modificable)</span>
                      <div className="max-h-52 overflow-y-auto pr-1">
                        {confirmVisitantePlayers.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic text-center py-4">Sin datos de jugadores.</p>
                        ) : (
                          <div className="overflow-x-auto border border-border/40 rounded-xl bg-card">
                            <table className="w-full text-left border-collapse text-xs md:text-sm">
                              <thead>
                                <tr className="border-b border-border/30 bg-muted/30">
                                  <th className="p-2 font-bold text-muted-foreground uppercase text-left">Jugador</th>
                                  <th className="p-2 font-bold text-muted-foreground uppercase text-center w-16">Val.</th>
                                  <th className="p-2 font-bold text-muted-foreground uppercase text-center w-14">Goles</th>
                                  <th className="p-2 font-bold text-muted-foreground uppercase text-center w-14">Asist.</th>
                                  <th className="p-2 font-bold text-muted-foreground uppercase text-center w-10">🟨</th>
                                  <th className="p-2 font-bold text-muted-foreground uppercase text-center w-10">🟥</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/20">
                                {confirmVisitantePlayers.map((p, idx) => (
                                  <tr key={p.jugador_id || idx} className="hover:bg-muted/10">
                                    <td className="p-2 text-foreground font-bold truncate max-w-[100px]" title={p.name}>{p.name || 'Jugador'}</td>
                                    <td className="p-2 text-center">
                                      <input type="number" step="0.1" min="0" max="10" className="w-14 h-8 text-center rounded bg-background border border-border/60 font-mono text-xs md:text-sm font-bold text-foreground" value={p.valoracion || 6.0} onChange={(e) => { const c = [...confirmVisitantePlayers]; c[idx].valoracion = Number(e.target.value); setConfirmVisitantePlayers(c); }} title="Val" />
                                    </td>
                                    <td className="p-2 text-center">
                                      <input type="number" min="0" className="w-12 h-8 text-center rounded bg-background border border-border/60 font-mono text-xs md:text-sm font-bold text-foreground" value={p.goles || 0} onChange={(e) => { const c = [...confirmVisitantePlayers]; c[idx].goles = Number(e.target.value); setConfirmVisitantePlayers(c); }} title="Goles" />
                                    </td>
                                    <td className="p-2 text-center">
                                      <input type="number" min="0" className="w-12 h-8 text-center rounded bg-background border border-border/60 font-mono text-xs md:text-sm font-bold text-foreground" value={p.asistencias || 0} onChange={(e) => { const c = [...confirmVisitantePlayers]; c[idx].asistencias = Number(e.target.value); setConfirmVisitantePlayers(c); }} title="Asists" />
                                    </td>
                                    <td className="p-2 text-center">
                                      <input type="checkbox" checked={p.yellowCard || false} onChange={(e) => { const c = [...confirmVisitantePlayers]; c[idx].yellowCard = e.target.checked; setConfirmVisitantePlayers(c); }} className="w-4 h-4 md:w-5 md:h-5 rounded border-border/60 text-primary focus:ring-0" />
                                    </td>
                                    <td className="p-2 text-center">
                                      <input type="checkbox" checked={p.redCard || false} onChange={(e) => { const c = [...confirmVisitantePlayers]; c[idx].redCard = e.target.checked; setConfirmVisitantePlayers(c); }} className="w-4 h-4 md:w-5 md:h-5 rounded border-border/60 text-primary focus:ring-0" />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MARCADOR OFICIAL FINAL Y ACCIONES (GLOBAL) */}
            <div className="border-t border-border/30 pt-4 mt-6 space-y-4 text-left">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <label className="text-xs md:text-sm text-primary font-black uppercase tracking-wider block">Goles Local Oficial</label>
                    <input type="number" min="0" className="w-24 h-12 text-center text-xl rounded-xl bg-background border border-border/60 font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary" value={confirmScoreLocal} onChange={(e) => {
                      const val = e.target.value;
                      setConfirmScoreLocal(val);
                      const numVal = val !== '' ? Number(val) : 0;
                      setConfirmTeamLocalStats(prev => ({ ...prev, goles_favor: numVal }));
                      setConfirmTeamVisitanteStats(prev => ({ ...prev, goles_en_contra: numVal }));
                    }} />
                  </div>
                  <span className="text-xl font-black font-mono mt-4 text-muted-foreground">-</span>
                  <div className="space-y-1">
                    <label className="text-xs md:text-sm text-destructive font-black uppercase tracking-wider block">Goles Visitante Oficial</label>
                    <input type="number" min="0" className="w-24 h-12 text-center text-xl rounded-xl bg-background border border-border/60 font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-destructive" value={confirmScoreVisitante} onChange={(e) => {
                      const val = e.target.value;
                      setConfirmScoreVisitante(val);
                      const numVal = val !== '' ? Number(val) : 0;
                      setConfirmTeamVisitanteStats(prev => ({ ...prev, goles_favor: numVal }));
                      setConfirmTeamLocalStats(prev => ({ ...prev, goles_en_contra: numVal }));
                    }} />
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <Button onClick={() => setIsConfirmModalOpen(false)} variant="outline" className="h-11 px-4 text-xs md:text-sm font-bold" disabled={confirmProcessing}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmReportSubmit}
                    isLoading={confirmProcessing}
                    className="h-11 px-5 text-xs md:text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-display font-black uppercase tracking-wider shadow-lg border-none"
                  >
                    🛡️ Confirmar Ficha y Cerrar Partido
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <PageHelp 
        title="Partidos Ultimate Team (UT)"
        description="Aquí gestionas y válidas todos los marcadores oficiales de tus torneos de UT (Duplas / 2v2)."
        steps={[
          {
            title: "Reportes Pendientes",
            description: "Usa la pestaña 'Por Reportar' para ver qué partidos ya se jugaron según el calendario pero nadie ha subido el resultado."
          },
          {
            title: "Ficha / Reportar Manual",
            description: "Haz clic en 'Ficha / Reportar' para ingresar goles y estadísticas. Puedes hacerlo a mano o sincronizar con la API de EA si los capitanes introdujeron los IDs correctos."
          },
          {
            title: "Verificación de Estadísticas",
            description: "Antes de aprobar un partido reportado por los capitanes, revisa la pestaña 'Pendientes' para cotejar fotos e información."
          }
        ]}
      />
    </div>
  );
}

