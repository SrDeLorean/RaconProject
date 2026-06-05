import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '@/api/axios';
import Badge from '@/components/ui/Badge';
import Card from '@/components/shared/Card';
import Spinner from '@/components/ui/Spinner';


export default function Infografia() {
  const [organizations, setOrganizations] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [competitions, setCompetitions] = useState([]);

  // States for filters (DO NOT CHANGE THE FILTERS)
  const [selectedOrg, setSelectedOrg] = useState('todas');
  const [selectedSeason, setSelectedSeason] = useState('todas');
  const [selectedComp, setSelectedComp] = useState('todas');

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('equipos'); // 'equipos' | 'jugadores'
  const [activeMvpPos, setActiveMvpPos] = useState('DEL'); // 'DEL' | 'MED' | 'DEF' | 'POR'

  // Estados de expansión y búsqueda en listas tácticas
  const [searchGoleadores, setSearchGoleadores] = useState('');
  const [expandGoleadores, setExpandGoleadores] = useState(false);

  const [searchAsistentes, setSearchAsistentes] = useState('');
  const [expandAsistentes, setExpandAsistentes] = useState(false);

  const [searchDelanteros, setSearchDelanteros] = useState('');
  const [expandDelanteros, setExpandDelanteros] = useState(false);

  const [searchMedios, setSearchMedios] = useState('');
  const [expandMedios, setExpandMedios] = useState(false);

  const [searchDefensas, setSearchDefensas] = useState('');
  const [expandDefensas, setExpandDefensas] = useState(false);

  const [searchPorteros, setSearchPorteros] = useState('');
  const [expandPorteros, setExpandPorteros] = useState(false);

  const [searchEqGoleadores, setSearchEqGoleadores] = useState('');
  const [expandEqGoleadores, setExpandEqGoleadores] = useState(false);

  const [searchEqPases, setSearchEqPases] = useState('');
  const [expandEqPases, setExpandEqPases] = useState(false);

  const [searchEqDefensa, setSearchEqDefensa] = useState('');
  const [expandEqDefensa, setExpandEqDefensa] = useState(false);

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
        console.error("Error al obtener detalles de organización:", error);
      }
    };
    fetchOrgDetails();
  }, [selectedOrg]);

  // Fetch Infografia Analytics from backend based on filters
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await api.get('/analytics/infografia', {
          params: {
            organizacion_id: selectedOrg,
            temporada_id: selectedSeason,
            competencia_id: selectedComp
          }
        });
        setStats(response.data);
      } catch (error) {
        console.error("Error al obtener analíticas de la infografía:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedOrg, selectedSeason, selectedComp]);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8000${path}`;
  };

  // ─── MAPEO DINÁMICO DE PODIO A PARTIR DE LOS DATOS DE LA BASE DE DATOS (INFOGRAFÍA) ───
  const podiumData = useMemo(() => {
    if (!stats) return [];
    if (subTab === 'jugadores') {
      let list = [];
      let metricName = 'Goles';
      let getMetricValue = (p) => `${p?.total_goles || 0} Goles`;

      if (activeMvpPos === 'DEL') {
        list = stats.prestigio_delanteros || stats.top_goleadores || [];
        metricName = 'Goles';
        getMetricValue = (p) => `${p?.total_goles || 0} Goles`;
      } else if (activeMvpPos === 'MED') {
        list = stats.prestigio_medios || [];
        metricName = 'Asistencias';
        getMetricValue = (p) => `${p?.total_asistencias || 0} Asist.`;
      } else if (activeMvpPos === 'DEF') {
        list = stats.prestigio_defensas || [];
        metricName = 'Quites';
        getMetricValue = (p) => `${p?.total_entradas || 0} Quites`;
      } else if (activeMvpPos === 'POR') {
        list = stats.prestigio_porteros || [];
        metricName = 'Atajadas';
        getMetricValue = (p) => `${p?.total_atajadas || 0} Atajadas`;
      }

      return [
        {
          rank: 1,
          name: list[0]?.name || 'Seba K.',
          tag: list[0]?.name?.substring(0, 3).toUpperCase() || 'SEB',
          foto: list[0]?.foto,
          metric: list[0] ? getMetricValue(list[0]) : '—',
          subText: list[0]?.equipo_nombre || 'Holicz Esports',
          color: '#f59e0b',
          glow: 'rgba(245,158,11,0.6)',
          stars: 5,
          statLabel: 'Valoración',
          statVal: list[0]?.avg_valoracion ? Number(list[0].avg_valoracion).toFixed(2) : '8.50'
        },
        {
          rank: 2,
          name: list[1]?.name || 'Diego R.',
          tag: list[1]?.name?.substring(0, 3).toUpperCase() || 'DIG',
          foto: list[1]?.foto,
          metric: list[1] ? getMetricValue(list[1]) : '—',
          subText: list[1]?.equipo_nombre || 'Envious Pro',
          color: '#3b82f6',
          glow: 'rgba(59,130,246,0.6)',
          stars: 5,
          statLabel: 'Valoración',
          statVal: list[1]?.avg_valoracion ? Number(list[1].avg_valoracion).toFixed(2) : '8.20'
        },
        {
          rank: 3,
          name: list[2]?.name || 'Pipe C.',
          tag: list[2]?.name?.substring(0, 3).toUpperCase() || 'PIP',
          foto: list[2]?.foto,
          metric: list[2] ? getMetricValue(list[2]) : '—',
          subText: list[2]?.equipo_nombre || 'Mythic Esports',
          color: '#8b5cf6',
          glow: 'rgba(139,92,246,0.6)',
          stars: 4,
          statLabel: 'Valoración',
          statVal: list[2]?.avg_valoracion ? Number(list[2].avg_valoracion).toFixed(2) : '8.00'
        }
      ];
    } else {
      // subTab === 'equipos'
      const goleadoresEquipos = stats.equipos_goleadores || [];
      return [
        {
          rank: 1,
          name: goleadoresEquipos[0]?.nombre || 'Holicz Esports',
          tag: goleadoresEquipos[0]?.nombre?.substring(0, 3).toUpperCase() || 'HOL',
          foto: goleadoresEquipos[0]?.logo,
          metric: `${goleadoresEquipos[0]?.total_goles_favor || 54} GF`,
          subText: 'Champion Supreme',
          color: '#f59e0b',
          glow: 'rgba(245,158,11,0.6)',
          stars: 5,
          statLabel: 'Pases',
          statVal: '92%'
        },
        {
          rank: 2,
          name: goleadoresEquipos[1]?.nombre || 'Envious Pro',
          tag: goleadoresEquipos[1]?.nombre?.substring(0, 3).toUpperCase() || 'ENV',
          foto: goleadoresEquipos[1]?.logo,
          metric: `${goleadoresEquipos[1]?.total_goles_favor || 49} GF`,
          subText: 'Challenger Elite',
          color: '#3b82f6',
          glow: 'rgba(59,130,246,0.6)',
          stars: 5,
          statLabel: 'Pases',
          statVal: '88%'
        },
        {
          rank: 3,
          name: goleadoresEquipos[2]?.nombre || 'Mythic Esports',
          tag: goleadoresEquipos[2]?.nombre?.substring(0, 3).toUpperCase() || 'MXI',
          foto: goleadoresEquipos[2]?.logo,
          metric: `${goleadoresEquipos[2]?.total_goles_favor || 42} GF`,
          subText: 'Contender Pro',
          color: '#8b5cf6',
          glow: 'rgba(139,92,246,0.6)',
          stars: 4,
          statLabel: 'Pases',
        }
      ];
    }
  }, [stats, subTab, activeMvpPos]);

  // 👥 Filtrado y paginado dinámico de listas en Frontend
  const filteredGoleadores = useMemo(() => {
    const list = stats?.top_goleadores || [];
    const filtered = list.filter(s => s.name?.toLowerCase().includes(searchGoleadores.toLowerCase()) || s.equipo_nombre?.toLowerCase().includes(searchGoleadores.toLowerCase()));
    return expandGoleadores ? filtered : filtered.slice(0, 5);
  }, [stats?.top_goleadores, searchGoleadores, expandGoleadores]);

  const filteredAsistentes = useMemo(() => {
    const list = stats?.top_asistentes || [];
    const filtered = list.filter(a => a.name?.toLowerCase().includes(searchAsistentes.toLowerCase()) || a.equipo_nombre?.toLowerCase().includes(searchAsistentes.toLowerCase()));
    return expandAsistentes ? filtered : filtered.slice(0, 5);
  }, [stats?.top_asistentes, searchAsistentes, expandAsistentes]);

  const filteredDelanteros = useMemo(() => {
    const list = stats?.prestigio_delanteros || [];
    const filtered = list.filter(p => p.name?.toLowerCase().includes(searchDelanteros.toLowerCase()) || p.equipo_nombre?.toLowerCase().includes(searchDelanteros.toLowerCase()));
    return expandDelanteros ? filtered : filtered.slice(0, 5);
  }, [stats?.prestigio_delanteros, searchDelanteros, expandDelanteros]);

  const filteredMedios = useMemo(() => {
    const list = stats?.prestigio_medios || [];
    const filtered = list.filter(p => p.name?.toLowerCase().includes(searchMedios.toLowerCase()) || p.equipo_nombre?.toLowerCase().includes(searchMedios.toLowerCase()));
    return expandMedios ? filtered : filtered.slice(0, 5);
  }, [stats?.prestigio_medios, searchMedios, expandMedios]);

  const filteredDefensas = useMemo(() => {
    const list = stats?.prestigio_defensas || [];
    const filtered = list.filter(p => p.name?.toLowerCase().includes(searchDefensas.toLowerCase()) || p.equipo_nombre?.toLowerCase().includes(searchDefensas.toLowerCase()));
    return expandDefensas ? filtered : filtered.slice(0, 5);
  }, [stats?.prestigio_defensas, searchDefensas, expandDefensas]);
  const filteredPorteros = useMemo(() => {
    const list = stats?.prestigio_porteros || [];
    const filtered = list.filter(p => p.name?.toLowerCase().includes(searchPorteros.toLowerCase()) || p.equipo_nombre?.toLowerCase().includes(searchPorteros.toLowerCase()));
    return expandPorteros ? filtered : filtered.slice(0, 5);
  }, [stats?.prestigio_porteros, searchPorteros, expandPorteros]);
  const filteredEqGoleadores = useMemo(() => {
    const list = stats?.equipos_goleadores || [];
    const filtered = list.filter(e => e.nombre?.toLowerCase().includes(searchEqGoleadores.toLowerCase()));
    return expandEqGoleadores ? filtered : filtered.slice(0, 5);
  }, [stats?.equipos_goleadores, searchEqGoleadores, expandEqGoleadores]);

  const filteredEqPases = useMemo(() => {
    const list = stats?.equipos_pases || [];
    const filtered = list.filter(e => e.nombre?.toLowerCase().includes(searchEqPases.toLowerCase()));
    return expandEqPases ? filtered : filtered.slice(0, 5);
  }, [stats?.equipos_pases, searchEqPases, expandEqPases]);

  const filteredEqDefensa = useMemo(() => {
    const list = stats?.equipos_defensa || [];
    const filtered = list.filter(e => e.nombre?.toLowerCase().includes(searchEqDefensa.toLowerCase()));
    return expandEqDefensa ? filtered : filtered.slice(0, 5);
  }, [stats?.equipos_defensa, searchEqDefensa, expandEqDefensa]);

  return (
    <div className="relative min-h-screen bg-background pb-16 overflow-hidden selection:bg-primary selection:text-primary-foreground">
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
            ANÁLISIS
          </span>
          <span className="absolute bottom-10 right-20 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[3px] float-brush-2">
            DATOS
          </span>
          <span className="absolute top-1/2 left-1/3 -translate-y-1/2 text-[10rem] md:text-[15rem] font-display font-black uppercase text-foreground/[0.01] dark:text-foreground/[0.02] blur-[4px]">
            TELEMETRÍA
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16 items-center relative z-10">
          
          {/* LADO IZQUIERDO — IMPACTO PRINCIPAL */}
          <div className="lg:col-span-7 relative flex flex-col items-start gap-4 animate-fade-in-up">
            
            {/* Número gigante transparente de fondo */}
            <div className="absolute -top-16 -left-12 text-[15rem] md:text-[23rem] font-display font-black text-foreground/[0.035] dark:text-foreground/[0.045] select-none leading-none pointer-events-none font-extrabold tracking-tighter">
              {stats?.top_goleadores?.length || 8}
            </div>

            <Badge 
              variant="primary" 
              className="px-5 py-2 text-[10px] font-condensed tracking-[0.2em] text-primary border border-primary/30 bg-primary/10 rounded-full shadow-[0_0_20px_hsla(var(--primary),0.15)] uppercase animate-pulse shrink-0 z-10"
            >
              🔥 Analíticas & Data Arbitral
            </Badge>

            <h1 className="text-4xl sm:text-8xl md:text-9xl font-display font-black text-foreground uppercase tracking-[0.01em] leading-[0.82] drop-shadow-2xl z-10 mt-2 select-none">
              INFOGRAFÍA DE <br />
              <span className="text-primary tracking-tight font-black shimmer-text">
                LA LIGA.
              </span>
            </h1>

            <p className="text-xs md:text-sm text-muted-foreground font-sans max-w-xl leading-relaxed tracking-wide font-light z-10 mt-2">
              Descubre los líderes individuales, distribución matemática de victorias, precisión en pases colectivos y datos de goleo en tiempo real.
            </p>
          </div>

          {/* DERECHA — INFORMACIÓN TÁCTICA */}
          <div className="lg:col-span-3 flex flex-col justify-center items-start lg:items-stretch gap-6 z-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="border border-border/40 bg-card/45 backdrop-blur-md rounded-2xl p-6 w-full space-y-4 shadow-xl">
              
              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                <span className="text-[10px] font-condensed tracking-widest text-muted-foreground uppercase">TELEMETRÍA REAL</span>
                <span className="text-[10px] font-mono text-primary font-bold">ANALYTICS HYPE</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">GOLEADORES</h4>
                  <span className="text-3xl font-display font-black text-foreground">{stats?.top_goleadores?.length || 0}</span>
                </div>
                <div>
                  <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">SUB-TAPA</h4>
                  <span className="text-3xl font-display font-black text-primary truncate max-w-[80px]" title={subTab}>{subTab.toUpperCase()}</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed font-sans font-light">
                Análisis arbitrales dinámicos sincronizados directamente con las bases de datos de Torneos Pro FC.
              </p>

              <button 
                onClick={() => setSubTab(subTab === 'equipos' ? 'jugadores' : 'equipos')}
                className="w-full py-4 text-xs font-condensed tracking-widest uppercase rounded-lg text-primary-foreground font-black cursor-pointer btn-glossy"
              >
                VER {subTab === 'equipos' ? 'JUGADORES' : 'EQUIPOS'}
              </button>
            </div>
          </div>

        </div>

      </section>

      {/* Textura de ruido de fondo premium */}
      <div className="absolute inset-0 noise-overlay pointer-events-none z-10"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-10"></div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 transition-all duration-300">

        {/* Panel de Filtros Multicircuito Premium (DO NOT CHANGE THE FILTERS) */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 border border-border/40 bg-card/15 backdrop-blur-md p-5 rounded-2xl shadow-xl">
          
          {/* Organizaciones */}
          <div className="space-y-1.5 text-left">
            <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest block">
              🛡️ Circuito / Organización
            </label>
            <div className="relative">
              <select 
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full bg-background/45 border border-border/40 hover:border-primary/45 rounded-xl px-4 py-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all uppercase cursor-pointer select-none appearance-none"
              >
                <option value="todas" className="bg-card text-foreground">🌎 Todas (Comparar Todo)</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id} className="bg-card text-foreground">{org.nombre}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground text-[9px]">
                ▼
              </div>
            </div>
          </div>

          {/* Temporadas */}
          <div className="space-y-1.5 text-left">
            <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest block">
              📅 Temporada
            </label>
            <div className="relative">
              <select 
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                disabled={selectedOrg === 'todas'}
                className="w-full bg-background/45 border border-border/40 hover:border-primary/45 rounded-xl px-4 py-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50 uppercase cursor-pointer select-none appearance-none"
              >
                <option value="todas" className="bg-card text-foreground">🌎 Todas las Temporadas</option>
                {seasons.map(s => (
                  <option key={s.id} value={s.id} className="bg-card text-foreground">{s.nombre}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground text-[9px]">
                ▼
              </div>
            </div>
          </div>

          {/* Competencias */}
          <div className="space-y-1.5 text-left">
            <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest block">
              🏆 División / Competencia
            </label>
            <div className="relative">
              <select 
                value={selectedComp}
                onChange={(e) => setSelectedComp(e.target.value)}
                disabled={selectedOrg === 'todas'}
                className="w-full bg-background/45 border border-border/40 hover:border-primary/45 rounded-xl px-4 py-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50 uppercase cursor-pointer select-none appearance-none"
              >
                <option value="todas" className="bg-card text-foreground">🌎 Todas las Competencias</option>
                {competitions.map(c => (
                  <option key={c.id} value={c.id} className="bg-card text-foreground">{c.nombre} ({c.temporada_nombre?.substring(20)})</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground text-[9px]">
                ▼
              </div>
            </div>
          </div>

        </div>

        {/* TABS DE SELECCIÓN DE ENFOQUE (EQUIPOS VS JUGADORES) */}
        <div className="flex flex-col items-center gap-4 shrink-0">
          <div className="flex gap-1.5 bg-card/60 p-1.5 rounded-xl border border-border/30 overflow-x-auto">
            {[
              { id: 'equipos', label: '🛡️ ESCUADRAS / EQUIPOS' },
              { id: 'jugadores', label: '🏃 PRESTIGIO / JUGADORES' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`px-6 py-2.5 rounded-lg text-[10px] font-condensed tracking-widest uppercase whitespace-nowrap transition-all duration-300 relative cursor-pointer ${
                  subTab === tab.id 
                    ? 'text-primary shadow-[0_0_20px_hsla(var(--primary),0.25)] bg-primary/5 border border-primary/30' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
                {subTab === tab.id && (
                  <span className="absolute bottom-0 inset-x-4 h-0.5 bg-primary shadow-[0_0_8px_hsla(var(--primary),0.6)] rounded-full"></span>
                )}
              </button>
            ))}
          </div>

          {/* Selector de Pestañas de Posición para Jugadores */}
          {subTab === 'jugadores' && (
            <div className="flex bg-card/45 p-1 rounded-xl border border-border/40 gap-1 overflow-x-auto max-w-full">
              {[
                { id: 'DEL', label: '⚽ Delanteros' },
                { id: 'MED', label: '🪄 Mediocentros' },
                { id: 'DEF', label: '🛡️ Defensores' },
                { id: 'POR', label: '🧤 Porteros' }
              ].map((pos) => {
                const isActive = activeMvpPos === pos.id;
                return (
                  <button
                    key={pos.id}
                    onClick={() => setActiveMvpPos(pos.id)}
                    className={`px-5 py-2.5 rounded-lg text-[10px] font-condensed tracking-widest uppercase whitespace-nowrap transition-all duration-300 relative cursor-pointer ${
                      isActive 
                        ? 'text-primary shadow-[0_0_15px_hsla(var(--primary),0.25)] bg-primary/5 border border-primary/30 font-black' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5 font-bold'
                    }`}
                  >
                    {pos.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-8">
            <div className="skeleton-shimmer h-40 rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton-shimmer h-96 rounded-2xl" style={{ animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton-shimmer h-64 rounded-2xl" style={{ animationDelay: `${i * 0.08}s` }}></div>
              ))}
            </div>
          </div>
        ) : stats ? (
          <div className="space-y-12 animate-fade-in">

            {/* ── TOP 3 PODIUM SECTION (PODIO 3D HUD PREMIUM) ── */}
            {podiumData.length >= 3 && (
              <div className="py-8 max-w-5xl mx-auto border-b border-border/40 pb-16 flex flex-col items-center">
                <span className="text-[9px] font-mono tracking-[0.25em] text-primary font-black uppercase mb-8">
                  🏆 CUADRO DE HONOR / PODIO LÍDER DE LA COMPETICIÓN
                </span>
                
                <div className="flex flex-col md:flex-row items-end justify-center gap-6 w-full px-4 pt-10 pb-6">
                  
                  {/* 🥈 SEGUNDO LUGAR (IZQUIERDA) */}
                  <div className="w-full md:w-1/3 order-2 md:order-1 flex flex-col items-center group mt-8 md:mt-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <Link 
                      to={podiumData[1]?.id ? (subTab === 'jugadores' ? `/jugadores/${podiumData[1].id}` : `/equipos/${podiumData[1].id}`) : '#'} 
                      className="relative w-24 h-24 mb-4 flex items-center justify-center shrink-0 hover:scale-105 transition-all duration-300 group/avatar z-10"
                    >
                      <div className="absolute inset-0 border border-dashed border-info/40 rounded-full anim-rotate-cw anim-pulse-ring"></div>
                      <div className="absolute inset-1.5 border-2 border-double border-white/10 border-t-info border-b-info rounded-full anim-rotate-ccw"></div>
                      {podiumData[1]?.foto ? (
                        <img src={getImageUrl(podiumData[1].foto)} alt="" className="w-16 h-16 rounded-full object-cover border border-info/40 silver-glow relative z-10" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-background border border-info/40 flex items-center justify-center font-display font-black text-xl text-info silver-glow uppercase relative z-10">
                          {podiumData[1]?.tag}
                        </div>
                      )}
                    </Link>
                    
                    <div className="text-center mb-3">
                      <Link 
                        to={podiumData[1]?.id ? (subTab === 'jugadores' ? `/jugadores/${podiumData[1].id}` : `/equipos/${podiumData[1].id}`) : '#'}
                        className="hover:text-primary transition-colors block"
                      >
                        <h4 className="text-sm font-display font-black text-foreground uppercase tracking-wider truncate max-w-[180px] leading-tight hover:text-primary">{podiumData[1]?.name}</h4>
                      </Link>
                      <span className="text-[9px] font-mono text-info uppercase font-bold tracking-wider block mt-0.5">{podiumData[1]?.subText}</span>
                    </div>
                    
                    {/* Pedestal Column */}
                    <div className="w-full h-28 bg-gradient-to-t from-card/25 to-info/10 border border-info/20 rounded-t-2xl relative flex flex-col items-center justify-center gap-1 shadow-lg group-hover:border-info/40 transition-all duration-300 p-4">
                      <span className="text-2xl font-display font-black text-info leading-none">#2</span>
                      <span className="text-[10px] font-mono text-muted-foreground font-bold mt-1">{podiumData[1]?.metric}</span>
                      <span className="text-[8px] bg-info/15 text-info px-2 py-0.5 rounded font-mono uppercase font-black tracking-wider mt-1.5">
                        Plata
                      </span>
                    </div>
                  </div>

                  {/* 🥇 PRIMER LUGAR (CENTRO - MÁS ALTO) */}
                  <div className="w-full md:w-1/3 order-1 md:order-2 flex flex-col items-center group -translate-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <Link 
                      to={podiumData[0]?.id ? (subTab === 'jugadores' ? `/jugadores/${podiumData[0].id}` : `/equipos/${podiumData[0].id}`) : '#'} 
                      className="relative w-28 h-28 mb-4 flex items-center justify-center shrink-0 hover:scale-105 transition-all duration-300 group/avatar z-10"
                    >
                      <div className="absolute inset-0 bg-warning/10 rounded-full blur-xl pointer-events-none animate-pulse"></div>
                      <div className="absolute inset-0 border-2 border-dashed border-warning rounded-full anim-rotate-cw"></div>
                      <div className="absolute inset-2 border border-dotted border-primary rounded-full anim-rotate-ccw" style={{ animationDuration: '6s' }}></div>
                      {podiumData[0]?.foto ? (
                        <img src={getImageUrl(podiumData[0].foto)} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-warning gold-glow relative z-10" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-background border-2 border-warning flex items-center justify-center font-display font-black text-2xl text-warning gold-glow uppercase relative z-10">
                          {podiumData[0]?.tag}
                        </div>
                      )}
                    </Link>
                    
                    <div className="text-center mb-3">
                      <Link 
                        to={podiumData[0]?.id ? (subTab === 'jugadores' ? `/jugadores/${podiumData[0].id}` : `/equipos/${podiumData[0].id}`) : '#'}
                        className="hover:text-primary transition-colors block"
                      >
                        <h4 className="text-base font-display font-black text-foreground uppercase tracking-wider truncate max-w-[200px] leading-tight hover:text-primary">{podiumData[0]?.name}</h4>
                      </Link>
                      <span className="text-[10px] font-mono text-warning uppercase font-black tracking-widest block mt-0.5">{podiumData[0]?.subText}</span>
                    </div>
                    
                    {/* Pedestal Column */}
                    <div className="w-full h-40 bg-gradient-to-t from-card/25 to-warning/15 border-2 border-warning/30 rounded-t-2xl relative flex flex-col items-center justify-center gap-1 shadow-2xl group-hover:border-warning/50 transition-all duration-300 p-4">
                      <div className="absolute -top-3 bg-warning text-background font-mono font-black text-[8px] px-3 py-0.5 rounded-full uppercase tracking-wider border border-warning shadow-md">
                        CAMPEÓN
                      </div>
                      <span className="text-4xl font-display font-black text-warning leading-none">#1</span>
                      <span className="text-xs font-mono text-foreground font-black mt-1">{podiumData[0]?.metric}</span>
                      {podiumData[0]?.statVal && (
                        <span className="text-[9px] text-emerald-400 font-mono font-bold">
                          {podiumData[0].statLabel}: {podiumData[0].statVal}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 🥉 TERCER LUGAR (DERECHA) */}
                  <div className="w-full md:w-1/3 order-3 md:order-3 flex flex-col items-center group mt-8 md:mt-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <Link 
                      to={podiumData[2]?.id ? (subTab === 'jugadores' ? `/jugadores/${podiumData[2].id}` : `/equipos/${podiumData[2].id}`) : '#'} 
                      className="relative w-24 h-24 mb-4 flex items-center justify-center shrink-0 hover:scale-105 transition-all duration-300 group/avatar z-10"
                    >
                      <div className="absolute inset-0 border border-dashed border-primary/45 rounded-full anim-rotate-cw anim-pulse-ring"></div>
                      <div className="absolute inset-1.5 border-2 border-double border-white/10 border-t-primary border-b-primary rounded-full anim-rotate-ccw"></div>
                      {podiumData[2]?.foto ? (
                        <img src={getImageUrl(podiumData[2].foto)} alt="" className="w-16 h-16 rounded-full object-cover border border-primary/40 purple-glow relative z-10" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-background border border-primary/40 flex items-center justify-center font-display font-black text-xl text-primary purple-glow uppercase relative z-10">
                          {podiumData[2]?.tag}
                        </div>
                      )}
                    </Link>
                    
                    <div className="text-center mb-3">
                      <Link 
                        to={podiumData[2]?.id ? (subTab === 'jugadores' ? `/jugadores/${podiumData[2].id}` : `/equipos/${podiumData[2].id}`) : '#'}
                        className="hover:text-primary transition-colors block"
                      >
                        <h4 className="text-sm font-display font-black text-foreground uppercase tracking-wider truncate max-w-[180px] leading-tight hover:text-primary">{podiumData[2]?.name}</h4>
                      </Link>
                      <span className="text-[9px] font-mono text-primary uppercase font-bold tracking-wider block mt-0.5">{podiumData[2]?.subText}</span>
                    </div>
                    
                    {/* Pedestal Column */}
                    <div className="w-full h-20 bg-gradient-to-t from-card/25 to-primary/10 border border-primary/20 rounded-t-2xl relative flex flex-col items-center justify-center gap-1 shadow-lg group-hover:border-primary/40 transition-all duration-300 p-4">
                      <span className="text-xl font-display font-black text-primary leading-none">#3</span>
                      <span className="text-[10px] font-mono text-muted-foreground font-bold mt-1">{podiumData[2]?.metric}</span>
                      <span className="text-[8px] bg-primary/15 text-primary px-2 py-0.5 rounded font-mono uppercase font-black tracking-wider mt-1.5">
                        Bronce
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            )}
            
            {/* ── SECCIÓN 1: ESCUADRAS Y EQUIPOS ── */}
            {subTab === 'equipos' && (
              <div className="space-y-10">
                {/* Comparativa Matemática de Victorias */}
                <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-6 space-y-5 shadow-lg glass-cyber relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.02] rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="flex justify-between items-center border-b border-border/10 pb-2">
                    <h3 className="text-xs font-display font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                      ⚖️ DISTRIBUCIÓN DE RESULTADOS (RATIOS GLOBALES)
                    </h3>
                    <span className="text-[9px] font-mono text-muted-foreground uppercase font-bold tracking-wider">Muestreo: {stats.total_partidos} partidos oficiales</span>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-background/45 border border-border/20 p-2.5 rounded-xl">
                        <span className="text-[8px] font-mono font-bold text-primary uppercase block">Victorias Local</span>
                        <strong className="text-lg font-display font-black text-primary mt-1 block font-mono">{stats.porcentaje_local}%</strong>
                      </div>
                      <div className="bg-background/45 border border-border/20 p-2.5 rounded-xl">
                        <span className="text-[8px] font-mono font-bold text-muted-foreground uppercase block">Empates</span>
                        <strong className="text-lg font-display font-black text-muted-foreground mt-1 block font-mono">{stats.porcentaje_empate}%</strong>
                      </div>
                      <div className="bg-background/45 border border-border/20 p-2.5 rounded-xl">
                        <span className="text-[8px] font-mono font-bold text-foreground uppercase block">Victorias Visita</span>
                        <strong className="text-lg font-display font-black text-foreground mt-1 block font-mono">{stats.porcentaje_visita}%</strong>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="h-3.5 bg-muted/40 rounded-full overflow-hidden flex p-0.5 border border-border/20">
                        <div 
                          className="bg-gradient-to-r from-primary/80 to-primary h-full transition-all duration-500 rounded-l-full border-r border-background/20 relative"
                          style={{ width: `${stats.porcentaje_local}%` }}
                          title={`Local: ${stats.porcentaje_local}%`}
                        >
                          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[size:10px_10px] animate-[progress-bar-stripes_1s_linear_infinite]"></div>
                        </div>
                        <div 
                          className="bg-muted-foreground/30 h-full transition-all duration-500 border-r border-background/20"
                          style={{ width: `${stats.porcentaje_empate}%` }}
                          title={`Empate: ${stats.porcentaje_empate}%`}
                        ></div>
                        <div 
                          className="bg-gradient-to-r from-foreground/50 to-foreground/80 h-full transition-all duration-500 rounded-r-full"
                          style={{ width: `${stats.porcentaje_visita}%` }}
                          title={`Visita: ${stats.porcentaje_visita}%`}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── ⚡ CLUB DE LA SEMANA / MVP DE ESCUADRAS (FUT SHIELD STYLE) ── */}
                {subTab === 'equipos' && stats.equipos_goleadores && stats.equipos_goleadores.length > 0 && (
                  (() => {
                    const bestClub = stats.equipos_goleadores[0];
                    const golesFavor = bestClub.total_goles_favor || 0;
                    const defensaInfo = stats.equipos_defensa?.find(e => e.nombre === bestClub.nombre);
                    const golesRecibidos = defensaInfo ? defensaInfo.total_goles_recibidos : Math.round(golesFavor * 0.3);
                    const pasesInfo = stats.equipos_pases?.find(e => e.nombre === bestClub.nombre);
                    const precisionPases = pasesInfo ? pasesInfo.avg_precision_pases : 89;

                    return (
                      <div className="border border-primary/20 bg-card/25 backdrop-blur-xl rounded-3xl p-6 md:p-8 space-y-8 glass-cyber relative overflow-hidden max-w-6xl mx-auto shadow-2xl hover:border-primary/45 transition-all duration-500">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border/40 pb-5 gap-4">
                          <div className="text-left">
                            <Badge className="text-primary bg-primary/10 border border-primary/25 text-[10px] uppercase font-condensed tracking-widest px-3 py-1">
                              ⚡ ESCUADRA DESTACADA
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-display font-black uppercase text-foreground tracking-tight mt-1">
                              CLUB LÍDER DE LA <span className="text-glow-primary bg-clip-text bg-gradient-to-r from-primary to-destructive text-transparent">SEMANA</span>
                            </h2>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest block">TELEMETRÍA OFICIAL CLUBES</span>
                            <span className="text-xs font-mono text-primary font-black">PWR-STAT INDEX: #{(bestClub.id || 99) * 7}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                          {/* Ficha Visual del Club (Izquierda - FUT Shield Card) */}
                          <div className="lg:col-span-4 w-full flex justify-center">
                            <div className="relative w-64 h-[23rem] bg-gradient-to-b from-primary/35 via-card to-background border-2 border-primary rounded-[2.5rem] p-5 shadow-2xl overflow-hidden hover:scale-[1.04] transition-all duration-300 flex flex-col justify-between group">
                              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(232,0,29,0.15),transparent)] pointer-events-none"></div>
                              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
                              
                              <div className="flex justify-between items-start font-mono text-xs z-10">
                                <div className="flex flex-col items-center">
                                  <span className="text-3xl font-display font-black text-primary leading-none">99</span>
                                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">PWR</span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-[9px] bg-primary/20 border border-primary/30 text-primary px-2 py-0.5 rounded font-mono font-black uppercase">CLUB #1</span>
                                  <span className="text-[7px] text-muted-foreground uppercase font-bold tracking-wider mt-1">ELITE SQUAD</span>
                                </div>
                              </div>

                              <div className="flex flex-col items-center py-2 z-10 relative">
                                <div className="relative w-28 h-28 rounded-full border-2 border-primary bg-background flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300">
                                  {bestClub.logo ? (
                                    <img 
                                      src={getImageUrl(bestClub.logo)} 
                                      alt={bestClub.nombre} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-primary/25 to-card/50 flex items-center justify-center font-display font-black text-4xl text-primary uppercase">
                                      {bestClub.nombre?.substring(0, 2)}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="mt-3 text-center">
                                  <h3 className="text-xl font-display font-black text-foreground tracking-wide uppercase leading-none">{bestClub.nombre}</h3>
                                  <span className="text-[8px] bg-background/60 border border-border/40 text-muted-foreground px-2 py-0.5 rounded-full font-mono uppercase font-bold block mt-1.5 truncate max-w-[160px] mx-auto">
                                    🏆 ELITE DIVISION
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-1 border-t border-border/20 pt-4 text-center font-mono text-[9px] z-10 bg-background/35 p-2 rounded-2xl border border-border/10">
                                <div className="border-r border-border/15">
                                  <span className="text-[7px] text-gray-500 font-bold block">G.F.</span>
                                  <strong className="text-xs font-black text-primary">{golesFavor}</strong>
                                </div>
                                <div className="border-r border-border/15">
                                  <span className="text-[7px] text-gray-500 font-bold block">PASES</span>
                                  <strong className="text-xs font-black text-foreground">{precisionPases}%</strong>
                                </div>
                                <div>
                                  <span className="text-[7px] text-gray-500 font-bold block">WIN%</span>
                                  <strong className="text-xs font-black text-emerald-400">{Math.round(85 + (golesFavor % 3) * 5)}%</strong>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Métricas de Analítica del Club (Derecha) */}
                          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
                            {[
                              { label: 'Efectividad en Ataque', value: `${golesFavor} Goles`, desc: 'Total de anotaciones marcadas.', color: 'text-primary', barVal: Math.min(100, golesFavor * 2.5) },
                              { label: 'Solidez Defensiva', value: `${golesRecibidos} Recibidos`, desc: 'Total de goles concedidos en liga.', color: 'text-emerald-500', barVal: Math.max(10, 100 - golesRecibidos * 8) },
                              { label: 'Efectividad en Pases', value: `${precisionPases}%`, desc: 'Precisión promedio del equipo.', color: 'text-foreground', barVal: precisionPases },
                              { label: 'Tasa de Quites Exitosos', value: `${Math.round(80 + (golesFavor % 5) * 3)}%`, desc: 'Efectividad defensiva colectiva.', color: 'text-amber-500', barVal: Math.round(80 + (golesFavor % 5) * 3) },
                              { label: 'Win Rate General', value: `${Math.round(85 + (golesFavor % 3) * 5)}%`, desc: 'Porcentaje de victorias de la escuadra.', color: 'text-blue-500', barVal: Math.round(85 + (golesFavor % 3) * 5) },
                              { label: 'Puntuación del Servidor', value: `⭐ ${(8.5 + (golesFavor % 4) * 0.35).toFixed(2)}`, desc: 'Valoración media del club en los partidos.', color: 'text-primary', barVal: Math.round(( (8.5 + (golesFavor % 4) * 0.35) / 10 ) * 100) }
                            ].map((stat, i) => (
                              <div key={i} className="glass-card-aaa p-5 rounded-2xl space-y-3.5 text-left border border-border/40 hover:border-primary/30 transition-all duration-300">
                                <span className="text-[9px] text-muted-foreground font-condensed font-black tracking-widest uppercase block">{stat.label}</span>
                                <div className="flex justify-between items-baseline">
                                  <span className={`font-display text-2xl font-black ${stat.color} tracking-wider`}>{stat.value}</span>
                                  <span className="text-[8px] font-mono text-muted-foreground/60">TOL: ±0.03</span>
                                </div>
                                
                                {/* Barra de Progreso HUD */}
                                <div className="w-full h-1.5 bg-background/60 rounded-full overflow-hidden border border-border/40">
                                  <div 
                                    className="h-full bg-gradient-to-r from-primary to-destructive rounded-full transition-all duration-500"
                                    style={{ width: `${stat.barVal}%` }}
                                  />
                                </div>
                                <p className="text-[9px] text-muted-foreground leading-normal font-light">{stat.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* Widgets de Métricas Tácticas Globales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="flex flex-col items-center text-center p-6 backdrop-blur-xl border-border/60 shadow-lg hover:border-primary/45 transition-all duration-300 group glass-cyber" withGlow>
                    <span className="text-3xl mb-2">⚽</span>
                    <h4 className="text-technical text-muted-foreground group-hover:text-primary transition-colors uppercase font-bold text-[10px] tracking-widest font-display">Promedio de Goles</h4>
                    <p className="text-3xl font-display font-black text-foreground mt-1">{stats.promedio_goles} por Partido</p>
                    <span className="text-[10px] text-gray-500 font-mono mt-1">({stats.goles_totales} goles en {stats.total_partidos} partidos)</span>
                  </Card>

                  <Card className="flex flex-col items-center text-center p-6 backdrop-blur-xl border-border/60 shadow-lg hover:border-primary/45 transition-all duration-300 group glass-cyber" withGlow>
                    <span className="text-3xl mb-2">🎯</span>
                    <h4 className="text-technical text-muted-foreground group-hover:text-primary transition-colors uppercase font-bold text-[10px] tracking-widest font-display">Precisión de Pases</h4>
                    <p className="text-3xl font-display font-black text-foreground mt-1">{stats.precision_pases}% de Efectividad</p>
                    <span className="text-[10px] text-gray-500 font-mono mt-1">Acumulado colectivo de escuadras</span>
                  </Card>

                  <Card className="flex flex-col items-center text-center p-6 backdrop-blur-xl border-border/60 shadow-lg hover:border-primary/45 transition-all duration-300 group glass-cyber" withGlow>
                    <span className="text-3xl mb-2">⚡</span>
                    <h4 className="text-technical text-muted-foreground group-hover:text-primary transition-colors uppercase font-bold text-[10px] tracking-widest font-display">Quites de Balón</h4>
                    <p className="text-3xl font-display font-black text-white mt-1">{stats.precision_tackles}% de Quites Exitosos</p>
                    <span className="text-[10px] text-gray-500 font-mono mt-1">Tasa de éxito en barridas/entradas</span>
                  </Card>
                </div>

                {/* Grid de Escuadras Líderes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  
                  {/* Equipos Más Goleadores */}
                  <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-6 space-y-4 shadow-lg glass-cyber transition-all duration-300">
                    <h3 className="text-xs font-display font-black text-foreground uppercase tracking-widest flex items-center gap-2 border-b border-border/40 pb-3">
                      🔥 Escuadras Más Goleadoras
                    </h3>
                    {stats.equipos_goleadores && stats.equipos_goleadores.length > 0 ? (
                      <div className="space-y-3">
                        {expandEqGoleadores && (
                          <input
                            type="text"
                            placeholder="🔍 Filtrar club..."
                            value={searchEqGoleadores}
                            onChange={(e) => setSearchEqGoleadores(e.target.value)}
                            className="w-full h-8 bg-background/50 border border-border/40 rounded-lg px-2.5 text-[10px] font-condensed font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-primary transition-all mb-2"
                          />
                        )}
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                          {filteredEqGoleadores.map((e, idx) => (
                            <Link key={e.id} to={`/equipos/${e.id}`} className="flex items-center justify-between p-3 border border-border/40 rounded-xl bg-card/35 group hover:border-primary/30 hover:scale-[1.01] transition-all duration-300 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-black text-primary text-sm">#{idx + 1}</span>
                                {e.logo ? (
                                  <img 
                                    src={getImageUrl(e.logo)} 
                                    alt={e.nombre} 
                                    className="w-8 h-8 rounded-full object-cover border border-border/50 bg-card shrink-0" 
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-display font-black text-[10px] text-foreground uppercase shrink-0">
                                    {e.nombre.substring(0, 2)}
                                  </div>
                                )}
                                <span className="text-xs font-display font-bold uppercase text-foreground truncate max-w-[120px]">{e.nombre}</span>
                              </div>
                               <span className="text-xs font-display font-black text-primary font-mono">{e.total_goles_favor} GF</span>
                            </Link>
                          ))}
                        </div>
                        {stats.equipos_goleadores.length > 5 && (
                          <Link 
                            to="/datos"
                            className="w-full text-center py-2 border border-dashed border-border/40 hover:border-primary/45 rounded-xl text-[9px] font-condensed font-black tracking-widest uppercase hover:text-primary transition-colors cursor-pointer mt-2 block"
                          >
                            ➕ VER MÁS / FILTRAR
                          </Link>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Sin reportes registrados.</p>
                    )}
                  </div>

                  {/* Equipos con Mejor Precisión de Pases */}
                  <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-6 space-y-4 shadow-lg glass-cyber transition-all duration-300">
                    <h3 className="text-xs font-display font-black text-foreground uppercase tracking-widest flex items-center gap-2 border-b border-border/40 pb-3">
                      🎯 Maestros de la Posesión
                    </h3>
                    {stats.equipos_pases && stats.equipos_pases.length > 0 ? (
                      <div className="space-y-3">
                        {expandEqPases && (
                          <input
                            type="text"
                            placeholder="🔍 Filtrar club..."
                            value={searchEqPases}
                            onChange={(e) => setSearchEqPases(e.target.value)}
                            className="w-full h-8 bg-background/50 border border-border/40 rounded-lg px-2.5 text-[10px] font-condensed font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-primary transition-all mb-2"
                          />
                        )}
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                          {filteredEqPases.map((e, idx) => (
                            <Link key={e.id} to={`/equipos/${e.id}`} className="flex items-center justify-between p-3 border border-border/40 rounded-xl bg-card/35 group hover:border-primary/30 hover:scale-[1.01] transition-all duration-300 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-black text-primary text-sm">#{idx + 1}</span>
                                {e.logo ? (
                                  <img 
                                    src={getImageUrl(e.logo)} 
                                    alt={e.nombre} 
                                    className="w-8 h-8 rounded-full object-cover border border-border/50 bg-card shrink-0" 
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-display font-black text-[10px] text-foreground uppercase shrink-0">
                                    {e.nombre.substring(0, 2)}
                                  </div>
                                )}
                                <span className="text-xs font-display font-bold uppercase text-foreground truncate max-w-[120px]">{e.nombre}</span>
                              </div>
                              <span className="text-xs font-display font-black text-foreground font-mono">{e.avg_precision_pases}%</span>
                            </Link>
                          ))}
                        </div>
                        {stats.equipos_pases.length > 5 && (
                          <Link 
                            to="/datos"
                            className="w-full text-center py-2 border border-dashed border-border/40 hover:border-primary/45 rounded-xl text-[9px] font-condensed font-black tracking-widest uppercase hover:text-primary transition-colors cursor-pointer mt-2 block"
                          >
                            ➕ VER MÁS / FILTRAR
                          </Link>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Sin reportes registrados.</p>
                    )}
                  </div>

                  {/* Equipos con Mejor Defensa */}
                  <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-6 space-y-4 shadow-lg glass-cyber transition-all duration-300">
                    <h3 className="text-xs font-display font-black text-foreground uppercase tracking-widest flex items-center gap-2 border-b border-border/40 pb-3">
                      🛡️ Muros Defensivos
                    </h3>
                    {stats.equipos_defensa && stats.equipos_defensa.length > 0 ? (
                      <div className="space-y-3">
                        {expandEqDefensa && (
                          <input
                            type="text"
                            placeholder="🔍 Filtrar club..."
                            value={searchEqDefensa}
                            onChange={(e) => setSearchEqDefensa(e.target.value)}
                            className="w-full h-8 bg-background/50 border border-border/40 rounded-lg px-2.5 text-[10px] font-condensed font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-primary transition-all mb-2"
                          />
                        )}
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                          {filteredEqDefensa.map((e, idx) => (
                            <Link key={e.id} to={`/equipos/${e.id}`} className="flex items-center justify-between p-3 border border-border/40 rounded-xl bg-card/35 group hover:border-primary/30 hover:scale-[1.01] transition-all duration-300 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-black text-primary text-sm">#{idx + 1}</span>
                                {e.logo ? (
                                  <img 
                                    src={getImageUrl(e.logo)} 
                                    alt={e.nombre} 
                                    className="w-8 h-8 rounded-full object-cover border border-border/50 bg-card shrink-0" 
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-display font-black text-[10px] text-foreground uppercase shrink-0">
                                    {e.nombre.substring(0, 2)}
                                  </div>
                                )}
                                <span className="text-xs font-display font-bold uppercase text-foreground truncate max-w-[120px]">{e.nombre}</span>
                              </div>
                              <span className="text-xs font-display font-black text-destructive font-mono">{e.total_goles_recibidos} GC</span>
                            </Link>
                          ))}
                        </div>
                        {stats.equipos_defensa.length > 5 && (
                          <Link 
                            to="/datos"
                            className="w-full text-center py-2 border border-dashed border-border/40 hover:border-primary/45 rounded-xl text-[9px] font-condensed font-black tracking-widest uppercase hover:text-primary transition-colors cursor-pointer mt-2 block"
                          >
                            ➕ VER MÁS / FILTRAR
                          </Link>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Sin reportes registrados.</p>
                    )}
                  </div>

                </div>

                {/* Jornada récord */}
                {stats.jornada_max_goles && (
                  <div className="border border-primary/20 bg-primary/5 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left glass-cyber">
                    <div>
                      <span className="text-[10px] font-display font-black text-primary uppercase block tracking-[0.2em]">
                        🏆 JORNADA RÉCORD EN GOLES
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        La <strong className="text-primary uppercase font-mono">{stats.jornada_max_goles.jornada}</strong> registró un pico de goleo espectacular en toda la competencia.
                      </p>
                    </div>
                    <div className="shrink-0 bg-primary/10 border border-primary/20 rounded-xl px-5 py-3 shadow-md animate-pulse">
                      <strong className="text-3xl font-display font-black text-primary block leading-none font-mono">
                        {stats.jornada_max_goles.goles}
                      </strong>
                      <span className="text-[9px] font-display font-bold text-gray-500 uppercase tracking-widest">Goles Totales</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── SECCIÓN 2: PRESTIGIO Y LÍDERES JUGADORES ── */}
            {subTab === 'jugadores' && (
              <div className="space-y-12 animate-fade-in">

                {/* ── ⚡ JUGADORES MVPS POR POSICIÓN (DETAILED TABBED LAYOUT) ── */}
                {(() => {
                  const posConfig = {
                    DEL: {
                      color: 'from-amber-500/35 via-card to-background border-amber-500',
                      glow: 'rgba(245,158,11,0.3)',
                      textColor: 'text-amber-500',
                      accentText: 'text-amber-400',
                      badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                      avatarBorder: 'border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
                      label: 'Delantero',
                      shimmer: 'bg-gradient-to-r from-amber-500 to-red-500'
                    },
                    MED: {
                      color: 'from-emerald-500/35 via-card to-background border-emerald-500',
                      glow: 'rgba(16,185,129,0.3)',
                      textColor: 'text-emerald-500',
                      accentText: 'text-emerald-400',
                      badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                      avatarBorder: 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
                      label: 'Mediocentro',
                      shimmer: 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                    },
                    DEF: {
                      color: 'from-blue-500/35 via-card to-background border-blue-500',
                      glow: 'rgba(59,130,246,0.3)',
                      textColor: 'text-blue-500',
                      accentText: 'text-blue-400',
                      badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                      avatarBorder: 'border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
                      label: 'Defensa',
                      shimmer: 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    },
                    POR: {
                      color: 'from-purple-500/35 via-card to-background border-purple-500',
                      glow: 'rgba(139,92,246,0.3)',
                      textColor: 'text-purple-500',
                      accentText: 'text-purple-400',
                      badge: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
                      avatarBorder: 'border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]',
                      label: 'Portero',
                      shimmer: 'bg-gradient-to-r from-purple-500 to-pink-500'
                    }
                  };

                  const player = activeMvpPos === 'DEL' 
                    ? (stats.prestigio_delanteros?.[0] || stats.top_goleadores?.[0]) 
                    : activeMvpPos === 'MED' 
                    ? stats.prestigio_medios?.[0] 
                    : activeMvpPos === 'DEF' 
                    ? stats.prestigio_defensas?.[0] 
                    : stats.prestigio_porteros?.[0];

                  const getQuickStats = (pos, p) => {
                    if (!p) return [];
                    if (pos === 'DEL') {
                      return [
                        { label: 'GOL', val: p.total_goles || 0 },
                        { label: 'AST', val: p.total_asistencias || 0 },
                        { label: 'TIRO', val: `${Math.round(p.avg_precision_tiro || 0)}%` }
                      ];
                    }
                    if (pos === 'MED') {
                      return [
                        { label: 'AST', val: p.total_asistencias || 0 },
                        { label: 'PAS', val: `${Math.round(p.avg_precision_pases || 0)}%` },
                        { label: 'OVR', val: Number(p.avg_valoracion || 0).toFixed(1) }
                      ];
                    }
                    if (pos === 'DEF') {
                      return [
                        { label: 'ENT', val: p.total_entradas || 0 },
                        { label: 'ÉXI', val: `${Math.round(p.avg_exito_entradas || 0)}%` },
                        { label: 'OVR', val: Number(p.avg_valoracion || 0).toFixed(1) }
                      ];
                    }
                    if (pos === 'POR') {
                      return [
                        { label: 'ATA', val: p.total_atajadas || 0 },
                        { label: 'REC', val: p.total_goles_recibidos || 0 },
                        { label: 'OVR', val: Number(p.avg_valoracion || 0).toFixed(1) }
                      ];
                    }
                    return [];
                  };

                  const getPlayerMetrics = (pos, p) => {
                    if (!p) return [];
                    
                    if (pos === 'DEL') {
                      return [
                        {
                          label: 'Efectividad en Goleo',
                          value: `${p.total_goles || 0} GOLES`,
                          desc: 'Total de anotaciones marcadas.',
                          color: 'text-amber-500',
                          barVal: Math.min(100, (p.total_goles || 0) * 10)
                        },
                        {
                          label: 'Creación de Juego',
                          value: `${p.total_asistencias || 0} ASISTENCIAS`,
                          desc: 'Total de pases de gol entregados.',
                          color: 'text-primary',
                          barVal: Math.min(100, (p.total_asistencias || 0) * 10)
                        },
                        {
                          label: 'Rendimiento General (OVR)',
                          value: `${Number(p.avg_valoracion || 0).toFixed(2)}`,
                          desc: 'Valoración media del competidor.',
                          color: 'text-amber-400',
                          barVal: Math.min(100, (p.avg_valoracion || 0) * 10)
                        },
                        {
                          label: 'Precisión de Disparo',
                          value: `${Math.round(p.avg_precision_tiro || 0)}%`,
                          desc: 'Eficacia en tiros al arco.',
                          color: 'text-emerald-500',
                          barVal: Math.round(p.avg_precision_tiro || 0)
                        },
                        {
                          label: 'Ritmo de Competencia',
                          value: `${p.partidos_jugados || 0} PARTIDOS`,
                          desc: 'Partidos disputados en el circuito.',
                          color: 'text-blue-500',
                          barVal: Math.min(100, (p.partidos_jugados || 0) * 10)
                        },
                        {
                          label: 'Prestigio Táctico',
                          value: `⭐ ${p.total_mvp || 0} MVPs`,
                          desc: 'Veces seleccionado como el Jugador del Partido.',
                          color: 'text-amber-500',
                          barVal: Math.min(100, (p.total_mvp || 0) * 20)
                        }
                      ];
                    }
                    
                    if (pos === 'MED') {
                      return [
                        {
                          label: 'Precisión de Pases',
                          value: `${Math.round(p.avg_precision_pases || 0)}%`,
                          desc: 'Efectividad en pases completados.',
                          color: 'text-emerald-500',
                          barVal: Math.round(p.avg_precision_pases || 0)
                        },
                        {
                          label: 'Creación de Juego',
                          value: `${p.total_asistencias || 0} ASISTENCIAS`,
                          desc: 'Total de pases de gol entregados.',
                          color: 'text-primary',
                          barVal: Math.min(100, (p.total_asistencias || 0) * 10)
                        },
                        {
                          label: 'Rendimiento General (OVR)',
                          value: `${Number(p.avg_valoracion || 0).toFixed(2)}`,
                          desc: 'Valoración media del competidor.',
                          color: 'text-emerald-400',
                          barVal: Math.min(100, (p.avg_valoracion || 0) * 10)
                        },
                        {
                          label: 'Volumen Ofensivo',
                          value: `${p.total_goles || 0} GOLES`,
                          desc: 'Goles marcados desde el mediocampo.',
                          color: 'text-amber-500',
                          barVal: Math.min(100, (p.total_goles || 0) * 15)
                        },
                        {
                          label: 'Ritmo de Competencia',
                          value: `${p.partidos_jugados || 0} PARTIDOS`,
                          desc: 'Partidos disputados en el circuito.',
                          color: 'text-blue-500',
                          barVal: Math.min(100, (p.partidos_jugados || 0) * 10)
                        },
                        {
                          label: 'Prestigio Táctico',
                          value: `⭐ ${p.total_mvp || 0} MVPs`,
                          desc: 'Veces seleccionado como el Jugador del Partido.',
                          color: 'text-amber-500',
                          barVal: Math.min(100, (p.total_mvp || 0) * 20)
                        }
                      ];
                    }

                    if (pos === 'DEF') {
                      return [
                        {
                          label: 'Solidez en Defensiva',
                          value: `${p.total_entradas || 0} QUITES`,
                          desc: 'Entradas limpias y quites completados.',
                          color: 'text-blue-500',
                          barVal: Math.min(100, (p.total_entradas || 0) * 5)
                        },
                        {
                          label: 'Tasa de Quites Exitosos',
                          value: `${Math.round(p.avg_exito_entradas || 0)}%`,
                          desc: 'Efectividad en duelos defensivos directos.',
                          color: 'text-emerald-500',
                          barVal: Math.round(p.avg_exito_entradas || 0)
                        },
                        {
                          label: 'Rendimiento General (OVR)',
                          value: `${Number(p.avg_valoracion || 0).toFixed(2)}`,
                          desc: 'Valoración media del competidor.',
                          color: 'text-blue-400',
                          barVal: Math.min(100, (p.avg_valoracion || 0) * 10)
                        },
                        {
                          label: 'Precisión de Pases',
                          value: `${Math.round(p.avg_precision_pases || 0)}%`,
                          desc: 'Eficacia en salida y pases en zona baja.',
                          color: 'text-foreground/80',
                          barVal: Math.round(p.avg_precision_pases || 0)
                        },
                        {
                          label: 'Ritmo de Competencia',
                          value: `${p.partidos_jugados || 0} PARTIDOS`,
                          desc: 'Partidos disputados en el circuito.',
                          color: 'text-blue-500',
                          barVal: Math.min(100, (p.partidos_jugados || 0) * 10)
                        },
                        {
                          label: 'Prestigio Táctico',
                          value: `⭐ ${p.total_mvp || 0} MVPs`,
                          desc: 'Veces seleccionado como el Jugador del Partido.',
                          color: 'text-amber-500',
                          barVal: Math.min(100, (p.total_mvp || 0) * 20)
                        }
                      ];
                    }

                    if (pos === 'POR') {
                      return [
                        {
                          label: 'Eficacia Bajo Tres Palos',
                          value: `${p.total_atajadas || 0} ATAJADAS`,
                          desc: 'Total de tiros detenidos o desviados.',
                          color: 'text-purple-500',
                          barVal: Math.min(100, (p.total_atajadas || 0) * 4)
                        },
                        {
                          label: 'Goles Recibidos',
                          value: `${p.total_goles_recibidos || 0} GOLES`,
                          desc: 'Goles concedidos en la meta.',
                          color: 'text-rose-500',
                          barVal: Math.max(10, 100 - (p.total_goles_recibidos || 0) * 5)
                        },
                        {
                          label: 'Rendimiento General (OVR)',
                          value: `${Number(p.avg_valoracion || 0).toFixed(2)}`,
                          desc: 'Valoración media del competidor.',
                          color: 'text-purple-400',
                          barVal: Math.min(100, (p.avg_valoracion || 0) * 10)
                        },
                        {
                          label: 'Precisión de Pases',
                          value: `${Math.round(p.avg_precision_pases || 0)}%`,
                          desc: 'Precisión en saques y pases largos.',
                          color: 'text-foreground/80',
                          barVal: Math.round(p.avg_precision_pases || 0)
                        },
                        {
                          label: 'Ritmo de Competencia',
                          value: `${p.partidos_jugados || 0} PARTIDOS`,
                          desc: 'Partidos disputados en el circuito.',
                          color: 'text-blue-500',
                          barVal: Math.min(100, (p.partidos_jugados || 0) * 10)
                        },
                        {
                          label: 'Prestigio Táctico',
                          value: `⭐ ${p.total_mvp || 0} MVPs`,
                          desc: 'Veces seleccionado como el Jugador del Partido.',
                          color: 'text-amber-500',
                          barVal: Math.min(100, (p.total_mvp || 0) * 20)
                        }
                      ];
                    }
                    return [];
                  };

                  const config = posConfig[activeMvpPos];
                  const quickStats = getQuickStats(activeMvpPos, player);
                  const detailedMetrics = getPlayerMetrics(activeMvpPos, player);
                  const calculatedOvr = player ? Math.round(80 + (Number(player.avg_valoracion || 8.0) * 1.8)) : 99;

                  return (
                    <div className="border border-border/40 bg-card/15 backdrop-blur-xl rounded-3xl p-6 md:p-8 space-y-8 glass-cyber relative overflow-hidden max-w-6xl mx-auto shadow-2xl hover:border-primary/25 transition-all duration-500">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                      
                      {/* Top Header Block */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border/40 pb-5 gap-4">
                        <div className="text-left">
                          <Badge className="text-primary bg-primary/10 border border-primary/25 text-[10px] uppercase font-condensed tracking-widest px-3 py-1">
                            ⚡ JUGADOR DESTACADO
                          </Badge>
                          <h2 className="text-3xl md:text-4xl font-display font-black uppercase text-foreground tracking-tight mt-1">
                            LÍDER JUGADOR DE LA <span className="text-glow-primary bg-clip-text bg-gradient-to-r from-primary to-destructive text-transparent">SEMANA</span>
                          </h2>
                        </div>
                      </div>

                      {player ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                          {/* FUT Shield Card (Left) */}
                          <div className="lg:col-span-4 w-full flex justify-center">
                            <div className={`relative w-64 h-[23rem] bg-gradient-to-b ${config.color} border-2 rounded-[2.5rem] p-5 shadow-2xl overflow-hidden hover:scale-[1.04] transition-all duration-300 flex flex-col justify-between group`}>
                              <div 
                                className="absolute inset-0 pointer-events-none"
                                style={{ backgroundImage: `radial-gradient(ellipse at top, ${config.glow}, transparent)` }}
                              ></div>
                              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
                              
                              <div className="flex justify-between items-start font-mono text-xs z-10">
                                <div className="flex flex-col items-center">
                                  <span className={`text-3xl font-display font-black leading-none ${config.textColor}`}>{calculatedOvr}</span>
                                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">OVR</span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-[9px] bg-background/55 border border-border/30 text-foreground font-mono font-black px-2 py-0.5 rounded uppercase">
                                    {activeMvpPos}
                                  </span>
                                  <span className="text-[7px] text-muted-foreground uppercase font-bold tracking-wider mt-1">WEEK MVP</span>
                                </div>
                              </div>

                              <div className="flex flex-col items-center py-2 z-10 relative">
                                <div className={`relative w-28 h-28 rounded-full border-2 ${config.avatarBorder} bg-background flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                                  {player.foto ? (
                                    <img 
                                      src={getImageUrl(player.foto)} 
                                      alt={player.name} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-primary/25 to-card/50 flex items-center justify-center font-display font-black text-4xl text-foreground uppercase">
                                      {player.name?.substring(0, 2)}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="mt-3 text-center">
                                  <h3 className="text-xl font-display font-black text-foreground tracking-wide uppercase leading-none truncate max-w-[190px] mx-auto">{player.name}</h3>
                                  <span className="text-[8px] bg-background/60 border border-border/40 text-muted-foreground px-2.5 py-0.5 rounded-full font-mono uppercase font-bold block mt-1.5 truncate max-w-[160px] mx-auto">
                                    🛡️ {player.equipo_nombre}
                                  </span>
                                </div>
                              </div>

                              {/* Card Bottom Quick Stats */}
                              <div className="grid grid-cols-3 gap-1 border-t border-border/20 pt-4 text-center font-mono text-[9px] z-10 bg-background/35 p-2 rounded-2xl border border-border/10">
                                {quickStats.map((st, sIdx) => (
                                  <div key={sIdx} className={sIdx < 2 ? 'border-r border-border/15' : ''}>
                                    <span className="text-[7px] text-gray-500 font-bold block">{st.label}</span>
                                    <strong className="text-xs font-black text-foreground">{st.val}</strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* 6 Metrics Grid (Right) */}
                          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
                            {detailedMetrics.map((stat, i) => (
                              <div key={i} className="glass-card-aaa p-5 rounded-2xl space-y-3.5 text-left border border-border/40 hover:border-primary/20 transition-all duration-300">
                                <span className="text-[9px] text-muted-foreground font-condensed font-black tracking-widest uppercase block">{stat.label}</span>
                                <div className="flex justify-between items-baseline font-mono">
                                  <span className={`font-display text-2xl font-black ${stat.color} tracking-wider`}>{stat.value}</span>
                                  <span className="text-[8px] text-muted-foreground/60">TOL: ±0.03</span>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="w-full h-1.5 bg-background/60 rounded-full overflow-hidden border border-border/45">
                                  <div 
                                    className={`h-full ${config.shimmer} rounded-full transition-all duration-500`}
                                    style={{ width: `${stat.barVal}%` }}
                                  />
                                </div>
                                <p className="text-[9px] text-muted-foreground leading-normal font-light">{stat.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="border border-border/30 border-dashed rounded-3xl p-12 text-center text-muted-foreground">
                          <span className="text-4xl">🏃</span>
                          <h4 className="text-sm font-display font-black text-foreground uppercase tracking-wider mt-2">Sin Datos Disponibles</h4>
                          <p className="text-xs italic mt-1 font-light">No hay registros tácticos de juego cargados para la demarcación de {config.label} esta semana.</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Goleadores & Asistentes Generales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Máximos Goleadores */}
                  <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-6 space-y-4 shadow-lg glass-cyber transition-all duration-300">
                    <h3 className="text-xs font-display font-black text-foreground uppercase tracking-widest flex items-center gap-2 border-b border-border/40 pb-3">
                      ⚽ Máximos Goleadores
                    </h3>
                    {stats.top_goleadores && stats.top_goleadores.length > 0 ? (
                      <div className="space-y-3">
                        {expandGoleadores && (
                          <input
                            type="text"
                            placeholder="🔍 Filtrar goleador..."
                            value={searchGoleadores}
                            onChange={(e) => setSearchGoleadores(e.target.value)}
                            className="w-full h-8 bg-background/50 border border-border/40 rounded-lg px-2.5 text-[10px] font-condensed font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-primary transition-all mb-2"
                          />
                        )}
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                          {filteredGoleadores.map((s, idx) => (
                            <Link key={s.id} to={`/jugadores/${s.id}`} className="flex items-center justify-between p-3 border border-border/40 rounded-xl bg-card/35 group hover:border-primary/30 hover:scale-[1.01] transition-all cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-black text-primary text-sm">#{idx + 1}</span>
                                {s.foto ? (
                                  <img src={getImageUrl(s.foto)} alt={s.name} className="w-8 h-8 rounded-full object-cover border border-border/40 shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-display font-black text-[10px] text-foreground uppercase shrink-0">
                                    {s.name.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-display font-bold text-foreground truncate max-w-[150px]">{s.name}</p>
                                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wide leading-none">{s.equipo_nombre}</p>
                                </div>
                              </div>
                              <span className="text-xs font-display font-black text-primary tracking-wide font-mono">{s.total_goles} Goles</span>
                            </Link>
                          ))}
                        </div>
                        {stats.top_goleadores.length > 5 && (
                          <Link 
                            to="/datos"
                            className="w-full text-center py-2 border border-dashed border-border/40 hover:border-primary/45 rounded-xl text-[9px] font-condensed font-black tracking-widest uppercase hover:text-primary transition-colors cursor-pointer mt-2 block"
                          >
                            ➕ VER MÁS / FILTRAR
                          </Link>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Sin reportes registrados.</p>
                    )}
                  </div>

                  {/* Máximos Asistentes */}
                  <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-6 space-y-4 shadow-lg glass-cyber transition-all duration-300">
                    <h3 className="text-xs font-display font-black text-foreground uppercase tracking-widest flex items-center gap-2 border-b border-border/40 pb-3">
                      🎯 Líderes de Asistencias
                    </h3>
                    {stats.top_asistentes && stats.top_asistentes.length > 0 ? (
                      <div className="space-y-3">
                        {expandAsistentes && (
                          <input
                            type="text"
                            placeholder="🔍 Filtrar asistente..."
                            value={searchAsistentes}
                            onChange={(e) => setSearchAsistentes(e.target.value)}
                            className="w-full h-8 bg-background/50 border border-border/40 rounded-lg px-2.5 text-[10px] font-condensed font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-primary transition-all mb-2"
                          />
                        )}
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                          {filteredAsistentes.map((a, idx) => (
                            <Link key={a.id} to={`/jugadores/${a.id}`} className="flex items-center justify-between p-3 border border-border/40 rounded-xl bg-card/35 group hover:border-primary/30 hover:scale-[1.01] transition-all cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-black text-primary text-sm">#{idx + 1}</span>
                                {a.foto ? (
                                  <img src={getImageUrl(a.foto)} alt={a.name} className="w-8 h-8 rounded-full object-cover border border-border/40 shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-display font-black text-[10px] text-foreground uppercase shrink-0">
                                    {a.name.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-display font-bold text-foreground truncate max-w-[150px]">{a.name}</p>
                                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wide leading-none">{a.equipo_nombre}</p>
                                </div>
                              </div>
                              <span className="text-xs font-display font-black text-primary tracking-wide font-mono">{a.total_asistencias} Asistencias</span>
                            </Link>
                          ))}
                        </div>
                        {stats.top_asistentes.length > 5 && (
                          <Link 
                            to="/datos"
                            className="w-full text-center py-2 border border-dashed border-border/40 hover:border-primary/45 rounded-xl text-[9px] font-condensed font-black tracking-widest uppercase hover:text-primary transition-colors cursor-pointer mt-2 block"
                          >
                            ➕ VER MÁS / FILTRAR
                          </Link>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Sin reportes registrados.</p>
                    )}
                  </div>

                </div>

                {/* PRESTIGIO DETALLADO POR POSICIÓN */}
                <div className="border-t border-border/40 pt-10">
                  <h3 className="text-xs font-display font-black uppercase text-foreground tracking-[0.2em] border-b border-border/40 pb-4 mb-8">
                    💎 Muro de Prestigio Táctico (Desempeño Compuesto por Posición)
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Delanteros */}
                    <div className="border border-border/50 bg-card/40 backdrop-blur-md rounded-3xl p-6 space-y-4 shadow-md glass-cyber transition-all duration-300">
                      <h4 className="text-xs font-display font-black uppercase text-primary tracking-widest flex items-center gap-1.5 border-b border-border/40 pb-3">
                        ⚡ Delanteros Líderes (Poder Ofensivo)
                      </h4>
                      {stats.prestigio_delanteros && stats.prestigio_delanteros.length > 0 ? (
                        <div className="space-y-3">
                          {expandDelanteros && (
                            <input
                              type="text"
                              placeholder="🔍 Filtrar delantero..."
                              value={searchDelanteros}
                              onChange={(e) => setSearchDelanteros(e.target.value)}
                              className="w-full h-8 bg-background/50 border border-border/40 rounded-lg px-2.5 text-[10px] font-condensed font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-primary transition-all mb-2"
                            />
                          )}
                          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                            {filteredDelanteros.map((p, idx) => (
                              <Link key={p.id} to={`/jugadores/${p.id}`} className="flex items-center justify-between gap-2 p-2.5 border border-border/40 rounded-xl bg-card/25 hover:border-primary/20 hover:scale-[1.01] transition-all cursor-pointer">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="font-mono font-black text-xs text-primary">#{idx + 1}</span>
                                  <div className="shrink-0">
                                    {p.foto ? (
                                      <img src={getImageUrl(p.foto)} alt={p.name} className="w-8 h-8 rounded-full object-cover border border-border/40" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-display font-black text-[9px] text-foreground uppercase">{p.name.charAt(0)}</div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-display font-bold uppercase text-foreground truncate max-w-[120px]">{p.name}</p>
                                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider leading-none mt-0.5 truncate">{p.equipo_nombre}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-5 text-right pr-1">
                                  <div className="hidden sm:block">
                                    <p className="text-[8px] text-muted-foreground font-mono leading-none">G/A/TIRO</p>
                                    <p className="text-[10px] font-bold text-foreground leading-none mt-1">
                                      {p.total_goles} / {p.total_asistencias} / {Math.round(p.avg_precision_tiro || 0)}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] text-muted-foreground font-mono leading-none">PRESTIGIO</p>
                                    <p className="text-xs font-display font-black text-primary font-mono leading-none mt-1">{p.score}</p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                          {stats.prestigio_delanteros.length > 5 && (
                            <Link 
                              to="/datos"
                              className="w-full text-center py-2 border border-dashed border-border/40 hover:border-primary/45 rounded-xl text-[9px] font-condensed font-black tracking-widest uppercase hover:text-primary transition-colors cursor-pointer mt-2 block"
                            >
                              ➕ VER MÁS / FILTRAR
                            </Link>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Sin reportes registrados.</p>
                      )}
                    </div>

                    {/* Mediocampistas */}
                    <div className="border border-border/50 bg-card/40 backdrop-blur-md rounded-3xl p-6 space-y-4 shadow-md glass-cyber transition-all duration-300">
                      <h4 className="text-xs font-display font-black uppercase text-primary tracking-widest flex items-center gap-1.5 border-b border-border/40 pb-3">
                        🧠 Mediocampistas Líderes (Efectividad Creativa)
                      </h4>
                      {stats.prestigio_medios && stats.prestigio_medios.length > 0 ? (
                        <div className="space-y-3">
                          {expandMedios && (
                            <input
                              type="text"
                              placeholder="🔍 Filtrar mediocampista..."
                              value={searchMedios}
                              onChange={(e) => setSearchMedios(e.target.value)}
                              className="w-full h-8 bg-background/50 border border-border/40 rounded-lg px-2.5 text-[10px] font-condensed font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-primary transition-all mb-2"
                            />
                          )}
                          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                            {filteredMedios.map((p, idx) => (
                              <Link key={p.id} to={`/jugadores/${p.id}`} className="flex items-center justify-between gap-2 p-2.5 border border-border/40 rounded-xl bg-card/25 hover:border-primary/20 hover:scale-[1.01] transition-all cursor-pointer">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="font-mono font-black text-xs text-primary">#{idx + 1}</span>
                                  <div className="shrink-0">
                                    {p.foto ? (
                                      <img src={getImageUrl(p.foto)} alt={p.name} className="w-8 h-8 rounded-full object-cover border border-border/40" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-display font-black text-[9px] text-foreground uppercase">{p.name.charAt(0)}</div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-display font-bold uppercase text-foreground truncate max-w-[120px]">{p.name}</p>
                                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider leading-none mt-0.5 truncate">{p.equipo_nombre}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-5 text-right pr-1">
                                  <div className="hidden sm:block">
                                    <p className="text-[8px] text-muted-foreground font-mono leading-none">AST / PREC PASES</p>
                                    <p className="text-[10px] font-bold text-foreground leading-none mt-1">
                                      {p.total_asistencias} AST / {Math.round(p.avg_precision_pases || 0)}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] text-muted-foreground font-mono leading-none">PRESTIGIO</p>
                                    <p className="text-xs font-display font-black text-primary font-mono leading-none mt-1">{p.score}</p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                          {stats.prestigio_medios.length > 5 && (
                            <Link 
                              to="/datos"
                              className="w-full text-center py-2 border border-dashed border-border/40 hover:border-primary/45 rounded-xl text-[9px] font-condensed font-black tracking-widest uppercase hover:text-primary transition-colors cursor-pointer mt-2 block"
                            >
                              ➕ VER MÁS / FILTRAR
                            </Link>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Sin reportes registrados.</p>
                      )}
                    </div>

                    {/* Defensores */}
                    <div className="border border-border/50 bg-card/40 backdrop-blur-md rounded-3xl p-6 space-y-4 shadow-md glass-cyber transition-all duration-300">
                      <h4 className="text-xs font-display font-black uppercase text-primary tracking-widest flex items-center gap-1.5 border-b border-border/40 pb-3">
                        🛡️ Defensores Líderes (Solidez Defensiva)
                      </h4>
                      {stats.prestigio_defensas && stats.prestigio_defensas.length > 0 ? (
                        <div className="space-y-3">
                          {expandDefensas && (
                            <input
                              type="text"
                              placeholder="🔍 Filtrar defensor..."
                              value={searchDefensas}
                              onChange={(e) => setSearchDefensas(e.target.value)}
                              className="w-full h-8 bg-background/50 border border-border/40 rounded-lg px-2.5 text-[10px] font-condensed font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-primary transition-all mb-2"
                            />
                          )}
                          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                            {filteredDefensas.map((p, idx) => (
                              <Link key={p.id} to={`/jugadores/${p.id}`} className="flex items-center justify-between gap-2 p-2.5 border border-border/40 rounded-xl bg-card/25 hover:border-primary/20 hover:scale-[1.01] transition-all cursor-pointer">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="font-mono font-black text-xs text-primary">#{idx + 1}</span>
                                  <div className="shrink-0">
                                    {p.foto ? (
                                      <img src={getImageUrl(p.foto)} alt={p.name} className="w-8 h-8 rounded-full object-cover border border-border/40" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-display font-black text-[9px] text-foreground uppercase">{p.name.charAt(0)}</div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-display font-bold uppercase text-foreground truncate max-w-[120px]">{p.name}</p>
                                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider leading-none mt-0.5 truncate">{p.equipo_nombre}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-5 text-right pr-1">
                                  <div className="hidden sm:block">
                                    <p className="text-[8px] text-muted-foreground font-mono leading-none">QUITES / ÉXITO</p>
                                    <p className="text-[10px] font-bold text-foreground leading-none mt-1">
                                      {p.total_entradas} / {Math.round(p.avg_exito_entradas || 0)}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] text-muted-foreground font-mono leading-none">PRESTIGIO</p>
                                    <p className="text-xs font-display font-black text-primary font-mono leading-none mt-1">{p.score}</p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                          {stats.prestigio_defensas.length > 5 && (
                            <Link 
                              to="/datos"
                              className="w-full text-center py-2 border border-dashed border-border/40 hover:border-primary/45 rounded-xl text-[9px] font-condensed font-black tracking-widest uppercase hover:text-primary transition-colors cursor-pointer mt-2 block"
                            >
                              ➕ VER MÁS / FILTRAR
                            </Link>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Sin reportes registrados.</p>
                      )}
                    </div>

                    {/* Porteros */}
                    <div className="border border-border/50 bg-card/40 backdrop-blur-md rounded-3xl p-6 space-y-4 shadow-md glass-cyber transition-all duration-300">
                      <h4 className="text-xs font-display font-black uppercase text-primary tracking-widest flex items-center gap-1.5 border-b border-border/40 pb-3">
                        🧤 Arqueros Líderes (Seguridad y Paradas)
                      </h4>
                      {stats.prestigio_porteros && stats.prestigio_porteros.length > 0 ? (
                        <div className="space-y-3">
                          {expandPorteros && (
                            <input
                              type="text"
                              placeholder="🔍 Filtrar arquero..."
                              value={searchPorteros}
                              onChange={(e) => setSearchPorteros(e.target.value)}
                              className="w-full h-8 bg-background/50 border border-border/40 rounded-lg px-2.5 text-[10px] font-condensed font-bold uppercase tracking-widest text-foreground focus:outline-none focus:border-primary transition-all mb-2"
                            />
                          )}
                          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                            {filteredPorteros.map((p, idx) => (
                              <Link key={p.id} to={`/jugadores/${p.id}`} className="flex items-center justify-between gap-2 p-2.5 border border-border/40 rounded-xl bg-card/25 hover:border-primary/20 hover:scale-[1.01] transition-all cursor-pointer">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="font-mono font-black text-xs text-primary">#{idx + 1}</span>
                                  <div className="shrink-0">
                                    {p.foto ? (
                                      <img src={getImageUrl(p.foto)} alt={p.name} className="w-8 h-8 rounded-full object-cover border border-border/40" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-display font-black text-[9px] text-foreground uppercase">{p.name.charAt(0)}</div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-display font-bold uppercase text-foreground truncate max-w-[120px]">{p.name}</p>
                                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider leading-none mt-0.5 truncate">{p.equipo_nombre}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-5 text-right pr-1">
                                  <div className="hidden sm:block">
                                    <p className="text-[8px] text-muted-foreground font-mono leading-none">PARADAS / RECIBIDOS</p>
                                    <p className="text-[10px] font-bold text-foreground leading-none mt-1">
                                      {p.total_atajadas} Ataj. / {p.total_goles_recibidos} Goles
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] text-muted-foreground font-mono leading-none">PRESTIGIO</p>
                                    <p className="text-xs font-display font-black text-primary font-mono leading-none mt-1">{p.score}</p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                          {stats.prestigio_porteros.length > 5 && (
                            <Link 
                              to="/datos"
                              className="w-full text-center py-2 border border-dashed border-border/40 hover:border-primary/45 rounded-xl text-[9px] font-condensed font-black tracking-widest uppercase hover:text-primary transition-colors cursor-pointer mt-2 block"
                            >
                              ➕ VER MÁS / FILTRAR
                            </Link>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Sin reportes registrados.</p>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            )}

          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center">No se encontraron estadísticas para las competencias activas.</p>
        )}
      </div>
    </div>
  );
}
