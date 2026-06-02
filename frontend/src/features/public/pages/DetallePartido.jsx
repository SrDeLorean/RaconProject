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

  return (
    <div className="relative min-h-screen bg-background pt-28 pb-16 overflow-hidden">
      {/* Fondo Inmersivo */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1920&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background z-10"></div>
      </div>

      <div className="relative z-20 max-w-5xl mx-auto px-6 lg:px-10 space-y-8">
        
        {/* Cabecera / Marcador Principal de Élite */}
        <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative animate-fade-in-up">
          
          {/* Club Local */}
          <div className="flex flex-col items-center gap-3 text-center md:w-1/3">
            <Link to={`/equipos/${local.id}`} className="group relative">
              {local.logo ? (
                <img 
                  src={getImageUrl(local.logo)} 
                  alt={local.nombre} 
                  className="w-20 h-20 md:w-28 md:h-28 rounded-2xl object-cover border-2 border-border/60 group-hover:border-primary/60 transition-all shadow-xl"
                />
              ) : (
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-gradient-to-tr from-primary to-destructive flex items-center justify-center font-display font-black text-primary-foreground text-3xl shadow-xl uppercase">
                  {local.abreviatura || local.nombre?.charAt(0)}
                </div>
              )}
            </Link>
            <div className="space-y-1">
              <h3 className="font-display font-black text-lg md:text-xl text-foreground uppercase tracking-wide leading-tight">
                {local.nombre}
              </h3>
              <span className="text-[10px] text-muted-foreground font-mono font-black uppercase bg-muted/60 px-2 py-0.5 rounded border border-border/40">
                {local.abreviatura || 'LOC'}
              </span>
            </div>
          </div>

          {/* Marcador Central */}
          <div className="flex flex-col items-center justify-center text-center md:w-1/3 space-y-3">
            <Badge variant="primary" className="text-[10px] font-mono tracking-widest px-3 py-1 rounded-full uppercase bg-primary/10 border-primary/20 text-primary animate-pulse-glow">
              {competencia.nombre || 'Partido Oficial'}
            </Badge>

            <div className="flex items-center justify-center gap-6">
              <span className="text-5xl md:text-6xl font-display font-black text-foreground">
                {finalizado ? partido.goles_local : '—'}
              </span>
              <span className="text-xl font-bold text-muted-foreground font-mono">:</span>
              <span className="text-5xl md:text-6xl font-display font-black text-foreground">
                {finalizado ? partido.goles_visitante : '—'}
              </span>
            </div>

            <span className={`text-[10px] font-black tracking-widest font-mono uppercase px-3 py-1 rounded-lg ${
              finalizado ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {finalizado ? '⚽ FINALIZADO' : '📅 PENDIENTE'}
            </span>

            <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">
              🕒 {partido.fecha ? `${partido.fecha} ${partido.hora || ''}` : 'Sin programar'}
            </span>
          </div>

          {/* Club Visitante */}
          <div className="flex flex-col items-center gap-3 text-center md:w-1/3">
            <Link to={`/equipos/${visitante.id}`} className="group relative">
              {visitante.logo ? (
                <img 
                  src={getImageUrl(visitante.logo)} 
                  alt={visitante.nombre} 
                  className="w-20 h-20 md:w-28 md:h-28 rounded-2xl object-cover border-2 border-border/60 group-hover:border-primary/60 transition-all shadow-xl"
                />
              ) : (
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-gradient-to-tr from-primary to-destructive flex items-center justify-center font-display font-black text-primary-foreground text-3xl shadow-xl uppercase">
                  {visitante.abreviatura || visitante.nombre?.charAt(0)}
                </div>
              )}
            </Link>
            <div className="space-y-1">
              <h3 className="font-display font-black text-lg md:text-xl text-foreground uppercase tracking-wide leading-tight">
                {visitante.nombre}
              </h3>
              <span className="text-[10px] text-muted-foreground font-mono font-black uppercase bg-muted/60 px-2 py-0.5 rounded border border-border/40">
                {visitante.abreviatura || 'VIS'}
              </span>
            </div>
          </div>

        </div>

        {/* Tabulación de Secciones de Estadísticas */}
        <div className="flex border-b border-border/30 overflow-x-auto gap-2 custom-scrollbar animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {[
            { id: 'club_stats', label: 'Estadísticas del Club' },
            { id: 'roster_stats', label: 'Alineaciones y Rendimiento' },
            { id: 'log_reporte', label: 'Log del Reporte EA' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-xs font-black tracking-widest uppercase border-b-2 transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenidos Dinámicos */}
        <div className="min-h-96">
          {/* TAB 1: Estadísticas de Equipo */}
          {activeTab === 'club_stats' && (
            <div className="space-y-6">
              <h2 className="text-xl font-display font-black uppercase tracking-wider text-foreground">
                Comparativa Táctica
              </h2>
              
              {localStats && visitanteStats ? (
                <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-xl p-6 space-y-6 shadow-md">
                  {[
                    { label: 'Goles convertidos', localVal: localStats.goles_favor, visitVal: visitanteStats.goles_favor },
                    { label: 'Tiros al arco', localVal: localStats.tiros, visitVal: visitanteStats.tiros },
                    { label: 'Pases completados', localVal: localStats.pases_completados, visitVal: visitanteStats.pases_completados },
                    { label: 'Pases intentados', localVal: localStats.pases_intentados, visitVal: visitanteStats.pases_intentados },
                    { label: 'Precisión de pases (%)', localVal: localStats.precision_pases, visitVal: visitanteStats.precision_pases, percent: true },
                    { label: 'Tackles Exitosos', localVal: localStats.entradas_exitosas, visitVal: visitanteStats.entradas_exitosas },
                    { label: 'Tarjetas Rojas', localVal: localStats.tarjetas_rojas, visitVal: visitanteStats.tarjetas_rojas, alert: true },
                    { label: 'Atajadas de Arquero', localVal: localStats.atajadas, visitVal: visitanteStats.atajadas },
                  ].map((item, idx) => {
                    const total = Number(item.localVal) + Number(item.visitVal);
                    const localPercent = total > 0 ? (Number(item.localVal) / total) * 100 : 50;
                    const visitPercent = total > 0 ? (Number(item.visitVal) / total) * 100 : 50;

                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="w-16 text-left font-mono font-black text-primary">{item.localVal}{item.percent ? '%' : ''}</span>
                          <span className="text-muted-foreground uppercase tracking-tight text-center flex-1">{item.label}</span>
                          <span className="w-16 text-right font-mono font-black text-destructive">{item.visitVal}{item.percent ? '%' : ''}</span>
                        </div>
                        {/* Barra de progreso comparativa side-by-side */}
                        <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                          <div 
                            className="bg-primary h-full border-r border-background animate-fill-bar"
                            style={{ width: `${localPercent}%`, animationDelay: `${idx * 0.08}s` }}>
                          </div>
                          <div 
                            className="bg-destructive h-full animate-fill-bar"
                            style={{ width: `${visitPercent}%`, animationDelay: `${idx * 0.08}s` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-border/50 bg-card/10 rounded-xl p-10 text-center text-muted-foreground space-y-2">
                  <span className="text-2xl">🤖</span>
                  <p className="text-sm font-semibold">Estadísticas automáticas de FC26 no reportadas aún para este partido.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Alineaciones y Estadísticas Individuales */}
          {activeTab === 'roster_stats' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="primary" className="text-[10px] font-mono tracking-wide px-2 py-0.5 rounded uppercase bg-primary/10 border-primary/20 text-primary">
                  💡 PISTA TÁCTICA
                </Badge>
                <span className="text-[10px] text-muted-foreground">Haz clic en la fila de cualquier jugador para expandir su ficha estadística completa de FC26.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Local Roster */}
                <div className="space-y-4">
                  <h3 className="text-lg font-display font-black uppercase text-primary tracking-wide flex items-center gap-2">
                    {local.logo ? (
                      <img src={getImageUrl(local.logo)} alt={local.nombre} className="w-6 h-6 rounded-md object-cover border border-border/40" />
                    ) : (
                      <span>🛡️</span>
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
                            className="border border-border/40 bg-card/25 backdrop-blur-sm rounded-xl p-3 flex flex-col gap-1 shadow-sm hover:border-primary/40 transition-all cursor-pointer"
                            onClick={() => setExpandedPlayer(isExpanded ? null : sj.id)}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <Link 
                                  to={`/jugadores/${userJ.id}`} 
                                  className="font-bold text-sm text-foreground hover:text-primary transition-colors truncate"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  🏃 {userJ.name}
                                </Link>
                                <span className="text-[9px] bg-muted/60 px-1.5 py-0.5 rounded font-mono font-bold text-muted-foreground uppercase">{sj.posicion}</span>
                              </div>
                              
                              <div className="flex items-center gap-3 shrink-0">
                                {sj.goles > 0 && (
                                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black px-1.5 py-0.5 rounded font-mono">
                                    ⚽ {sj.goles}
                                  </span>
                                )}
                                {sj.asistencias > 0 && (
                                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black px-1.5 py-0.5 rounded font-mono">
                                    🎯 {sj.asistencias}
                                  </span>
                                )}
                                <span className="text-xs bg-primary/10 text-primary border border-primary/20 font-mono font-black px-2 py-0.5 rounded flex items-center gap-1">
                                  ⭐ {Number(sj.valoracion).toFixed(1)}
                                  <span className="text-[8px] opacity-80">{isExpanded ? '▲' : '▼'}</span>
                                </span>
                              </div>
                            </div>

                            {/* Ficha Estadística Expandida */}
                            {isExpanded && (
                              <div className="mt-3 p-3 border-t border-border/20 bg-background/30 rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in text-left">
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Valoración</span>
                                  <strong className="text-xs font-mono font-black text-primary block">⭐ {Number(sj.valoracion).toFixed(1)}</strong>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Goles / Asist.</span>
                                  <strong className="text-xs font-mono font-black text-foreground block">⚽ {sj.goles || 0} / 🎯 {sj.asistencias || 0}</strong>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Pases C./I.</span>
                                  <strong className="text-xs font-mono font-black text-foreground block">
                                    {sj.pases_completados || 0} / {sj.pases_intentados || 0} ({Math.round(sj.precision_pases || 0)}%)
                                  </strong>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Quites / Éxito</span>
                                  <strong className="text-xs font-mono font-black text-foreground block">
                                    🛡️ {sj.entradas_exitosas || 0} ({Math.round(sj.tasa_exito_entradas || 0)}%)
                                  </strong>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Tiro Precisión</span>
                                  <strong className="text-xs font-mono font-black text-foreground block">🎯 {Math.round(sj.precision_tiro || 0)}%</strong>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Tarjetas</span>
                                  <strong className="text-xs font-mono font-black text-foreground block">🟨 {sj.tarjetas_amarillas || 0} / 🟥 {sj.tarjetas_rojas || 0}</strong>
                                </div>
                                {sj.atajadas > 0 && (
                                  <div className="space-y-0.5">
                                    <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Atajadas GK</span>
                                    <strong className="text-xs font-mono font-black text-foreground block">🧤 {sj.atajadas}</strong>
                                  </div>
                                )}
                                {sj.goles_recibidos > 0 && (
                                  <div className="space-y-0.5">
                                    <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Encajados GK</span>
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
                    <p className="text-xs text-muted-foreground">Alineación no disponible.</p>
                  )}
                </div>

                {/* Visitante Roster */}
                <div className="space-y-4">
                  <h3 className="text-lg font-display font-black uppercase text-destructive tracking-wide flex items-center gap-2">
                    {visitante.logo ? (
                      <img src={getImageUrl(visitante.logo)} alt={visitante.nombre} className="w-6 h-6 rounded-md object-cover border border-border/40" />
                    ) : (
                      <span>⚔️</span>
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
                            className="border border-border/40 bg-card/25 backdrop-blur-sm rounded-xl p-3 flex flex-col gap-1 shadow-sm hover:border-destructive/40 transition-all cursor-pointer"
                            onClick={() => setExpandedPlayer(isExpanded ? null : sj.id)}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <Link 
                                  to={`/jugadores/${userJ.id}`} 
                                  className="font-bold text-sm text-foreground hover:text-destructive transition-colors truncate"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  🏃 {userJ.name}
                                </Link>
                                <span className="text-[9px] bg-muted/60 px-1.5 py-0.5 rounded font-mono font-bold text-muted-foreground uppercase">{sj.posicion}</span>
                              </div>
                              
                              <div className="flex items-center gap-3 shrink-0">
                                {sj.goles > 0 && (
                                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black px-1.5 py-0.5 rounded font-mono">
                                    ⚽ {sj.goles}
                                  </span>
                                )}
                                {sj.asistencias > 0 && (
                                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black px-1.5 py-0.5 rounded font-mono">
                                    🎯 {sj.asistencias}
                                  </span>
                                )}
                                <span className="text-xs bg-destructive/10 text-destructive border border-destructive/20 font-mono font-black px-2 py-0.5 rounded flex items-center gap-1">
                                  ⭐ {Number(sj.valoracion).toFixed(1)}
                                  <span className="text-[8px] opacity-80">{isExpanded ? '▲' : '▼'}</span>
                                </span>
                              </div>
                            </div>

                            {/* Ficha Estadística Expandida */}
                            {isExpanded && (
                              <div className="mt-3 p-3 border-t border-border/20 bg-background/30 rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in text-left">
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Valoración</span>
                                  <strong className="text-xs font-mono font-black text-destructive block">⭐ {Number(sj.valoracion).toFixed(1)}</strong>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Goles / Asist.</span>
                                  <strong className="text-xs font-mono font-black text-foreground block">⚽ {sj.goles || 0} / 🎯 {sj.asistencias || 0}</strong>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Pases C./I.</span>
                                  <strong className="text-xs font-mono font-black text-foreground block">
                                    {sj.pases_completados || 0} / {sj.pases_intentados || 0} ({Math.round(sj.precision_pases || 0)}%)
                                  </strong>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Quites / Éxito</span>
                                  <strong className="text-xs font-mono font-black text-foreground block">
                                    🛡️ {sj.entradas_exitosas || 0} ({Math.round(sj.tasa_exito_entradas || 0)}%)
                                  </strong>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Tiro Precisión</span>
                                  <strong className="text-xs font-mono font-black text-foreground block">🎯 {Math.round(sj.precision_tiro || 0)}%</strong>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Tarjetas</span>
                                  <strong className="text-xs font-mono font-black text-foreground block">🟨 {sj.tarjetas_amarillas || 0} / 🟥 {sj.tarjetas_rojas || 0}</strong>
                                </div>
                                {sj.atajadas > 0 && (
                                  <div className="space-y-0.5">
                                    <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Atajadas GK</span>
                                    <strong className="text-xs font-mono font-black text-foreground block">🧤 {sj.atajadas}</strong>
                                  </div>
                                )}
                                {sj.goles_recibidos > 0 && (
                                  <div className="space-y-0.5">
                                    <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Encajados GK</span>
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
                    <p className="text-xs text-muted-foreground">Alineación no disponible.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Log del Reporte e Integridad de Roster */}
          {activeTab === 'log_reporte' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/20 pb-3">
                <div className="text-left">
                  <h2 className="text-xl font-display font-black uppercase tracking-wider text-foreground">
                    Log de Reporte EA API
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Validación de consistencia y cruce automatizado de plantillas de juego
                  </p>
                </div>
                {/* Indicador general de Roster Compliance */}
                {stats_logs && stats_logs.some(l => l.estado === 'no_existe_sistema' || l.estado === 'no_inscrito_equipo') ? (
                  <Badge variant="destructive" className="px-3 py-1 text-[9px] tracking-widest font-black uppercase border-destructive/30 bg-destructive/10 animate-pulse-glow">
                    ⚠️ INFRACCIONES DETECTADAS
                  </Badge>
                ) : (
                  <Badge variant="primary" className="px-3 py-1 text-[9px] tracking-widest font-black uppercase border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    ✅ ROSTERS EN REGLA (100%)
                  </Badge>
                )}
              </div>

              {/* Alerta de Oversight */}
              {stats_logs && stats_logs.some(l => l.estado === 'no_existe_sistema' || l.estado === 'no_inscrito_equipo') && (
                <div className="border border-destructive/20 bg-destructive/5 rounded-2xl p-5 flex items-start gap-4 shadow-md text-left animate-fade-in">
                  <span className="text-3xl shrink-0">⚠️</span>
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-black text-destructive uppercase block tracking-widest">
                      ALERTA AUTOMÁTICA DE CUMPLIMIENTO (AUDITORÍA DE ROSTER)
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Se han identificado discrepancias críticas entre los datos del partido de EA y los registros de la liga. Los jugadores marcados en <strong className="text-destructive font-bold">Rojo (No en Sistema)</strong> o <strong className="text-amber-500 font-bold">Ámbar (No inscrito en Equipo)</strong> han disputado minutos sin habilitación correspondiente. Esta información ha sido archivada para la revisión del <strong>Organizador del Circuito</strong> y del <strong>Administrador de la Liga</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Filtros de logs */}
              <div className="border border-border/50 bg-card/25 backdrop-blur-md p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                <span className="text-xs font-mono font-black text-muted-foreground uppercase tracking-widest block">
                  🔍 FILTRAR REGISTROS DE INTEGRIDAD:
                </span>
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="w-full sm:w-72 h-10 px-3 text-xs bg-muted/30 border border-border/60 rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer font-bold uppercase"
                >
                  <option value="todos">🌎 Mostrar Todos ({stats_logs?.length || 0})</option>
                  <option value="ok">🟢 Inscritos Correctamente ({stats_logs?.filter(l => l.estado === 'ok').length || 0})</option>
                  <option value="no_inscrito_equipo">🟡 No Inscrito en Equipo ({stats_logs?.filter(l => l.estado === 'no_inscrito_equipo').length || 0})</option>
                  <option value="no_existe_sistema">🔴 No Inscrito en Sistema ({stats_logs?.filter(l => l.estado === 'no_existe_sistema').length || 0})</option>
                  <option value="sin_gamertag">🟠 Sin ID EA / Gamertag ({stats_logs?.filter(l => l.estado === 'sin_gamertag').length || 0})</option>
                  <option value="no_jugo">⚫ No Jugó ({stats_logs?.filter(l => l.estado === 'no_jugo').length || 0})</option>
                </select>
              </div>

              {/* Listado / Tabla de Logs */}
              {!stats_logs || stats_logs.length === 0 ? (
                <div className="border border-border/50 bg-card/10 rounded-xl p-10 text-center text-muted-foreground space-y-2">
                  <span className="text-2xl">📋</span>
                  <p className="text-sm font-semibold">No hay registros de logs cargados para este partido.</p>
                </div>
              ) : (
                <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/30 bg-muted/20 text-[10px] font-mono font-black text-muted-foreground uppercase tracking-wider">
                          <th className="p-4">Jugador / Nickname</th>
                          <th className="p-4">Club</th>
                          <th className="p-4 text-center">Jugo</th>
                          <th className="p-4 text-center">Estado de Fichaje</th>
                          <th className="p-4">Detalle / Acción Recomendada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30 text-xs">
                        {(() => {
                          if (paginatedLogs.length === 0) {
                            return (
                              <tr>
                                <td colSpan="5" className="p-8 text-center text-muted-foreground font-semibold">
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
                              statusBadge = <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black px-2 py-0.5 rounded font-mono">INSCRITO</span>;
                              detailMsg = 'Inscripción conforme y cruzada correctamente.';
                            } else if (log.estado === 'no_existe_sistema') {
                              statusBadge = <span className="bg-destructive/10 text-destructive border border-destructive/20 text-[9px] font-black px-2 py-0.5 rounded font-mono">NO EN SISTEMA</span>;
                              detailMsg = 'El Gamertag no corresponde a ningún usuario registrado en la liga.';
                            } else if (log.estado === 'no_inscrito_equipo') {
                              statusBadge = <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black px-2 py-0.5 rounded font-mono">NO EN ROSTER</span>;
                              detailMsg = 'El jugador está registrado en la liga, pero no pertenece a la plantilla de este club.';
                            } else if (log.estado === 'sin_gamertag') {
                              statusBadge = <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px] font-black px-2 py-0.5 rounded font-mono">SIN EA ID</span>;
                              detailMsg = 'Jugador inscrito en el club pero no tiene configurado su Gamertag / ID EA en su perfil.';
                            } else if (log.estado === 'no_jugo') {
                              statusBadge = <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[9px] font-black px-2 py-0.5 rounded font-mono">NO JUGÓ</span>;
                              detailMsg = 'Jugador inscrito en plantilla que permaneció en el banco.';
                            }

                            return (
                              <tr key={log.id} className="hover:bg-muted/5 transition-colors">
                                <td className="p-4 font-semibold text-left">
                                  <div className="space-y-0.5">
                                    {userJ.name ? (
                                      <Link to={`/jugadores/${userJ.id}`} className="font-bold text-foreground hover:text-primary transition-colors">
                                        {userJ.name}
                                      </Link>
                                    ) : (
                                      <span className="text-foreground italic">{log.playername || 'EA ID Desconocido'}</span>
                                    )}
                                    <span className="text-[10px] text-muted-foreground font-mono block">
                                      🎮 EA ID: {log.playername || userJ.gamertag || 'N/A'}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-4 font-bold text-[11px] text-foreground uppercase tracking-wide text-left">
                                  {eq.nombre || 'N/A'}
                                </td>
                                <td className="p-4 text-center font-bold">
                                  {log.jugo ? '✅ Sí' : '❌ No'}
                                </td>
                                <td className="p-4 text-center">
                                  {statusBadge}
                                </td>
                                <td className="p-4 text-muted-foreground font-medium max-w-xs text-left">
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
                    <div className="flex items-center justify-between border-t border-border/20 pt-4 px-4 bg-muted/10 pb-4">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        PÁGINA {logPage} DE {totalLogPages}
                      </span>
                      <div className="flex gap-2">
                        <button
                          disabled={logPage === 1}
                          onClick={() => setLogPage(prev => Math.max(prev - 1, 1))}
                          className="px-3 py-1.5 rounded bg-card border border-border/40 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-bold tracking-wider uppercase transition-colors"
                        >
                          ◀ Anterior
                        </button>
                        <button
                          disabled={logPage === totalLogPages}
                          onClick={() => setLogPage(prev => Math.min(prev + 1, totalLogPages))}
                          className="px-3 py-1.5 rounded bg-card border border-border/40 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-bold tracking-wider uppercase transition-colors"
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
