import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/api/axios';
import Badge from '@/components/ui/Badge';
import Partidos from './Partidos';

export default function DetalleJugador() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'competencias' | 'calendario'

  useEffect(() => {
    const fetchJugador = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/usuarios/${id}`);
        setData(response.data);
      } catch (error) {
        console.error("Error al obtener los detalles del jugador:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJugador();
  }, [id]);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8000${path}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 space-y-8">
          <div className="skeleton-shimmer h-60 rounded-2xl"></div>
          <div className="skeleton-shimmer h-14 rounded-2xl max-w-3xl mx-auto"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="skeleton-shimmer h-52 rounded-xl"></div>
            <div className="lg:col-span-2 skeleton-shimmer h-80 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center">
        <span className="text-4xl">👤</span>
        <h2 className="text-xl font-display font-black text-foreground uppercase">Competidor No Encontrado</h2>
        <Link to="/jugadores" className="text-xs text-primary font-bold uppercase hover:underline">Volver al Directorio</Link>
      </div>
    );
  }

  const { user, contrato_activo, traspasos, estadisticas, competencias = [], historial_torneos = [] } = data;

  return (
    <div className="relative min-h-screen bg-background pt-28 pb-16 overflow-hidden">
      {/* Fondo Inmersivo */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1920&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background z-10"></div>
      </div>

      <div className="relative z-20 max-w-5xl mx-auto px-6 lg:px-10 space-y-8">
        
        {/* Ficha Principal del Jugador */}
        <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-2xl animate-fade-in-up">
          {/* Avatar del Jugador */}
          <div className="relative">
            {user.foto ? (
              <img 
                src={getImageUrl(user.foto)} 
                alt={user.name} 
                className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-4 border-border/60 shadow-lg shrink-0"
              />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-tr from-primary to-destructive border-4 border-border/60 flex items-center justify-center font-display font-black text-primary-foreground text-4xl shadow-lg uppercase shrink-0">
                {user.name?.charAt(0)}
              </div>
            )}

            {contrato_activo?.dorsal && (
              <span className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-black w-8 h-8 rounded-xl flex items-center justify-center border-2 border-background shadow-xl font-mono">
                {contrato_activo.dorsal}
              </span>
            )}
          </div>

          {/* Información e Identidades */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1">
              <Badge variant="primary" className="text-[10px] font-mono px-3 py-0.5 rounded font-black tracking-wider bg-primary/10 border-primary/20 text-primary uppercase">
                {user.plataforma || 'CROSSPLAY'}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-display font-extrabold uppercase tracking-tight text-foreground text-glow-primary mt-1">
                {user.name}
              </h1>
              <span className="text-xs text-primary font-mono block">
                🎮 EA ID / Nickname: {user.gamertag || 'N/A'}
              </span>
            </div>

            {/* Redes Sociales del Jugador */}
            {user.redes_sociales && Object.values(user.redes_sociales).some(Boolean) && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                {Object.entries(user.redes_sociales).map(([red, url]) => {
                  if (!url) return null;
                  return (
                    <a 
                      key={red} 
                      href={url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[10px] bg-muted/60 border border-border/50 px-2.5 py-1 rounded font-bold uppercase hover:bg-primary/10 hover:text-primary hover:border-primary/30 hover:shadow-[0_0_12px_hsla(var(--primary),0.15)] transition-all duration-300"
                    >
                      {red}
                    </a>
                  );
                })}
              </div>
            )}

            <div className="h-px bg-border/40"></div>

            {/* Ficha Física y Detalles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              {[
                { label: 'Posición', value: user.posicion || contrato_activo?.posicion_bloque || 'MC' },
                { label: 'Nacionalidad', value: user.nacionalidad || 'Chilena' },
                { label: 'Estatura', value: user.altura ? `${user.altura} cm` : '—' },
                { label: 'Peso', value: user.peso ? `${user.peso} kg` : '—' },
              ].map((item, idx) => (
                <div key={idx} className="bg-card/30 border border-border/30 rounded-xl p-3 space-y-0.5">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</span>
                  <strong className="text-sm font-black text-foreground uppercase block">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selector de Secciones (Tabs) */}
        <div className="flex border border-border/40 p-1 bg-card/25 backdrop-blur-md rounded-2xl max-w-3xl mx-auto shadow-xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 px-4 text-xs font-condensed tracking-widest font-black uppercase rounded-xl transition-all duration-300 cursor-pointer ${
              activeTab === 'stats' 
                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsla(var(--primary),0.3)]' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            📊 Ficha y Estadísticas
          </button>
          <button 
            onClick={() => setActiveTab('competencias')}
            className={`flex-1 py-3 px-4 text-xs font-condensed tracking-widest font-black uppercase rounded-xl transition-all duration-300 cursor-pointer ${
              activeTab === 'competencias' 
                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsla(var(--primary),0.3)]' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            🏆 Torneos y Traspasos
          </button>
          <button 
            onClick={() => setActiveTab('calendario')}
            className={`flex-1 py-3 px-4 text-xs font-condensed tracking-widest font-black uppercase rounded-xl transition-all duration-300 cursor-pointer ${
              activeTab === 'calendario' 
                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsla(var(--primary),0.3)]' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            📅 Calendario Partidos
          </button>
          <button 
            onClick={() => setActiveTab('historia')}
            className={`flex-1 py-3 px-4 text-xs font-condensed tracking-widest font-black uppercase rounded-xl transition-all duration-300 cursor-pointer ${
              activeTab === 'historia' 
                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsla(var(--primary),0.3)]' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            📜 Historia
          </button>
        </div>

        {/* Contenido Condicional por Secciones */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Club Actual */}
            <div className="lg:col-span-1 space-y-6">
              <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-xl p-5 space-y-4 shadow-md">
                <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2">
                  🛡️ CLUB ACTUAL
                </h3>
                {contrato_activo ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      {contrato_activo.equipo_logo ? (
                        <img 
                          src={getImageUrl(contrato_activo.equipo_logo)} 
                          alt={contrato_activo.equipo_nombre} 
                          className="w-14 h-14 rounded-xl object-cover border border-border/40 shrink-0 shadow" 
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center font-display font-black text-primary text-xl uppercase shrink-0">
                          {contrato_activo.equipo_nombre?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <Link to={`/equipos/${contrato_activo.equipo_id}`} className="font-display font-black text-lg text-foreground hover:text-primary uppercase tracking-wide transition-colors">
                          {contrato_activo.equipo_nombre}
                        </Link>
                        <span className="text-[10px] text-muted-foreground block font-bold uppercase mt-0.5">
                          🏆 LIGA: {contrato_activo.organizacion_nombre}
                        </span>
                      </div>
                    </div>
                    <div className="w-full text-center bg-primary/10 text-primary border border-primary/20 text-xs font-black font-mono py-2 rounded-xl">
                      CONTRATO ACTIVO
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive text-xl shrink-0">
                        👤
                      </div>
                      <div>
                        <strong className="font-display font-black text-lg text-destructive uppercase tracking-wide">
                          Agente Libre
                        </strong>
                        <span className="text-[10px] text-muted-foreground block font-bold uppercase mt-0.5">
                          Sin vinculación contractual
                        </span>
                      </div>
                    </div>
                    <div className="w-full text-center bg-destructive/10 text-destructive border border-destructive/20 text-xs font-black font-mono py-2 rounded-xl">
                      DISPONIBLE PARA FICHAJE
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Estadísticas Generales */}
            <div className="lg:col-span-2">
              <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-xl p-5 space-y-4 shadow-md">
                <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2">
                  📊 RENDIMIENTO Y ESTADÍSTICAS
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  {(() => {
                    const baseStats = [
                      { label: 'Partidos Jugados', value: estadisticas.partidos_jugados, max: 50 },
                      { label: 'Goles Anotados', value: estadisticas.total_goles, max: 30 },
                      { label: 'Asistencias dadas', value: estadisticas.total_asistencias, max: 30 },
                      { label: 'Valoración Promedio', value: estadisticas.promedio_valoracion, max: 10 },
                      { label: 'Jugador del Partido (MVP)', value: estadisticas.total_mvp, max: 10 },
                    ];

                    const pos = (user.posicion || contrato_activo?.posicion_bloque || 'MC').toUpperCase();

                    if (pos === 'POR' || pos === 'GK') {
                      baseStats.push(
                        { label: 'Atajadas Totales', value: estadisticas.total_atajadas || 0, max: 100 },
                        { label: 'Goles Recibidos', value: estadisticas.total_goles_recibidos || 0, max: 50, alert: true }
                      );
                    } else if (['DFC', 'DFI', 'DFD', 'CB', 'LB', 'RB'].includes(pos)) {
                      baseStats.push(
                        { label: 'Entradas Completadas', value: estadisticas.total_entradas || 0, max: 150 },
                        { label: 'Éxito de Quites (%)', value: estadisticas.avg_exito_entradas || 0, max: 100 }
                      );
                    } else {
                      baseStats.push(
                        { label: 'Precisión de Pases (%)', value: estadisticas.avg_precision_pases || 0, max: 100 },
                        { label: 'Precisión de Tiros (%)', value: estadisticas.avg_precision_tiro || 0, max: 100 }
                      );
                    }

                    baseStats.push({ label: 'Tarjetas Rojas', value: estadisticas.total_rojas, max: 5, alert: true });

                    return baseStats.map((stat, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-end text-xs font-semibold">
                          <span className="text-muted-foreground uppercase tracking-tight">{stat.label}</span>
                          <strong className={stat.alert ? 'text-destructive font-mono font-black' : 'text-foreground font-mono font-black'}>
                            {stat.value}
                          </strong>
                        </div>
                        {/* Barra de progreso visual premium */}
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full animate-fill-bar ${
                              stat.alert ? 'bg-destructive' : 'bg-gradient-to-r from-primary to-destructive'
                            }`}
                            style={{ width: `${Math.min((stat.value / stat.max) * 100, 100)}%`, animationDelay: `${idx * 0.1}s` }}
                          ></div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'competencias' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Competencias Oficiales Activas */}
            <div className="lg:col-span-1 space-y-6">
              <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-xl p-5 space-y-4 shadow-md">
                <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2">
                  🏆 TORNEOS Y LIGAS ACTIVAS
                </h3>
                {competencias && competencias.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {competencias.map((comp) => (
                      <div key={comp.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/45">
                        {comp.logo ? (
                          <img 
                            src={getImageUrl(comp.logo)} 
                            alt={comp.nombre} 
                            className="w-10 h-10 object-cover rounded-lg border border-border/40 shrink-0" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                            🏆
                          </div>
                        )}
                        <div className="flex flex-col">
                          <Link to={`/organizaciones/${comp.id}`} className="font-display font-black text-xs text-foreground uppercase tracking-wide hover:text-primary transition-colors">
                            {comp.nombre}
                          </Link>
                          <span className="text-[9px] text-muted-foreground uppercase font-mono mt-0.5">
                            {comp.organizacion_nombre} • {comp.formato} ({comp.plataforma})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground font-medium bg-muted/20 p-4 rounded-xl text-center italic border border-border/30">El equipo de este jugador no se encuentra inscrito en competencias activas.</p>
                )}
              </div>
            </div>

            {/* Historial de Traspasos */}
            <div className="lg:col-span-2">
              <div className="border border-border/50 bg-card/25 backdrop-blur-sm rounded-xl p-5 space-y-4 shadow-md">
                <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2">
                  🔄 TRANSFERENCIAS Y EQUIPOS PASADOS
                </h3>
                {traspasos && traspasos.length > 0 ? (
                  <div className="relative border-l border-border/40 ml-4 pl-6 space-y-6 pt-2">
                    {traspasos.map((t) => (
                      <div key={t.id} className="relative">
                        {/* Punto de la línea de tiempo */}
                        <span className="absolute -left-[31px] top-1.5 w-5 h-5 rounded-full bg-gradient-to-tr from-primary to-destructive border-2 border-background shadow-lg animate-pulse-glow"></span>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 font-black px-2 py-0.5 rounded font-mono">
                              APROBADO
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono font-semibold">
                              {new Date(t.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <p className="text-sm font-semibold text-foreground leading-relaxed">
                            Se unió a <Link to={`/equipos/${t.equipo?.id}`} className="text-primary hover:underline font-bold">{t.equipo?.nombre}</Link> procedente de <span className="text-muted-foreground font-bold">{t.equipo_origen?.nombre || 'Agente Libre'}</span>.
                          </p>
                          
                          <span className="text-[10px] text-muted-foreground block uppercase font-bold">
                            Circuito: {t.organizacion?.nombre}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground font-medium bg-muted/20 p-4 rounded-xl text-center italic border border-border/30">No se registran movimientos ni transferencias oficiales.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendario' && (
          <div className="border border-border/40 bg-card/25 rounded-3xl p-4 md:p-6 shadow-2xl animate-fade-in">
            <Partidos forPlayer={true} hideHero={true} playerId={id} />
          </div>
        )}

        {activeTab === 'historia' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-xl font-display font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                  📜 RECORRIDO HISTÓRICO Y RESUMEN TÁCTICO
                </h3>
                <p className="text-xs text-muted-foreground font-light mt-1">
                  Estadísticas acumuladas e historial de torneos disputados por el jugador a lo largo de las temporadas en RaconPro.
                </p>
              </div>

              {historial_torneos && historial_torneos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {historial_torneos.map((hist, idx) => (
                    <div key={idx} className="group border border-border/40 bg-background/30 backdrop-blur-md rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-primary/45 hover:shadow-lg flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: `${idx * 0.08}s` }}>
                      {/* Banner decorativo del torneo */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

                      <div className="flex items-center gap-3">
                        {hist.equipo_logo ? (
                          <img 
                            src={getImageUrl(hist.equipo_logo)} 
                            alt={hist.equipo_nombre} 
                            className="w-12 h-12 rounded-xl object-cover border border-border/40 shrink-0" 
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-black text-primary text-lg uppercase shrink-0">
                            🛡️
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-display font-black text-base text-foreground uppercase tracking-wide truncate group-hover:text-primary transition-colors">
                            {hist.equipo_nombre}
                          </h4>
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase truncate">
                            🏆 {hist.competencia_nombre} • {hist.temporada_nombre}
                          </span>
                          <span className="text-[9px] text-primary/70 block font-mono font-bold uppercase truncate">
                            💼 {hist.organizacion_nombre}
                          </span>
                        </div>
                      </div>

                      <div className="h-px bg-border/30"></div>

                      {/* Resumen táctico de la temporada */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-card/45 border border-border/30 rounded-xl p-2.5 text-center">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Partidos</span>
                          <strong className="text-sm font-black text-foreground font-mono">{hist.partidos_jugados}</strong>
                        </div>
                        <div className="bg-card/45 border border-border/30 rounded-xl p-2.5 text-center">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Goles</span>
                          <strong className="text-sm font-black text-emerald-500 font-mono">{hist.total_goles}</strong>
                        </div>
                        <div className="bg-card/45 border border-border/30 rounded-xl p-2.5 text-center">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Asist.</span>
                          <strong className="text-sm font-black text-primary font-mono">{hist.total_asistencias}</strong>
                        </div>
                        <div className="bg-card/45 border border-border/30 rounded-xl p-2.5 text-center col-span-1.5">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">MVP</span>
                          <strong className="text-sm font-black text-amber-500 font-mono">{hist.total_mvp} ⭐</strong>
                        </div>
                        <div className="bg-card/45 border border-border/30 rounded-xl p-2.5 text-center col-span-1.5">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Valoración</span>
                          <strong className="text-sm font-black text-primary font-mono">{hist.promedio_valoracion} / 10</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-border/50 bg-muted/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
                  <span className="text-2xl">📜</span>
                  <p className="text-sm text-muted-foreground font-medium italic">
                    No se registran datos ni participaciones en temporadas pasadas de forma oficial para este competidor.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
