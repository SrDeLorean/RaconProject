import React, { useState, useEffect, useMemo } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Card from '@/components/shared/Card';
import Alert from '@/components/shared/Alert';
import api from '@/api/axios';

export default function PartidosReportesClub({ equipo, roster }) {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [filtroCompetencia, setFiltroCompetencia] = useState('todos');

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
      console.error("Error al obtener partidos:", err);
      setError("No se pudo cargar la lista de partidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (equipo?.id) {
      fetchPartidos();
    }
  }, [equipo?.id]);

  // Lista única de competencias para el filtro
  const competenciasDisponibles = useMemo(() => {
    const list = partidos.map(p => p.competencia).filter(Boolean);
    const unique = [];
    const map = new Map();
    for (const item of list) {
      if(!map.has(item.id)) {
        map.set(item.id, true);
        unique.push(item);
      }
    }
    return unique;
  }, [partidos]);

  // Filtrar partidos
  const partidosFiltrados = useMemo(() => {
    return partidos.filter(p => {
      if (filtroCompetencia === 'todos') return true;
      return p.competencia_id === Number(filtroCompetencia);
    });
  }, [partidos, filtroCompetencia]);

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
    // Mapeamos los jugadores del Roster
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

    setEaProcessing(true);
    try {
      const res = await api.post(`/partidos/${selectedMatch.id}/ea-report`, {
        ea_match_id: selectedEaMatchId,
        club_local_id: eaClubLocalId,
        club_visitante_id: eaClubVisitanteId
      });

      if (res.data && res.data.success) {
        alert("🎉 ¡Partido reportado exitosamente con datos de la API de EA Sports!");
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
        alert("🎉 ¡Marcador y estadísticas reportadas manualmente con éxito!");
        setIsStatsModalOpen(false);
        fetchPartidos();
      }
    } catch (err) {
      alert("❌ Error al enviar el reporte manual: " + (err.response?.data?.message || err.message));
    } finally {
      setManualProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* CABECERA & ACCIÓN DE FILTRO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/20 pb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Reportes y Calendario Oficial</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Controla las jornadas de tu franquicia y sube las fichas de partidos oficiales.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <label className="text-[10px] font-black uppercase text-muted-foreground whitespace-nowrap">Torneo:</label>
          <select
            value={filtroCompetencia}
            onChange={(e) => setFiltroCompetencia(e.target.value)}
            className="h-9 px-3 text-xs bg-muted/30 border border-border/60 rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer w-full md:w-48 font-bold"
          >
            <option value="todos">Todas las Competencias</option>
            {competenciasDisponibles.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* LISTADO DE PARTIDOS */}
      {loading ? (
        <div className="min-h-[200px] flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <span className="text-xs text-muted-foreground animate-pulse">Cargando cronogramas...</span>
        </div>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : partidosFiltrados.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border/50 rounded-2xl bg-muted/5 space-y-2">
          <div className="text-3xl">📅</div>
          <p className="text-xs font-bold text-foreground">Sin encuentros oficiales</p>
          <p className="text-[10px] text-muted-foreground">Tu club no tiene partidos registrados en la competencia seleccionada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {partidosFiltrados.map(p => {
            const yaReportado = p.goles_local !== null && p.goles_visitante !== null;
            const esLocal = p.equipo_local_id === equipo.id;
            const rival = esLocal ? p.visitante : p.local;
            const miMarcador = esLocal ? p.goles_local : p.goles_visitante;
            const rivalMarcador = esLocal ? p.goles_visitante : p.goles_local;

            return (
              <Card 
                key={p.id}
                className={`p-4 border transition-all duration-300 relative overflow-hidden ${
                  yaReportado 
                    ? 'border-emerald-500/20 bg-emerald-500/5' 
                    : 'border-border/60 hover:border-primary/40 bg-background/50'
                }`}
                withGlow={!yaReportado}
              >
                {/* DETALLE JORNADA */}
                <div className="flex justify-between items-center gap-2 mb-3">
                  <span className="text-[9px] bg-primary/10 text-primary border border-primary/25 font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                    {p.jornada} {p.grupo ? `• Grupo ${p.grupo}` : ''}
                  </span>
                  <div className="text-right font-mono text-[9px] text-muted-foreground">
                    📅 {p.fecha || 'Sin fecha'} • 🕒 {p.hora || '22:00'}
                  </div>
                </div>

                {/* ENFRENTAMIENTO DE MARCADOR */}
                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="flex items-center gap-2.5 max-w-[40%]">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-destructive/10 border border-primary/20 flex items-center justify-center font-display font-black text-xs text-primary shadow-inner">
                      {p.local?.abreviatura || 'LOC'}
                    </div>
                    <span className="text-xs font-black text-foreground truncate">{p.local?.nombre || 'Equipo Local'}</span>
                  </div>

                  {/* RESULTADO O VS */}
                  <div className="flex flex-col items-center shrink-0">
                    <span className={`text-sm font-mono font-black px-4 py-1 rounded border ${
                      yaReportado 
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                        : 'text-primary bg-primary/10 border-primary/20'
                    }`}>
                      {yaReportado ? `${p.goles_local} - ${p.goles_visitante}` : 'VS'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 max-w-[40%] flex-row-reverse text-right">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-destructive/10 border border-primary/20 flex items-center justify-center font-display font-black text-xs text-primary shadow-inner">
                      {p.visitante?.abreviatura || 'VIS'}
                    </div>
                    <span className="text-xs font-black text-foreground truncate">{p.visitante?.nombre || 'Equipo Visitante'}</span>
                  </div>
                </div>

                {/* COMPETICION Y ACCIONES */}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/30 gap-2">
                  <span className="text-[10px] text-muted-foreground font-semibold truncate max-w-[60%]">
                    🏆 {p.competencia?.nombre}
                  </span>
                  
                  {yaReportado ? (
                    <Badge variant="success">✅ Reportado</Badge>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={() => openReportModal(p)}
                      className="h-8 px-3 text-[10px] bg-gradient-to-r from-primary to-destructive text-primary-foreground font-display font-black uppercase tracking-wider shadow-md border-none shrink-0"
                    >
                      🛡️ Reportar Partido
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

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
                    <span className="text-[10px] font-bold tracking-widest text-primary uppercase animate-pulse">Estableciendo enlace de satélite con EA...</span>
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
                          
                          // Buscar el partido y comprobar si hay empate en goles
                          const matchObj = eaMatches.find(m => m.matchId === mId);
                          if (matchObj && matchObj.clubs) {
                            const keys = Object.keys(matchObj.clubs);
                            if (keys.length === 2) {
                              const localClubEaId = selectedMatch.local?.club_id_ea;
                              if (String(keys[0]) === String(localClubEaId)) {
                                setEaClubLocalId(keys[0]);
                                setEaClubVisitanteId(keys[1]);
                              } else {
                                setEaClubLocalId(keys[1]);
                                setEaClubVisitanteId(keys[0]);
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
                        <strong>⚠️ Empate Detectado en EA Sports API:</strong> Las ligas oficiales o copas de eliminación directa no admiten empates absolutos. Si este partido se definió en penales o tiempo extra, te recomendamos **cambiar a la pestaña de "Entrada Manual"** para registrar los penales o marcador de desempate oficial junto con las estadísticas.
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

                {/* Botones */}
                <div className="flex gap-2 justify-end pt-3">
                  <Button onClick={() => setIsStatsModalOpen(false)} variant="outline" className="h-10 text-[10px]">
                    Cancelar
                  </Button>
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

                {/* Estadísticas de Jugadores de nuestra plantilla */}
                <div className="space-y-2 border-t border-border/30 pt-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Ficha de Rendimiento de nuestra Plantilla ({equipo.nombre})</h4>
                  
                  <div className="max-h-48 overflow-y-auto border border-border/40 rounded-xl bg-muted/5 divide-y divide-border/20 pr-1">
                    {playerStats.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground text-center py-4">No hay jugadores registrados en la plantilla para reportar estadisticas.</p>
                    ) : (
                      playerStats.map((p, idx) => (
                        <div key={p.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2.5 gap-2 text-[11px] font-semibold">
                          <span className="text-foreground font-bold truncate w-28 text-left">{p.name}</span>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] uppercase text-muted-foreground">Goles:</span>
                              <input 
                                type="number" 
                                min="0"
                                value={p.goals} 
                                onChange={(e) => {
                                  const clone = [...playerStats];
                                  clone[idx].goals = Number(e.target.value);
                                  setPlayerStats(clone);
                                }}
                                className="w-10 h-7 text-center rounded bg-background border border-border/60 font-mono font-bold"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] uppercase text-muted-foreground">Asists:</span>
                              <input 
                                type="number" 
                                min="0"
                                value={p.assists} 
                                onChange={(e) => {
                                  const clone = [...playerStats];
                                  clone[idx].assists = Number(e.target.value);
                                  setPlayerStats(clone);
                                }}
                                className="w-10 h-7 text-center rounded bg-background border border-border/60 font-mono font-bold"
                              />
                            </div>
                            <div className="flex gap-2">
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={p.yellowCard}
                                  onChange={(e) => {
                                    const clone = [...playerStats];
                                    clone[idx].yellowCard = e.target.checked;
                                    setPlayerStats(clone);
                                  }}
                                  className="w-3.5 h-3.5 rounded border-border/60 text-primary"
                                />
                                <span className="text-[8px] font-black text-amber-500 uppercase">🟨 Tarjeta</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={p.redCard}
                                  onChange={(e) => {
                                    const clone = [...playerStats];
                                    clone[idx].redCard = e.target.checked;
                                    setPlayerStats(clone);
                                  }}
                                  className="w-3.5 h-3.5 rounded border-border/60 text-primary"
                                />
                                <span className="text-[8px] font-black text-destructive uppercase">🟥 Tarjeta</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
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
            )}

          </div>
        </div>
      )}

    </div>
  );
}
