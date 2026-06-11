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

  const getPlatDetails = (plat) => {
    const p = (plat || '').toUpperCase();
    if (p.includes('PS5')) {
      return {
        label: 'PS5',
        icon: '🎮',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/25',
        glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)] border-blue-500/30',
        gradient: 'from-blue-600/20 via-blue-950/40 to-background',
        badgeColor: 'border-blue-500/30'
      };
    }
    if (p.includes('PS4')) {
      return {
        label: 'PS4',
        icon: '🎮',
        color: 'text-blue-500',
        bg: 'bg-blue-600/10',
        border: 'border-blue-600/25',
        glow: 'shadow-[0_0_15px_rgba(37,99,235,0.3)] border-blue-600/30',
        gradient: 'from-blue-700/20 via-blue-950/40 to-background',
        badgeColor: 'border-blue-600/30'
      };
    }
    if (p.includes('XBOX')) {
      return {
        label: 'XBOX',
        icon: '🟢',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/25',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)] border-emerald-500/30',
        gradient: 'from-emerald-600/20 via-emerald-950/40 to-background',
        badgeColor: 'border-emerald-500/30'
      };
    }
    if (p.includes('PC')) {
      return {
        label: 'PC',
        icon: '🖥️',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/25',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)] border-amber-500/30',
        gradient: 'from-amber-600/20 via-amber-950/40 to-background',
        badgeColor: 'border-amber-500/30'
      };
    }
    return {
      label: plat || 'N/A',
      icon: '🌐',
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/25',
      glow: 'shadow-[0_0_15px_hsla(var(--primary),0.2)] border-primary/30',
      gradient: 'from-primary/15 via-card/50 to-background',
      badgeColor: 'border-primary/30'
    };
  };

  const getPosStyles = (pos) => {
    const pStr = (pos || '').toUpperCase();
    if (['POR', 'GK', 'PO', 'GOALKEEPER'].includes(pStr)) {
      return {
        glow: 'group-hover:shadow-[0_12px_30px_-10px_rgba(245,158,11,0.15)] group-hover:border-amber-500/40',
        avatarGlow: 'border-amber-500/30',
        bracketColor: 'border-amber-500/60',
        posColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      };
    }
    if (['DFC', 'CB', 'LB', 'RB', 'DF', 'DEF', 'DEFENDER'].includes(pStr)) {
      return {
        glow: 'group-hover:shadow-[0_12px_30px_-10px_rgba(59,130,246,0.15)] group-hover:border-blue-500/40',
        avatarGlow: 'border-blue-500/30',
        bracketColor: 'border-blue-500/60',
        posColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      };
    }
    if (['MC', 'MCO', 'MCD', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MED', 'MIDFIELDER'].includes(pStr)) {
      return {
        glow: 'group-hover:shadow-[0_12px_30px_-10px_rgba(16,185,129,0.15)] group-hover:border-emerald-500/40',
        avatarGlow: 'border-emerald-500/30',
        bracketColor: 'border-emerald-500/60',
        posColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
      };
    }
    return {
      glow: 'group-hover:shadow-[0_12px_30px_-10px_rgba(239,68,68,0.15)] group-hover:border-primary/40',
      avatarGlow: 'border-primary/30',
      bracketColor: 'border-primary/60',
      posColor: 'text-primary bg-primary/10 border-primary/20'
    };
  };

  const getRankBadge = (idx) => {
    if (idx === 0) return { label: '1°', style: 'bg-amber-500/25 text-amber-400 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]' };
    if (idx === 1) return { label: '2°', style: 'bg-slate-300/20 text-slate-300 border-slate-300/30' };
    if (idx === 2) return { label: '3°', style: 'bg-amber-700/20 text-amber-600 border-amber-700/30' };
    return { label: `${idx + 1}°`, style: 'bg-primary/10 text-primary/70 border-primary/20' };
  };

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
    if (typeof window.mediaUrl === 'function') {
      return window.mediaUrl(path);
    }
    return window.mediaUrl(path);
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

  const platCfg = getPlatDetails(equipo.plataforma);

  return (
    <div className="relative min-h-screen bg-background pt-24 pb-16 overflow-hidden">
      {/* Resplandores ambientales e-sports */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-primary/5 blur-[130px] rounded-full pointer-events-none z-10"></div>
      <div className="absolute bottom-1/3 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/3 blur-[120px] rounded-full pointer-events-none z-10"></div>

      {/* Banner Superior Inmersivo */}
      <div className="h-64 md:h-80 relative z-0 overflow-hidden">
        {equipo.banner ? (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${getImageUrl(equipo.banner)}')` }}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${platCfg.gradient}`} />
        )}
        {/* Grid and scanline tech layers */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20"></div>
        
        {/* Floating tech banner elements */}
        <div className="absolute top-1/3 left-10 text-[6rem] md:text-[10rem] font-display font-black uppercase text-foreground/[0.015] select-none leading-none pointer-events-none font-extrabold tracking-tighter">
          {equipo.abreviatura || 'CLUB'}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-10 relative z-10 -mt-24 md:-mt-32 space-y-8 animate-fade-in-up">
        
        {/* Cabecera del Equipo */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 pb-6 border-b border-border/40">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {equipo.logo ? (
              <img 
                src={getImageUrl(equipo.logo)} 
                alt={equipo.nombre} 
                className={`w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover border-[3.5px] border-background bg-card shadow-2xl shrink-0 transition-transform duration-500 hover:scale-105 ${platCfg.glow}`}
              />
            ) : (
              <div className={`w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-gradient-to-tr from-primary to-destructive border-[3.5px] border-background flex items-center justify-center font-display font-black text-primary-foreground text-4xl shadow-2xl uppercase shrink-0 transition-transform duration-500 hover:scale-105 ${platCfg.glow}`}>
                {equipo.abreviatura || equipo.nombre?.charAt(0)}
              </div>
            )}

            <div className="text-center md:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Badge variant="primary" className={`text-[10px] font-mono px-2.5 py-0.5 rounded-lg font-black tracking-wider border backdrop-blur-sm ${platCfg.bg} ${platCfg.color} ${platCfg.border} ${platCfg.glow}`}>
                  <span>{platCfg.icon}</span>
                  <span className="ml-1">{platCfg.label}</span>
                </Badge>
                <span className="bg-muted/65 border border-border/40 px-2.5 py-0.5 rounded text-[10px] text-muted-foreground font-mono font-black">
                  {equipo.abreviatura}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold uppercase tracking-tight text-foreground text-glow-primary select-none">
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
                          const posStyles = getPosStyles(p.posicion);
                          return (
                            <Link 
                              to={`/jugadores/${p.id}`} 
                              key={p.id}
                              className={`group border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-4.5 flex items-center justify-between hover:border-primary/50 transition-all duration-300 shadow-md ${posStyles.glow} relative overflow-hidden cursor-pointer animate-fade-in-up`}
                              style={{ animationDelay: `${cardIdx * 0.05}s` }}
                            >
                              {/* HUD Brackets */}
                              <div className={`absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-transparent transition-colors duration-500 pointer-events-none rounded-tl-md group-hover:${posStyles.bracketColor}`}></div>
                              <div className={`absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-transparent transition-colors duration-500 pointer-events-none rounded-tr-md group-hover:${posStyles.bracketColor}`}></div>
                              <div className={`absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-transparent transition-colors duration-500 pointer-events-none rounded-bl-md group-hover:${posStyles.bracketColor}`}></div>
                              <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-transparent transition-colors duration-500 pointer-events-none rounded-br-md group-hover:${posStyles.bracketColor}`}></div>

                              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl pointer-events-none"></div>

                              <div className="flex items-center gap-3.5 z-10 min-w-0 flex-1 pr-2">
                                <div className={`w-11 h-11 rounded-xl overflow-hidden border bg-card shrink-0 transition-all duration-500 ${posStyles.avatarGlow} group-hover:scale-105 relative`}>
                                  {p.foto ? (
                                    <img 
                                      src={getImageUrl(p.foto)} 
                                      alt={p.name} 
                                      className="w-full h-full object-cover shadow-sm"
                                      onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-tr from-card/30 to-background/50 flex items-center justify-center font-display font-black text-primary text-xs shadow-inner uppercase shrink-0">${p.name.charAt(0)}</div>`; }}
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-card/30 to-background/50 flex items-center justify-center font-display font-black text-primary text-xs shadow-inner uppercase shrink-0">
                                      {p.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-display font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors duration-300">
                                    {p.name}
                                  </h4>
                                  <span className="text-[9px] text-muted-foreground font-mono font-bold uppercase block mt-0.5 truncate">
                                    🎮 {p.gamertag || 'EA ID'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0 z-10 flex flex-col items-end gap-1.5">
                                <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary font-black px-2 py-0.5 rounded-md font-mono shadow-sm">
                                  N° {p.dorsal || '—'}
                                </span>
                                <span className={`text-[9px] border font-black px-2 py-0.5 rounded-md uppercase font-mono ${posStyles.posColor}`}>
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
              <div className="relative border border-border/40 bg-card/15 backdrop-blur-md rounded-2xl p-4 md:p-6 shadow-xl overflow-hidden">
                {/* HUD corner lines */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary/50 rounded-tl-md pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary/50 rounded-tr-md pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary/50 rounded-bl-md pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary/50 rounded-br-md pointer-events-none"></div>
                
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
                
                <Partidos forTeam={true} hideHero={true} teamId={id} />
              </div>
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
                      {paginatedList.map((t, tIdx) => {
                        const isBaja = t.equipo_origen_id === equipo.id;
                        const userF = t.jugador || {};
                        const posStyles = getPosStyles(userF.posicion);
                        const transferTheme = isBaja 
                          ? {
                              accent: 'border-l-[3.5px] border-l-rose-500',
                              badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                              glow: 'hover:shadow-[0_8px_25px_-8px_rgba(239,68,68,0.15)] hover:border-rose-500/30',
                              bracket: 'border-rose-500/50',
                              label: 'BAJA / SALIDA'
                            }
                          : {
                              accent: 'border-l-[3.5px] border-l-emerald-500',
                              badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                              glow: 'hover:shadow-[0_8px_25px_-8px_rgba(16,185,129,0.15)] hover:border-emerald-500/30',
                              bracket: 'border-emerald-500/50',
                              label: 'ALTA / INGRESO'
                            };

                        return (
                          <div 
                            key={t.id}
                            className={`group relative border border-border/40 bg-card/25 backdrop-blur-md rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-all duration-300 ${transferTheme.accent} ${transferTheme.glow} overflow-hidden animate-fade-in-up`}
                            style={{ animationDelay: `${tIdx * 0.06}s` }}
                          >
                            {/* HUD brackets on hover */}
                            <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l border-transparent transition-colors duration-300 group-hover:${transferTheme.bracket} rounded-tl-md`}></div>
                            <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r border-transparent transition-colors duration-300 group-hover:${transferTheme.bracket} rounded-tr-md`}></div>
                            <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l border-transparent transition-colors duration-300 group-hover:${transferTheme.bracket} rounded-bl-md`}></div>
                            <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r border-transparent transition-colors duration-300 group-hover:${transferTheme.bracket} rounded-br-md`}></div>

                            <div className="flex items-center gap-3.5 z-10 min-w-0">
                              <div className={`w-11 h-11 rounded-xl overflow-hidden border bg-card shrink-0 transition-transform duration-300 group-hover:scale-105 ${posStyles.avatarGlow}`}>
                                {userF.foto ? (
                                  <img 
                                    src={getImageUrl(userF.foto)} 
                                    alt={userF.name} 
                                    className="w-full h-full object-cover shadow-sm"
                                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-tr from-card/30 to-background/50 flex items-center justify-center font-display font-black text-primary text-xs shadow-inner uppercase shrink-0">${userF.name?.charAt(0) || 'P'}</div>`; }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-tr from-card/30 to-background/50 flex items-center justify-center font-display font-black text-primary text-xs shadow-inner uppercase shrink-0">
                                    {userF.name?.charAt(0) || 'P'}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <Link to={`/jugadores/${userF.id}`} className="font-display font-black text-sm text-foreground hover:text-primary transition-colors uppercase tracking-wide truncate block">
                                  {userF.name || 'Competidor'}
                                </Link>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-primary/70 font-mono font-bold">
                                    🎮 {userF.gamertag || 'EA ID'}
                                  </span>
                                  {userF.posicion && (
                                    <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded border ${posStyles.posColor}`}>
                                      {userF.posicion}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-xs text-muted-foreground font-semibold z-10 sm:max-w-xs md:max-w-md">
                              {isBaja ? (
                                <span>Traspasado a la escuadra de <strong className="text-foreground transition-colors group-hover:text-primary">{t.equipo?.nombre || 'JUGADOR LIBRE'}</strong></span>
                              ) : (
                                <span>Incorporado procedente de <strong className="text-foreground transition-colors group-hover:text-primary">{t.equipo_origen?.nombre || 'Agente Libre'}</strong></span>
                              )}
                              <span className="text-[10px] text-muted-foreground/85 block font-bold mt-0.5 uppercase font-mono">
                                💼 Circuito: {t.organizacion?.nombre || 'General'}
                              </span>
                            </div>

                            <div className="flex sm:flex-col items-start sm:items-end gap-2 shrink-0 z-10">
                              <span className={`text-[9px] font-bold font-mono px-2.5 py-1 rounded-md border tracking-wider ${transferTheme.badge}`}>
                                {transferTheme.label}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-muted-foreground bg-background/50 border border-border/30 px-3 py-1 rounded-lg">
                                📅 {new Date(t.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {totalTraspasosPages > 1 && (
                      <div className="flex justify-center items-center gap-3 pt-4 animate-fade-in-up">
                        <button 
                          disabled={traspasosPage === 1}
                          onClick={() => setTraspasosPage(prev => Math.max(prev - 1, 1))}
                          className="pagination-btn flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          <span className="hidden sm:inline">Anterior</span>
                        </button>
                        
                        {/* Desktop Page Indicator */}
                        <div className="hidden sm:flex px-4 py-2 rounded-xl bg-card/30 border border-border/40 text-xs font-mono font-bold text-muted-foreground select-none">
                          Página <span className="text-foreground mx-1">{traspasosPage}</span> de <span className="text-foreground ml-1">{totalTraspasosPages}</span>
                        </div>

                        {/* Mobile Page Indicator */}
                        <div className="flex sm:hidden px-3 py-1.5 rounded-lg bg-card/30 border border-border/40 text-[10px] font-mono font-bold text-muted-foreground select-none">
                          Pág. <span className="text-foreground mx-0.5">{traspasosPage}</span> / <span className="text-foreground ml-0.5">{totalTraspasosPages}</span>
                        </div>

                        <button 
                          disabled={traspasosPage === totalTraspasosPages}
                          onClick={() => setTraspasosPage(prev => Math.min(prev + 1, totalTraspasosPages))}
                          className="pagination-btn flex items-center gap-1.5"
                        >
                          <span className="hidden sm:inline">Siguiente</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
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
                  (() => {
                    const stats = equipo.estadisticas || {};
                    const jugados = stats.jugados || 0;
                    const victorias = stats.victorias || 0;
                    const empates = stats.empates || 0;
                    const derrotas = stats.derrotas || 0;
                    const gf = stats.goles_favor || 0;
                    const gc = stats.goles_contra || 0;
                    const winRate = jugados > 0 ? Math.round((victorias / jugados) * 100) : 0;
                    const dg = gf - gc;

                    return (
                      <div className="space-y-6">
                        {/* KPIs de Rendimiento Avanzado */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {/* KPI: Win Rate */}
                          <div className="relative overflow-hidden border border-primary/30 bg-primary/5 backdrop-blur-md rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-[0_0_15px_rgba(var(--primary),0.05)]">
                            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-primary pointer-events-none"></div>
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-primary pointer-events-none"></div>
                            <div className="space-y-1 pr-2 min-w-0">
                              <span className="text-[9px] sm:text-[10px] font-mono font-black text-primary uppercase tracking-widest block">TASA DE VICTORIAS</span>
                              <strong className="text-3xl sm:text-4xl font-display font-black block leading-none text-foreground">{winRate}%</strong>
                              <span className="text-[9px] sm:text-[10px] text-muted-foreground block font-semibold mt-1 truncate">Efectividad en {jugados} partidos</span>
                            </div>
                            <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex items-center justify-center shrink-0">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="40" cy="40" r="32" className="stroke-muted/20" strokeWidth="5.5" fill="transparent" />
                                <circle cx="40" cy="40" r="32" className="stroke-primary transition-all duration-1000" strokeWidth="5.5" fill="transparent"
                                  strokeDasharray={2 * Math.PI * 32}
                                  strokeDashoffset={2 * Math.PI * 32 * (1 - winRate / 100)}
                                />
                              </svg>
                              <span className="absolute text-[10px] sm:text-xs font-mono font-black text-foreground">{winRate}%</span>
                            </div>
                          </div>

                          {/* KPI: Diferencia de Goles */}
                          <div className="relative overflow-hidden border border-border/40 bg-card/25 backdrop-blur-md rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-md">
                            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-border pointer-events-none"></div>
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-border pointer-events-none"></div>
                            <div className="space-y-1 pr-2 min-w-0">
                              <span className="text-[9px] sm:text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest block">DIFERENCIA DE GOLES</span>
                              <strong className={`text-3xl sm:text-4xl font-display font-black block leading-none ${dg >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                {dg >= 0 ? `+${dg}` : dg}
                              </strong>
                              <span className="text-[9px] sm:text-[10px] text-muted-foreground block font-semibold mt-1 truncate">
                                Balance ({gf} GF / {gc} GC)
                              </span>
                            </div>
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-xl sm:text-2xl font-black shrink-0 ${dg >= 0 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                              {dg >= 0 ? '📈' : '📉'}
                            </div>
                          </div>
                        </div>

                        {/* Las 6 Tarjetas de Telemetría Táctica */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                          {[
                            { label: 'Jugados', value: jugados, color: 'text-foreground', bg: 'bg-card/20 border-border/40' },
                            { label: 'Victorias', value: victorias, color: 'text-primary', bg: 'bg-primary/5 border-primary/20 hover:border-primary/45' },
                            { label: 'Empates', value: empates, color: 'text-muted-foreground', bg: 'bg-muted/5 border-border/30' },
                            { label: 'Derrotas', value: derrotas, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20 hover:border-destructive/45' },
                            { label: 'Goles Favor', value: gf, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/45' },
                            { label: 'Goles Contra', value: gc, color: 'text-rose-500', bg: 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/45' },
                          ].map((stat, idx) => (
                            <div key={idx} className={`relative overflow-hidden border backdrop-blur-md rounded-2xl p-3 sm:p-5 text-center space-y-1 shadow-md transition-all duration-300 hover:scale-[1.02] ${stat.bg}`}>
                              <div className="absolute top-0 right-0 w-8 h-8 bg-foreground/[0.01] pointer-events-none"></div>
                              <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-widest block leading-none font-mono">
                                {stat.label}
                              </span>
                              <strong className={`text-2xl sm:text-3xl font-display font-black block leading-none pt-1 ${stat.color} font-mono`}>
                                {stat.value}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="border border-border/50 bg-muted/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
                    <span className="text-2xl">📊</span>
                    <p className="text-xs text-muted-foreground font-medium italic">No hay estadísticas acumuladas en partidos finalizados.</p>
                  </div>
                )}
              </div>

              {/* Bloque 2: Rankings y Líderes del Club */}
              <div className="space-y-8 animate-fade-in-up">
                
                {/* Fila 1: Líderes Ofensivos (Goleadores y Asistentes) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                  
                  {/* Ranking Goleadores del Club */}
                  <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-lg">
                    <h3 className="text-[10px] sm:text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2 flex items-center justify-between">
                      <span>⚽ LÍDERES DE GOLEO (CLUB)</span>
                      <span className="text-primary font-bold">TOP 5</span>
                    </h3>

                    {equipo.goleadores && equipo.goleadores.length > 0 ? (
                      <div className="space-y-2.5 sm:space-y-3">
                        {equipo.goleadores.map((g, idx) => {
                          const rank = getRankBadge(idx);
                          const posStyles = getPosStyles(g.posicion);
                          const maxGoles = equipo.goleadores?.[0]?.total_goles || 1;
                          const progress = (g.total_goles / maxGoles) * 100;

                          return (
                            <div key={g.id} className="relative group flex items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl border border-border/30 bg-background/25 transition-all duration-300 hover:border-primary/30 overflow-hidden">
                              <div className="absolute inset-y-0 left-0 bg-primary/[0.02] pointer-events-none transition-all duration-500" style={{ width: `${progress}%` }}></div>
                              
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 z-10">
                                <span className={`text-[9px] sm:text-[10px] font-mono font-black px-1.5 sm:px-2 py-0.5 rounded border ${rank.style}`}>
                                  {rank.label}
                                </span>
                                <div className={`w-8 h-8 sm:w-9 h-9 rounded-lg overflow-hidden border bg-card shrink-0 transition-transform duration-300 group-hover:scale-105 ${posStyles.avatarGlow}`}>
                                  {g.foto ? (
                                    <img src={getImageUrl(g.foto)} alt={g.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-card/30 to-background/50 flex items-center justify-center font-display font-black text-primary text-[10px] sm:text-xs uppercase shrink-0">
                                      {g.name?.charAt(0) || 'P'}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <Link to={`/jugadores/${g.id}`} className="font-display font-bold text-[11px] sm:text-xs text-foreground hover:text-primary transition-colors truncate block">
                                    {g.name}
                                  </Link>
                                  <span className="text-[8px] sm:text-[9px] text-muted-foreground font-mono block truncate mt-0.5">
                                    🎮 {g.gamertag || 'EA ID'}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0 z-10 flex flex-col items-end gap-1">
                                <strong className="text-[11px] sm:text-xs font-black text-emerald-500 font-mono">
                                  {g.total_goles} {g.total_goles === 1 ? 'Gol' : 'Goles'}
                                </strong>
                                <span className={`text-[7px] sm:text-[8px] font-mono font-bold px-1 sm:px-1.5 py-0.2 rounded border ${posStyles.posColor}`}>
                                  {g.posicion || 'DEL'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground bg-muted/20 p-4 rounded-xl text-center italic border border-border/30">No se registran anotaciones por parte del roster oficial.</p>
                    )}
                  </div>

                  {/* Ranking Asistentes del Club */}
                  <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-lg">
                    <h3 className="text-[10px] sm:text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2 flex items-center justify-between">
                      <span>🅰️ ASISTENCIAS Y CREACIÓN (CLUB)</span>
                      <span className="text-primary font-bold">TOP 5</span>
                    </h3>

                    {equipo.asistentes && equipo.asistentes.length > 0 ? (
                      <div className="space-y-2.5 sm:space-y-3">
                        {equipo.asistentes.map((a, idx) => {
                          const rank = getRankBadge(idx);
                          const posStyles = getPosStyles(a.posicion);
                          const maxAsist = equipo.asistentes?.[0]?.total_asistencias || 1;
                          const progress = (a.total_asistencias / maxAsist) * 100;

                          return (
                            <div key={a.id} className="relative group flex items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl border border-border/30 bg-background/25 transition-all duration-300 hover:border-primary/30 overflow-hidden">
                              <div className="absolute inset-y-0 left-0 bg-primary/[0.02] pointer-events-none transition-all duration-500" style={{ width: `${progress}%` }}></div>
                              
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 z-10">
                                <span className={`text-[9px] sm:text-[10px] font-mono font-black px-1.5 sm:px-2 py-0.5 rounded border ${rank.style}`}>
                                  {rank.label}
                                </span>
                                <div className={`w-8 h-8 sm:w-9 h-9 rounded-lg overflow-hidden border bg-card shrink-0 transition-transform duration-300 group-hover:scale-105 ${posStyles.avatarGlow}`}>
                                  {a.foto ? (
                                    <img src={getImageUrl(a.foto)} alt={a.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-card/30 to-background/50 flex items-center justify-center font-display font-black text-primary text-[10px] sm:text-xs uppercase shrink-0">
                                      {a.name?.charAt(0) || 'P'}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <Link to={`/jugadores/${a.id}`} className="font-display font-bold text-[11px] sm:text-xs text-foreground hover:text-primary transition-colors truncate block">
                                    {a.name}
                                  </Link>
                                  <span className="text-[8px] sm:text-[9px] text-muted-foreground font-mono block truncate mt-0.5">
                                    🎮 {a.gamertag || 'EA ID'}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0 z-10 flex flex-col items-end gap-1">
                                <strong className="text-[11px] sm:text-xs font-black text-primary font-mono">
                                  {a.total_asistencias} {a.total_asistencias === 1 ? 'Asist.' : 'Asist.'}
                                </strong>
                                <span className={`text-[7px] sm:text-[8px] font-mono font-bold px-1 sm:px-1.5 py-0.2 rounded border ${posStyles.posColor}`}>
                                  {a.posicion || 'MC'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground bg-muted/20 p-4 rounded-xl text-center italic border border-border/30">No se registran asistencias oficiales de gol.</p>
                    )}
                  </div>

                </div>

                {/* Fila 2: Mejores Jugadores por Posición Táctica (GK, DEF, MED) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                  
                  {/* mejores arqueros */}
                  <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-lg">
                    <h3 className="text-[10px] sm:text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2 flex items-center justify-between">
                      <span>🧤 MEJORES PORTEROS / ARQUEROS</span>
                      <span className="text-primary font-bold">TOP 5</span>
                    </h3>

                    {equipo.mejores_arqueros && equipo.mejores_arqueros.length > 0 ? (
                      <div className="space-y-2.5 sm:space-y-3">
                        {equipo.mejores_arqueros.map((r, idx) => {
                          const rank = getRankBadge(idx);
                          const posStyles = getPosStyles(r.posicion);
                          const progress = (r.avg_valoracion / 10) * 100;

                          return (
                            <div key={r.id} className="relative group flex items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl border border-border/30 bg-background/25 transition-all duration-300 hover:border-primary/30 overflow-hidden">
                              <div className="absolute inset-y-0 left-0 bg-primary/[0.02] pointer-events-none transition-all duration-500" style={{ width: `${progress}%` }}></div>
                              
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 z-10">
                                <span className={`text-[9px] sm:text-[10px] font-mono font-black px-1.5 sm:px-2 py-0.5 rounded border ${rank.style}`}>
                                  {rank.label}
                                </span>
                                <div className={`w-8 h-8 sm:w-9 h-9 rounded-lg overflow-hidden border bg-card shrink-0 transition-transform duration-300 group-hover:scale-105 ${posStyles.avatarGlow}`}>
                                  {r.foto ? (
                                    <img src={getImageUrl(r.foto)} alt={r.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-card/30 to-background/50 flex items-center justify-center font-display font-black text-primary text-[10px] sm:text-xs uppercase shrink-0">
                                      {r.name?.charAt(0) || 'P'}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <Link to={`/jugadores/${r.id}`} className="font-display font-bold text-[11px] sm:text-xs text-foreground hover:text-primary transition-colors truncate block">
                                    {r.name}
                                  </Link>
                                  <span className="text-[8px] sm:text-[9px] text-muted-foreground font-mono block truncate mt-0.5">
                                    🎮 {r.gamertag || 'EA ID'}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0 z-10 flex flex-col items-end gap-1">
                                <strong className="text-[11px] sm:text-xs font-black text-foreground font-mono">
                                  ⭐ {r.avg_valoracion}
                                </strong>
                                <span className="text-[7px] sm:text-[8px] text-muted-foreground block font-bold font-mono">
                                  🧤 {r.total_atajadas} Ataj. ({r.partidos} PJ)
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground bg-muted/20 p-4 rounded-xl text-center italic border border-border/30">No se registran arqueros con estadísticas oficiales.</p>
                    )}
                  </div>

                  {/* mejores defensores */}
                  <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-lg">
                    <h3 className="text-[10px] sm:text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2 flex items-center justify-between">
                      <span>🛡️ MEJORES DEFENSORES</span>
                      <span className="text-primary font-bold">TOP 5</span>
                    </h3>

                    {equipo.mejores_defensores && equipo.mejores_defensores.length > 0 ? (
                      <div className="space-y-2.5 sm:space-y-3">
                        {equipo.mejores_defensores.map((d, idx) => {
                          const rank = getRankBadge(idx);
                          const posStyles = getPosStyles(d.posicion);
                          const progress = (d.avg_valoracion / 10) * 100;

                          return (
                            <div key={d.id} className="relative group flex items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl border border-border/30 bg-background/25 transition-all duration-300 hover:border-primary/30 overflow-hidden">
                              <div className="absolute inset-y-0 left-0 bg-primary/[0.02] pointer-events-none transition-all duration-500" style={{ width: `${progress}%` }}></div>
                              
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 z-10">
                                <span className={`text-[9px] sm:text-[10px] font-mono font-black px-1.5 sm:px-2 py-0.5 rounded border ${rank.style}`}>
                                  {rank.label}
                                </span>
                                <div className={`w-8 h-8 sm:w-9 h-9 rounded-lg overflow-hidden border bg-card shrink-0 transition-transform duration-300 group-hover:scale-105 ${posStyles.avatarGlow}`}>
                                  {d.foto ? (
                                    <img src={getImageUrl(d.foto)} alt={d.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-card/30 to-background/50 flex items-center justify-center font-display font-black text-primary text-[10px] sm:text-xs uppercase shrink-0">
                                      {d.name?.charAt(0) || 'P'}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <Link to={`/jugadores/${d.id}`} className="font-display font-bold text-[11px] sm:text-xs text-foreground hover:text-primary transition-colors truncate block">
                                    {d.name}
                                  </Link>
                                  <span className="text-[8px] sm:text-[9px] text-muted-foreground font-mono block truncate mt-0.5">
                                    🎮 {d.gamertag || 'EA ID'}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0 z-10 flex flex-col items-end gap-1">
                                <strong className="text-[11px] sm:text-xs font-black text-foreground font-mono">
                                  ⭐ {d.avg_valoracion}
                                </strong>
                                <span className="text-[7px] sm:text-[8px] text-muted-foreground block font-bold font-mono">
                                  🛡️ {d.total_entradas} Entr. ({d.partidos} PJ)
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground bg-muted/20 p-4 rounded-xl text-center italic border border-border/30">No se registran defensores con estadísticas oficiales.</p>
                    )}
                  </div>

                  {/* mejores mediocentros */}
                  <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-lg">
                    <h3 className="text-[10px] sm:text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2 flex items-center justify-between">
                      <span>🧠 MEJORES MEDIOCENTROS</span>
                      <span className="text-primary font-bold">TOP 5</span>
                    </h3>

                    {equipo.mejores_medios && equipo.mejores_medios.length > 0 ? (
                      <div className="space-y-2.5 sm:space-y-3">
                        {equipo.mejores_medios.map((m, idx) => {
                          const rank = getRankBadge(idx);
                          const posStyles = getPosStyles(m.posicion);
                          const progress = (m.avg_valoracion / 10) * 100;

                          return (
                            <div key={m.id} className="relative group flex items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl border border-border/30 bg-background/25 transition-all duration-300 hover:border-primary/30 overflow-hidden">
                              <div className="absolute inset-y-0 left-0 bg-primary/[0.02] pointer-events-none transition-all duration-500" style={{ width: `${progress}%` }}></div>
                              
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 z-10">
                                <span className={`text-[9px] sm:text-[10px] font-mono font-black px-1.5 sm:px-2 py-0.5 rounded border ${rank.style}`}>
                                  {rank.label}
                                </span>
                                <div className={`w-8 h-8 sm:w-9 h-9 rounded-lg overflow-hidden border bg-card shrink-0 transition-transform duration-300 group-hover:scale-105 ${posStyles.avatarGlow}`}>
                                  {m.foto ? (
                                    <img src={getImageUrl(m.foto)} alt={m.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-card/30 to-background/50 flex items-center justify-center font-display font-black text-primary text-[10px] sm:text-xs uppercase shrink-0">
                                      {m.name?.charAt(0) || 'P'}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <Link to={`/jugadores/${m.id}`} className="font-display font-bold text-[11px] sm:text-xs text-foreground hover:text-primary transition-colors truncate block">
                                    {m.name}
                                  </Link>
                                  <span className="text-[8px] sm:text-[9px] text-muted-foreground font-mono block truncate mt-0.5">
                                    🎮 {m.gamertag || 'EA ID'}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0 z-10 flex flex-col items-end gap-1">
                                <strong className="text-[11px] sm:text-xs font-black text-foreground font-mono">
                                  ⭐ {m.avg_valoracion}
                                </strong>
                                <span className="text-[7px] sm:text-[8px] text-muted-foreground block font-bold font-mono">
                                  🧠 {m.total_asistencias} Asist. ({m.avg_precision_pases}%)
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground bg-muted/20 p-4 rounded-xl text-center italic border border-border/30">No se registran mediocentros con estadísticas oficiales.</p>
                    )}
                  </div>

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
                  {equipo.historial_club.map((hist, idx) => {
                    const hJugados = hist.jugados || 0;
                    const hVictorias = hist.victorias || 0;
                    const hWinRate = hJugados > 0 ? Math.round((hVictorias / hJugados) * 100) : 0;
                    
                    return (
                      <div 
                        key={idx} 
                        className="group relative border border-border/40 bg-card/25 backdrop-blur-md rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:border-primary/45 hover:shadow-[0_8px_30px_-10px_rgba(var(--primary),0.1)] flex flex-col gap-4 animate-fade-in-up" 
                        style={{ animationDelay: `${idx * 0.08}s` }}
                      >
                        {/* HUD brackets */}
                        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-transparent transition-colors duration-300 group-hover:border-primary/40 rounded-tl-md pointer-events-none"></div>
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-transparent transition-colors duration-300 group-hover:border-primary/40 rounded-tr-md pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-transparent transition-colors duration-300 group-hover:border-primary/40 rounded-bl-md pointer-events-none"></div>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-transparent transition-colors duration-300 group-hover:border-primary/40 rounded-br-md pointer-events-none"></div>

                        {/* Decorative circle glow */}
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

                        <div className="flex items-center justify-between gap-3 z-10">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-black text-primary text-lg shrink-0 group-hover:scale-105 transition-transform duration-300">
                              🛡️
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-display font-black text-sm md:text-base text-foreground uppercase tracking-wide truncate group-hover:text-primary transition-colors">
                                {hist.competencia_nombre}
                              </h4>
                              <span className="text-[10px] text-muted-foreground block font-bold uppercase truncate">
                                🏆 {hist.temporada_nombre}
                              </span>
                            </div>
                          </div>
                          
                          {/* Win rate indicator */}
                          <div className="text-right shrink-0">
                            <span className="text-[9px] font-mono font-black text-primary uppercase tracking-widest block">WIN RATE</span>
                            <strong className="text-lg font-mono font-black text-foreground">{hWinRate}%</strong>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 bg-background/40 border border-border/30 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold text-muted-foreground z-10">
                          <span>💼 Circuito: <span className="text-primary">{hist.organizacion_nombre}</span></span>
                          <span>PARTIDOS: {hJugados}</span>
                        </div>

                        <div className="h-px bg-border/20"></div>

                        {/* Retícula de estadísticas militar/cyber */}
                        <div className="grid grid-cols-3 gap-2.5 z-10">
                          {[
                            { label: 'Disputados', val: hJugados, color: 'text-foreground' },
                            { label: 'Victorias', val: hist.victorias, color: 'text-emerald-400' },
                            { label: 'Empates', val: hist.empates, color: 'text-muted-foreground' },
                            { label: 'Derrotas', val: hist.derrotas, color: 'text-rose-500' },
                            { label: 'G. Favor', val: hist.goles_favor, color: 'text-primary' },
                            { label: 'G. Contra', val: hist.goles_contra, color: 'text-muted-foreground' },
                          ].map((s, sIdx) => (
                            <div key={sIdx} className="bg-background/30 border border-border/20 rounded-xl p-2.5 text-center transition-colors group-hover:bg-background/50 hover:border-primary/20">
                              <span className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-wider block font-mono">
                                {s.label}
                              </span>
                              <strong className={`text-sm font-black font-mono block mt-0.5 ${s.color}`}>
                                {s.val}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
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
