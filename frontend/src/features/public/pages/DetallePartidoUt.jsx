import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/api/axios';
import Badge from '@/components/ui/Badge';
import PageLoader from '@/components/ui/PageLoader';
import Button from '@/components/ui/Button';

export default function DetallePartidoUt() {
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
        const response = await api.get(`/partidos-ut/${id}`);
        setData(response.data);
      } catch (error) {
        console.error("Error al obtener detalles del partido UT:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPartido();
  }, [id]);

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
    if (typeof window.mediaUrl === 'function') {
      return window.mediaUrl(path);
    }
    const backendBaseUrl = api.defaults.baseURL?.replace(/\/api$/, '') ;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${backendBaseUrl}${cleanPath}`;
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!data || !data.partido) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center">
        <span className="text-4xl">⚽</span>
        <h2 className="text-xl font-display font-black text-foreground uppercase">Partido UT No Encontrado</h2>
        <Link to="/" className="text-xs text-primary font-bold uppercase hover:underline">Volver a Inicio</Link>
      </div>
    );
  }

  const { partido, stats_equipos = [], stats_jugadores = [], stats_logs = [] } = data;
  const local = partido.local || {};
  const visitante = partido.visitante || {};
  const competencia = partido.competencia || {};
  const finalizado = partido.goles_local !== null && partido.goles_visitante !== null;

  // Mapear estadísticas de equipo
  const localStats = stats_equipos.find(s => s.equipo_ut_id === local.id) || null;
  const visitanteStats = stats_equipos.find(s => s.equipo_ut_id === visitante.id) || null;

  // Filtrar jugadores por club
  const localJugadores = stats_jugadores.filter(sj => sj.equipo_ut_id === local.id);
  const visitanteJugadores = stats_jugadores.filter(sj => sj.equipo_ut_id === visitante.id);

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

      <div className="relative z-20 max-w-5xl mx-auto px-6 lg:px-10 space-y-10">
        
        {/* Cabecera / Marcador Principal de Élite */}
        <div className="border border-border/40 dark:border-white/[0.08] bg-white/90 dark:bg-card/45 backdrop-blur-md rounded-3xl pt-14 pb-8 px-6 md:pt-16 md:pb-10 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden animate-fade-in-up">
          <div className="absolute inset-0 hud-noise pointer-events-none opacity-40"></div>
          
          <div className="absolute top-0 inset-x-0 h-8 border-b border-border/10 dark:border-white/[0.04] bg-muted/20 dark:bg-white/[0.02] rounded-t-3xl flex items-center justify-between px-6 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
            <span>🎮 {competencia.nombre || 'PARTIDO UT'}</span>
            {partido.jornada && <span>Jornada {partido.jornada}</span>}
            {partido.grupo && <span>Grupo {partido.grupo}</span>}
          </div>

          {/* Club Local */}
          <div className="flex flex-col items-center gap-4 text-center md:w-1/3 z-10">
            {local.logo && local.logo !== 'default.png' ? (
              <div className="relative p-1.5 rounded-3xl bg-slate-900/5 dark:bg-white/[0.02] border border-border/60 dark:border-white/[0.06] shadow-md">
                <img 
                  src={getImageUrl(local.logo)} 
                  alt={local.nombre} 
                  className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-tr from-primary to-destructive flex items-center justify-center font-display font-black text-primary-foreground text-4xl shadow-xl uppercase">
                {local.nombre?.slice(0, 3)}
              </div>
            )}
            <div className="space-y-1">
              <h3 className="font-display font-black text-xl md:text-2xl text-foreground uppercase tracking-wider leading-tight">
                {local.nombre}
              </h3>
              <span className="inline-block text-[9px] text-muted-foreground font-mono font-black uppercase bg-muted/60 dark:bg-white/5 px-2.5 py-0.5 rounded border border-border/40 dark:border-white/[0.05] tracking-widest">
                LOCAL
              </span>
            </div>
          </div>

          {/* Marcador Central */}
          <div className="flex flex-col items-center justify-center text-center md:w-1/3 z-10">
            <div className="flex items-center justify-center gap-4">
              <div className="relative group/score">
                <div className="w-16 h-18 md:w-20 md:h-22 bg-black/[0.03] dark:bg-black/30 border border-border/80 dark:border-white/[0.08] rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden backdrop-blur-sm">
                  <span className="text-4xl md:text-5xl font-display font-black text-primary tracking-tighter shimmer-text">
                    {finalizado ? partido.goles_local : '—'}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono font-bold text-muted-foreground/45 uppercase tracking-widest">VS</span>
                <div className="w-1 h-8 bg-gradient-to-b from-primary/30 to-destructive/30 rounded-full"></div>
              </div>

              <div className="relative group/score">
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
            {visitante.logo && visitante.logo !== 'default.png' ? (
              <div className="relative p-1.5 rounded-3xl bg-slate-900/5 dark:bg-white/[0.02] border border-border/60 dark:border-white/[0.06] shadow-md">
                <img 
                  src={getImageUrl(visitante.logo)} 
                  alt={visitante.nombre} 
                  className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-tr from-primary to-destructive flex items-center justify-center font-display font-black text-primary-foreground text-4xl shadow-xl uppercase">
                {visitante.nombre?.slice(0, 3)}
              </div>
            )}
            <div className="space-y-1">
              <h3 className="font-display font-black text-xl md:text-2xl text-foreground uppercase tracking-wider leading-tight">
                {visitante.nombre}
              </h3>
              <span className="inline-block text-[9px] text-muted-foreground font-mono font-black uppercase bg-muted/60 dark:bg-white/5 px-2.5 py-0.5 rounded border border-border/40 dark:border-white/[0.05] tracking-widest">
                VISITANTE
              </span>
            </div>
          </div>

        </div>

        {/* Tabulación */}
        <div className="flex border-b border-border/20 dark:border-white/[0.06] overflow-x-auto gap-2 custom-scrollbar">
          {[
            { id: 'club_stats', label: 'Estadísticas del Club' },
            { id: 'roster_stats', label: 'Rendimiento Individual' },
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

        {/* Contenidos */}
        <div className="min-h-96 relative z-10">
          
          {/* TAB 1: Estadísticas de Equipo */}
          {activeTab === 'club_stats' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-display font-black uppercase tracking-wider text-foreground">
                  Comparativa de Rendimiento UT
                </h2>
                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">Métricas oficiales de equipo agregadas del partido</p>
              </div>
              
              {localStats && visitanteStats ? (
                <div className="border border-border/40 dark:border-white/[0.06] bg-white/70 dark:bg-card/25 backdrop-blur-md rounded-3xl p-6 md:p-10 space-y-8 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 hud-noise pointer-events-none opacity-30"></div>
                  
                  <div className="space-y-6 relative z-10">
                    {[
                      { label: 'Goles favor', localVal: localStats.goles_favor, visitVal: visitanteStats.goles_favor },
                      { label: 'Tiros al arco', localVal: localStats.tiros, visitVal: visitanteStats.tiros },
                      { label: 'Pases completados', localVal: localStats.pases_completados, visitVal: visitanteStats.pases_completados },
                      { label: 'Pases intentados', localVal: localStats.pases_intentados, visitVal: visitanteStats.pases_intentados },
                      { label: 'Precisión de pases', localVal: localStats.precision_pases, visitVal: visitanteStats.precision_pases, percent: true },
                      { label: 'Tackles Exitosos', localVal: localStats.entradas_exitosas, visitVal: visitanteStats.entradas_exitosas },
                      { label: 'Tarjetas Rojas', localVal: localStats.tarjetas_rojas, visitVal: visitanteStats.tarjetas_rojas, alert: true },
                      { label: 'Valoración Agregada', localVal: localStats.valoracion_agregada, visitVal: visitanteStats.valoracion_agregada },
                    ].map((item, idx) => {
                      const localValNum = Number(item.localVal);
                      const visitValNum = Number(item.visitVal);
                      const total = localValNum + visitValNum;
                      const localPercent = total > 0 ? (localValNum / total) * 100 : 50;
                      const visitPercent = total > 0 ? (visitValNum / total) * 100 : 50;

                      return (
                        <div key={idx} className="flex items-center justify-between gap-4 py-1.5 border-b border-border/10 dark:border-white/[0.02] last:border-b-0 px-2 rounded-xl">
                          <div className="w-16 md:w-20 text-left shrink-0">
                            <span className={`text-2xl md:text-3xl font-display font-black tracking-wide ${localValNum > visitValNum ? 'text-primary' : 'text-muted-foreground/75'}`}>
                              {item.localVal}{item.percent ? '%' : ''}
                            </span>
                          </div>

                          <div className="flex-1 flex items-center justify-center gap-3 md:gap-5 min-w-0">
                            <div className="flex-1 h-2 bg-muted dark:bg-white/5 rounded-full overflow-hidden relative">
                              <div className="absolute right-0 top-0 bottom-0 bg-primary rounded-full" style={{ width: `${localPercent}%` }}></div>
                            </div>

                            <span className="text-[9px] md:text-[10px] font-condensed font-black tracking-widest text-foreground dark:text-muted-foreground uppercase text-center min-w-[110px] md:min-w-[150px] shrink-0 truncate">
                              {item.label}
                            </span>

                            <div className="flex-1 h-2 bg-muted dark:bg-white/5 rounded-full overflow-hidden relative">
                              <div className="absolute left-0 top-0 bottom-0 bg-destructive rounded-full" style={{ width: `${visitPercent}%` }}></div>
                            </div>
                          </div>

                          <div className="w-16 md:w-20 text-right shrink-0">
                            <span className={`text-2xl md:text-3xl font-display font-black tracking-wide ${visitValNum > localValNum ? 'text-destructive' : 'text-muted-foreground/75'}`}>
                              {item.visitVal}{item.percent ? '%' : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="border border-border/50 dark:border-white/[0.06] bg-white/40 dark:bg-card/10 rounded-2xl p-16 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <span className="text-3xl">🤖</span>
                  <p className="text-xs font-condensed font-black uppercase tracking-widest">Estadísticas comparativas del partido no disponibles.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Estadísticas Individuales */}
          {activeTab === 'roster_stats' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-display font-black uppercase tracking-wider text-foreground">
                  Ficha de Rendimiento Individual
                </h2>
                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">Desempeño en juego de los capitanes y compañeros</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* Local */}
                <div className="space-y-4">
                  <h3 className="text-lg font-display font-black uppercase text-primary tracking-wider flex items-center gap-3 border-b border-primary/20 pb-2">
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
                            className={`border transition-all duration-300 cursor-pointer overflow-hidden rounded-2xl p-3.5 flex flex-col gap-2.5 relative select-none shadow-md ${
                              isExpanded ? 'border-primary bg-primary/5' : 'border-border/40 dark:border-white/[0.05] bg-card/45'
                            }`}
                            onClick={() => setExpandedPlayer(isExpanded ? null : sj.id)}
                          >
                            <div className="flex items-center justify-between gap-3 relative z-10">
                              <div className="flex items-center gap-3 min-w-0">
                                {userJ.foto ? (
                                  <img 
                                    src={getImageUrl(userJ.foto)} 
                                    alt={userJ.name} 
                                    className="w-8 h-8 rounded-full object-cover border border-border bg-background shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs shrink-0 select-none">
                                    👤
                                  </div>
                                )}
                                <span className="font-display font-black text-sm text-foreground truncate uppercase tracking-wide">
                                  {userJ.name}
                                </span>
                                <span className="text-[8px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground uppercase">{sj.posicion}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 shrink-0">
                                {sj.goles > 0 && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded">⚽ {sj.goles}</span>}
                                {sj.asistencias > 0 && <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold px-2 py-0.5 rounded">🎯 {sj.asistencias}</span>}
                                <span className="text-xs bg-primary/10 text-primary border border-primary/20 font-mono font-black px-2 py-0.5 rounded">
                                  ⭐ {Number(sj.valoracion).toFixed(1)}
                                </span>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="mt-1 p-3 border-t border-border/20 bg-background/20 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in text-left">
                                <div className="bg-background/50 p-2 rounded-lg border border-border/20 space-y-0.5">
                                  <span className="text-[8px] text-muted-foreground uppercase tracking-widest block">Valoración</span>
                                  <strong className="text-xs text-primary font-mono block">⭐ {Number(sj.valoracion).toFixed(1)}</strong>
                                </div>
                                <div className="bg-background/50 p-2 rounded-lg border border-border/20 space-y-0.5">
                                  <span className="text-[8px] text-muted-foreground uppercase tracking-widest block">Goles / Asist</span>
                                  <strong className="text-xs text-foreground font-mono block">⚽ {sj.goles} / 🎯 {sj.asistencias}</strong>
                                </div>
                                <div className="bg-background/50 p-2 rounded-lg border border-border/20 space-y-0.5">
                                  <span className="text-[8px] text-muted-foreground uppercase tracking-widest block">Pases C./I.</span>
                                  <strong className="text-xs text-foreground font-mono block">{sj.pases_completados}/{sj.pases_intentados} ({Math.round(sj.precision_pases)}%)</strong>
                                </div>
                                <div className="bg-background/50 p-2 rounded-lg border border-border/20 space-y-0.5">
                                  <span className="text-[8px] text-muted-foreground uppercase tracking-widest block">Entradas / Tasa</span>
                                  <strong className="text-xs text-foreground font-mono block">🛡️ {sj.entradas_exitosas} ({Math.round(sj.tasa_exito_entradas)}%)</strong>
                                </div>
                                <div className="bg-background/50 p-2 rounded-lg border border-border/20 space-y-0.5">
                                  <span className="text-[8px] text-muted-foreground uppercase tracking-widest block">Tarjetas</span>
                                  <strong className="text-xs text-foreground font-mono block">🟨 {sj.tarjetas_amarillas || 0} / 🟥 {sj.tarjetas_rojas || 0}</strong>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No hay registros individuales para este participante local.</p>
                  )}
                </div>

                {/* Visitante */}
                <div className="space-y-4">
                  <h3 className="text-lg font-display font-black uppercase text-destructive tracking-wider flex items-center gap-3 border-b border-destructive/20 pb-2">
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
                            className={`border transition-all duration-300 cursor-pointer overflow-hidden rounded-2xl p-3.5 flex flex-col gap-2.5 relative select-none shadow-md ${
                              isExpanded ? 'border-destructive bg-destructive/5' : 'border-border/40 dark:border-white/[0.05] bg-card/45'
                            }`}
                            onClick={() => setExpandedPlayer(isExpanded ? null : sj.id)}
                          >
                            <div className="flex items-center justify-between gap-3 relative z-10">
                              <div className="flex items-center gap-3 min-w-0">
                                {userJ.foto ? (
                                  <img 
                                    src={getImageUrl(userJ.foto)} 
                                    alt={userJ.name} 
                                    className="w-8 h-8 rounded-full object-cover border border-border bg-background shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs shrink-0 select-none">
                                    👤
                                  </div>
                                )}
                                <span className="font-display font-black text-sm text-foreground truncate uppercase tracking-wide">
                                  {userJ.name}
                                </span>
                                <span className="text-[8px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground uppercase">{sj.posicion}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 shrink-0">
                                {sj.goles > 0 && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded">⚽ {sj.goles}</span>}
                                {sj.asistencias > 0 && <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold px-2 py-0.5 rounded">🎯 {sj.asistencias}</span>}
                                <span className="text-xs bg-destructive/10 text-destructive border border-destructive/20 font-mono font-black px-2 py-0.5 rounded">
                                  ⭐ {Number(sj.valoracion).toFixed(1)}
                                </span>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="mt-1 p-3 border-t border-border/20 bg-background/20 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in text-left">
                                <div className="bg-background/50 p-2 rounded-lg border border-border/20 space-y-0.5">
                                  <span className="text-[8px] text-muted-foreground uppercase tracking-widest block">Valoración</span>
                                  <strong className="text-xs text-destructive font-mono block">⭐ {Number(sj.valoracion).toFixed(1)}</strong>
                                </div>
                                <div className="bg-background/50 p-2 rounded-lg border border-border/20 space-y-0.5">
                                  <span className="text-[8px] text-muted-foreground uppercase tracking-widest block">Goles / Asist</span>
                                  <strong className="text-xs text-foreground font-mono block">⚽ {sj.goles} / 🎯 {sj.asistencias}</strong>
                                </div>
                                <div className="bg-background/50 p-2 rounded-lg border border-border/20 space-y-0.5">
                                  <span className="text-[8px] text-muted-foreground uppercase tracking-widest block">Pases C./I.</span>
                                  <strong className="text-xs text-foreground font-mono block">{sj.pases_completados}/{sj.pases_intentados} ({Math.round(sj.precision_pases)}%)</strong>
                                </div>
                                <div className="bg-background/50 p-2 rounded-lg border border-border/20 space-y-0.5">
                                  <span className="text-[8px] text-muted-foreground uppercase tracking-widest block">Entradas / Tasa</span>
                                  <strong className="text-xs text-foreground font-mono block">🛡️ {sj.entradas_exitosas} ({Math.round(sj.tasa_exito_entradas)}%)</strong>
                                </div>
                                <div className="bg-background/50 p-2 rounded-lg border border-border/20 space-y-0.5">
                                  <span className="text-[8px] text-muted-foreground uppercase tracking-widest block">Tarjetas</span>
                                  <strong className="text-xs text-foreground font-mono block">🟨 {sj.tarjetas_amarillas || 0} / 🟥 {sj.tarjetas_rojas || 0}</strong>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No hay registros individuales para este participante visitante.</p>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: Log del Reporte */}
          {activeTab === 'log_reporte' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/20 dark:border-white/[0.06] pb-4">
                <div>
                  <h2 className="text-xl font-display font-black uppercase tracking-wider text-foreground">
                    Logs de Sincronización EA API
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">Historial de validación de Gamertags para el una vez inicial</p>
                </div>
                
                <div className="flex gap-2">
                  {['todos', 'aprobado', 'pendiente', 'ignorado'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setLogFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border cursor-pointer ${
                        logFilter === f
                          ? 'bg-primary/20 text-primary border-primary/40 shadow-inner'
                          : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {paginatedLogs.length > 0 ? (
                <div className="space-y-3">
                  <div className="border border-border/40 dark:border-white/[0.06] bg-white/70 dark:bg-card/25 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border/50 text-[9px] uppercase font-mono font-bold text-muted-foreground tracking-widest">
                          <th className="px-5 py-3">Gamertag Detectado</th>
                          <th className="px-5 py-3">Usuario Asignado</th>
                          <th className="px-5 py-3">Club</th>
                          <th className="px-5 py-3 text-center">Estado</th>
                          <th className="px-5 py-3 text-right">Fecha Registro</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20 text-foreground font-semibold">
                        {paginatedLogs.map((log) => {
                          const userJ = log.jugador || {};
                          const eq = log.equipo || {};
                          return (
                            <tr key={log.id} className="hover:bg-primary/5 transition-colors">
                              <td className="px-5 py-3.5 font-mono text-primary font-bold">{log.playername}</td>
                              <td className="px-5 py-3.5">
                                {userJ.id ? (
                                  <Link to={`/jugadores/${userJ.id}`} className="hover:underline text-foreground">
                                    {userJ.name} ({userJ.gamertag || 'Sin Gamertag'})
                                  </Link>
                                ) : (
                                  <span className="text-muted-foreground font-bold italic">No identificado</span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 uppercase">{eq.nombre || 'TBD'}</td>
                              <td className="px-5 py-3.5 text-center">
                                <Badge 
                                  variant={
                                    log.estado === 'aprobado' ? 'success' :
                                    log.estado === 'pendiente' ? 'brand' : 'error'
                                  }
                                  className="uppercase text-[8px]"
                                >
                                  {log.estado}
                                </Badge>
                              </td>
                              <td className="px-5 py-3.5 text-right font-mono text-[10px] text-muted-foreground">
                                {new Date(log.created_at).toLocaleString('es-CL')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginador */}
                  {totalLogPages > 1 && (
                    <div className="flex items-center justify-between max-w-xs mx-auto border border-border/40 bg-card/25 p-2 rounded-xl">
                      <Button
                        size="sm"
                        disabled={logPage === 1}
                        onClick={() => setLogPage(prev => prev - 1)}
                        className="h-8 px-3 text-[10px]"
                      >
                        ◀ Ant
                      </Button>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">
                        Pág {logPage} de {totalLogPages}
                      </span>
                      <Button
                        size="sm"
                        disabled={logPage === totalLogPages}
                        onClick={() => setLogPage(prev => prev + 1)}
                        className="h-8 px-3 text-[10px]"
                      >
                        Sig ▶
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-border/40 dark:border-white/[0.06] bg-white/40 dark:bg-card/10 rounded-2xl p-16 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <span className="text-2xl">📝</span>
                  <p className="text-xs font-condensed font-black uppercase tracking-widest">No hay logs de reporte EA que coincidan con este filtro.</p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
