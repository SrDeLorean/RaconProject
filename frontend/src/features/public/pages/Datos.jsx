import React, { useEffect, useState, useMemo } from 'react';
import api from '@/api/axios';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ComparadorAnalitico from '../components/ComparadorAnalitico';
import GraficosColectivos from '../components/GraficosColectivos';
import DirectorioTactico from '../components/DirectorioTactico';
import TierListEstadisticas from '../components/TierListEstadisticas';

export default function Datos() {
  const [organizations, setOrganizations] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [competitions, setCompetitions] = useState([]);

  // Filter States
  const [selectedOrg, setSelectedOrg] = useState('todas');
  const [selectedSeason, setSelectedSeason] = useState('todas');
  const [selectedComp, setSelectedComp] = useState('todas');

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sub-pages state: 'resumen' | 'telemetria' | 'comparador' | 'tiers'
  const [activeSubPage, setActiveSubPage] = useState('resumen');

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
            competencia_id: selectedComp,
            all: 'true'
          }
        });
        setStats(response.data);
      } catch (error) {
        console.error("Error al obtener analíticas de datos:", error);
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

  const playersList = useMemo(() => {
    if (!stats) return [];
    return stats.todos_jugadores || [];
  }, [stats]);

  return (
    <div className="relative min-h-screen bg-background pb-16 overflow-hidden text-foreground">
      {/* Glow ambient background */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[140px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-destructive/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* ========================================================================= */}
      {/* 1. HERO CENTRAL (Cinemático y Táctico)                                    */}
      {/* ========================================================================= */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 pt-32 md:pt-40 pb-16 overflow-hidden">
        
        {/* Palabras de fondo brush estilo editorial */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
          <span className="absolute top-10 left-10 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[2px] float-brush-1">
            DATOS
          </span>
          <span className="absolute bottom-10 right-20 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[3px] float-brush-2">
            MÉTRICAS
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
              {playersList.length || 99}
            </div>

            <Badge 
              variant="primary" 
              className="px-5 py-2 text-[10px] font-condensed tracking-[0.2em] text-primary border border-primary/30 bg-primary/10 rounded-full shadow-[0_0_20px_hsla(var(--primary),0.15)] uppercase animate-pulse shrink-0 z-10"
            >
              📊 Centro de Telemetría Táctica
            </Badge>

            <h1 className="text-4xl sm:text-8xl md:text-9xl font-display font-black text-foreground uppercase tracking-[0.01em] leading-[0.82] drop-shadow-2xl z-10 mt-2 select-none">
              CENTRO DE <br />
              <span className="text-primary tracking-tight font-black shimmer-text">
                DATOS ANALÍTICOS.
              </span>
            </h1>

            <p className="text-xs md:text-sm text-muted-foreground font-sans max-w-xl leading-relaxed tracking-wide font-light z-10 mt-2">
              Explora las métricas del servidor en tiempo real. Compara directamente a tus rivales de liga, examina los líderes de cada demarcación y visualiza gráficos de distribución y rendimiento.
            </p>
          </div>

          {/* DERECHA — INFORMACIÓN TÁCTICA */}
          <div className="lg:col-span-3 flex flex-col justify-center items-start lg:items-stretch gap-6 z-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="border border-border/40 bg-card/45 backdrop-blur-md rounded-2xl p-6 w-full space-y-4 shadow-xl">
              
              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                <span className="text-[10px] font-condensed tracking-widest text-muted-foreground uppercase">TELEMETRÍA REAL</span>
                <span className="text-[10px] font-mono text-primary font-bold">ANALYTICS CENTER</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">COMPETIDORES</h4>
                  <span className="text-3xl font-display font-black text-foreground">{playersList.length}</span>
                </div>
                <div>
                  <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">MÉTRICAS</h4>
                  <span className="text-3xl font-display font-black text-primary">35</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed font-sans font-light">
                Base de datos completa con telemetría de rendimiento consolidada de todas las competencias oficiales.
              </p>

              <button 
                onClick={() => { setSelectedOrg('todas'); setSelectedSeason('todas'); setSelectedComp('todas'); setActiveSubPage('resumen'); }}
                className="w-full py-4 text-xs font-condensed tracking-widest uppercase rounded-lg text-primary-foreground font-black cursor-pointer btn-glossy"
              >
                REINICIAR FILTROS
              </button>
            </div>
          </div>

        </div>

      </section>

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 space-y-8 animate-fade-in">

        {/* Panel de Filtros */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 border border-border/40 bg-card/15 backdrop-blur-md p-5 rounded-2xl shadow-xl">
          <div className="space-y-1.5 text-left">
            <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest block">🛡️ Organización</label>
            <div className="relative">
              <select 
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full bg-background/45 border border-border/40 hover:border-primary/45 rounded-xl px-4 py-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all uppercase cursor-pointer select-none appearance-none"
              >
                <option value="todas">🌎 Todas (Comparar Todo)</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.nombre}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground text-[9px]">▼</div>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest block">📅 Temporada</label>
            <div className="relative">
              <select 
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                disabled={selectedOrg === 'todas'}
                className="w-full bg-background/45 border border-border/40 hover:border-primary/45 rounded-xl px-4 py-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50 uppercase cursor-pointer select-none appearance-none"
              >
                <option value="todas">🌎 Todas las Temporadas</option>
                {seasons.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground text-[9px]">▼</div>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest block">🏆 Competencia</label>
            <div className="relative">
              <select 
                value={selectedComp}
                onChange={(e) => setSelectedComp(e.target.value)}
                disabled={selectedOrg === 'todas'}
                className="w-full bg-background/45 border border-border/40 hover:border-primary/45 rounded-xl px-4 py-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50 uppercase cursor-pointer select-none appearance-none"
              >
                <option value="todas">🌎 Todas las Competencias</option>
                {competitions.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground text-[9px]">▼</div>
            </div>
          </div>
        </div>

        {/* Sub-Navegación HUD del Centro de Datos */}
        <div 
          className="flex border border-border/40 p-1 bg-card/25 backdrop-blur-md rounded-2xl max-w-2xl mx-auto shadow-xl overflow-x-auto gap-1 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {[
            { id: 'resumen', label: '📊 Resumen' },
            { id: 'telemetria', label: '📋 Telemetría' },
            { id: 'comparador', label: '⚔️ Comparador' },
            { id: 'tiers', label: '🏆 Tier List' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveSubPage(tab.id)}
              className={`flex-1 min-w-[100px] py-2.5 px-4 text-[10px] font-condensed tracking-widest font-black uppercase rounded-xl transition-all duration-300 cursor-pointer whitespace-nowrap ${
                activeSubPage === tab.id 
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsla(var(--primary),0.3)]' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Spinner size="lg" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Cargando telemetría...</span>
          </div>
        ) : stats ? (
          <div className="space-y-12">
            
            {/* Si es Resumen: Mostrar KPIs y Gráficos Colectivos */}
            {activeSubPage === 'resumen' && (
              <div className="space-y-12 animate-fade-in">
                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Partidos en Base', val: stats.total_partidos || 0, desc: 'Partidos disputados registrados.', icon: '⚽' },
                    { label: 'Goles Registrados', val: stats.goles_totales || 0, desc: 'Goles marcados en total.', icon: '🎯' },
                    { label: 'Ratio de Anotación', val: `${stats.promedio_goles || 0} G/P`, desc: 'Promedio de goles por partido.', icon: '📈' },
                    { label: 'Win Rate Local', val: `${stats.porcentaje_local || 0}%`, desc: 'Porcentaje de victorias de local.', icon: '🏠' }
                  ].map((kpi, idx) => (
                    <div key={idx} className="glass-card-aaa p-5 rounded-2xl text-left border border-border/40 flex items-center justify-between group">
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono font-black text-muted-foreground uppercase tracking-widest block">{kpi.label}</span>
                        <strong className="text-2xl font-display font-black text-foreground block tracking-wide">{kpi.val}</strong>
                        <span className="text-[10px] text-muted-foreground leading-none block">{kpi.desc}</span>
                      </div>
                      <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform duration-300">{kpi.icon}</span>
                    </div>
                  ))}
                </div>

                <GraficosColectivos stats={stats} getImageUrl={getImageUrl} />
              </div>
            )}

            {/* Si es Telemetría: Mostrar Directorio Tactico */}
            {activeSubPage === 'telemetria' && (
              <div className="animate-fade-in">
                <DirectorioTactico stats={stats} getImageUrl={getImageUrl} />
              </div>
            )}

            {/* Si es Comparador: Mostrar Comparador Analitico */}
            {activeSubPage === 'comparador' && (
              <div className="animate-fade-in">
                <ComparadorAnalitico playersList={playersList} />
              </div>
            )}

            {/* Si es Tier List: Mostrar TierListEstadisticas */}
            {activeSubPage === 'tiers' && (
              <div className="animate-fade-in">
                <TierListEstadisticas stats={stats} getImageUrl={getImageUrl} />
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
