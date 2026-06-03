import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/api/axios';
import Badge from '@/components/ui/Badge';
import PageLoader from '@/components/ui/PageLoader';

export default function DetallePartido() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('club_stats');
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [logFilter, setLogFilter] = useState('todos');
  const [logPage, setLogPage] = useState(1);
  const [mobileTeamActive, setMobileTeamActive] = useState('local');

  useEffect(() => {
    const fetchPartido = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/partidos/${id}`);
        setData(response.data);
      } catch (error) {
        console.error("Error al obtener detalles del partido:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPartido();
  }, [id]);

  // Paginación de Logs del reporte EA
  const logItemsPerPage = 5;

  useEffect(() => {
    setLogPage(1);
  }, [logFilter]);

  const filteredLogsList = React.useMemo(() => {
    if (!data || !data.stats_logs) return [];
    return data.stats_logs.filter(log => {
      if (logFilter === 'todos') return true;
      return log.estado === logFilter;
    });
  }, [data, logFilter]);

  const paginatedLogs = React.useMemo(() => {
    const offset = (logPage - 1) * logItemsPerPage;
    return filteredLogsList.slice(offset, offset + logItemsPerPage);
  }, [filteredLogsList, logPage]);

  const totalLogPages = React.useMemo(() => {
    return Math.ceil(filteredLogsList.length / logItemsPerPage) || 1;
  }, [filteredLogsList]);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8000${path}`;
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center">
        <span className="text-4xl">⚽</span>
        <h2 className="text-xl font-display font-black text-foreground uppercase">Partido No Encontrado</h2>
        <Link to="/partidos" className="text-xs text-primary font-bold uppercase hover:underline">Volver al Calendario</Link>
      </div>
    );
  }

  const { partido, stats_equipos, stats_jugadores, stats_logs } = data;
  const local = partido.local || {};
  const visitante = partido.visitante || {};
  const competencia = partido.competencia || {};
  const finalizado = partido.estado === 'finalizado' || (partido.goles_local !== null && partido.goles_visitante !== null);

  // Mapear estadísticas de equipo
  const localStats = stats_equipos.find(s => s.equipo_id === local.id) || null;
  const visitanteStats = stats_equipos.find(s => s.equipo_id === visitante.id) || null;

  // Filtrar jugadores por club
  const localJugadores = stats_jugadores.filter(sj => sj.equipo_id === local.id);
  const visitanteJugadores = stats_jugadores.filter(sj => sj.equipo_id === visitante.id);

  // Helper para asignar clases de color de borde según posición
  const getPosClass = (pos) => {
    if (!pos) return 'pos-other';
    const p = pos.toUpperCase();
    if (['PO', 'POR', 'GK', 'ARQUERO'].includes(p)) return 'pos-gk';
    if (['DF', 'DEF', 'DFC', 'LD', 'LI', 'CAD', 'CAI', 'DFD', 'DFI'].includes(p)) return 'pos-def';
    if (['MC', 'MED', 'MCO', 'MCD', 'MI', 'MD', 'MID', 'VOL'].includes(p)) return 'pos-med';
    if (['DL', 'DEL', 'DC', 'EI', 'ED', 'SD', 'ATT', 'EXT'].includes(p)) return 'pos-del';
    return 'pos-other';
  };

  return (
    <div className="relative min-h-screen bg-background pt-28 pb-16 overflow-hidden scanlines">
      {/* Fondo Inmersivo */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 opacity-15 dark:opacity-25 pointer-events-none"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1920&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/85 to-background z-10"></div>
      </div>

      {/* Resplandores ambientales e-sports */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-primary/8 blur-[130px] rounded-full pointer-events-none z-10"></div>
      <div className="absolute bottom-1/3 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-10"></div>

      {/* Palabras de fondo brush estilo editorial */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
        <span className="absolute top-16 left-10 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.02] blur-[2px] float-brush-1">
          TACTICAL
        </span>
        <span className="absolute bottom-20 right-20 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.02] blur-[3px] float-brush-2">
          ANALYSIS
        </span>
      </div>

      <div className="relative z-20 max-w-5xl mx-auto px-6 lg:px-10 space-y-10">
        
        {/* Cabecera / Marcador Principal de Élite */}
        <div className="border border-border/40 dark:border-white/[0.08] bg-white/90 dark:bg-card/45 backdrop-blur-md rounded-3xl pt-14 pb-8 px-6 md:pt-16 md:pb-10 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden animate-fade-in-up">
          <div className="absolute inset-0 hud-noise pointer-events-none opacity-40"></div>
          
          {/* Cyberpunk corner lines */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/30 rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/30 rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/30 rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/30 rounded-br-lg"></div>

          {/* Barra superior de info */}
          <div className="absolute top-0 inset-x-0 h-8 border-b border-border/10 dark:border-white/[0.04] bg-muted/20 dark:bg-white/[0.02] rounded-t-3xl flex items-center justify-between px-6 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
            <span>🏆 {competencia.nombre || 'PARTIDO OFICIAL'}</span>
            {partido.jornada && <span>Jornada {partido.jornada}</span>}
            {partido.grupo && <span>Grupo {partido.grupo}</span>}
          </div>

          {/* Club Local */}
          <div className="flex flex-col items-center gap-4 text-center md:w-1/3 z-10">
            <Link to={`/equipos/${local.id}`} className="group relative">
              {local.logo ? (
                <div className="relative p-1.5 rounded-3xl bg-slate-900/5 dark:bg-white/[0.02] border border-border/60 dark:border-white/[0.06] shadow-md group-hover:border-primary/50 transition-all duration-300">
                  <img 
                    src={getImageUrl(local.logo)} 
                    alt={local.nombre} 
                    className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover group-hover:scale-105 transition-all duration-500"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-tr from-primary to-destructive flex items-center justify-center font-display font-black text-primary-foreground text-4xl shadow-xl uppercase group-hover:scale-105 transition-transform duration-300">
                  {local.abreviatura || local.nombre?.charAt(0)}
                </div>
              )}
            </Link>
            <div className="space-y-1">
              <h3 className="font-display font-black text-xl md:text-2xl text-foreground uppercase tracking-wider leading-tight">
                {local.nombre}
              </h3>
              <span className="inline-block text-[9px] text-muted-foreground font-mono font-black uppercase bg-muted/60 dark:bg-white/5 px-2.5 py-0.5 rounded border border-border/40 dark:border-white/[0.05] tracking-widest">
                {local.abreviatura || 'LOC'}
              </span>
            </div>
          </div>

          {/* Marcador Central */}
          <div className="flex flex-col items-center justify-center text-center md:w-1/3 z-10">
            <div className="flex items-center justify-center gap-4">
              {/* Marcador Local */}
              <div className="relative group/score">
                <div className="absolute inset-0 bg-primary/10 blur-md rounded-2xl opacity-0 group-hover/score:opacity-100 transition-opacity"></div>
                <div className="w-16 h-18 md:w-20 md:h-22 bg-black/[0.03] dark:bg-black/30 border border-border/80 dark:border-white/[0.08] rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden backdrop-blur-sm">
                  <span className="text-4xl md:text-5xl font-display font-black text-primary tracking-tighter shimmer-text">
                    {finalizado ? partido.goles_local : '—'}
                  </span>
                </div>
              </div>
              
              {/* Separador */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono font-bold text-muted-foreground/45 uppercase tracking-widest">VS</span>
                <div className="w-1 h-8 bg-gradient-to-b from-primary/30 to-destructive/30 rounded-full"></div>
              </div>

              {/* Marcador Visitante */}
              <div className="relative group/score">
                <div className="absolute inset-0 bg-destructive/10 blur-md rounded-2xl opacity-0 group-hover/score:opacity-100 transition-opacity"></div>
                <div className="w-16 h-18 md:w-20 md:h-22 bg-black/[0.03] dark:bg-black/30 border border-border/80 dark:border-white/[0.08] rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden backdrop-blur-sm">
                  <span className="text-4xl md:text-5xl font-display font-black text-destructive tracking-tighter shimmer-text">
                    {finalizado ? partido.goles_visitante : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <span className={`inline-flex items-center gap-1.5 text-[9px] font-condensed font-black tracking-widest uppercase px-3 py-1 rounded-lg border ${
                finalizado 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/25 animate-pulse'
              }`}>
                {finalizado ? '🏁 FINALIZADO' : '📅 PROGRAMADO'}
              </span>

              <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest block">
                🕒 {partido.fecha ? `${partido.fecha} — ${partido.hora || 'Por definir'}` : 'Sin programar'}
              </span>
            </div>
          </div>

          {/* Club Visitante */}
          <div className="flex flex-col items-center gap-4 text-center md:w-1/3 z-10">
            <Link to={`/equipos/${visitante.id}`} className="group relative">
              {visitante.logo ? (
                <div className="relative p-1.5 rounded-3xl bg-slate-900/5 dark:bg-white/[0.02] border border-border/60 dark:border-white/[0.06] shadow-md group-hover:border-destructive/50 transition-all duration-300">
                  <img 
                    src={getImageUrl(visitante.logo)} 
                    alt={visitante.nombre} 
                    className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover group-hover:scale-105 transition-all duration-500"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-tr from-primary to-destructive flex items-center justify-center font-display font-black text-primary-foreground text-4xl shadow-xl uppercase group-hover:scale-105 transition-transform duration-300">
                  {visitante.abreviatura || visitante.nombre?.charAt(0)}
                </div>
              )}
            </Link>
            <div className="space-y-1">
              <h3 className="font-display font-black text-xl md:text-2xl text-foreground uppercase tracking-wider leading-tight">
                {visitante.nombre}
              </h3>
              <span className="inline-block text-[9px] text-muted-foreground font-mono font-black uppercase bg-muted/60 dark:bg-white/5 px-2.5 py-0.5 rounded border border-border/40 dark:border-white/[0.05] tracking-widest">
                {visitante.abreviatura || 'VIS'}
              </span>
            </div>
          </div>

        </div>

        {/* Tabulación de Secciones de Estadísticas */}
        <div className="flex border-b border-border/20 dark:border-white/[0.06] overflow-x-auto gap-2 custom-scrollbar animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {[
            { id: 'club_stats', label: 'Estadísticas del Club' },
            { id: 'roster_stats', label: 'Alineaciones y Rendimiento' },
            { id: 'log_reporte', label: 'Log del Reporte EA' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-xs font-condensed font-black tracking-widest uppercase border-b-2 transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5 font-extrabold shadow-[inset_0_-2px_0_var(--primary)]'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenidos Dinámicos */}
        <div className="min-h-96 relative z-10">
          {/* TAB 1: Estadísticas de Equipo */}
          {activeTab === 'club_stats' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-border/20 dark:border-white/[0.06] pb-3">
                <div>
                  <h2 className="text-xl font-display font-black uppercase tracking-wider text-foreground">
                    Comparativa Táctica
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">Métricas oficiales de equipo registradas en FC26</p>
                </div>
              </div>
              
              {localStats && visitanteStats ? (
                <div className="border border-border/40 dark:border-white/[0.06] bg-white/70 dark:bg-card/25 backdrop-blur-md rounded-3xl p-6 md:p-10 space-y-8 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 hud-noise pointer-events-none opacity-30"></div>
                  
                  {/* Cyberpunk brackets inside the comparison panel */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-primary/20 rounded-tl"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary/20 rounded-tr"></div>
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-primary/20 rounded-bl"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-primary/20 rounded-br"></div>

                  <div className="space-y-6 relative z-10">
                    {[
                      { label: 'Goles convertidos', localVal: localStats.goles_favor, visitVal: visitanteStats.goles_favor },
                      { label: 'Tiros al arco', localVal: localStats.tiros, visitVal: visitanteStats.tiros },
                      { label: 'Pases completados', localVal: localStats.pases_completados, visitVal: visitanteStats.pases_completados },
                      { label: 'Pases intentados', localVal: localStats.pases_intentados, visitVal: visitanteStats.pases_intentados },
                      { label: 'Precisión de pases', localVal: localStats.precision_pases, visitVal: visitanteStats.precision_pases, percent: true },
                      { label: 'Tackles Exitosos', localVal: localStats.entradas_exitosas, visitVal: visitanteStats.entradas_exitosas },
                      { label: 'Tarjetas Rojas', localVal: localStats.tarjetas_rojas, visitVal: visitanteStats.tarjetas_rojas, alert: true },
                      { label: 'Atajadas de Arquero', localVal: localStats.atajadas, visitVal: visitanteStats.atajadas },
                    ].map((item, idx) => {
                      const localValNum = Number(item.localVal);
                      const visitValNum = Number(item.visitVal);
                      const total = localValNum + visitValNum;
                      const localPercent = total > 0 ? (localValNum / total) * 100 : 50;
                      const visitPercent = total > 0 ? (visitValNum / total) * 100 : 50;

                      const isLocalGreater = localValNum > visitValNum;
                      const isVisitorGreater = visitValNum > localValNum;

                      return (
                        <div key={idx} className="flex items-center justify-between gap-4 py-1.5 border-b border-border/10 dark:border-white/[0.02] last:border-b-0 hover:bg-muted/5 dark:hover:bg-white/[0.01] px-2 rounded-xl transition-colors duration-200">
                          {/* Valor Local */}
                          <div className="w-16 md:w-20 text-left shrink-0">
                            <span className={`text-2xl md:text-3xl font-display font-black tracking-wide transition-all ${
                              isLocalGreater 
                                ? 'text-primary text-glow-primary scale-105' 
                                : 'text-muted-foreground/75'
                            }`}>
                              {item.localVal}{item.percent ? '%' : ''}
                            </span>
                          </div>

                          {/* Barras e Indicador Central */}
                          <div className="flex-1 flex items-center justify-center gap-3 md:gap-5 min-w-0">
                            {/* Barra Local (derecha a izquierda) */}
                            <div className="flex-1 h-2 md:h-2.5 bg-muted dark:bg-white/5 rounded-full overflow-hidden relative border border-border/10 dark:border-white/[0.03]">
                              <div 
                                className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-primary to-primary/50 rounded-full animate-fill-bar"
                                style={{ width: `${localPercent}%`, animationDelay: `${idx * 0.05}s` }}
                              ></div>
                            </div>

                            {/* Etiqueta Central */}
                            <span className="text-[9px] md:text-[10px] font-condensed font-black tracking-widest text-foreground dark:text-muted-foreground uppercase text-center min-w-[110px] md:min-w-[150px] shrink-0 truncate">
                              {item.label}
                            </span>

                            {/* Barra Visitante (izquierda a derecha) */}
                            <div className="flex-1 h-2 md:h-2.5 bg-muted dark:bg-white/5 rounded-full overflow-hidden relative border border-border/10 dark:border-white/[0.03]">
                              <div 
                                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-destructive/50 to-destructive rounded-full animate-fill-bar"
                                style={{ width: `${visitPercent}%`, animationDelay: `${idx * 0.05}s` }}
                              ></div>
                            </div>
                          </div>

                          {/* Valor Visitante */}
                          <div className="w-16 md:w-20 text-right shrink-0">
                            <span className={`text-2xl md:text-3xl font-display font-black tracking-wide transition-all ${
                              isVisitorGreater 
                                ? 'text-destructive scale-105' 
                                : 'text-muted-foreground/75'
                            }`}>
                              {item.visitVal}{item.percent ? '%' : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="border border-border/50 dark:border-white/[0.06] bg-white/40 dark:bg-card/10 rounded-2xl p-16 text-center text-muted-foreground flex flex-col items-center gap-3">
                  <span className="text-3xl animate-bounce">🤖</span>
                  <p className="text-xs font-condensed font-black uppercase tracking-widest">Estadísticas comparativas no reportadas aún para este partido.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Alineaciones y Estadísticas Individuales */}
          {activeTab === 'roster_stats' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/20 dark:border-white/[0.06] pb-3 gap-2">
                <div>
                  <h2 className="text-xl font-display font-black uppercase tracking-wider text-foreground">
                    Alineaciones Oficiales
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">Estadísticas individuales registradas por el Matchmaker EA</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary" className="text-[9px] font-mono tracking-widest px-2 py-1 rounded uppercase bg-primary/10 border border-primary/30 text-primary">
                    💡 PISTA TÁCTICA
                  </Badge>
                  <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wide hidden md:inline">Toca un jugador para ver su telemetría individual</span>
                  <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wide md:hidden">Métricas tácticas integradas directamente</span>
                </div>
              </div>

              {/* VISTA ESCRITORIO: Alineaciones en columnas lado a lado */}
              <div className="hidden md:grid grid-cols-2 gap-8 items-start">
                
                {/* Local Roster */}
                <div className="space-y-4">
                  <h3 className="text-lg font-display font-black uppercase text-primary tracking-wider flex items-center gap-3 border-b border-primary/20 pb-2">
                    {local.logo ? (
                      <img src={getImageUrl(local.logo)} alt={local.nombre} className="w-7 h-7 rounded-lg object-cover border border-border/40 bg-background shadow-inner shrink-0" />
                    ) : (
                      <span className="text-xl">🛡️</span>
                    )}
                    {local.nombre}
                  </h3>
                  {localJugadores.length > 0 ? (
                    <div className="space-y-3">
                      {localJugadores.map((sj) => {
                        const userJ = sj.jugador || {};
                        const isExpanded = expandedPlayer === sj.id;
                        return (
                          <div 
                            key={sj.id}
                            className={`border transition-all duration-300 cursor-pointer overflow-hidden rounded-2xl p-3.5 flex flex-col gap-2.5 relative select-none shadow-md ${getPosClass(sj.posicion)} ${
                              isExpanded 
                                ? 'border-primary/50 bg-primary/[0.02] shadow-[0_0_15px_rgba(232,0,29,0.05)]' 
                                : 'border-border/40 dark:border-white/[0.05] bg-white/70 dark:bg-card/25 hover:border-primary/30 hover:bg-white/95 dark:hover:bg-card/35'
                            }`}
                            onClick={() => setExpandedPlayer(isExpanded ? null : sj.id)}
                          >
                            <div className="absolute inset-0 hud-noise pointer-events-none opacity-20"></div>
                            
                            <div className="flex items-center justify-between gap-3 relative z-10">
                              <div className="flex items-center gap-3 min-w-0">
                                {userJ.foto ? (
                                  <img 
                                    src={getImageUrl(userJ.foto)} 
                                    alt={userJ.name} 
                                    className="w-7 h-7 rounded-full object-cover border border-border/45 bg-background shadow-inner shrink-0"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-muted/50 dark:bg-white/5 flex items-center justify-center border border-border/30 dark:border-white/[0.03] text-xs shrink-0 select-none">
                                    🏃
                                  </div>
                                )}
                                <Link 
                                  to={`/jugadores/${userJ.id}`} 
                                  className="font-display font-black text-sm md:text-base text-foreground hover:text-primary transition-colors truncate uppercase tracking-wide"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {userJ.name}
                                </Link>
                                <span className="text-[9px] bg-muted/70 dark:bg-white/10 px-2 py-0.5 rounded font-mono font-black text-muted-foreground uppercase border border-border/30 dark:border-white/[0.03] tracking-widest">{sj.posicion}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 shrink-0">
                                {sj.goles > 0 && (
                                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black px-2 py-0.5 rounded font-mono">
                                    ⚽ {sj.goles}
                                  </span>
                                )}
                                {sj.asistencias > 0 && (
                                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black px-2 py-0.5 rounded font-mono">
                                    🎯 {sj.asistencias}
                                  </span>
                                )}
                                <span className="text-xs bg-primary/15 text-primary border border-primary/25 font-mono font-black px-2.5 py-1 rounded-lg flex items-center gap-1">
                                  ⭐ {Number(sj.valoracion).toFixed(1)}
                                  <span className="text-[8px] opacity-80">{isExpanded ? '▲' : '▼'}</span>
                                </span>
                              </div>
                            </div>

                            {/* Ficha Estadística Expandida */}
                            {isExpanded && (
                              <div className="mt-1 p-3.5 border-t border-border/20 dark:border-white/[0.06] bg-background/30 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3.5 animate-fade-in text-left relative z-10">
                                <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-1">
                                  <span className="text-[9px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Valoración</span>
                                  <strong className="text-xs font-mono font-black text-primary block">⭐ {Number(sj.valoracion).toFixed(1)}</strong>
                                </div>
                                <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-1">
                                  <span className="text-[9px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Goles / Asist.</span>
                                  <strong className="text-xs font-mono font-black text-foreground block">⚽ {sj.goles || 0} / 🎯 {sj.asistencias || 0}</strong>
                                </div>
                                <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-1">
                                  <span className="text-[9px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Pases C./I.</span>
                                  <strong className="text-[11px] font-mono font-black text-foreground block">
                                    {sj.pases_completados || 0}/{sj.pases_intentados || 0} ({Math.round(sj.precision_pases || 0)}%)
                                  </strong>
                                </div>
                                <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-1">
                                  <span className="text-[9px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Quites / Tasa</span>
                                  <strong className="text-xs font-mono font-black text-foreground block">
                                    🛡️ {sj.entradas_exitosas || 0} ({Math.round(sj.tasa_exito_entradas || 0)}%)
                                  </strong>
                                </div>
                                <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-1">
                                  <span className="text-[9px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Precisión Tiro</span>
                                  <strong className="text-xs font-mono font-black text-foreground block">🎯 {Math.round(sj.precision_tiro || 0)}%</strong>
                                </div>
                                <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-1">
                                  <span className="text-[9px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Tarjetas</span>
                                  <strong className="text-xs font-mono font-black text-foreground block">🟨 {sj.tarjetas_amarillas || 0} / 🟥 {sj.tarjetas_rojas || 0}</strong>
                                </div>
                                {sj.atajadas > 0 && (
                                  <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-1">
                                    <span className="text-[9px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Atajadas GK</span>
                                    <strong className="text-xs font-mono font-black text-foreground block">🧤 {sj.atajadas}</strong>
                                  </div>
                                )}
                                {sj.goles_recibidos > 0 && (
                                  <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-1">
                                    <span className="text-[9px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Encajados GK</span>
                                    <strong className="text-xs font-mono font-black text-destructive block">🥅 {sj.goles_recibidos}</strong>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="border border-border/40 dark:border-white/[0.06] bg-white/40 dark:bg-card/10 rounded-2xl p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                      <span className="text-xl">🏃</span>
                      <p className="text-[10px] font-condensed font-black uppercase tracking-widest">Plantilla no reportada para este club.</p>
                    </div>
                  )}
                </div>

                {/* Visitante Roster */}
                <div className="space-y-4">
                  <h3 className="text-lg font-display font-black uppercase text-destructive tracking-wider flex items-center gap-3 border-b border-destructive/20 pb-2">
                    {visitante.logo ? (
                      <img src={getImageUrl(visitante.logo)} alt={visitante.nombre} className="w-7 h-7 rounded-lg object-cover border border-border/40 bg-background shadow-inner shrink-0" />
                    ) : (
                      <span className="text-xl">⚔️</span>
                    )}
                    {visitante.nombre}
                  </h3>
                  {visitanteJugadores.length > 0 ? (
                    <div className="space-y-3">
                      {visitanteJugadores.map((sj) => {
                        const userJ = sj.jugador || {};
                        const isExpanded = expandedPlayer === sj.id;
                        return (
                          <div 
                            key={sj.id}
                            className={`border transition-all duration-300 cursor-pointer overflow-hidden rounded-2xl p-3.5 flex flex-col gap-2.5 relative select-none shadow-md ${getPosClass(sj.posicion)} ${
                              isExpanded 
                                ? 'border-destructive/50 bg-destructive/[0.02] shadow-[0_0_15px_rgba(220,38,38,0.05)]' 
                                : 'border-border/40 dark:border-white/[0.05] bg-white/70 dark:bg-card/25 hover:border-destructive/30 hover:bg-white/95 dark:hover:bg-card/35'
                            }`}
                            onClick={() => setExpandedPlayer(isExpanded ? null : sj.id)}
                          >
                            <div className="absolute inset-0 hud-noise pointer-events-none opacity-20"></div>
                            
                            <div className="flex items-center justify-between gap-3 relative z-10">
                              <div className="flex items-center gap-3 min-w-0">
                                {userJ.foto ? (
                                  <img 
                                    src={getImageUrl(userJ.foto)} 
                                    alt={userJ.name} 
                                    className="w-7 h-7 rounded-full object-cover border border-border/45 bg-background shadow-inner shrink-0"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-muted/50 dark:bg-white/5 flex items-center justify-center border border-border/30 dark:border-white/[0.03] text-xs shrink-0 select-none">
                                    🏃
                                  </div>
                                )}
                                <Link 
                                  to={`/jugadores/${userJ.id}`} 
                                  className="font-display font-black text-sm md:text-base text-foreground hover:text-destructive transition-colors truncate uppercase tracking-wide"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {userJ.name}
                                </Link>
                                <span className="text-[9px] bg-muted/70 dark:bg-white/10 px-2 py-0.5 rounded font-mono font-black text-muted-foreground uppercase border border-border/30 dark:border-white/[0.03] tracking-widest">{sj.posicion}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 shrink-0">
                                {sj.goles > 0 && (
                                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black px-2 py-0.5 rounded font-mono">
                                    ⚽ {sj.goles}
                                  </span>
                                )}
                                {sj.asistencias > 0 && (
                                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black px-2 py-0.5 rounded font-mono">
                                    🎯 {sj.asistencias}
                                  </span>
                                )}
                                <span className="text-xs bg-destructive/15 text-destructive border border-destructive/25 font-mono font-black px-2.5 py-1 rounded-lg flex items-center gap-1">
                                  ⭐ {Number(sj.valoracion).toFixed(1)}
                                  <span className="text-[8px] opacity-80">{isExpanded ? '▲' : '▼'}</span>
                                </span>
                              </div>
                            </div>

                            {/* Ficha Estadística Expandida */}
                            {isExpanded && (
                              <div className="mt-1 p-3.5 border-t border-border/20 dark:border-white/[0.06] bg-background/30 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3.5 animate-fade-in text-left relative z-10">
                                <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-1">
                                  <span className="text-[9px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Valoración</span>
                                  <strong className="text-xs font-mono font-black text-destructive block">⭐ {Number(sj.valoracion).toFixed(1)}</strong>
                                </div>
                                <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-1">
                                  <span className="text-[9px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Goles / Asist.</span>
                                  <strong className="text-xs font-mono font-black text-foreground block">⚽ {sj.goles || 0} / 🎯 {sj.asistencias || 0}</strong>
                                </div>
                                <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-1">
                                  <span className="text-[9px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Pases C./I.</span>
                                  <strong className="text-[11px] font-mono font-black text-foreground block">
                                    {sj.pases_completados || 0}/{sj.pases_intentados || 0} ({Math.round(sj.precision_pases || 0)}%)
                                  </strong>
                                </div>
                                <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-1">
                                  <span className="text-[9px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Quites / Tasa</span>
                                  <strong className="text-xs font-mono font-black text-foreground block">
                                    🛡️ {sj.entradas_exitosas || 0} ({Math.round(sj.tasa_exito_entradas || 0)}%)
                                  </strong>
                                </div>
                                <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-1">
                                  <span className="text-[9px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Precisión Tiro</span>
                                  <strong className="text-xs font-mono font-black text-foreground block">🎯 {Math.round(sj.precision_tiro || 0)}%</strong>
                                </div>
                                <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-1">
                                  <span className="text-[9px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Tarjetas</span>
                                  <strong className="text-xs font-mono font-black text-foreground block">🟨 {sj.tarjetas_amarillas || 0} / 🟥 {sj.tarjetas_rojas || 0}</strong>
                                </div>
                                {sj.atajadas > 0 && (
                                  <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-1">
                                    <span className="text-[9px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Atajadas GK</span>
                                    <strong className="text-xs font-mono font-black text-foreground block">🧤 {sj.atajadas}</strong>
                                  </div>
                                )}
                                {sj.goles_recibidos > 0 && (
                                  <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-1">
                                    <span className="text-[9px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Encajados GK</span>
                                    <strong className="text-xs font-mono font-black text-destructive block">🥅 {sj.goles_recibidos}</strong>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="border border-border/40 dark:border-white/[0.06] bg-white/40 dark:bg-card/10 rounded-2xl p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                      <span className="text-xl">🏃</span>
                      <p className="text-[10px] font-condensed font-black uppercase tracking-widest">Plantilla no reportada para este club.</p>
                    </div>
                  )}
                </div>

              </div>

              {/* VISTA MÓVIL: Selector de equipo y tarjetas con estadísticas directas */}
              <div className="block md:hidden space-y-6">
                {/* Selector de equipo en Móvil */}
                <div className="flex border border-border/40 dark:border-white/[0.06] bg-muted/40 dark:bg-card/25 rounded-2xl p-1 gap-1">
                  <button
                    onClick={() => setMobileTeamActive('local')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-condensed font-black tracking-widest uppercase transition-all duration-300 ${
                      mobileTeamActive === 'local'
                        ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(232,0,29,0.25)]'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {local.logo && <img src={getImageUrl(local.logo)} alt={local.nombre} className="w-4 h-4 rounded-md object-cover" />}
                    {local.nombre}
                  </button>
                  <button
                    onClick={() => setMobileTeamActive('visitante')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-condensed font-black tracking-widest uppercase transition-all duration-300 ${
                      mobileTeamActive === 'visitante'
                        ? 'bg-destructive text-primary-foreground shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {visitante.logo && <img src={getImageUrl(visitante.logo)} alt={visitante.nombre} className="w-4 h-4 rounded-md object-cover" />}
                    {visitante.nombre}
                  </button>
                </div>

                {/* Listado de Jugadores con Stats Integradas */}
                <div className="space-y-4">
                  {(mobileTeamActive === 'local' ? localJugadores : visitanteJugadores).length > 0 ? (
                    (mobileTeamActive === 'local' ? localJugadores : visitanteJugadores).map((sj) => {
                      const userJ = sj.jugador || {};
                      const isExpanded = expandedPlayer === sj.id;
                      return (
                        <div 
                          key={sj.id}
                          className={`border border-border/40 dark:border-white/[0.05] bg-white/70 dark:bg-card/25 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden cursor-pointer select-none transition-all ${getPosClass(sj.posicion)} ${
                            isExpanded ? 'border-primary/45 bg-white/95 dark:bg-card/35 shadow-lg' : 'hover:border-border/60 hover:bg-white/80 dark:hover:bg-card/30'
                          }`}
                          onClick={() => setExpandedPlayer(isExpanded ? null : sj.id)}
                        >
                          <div className="absolute inset-0 hud-noise pointer-events-none opacity-20"></div>
                          
                          {/* Encabezado: Foto, Nombre, Posición y Valoración */}
                          <div className="flex items-center justify-between gap-3 relative z-10">
                            <div className="flex items-center gap-3 min-w-0">
                              {userJ.foto ? (
                                <img 
                                  src={getImageUrl(userJ.foto)} 
                                  alt={userJ.name} 
                                  className="w-9 h-9 rounded-full object-cover border border-border/45 bg-background shadow-inner shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-muted/50 dark:bg-white/5 flex items-center justify-center border border-border/30 dark:border-white/[0.03] text-xs shrink-0 select-none">
                                  🏃
                                </div>
                              )}
                              <div className="min-w-0">
                                <Link 
                                  to={`/jugadores/${userJ.id}`} 
                                  className={`font-display font-black text-base text-foreground transition-colors truncate block uppercase tracking-wide ${
                                    mobileTeamActive === 'local' ? 'hover:text-primary' : 'hover:text-destructive'
                                  }`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {userJ.name}
                                </Link>
                                <span className="inline-block text-[9px] bg-muted/70 dark:bg-white/10 px-2 py-0.5 rounded font-mono font-black text-muted-foreground uppercase border border-border/30 dark:border-white/[0.03] tracking-widest">
                                  {sj.posicion}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-sm bg-muted/50 dark:bg-white/5 border border-border/30 dark:border-white/[0.03] font-mono font-black px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 ${
                                mobileTeamActive === 'local' ? 'text-primary' : 'text-destructive'
                              }`}>
                                ⭐ {Number(sj.valoracion).toFixed(1)}
                                <span className="text-[8px] opacity-80">{isExpanded ? '▲' : '▼'}</span>
                              </span>
                            </div>
                          </div>

                          {/* Estadísticas en cuadrícula integradas directamente (desplegable) */}
                          {isExpanded && (
                            <div className="grid grid-cols-3 gap-2 mt-1 border-t border-border/20 dark:border-white/[0.05] pt-3 relative z-10 text-left animate-fade-in">
                              <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-0.5 text-center">
                                <span className="text-[8px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Goles/Asist</span>
                                <strong className="text-[11px] font-mono font-black text-foreground block">⚽ {sj.goles || 0} / 🎯 {sj.asistencias || 0}</strong>
                              </div>
                              <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-0.5 text-center">
                                <span className="text-[8px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Pases C./I.</span>
                                <strong className="text-[10px] font-mono font-black text-foreground block">
                                  🔄 {sj.pases_completados || 0}/{sj.pases_intentados || 0} ({Math.round(sj.precision_pases || 0)}%)
                                </strong>
                              </div>
                              <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-0.5 text-center">
                                <span className="text-[8px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Quites</span>
                                <strong className="text-[11px] font-mono font-black text-foreground block">
                                  🛡️ {sj.entradas_exitosas || 0} ({Math.round(sj.tasa_exito_entradas || 0)}%)
                                </strong>
                              </div>
                              <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-0.5 text-center">
                                <span className="text-[8px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Precisión Tiro</span>
                                <strong className="text-[11px] font-mono font-black text-foreground block">🎯 {Math.round(sj.precision_tiro || 0)}%</strong>
                              </div>
                              <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-0.5 text-center">
                                <span className="text-[8px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">Tarjetas</span>
                                <strong className="text-[11px] font-mono font-black text-foreground block">🟨 {sj.tarjetas_amarillas || 0} / 🟥 {sj.tarjetas_rojas || 0}</strong>
                              </div>
                              {sj.atajadas > 0 || sj.goles_recibidos > 0 ? (
                                <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-0.5 text-center">
                                  <span className="text-[8px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">GK Stats</span>
                                  <strong className="text-[10px] font-mono font-black text-foreground block">🧤 {sj.atajadas || 0} / 🥅 {sj.goles_recibidos || 0}</strong>
                                </div>
                              ) : (
                                <div className="bg-background/40 dark:bg-black/20 p-2 rounded-xl border border-border/30 dark:border-white/[0.03] space-y-0.5 text-center flex items-center justify-center">
                                  <span className="text-[8px] font-condensed font-black tracking-widest text-muted-foreground/40 uppercase block">OUTFIELD</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="border border-border/40 dark:border-white/[0.06] bg-white/40 dark:bg-card/10 rounded-2xl p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                      <span className="text-xl">🏃</span>
                      <p className="text-[10px] font-condensed font-black uppercase tracking-widest">Plantilla no reportada para este club.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Log del Reporte e Integridad de Roster */}
          {activeTab === 'log_reporte' && (
            <div className="space-y-6 animate-fade-in bg-white/90 dark:bg-card/85 border border-border/40 dark:border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-2xl relative">
              <div className="absolute inset-0 hud-noise pointer-events-none opacity-30"></div>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/20 dark:border-white/[0.05] pb-4.5 relative z-10">
                <div className="text-left">
                  <h2 className="text-xl font-display font-black uppercase tracking-wider text-foreground">
                    Log de Reporte EA API
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">
                    Validación de consistencia y cruce automatizado de plantillas de juego
                  </p>
                </div>
                {/* Indicador general de Roster Compliance */}
                {stats_logs && stats_logs.some(l => l.estado === 'no_existe_sistema' || l.estado === 'no_inscrito_equipo') ? (
                  <Badge variant="destructive" className="px-3.5 py-1.5 text-[9px] tracking-widest font-black uppercase border-destructive/30 bg-destructive/10 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                    ⚠️ INFRACCIONES DETECTADAS
                  </Badge>
                ) : (
                  <Badge variant="primary" className="px-3.5 py-1.5 text-[9px] tracking-widest font-black uppercase border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    ✅ ROSTERS EN REGLA (100%)
                  </Badge>
                )}
              </div>

              {/* Alerta de Oversight */}
              {stats_logs && stats_logs.some(l => l.estado === 'no_existe_sistema' || l.estado === 'no_inscrito_equipo') && (
                <div className="border border-destructive/20 bg-destructive/5 rounded-2xl p-5 flex items-start gap-4 shadow-md text-left animate-fade-in relative z-10">
                  <span className="text-3xl shrink-0">⚠️</span>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-black text-destructive uppercase block tracking-widest">
                      ALERTA AUTOMÁTICA DE CUMPLIMIENTO (AUDITORÍA DE ROSTER)
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Se han identificado discrepancias críticas entre los datos del partido de EA y los registros de la liga. Los jugadores marcados en <strong className="text-destructive font-black">Rojo (No en Sistema)</strong> o <strong className="text-amber-500 font-black">Ámbar (No inscrito en Equipo)</strong> han disputado minutos sin habilitación correspondiente. Esta información ha sido archivada para la revisión del <strong>Organizador del Circuito</strong> y del <strong>Administrador de la Liga</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Filtros de logs */}
              <div className="border border-border/40 dark:border-white/[0.06] bg-white/50 dark:bg-card/25 backdrop-blur-md p-4.5 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-left relative z-10">
                <span className="text-[10px] font-condensed font-black text-muted-foreground uppercase tracking-widest block">
                  🔍 FILTRAR REGISTROS DE INTEGRIDAD:
                </span>
                <div className="relative w-full sm:w-80">
                  <select
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="w-full h-11 pl-4 pr-10 text-xs bg-white dark:bg-background border border-border/60 dark:border-white/[0.08] rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer font-condensed font-black uppercase tracking-wider"
                  >
                    <option value="todos" className="bg-background text-foreground">🌎 Mostrar Todos ({stats_logs?.length || 0})</option>
                    <option value="ok" className="bg-background text-foreground">🟢 Inscritos Correctamente ({stats_logs?.filter(l => l.estado === 'ok').length || 0})</option>
                    <option value="no_inscrito_equipo" className="bg-background text-foreground">🟡 No Inscrito en Equipo ({stats_logs?.filter(l => l.estado === 'no_inscrito_equipo').length || 0})</option>
                    <option value="no_existe_sistema" className="bg-background text-foreground">🔴 No Inscrito en Sistema ({stats_logs?.filter(l => l.estado === 'no_existe_sistema').length || 0})</option>
                    <option value="sin_gamertag" className="bg-background text-foreground">🟠 Sin ID EA / Gamertag ({stats_logs?.filter(l => l.estado === 'sin_gamertag').length || 0})</option>
                    <option value="no_jugo" className="bg-background text-foreground">⚫ No Jugó ({stats_logs?.filter(l => l.estado === 'no_jugo').length || 0})</option>
                  </select>
                  <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-muted-foreground text-[10px]">
                    ▼
                  </div>
                </div>
              </div>

              {/* Listado / Tabla de Logs */}
              {!stats_logs || stats_logs.length === 0 ? (
                <div className="border border-border/50 bg-card/10 rounded-xl p-10 text-center text-muted-foreground space-y-2 relative z-10">
                  <span className="text-2xl">📋</span>
                  <p className="text-xs font-condensed font-black uppercase tracking-widest">No hay registros de logs cargados para este partido.</p>
                </div>
              ) : (
                <div className="border border-border/45 dark:border-white/[0.06] bg-white/50 dark:bg-card/25 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg relative z-10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/30 dark:border-white/[0.06] bg-muted/20 dark:bg-white/[0.02] text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest">
                          <th className="p-4.5 text-left">Jugador / Nickname</th>
                          <th className="p-4.5 text-left">Club</th>
                          <th className="p-4.5 text-center">Jugo</th>
                          <th className="p-4.5 text-center">Estado de Fichaje</th>
                          <th className="p-4.5 text-left">Detalle / Acción Recomendada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20 dark:divide-white/[0.04] text-xs">
                        {(() => {
                          if (paginatedLogs.length === 0) {
                            return (
                              <tr>
                                <td colSpan="5" className="p-8 text-center text-muted-foreground font-condensed font-black uppercase tracking-wider">
                                  No hay registros que coincidan con el filtro seleccionado.
                                </td>
                              </tr>
                            );
                          }

                          return paginatedLogs.map((log) => {
                            const userJ = log.jugador || {};
                            const eq = log.equipo || {};

                            let statusBadge = null;
                            let detailMsg = '';

                            if (log.estado === 'ok') {
                              statusBadge = <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black px-2.5 py-1 rounded font-mono uppercase tracking-wider">INSCRITO</span>;
                              detailMsg = 'Inscripción conforme y cruzada correctamente.';
                            } else if (log.estado === 'no_existe_sistema') {
                              statusBadge = <span className="bg-destructive/10 text-destructive border border-destructive/20 text-[9px] font-black px-2.5 py-1 rounded font-mono uppercase tracking-wider">NO EN SISTEMA</span>;
                              detailMsg = 'El Gamertag no corresponde a ningún usuario registrado en la liga.';
                            } else if (log.estado === 'no_inscrito_equipo') {
                              statusBadge = <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black px-2.5 py-1 rounded font-mono uppercase tracking-wider">NO EN ROSTER</span>;
                              detailMsg = 'El jugador está registrado en la liga, pero no pertenece a la plantilla de este club.';
                            } else if (log.estado === 'sin_gamertag') {
                              statusBadge = <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px] font-black px-2.5 py-1 rounded font-mono uppercase tracking-wider">SIN EA ID</span>;
                              detailMsg = 'Jugador inscrito en el club pero no tiene configurado su Gamertag / ID EA en su perfil.';
                            } else if (log.estado === 'no_jugo') {
                              statusBadge = <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[9px] font-black px-2.5 py-1 rounded font-mono uppercase tracking-wider">NO JUGÓ</span>;
                              detailMsg = 'Jugador inscrito en plantilla que permaneció en el banco.';
                            }

                            return (
                              <tr key={log.id} className="hover:bg-muted/5 dark:hover:bg-white/[0.01] transition-colors">
                                <td className="p-4.5 font-semibold text-left">
                                  <div className="flex items-center gap-3">
                                    {userJ.foto ? (
                                      <img 
                                        src={getImageUrl(userJ.foto)} 
                                        alt={userJ.name} 
                                        className="w-8 h-8 rounded-full object-cover border border-border/40 bg-background"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-muted/50 dark:bg-white/5 flex items-center justify-center border border-border/30 dark:border-white/[0.03] text-xs select-none">
                                        🏃
                                      </div>
                                    )}
                                    <div className="space-y-0.5">
                                      {userJ.name ? (
                                        <Link to={`/jugadores/${userJ.id}`} className="font-display font-black text-foreground hover:text-primary transition-colors uppercase tracking-wider">
                                          {userJ.name}
                                        </Link>
                                      ) : (
                                        <span className="text-foreground italic font-black uppercase">{log.playername || 'EA ID Desconocido'}</span>
                                      )}
                                      <span className="text-[10px] text-muted-foreground font-mono block tracking-wider">
                                        🎮 EA ID: {log.playername || userJ.gamertag || 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4.5 font-condensed font-black text-xs text-foreground uppercase tracking-wider text-left">
                                  {eq.nombre || 'N/A'}
                                </td>
                                <td className="p-4.5 text-center font-mono font-black">
                                  {log.jugo ? '✅ SÍ' : '❌ NO'}
                                </td>
                                <td className="p-4.5 text-center">
                                  {statusBadge}
                                </td>
                                <td className="p-4.5 text-muted-foreground font-semibold text-[11px] max-w-xs text-left leading-relaxed">
                                  {detailMsg}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                  {totalLogPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border/20 dark:border-white/[0.06] pt-4.5 px-4.5 bg-muted/10 dark:bg-white/[0.01] pb-4.5">
                      <span className="text-[10px] text-muted-foreground font-mono uppercase font-black">
                        PÁGINA {logPage} DE {totalLogPages}
                      </span>
                      <div className="flex gap-2">
                        <button
                          disabled={logPage === 1}
                          onClick={() => setLogPage(prev => Math.max(prev - 1, 1))}
                          className="px-4 py-2 rounded-xl bg-white/60 dark:bg-card border border-border/40 dark:border-white/[0.06] hover:bg-primary/20 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-condensed font-black tracking-widest uppercase transition-all duration-300 cursor-pointer"
                        >
                          ◀ Anterior
                        </button>
                        <button
                          disabled={logPage === totalLogPages}
                          onClick={() => setLogPage(prev => Math.min(prev + 1, totalLogPages))}
                          className="px-4 py-2 rounded-xl bg-white/60 dark:bg-card border border-border/40 dark:border-white/[0.06] hover:bg-primary/20 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-condensed font-black tracking-widest uppercase transition-all duration-300 cursor-pointer"
                        >
                          Siguiente ▶
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
