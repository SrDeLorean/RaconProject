import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/api/axios';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/shared/Card';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/shared/Alert';
import PartidosUt from '@/features/public/pages/PartidosUt';

// ─── Helpers de Formato y Posiciones UT ──────────────────────────────────────────

function fmtDate(dateStr) {
  if (!dateStr) return 'TBD';
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function computeUtStandings(partidos, equipos) {
  const map = {};
  equipos.forEach(eq => {
    map[eq.id] = {
      id: eq.id, nombre: eq.nombre,
      pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0,
    };
  });
  partidos.forEach(p => {
    if (p.goles_local == null || p.goles_visitante == null) return;
    const gl = p.goles_local, gv = p.goles_visitante;
    const lid = p.equipo_ut_local_id, vid = p.equipo_ut_visitante_id;
    if (!map[lid] || !map[vid]) return;
    map[lid].pj++; map[vid].pj++;
    map[lid].gf += gl; map[lid].gc += gv;
    map[vid].gf += gv; map[vid].gc += gl;
    if (gl > gv)      { map[lid].pg++; map[lid].pts += 3; map[vid].pp++; }
    else if (gl < gv) { map[vid].pg++; map[vid].pts += 3; map[lid].pp++; }
    else              { map[lid].pe++; map[lid].pts++; map[vid].pe++; map[vid].pts++; }
  });
  return Object.values(map).sort(
    (a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf
  );
}

function groupBy(array, key) {
  return array.reduce((map, item) => {
    const k = item[key] || 'Sin Grupo';
    if (!map[k]) map[k] = [];
    map[k].push(item);
    return map;
  }, {});
}

const ROUND_ORDER = [
  'fase previa', 'ronda previa', 'play-in',
  'ronda de 64', 'ronda de 32', 'ronda de 16', 'octavos',
  'cuartos', 'cuartos de final',
  'semifinal', 'semis',
  'tercer puesto', '3er puesto',
  'final',
];

function getRoundWeight(jornada = '') {
  const j = jornada.toLowerCase();
  const idx = ROUND_ORDER.findIndex(r => j.includes(r));
  return idx === -1 ? 50 : idx;
}

export default function CampeonatosJugadorUtPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // Listado de campeonatos
  const [inscritos, setInscritos] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState(null);

  // Campeonato seleccionado
  const [selectedTorneoId, setSelectedTorneoId] = useState(null);
  const [selectedTorneo, setSelectedTorneo] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('resumen'); // 'resumen' | 'calendario' | 'tabla' | 'estadistica'

  // Calendario local
  const [activeJornadaIndex, setActiveJornadaIndex] = useState(0);

  // Reporte de Partido UT
  const [selectedReportMatch, setSelectedReportMatch] = useState(null);
  const [statsScoreA, setStatsScoreA] = useState(0);
  const [statsScoreB, setStatsScoreB] = useState(0);
  const [playerStats, setPlayerStats] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const backendBaseUrl = api.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:8000';
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${backendBaseUrl}${cleanPath}`;
  };

  const fetchCampeonatos = async () => {
    setLoadingList(true);
    setListError(null);
    try {
      // 1. Obtener competencias del jugador
      const resInscritos = await api.get('/competencias-ut', {
        params: { jugador_id: user.id, per_page: 100 }
      });
      const listInscritos = resInscritos.data?.data || resInscritos.data || [];
      setInscritos(listInscritos);

      // 2. Obtener competencias disponibles en periodo de inscripciones
      const resDisponibles = await api.get('/competencias-ut', {
        params: { estado: 'inscripciones', per_page: 100 }
      });
      const listDisponibles = resDisponibles.data?.data || resDisponibles.data || [];
      
      const inscritosIds = new Set(listInscritos.map(c => c.id));
      const listFiltrada = listDisponibles.filter(c => !inscritosIds.has(c.id));
      
      setDisponibles(listFiltrada);
    } catch (err) {
      console.error("Error al obtener campeonatos UT:", err);
      setListError("No se pudieron cargar los campeonatos UT en este momento.");
    } finally {
      setLoadingList(false);
    }
  };

  const fetchTorneoDetalle = async (id) => {
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const res = await api.get(`/competencias-ut/${id}`);
      setSelectedTorneo(res.data?.data || res.data);
    } catch (err) {
      console.error("Error al obtener detalles del torneo UT:", err);
      setDetailError("No se pudieron cargar los detalles de este torneo.");
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchCampeonatos();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTorneoId) {
      setActiveSubTab('resumen');
      setActiveJornadaIndex(0);
      fetchTorneoDetalle(selectedTorneoId);
    } else {
      setSelectedTorneo(null);
    }
  }, [selectedTorneoId]);

  const openReportModal = (match) => {
    setSelectedReportMatch(match);
    setStatsScoreA(0);
    setStatsScoreB(0);
    setReportError(null);

    const activePlayers = [];
    if (match.local?.id_capitan) {
      activePlayers.push({
        id: match.local.id_capitan,
        name: `${match.local.capitan?.gamertag || match.local.capitan?.name || 'Capitán Local'} (${match.local.nombre})`,
        goals: 0,
        posicion: 'DEL'
      });
    }
    if (match.local?.id_companero) {
      activePlayers.push({
        id: match.local.id_companero,
        name: `${match.local.companero?.gamertag || match.local.companero?.name || 'Compañero Local'} (${match.local.nombre})`,
        goals: 0,
        posicion: 'DEL'
      });
    }

    if (match.visitante?.id_capitan) {
      activePlayers.push({
        id: match.visitante.id_capitan,
        name: `${match.visitante.capitan?.gamertag || match.visitante.capitan?.name || 'Capitán Visitante'} (${match.visitante.nombre})`,
        goals: 0,
        posicion: 'DEL'
      });
    }
    if (match.visitante?.id_companero) {
      activePlayers.push({
        id: match.visitante.id_companero,
        name: `${match.visitante.companero?.gamertag || match.visitante.companero?.name || 'Compañero Visitante'} (${match.visitante.nombre})`,
        goals: 0,
        posicion: 'DEL'
      });
    }

    setPlayerStats(activePlayers);
  };

  const handleSaveReport = async () => {
    setReportLoading(true);
    setReportError(null);

    try {
      const payload = {
        goles_local: Number(statsScoreA),
        goles_visitante: Number(statsScoreB),
        stats: {
          teamA: { shots: 10, possession: 50, corners: 4, fouls: 5 },
          teamB: { shots: 10, possession: 50, corners: 4, fouls: 5 },
          players: playerStats
        }
      };

      await api.put(`/partidos-ut/${selectedReportMatch.id}`, payload);
      alert('🎉 ¡Partido reportado con éxito!');
      setSelectedReportMatch(null);
      fetchTorneoDetalle(selectedTorneoId);
    } catch (err) {
      console.error(err);
      setReportError(err.response?.data?.message || 'Error al guardar el reporte.');
    } finally {
      setReportLoading(false);
    }
  };

  // ─── Procesamientos del Torneo Seleccionado ──────────────────────────────────
  
  const partidos = selectedTorneo?.partidos || [];
  const equipos = selectedTorneo?.equipos || [];
  const formato = (selectedTorneo?.formato || 'liga').toLowerCase();
  
  const isPlayoff = formato === 'playoffs' || formato === 'playoff' || formato === 'eliminatoria';
  const isCopa = formato === 'copa';
  const isLiga = !isPlayoff && !isCopa;

  // 1. Calendario de Liga
  const jornadasLiga = useMemo(() => groupBy(partidos, 'jornada'), [partidos]);
  const jornadaKeys = useMemo(() => {
    return Object.keys(jornadasLiga).sort((a, b) => {
      const numA = parseInt(a.replace(/^\D+/g, ''), 10);
      const numB = parseInt(b.replace(/^\D+/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [jornadasLiga]);

  const currentJornada = jornadaKeys[activeJornadaIndex];
  const currentMatches = jornadasLiga[currentJornada] || [];

  // 2. Copa y Grupos
  const grupoPartidos = useMemo(() => partidos.filter(p => p.grupo), [partidos]);
  const knockoutPartidos = useMemo(() => partidos.filter(p => !p.grupo), [partidos]);
  const gruposCopa = useMemo(() => groupBy(grupoPartidos, 'grupo'), [grupoPartidos]);

  // 3. Posiciones de Liga
  const standingsLiga = useMemo(() => computeUtStandings(partidos, equipos), [partidos, equipos]);

  // 4. Llaves de Playoff
  const playoffRounds = useMemo(() => {
    const map = {};
    const sourcePartidos = isCopa ? knockoutPartidos : partidos;
    sourcePartidos.forEach(p => {
      const key = p.jornada || 'Ronda';
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });

    return Object.entries(map)
      .sort(([a], [b]) => getRoundWeight(a) - getRoundWeight(b))
      .map(([roundName, roundMatches]) => {
        const matchups = [];
        const visited = new Set();

        for (let i = 0; i < roundMatches.length; i++) {
          if (visited.has(i)) continue;
          const current = roundMatches[i];
          let paired = null;

          for (let j = i + 1; j < roundMatches.length; j++) {
            if (visited.has(j)) continue;
            const candidate = roundMatches[j];

            const matchSwapped = (
              current.local?.id && candidate.local?.id &&
              current.local.id === candidate.visitante?.id &&
              current.visitante?.id === candidate.local.id
            );

            const matchTBDAdjacent = (
              (!current.local && !current.visitante && !candidate.local && !candidate.visitante) &&
              (j === i + 1)
            );

            if (matchSwapped || matchTBDAdjacent) {
              paired = candidate;
              visited.add(j);
              break;
            }
          }

          visited.add(i);
          matchups.push({
            id: current.id,
            jornada: current.jornada,
            local: current.local,
            visitante: current.visitante,
            leg1: current,
            leg2: paired
          });
        }

        return [roundName, matchups];
      });
  }, [partidos, knockoutPartidos, isCopa]);

  // 5. Estadísticas de Torneo (Goleadores y Valoraciones Medias)
  const computedStats = useMemo(() => {
    if (!partidos) return { goleadores: [], valoraciones: [] };
    const playersMap = {};

    partidos.forEach(partido => {
      const statsList = partido.estadisticas_jugadores || partido.estadisticasJugadores || partido.stats_jugadores || partido.statsJugadores || [];
      statsList.forEach(sj => {
        const jugador = sj.jugador;
        if (!jugador) return;
        const jId = jugador.id;
        if (!playersMap[jId]) {
          playersMap[jId] = {
            id: jId,
            name: jugador.name,
            gamertag: jugador.gamertag,
            goals: 0,
            valSum: 0,
            matchesCount: 0
          };
        }
        playersMap[jId].goals += sj.goles || 0;
        playersMap[jId].valSum += Number(sj.valoracion) || 6.00;
        playersMap[jId].matchesCount += 1;
      });
    });

    const list = Object.values(playersMap);

    const goleadores = [...list]
      .filter(p => p.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 10);

    const valoraciones = [...list]
      .filter(p => p.matchesCount > 0)
      .map(p => ({
        ...p,
        rating: p.valSum / p.matchesCount
      }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);

    return { goleadores, valoraciones };
  }, [partidos]);

  // ─── Renderizado Principal ───────────────────────────────────────────────────

  return (
    <div className="animate-fade-in relative min-h-[500px] space-y-8">
      
      {/* MODO DETALLE DE TORNEO SELECCIONADO */}
      {selectedTorneoId ? (
        <div className="space-y-6">
          {/* Cabecera de Retorno */}
          <div className="flex justify-between items-center text-left">
            <button 
              onClick={() => setSelectedTorneoId(null)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-border/50 bg-card/35 backdrop-blur-md text-xs font-condensed tracking-wider font-bold text-muted-foreground hover:text-primary hover:border-primary/45 transition-all duration-300 shadow-md active:scale-95 group cursor-pointer"
            >
              <span className="group-hover:-translate-x-1 transition-transform duration-300">←</span>
              VOLVER A MIS CAMPEONATOS
            </button>
            <Button 
              onClick={() => fetchTorneoDetalle(selectedTorneoId)} 
              disabled={loadingDetail}
              variant="outline" 
              className="h-9 text-xs"
            >
              🔄 Actualizar
            </Button>
          </div>

          {loadingDetail || !selectedTorneo ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Spinner size="lg" />
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest animate-pulse">
                Cargando ficha de campeonato...
              </span>
            </div>
          ) : detailError ? (
            <Alert variant="error" className="max-w-xl mx-auto text-left shadow-lg">
              <p className="text-sm font-bold">{detailError}</p>
            </Alert>
          ) : (
            <div className="space-y-8">
              
              {/* Tarjeta del Torneo (Hero Card) */}
              <section className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/45 backdrop-blur-md shadow-2xl">
                <div className="relative h-48 md:h-56 w-full overflow-hidden border-b border-border/40">
                  {selectedTorneo.banner || selectedTorneo.temporada?.organizacion?.banner ? (
                    <img 
                      src={getImageUrl(selectedTorneo.banner || selectedTorneo.temporada?.organizacion?.banner)} 
                      alt={selectedTorneo.nombre} 
                      className="w-full h-full object-cover opacity-80" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-primary/10 via-background to-primary/5 flex items-center justify-center">
                      <span className="text-muted-foreground text-xs uppercase tracking-widest font-condensed">Sin banner oficial</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent z-10"></div>
                </div>

                <div className="p-6 relative z-10 -mt-12 text-left">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                      {selectedTorneo.logo ? (
                        <img 
                          src={getImageUrl(selectedTorneo.logo)} 
                          alt={selectedTorneo.nombre} 
                          className="w-16 h-16 rounded-2xl object-cover border-4 border-card bg-card shadow-xl shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-background border-4 border-card flex items-center justify-center font-display font-black text-primary text-2xl shrink-0">
                          {selectedTorneo.nombre?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="brand" className="uppercase font-mono text-[8.5px] tracking-widest">{selectedTorneo.tipo}</Badge>
                          <Badge variant="neutral" className="uppercase font-mono text-[8.5px] tracking-widest">{selectedTorneo.plataforma}</Badge>
                          <Badge variant={selectedTorneo.estado === 'en_curso' ? 'success' : 'neutral'} className="uppercase font-mono text-[8.5px] tracking-widest">{selectedTorneo.estado}</Badge>
                        </div>
                        <h2 className="text-xl md:text-3xl font-display font-black text-foreground uppercase tracking-wide mt-2">
                          {selectedTorneo.nombre}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-mono">
                          Temporada: <span className="text-foreground font-bold">{selectedTorneo.temporada?.nombre || 'General'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 shrink-0 bg-background/40 border border-border/40 p-4 rounded-2xl backdrop-blur-sm">
                      <div className="text-center">
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">PRIZE POOL</span>
                        <span className="text-md font-display font-black text-primary tracking-widest">${selectedTorneo.prize_pool || '0.00'}</span>
                      </div>
                      <div className="w-px bg-border/40" />
                      <div className="text-center">
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">INSCRITOS</span>
                        <span className="text-md font-display font-black text-foreground tracking-widest">{equipos.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Pestañas de Navegación del Torneo */}
              <div className="flex flex-wrap gap-2 border-b border-border/20 dark:border-white/[0.05] pb-3.5 relative z-20">
                {[
                  { id: 'resumen', label: 'Resumen y Reglamento', icon: '📋' },
                  { id: 'calendario', label: 'Calendario / Fixture', icon: '📅' },
                  { id: 'tabla', label: isPlayoff ? 'Cuadro de Playoffs' : 'Tabla de Posiciones', icon: '📊' },
                  { id: 'estadistica', label: 'Estadísticas Individuales', icon: '⭐' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`px-4.5 py-2.5 rounded-xl text-[10px] font-condensed font-black uppercase tracking-wider border transition-all duration-300 flex items-center gap-2.5 cursor-pointer ${
                      activeSubTab === tab.id
                        ? 'bg-primary/15 text-primary border-primary/45 shadow-[0_0_20px_rgba(232,0,29,0.15)] active-date-glow'
                        : 'bg-card/30 border-border-border/30 dark:border-white/[0.05] text-muted-foreground hover:text-foreground hover:bg-card/70 hover:border-primary/30'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Contenidos de las Pestañas */}
              <div className="relative z-10">
                
                {/* 1. RESUMEN Y REGLAS */}
                {activeSubTab === 'resumen' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in text-left">
                    <div className="lg:col-span-2 space-y-6">
                      <Card className="border border-border/40 bg-card/25 backdrop-blur-md shadow-lg" padding="p-6" withGlow>
                        <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 border-b border-border/20 pb-2">Descripción del Torneo</h3>
                        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                          {selectedTorneo.descripcion || 'No hay descripción oficial disponible para este torneo.'}
                        </p>
                      </Card>

                      <Card className="border border-border/40 bg-card/25 backdrop-blur-md shadow-lg" padding="p-6" withGlow>
                        <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 border-b border-border/20 pb-2">Reglamento y Directrices</h3>
                        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                          {selectedTorneo.reglas || 'Las reglas generales de la liga aplican para este encuentro.'}
                        </p>
                      </Card>
                    </div>

                    <div className="space-y-6">
                      <Card className="border border-border/40 bg-card/25 backdrop-blur-md shadow-lg" padding="p-5" withGlow>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 border-b border-border/20 pb-2">Ficha Técnica</h3>
                        <div className="space-y-3.5 text-xs">
                          <div className="flex justify-between border-b border-border/20 pb-2">
                            <span className="text-muted-foreground uppercase font-semibold">Formato</span>
                            <span className="font-bold text-foreground uppercase">{selectedTorneo.formato}</span>
                          </div>
                          <div className="flex justify-between border-b border-border/20 pb-2">
                            <span className="text-muted-foreground uppercase font-semibold">Modalidad</span>
                            <span className="font-bold text-foreground uppercase">{selectedTorneo.tipo} UT</span>
                          </div>
                          <div className="flex justify-between border-b border-border/20 pb-2">
                            <span className="text-muted-foreground uppercase font-semibold">Plataforma</span>
                            <span className="font-bold text-foreground uppercase">{selectedTorneo.plataforma}</span>
                          </div>
                          <div className="flex justify-between border-b border-border/20 pb-2">
                            <span className="text-muted-foreground uppercase font-semibold">Máx Participantes</span>
                            <span className="font-bold text-foreground font-mono">{selectedTorneo.max_participantes}</span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

                {/* 2. CALENDARIO / FIXTURE */}
                {activeSubTab === 'calendario' && (
                  <div className="space-y-6 animate-fade-in text-left">
                    <PartidosUt 
                      forPlayer={true} 
                      hideHero={true} 
                      competenciaUtId={selectedTorneo.id} 
                      hideFilters={true} 
                    />
                  </div>
                )}

                {/* 3. TABLA DE POSICIONES / CUADRO PLAYOFF */}
                {activeSubTab === 'tabla' && (
                  <div className="space-y-6 animate-fade-in text-left">
                    {isLiga && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-foreground uppercase tracking-widest border-b border-border/20 pb-2">📊 Posiciones Generales</h4>
                        <StandingsTable standings={standingsLiga} />
                      </div>
                    )}

                    {isCopa && (
                      <div className="space-y-8">
                        {Object.keys(gruposCopa).length > 0 ? (
                          Object.keys(gruposCopa).map(grupo => {
                            const teamIds = new Set(gruposCopa[grupo].flatMap(p => [p.equipo_ut_local_id, p.equipo_ut_visitante_id]));
                            const grupoEquipos = equipos.filter(eq => teamIds.has(eq.id));
                            const standings = computeUtStandings(gruposCopa[grupo], grupoEquipos);
                            return (
                              <div key={grupo} className="space-y-3">
                                <StandingsTable standings={standings} title={`Posiciones Grupo ${grupo}`} />
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-center text-sm text-muted-foreground italic">Fase de grupos sin datos suficientes.</p>
                        )}
                      </div>
                    )}

                    {isPlayoff && (
                      <div className="space-y-4">
                        <PlayoffLlave matches={partidos} />
                      </div>
                    )}
                  </div>
                )}

                {/* 4. ESTADÍSTICAS INDIVIDUALES */}
                {activeSubTab === 'estadistica' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in text-left">
                    
                    {/* Goleadores */}
                    <Card className="border border-border/40 bg-card/25 backdrop-blur-md shadow-lg" padding="p-5" withGlow>
                      <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 border-b border-border/20 pb-2 flex items-center gap-1.5">
                        ⚽ Máximos Goleadores
                      </h4>
                      {computedStats.goleadores.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-6 text-center">No hay goles registrados todavía.</p>
                      ) : (
                        <div className="space-y-2 font-sans">
                          {computedStats.goleadores.map((player, idx) => (
                            <div key={player.id} className="flex justify-between items-center p-2.5 bg-muted/10 border border-border/30 rounded-xl">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black font-mono w-5 text-center text-muted-foreground">#{idx + 1}</span>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-foreground uppercase">{player.name}</span>
                                  {player.gamertag && <span className="text-[9px] text-muted-foreground font-mono">@{player.gamertag}</span>}
                                </div>
                              </div>
                              <span className="text-xs font-black font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                                {player.goals} {player.goals === 1 ? 'gol' : 'goles'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                    {/* Valoraciones Medias */}
                    <Card className="border border-border/40 bg-card/25 backdrop-blur-md shadow-lg" padding="p-5" withGlow>
                      <h4 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-4 border-b border-border/20 pb-2 flex items-center gap-1.5">
                        ⭐ Mejor Valorados (Promedio)
                      </h4>
                      {computedStats.valoraciones.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-6 text-center">No hay calificaciones registradas todavía.</p>
                      ) : (
                        <div className="space-y-2 font-sans">
                          {computedStats.valoraciones.map((player, idx) => (
                            <div key={player.id} className="flex justify-between items-center p-2.5 bg-muted/10 border border-border/30 rounded-xl">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black font-mono w-5 text-center text-muted-foreground">#{idx + 1}</span>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-foreground uppercase">{player.name}</span>
                                  {player.gamertag && <span className="text-[9px] text-muted-foreground font-mono">@{player.gamertag}</span>}
                                </div>
                              </div>
                              <span className="text-xs font-black font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                                Rating {player.rating.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      ) : (
        /* MODO LISTADO DE TORNEOS */
        <div className="space-y-12">
          
          {/* HEADER DE LA PÁGINA */}
          <div className="mb-8 border-b border-border/50 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-black uppercase tracking-wider mb-1 text-foreground">
                Campeonatos <span className="text-glow-primary bg-clip-text bg-gradient-to-r from-primary to-destructive text-transparent">Ultimate Team</span>
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Explora las competencias en curso de UT 1v1 y 2v2, inscríbete en torneos abiertos y sigue tus posiciones de juego.
              </p>
            </div>
            <Button 
              onClick={fetchCampeonatos} 
              disabled={loadingList}
              variant="outline" 
              className="h-10 px-4 text-xs font-bold border-border/60 hover:bg-muted/50 transition-all duration-200"
            >
              🔄 Actualizar Torneos
            </Button>
          </div>

          {loadingList ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Spinner size="lg" />
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest animate-pulse">
                Sincronizando campeonatos UT...
              </span>
            </div>
          ) : listError ? (
            <Alert variant="error" className="max-w-xl mx-auto text-left shadow-lg">
              <div className="space-y-3">
                <p className="text-sm font-bold">{listError}</p>
                <Button onClick={fetchCampeonatos} size="sm">Intentar de nuevo</Button>
              </div>
            </Alert>
          ) : (
            <>
              {/* Torneos Inscritos */}
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-border/10 pb-3 text-left">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <div>
                      <h4 className="text-base font-display font-black text-foreground uppercase tracking-wide">Mis Campeonatos UT Activos</h4>
                      <p className="text-xs text-muted-foreground">Torneos en los que participas como competidor.</p>
                    </div>
                  </div>
                  <Badge variant="brand" className="font-mono text-[10px] tracking-wider uppercase px-2.5 py-1">{inscritos.length} torneos</Badge>
                </div>

                {inscritos.length === 0 ? (
                  <div className="border border-border/40 bg-card/25 rounded-3xl p-16 text-center text-muted-foreground flex flex-col items-center gap-4 max-w-2xl mx-auto shadow-inner relative overflow-hidden scanlines">
                    <div className="absolute inset-0 hud-noise pointer-events-none opacity-20"></div>
                    <span className="text-4xl animate-bounce">🎮</span>
                    <div className="space-y-1">
                      <h3 className="text-md font-bold text-foreground uppercase tracking-wider">Sin Torneos UT Registrados</h3>
                      <p className="text-xs text-muted-foreground max-w-sm">No figuras en el fixture de ningún campeonato UT activo en este momento.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inscritos.map((comp) => (
                      <Card 
                        key={comp.id} 
                        className="group border border-border/50 bg-card/30 backdrop-blur-md rounded-2xl flex flex-col justify-between gap-6 relative overflow-hidden shadow-lg hover:border-primary/45 transition-all duration-300"
                        padding="p-6"
                        hoverable
                        withGlow
                      >
                        <div className="space-y-4 relative z-10 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase truncate max-w-[150px]">
                              🏆 {comp.temporada?.organizacion?.nombre || 'General'}
                            </span>
                            <Badge 
                              variant={
                                comp.estado === 'en_curso' ? 'success' :
                                comp.estado === 'inscripciones' ? 'brand' : 'neutral'
                              }
                              className="uppercase text-[8px]"
                            >
                              {comp.estado}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4">
                            {comp.logo ? (
                              <img 
                                src={getImageUrl(comp.logo)} 
                                alt={comp.nombre} 
                                className="w-12 h-12 rounded-xl object-cover border bg-background shrink-0 shadow-sm" 
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary/20 to-destructive/20 border border-primary/20 flex items-center justify-center font-display font-black text-primary text-lg uppercase shrink-0 shadow-inner">
                                {comp.nombre?.slice(0, 2)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h5 className="font-display font-black text-md text-foreground uppercase tracking-wide truncate group-hover:text-primary transition-colors">
                                {comp.nombre}
                              </h5>
                              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-mono font-black mt-1">
                                <span className="text-foreground uppercase">{comp.tipo}</span>
                                <span>•</span>
                                <span className="uppercase">{comp.plataforma}</span>
                              </div>
                            </div>
                          </div>

                          <div className="h-px bg-border/20 my-2"></div>

                          <div className="grid grid-cols-2 gap-3 text-[10px]">
                            <div className="bg-muted/10 border border-border/30 rounded-xl p-2.5 text-center shadow-inner">
                              <span className="text-[8.5px] text-muted-foreground uppercase block font-bold tracking-wider mb-0.5">Prize Pool</span>
                              <strong className="text-primary font-mono text-xs">${comp.prize_pool || '0.00'}</strong>
                            </div>
                            <div className="bg-muted/10 border border-border/30 rounded-xl p-2.5 text-center shadow-inner">
                              <span className="text-[8.5px] text-muted-foreground uppercase block font-bold tracking-wider mb-0.5">Participantes</span>
                              <strong className="text-foreground font-mono text-xs">{comp.equipos_count || 0}/{comp.max_participantes}</strong>
                            </div>
                          </div>
                        </div>

                        <Button 
                          onClick={() => setSelectedTorneoId(comp.id)}
                          className="w-full h-9 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground border border-transparent hover:bg-primary/95 transition-all duration-300 shadow-[0_0_10px_rgba(232,0,29,0.2)]"
                        >
                          🎮 Abrir Panel de Torneo
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Torneos Disponibles */}
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-border/10 pb-3 text-left">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-base font-display font-black text-foreground uppercase tracking-wide">Inscripciones Abiertas UT</h4>
                      <p className="text-xs text-muted-foreground">Torneos UT del circuito que aceptan nuevos registros.</p>
                    </div>
                  </div>
                  <Badge variant="neutral" className="font-mono text-[10px] tracking-wider uppercase px-2.5 py-1">{disponibles.length} abiertos</Badge>
                </div>

                {disponibles.length === 0 ? (
                  <div className="border border-border/40 bg-card/25 rounded-3xl p-16 text-center text-muted-foreground flex flex-col items-center gap-4 max-w-2xl mx-auto shadow-inner relative overflow-hidden scanlines">
                    <div className="absolute inset-0 hud-noise pointer-events-none opacity-20"></div>
                    <span className="text-4xl">🏆</span>
                    <div className="space-y-1">
                      <h3 className="text-md font-bold text-foreground uppercase tracking-wider">Sin Torneos Disponibles</h3>
                      <p className="text-xs text-muted-foreground max-w-sm">No existen convocatorias o periodos de inscripciones abiertas en este momento.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {disponibles.map((comp) => (
                      <Card 
                        key={comp.id} 
                        className="group border border-border/50 bg-card/30 backdrop-blur-md rounded-2xl flex flex-col justify-between gap-6 relative overflow-hidden shadow-lg hover:border-primary/45 transition-all duration-300"
                        padding="p-6"
                        hoverable
                        withGlow
                      >
                        <div className="space-y-4 relative z-10 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase truncate max-w-[150px]">
                              🏆 {comp.temporada?.organizacion?.nombre || 'General'}
                            </span>
                            <Badge variant="brand" className="uppercase text-[8px] animate-pulse px-2 py-0.5 tracking-wider font-mono font-black">
                              Abierto
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4">
                            {comp.logo ? (
                              <img 
                                src={getImageUrl(comp.logo)} 
                                alt={comp.nombre} 
                                className="w-12 h-12 rounded-xl object-cover border bg-background shrink-0 shadow-sm" 
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary/20 to-destructive/20 border border-primary/20 flex items-center justify-center font-display font-black text-primary text-lg uppercase shrink-0 shadow-inner">
                                {comp.nombre?.slice(0, 2)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h5 className="font-display font-black text-md text-foreground uppercase tracking-wide truncate group-hover:text-primary transition-colors">
                                {comp.nombre}
                              </h5>
                              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-mono font-black mt-1">
                                <span className="text-foreground uppercase">{comp.tipo}</span>
                                <span>•</span>
                                <span className="uppercase">{comp.plataforma}</span>
                              </div>
                            </div>
                          </div>

                          <div className="h-px bg-border/20 my-2"></div>

                          <div className="grid grid-cols-2 gap-3 text-[10px]">
                            <div className="bg-muted/10 border border-border/30 rounded-xl p-2.5 text-center shadow-inner">
                              <span className="text-[8.5px] text-muted-foreground uppercase block font-bold tracking-wider mb-0.5">Prize Pool</span>
                              <strong className="text-primary font-mono text-xs">${comp.prize_pool || '0.00'}</strong>
                            </div>
                            <div className="bg-muted/10 border border-border/30 rounded-xl p-2.5 text-center shadow-inner">
                              <span className="text-[8.5px] text-muted-foreground uppercase block font-bold tracking-wider mb-0.5">Entrada</span>
                              <strong className="text-foreground font-mono text-xs">${comp.entry_fee || '0.00'}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            onClick={() => setSelectedTorneoId(comp.id)}
                            variant="outline"
                            className="flex-1 h-9 text-[10px] font-bold uppercase tracking-wider border-border/60 hover:bg-muted/40 transition-all"
                          >
                            Detalles
                          </Button>
                          <Button 
                            onClick={() => navigate(`/jugador/competencias-ut/${comp.id}/inscripcion`)}
                            className="flex-1 h-9 text-[10px] font-bold uppercase tracking-wider bg-primary hover:bg-primary/95 text-primary-foreground border border-transparent transition-all shadow-[0_0_10px_rgba(232,0,29,0.2)]"
                          >
                            Inscribirse
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REPORTE MANUAL DE GOLES DE JUGADOR                                  */}
      {/* ========================================================================= */}
      {selectedReportMatch && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-card border border-border/50 shadow-2xl rounded-3xl p-6 space-y-6 max-h-[90vh] overflow-y-auto relative animate-scale-up text-left">
            
            <div className="border-b border-border/20 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-display font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                  🎮 Reportar Resultado UT
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Ingresa los goles del partido y los goles individuales.</p>
              </div>
              <button 
                onClick={() => setSelectedReportMatch(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold uppercase transition-colors"
              >
                ✕
              </button>
            </div>

            {reportError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-xs text-destructive font-bold">
                ⚠️ {reportError}
              </div>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-muted/10 p-4 rounded-xl border border-border/40">
                {/* Local */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-primary uppercase truncate">{selectedReportMatch.local?.nombre || 'Local'}</h4>
                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">Goles Local</label>
                    <input 
                      type="number" 
                      min="0"
                      value={statsScoreA} 
                      onChange={(e) => setStatsScoreA(Math.max(0, Number(e.target.value)))}
                      className="w-full h-10 px-3 bg-background border border-border/60 rounded-xl text-center font-mono font-bold text-foreground text-lg focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Visitante */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-destructive uppercase truncate">{selectedReportMatch.visitante?.nombre || 'Visitante'}</h4>
                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">Goles Visitante</label>
                    <input 
                      type="number" 
                      min="0"
                      value={statsScoreB} 
                      onChange={(e) => setStatsScoreB(Math.max(0, Number(e.target.value)))}
                      className="w-full h-10 px-3 bg-background border border-border/60 rounded-xl text-center font-mono font-bold text-foreground text-lg focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Estadísticas de Jugadores */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-foreground uppercase tracking-widest">Goles por Jugador (Capitanes y Parejas)</h4>
                {playerStats.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No hay jugadores configurados en estos equipos para reportar.</p>
                ) : (
                  <div className="space-y-2 border border-border/40 rounded-2xl overflow-hidden bg-muted/10 p-2">
                    {playerStats.map((p, idx) => (
                      <div key={p.id} className="flex justify-between items-center p-3 border-b border-border/20 last:border-0 gap-3 text-xs">
                        <span className="font-bold text-foreground truncate">{p.name}</span>
                        <div className="flex items-center gap-2">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Goles:</label>
                          <input 
                            type="number" 
                            min="0"
                            value={p.goals} 
                            onChange={(e) => {
                              const clone = [...playerStats];
                              clone[idx].goals = Math.max(0, Number(e.target.value));
                              setPlayerStats(clone);
                            }}
                            className="w-12 h-8 rounded-lg bg-background border border-border/60 text-center font-mono font-bold text-foreground" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button 
                  onClick={() => setSelectedReportMatch(null)} 
                  className="px-5 py-2.5 rounded-xl border border-border/40 text-xs font-bold uppercase hover:bg-muted/10 transition-colors"
                  disabled={reportLoading}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveReport} 
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase hover:shadow-[0_0_15px_rgba(232,0,29,0.4)] transition-all cursor-pointer flex items-center gap-1.5"
                  disabled={reportLoading}
                >
                  {reportLoading ? (
                    <>
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-primary-foreground border-r-2"></span>
                      Procesando...
                    </>
                  ) : (
                    'Guardar Reporte'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Sub-Componente: Tabla de Posiciones ───────────────────────────────────────

function StandingsTable({ standings, title }) {
  return (
    <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
      {title && (
        <div className="px-5 py-3 bg-muted/30 border-b border-border/40">
          <span className="text-xs font-black uppercase tracking-widest text-primary">{title}</span>
        </div>
      )}
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="border-b border-border/50 bg-muted/30 text-[9px] uppercase font-black text-muted-foreground tracking-widest font-mono">
            <th className="px-4 py-3 text-center w-10">#</th>
            <th className="px-4 py-3">Participante</th>
            <th className="px-4 py-3 text-center w-12">PJ</th>
            <th className="hidden sm:table-cell px-4 py-3 text-center w-12 text-emerald-400">PG</th>
            <th className="hidden sm:table-cell px-4 py-3 text-center w-12">PE</th>
            <th className="hidden sm:table-cell px-4 py-3 text-center w-12 text-destructive">PP</th>
            <th className="hidden md:table-cell px-4 py-3 text-center w-12">GF</th>
            <th className="hidden md:table-cell px-4 py-3 text-center w-12">GC</th>
            <th className="px-4 py-3 text-center w-14">DG</th>
            <th className="px-4 py-3 text-center w-16 text-primary">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30 text-xs font-semibold">
          {standings.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-5 py-8 text-center text-muted-foreground italic">Sin resultados registrados</td>
            </tr>
          ) : standings.map((s, idx) => (
            <tr key={s.id} className="hover:bg-primary/5 transition-colors">
              <td className="px-4 py-3 text-center">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded font-black font-mono text-[10px] ${
                  idx === 0 ? 'bg-gradient-to-tr from-amber-400 to-yellow-600 text-slate-950 shadow' :
                  idx === 1 ? 'bg-gradient-to-tr from-slate-300 to-slate-500 text-slate-950' :
                  idx === 2 ? 'bg-gradient-to-tr from-amber-700 to-amber-900 text-amber-100' :
                  'bg-muted text-foreground'
                }`}>{idx + 1}</span>
              </td>
              <td className="px-4 py-3 font-bold text-foreground uppercase">{s.nombre}</td>
              <td className="px-4 py-3 text-center font-mono">{s.pj}</td>
              <td className="hidden sm:table-cell px-4 py-3 text-center font-mono text-emerald-400">{s.pg}</td>
              <td className="hidden sm:table-cell px-4 py-3 text-center font-mono text-muted-foreground">{s.pe}</td>
              <td className="hidden sm:table-cell px-4 py-3 text-center font-mono text-destructive">{s.pp}</td>
              <td className="hidden md:table-cell px-4 py-3 text-center font-mono">{s.gf}</td>
              <td className="hidden md:table-cell px-4 py-3 text-center font-mono">{s.gc}</td>
              <td className={`px-4 py-3 text-center font-mono ${s.gf - s.gc >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>
                {s.gf - s.gc > 0 ? `+${s.gf - s.gc}` : s.gf - s.gc}
              </td>
              <td className="px-4 py-3 text-center font-mono text-primary font-black">{s.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sub-Componente: Cuadro Eliminatorio (Playoff Bracket) ───────────────────

function PlayoffLlave({ matches }) {
  const navigate = useNavigate();

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const backendBaseUrl = api.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:8000';
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${backendBaseUrl}${cleanPath}`;
  };

  const rounds = useMemo(() => {
    const map = {};
    matches.forEach(p => {
      const key = p.jornada || 'Ronda';
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });

    return Object.entries(map)
      .sort(([a], [b]) => getRoundWeight(a) - getRoundWeight(b))
      .map(([roundName, roundMatches]) => {
        const matchups = [];
        const visited = new Set();

        for (let i = 0; i < roundMatches.length; i++) {
          if (visited.has(i)) continue;
          const current = roundMatches[i];
          let paired = null;

          for (let j = i + 1; j < roundMatches.length; j++) {
            if (visited.has(j)) continue;
            const candidate = roundMatches[j];

            const matchSwapped = (
              current.local?.id && candidate.local?.id &&
              current.local.id === candidate.visitante?.id &&
              current.visitante?.id === candidate.local.id
            );

            const matchTBDAdjacent = (
              (!current.local && !current.visitante && !candidate.local && !candidate.visitante) &&
              (j === i + 1)
            );

            if (matchSwapped || matchTBDAdjacent) {
              paired = candidate;
              visited.add(j);
              break;
            }
          }

          visited.add(i);
          matchups.push({
            id: current.id,
            jornada: current.jornada,
            local: current.local,
            visitante: current.visitante,
            leg1: current,
            leg2: paired
          });
        }

        return [roundName, matchups];
      });
  }, [matches]);

  if (rounds.length === 0) {
    return <p className="text-center text-sm text-muted-foreground italic py-10">No hay llaves eliminatorias registradas aún.</p>;
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max">
        {rounds.map(([round, matchups]) => (
          <div key={round} className="flex flex-col gap-4 text-left" style={{ minWidth: 240 }}>
            <div className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary/30 pb-1 mb-1 font-mono">
              {round}
            </div>
            <div className="flex flex-col gap-4">
              {matchups.map((m, i) => {
                const leg1 = m.leg1;
                const leg2 = m.leg2;
                
                if (!leg2) {
                  const hasResult = leg1.goles_local != null && leg1.goles_visitante != null;
                  const localW = hasResult && leg1.goles_local > leg1.goles_visitante;
                  const visitaW = hasResult && leg1.goles_visitante > leg1.goles_local;
                  const isTBD = !leg1.local && !leg1.visitante;

                  return (
                    <div key={leg1.id ?? i} className="border border-border/50 bg-card/30 backdrop-blur-md rounded-xl overflow-hidden shadow-md w-56 shrink-0">
                      <div className={`flex items-center justify-between px-3 py-2 border-b border-border/30 transition-colors ${localW ? 'bg-primary/10 border-primary/20' : ''}`}>
                        <span className={`text-xs font-black uppercase truncate ${localW ? 'text-primary' : 'text-foreground'}`}>
                          {leg1.local?.nombre || (isTBD ? 'Por definir' : 'TBD')}
                        </span>
                        <span className={`text-sm font-black font-mono ml-2 shrink-0 ${localW ? 'text-primary' : hasResult ? 'text-foreground' : 'text-muted-foreground/30'}`}>
                          {hasResult ? leg1.goles_local : '-'}
                        </span>
                      </div>
                      <div className={`flex items-center justify-between px-3 py-2 transition-colors ${visitaW ? 'bg-primary/10' : ''}`}>
                        <span className={`text-xs font-black uppercase truncate ${visitaW ? 'text-primary' : 'text-foreground'}`}>
                          {leg1.visitante?.nombre || (isTBD ? 'Por definir' : 'TBD')}
                        </span>
                        <span className={`text-sm font-black font-mono ml-2 shrink-0 ${visitaW ? 'text-primary' : hasResult ? 'text-foreground' : 'text-muted-foreground/30'}`}>
                          {hasResult ? leg1.goles_visitante : '-'}
                        </span>
                      </div>
                      <div className="px-3 py-1 bg-muted/20 border-t border-border/20 text-center text-[8px] font-mono text-muted-foreground flex justify-between">
                        <span>{hasResult ? '✅ Fin' : '⏳ Pendiente'}</span>
                        <span>{leg1.fecha || 'TBD'}</span>
                      </div>
                    </div>
                  );
                }

                // Ida y Vuelta
                const hasRes1 = leg1.goles_local != null && leg1.goles_visitante != null;
                const hasRes2 = leg2.goles_local != null && leg2.goles_visitante != null;
                const hasResult = hasRes1 && hasRes2;

                const scoreA = (leg1.goles_local || 0) + (leg2.goles_visitante || 0);
                const scoreB = (leg1.goles_visitante || 0) + (leg2.goles_local || 0);

                const localW = hasResult && scoreA > scoreB;
                const visitaW = hasResult && scoreB > scoreA;
                const isTBD = !leg1.local && !leg1.visitante;

                return (
                  <div key={leg1.id ?? i} className="border border-border/50 bg-card/30 backdrop-blur-md rounded-xl overflow-hidden shadow-md w-60 shrink-0">
                    <div className={`flex items-center justify-between px-3 py-1.5 border-b border-border/30 transition-colors ${localW ? 'bg-primary/10 border-primary/20' : ''}`}>
                      <span className={`text-xs font-black uppercase truncate ${localW ? 'text-primary' : 'text-foreground'}`}>
                        {leg1.local?.nombre || (isTBD ? 'Por definir' : 'TBD')}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] font-bold text-muted-foreground/50 bg-muted/20 px-1 py-0.5 rounded font-mono">{hasRes1 ? leg1.goles_local : '-'}</span>
                        <span className="text-[9px] font-bold text-muted-foreground/50 bg-muted/20 px-1 py-0.5 rounded font-mono">{hasRes2 ? leg2.goles_visitante : '-'}</span>
                        <span className={`text-xs font-black font-mono ml-1 w-5 text-center ${localW ? 'text-primary' : hasResult ? 'text-foreground' : 'text-muted-foreground/30'}`}>{hasResult ? scoreA : ''}</span>
                      </div>
                    </div>
                    <div className={`flex items-center justify-between px-3 py-1.5 transition-colors ${visitaW ? 'bg-primary/10' : ''}`}>
                      <span className={`text-xs font-black uppercase truncate ${visitaW ? 'text-primary' : 'text-foreground'}`}>
                        {leg1.visitante?.nombre || (isTBD ? 'Por definir' : 'TBD')}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] font-bold text-muted-foreground/50 bg-muted/20 px-1 py-0.5 rounded font-mono">{hasRes1 ? leg1.goles_visitante : '-'}</span>
                        <span className="text-[9px] font-bold text-muted-foreground/50 bg-muted/20 px-1 py-0.5 rounded font-mono">{hasRes2 ? leg2.goles_local : '-'}</span>
                        <span className={`text-xs font-black font-mono ml-1 w-5 text-center ${visitaW ? 'text-primary' : hasResult ? 'text-foreground' : 'text-muted-foreground/30'}`}>{hasResult ? scoreB : ''}</span>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-muted/20 border-t border-border/20 text-center flex justify-between text-[8px] font-mono text-muted-foreground">
                      <span>Ida: {leg1.fecha || 'TBD'}</span>
                      <span>Vuelta: {leg2.fecha || 'TBD'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sub-Componente: Tarjeta de Partido UT ──────────────────────────────────────
function PartidoUtCard({ partido, user, navigate, openReportModal }) {
  const classifyMatch = (p) => {
    const getTodayStr = () => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const today = getTodayStr();
    if (p.fecha && p.fecha === today) {
      return 'live';
    }
    if (p.goles_local != null && p.goles_visitante != null) {
      return 'finished';
    }
    return 'upcoming';
  };

  const status = classifyMatch(partido);
  const isFinished = status === 'finished';
  const isLive = status === 'live';
  const teamL = partido.local?.nombre || 'Por definir';
  const teamV = partido.visitante?.nombre || 'Por definir';
  const score = isFinished || isLive ? `${partido.goles_local} – ${partido.goles_visitante}` : 'VS';
  const localWinner = isFinished && partido.goles_local > partido.goles_visitante;
  const visitaWinner = isFinished && partido.goles_visitante > partido.goles_local;
  const isCapitan = user && (partido.local?.id_capitan === user.id || partido.visitante?.id_capitan === user.id);

  return (
    <>
      {/* Vista Desktop */}
      <div
        className={`hidden md:flex relative overflow-hidden rounded-2xl glass-hud-panel p-5 justify-between items-center gap-10 border transition-all duration-300 scanlines select-none ${
          isLive ? 'live-match-flash border-primary/50 bg-primary/5' : 'border-border/45 dark:border-white/[0.06] bg-card/10'
        }`}
      >
        <div className="absolute inset-0 hud-noise pointer-events-none opacity-40"></div>

        <div className="flex flex-col items-start justify-between shrink-0 gap-2 border-r border-border/30 dark:border-white/[0.08] pr-8 min-w-[110px]">
          <div className="text-left">
            <span className="text-[9px] font-condensed text-muted-foreground font-black tracking-widest block uppercase">HORA UT</span>
            <span className="text-sm font-mono font-black text-foreground tracking-widest leading-none mt-1 block">
              {partido.hora || 'Por definir'}
            </span>
          </div>
          <div className="mt-1">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 text-[9px] font-condensed font-black tracking-widest text-primary bg-primary/10 border border-primary/35 px-3 py-1 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" /> EN VIVO
              </span>
            ) : isFinished ? (
              <span className="inline-flex items-center gap-1.5 text-[9px] font-condensed font-black tracking-widest text-muted-foreground bg-muted border border-border/50 px-3 py-1 rounded">
                FINALIZADO
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[9px] font-condensed font-black tracking-widest text-primary/95 bg-primary/5 border border-primary/20 px-3 py-1 rounded">
                PROGRAMADO
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-between gap-10 min-w-0">
          <div className="flex-1 flex items-center justify-end gap-3 min-w-0 text-right">
            <span className={`text-xs md:text-sm font-condensed font-black uppercase tracking-wider truncate ${localWinner ? 'text-primary' : 'text-foreground'}`}>
              {teamL}
            </span>
          </div>

          <div className="shrink-0 min-w-[84px] text-center">
            <span className="text-2xl md:text-3xl font-display font-black tracking-widest leading-none block">
              <span className={localWinner ? 'text-primary' : 'text-foreground'}>{isFinished || isLive ? partido.goles_local : ''}</span>
              <span className="text-muted-foreground/30 mx-2">{isFinished || isLive ? '–' : 'VS'}</span>
              <span className={visitaWinner ? 'text-primary' : 'text-foreground'}>{isFinished || isLive ? partido.goles_visitante : ''}</span>
            </span>
            {partido.jornada && (
              <span className="text-[8px] font-condensed font-bold text-muted-foreground uppercase tracking-widest mt-1 block">
                {partido.jornada}
              </span>
            )}
          </div>

          <div className="flex-1 flex items-center justify-start gap-3 min-w-0 text-left">
            <span className={`text-xs md:text-sm font-condensed font-black uppercase tracking-wider truncate ${visitaWinner ? 'text-primary' : 'text-foreground'}`}>
              {teamV}
            </span>
          </div>
        </div>

        <div className="shrink-0 border-l border-border/30 dark:border-white/[0.08] pl-8 flex flex-col gap-2 justify-center">
          <button
            onClick={() => navigate(`/partidos-ut/${partido.id}`)}
            className="w-32 py-2 px-4 text-[10px] font-condensed font-black tracking-widest uppercase bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all duration-300 cursor-pointer font-black text-center"
          >
            {isLive ? '🔴 VER DUELO' : isFinished ? 'ANALIZAR' : 'VER DETALLES'}
          </button>
          {!isFinished && isCapitan && (
            <button
              onClick={() => openReportModal(partido)}
              className="w-32 py-2 px-4 text-[10px] font-condensed font-black tracking-widest uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-xl hover:bg-amber-500 hover:text-black transition-all duration-300 cursor-pointer font-black text-center animate-pulse"
            >
              📝 REPORTAR
            </button>
          )}
        </div>
      </div>

      {/* Vista Mobile */}
      <div
        className={`flex md:hidden relative overflow-hidden rounded-2xl glass-hud-panel p-3.5 items-center justify-between gap-3 border transition-all duration-300 scanlines select-none ${
          isLive ? 'live-match-flash border-primary/50 bg-primary/5' : 'border-border/45 dark:border-white/[0.06] bg-card/10'
        }`}
      >
        <div className="absolute inset-0 hud-noise pointer-events-none opacity-40"></div>

        <div className="flex flex-col items-start gap-1 shrink-0 min-w-[65px] border-r border-border/20 dark:border-white/[0.05] pr-2.5">
          <span className="text-[11px] font-mono font-bold text-foreground leading-none">
            {partido.hora || '00:00'}
          </span>
          <div>
            {isLive ? (
              <span className="inline-flex items-center gap-0.5 text-[7.5px] font-condensed font-black tracking-wider text-primary bg-primary/10 border border-primary/20 px-1 py-0.5 rounded uppercase leading-none">
                VIVO
              </span>
            ) : isFinished ? (
              <span className="inline-flex items-center gap-0.5 text-[7.5px] font-condensed font-black tracking-wider text-muted-foreground bg-muted border border-border/30 px-1 py-0.5 rounded uppercase leading-none">
                FIN
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[7.5px] font-condensed font-black tracking-wider text-primary/80 bg-primary/5 border border-primary/15 px-1 py-0.5 rounded uppercase leading-none">
                PROG
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center gap-1.5 min-w-0">
          <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0 text-right">
            <span className={`text-[10px] font-condensed font-black uppercase tracking-wider truncate ${localWinner ? 'text-primary' : 'text-foreground'}`}>
              {teamL.length > 8 ? teamL.substring(0, 6).toUpperCase() + '..' : teamL}
            </span>
          </div>

          <div className="shrink-0 bg-background/60 dark:bg-black/40 border border-border/30 dark:border-white/[0.06] rounded-lg px-2 py-0.5 text-center min-w-[48px]">
            <span className="text-[11px] font-display font-black tracking-wider leading-none block">
              <span className={localWinner ? 'text-primary' : 'text-foreground'}>{isFinished || isLive ? partido.goles_local : ''}</span>
              <span className="text-muted-foreground/30 mx-0.5">{isFinished || isLive ? '–' : 'VS'}</span>
              <span className={visitaWinner ? 'text-primary' : 'text-foreground'}>{isFinished || isLive ? partido.goles_visitante : ''}</span>
            </span>
          </div>

          <div className="flex-1 flex items-center justify-start gap-1.5 min-w-0 text-left">
            <span className={`text-[10px] font-condensed font-black uppercase tracking-wider truncate ${visitaWinner ? 'text-primary' : 'text-foreground'}`}>
              {teamV.length > 8 ? teamV.substring(0, 6).toUpperCase() + '..' : teamV}
            </span>
          </div>
        </div>

        <div className="shrink-0 border-l border-border/20 dark:border-white/[0.05] pl-2.5 flex flex-col gap-1.5 justify-center min-w-[80px]">
          <button
            onClick={() => navigate(`/partidos-ut/${partido.id}`)}
            className="w-full py-1 text-[8px] font-condensed font-black tracking-wider uppercase bg-primary/5 text-primary border border-primary/20 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300 cursor-pointer text-center font-black"
          >
            {isFinished ? 'Analizar' : 'Ficha'}
          </button>
          {!isFinished && isCapitan && (
            <button
              onClick={() => openReportModal(partido)}
              className="w-full py-1 text-[8px] font-condensed font-black tracking-wider uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-lg hover:bg-amber-500 hover:text-black transition-all duration-300 cursor-pointer text-center font-black animate-pulse"
            >
              Reportar
            </button>
          )}
        </div>
      </div>
    </>
  );
}
