import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '@/components/ui/DataTable';
import CrudHeader from '@/components/shared/CrudHeader';
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
  
  // Plantilla oficial cargada bajo demanda para estadísticas de jugadores (capitán + compañero)
  const [localRoster, setLocalRoster] = useState([]);
  const [visitanteRoster, setVisitanteRoster] = useState([]);
  const [localPlayerStats, setLocalPlayerStats] = useState([]);
  const [visitantePlayerStats, setVisitantePlayerStats] = useState([]);
  const [manualProcessing, setManualProcessing] = useState(false);

  const fetchPartidos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/partidos-ut', { params: { for_organizer: true } });
      setPartidos(res.data || []);
    } catch (err) {
      console.error("Error al obtener partidos UT:", err);
      setError("No se pudieron obtener los partidos oficiales de Ultimate Team.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartidos();
  }, []);

  // Cargar duplas (capitán y compañero) bajo demanda para reporte manual
  useEffect(() => {
    if (selectedMatch && reportMethod === 'manual') {
      const lRoster = [];
      if (selectedMatch.local?.capitan) {
        lRoster.push({
          id: selectedMatch.local.capitan.id,
          name: selectedMatch.local.capitan.gamertag || selectedMatch.local.capitan.name || 'Capitán Local'
        });
      }
      if (selectedMatch.local?.companero) {
        lRoster.push({
          id: selectedMatch.local.companero.id,
          name: selectedMatch.local.companero.gamertag || selectedMatch.local.companero.name || 'Compañero Local'
        });
      }
      setLocalRoster(lRoster);
      setLocalPlayerStats(lRoster.map(p => ({
        id: p.id,
        name: p.name,
        equipo_id: selectedMatch.equipo_ut_local_id,
        goals: 0,
        assists: 0,
        yellowCard: false,
        redCard: false,
        posicion: 'DEL'
      })));

      const vRoster = [];
      if (selectedMatch.visitante?.capitan) {
        vRoster.push({
          id: selectedMatch.visitante.capitan.id,
          name: selectedMatch.visitante.capitan.gamertag || selectedMatch.visitante.capitan.name || 'Capitán Visitante'
        });
      }
      if (selectedMatch.visitante?.companero) {
        vRoster.push({
          id: selectedMatch.visitante.companero.id,
          name: selectedMatch.visitante.companero.gamertag || selectedMatch.visitante.companero.name || 'Compañero Visitante'
        });
      }
      setVisitanteRoster(vRoster);
      setVisitantePlayerStats(vRoster.map(p => ({
        id: p.id,
        name: p.name,
        equipo_id: selectedMatch.equipo_ut_visitante_id,
        goals: 0,
        assists: 0,
        yellowCard: false,
        redCard: false,
        posicion: 'DEL'
      })));
    }
  }, [selectedMatch, reportMethod]);

  // Abrir Modal de Reporte
  const openReportModal = async (match) => {
    setSelectedMatch(match);
    setStatsScoreLocal(match.goles_local !== null ? String(match.goles_local) : '');
    setStatsScoreVisitante(match.goles_visitante !== null ? String(match.goles_visitante) : '');
    setReportMethod('ea');
    setEaMatches([]);
    setEaError(null);
    setSelectedEaMatchId('');
    setEaClubLocalId('');
    setEaClubVisitanteId('');
    setEaAlertEmpate(false);
    setEaWarnings(null);
    setLocalRoster([]);
    setVisitanteRoster([]);
    setLocalPlayerStats([]);
    setVisitantePlayerStats([]);

    setIsStatsModalOpen(true);

    // Intentar pre-cargar partidos de EA
    setEaLoading(true);
    try {
      const res = await api.get(`/partidos-ut/${match.id}/ea-matches`);
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
      setEaError(err.response?.data?.message || "No se pudo conectar a la API de EA. Asegúrate de configurar los IDs de Club de EA.");
    } finally {
      setEaLoading(false);
    }
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
        setSuccessMsg("🎉 ¡Partido UT reportado exitosamente con datos de la API de EA Sports!");
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
          players: [...localPlayerStats, ...visitantePlayerStats]
        }
      });

      if (res.data) {
        setSuccessMsg("🎉 ¡Marcador y estadísticas UT reportadas manualmente con éxito!");
        setIsStatsModalOpen(false);
        fetchPartidos();
      }
    } catch (err) {
      alert("❌ Error al enviar el reporte manual: " + (err.response?.data?.message || err.message));
    } finally {
      setManualProcessing(false);
    }
  };

  // Tabs de CrudHeader
  const tabsConfig = useMemo(() => [
    { id: 'todos', label: 'Todos los Partidos', icon: '🏟️' },
    { id: 'por_reportar', label: 'Por Reportar', icon: '🚨' },
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
      // Filtro de Pestaña
      const yaReportado = p.goles_local !== null && p.goles_visitante !== null;
      if (activeTab === 'pendiente' && yaReportado) return false;
      if (activeTab === 'finalizado' && !yaReportado) return false;

      if (activeTab === 'por_reportar') {
        if (yaReportado) return false;
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
      if (selectedCompetencia !== 'todos' && p.competencia_ut_id !== Number(selectedCompetencia)) {
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
      header: 'Partido UT / Encuentro',
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
              <Badge variant="neutral" className="font-mono">LOC</Badge>
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
              <Badge variant="neutral" className="font-mono">VIS</Badge>
            )}
          </div>
        );
      }
    },
    {
      header: 'Torneo UT / Competencia',
      render: (row) => (
        <span className="text-xs font-bold text-foreground uppercase truncate max-w-[150px]">
          🎮 {row.competencia?.nombre || 'Competencia UT'}
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
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => openReportModal(row)}
              className="h-8 px-3 text-[10px] bg-gradient-to-r from-primary to-destructive text-primary-foreground border-none font-display font-black uppercase tracking-wider shadow-md whitespace-nowrap shrink-0"
            >
              🎮 Ficha UT / Reportar
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/partidos-ut/${row.id}`)}
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
        title="Partidos y Calendarios UT (1v1/2v2)"
        description="Monitorea y reporta los marcadores e incidentes oficiales de las competencias Ultimate Team."
        buttonText={null}
        tabs={tabsConfig}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          setSearchTerm('');
          setCurrentPage(1);
        }}
      />

      {/* SECCIÓN DE FILTROS ADICIONALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-border/50 bg-card/25 backdrop-blur-md p-4 rounded-xl shadow-sm">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">📅 Filtrar por Temporada</label>
          <select
            value={selectedTemporada}
            onChange={(e) => {
              setSelectedTemporada(e.target.value);
              setSelectedCompetencia('todos');
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
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">🏆 Filtrar por Competencia UT</label>
          <select
            value={selectedCompetencia}
            onChange={(e) => {
              setSelectedCompetencia(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-10 px-3 text-xs bg-muted/30 border border-border/60 rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer font-bold"
          >
            <option value="todos">Todas las Competencias UT</option>
            {competenciasFiltradas.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative">
        <DataTable 
          title={`Lista de Partidos UT (${filteredData.length})`}
          columns={columnas}
          data={paginatedData}
          searchPlaceholder="Buscar por equipo UT o torneo..."
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
                  🛡️ Reportar Ficha del Encuentro UT
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Reporte administrativo del encuentro oficial de UT.</p>
              </div>

              {/* Selector de Pestañas del Reporte */}
              <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border border-border/40 shrink-0">
                <button 
                  onClick={() => setReportMethod('ea')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 ${reportMethod === 'ea' ? 'bg-background text-primary shadow-sm border border-border/20' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  🎮 EA Sports API
                </button>
                <button 
                  onClick={() => setReportMethod('manual')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors ${reportMethod === 'manual' ? 'bg-background text-primary shadow-sm border border-border/20' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  📝 Entrada Manual
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
                    <span className="text-[10px] font-bold tracking-widest text-primary uppercase animate-pulse">Sincronizando con EA Sports...</span>
                  </div>
                )}

                {/* Error de EA API */}
                {!eaLoading && eaError && (
                  <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      ⚠️ No se pudo obtener información de EA Sports
                  </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {eaError}
                    </p>
                    <div className="text-[10px] text-amber-500 font-semibold bg-amber-500/10 p-2.5 rounded-lg">
                      💡 Asegúrate de que los clubes de UT tengan registrado su <strong>ID de Club de EA</strong> en su configuración antes de reportar.
                    </div>
                  </div>
                )}

                {/* No Matches */}
                {!eaLoading && !eaError && eaMatches.length === 0 && (
                  <div className="text-center py-10 border border-dashed border-border/50 rounded-2xl bg-muted/5 space-y-2">
                    <div className="text-3xl">🎮</div>
                    <p className="text-xs font-bold text-foreground">Sin amistosos recientes en EA</p>
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
                          
                          // Buscar el partido y comprobar si hay empate en goles
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
                              const isMatch0Visit = key0 === dbVisitEaId;
                              const isMatch1Visit = key1 === dbVisitEaId;
                              
                              const hasLocal = isMatch0Local || isMatch1Local;
                              const hasVisit = isMatch0Visit || isMatch1Visit;
                              
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
                              
                              // Asignar determinando quién es quién
                              if (isMatch0Local) {
                                setEaClubLocalId(key0);
                                setEaClubVisitanteId(key1);
                              } else {
                                setEaClubLocalId(key1);
                                setEaClubVisitanteId(key0);
                              }

                              const goalsL = Number(matchObj.clubs[keys[0]]?.goals || 0);
                              const goalsV = Number(matchObj.clubs[keys[1]]?.goals || 0);
                              
                              if (goalsL === goalsV) {
                                setEaAlertEmpate(true);
                              } else {
                                setEaAlertEmpate(false);
                              }
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

                    {/* Alerta de Empate detectado en EA */}
                    {eaAlertEmpate && (
                      <Alert variant="warning" className="text-xs">
                        <strong>⚠️ Empate Detectado en EA Sports API:</strong> Las copas o ligas no admiten empates absolutos. Te recomendamos **cambiar a la pestaña de "Entrada Manual"** para registrar los penales o marcador de desempate oficial junto con las estadísticas de la dupla.
                      </Alert>
                    )}

                    {selectedEaMatchId && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-border/40 bg-muted/10 rounded-xl p-4">
                        <div className="space-y-1">
                          <label className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">
                            ID Club EA Local (Asociado)
                          </label>
                          <input
                            type="text"
                            readOnly
                            className="w-full h-9 px-3 text-xs rounded-lg bg-background/50 border border-border/60 text-muted-foreground font-mono"
                            value={eaClubLocalId}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">
                            ID Club EA Visitante (Asociado)
                          </label>
                          <input
                            type="text"
                            readOnly
                            className="w-full h-9 px-3 text-xs rounded-lg bg-background/50 border border-border/60 text-muted-foreground font-mono"
                            value={eaClubVisitanteId}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Warnings de Jugadores No Registrados */}
                {eaWarnings && (
                  <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-4 space-y-3 animate-fade-in">
                    <p className="text-xs font-bold text-red-400 flex items-center gap-1.5 uppercase font-display tracking-wide">
                      🚨 Advertencia de Inscripción de Jugadores UT
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Los siguientes jugadores que participaron en el encuentro de EA Sports no están registrados correctamente en el sistema:
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
                      💡 Asegúrate de que las duplas tengan registrados sus Gamertags/EA IDs correctos en su perfil.
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
                  <Button onClick={() => setIsStatsModalOpen(false)} variant="outline" className="h-10 text-[10px]">
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => handleEaReportSubmit(false)}
                    isLoading={eaProcessing}
                    disabled={!selectedEaMatchId || eaLoading || eaWarnings !== null}
                    className="h-10 text-[10px] bg-gradient-to-r from-primary to-destructive text-primary-foreground border-none font-display font-black uppercase tracking-wider shadow-lg"
                  >
                    ⚽ Sincronizar Ficha EA UT
                  </Button>
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* OPCION 2: ENTRADA MANUAL                  */}
            {/* ========================================== */}
            {reportMethod === 'manual' && (
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

                {/* Estadísticas de Jugadores de ambas duplas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/30 pt-3">
                  {/* LOCAL */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary truncate">Integrantes {selectedMatch.local?.nombre || 'Local'}</h4>
                    <div className="max-h-48 overflow-y-auto border border-border/40 rounded-xl bg-muted/5 divide-y divide-border/20 pr-1">
                      {localPlayerStats.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground text-center py-4">No hay duplas registradas en el equipo local.</p>
                      ) : (
                        localPlayerStats.map((p, idx) => (
                          <div key={p.id} className="flex justify-between items-center p-2.5 gap-2 text-[10px] font-semibold">
                            <span className="text-foreground font-bold truncate w-24 text-left">{p.name}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <input 
                                type="number" 
                                min="0"
                                value={p.goals} 
                                onChange={(e) => {
                                  const clone = [...localPlayerStats];
                                  clone[idx].goals = Number(e.target.value);
                                  setLocalPlayerStats(clone);
                                }}
                                className="w-8 h-6 text-center rounded bg-background border border-border/60 font-mono font-bold"
                                title="Goles"
                                placeholder="G"
                              />
                              <input 
                                type="number" 
                                min="0"
                                value={p.assists} 
                                onChange={(e) => {
                                  const clone = [...localPlayerStats];
                                  clone[idx].assists = Number(e.target.value);
                                  setLocalPlayerStats(clone);
                                }}
                                className="w-8 h-6 text-center rounded bg-background border border-border/60 font-mono font-bold"
                                title="Asistencias"
                                placeholder="A"
                              />
                              <label className="flex items-center cursor-pointer" title="Tarjeta Amarilla">
                                <input 
                                  type="checkbox"
                                  checked={p.yellowCard}
                                  onChange={(e) => {
                                    const clone = [...localPlayerStats];
                                    clone[idx].yellowCard = e.target.checked;
                                    setLocalPlayerStats(clone);
                                  }}
                                  className="w-3.5 h-3.5 rounded border-border/60 text-primary"
                                />
                                <span className="text-[10px] ml-0.5">🟨</span>
                              </label>
                              <label className="flex items-center cursor-pointer" title="Tarjeta Roja">
                                <input 
                                  type="checkbox"
                                  checked={p.redCard}
                                  onChange={(e) => {
                                    const clone = [...localPlayerStats];
                                    clone[idx].redCard = e.target.checked;
                                    setLocalPlayerStats(clone);
                                  }}
                                  className="w-3.5 h-3.5 rounded border-border/60 text-primary"
                                />
                                <span className="text-[10px] ml-0.5">🟥</span>
                              </label>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* VISITANTE */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary truncate">Integrantes {selectedMatch.visitante?.nombre || 'Visitante'}</h4>
                    <div className="max-h-48 overflow-y-auto border border-border/40 rounded-xl bg-muted/5 divide-y divide-border/20 pr-1">
                      {visitantePlayerStats.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground text-center py-4">No hay duplas registradas en el equipo visitante.</p>
                      ) : (
                        visitantePlayerStats.map((p, idx) => (
                          <div key={p.id} className="flex justify-between items-center p-2.5 gap-2 text-[10px] font-semibold">
                            <span className="text-foreground font-bold truncate w-24 text-left">{p.name}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <input 
                                type="number" 
                                min="0"
                                value={p.goals} 
                                onChange={(e) => {
                                  const clone = [...visitantePlayerStats];
                                  clone[idx].goals = Number(e.target.value);
                                  setVisitantePlayerStats(clone);
                                }}
                                className="w-8 h-6 text-center rounded bg-background border border-border/60 font-mono font-bold"
                                title="Goles"
                                placeholder="G"
                              />
                              <input 
                                type="number" 
                                min="0"
                                value={p.assists} 
                                onChange={(e) => {
                                  const clone = [...visitantePlayerStats];
                                  clone[idx].assists = Number(e.target.value);
                                  setVisitantePlayerStats(clone);
                                }}
                                className="w-8 h-6 text-center rounded bg-background border border-border/60 font-mono font-bold"
                                title="Asistencias"
                                placeholder="A"
                              />
                              <label className="flex items-center cursor-pointer" title="Tarjeta Amarilla">
                                <input 
                                  type="checkbox"
                                  checked={p.yellowCard}
                                  onChange={(e) => {
                                    const clone = [...visitantePlayerStats];
                                    clone[idx].yellowCard = e.target.checked;
                                    setVisitantePlayerStats(clone);
                                  }}
                                  className="w-3.5 h-3.5 rounded border-border/60 text-primary"
                                />
                                <span className="text-[10px] ml-0.5">🟨</span>
                              </label>
                              <label className="flex items-center cursor-pointer" title="Tarjeta Roja">
                                <input 
                                  type="checkbox"
                                  checked={p.redCard}
                                  onChange={(e) => {
                                    const clone = [...visitantePlayerStats];
                                    clone[idx].redCard = e.target.checked;
                                    setVisitantePlayerStats(clone);
                                  }}
                                  className="w-3.5 h-3.5 rounded border-border/60 text-primary"
                                />
                                <span className="text-[10px] ml-0.5">🟥</span>
                              </label>
                            </div>
                          </div>
                        ))
                      )}
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
                    💾 Enviar Reporte Manual UT
                  </Button>
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
        title="⚠️ Discrepancia de Clubes EA Sports UT"
        maxWidth="max-w-lg"
        zIndex="z-[130]"
      >
        <div className="space-y-4">
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl">
            <p className="text-xs text-destructive-foreground font-semibold leading-relaxed">
              Los clubes detectados en el partido de EA Sports no corresponden con los clubes del partido oficial programado. Por favor, selecciona el partido correcto o verifica los IDs en la configuración.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Partido Programado Oficial */}
            <div className="space-y-2.5 p-3 rounded-xl bg-card border border-border/45">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-wider border-b border-border/20 pb-1">
                📌 Partido Programado (DB)
              </h4>
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-[9px] text-muted-foreground block uppercase font-bold">Local</span>
                  <span className="font-bold text-foreground truncate block">{eaMismatchModal?.expectedLocal}</span>
                  <code className="block text-[10px] text-primary/80 font-mono mt-0.5">ID EA: {eaMismatchModal?.expectedLocalId || 'Sin ID'}</code>
                </div>
                <div className="pt-1.5 border-t border-border/10">
                  <span className="text-[9px] text-muted-foreground block uppercase font-bold">Visitante</span>
                  <span className="font-bold text-foreground truncate block">{eaMismatchModal?.expectedVisitante}</span>
                  <code className="block text-[10px] text-primary/80 font-mono mt-0.5">ID EA: {eaMismatchModal?.expectedVisitanteId || 'Sin ID'}</code>
                </div>
              </div>
            </div>

            {/* Partido Detectado en EA */}
            <div className="space-y-2.5 p-3 rounded-xl bg-muted/10 border border-border/45">
              <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-wider border-b border-border/20 pb-1">
                🎮 Detectado en EA Sports
              </h4>
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-[9px] text-muted-foreground block uppercase font-bold">Club A</span>
                  <span className="font-bold text-amber-400 truncate block">{eaMismatchModal?.receivedLocal}</span>
                  <code className="block text-[10px] text-amber-500/80 font-mono mt-0.5">ID EA: {eaMismatchModal?.receivedLocalId}</code>
                </div>
                <div className="pt-1.5 border-t border-border/10">
                  <span className="text-[9px] text-muted-foreground block uppercase font-bold">Club B</span>
                  <span className="font-bold text-amber-400 truncate block">{eaMismatchModal?.receivedVisitante}</span>
                  <code className="block text-[10px] text-amber-500/80 font-mono mt-0.5">ID EA: {eaMismatchModal?.receivedVisitanteId}</code>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              onClick={() => setEaMismatchModal(null)} 
              className="px-4 py-2 text-xs bg-muted/30 border border-border/60 hover:bg-muted text-foreground font-bold rounded-lg transition-all"
            >
              Entendido
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
