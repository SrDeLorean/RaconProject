import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import Badge from '@/components/ui/Badge';
import TacticVisualizer3D from './TacticVisualizer3D';
import Spinner from '@/components/ui/Spinner';


export default function TotwTots() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('totw');
  const [organizations, setOrganizations] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [competitions, setCompetitions] = useState([]);

  // States for filters
  const [selectedOrg, setSelectedOrg] = useState('todas');
  const [selectedSeason, setSelectedSeason] = useState('todas');
  const [selectedComp, setSelectedComp] = useState('todas');

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load organizations initially
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const response = await api.get('/organizaciones', { params: { per_page: 50 } });
        setOrganizations(response.data.data || response.data || []);
      } catch (error) {
        console.error("Error al obtener organizaciones:", error);
      }
    };
    fetchOrgs();
  }, []);

  // Update seasons and competitions when organization changes
  useEffect(() => {
    const fetchOrgDetails = async () => {
      if (selectedOrg === 'todas') {
        setSeasons([]);
        setCompetitions([]);
        setSelectedSeason('todas');
        setSelectedComp('todas');
        return;
      }
      try {
        const response = await api.get(`/organizaciones/${selectedOrg}`);
        const orgData = response.data;
        const temps = orgData.temporadas || [];
        setSeasons(temps);

        // Gather all competencies of all seasons
        const comps = [];
        temps.forEach(t => {
          if (t.competencias) {
            t.competencias.forEach(c => {
              comps.push({ ...c, temporada_nombre: t.nombre });
            });
          }
        });
        setCompetitions(comps);
        setSelectedSeason('todas');
        setSelectedComp('todas');
      } catch (error) {
        console.error("Error al obtener temporadas de organización:", error);
      }
    };
    fetchOrgDetails();
  }, [selectedOrg]);

  // Fetch TOTW / TOTS players based on filters and activeTab
  useEffect(() => {
    const fetchIdealTeam = async () => {
      setLoading(true);
      try {
        const response = await api.get('/analytics/totw-tots', {
          params: {
            organizacion_id: selectedOrg,
            temporada_id: selectedSeason,
            competencia_id: selectedComp,
            active_tab: activeTab
          }
        });
        setPlayers(response.data || []);
      } catch (error) {
        console.error("Error al obtener once ideal:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchIdealTeam();
  }, [activeTab, selectedOrg, selectedSeason, selectedComp]);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8000${path}`;
  };

  return (
    <div className="relative min-h-screen bg-background pb-16 overflow-hidden text-foreground">
      {/* Resplandores ambientales e-sports */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-primary/8 blur-[130px] rounded-full pointer-events-none z-10"></div>
      <div className="absolute bottom-1/3 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-10"></div>

      {/* ========================================================================= */}
      {/* 1. HERO CENTRAL (Cinemático y Táctico)                                    */}
      {/* ========================================================================= */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 pt-32 md:pt-40 pb-16 overflow-hidden">
        
        {/* Palabras de fondo brush estilo editorial */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
          <span className="absolute top-10 left-10 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[2px] float-brush-1">
            ONCE IDEAL
          </span>
          <span className="absolute bottom-10 right-20 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[3px] float-brush-2">
            TOTW
          </span>
          <span className="absolute top-1/2 left-1/3 -translate-y-1/2 text-[10rem] md:text-[15rem] font-display font-black uppercase text-foreground/[0.01] dark:text-foreground/[0.02] blur-[4px]">
            TOTS
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16 items-center relative z-10">
          
          {/* LADO IZQUIERDO — IMPACTO PRINCIPAL */}
          <div className="lg:col-span-7 relative flex flex-col items-start gap-4 animate-fade-in-up">
            
            {/* Número gigante transparente de fondo */}
            <div className="absolute -top-16 -left-12 text-[15rem] md:text-[23rem] font-display font-black text-foreground/[0.035] dark:text-foreground/[0.045] select-none leading-none pointer-events-none font-extrabold tracking-tighter">
              {players.length || 11}
            </div>

            <Badge 
              variant="primary" 
              className="px-5 py-2 text-[10px] font-condensed tracking-[0.2em] text-primary border border-primary/30 bg-primary/10 rounded-full shadow-[0_0_20px_hsla(var(--primary),0.15)] uppercase animate-pulse shrink-0 z-10"
            >
              🔥 Once Ideal Matemático
            </Badge>

            <h1 className="text-4xl sm:text-8xl md:text-9xl font-display font-black text-foreground uppercase tracking-[0.01em] leading-[0.82] drop-shadow-2xl z-10 mt-2 select-none">
              TOTW & <br />
              <span className="text-primary tracking-tight font-black shimmer-text">
                TOTS ELITE.
              </span>
            </h1>

            <p className="text-xs md:text-sm text-muted-foreground font-sans max-w-xl leading-relaxed tracking-wide font-light z-10 mt-2">
              Conoce a los once jugadores más determinantes de la semana (TOTW) y de la temporada (TOTS) calculados mediante algoritmos matemáticos basados en desempeño real.
            </p>
          </div>

          {/* DERECHA — INFORMACIÓN TÁCTICA */}
          <div className="lg:col-span-3 flex flex-col justify-center items-start lg:items-stretch gap-6 z-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="border border-border/40 bg-card/45 backdrop-blur-md rounded-2xl p-6 w-full space-y-4 shadow-xl">
              
              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                <span className="text-[10px] font-condensed tracking-widest text-muted-foreground uppercase">TELEMETRÍA REAL</span>
                <span className="text-[10px] font-mono text-primary font-bold">DREAM TEAM</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">INTEGRANTES</h4>
                  <span className="text-3xl font-display font-black text-foreground">{players.length}</span>
                </div>
                <div>
                  <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">CATEGORÍA</h4>
                  <span className="text-3xl font-display font-black text-primary truncate max-w-[80px]" title={activeTab}>{activeTab.toUpperCase()}</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed font-sans font-light">
                Cálculos ponderados automáticamente mediante goles, asistencias y calificaciones arbitrales de cada jornada.
              </p>

              <button 
                onClick={() => setActiveTab(activeTab === 'totw' ? 'tots' : 'totw')}
                className="w-full py-4 text-xs font-condensed tracking-widest uppercase rounded-lg text-primary-foreground font-black cursor-pointer btn-glossy"
              >
                CAMBIAR A {activeTab === 'totw' ? 'TOTS' : 'TOTW'}
              </button>
            </div>
          </div>

        </div>

      </section>

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 space-y-10">

        {/* Panel de Filtros Multicircuito Premium */}
        <div className="filter-panel max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Organizaciones */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block font-mono">
              🛡️ Circuito / Organización
            </label>
            <select 
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-all uppercase"
            >
              <option value="todas">🌎 Todas (Comparar Todo)</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.nombre}</option>
              ))}
            </select>
          </div>

          {/* Temporadas */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block font-mono">
              📅 Temporada
            </label>
            <select 
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              disabled={selectedOrg === 'todas'}
              className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-all disabled:opacity-50 uppercase"
            >
              <option value="todas">🌎 Todas las Temporadas</option>
              {seasons.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          {/* Competencias */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block font-mono">
              🏆 División / Competencia
            </label>
            <select 
              value={selectedComp}
              onChange={(e) => setSelectedComp(e.target.value)}
              disabled={selectedOrg === 'todas'}
              className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-all disabled:opacity-50 uppercase"
            >
              <option value="todas">🌎 Todas las Competencias</option>
              {competitions.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.temporada_nombre?.substring(20)})</option>
              ))}
            </select>
          </div>

        </div>

        {/* TABS DE SELECCIÓN DE RECONOCIMIENTO */}
        <div className="flex justify-center">
          <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border border-border/40 overflow-x-auto">
            {[
              { id: 'totw', label: '⭐ Team of the Week (TOTW)' },
              { id: 'tots', label: '🔥 Team of the Season (TOTS)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-md text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id 
                    ? 'bg-background text-primary shadow-sm border border-border/40' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Soccer Pitch Visualizer */}
        {loading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
              <div className="lg:col-span-7 skeleton-shimmer h-[500px] rounded-2xl"></div>
              <div className="lg:col-span-5 skeleton-shimmer h-[500px] rounded-2xl"></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
            {/* Soccer Pitch Visualizer Column */}
            <div className="lg:col-span-7">
              <TacticVisualizer3D players={players} />
            </div>

            {/* Detailed Players Stats Panel Column */}
            <div className="lg:col-span-5 border border-border/50 bg-card/25 backdrop-blur-md rounded-3xl p-5 space-y-4 max-h-[650px] overflow-y-auto shadow-xl scrollbar-thin flex flex-col">
              <div className="border-b border-border/20 pb-3 shrink-0">
                <h3 className="text-sm font-black uppercase text-primary tracking-widest flex items-center gap-1.5">
                  📋 Ficha del Once Ideal
                </h3>
                <p className="text-[9px] text-muted-foreground">Detalle del rendimiento estadístico individual</p>
              </div>

              {players.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-20 text-center">
                  <p className="text-xs text-muted-foreground">No hay jugadores disponibles para esta selección.</p>
                </div>
              ) : (
                <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                  {players.map((p, idx) => {
                    const isRealPlayer = p.id && p.id < 700;
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-4 p-3 rounded-xl border border-slate-800/40 bg-slate-900/15 transition-all duration-300 cursor-pointer border-l-4 border-l-transparent hover:border-l-amber-500 hover:bg-slate-900/45 hover:translate-x-1 hover:shadow-lg`}
                        onClick={() => isRealPlayer && navigate(`/jugadores/${p.id}`)}
                      >
                        {/* Caja de Valoración (Perfectamente centrada, bordes suaves rounded-xl) */}
                        <div className="shrink-0 w-11 h-11 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex flex-col items-center justify-center text-center shadow-md border border-amber-400/35 select-none">
                          <span className="text-sm font-black text-slate-950 leading-none">{p.rating}</span>
                          <span className="text-[7.5px] font-black text-slate-950/80 uppercase tracking-widest leading-none mt-0.5">{p.pos}</span>
                        </div>

                        {/* Photo/Avatar */}
                        <div className="shrink-0">
                          {p.foto ? (
                            <img src={getImageUrl(p.foto)} alt={p.name} className="w-9 h-9 rounded-full object-cover border border-slate-700/40" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-black text-[10px] uppercase text-primary">
                              {p.name?.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* Player Description: Hierarchy (Name first, then role subtitle) */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-black uppercase text-foreground truncate leading-tight tracking-wide">{p.name}</h4>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate leading-none">{p.equipo_nombre}</p>
                        </div>

                        {/* Composite Metrics (Extrema derecha, tipografía monoespaciada/pesada) */}
                        <div className="shrink-0 flex items-center gap-4 text-right pl-2 font-mono">
                          <div>
                            <p className="text-[8px] text-gray-400 font-bold tracking-wider leading-none">VAL</p>
                            <p className="text-sm font-black text-amber-500 leading-none mt-1">
                              {parseFloat(p.promedio_valoracion || p.rating/10).toFixed(1)}
                            </p>
                          </div>
                          {p.total_goles > 0 && (
                            <div>
                              <p className="text-[8px] text-gray-400 font-bold tracking-wider leading-none">GOL</p>
                              <p className="text-sm font-black text-emerald-400 leading-none mt-1">{p.total_goles}</p>
                            </div>
                          )}
                          {p.total_asistencias > 0 && (
                            <div>
                              <p className="text-[8px] text-gray-400 font-bold tracking-wider leading-none">AST</p>
                              <p className="text-sm font-black text-cyan-400 leading-none mt-1">{p.total_asistencias}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
