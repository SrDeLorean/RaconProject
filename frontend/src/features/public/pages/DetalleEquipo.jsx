import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/api/axios';
import Badge from '@/components/ui/Badge';
import Partidos from './Partidos';

export default function DetalleEquipo() {
  const { id } = useParams();
  const [equipo, setEquipo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roster');
  
  // Traspasos filters & pagination
  const [traspasosSearch, setTraspasosSearch] = useState('');
  const [traspasosFiltro, setTraspasosFiltro] = useState('todos'); // 'todos' | 'alta' | 'baja'
  const [traspasosPage, setTraspasosPage] = useState(1);

  useEffect(() => {
    const fetchEquipo = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/equipos/${id}`);
        setEquipo(response.data);
      } catch (error) {
        console.error("Error al obtener los detalles del equipo:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEquipo();
  }, [id]);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8000${path}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16">
        <div className="skeleton-shimmer h-64 md:h-80 w-full"></div>
        <div className="max-w-6xl mx-auto px-6 lg:px-10 -mt-24 space-y-8">
          <div className="flex items-center gap-6">
            <div className="skeleton-shimmer w-28 h-28 md:w-36 md:h-36 rounded-2xl shrink-0"></div>
            <div className="space-y-3 flex-1">
              <div className="skeleton-shimmer h-4 w-32 rounded"></div>
              <div className="skeleton-shimmer h-10 w-64 rounded-lg"></div>
              <div className="skeleton-shimmer h-3 w-48 rounded"></div>
            </div>
          </div>
          <div className="skeleton-shimmer h-14 rounded-2xl max-w-4xl mx-auto"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-20 rounded-2xl" style={{ animationDelay: `${i * 0.06}s` }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!equipo) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center">
        <span className="text-4xl">🛡️</span>
        <h2 className="text-xl font-display font-black text-foreground uppercase">Club No Encontrado</h2>
        <Link to="/equipos" className="text-xs text-primary font-bold uppercase hover:underline">Volver al Directorio</Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background pt-24 pb-16 overflow-hidden">
      {/* Banner Superior Inmersivo */}
      <div 
        className="h-64 md:h-80 bg-cover bg-center relative z-0"
        style={{ backgroundImage: `url('${getImageUrl(equipo.banner) || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&fit=crop'}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-10 relative z-10 -mt-24 md:-mt-32 space-y-8 animate-fade-in-up">
        
        {/* Cabecera del Equipo */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 pb-6 border-b border-border/40">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {equipo.logo ? (
              <img 
                src={getImageUrl(equipo.logo)} 
                alt={equipo.nombre} 
                className="w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover border-4 border-background bg-card shadow-2xl shrink-0"
              />
            ) : (
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-gradient-to-tr from-primary to-destructive border-4 border-background flex items-center justify-center font-display font-black text-primary-foreground text-4xl shadow-2xl uppercase shrink-0">
                {equipo.abreviatura || equipo.nombre?.charAt(0)}
              </div>
            )}

            <div className="text-center md:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Badge variant="primary" className="text-[10px] font-mono px-2.5 py-0.5 rounded font-black tracking-wider bg-primary/10 border-primary/20 text-primary uppercase">
                  {equipo.plataforma}
                </Badge>
                <span className="bg-muted px-2.5 py-0.5 rounded text-[10px] text-muted-foreground font-mono font-black">
                  {equipo.abreviatura}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold uppercase tracking-tight text-foreground text-glow-primary">
                {equipo.nombre}
              </h1>
              {equipo.capitan && (
                <p className="text-xs text-muted-foreground font-semibold">
                  👑 Capitán: <span className="text-foreground">{equipo.capitan.name}</span> <span className="text-primary font-mono">({equipo.capitan.gamertag})</span>
                </p>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3 shrink-0">
            {equipo.redes_sociales?.instagram && (
              <a 
                href={equipo.redes_sociales.instagram} 
                target="_blank" 
                rel="noreferrer" 
                className="p-3 bg-card border border-border/50 rounded-xl hover:text-primary transition-colors text-sm font-bold uppercase tracking-wider"
              >
                📸 Instagram
              </a>
            )}
            <Link to="/equipos" className="px-4 py-2 bg-muted border border-border/50 rounded-xl text-xs font-black uppercase text-foreground hover:bg-card transition-all">
              🛡️ Directorio
            </Link>
          </div>
        </div>

        {/* Tabulación de Secciones */}
        <div className="flex border border-border/40 p-1 bg-card/25 backdrop-blur-md rounded-2xl max-w-4xl mx-auto shadow-xl overflow-x-auto gap-1">
          {[
            { id: 'roster', label: '👥 Plantilla' },
            { id: 'partidos', label: '📅 Calendario' },
            { id: 'traspasos', label: '🔄 Traspasos' },
            { id: 'estadisticas', label: '📊 Estadísticas' },
            { id: 'historia', label: '📜 Histórico' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[100px] py-3 px-4 text-xs font-condensed tracking-widest font-black uppercase rounded-xl transition-all duration-300 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsla(var(--primary),0.3)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenidos Dinámicos */}
        <div className="min-h-96 pt-4">
          {/* TAB 1: Roster separado por Posición */}
          {activeTab === 'roster' && (
            <div className="space-y-12 animate-fade-in">
              {(() => {
                const groups = {
                  GK: { title: '🧤 Porteros / Arqueros', desc: 'Protectores de los tres palos bajo el arco', items: [] },
                  DEF: { title: '🛡️ Bloque Defensivo', desc: 'Línea defensiva y murallas impenetrables de la saga', items: [] },
                  MED: { title: '🧠 Sala de Máquinas (Mediocentro)', desc: 'Directores tácticos, contenciones e ideas creativas', items: [] },
                  DEL: { title: '⚡ Artillería Ofensiva (Delanteros)', desc: 'Extremos veloces y goleadores letales del área rival', items: [] },
                  OTROS: { title: '🎮 Demarcaciones Especiales', desc: 'Competidores con roles o demarcaciones alternativas', items: [] }
                };

                if (equipo.roster) {
                  equipo.roster.forEach(p => {
                    const pos = (p.posicion || 'MC').toUpperCase();
                    if (['POR', 'GK', 'PO'].includes(pos)) {
                      groups.GK.items.push(p);
                    } else if (['DFC', 'DFI', 'DFD', 'CB', 'LB', 'RB', 'DF', 'DEF'].includes(pos)) {
                      groups.DEF.items.push(p);
                    } else if (['MC', 'MCO', 'MCD', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MED'].includes(pos)) {
                      groups.MED.items.push(p);
                    } else if (['DEL', 'DC', 'EI', 'ED', 'ST', 'LW', 'RW', 'CF', 'DL'].includes(pos)) {
                      groups.DEL.items.push(p);
                    } else {
                      groups.OTROS.items.push(p);
                    }
                  });
                }

                const hasPlayers = Object.values(groups).some(g => g.items.length > 0);

                if (!hasPlayers) {
                  return (
                    <div className="border border-border/50 bg-muted/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
                      <span className="text-2xl">👥</span>
                      <p className="text-xs text-muted-foreground font-medium italic">No hay jugadores registrados en el roster oficial.</p>
                    </div>
                  );
                }

                return Object.entries(groups).map(([key, group]) => {
                  if (group.items.length === 0) return null;
                  return (
                    <div key={key} className="space-y-6">
                      <div className="border-b border-border/20 pb-2">
                        <h3 className="text-lg font-display font-black text-foreground uppercase tracking-wide flex items-center gap-2.5">
                          {group.title}
                          <Badge className="bg-primary/20 text-primary border-primary/30 font-bold px-2 py-0.5 text-xs font-mono">
                            {group.items.length}
                          </Badge>
                        </h3>
                        <p className="text-[11px] text-muted-foreground font-light">{group.desc}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {group.items.map((p, cardIdx) => {
                          const pos = (p.posicion || 'MC').toUpperCase();
                          let posColor = 'text-primary bg-primary/10 border-primary/20';
                          if (['GK', 'POR', 'PO'].includes(pos)) posColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                          if (['DFC', 'CB', 'LB', 'RB', 'DF', 'DEF'].includes(pos)) posColor = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
                          if (['ST', 'LW', 'RW', 'CF', 'DEL', 'DC'].includes(pos)) posColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20';

                          return (
                            <Link 
                              to={`/jugadores/${p.id}`} 
                              key={p.id}
                              className="group border border-border/50 bg-card/25 backdrop-blur-sm rounded-2xl p-5 flex items-center justify-between hover:border-primary/50 transition-all duration-300 shadow-md hover:shadow-lg relative overflow-hidden cursor-pointer animate-fade-in-up"
                              style={{ animationDelay: `${cardIdx * 0.05}s` }}
                            >
                              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl pointer-events-none"></div>

                              <div className="flex items-center gap-3.5 z-10 min-w-0 flex-1 pr-2">
                                {p.foto ? (
                                  <img 
                                    src={getImageUrl(p.foto)} 
                                    alt={p.name} 
                                    className="w-12 h-12 rounded-xl object-cover border border-border/40 shrink-0 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary/10 to-destructive/10 border border-border/40 flex items-center justify-center font-display font-black text-primary text-base shadow-inner uppercase shrink-0">
                                    {p.name.charAt(0)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                    {p.name}
                                  </h4>
                                  <span className="text-[10px] text-muted-foreground font-mono font-bold uppercase block mt-0.5 truncate">
                                    🎮 {p.gamertag}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0 z-10 flex flex-col items-end gap-1.5">
                                <span className="text-[10px] bg-primary text-primary-foreground font-black px-2.5 py-0.5 rounded-lg font-mono shadow-sm">
                                  N° {p.dorsal || '—'}
                                </span>
                                <span className={`text-[9px] border font-black px-2 py-0.5 rounded-md uppercase font-mono ${posColor}`}>
                                  {p.posicion || 'MC'}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* TAB 2: Calendario Completo */}
          {activeTab === 'partidos' && (
            <div className="space-y-6 animate-fade-in">
              <Partidos forTeam={true} hideHero={true} teamId={id} />
            </div>
          )}

          {/* TAB 3: Traspasos con Paginación y Filtro */}
          {activeTab === 'traspasos' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-border/20 pb-2">
                <h2 className="text-xl font-display font-black uppercase tracking-wider text-foreground">
                  Historial de Transferencias
                </h2>
                <p className="text-xs text-muted-foreground font-light mt-1">
                  Movimientos, fichajes aprobados, cesiones y bajas de jugadores del club.
                </p>
              </div>

              {/* Panel de Filtros para Traspasos */}
              <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-4.5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto shadow-md">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-mono">🔍 BUSCAR JUGADOR</span>
                  <input 
                    type="text" 
                    value={traspasosSearch}
                    onChange={(e) => { setTraspasosSearch(e.target.value); setTraspasosPage(1); }}
                    placeholder="Escribe el nombre del jugador..."
                  className="input-premium"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-mono">🔄 TIPO DE MOVIMIENTO</span>
                  <select 
                    value={traspasosFiltro}
                    onChange={(e) => { setTraspasosFiltro(e.target.value); setTraspasosPage(1); }}
                    className="input-premium uppercase"
                  >
                    <option value="todos">🌎 Todos los movimientos</option>
                    <option value="alta">✅ Altas / Incorporaciones</option>
                    <option value="baja">❌ Bajas / Salidas</option>
                  </select>
                </div>
              </div>

              {(() => {
                const list = (equipo.traspasos || []).filter(t => {
                  const isBaja = t.equipo_origen_id === equipo.id;
                  const nameMatch = t.jugador?.name?.toLowerCase().includes(traspasosSearch.toLowerCase()) || 
                                    t.jugador?.gamertag?.toLowerCase().includes(traspasosSearch.toLowerCase());
                  
                  if (traspasosFiltro === 'alta' && isBaja) return false;
                  if (traspasosFiltro === 'baja' && !isBaja) return false;
                  return nameMatch;
                });

                const perPage = 5;
                const totalTraspasosPages = Math.ceil(list.length / perPage);
                const paginatedList = list.slice((traspasosPage - 1) * perPage, traspasosPage * perPage);

                if (list.length === 0) {
                  return (
                    <div className="border border-border/50 bg-muted/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
                      <span className="text-2xl">🔄</span>
                      <p className="text-xs text-muted-foreground font-medium italic">No se han registrado transferencias oficiales con los filtros aplicados.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {paginatedList.map((t) => {
                        const isBaja = t.equipo_origen_id === equipo.id;
                        const userF = t.jugador || {};
                        return (
                          <div 
                            key={t.id}
                            className="border border-border/40 bg-card/25 backdrop-blur-md rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fade-in-up"
                            style={{ animationDelay: `${paginatedList.indexOf(t) * 0.06}s` }}
                          >
                            <div className="flex items-center gap-3.5">
                              {userF.foto ? (
                                <img 
                                  src={getImageUrl(userF.foto)} 
                                  alt={userF.name} 
                                  className="w-10 h-10 rounded-xl object-cover border border-border/40 shrink-0" 
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-muted border border-border/40 flex items-center justify-center font-bold text-xs shrink-0">
                                  🏃
                                </div>
                              )}
                              <div>
                                <Link to={`/jugadores/${userF.id}`} className="font-display font-black text-sm text-foreground hover:text-primary transition-colors uppercase tracking-wide">
                                  {userF.name || 'Competidor'}
                                </Link>
                                <span className="text-[10px] text-primary/70 block font-mono font-bold mt-0.5">
                                  🎮 {userF.gamertag || 'EA ID'}
                                </span>
                              </div>
                              <span className={`text-[9px] font-bold font-mono px-2.5 py-1 rounded-md border shrink-0 ${
                                isBaja 
                                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              }`}>
                                {isBaja ? 'BAJA / SALIDA' : 'ALTA / INGRESO'}
                              </span>
                            </div>

                            <div className="text-xs text-muted-foreground font-semibold">
                              {isBaja ? (
                                <span>Traspasado a la escuadra de <strong className="text-foreground">{t.equipo?.nombre}</strong></span>
                              ) : (
                                <span>Incorporado procedente de <strong className="text-foreground">{t.equipo_origen?.nombre || 'Agente Libre'}</strong></span>
                              )}
                              <span className="text-[10px] text-muted-foreground block font-bold mt-0.5 uppercase">
                                💼 Circuito: {t.organizacion?.nombre}
                              </span>
                            </div>

                            <span className="text-[10px] font-mono font-bold text-muted-foreground bg-background/50 border border-border/30 px-3 py-1 rounded-lg self-start sm:self-center">
                              📅 {new Date(t.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {totalTraspasosPages > 1 && (
                      <div className="flex justify-center items-center gap-4 pt-2">
                        <button 
                          disabled={traspasosPage === 1}
                          onClick={() => setTraspasosPage(prev => Math.max(prev - 1, 1))}
                          className="pagination-btn"
                        >
                          ⬅ Anterior
                        </button>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-mono">
                          Página {traspasosPage} de {totalTraspasosPages}
                        </span>
                        <button 
                          disabled={traspasosPage === totalTraspasosPages}
                          onClick={() => setTraspasosPage(prev => Math.min(prev + 1, totalTraspasosPages))}
                          className="pagination-btn"
                        >
                          Siguiente ➡️
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 4: Estadísticas de Equipo y Rankings Internos */}
          {activeTab === 'estadisticas' && (
            <div className="space-y-12 animate-fade-in">
              
              {/* Bloque 1: Estadísticas Tácticas de Equipo */}
              <div className="space-y-6">
                <h2 className="text-xl font-display font-black uppercase tracking-wider text-foreground border-b border-border/20 pb-2">
                  Estadísticas de Temporada (Equipo)
                </h2>
                {equipo.estadisticas ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                    {[
                      { label: 'Jugados', value: equipo.estadisticas.jugados, color: 'text-foreground' },
                      { label: 'Victorias', value: equipo.estadisticas.victorias, color: 'text-primary' },
                      { label: 'Empates', value: equipo.estadisticas.empates, color: 'text-muted-foreground' },
                      { label: 'Derrotas', value: equipo.estadisticas.derrotas, color: 'text-destructive' },
                      { label: 'Goles Favor', value: equipo.estadisticas.goles_favor, color: 'text-emerald-400' },
                      { label: 'Goles Contra', value: equipo.estadisticas.goles_contra, color: 'text-rose-500' },
                    ].map((stat, idx) => (
                      <div key={idx} className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-5 text-center space-y-1 shadow-md hover:border-primary/30 transition-all duration-300">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block leading-none font-mono">
                          {stat.label}
                        </span>
                        <strong className={`text-4xl font-display font-black block leading-none pt-1 ${stat.color} animate-count-up`} style={{ animationDelay: `${idx * 0.08}s` }}>{stat.value}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-border/50 bg-muted/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
                    <span className="text-2xl">📊</span>
                    <p className="text-xs text-muted-foreground font-medium italic">No hay estadísticas acumuladas en partidos finalizados.</p>
                  </div>
                )}
              </div>

              {/* Bloque 2: Rankings Internos (Goleadores y Asistentes) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Ranking Goleadores del Club */}
                <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-5 space-y-4 shadow-lg">
                  <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2 flex items-center justify-between">
                    <span>⚽ LÍDERES DE GOLEO (CLUB)</span>
                    <span className="text-primary font-bold">TOP 5</span>
                  </h3>

                  {equipo.goleadores && equipo.goleadores.length > 0 ? (
                    <div className="space-y-3">
                      {equipo.goleadores.map((g, idx) => (
                        <div key={g.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/30 bg-background/25">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-mono font-black text-primary/70 min-w-[18px]">
                              {idx + 1}°
                            </span>
                            {g.foto ? (
                              <img src={getImageUrl(g.foto)} alt={g.name} className="w-8 h-8 rounded-lg object-cover border border-border/40 shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                🏃
                              </div>
                            )}
                            <div className="min-w-0">
                              <Link to={`/jugadores/${g.id}`} className="font-bold text-xs text-foreground hover:text-primary transition-colors truncate block">
                                {g.name}
                              </Link>
                              <span className="text-[9px] text-muted-foreground font-mono block truncate">
                                🎮 {g.gamertag || 'EA ID'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <strong className="text-sm font-black text-emerald-500 font-mono">
                              {g.total_goles} {g.total_goles === 1 ? 'Gol' : 'Goles'}
                            </strong>
                            <span className="text-[9px] text-muted-foreground block font-bold font-mono">
                              {g.posicion || 'DEL'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground bg-muted/20 p-4 rounded-xl text-center italic border border-border/30">No se registran anotaciones por parte del roster oficial.</p>
                  )}
                </div>

                {/* Ranking Asistentes del Club */}
                <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-5 space-y-4 shadow-lg">
                  <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2 flex items-center justify-between">
                    <span>🅰️ ASISTENCIAS Y CREACIÓN (CLUB)</span>
                    <span className="text-primary font-bold">TOP 5</span>
                  </h3>

                  {equipo.asistentes && equipo.asistentes.length > 0 ? (
                    <div className="space-y-3">
                      {equipo.asistentes.map((a, idx) => (
                        <div key={a.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/30 bg-background/25">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-mono font-black text-primary/70 min-w-[18px]">
                              {idx + 1}°
                            </span>
                            {a.foto ? (
                              <img src={getImageUrl(a.foto)} alt={a.name} className="w-8 h-8 rounded-lg object-cover border border-border/40 shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                🏃
                              </div>
                            )}
                            <div className="min-w-0">
                              <Link to={`/jugadores/${a.id}`} className="font-bold text-xs text-foreground hover:text-primary transition-colors truncate block">
                                {a.name}
                              </Link>
                              <span className="text-[9px] text-muted-foreground font-mono block truncate">
                                🎮 {a.gamertag || 'EA ID'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <strong className="text-sm font-black text-primary font-mono">
                              {a.total_asistencias} {a.total_asistencias === 1 ? 'Asist.' : 'Asist.'}
                            </strong>
                            <span className="text-[9px] text-muted-foreground block font-bold font-mono">
                              {a.posicion || 'MC'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground bg-muted/20 p-4 rounded-xl text-center italic border border-border/30">No se registran asistencias oficiales de gol.</p>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: Historial y Resumen de Temporadas Pasadas */}
          {activeTab === 'historia' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-border/20 pb-2">
                <h2 className="text-xl font-display font-black uppercase tracking-wider text-foreground">
                  Recorrido Histórico por Temporadas
                </h2>
                <p className="text-xs text-muted-foreground font-light mt-1">
                  Estadísticas acumuladas de la escuadra en circuitos y campeonatos de temporadas pasadas.
                </p>
              </div>

              {equipo.historial_club && equipo.historial_club.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {equipo.historial_club.map((hist, idx) => (
                    <div key={idx} className="group border border-border/40 bg-card/25 backdrop-blur-md rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-primary/45 hover:shadow-lg flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: `${idx * 0.08}s` }}>
                      {/* Banner decorativo del torneo */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-black text-primary text-xl shrink-0">
                          🛡️
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-display font-black text-base text-foreground uppercase tracking-wide truncate group-hover:text-primary transition-colors">
                            {hist.competencia_nombre}
                          </h4>
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase truncate">
                            🏆 {hist.temporada_nombre}
                          </span>
                          <span className="text-[9px] text-primary/70 block font-mono font-bold uppercase truncate">
                            💼 Circuito: {hist.organizacion_nombre}
                          </span>
                        </div>
                      </div>

                      <div className="h-px bg-border/30"></div>

                      {/* Resumen táctico de la temporada */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-background/50 border border-border/30 rounded-xl p-2.5 text-center">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Disputados</span>
                          <strong className="text-sm font-black text-foreground font-mono">{hist.jugados}</strong>
                        </div>
                        <div className="bg-background/50 border border-border/30 rounded-xl p-2.5 text-center">
                          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block">Victorias</span>
                          <strong className="text-sm font-black text-emerald-500 font-mono">{hist.victorias}</strong>
                        </div>
                        <div className="bg-background/50 border border-border/30 rounded-xl p-2.5 text-center">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Empates</span>
                          <strong className="text-sm font-black text-foreground font-mono">{hist.empates}</strong>
                        </div>
                        <div className="bg-background/50 border border-border/30 rounded-xl p-2.5 text-center">
                          <span className="text-[9px] font-bold text-destructive uppercase tracking-wider block">Derrotas</span>
                          <strong className="text-sm font-black text-destructive font-mono">{hist.derrotas}</strong>
                        </div>
                        <div className="bg-background/50 border border-border/30 rounded-xl p-2.5 text-center">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">G. Favor</span>
                          <strong className="text-sm font-black text-primary font-mono">{hist.goles_favor}</strong>
                        </div>
                        <div className="bg-background/50 border border-border/30 rounded-xl p-2.5 text-center">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">G. Contra</span>
                          <strong className="text-sm font-black text-muted-foreground font-mono">{hist.goles_contra}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-border/50 bg-muted/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
                  <span className="text-2xl">📜</span>
                  <p className="text-sm text-muted-foreground font-medium italic">
                    No se registran datos ni participaciones de la escuadra en temporadas pasadas de forma oficial.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
