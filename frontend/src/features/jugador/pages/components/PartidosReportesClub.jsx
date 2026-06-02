import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/shared/Alert';
import DataTable from '@/components/ui/DataTable';
import CrudHeader from '@/components/shared/CrudHeader';
import api from '@/api/axios';

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

  // Manual Input States
  const [statsScoreLocal, setStatsScoreLocal] = useState('');
  const [statsScoreVisitante, setStatsScoreVisitante] = useState('');
  const [teamLocalStats, setTeamLocalStats] = useState({ shots: 10, possession: 50, corners: 4, fouls: 5 });
  const [teamVisitanteStats, setTeamVisitanteStats] = useState({ shots: 10, possession: 50, corners: 4, fouls: 5 });
  const [playerStats, setPlayerStats] = useState([]);
  const [manualProcessing, setManualProcessing] = useState(false);

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
  }, [partidos, activeTab, selectedTemporada, selectedCompetencia, searchTerm]);

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
    setReportMethod('ea'); // Método recomendado por defecto
    setEaMatches([]);
    setEaError(null);
    setSelectedEaMatchId('');
    setEaClubLocalId('');
    setEaClubVisitanteId('');
    setEaAlertEmpate(false);

    // Inicializar estadísticas manuales vacías de jugadores
    const mappedPlayers = roster.map(member => {
      const userObj = member.usuario || member;
      return {
        id: userObj.id,
        name: userObj.gamertag || userObj.name || 'Jugador',
        goals: 0,
        assists: 0,
        yellowCard: false,
        redCard: false
      };
    });
    setPlayerStats(mappedPlayers);
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
  const handleEaReportSubmit = async () => {
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
      alert("❌ Error de validación: Los IDs de Club mapeados no corresponden a los del partido oficial.");
      return;
    }

    setEaProcessing(true);
    try {
      const res = await api.post(`/partidos/${selectedMatch.id}/ea-report`, {
        ea_match_id: selectedEaMatchId,
        club_local_id: eaClubLocalId,
        club_visitante_id: eaClubVisitanteId
      });

      if (res.data && res.data.success) {
        setSuccessMsg("🎉 ¡Partido reportado exitosamente con datos de la API de EA Sports!");
        setIsStatsModalOpen(false);
        fetchPartidos();
      }
    } catch (err) {
      alert("❌ Error al procesar reporte de EA: " + (err.response?.data?.message || err.message));
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
      const res = await api.put(`/partidos/${selectedMatch.id}`, {
        goles_local: Number(statsScoreLocal),
        goles_visitante: Number(statsScoreVisitante),
        stats: {
          teamLocal: teamLocalStats,
          teamVisitante: teamVisitanteStats,
          players: playerStats
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

  // Columnas para DataTable
  const columnas = useMemo(() => [
    {
      header: 'Partido / Encuentro',
      render: (row) => {
        const backendBaseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:8000';
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
              🛡️ Ficha / Reportar
            </Button>
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
  ], [navigate]);

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
                <p className="text-[10px] text-muted-foreground mt-0.5">Elige un método para sincronizar las estadísticas tácticas.</p>
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
                                alert("⚠️ Los clubes de este partido en EA Sports no corresponden a los del partido oficial. Por favor selecciona el correcto.");
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

                <div className="flex gap-2 justify-end pt-3">
                  <Button onClick={() => setIsStatsModalOpen(false)} variant="outline" className="h-10 text-[10px]">Cancelar</Button>
                  <Button 
                    onClick={handleEaReportSubmit}
                    isLoading={eaProcessing}
                    disabled={!selectedEaMatchId || eaLoading}
                    className="h-10 text-[10px] bg-gradient-to-r from-primary to-destructive text-primary-foreground border-none font-display font-black uppercase tracking-wider shadow-lg"
                  >
                    ⚽ Confirmar Reporte EA
                  </Button>
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* OPCION 2: ENTRADA MANUAL                  */}
            {/* ========================================== */}
            {reportMethod === 'manual' && (
              <div className="space-y-5">
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

                <div className="grid grid-cols-2 gap-4 border-t border-border/30 pt-3">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Estadísticas Local</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-muted-foreground">Tiros</label>
                        <input type="number" className="w-full h-8 px-2 text-xs rounded bg-background border border-border/60 text-center font-mono font-bold" value={teamLocalStats.shots} onChange={(e) => setTeamLocalStats({...teamLocalStats, shots: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-muted-foreground">Posesión %</label>
                        <input type="number" className="w-full h-8 px-2 text-xs rounded bg-background border border-border/60 text-center font-mono font-bold" value={teamLocalStats.possession} onChange={(e) => setTeamLocalStats({...teamLocalStats, possession: Number(e.target.value)})} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Estadísticas Visitante</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-muted-foreground">Tiros</label>
                        <input type="number" className="w-full h-8 px-2 text-xs rounded bg-background border border-border/60 text-center font-mono font-bold" value={teamVisitanteStats.shots} onChange={(e) => setTeamVisitanteStats({...teamVisitanteStats, shots: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-muted-foreground">Posesión %</label>
                        <input type="number" className="w-full h-8 px-2 text-xs rounded bg-background border border-border/60 text-center font-mono font-bold" value={teamVisitanteStats.possession} onChange={(e) => setTeamVisitanteStats({...teamVisitanteStats, possession: Number(e.target.value)})} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-border/30 pt-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Rendimiento de Plantilla ({equipo.nombre})</h4>
                  <div className="max-h-48 overflow-y-auto border border-border/40 rounded-xl bg-muted/5 divide-y divide-border/20 pr-1">
                    {playerStats.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground text-center py-4">No hay jugadores registrados en el roster.</p>
                    ) : (
                      playerStats.map((p, idx) => (
                        <div key={p.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2.5 gap-2 text-[11px] font-semibold">
                          <span className="text-foreground font-bold truncate w-28 text-left">{p.name}</span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] uppercase text-muted-foreground">Goles:</span>
                              <input type="number" min="0" value={p.goals} onChange={(e) => { const c = [...playerStats]; c[idx].goals = Number(e.target.value); setPlayerStats(c); }} className="w-10 h-7 text-center rounded bg-background border border-border/60 font-mono font-bold" />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] uppercase text-muted-foreground">Asists:</span>
                              <input type="number" min="0" value={p.assists} onChange={(e) => { const c = [...playerStats]; c[idx].assists = Number(e.target.value); setPlayerStats(c); }} className="w-10 h-7 text-center rounded bg-background border border-border/60 font-mono font-bold" />
                            </div>
                            <div className="flex gap-2">
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input type="checkbox" checked={p.yellowCard} onChange={(e) => { const c = [...playerStats]; c[idx].yellowCard = e.target.checked; setPlayerStats(c); }} className="w-3.5 h-3.5 rounded border-border/60 text-primary" />
                                <span className="text-[8px] font-black text-amber-500">🟨</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input type="checkbox" checked={p.redCard} onChange={(e) => { const c = [...playerStats]; c[idx].redCard = e.target.checked; setPlayerStats(c); }} className="w-3.5 h-3.5 rounded border-border/60 text-primary" />
                                <span className="text-[8px] font-black text-destructive">🟥</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <Button onClick={() => setIsStatsModalOpen(false)} variant="outline" className="h-10 text-[10px]">Cancelar</Button>
                  <Button onClick={handleManualReportSubmit} isLoading={manualProcessing} className="h-10 text-[10px] bg-primary border-none text-primary-foreground font-display font-black uppercase tracking-wider shadow-lg">💾 Enviar Reporte Manual</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
