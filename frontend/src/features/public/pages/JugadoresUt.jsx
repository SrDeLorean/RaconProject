import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/api/axios';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { useDebounce } from '@/hooks/useDebounce';


export default function JugadoresUt() {
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [posicion, setPosicion] = useState('todas');
  const [tipoUt, setTipoUt] = useState('todos');

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handlePosicionChange = (e) => {
    setPosicion(e.target.value);
    setCurrentPage(1);
  };

  const handleTipoUtChange = (e) => {
    setTipoUt(e.target.value);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchJugadoresUt = async () => {
      setLoading(true);
      try {
        const response = await api.get('/users', {
          params: { 
            page: currentPage, 
            per_page: 12, 
            role: 'jugador',
            search: debouncedSearch || undefined,
            posicion: posicion !== 'todas' ? posicion : undefined,
            tipo_ut: tipoUt === 'todos' ? 'all' : tipoUt
          }
        });
        const resData = response.data;
        setJugadores(resData.data || resData || []);
        setTotalPages(resData.meta?.last_page || resData.last_page || 1);
      } catch (error) {
        console.error("Error al obtener lista de competidores UT:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJugadoresUt();
  }, [currentPage, debouncedSearch, posicion, tipoUt]);


  const getPosClass = (groupKey) => {
    switch(groupKey) {
      case 'GK': return 'pos-gk';
      case 'DEF': return 'pos-def';
      case 'MED': return 'pos-med';
      case 'DEL': return 'pos-del';
      default: return 'pos-other';
    }
  };

  const getPosStyles = (groupKey) => {
    switch(groupKey) {
      case 'GK':
        return {
          glow: 'group-hover:shadow-[0_15px_40px_-12px_rgba(245,158,11,0.15)] group-hover:border-amber-500/40',
          avatarGlow: 'border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
          bracketColor: 'border-amber-500/60',
          tagBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          accentText: 'text-amber-400',
          gradient: 'from-amber-500/5 to-transparent'
        };
      case 'DEF':
        return {
          glow: 'group-hover:shadow-[0_15px_40px_-12px_rgba(59,130,246,0.15)] group-hover:border-blue-500/40',
          avatarGlow: 'border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.2)]',
          bracketColor: 'border-blue-500/60',
          tagBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
          accentText: 'text-blue-400',
          gradient: 'from-blue-500/5 to-transparent'
        };
      case 'MED':
        return {
          glow: 'group-hover:shadow-[0_15px_40px_-12px_rgba(16,185,129,0.15)] group-hover:border-emerald-500/40',
          avatarGlow: 'border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
          bracketColor: 'border-emerald-500/60',
          tagBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          accentText: 'text-emerald-400',
          gradient: 'from-emerald-500/5 to-transparent'
        };
      case 'DEL':
        return {
          glow: 'group-hover:shadow-[0_15px_40px_-12px_rgba(239,68,68,0.15)] group-hover:border-primary/40',
          avatarGlow: 'border-primary/30 shadow-[0_0_12px_hsla(var(--primary),0.2)]',
          bracketColor: 'border-primary/60',
          tagBg: 'bg-primary/10 border-primary/20 text-primary',
          accentText: 'text-primary',
          gradient: 'from-primary/5 to-transparent'
        };
      default:
        return {
          glow: 'group-hover:shadow-[0_15px_40px_-12px_rgba(6,182,212,0.15)] group-hover:border-cyan-500/40',
          avatarGlow: 'border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]',
          bracketColor: 'border-cyan-500/60',
          tagBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
          accentText: 'text-cyan-400',
          gradient: 'from-cyan-500/5 to-transparent'
        };
    }
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
            UT 1V1
          </span>
          <span className="absolute bottom-10 right-20 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[3px] float-brush-2">
            MODO UT 2V2
          </span>
          <span className="absolute top-1/2 left-1/3 -translate-y-1/2 text-[10rem] md:text-[15rem] font-display font-black uppercase text-foreground/[0.01] dark:text-foreground/[0.02] blur-[4px]">
            ULTIMATE TEAM
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16 items-center relative z-10">
          
          {/* LADO IZQUIERDO — IMPACTO PRINCIPAL */}
          <div className="lg:col-span-7 relative flex flex-col items-start gap-4">
            
            {/* Número gigante transparente de fondo */}
            <div className="absolute -top-16 -left-12 text-[15rem] md:text-[23rem] font-display font-black text-foreground/[0.035] dark:text-foreground/[0.045] select-none leading-none pointer-events-none font-extrabold tracking-tighter">
              {jugadores.length || 24}
            </div>

            <Badge 
              variant="primary" 
              className="animate-fade-in-up px-5 py-2 text-[10px] font-condensed tracking-[0.2em] text-primary border border-primary/30 bg-primary/10 rounded-full shadow-[0_0_20px_hsla(var(--primary),0.15)] uppercase animate-pulse shrink-0 z-10"
            >
              🎮 LIGA ULTIMATE TEAM
            </Badge>

            <h1 className="animate-fade-in-up text-4xl sm:text-8xl md:text-9xl font-display font-black text-foreground uppercase tracking-[0.01em] leading-[0.82] drop-shadow-2xl z-10 mt-2 select-none" style={{ animationDelay: '0.1s' }}>
              DIRECTORIO DE <br />
              <span className="text-primary tracking-tight font-black shimmer-text">
                COMPETIDORES UT.
              </span>
            </h1>

            <p className="animate-fade-in-up text-xs md:text-sm text-muted-foreground font-sans max-w-xl leading-relaxed tracking-wide font-light z-10 mt-2" style={{ animationDelay: '0.2s' }}>
              Descubre a los jugadores que participan o han participado activamente en los torneos y circuitos 1vs1 y 2vs2 de Ultimate Team en la plataforma.
            </p>
          </div>

          {/* DERECHA — INFORMACIÓN TÁCTICA */}
          <div className="lg:col-span-3 flex flex-col justify-center items-start lg:items-stretch gap-6 z-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="border border-border/40 bg-card/45 backdrop-blur-md rounded-2xl p-6 w-full space-y-4 shadow-xl">
              
              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                <span className="text-[10px] font-condensed tracking-widest text-muted-foreground uppercase">TELEMETRÍA REAL</span>
                <span className="text-[10px] font-mono text-primary font-bold">UT REGISTERED</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">JUGADORES UT</h4>
                  <span className="text-3xl font-display font-black text-foreground">{jugadores.length}</span>
                </div>
                <div>
                  <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">FILTRADO POR</h4>
                  <span className="text-xl font-display font-black text-primary truncate max-w-[80px]" title={tipoUt}>{tipoUt.toUpperCase()}</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed font-sans font-light">
                Base de competidores UT verificados con estadísticas de torneos 1vs1 y 2vs2.
              </p>

              <button 
                onClick={() => { setSearch(''); setPosicion('todas'); setTipoUt('todos'); setCurrentPage(1); }}
                className="w-full py-4 text-xs font-condensed tracking-widest uppercase rounded-lg text-primary-foreground font-black cursor-pointer btn-glossy"
              >
                REINICIAR BÚSQUEDA
              </button>
            </div>
          </div>

        </div>

      </section>

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 space-y-12">

        {/* Panel de Filtros y Buscador Premium */}
        <div className="filter-panel max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Buscador */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block font-mono">
              🔍 BUSCAR COMPETIDOR
            </label>
            <input 
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Buscar por Nombre o EA ID..."
              className="input-premium"
            />
          </div>

          {/* Posiciones */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block font-mono">
              ⚽ DEMARCACIÓN / POSICIÓN
            </label>
            <select 
              value={posicion}
              onChange={handlePosicionChange}
              className="input-premium uppercase"
            >
              <option value="todas">🌎 Todas las posiciones</option>
              <option value="GK">🧤 Arqueros (POR / GK)</option>
              <option value="DEF">🛡️ Defensores (DFC / CB / LB / RB)</option>
              <option value="MED">🧠 Mediocampistas (CM / MCD / MCO / LM / RM)</option>
              <option value="DEL">⚡ Delanteros (ST / CF / LW / RW / ED / EI)</option>
            </select>
          </div>

          {/* Modalidad UT */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block font-mono">
              🎮 MODALIDAD ULTIMATE TEAM
            </label>
            <select 
              value={tipoUt}
              onChange={handleTipoUtChange}
              className="input-premium"
            >
              <option value="todos">🎮 Todos los competidores UT</option>
              <option value="1vs1">🥇 Competidores 1vs1 UT</option>
              <option value="2vs2">👥 Competidores 2vs2 UT</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 min-h-[300px] border border-border/40 bg-card/25 backdrop-blur-md rounded-2xl w-full col-span-full">
            <Spinner size="xl" />
            <p className="mt-4 text-xs font-condensed font-bold text-muted-foreground tracking-[0.2em] uppercase animate-pulse">
              Cargando plantilla de competidores UT...
            </p>
          </div>
        ) : jugadores.length > 0 ? (
          <div className="space-y-16">
            {(() => {
              const groups = {
                GK: { title: '🧤 Porteros / Arqueros UT', desc: 'Protectores de la portería en Ultimate Team', items: [] },
                DEF: { title: '🛡️ Defensores UT', desc: 'Zaga defensiva en la modalidad competitiva', items: [] },
                MED: { title: '🧠 Mediocampistas UT', desc: 'Organizadores de juego y contenciones tácticas', items: [] },
                DEL: { title: '⚡ Delanteros UT', desc: 'Goleadores y extremos desequilibrantes de UT', items: [] },
                OTROS: { title: '🎮 Demarcaciones Especiales UT', desc: 'Otros competidores registrados en Ultimate Team', items: [] }
              };

              jugadores.forEach(j => {
                const pos = (j.posicion || 'MC').toUpperCase();
                if (['POR', 'GK', 'PO'].includes(pos)) {
                  groups.GK.items.push(j);
                } else if (['DFC', 'DFI', 'DFD', 'CB', 'LB', 'RB', 'DF', 'DEF'].includes(pos)) {
                  groups.DEF.items.push(j);
                } else if (['MC', 'MCO', 'MCD', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MED'].includes(pos)) {
                  groups.MED.items.push(j);
                } else if (['DEL', 'DC', 'EI', 'ED', 'ST', 'LW', 'RW', 'CF', 'DL'].includes(pos)) {
                  groups.DEL.items.push(j);
                } else {
                  groups.OTROS.items.push(j);
                }
              });

              return Object.entries(groups).map(([key, group]) => {
                if (group.items.length === 0) return null;
                return (
                  <div key={key} className="space-y-6 animate-fade-in">
                    <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/40 pb-3 gap-2">
                      <div>
                        <h2 className="text-xl md:text-2xl font-display font-black text-foreground uppercase tracking-wide flex items-center gap-2.5">
                          {group.title}
                          <Badge className="bg-primary/20 text-primary border-primary/30 font-bold px-2 py-0.5 text-xs">
                            {group.items.length}
                          </Badge>
                        </h2>
                        <p className="text-[11px] text-muted-foreground font-light">{group.desc}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {group.items.map((jugador, index) => {
                        const posStyles = getPosStyles(key);
                        return (
                          <Link 
                            to={`/jugadores/${jugador.id}`}
                            key={jugador.id} 
                            className={`group relative overflow-hidden flex flex-col justify-between bg-card/25 backdrop-blur-md border border-border/40 p-5 rounded-2xl cursor-pointer transition-all duration-500 ${posStyles.glow} group-hover:-translate-y-2 group-hover:scale-[1.01] animate-fade-in-up`}
                            style={{ animationDelay: `${index * 0.06}s` }}
                          >
                            {/* HUD Brackets - Light up on card hover */}
                            <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-transparent transition-colors duration-500 pointer-events-none rounded-tl-md group-hover:${posStyles.bracketColor}`}></div>
                            <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-transparent transition-colors duration-500 pointer-events-none rounded-tr-md group-hover:${posStyles.bracketColor}`}></div>
                            <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-transparent transition-colors duration-500 pointer-events-none rounded-bl-md group-hover:${posStyles.bracketColor}`}></div>
                            <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-transparent transition-colors duration-500 pointer-events-none rounded-br-md group-hover:${posStyles.bracketColor}`}></div>

                            {/* Position Chip floating on top-right */}
                            <div className={`absolute top-3 right-3 z-10 px-2 py-0.5 rounded-md text-[9px] font-mono font-black border uppercase tracking-wider ${posStyles.tagBg}`}>
                              {jugador.posicion || 'MC'}
                            </div>

                            {/* Background blur highlight */}
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${posStyles.gradient} rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>

                            {/* Card Content */}
                            <div className="space-y-4 z-10">
                              
                              {/* Avatar and Name row */}
                              <div className="flex items-center gap-3.5">
                                <div className={`w-12 h-12 rounded-xl overflow-hidden border-2 bg-card shrink-0 transition-all duration-500 ${posStyles.avatarGlow} group-hover:scale-105 relative`}>
                                  <div className="absolute inset-0 border border-white/5 pointer-events-none rounded-lg"></div>
                                  {jugador.foto ? (
                                    <img 
                                      src={jugador.foto.startsWith('http') ? jugador.foto : (typeof window.mediaUrl === 'function' ? window.mediaUrl(jugador.foto) : window.mediaUrl(jugador.foto))} 
                                      alt={jugador.name} 
                                      className="w-full h-full object-cover"
                                      onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-tr from-card/30 to-background/50 flex items-center justify-center font-display font-black text-primary text-base shadow-inner uppercase">${(jugador.gamertag || jugador.name || '?').charAt(0)}</div>`; }}
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-card/30 to-background/50 flex items-center justify-center font-display font-black text-primary text-base shadow-inner uppercase">
                                      {(jugador.gamertag || jugador.name || '?').charAt(0)}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-display font-black text-base text-foreground tracking-wide truncate group-hover:text-primary transition-colors duration-300">
                                    🎮 {jugador.gamertag || 'SIN GAMERTAG'}
                                  </h3>
                                  <span className="text-[10px] font-bold font-sans text-muted-foreground uppercase block truncate tracking-wide">
                                    {jugador.name}
                                  </span>
                                </div>
                              </div>

                              <div className="h-px bg-border/25"></div>

                              {/* Telemetry data grid */}
                              <div className="space-y-2 text-[11px] text-muted-foreground font-sans">
                                <div className="flex justify-between items-center bg-background/35 p-2 rounded-lg border border-border/10">
                                  <span className="font-medium text-[10px] uppercase tracking-widest text-muted-foreground/80 font-mono">Modalidad UT</span>
                                  <span className="text-foreground font-bold font-mono text-xs uppercase">
                                    {jugador.equipos_ut_capitan_count > 0 || jugador.equipos_ut_companero_count > 0 
                                      ? 'COMPETIDOR UT' 
                                      : 'COMPETIDOR UT'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center bg-background/35 p-2 rounded-lg border border-border/10">
                                  <span className="font-medium text-[10px] uppercase tracking-widest text-muted-foreground/80 font-mono">Dorsal / Posición</span>
                                  <span className="text-foreground font-bold font-mono text-xs">{jugador.posicion || 'MC'}</span>
                                </div>
                                <div className="flex justify-between items-center bg-background/35 p-2 rounded-lg border border-border/10 min-w-0">
                                  <span className="font-medium text-[10px] uppercase tracking-widest text-muted-foreground/80 font-mono shrink-0 mr-2">Email</span>
                                  <span className="text-foreground truncate font-mono text-[10px] max-w-[110px]" title={jugador.email}>{jugador.email}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 pt-4 animate-fade-in-up">
                <button 
                  disabled={currentPage === 1 || loading}
                  onClick={() => {
                    setCurrentPage(prev => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }}
                  className="pagination-btn flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Anterior</span>
                </button>
                
                {/* Desktop: Page indicator style */}
                <div className="hidden sm:flex px-4 py-2 rounded-xl bg-card/30 border border-border/40 text-xs font-mono font-bold text-muted-foreground select-none">
                  Página <span className="text-foreground mx-1">{currentPage}</span> de <span className="text-foreground ml-1">{totalPages}</span>
                </div>

                {/* Mobile: Mini indicator */}
                <div className="flex sm:hidden px-3 py-1.5 rounded-lg bg-card/30 border border-border/40 text-[10px] font-mono font-bold text-muted-foreground select-none">
                  Pág. <span className="text-foreground mx-0.5">{currentPage}</span> / <span className="text-foreground ml-0.5">{totalPages}</span>
                </div>

                <button 
                  disabled={currentPage === totalPages || loading}
                  onClick={() => {
                    setCurrentPage(prev => Math.min(prev + 1, totalPages));
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }}
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
        ) : (
          <div className="border border-border/50 bg-card/20 backdrop-blur-md rounded-2xl p-16 flex flex-col items-center text-center max-w-2xl mx-auto gap-6 shadow-lg animate-fade-in-up">
            <div className="w-20 h-20 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-center">
              <svg className="w-10 h-10 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-display font-black tracking-wide text-foreground uppercase">Sin Competidores UT</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Actualmente no hay jugadores con participación en torneos 1vs1 o 2vs2 de Ultimate Team.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
