import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/api/axios';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';


export default function Jugadores() {
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [posicion, setPosicion] = useState('todas');

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handlePosicionChange = (e) => {
    setPosicion(e.target.value);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchJugadores = async () => {
      setLoading(true);
      try {
        const response = await api.get('/users', {
          params: { 
            page: currentPage, 
            per_page: 12, 
            role: 'jugador',
            search: search || undefined,
            posicion: posicion !== 'todas' ? posicion : undefined
          }
        });
        const resData = response.data;
        setJugadores(resData.data || resData || []);
        setTotalPages(resData.meta?.last_page || resData.last_page || 1);
      } catch (error) {
        console.error("Error al obtener lista de jugadores:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJugadores();
  }, [currentPage, search, posicion]);

  const getPosClass = (groupKey) => {
    switch(groupKey) {
      case 'GK': return 'pos-gk';
      case 'DEF': return 'pos-def';
      case 'MED': return 'pos-med';
      case 'DEL': return 'pos-del';
      default: return 'pos-other';
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
            FICHAS
          </span>
          <span className="absolute bottom-10 right-20 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[3px] float-brush-2">
            ESTRELLAS
          </span>
          <span className="absolute top-1/2 left-1/3 -translate-y-1/2 text-[10rem] md:text-[15rem] font-display font-black uppercase text-foreground/[0.01] dark:text-foreground/[0.02] blur-[4px]">
            PRO CLUBS
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16 items-center relative z-10">
          
          {/* LADO IZQUIERDO — IMPACTO PRINCIPAL */}
          <div className="lg:col-span-7 relative flex flex-col items-start gap-4">
            
            {/* Número gigante transparente de fondo */}
            <div className="absolute -top-16 -left-12 text-[15rem] md:text-[23rem] font-display font-black text-foreground/[0.035] dark:text-foreground/[0.045] select-none leading-none pointer-events-none font-extrabold tracking-tighter">
              {jugadores.length || 72}
            </div>

            <Badge 
              variant="primary" 
              className="animate-fade-in-up px-5 py-2 text-[10px] font-condensed tracking-[0.2em] text-primary border border-primary/30 bg-primary/10 rounded-full shadow-[0_0_20px_hsla(var(--primary),0.15)] uppercase animate-pulse shrink-0 z-10"
            >
              🔥 Salón de Competidores
            </Badge>

            <h1 className="animate-fade-in-up text-6xl sm:text-8xl md:text-9xl font-display font-black text-foreground uppercase tracking-[0.01em] leading-[0.82] drop-shadow-2xl z-10 mt-2 select-none" style={{ animationDelay: '0.1s' }}>
              DIRECTORIO DE <br />
              <span className="text-primary tracking-tight font-black shimmer-text">
                JUGADORES.
              </span>
            </h1>

            <p className="animate-fade-in-up text-xs md:text-sm text-muted-foreground font-sans max-w-xl leading-relaxed tracking-wide font-light z-10 mt-2" style={{ animationDelay: '0.2s' }}>
              Conoce a todos los competidores, agentes libres y estrellas de Clubes Pro inscritas en las ligas de RaconPro.
            </p>
          </div>

          {/* DERECHA — INFORMACIÓN TÁCTICA */}
          <div className="lg:col-span-3 flex flex-col justify-center items-start lg:items-stretch gap-6 z-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="border border-border/40 bg-card/45 backdrop-blur-md rounded-2xl p-6 w-full space-y-4 shadow-xl">
              
              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                <span className="text-[10px] font-condensed tracking-widest text-muted-foreground uppercase">TELEMETRÍA REAL</span>
                <span className="text-[10px] font-mono text-primary font-bold">PLAYERS DIRECTORY</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">JUGADORES</h4>
                  <span className="text-3xl font-display font-black text-foreground">{jugadores.length}</span>
                </div>
                <div>
                  <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">DEMARCACIÓN</h4>
                  <span className="text-3xl font-display font-black text-primary truncate max-w-[80px]" title={posicion}>{posicion.toUpperCase()}</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed font-sans font-light">
                Perfiles de competidores con contratos activos, posiciones tácticas y estadísticas de rendimiento.
              </p>

              <button 
                onClick={() => { setSearch(''); setPosicion('todas'); setCurrentPage(1); }}
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
        <div className="filter-panel max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Buscador */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block font-mono">
              🔍 BUSCAR JUGADOR
            </label>
            <input 
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Buscar por Nombre, Gamertag o EA ID..."
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
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 min-h-[300px] border border-border/40 bg-card/25 backdrop-blur-md rounded-2xl w-full col-span-full">
            <Spinner size="xl" />
            <p className="mt-4 text-xs font-condensed font-bold text-muted-foreground tracking-[0.2em] uppercase animate-pulse">
              Cargando directores y plantilla de jugadores...
            </p>
          </div>
        ) : jugadores.length > 0 ? (
          <div className="space-y-16">
            {(() => {
              const groups = {
                GK: { title: '🧤 Porteros / Arqueros', desc: 'Protectores de los tres palos bajo el arco', items: [] },
                DEF: { title: '🛡️ Bloque Defensivo', desc: 'Línea defensiva y murallas impenetrables de la saga', items: [] },
                MED: { title: '🧠 Sala de Máquinas (Mediocentro)', desc: 'Directores tácticos, contenciones e ideas creativas', items: [] },
                DEL: { title: '⚡ Artillería Ofensiva (Delanteros)', desc: 'Extremos veloces y goleadores letales del área rival', items: [] },
                OTROS: { title: '🎮 Demarcaciones Especiales', desc: 'Competidores con roles o demarcaciones alternativas', items: [] }
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
                      {group.items.map((jugador, index) => (
                        <Link 
                          to={`/jugadores/${jugador.id}`}
                          key={jugador.id} 
                          className={`group glass-card-hover ${getPosClass(key)} p-5 relative overflow-hidden flex flex-col justify-between gap-4 cursor-pointer block animate-fade-in-up`}
                          style={{ animationDelay: `${index * 0.06}s` }}
                        >
                          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

                          <div className="space-y-3 z-10">
                            <div className="flex items-center gap-3">
                              {jugador.foto ? (
                                <img 
                                  src={jugador.foto.startsWith('http') ? jugador.foto : `http://localhost:8000${jugador.foto}`} 
                                  alt={jugador.name} 
                                  className="w-10 h-10 rounded-xl object-cover border border-border/40 shrink-0 group-hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/10 to-destructive/10 border border-border/40 flex items-center justify-center font-display font-black text-primary text-sm shadow-inner uppercase shrink-0 group-hover:scale-110 transition-transform duration-300">
                                  {jugador.name?.charAt(0)}
                                </div>
                              )}
                              
                              <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                  {jugador.name}
                                </h3>
                                <span className="text-[10px] font-bold font-mono text-primary uppercase block truncate">
                                  🎮 {jugador.gamertag || 'EA ID'}
                                </span>
                              </div>
                            </div>

                            <div className="h-px bg-border/40"></div>

                            <div className="space-y-1.5 text-[11px] text-muted-foreground font-semibold">
                              <div className="flex justify-between">
                                <span>Rol Principal:</span>
                                <span className="text-foreground capitalize">{jugador.role || jugador.rol || 'Jugador'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Posición Táctica:</span>
                                <span className="text-foreground capitalize font-bold">{jugador.posicion || 'MC'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Contacto:</span>
                                <span className="text-foreground truncate max-w-[120px] font-mono">{jugador.email}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-4">
                <button 
                  disabled={currentPage === 1 || loading}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="pagination-btn"
                >
                  ⬅ Anterior
                </button>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Página {currentPage} de {totalPages}
                </span>
                <button 
                  disabled={currentPage === totalPages || loading}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="pagination-btn"
                >
                  Siguiente ➡️
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="border border-border/60 bg-muted/25 rounded-2xl p-16 flex flex-col items-center text-center max-w-2xl mx-auto gap-6 shadow-sm animate-fade-in-up">
            <span className="text-3xl">👤</span>
            <div className="space-y-2">
              <h2 className="text-xl font-display font-black tracking-wide text-foreground uppercase">Sin Competidores</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Actualmente no figuran jugadores ni competidores registrados en el sistema.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
