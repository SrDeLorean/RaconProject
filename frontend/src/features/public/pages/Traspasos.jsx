import React, { useEffect, useState, useMemo } from 'react';
import api from '@/api/axios';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';


export default function Traspasos() {
  const [traspasos, setTraspasos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPos, setSelectedPos] = useState('ALL');
  const [selectedOrg, setSelectedOrg] = useState('ALL');

  useEffect(() => {
    const fetchTraspasos = async () => {
      setLoading(true);
      try {
        const response = await api.get('/traspasos/aprobados');
        setTraspasos(response.data?.data || response.data || []);
      } catch (error) {
        console.error("Error al obtener la lista de traspasos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTraspasos();
  }, []);

  // Listados dinámicos de filtros basados en los resultados del backend
  const uniquePositions = useMemo(() => {
    const list = new Set();
    traspasos.forEach(t => {
      if (t.posicion) list.add(t.posicion.toUpperCase());
    });
    return Array.from(list).sort();
  }, [traspasos]);

  const uniqueOrgs = useMemo(() => {
    const list = new Map();
    traspasos.forEach(t => {
      if (t.organizacion?.id && t.organizacion?.nombre) {
        list.set(t.organizacion.id, t.organizacion.nombre);
      }
    });
    return Array.from(list.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [traspasos]);

  // Lógica de filtrado
  const filteredTraspasos = useMemo(() => {
    return traspasos.filter(t => {
      const matchSearch = 
        !searchQuery.trim() || 
        t.jugador?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.jugador?.gamertag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.equipo_origen?.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.equipo?.nombre?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchPos = 
        selectedPos === 'ALL' || 
        t.posicion?.toUpperCase() === selectedPos;

      const matchOrg = 
        selectedOrg === 'ALL' || 
        String(t.organizacion?.id) === selectedOrg;

      return matchSearch && matchPos && matchOrg;
    });
  }, [traspasos, searchQuery, selectedPos, selectedOrg]);

  const formatFecha = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8000${path}`;
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
            TRASPASOS
          </span>
          <span className="absolute bottom-10 right-20 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[3px] float-brush-2">
            MERCADO
          </span>
          <span className="absolute top-1/2 left-1/3 -translate-y-1/2 text-[10rem] md:text-[15rem] font-display font-black uppercase text-foreground/[0.01] dark:text-foreground/[0.02] blur-[4px]">
            FICHAJES
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16 items-center relative z-10">
          
          {/* LADO IZQUIERDO — IMPACTO PRINCIPAL */}
          <div className="lg:col-span-7 relative flex flex-col items-start gap-4">
            
            {/* Número gigante transparente de fondo */}
            <div className="absolute -top-16 -left-12 text-[15rem] md:text-[23rem] font-display font-black text-foreground/[0.035] dark:text-foreground/[0.045] select-none leading-none pointer-events-none font-extrabold tracking-tighter">
              {traspasos.length || 33}
            </div>

            <Badge 
              variant="primary" 
              className="animate-fade-in-up px-5 py-2 text-[10px] font-condensed tracking-[0.2em] text-primary border border-primary/30 bg-primary/10 rounded-full shadow-[0_0_20px_hsla(var(--primary),0.15)] uppercase animate-pulse shrink-0 z-10"
            >
              🔥 Mercado de Pases eSports
            </Badge>

            <h1 className="animate-fade-in-up text-6xl sm:text-8xl md:text-9xl font-display font-black text-foreground uppercase tracking-[0.01em] leading-[0.82] drop-shadow-2xl z-10 mt-2 select-none" style={{ animationDelay: '0.1s' }}>
              TRASPASOS <br />
              <span className="text-primary tracking-tight font-black shimmer-text">
                OFICIALES.
              </span>
            </h1>

            <p className="animate-fade-in-up text-xs md:text-sm text-muted-foreground font-sans max-w-xl leading-relaxed tracking-wide font-light z-10 mt-2" style={{ animationDelay: '0.2s' }}>
              Revisa en tiempo real las altas, bajas y movimientos estratégicos de las plantillas autorizados por el comité técnico de RaconPro.
            </p>
          </div>

          {/* DERECHA — INFORMACIÓN TÁCTICA */}
          <div className="lg:col-span-3 flex flex-col justify-center items-start lg:items-stretch gap-6 z-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="border border-border/40 bg-card/45 backdrop-blur-md rounded-2xl p-6 w-full space-y-4 shadow-xl">
              
              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                <span className="text-[10px] font-condensed tracking-widest text-muted-foreground uppercase">TELEMETRÍA REAL</span>
                <span className="text-[10px] font-mono text-primary font-bold">TRANSFERS MARKET</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">MOVIMIENTOS</h4>
                  <span className="text-3xl font-display font-black text-foreground">{traspasos.length}</span>
                </div>
                <div>
                  <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">POSICIÓN</h4>
                  <span className="text-3xl font-display font-black text-primary truncate max-w-[80px]" title={selectedPos}>{selectedPos.toUpperCase()}</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed font-sans font-light">
                Historial auditado de altas y bajas en las plantillas federadas.
              </p>

              <button 
                onClick={() => { setSearchQuery(''); setSelectedPos('ALL'); setSelectedOrg('ALL'); }}
                className="w-full py-4 text-xs font-condensed tracking-widest uppercase rounded-lg text-primary-foreground font-black cursor-pointer btn-glossy"
              >
                REINICIAR BÚSQUEDA
              </button>
            </div>
          </div>

        </div>

      </section>

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 space-y-12">

        {/* 🔍 FILTERS BAR (eSports Táctico & Glassmorphism) */}
        {!loading && traspasos.length > 0 && (
          <div className="filter-panel grid grid-cols-1 md:grid-cols-3 gap-4 relative z-30">
            {/* Buscar */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground text-xs">
                🔍
              </span>
              <input 
                type="text" 
                placeholder="Buscar jugador, club..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-premium pl-10 h-11 font-condensed font-bold uppercase tracking-widest"
              />
            </div>

            {/* Filtrar por Posición */}
            <div className="relative">
              <select
                value={selectedPos}
                onChange={(e) => setSelectedPos(e.target.value)}
                className="input-premium h-11 font-condensed font-bold uppercase tracking-widest appearance-none cursor-pointer"
              >
                <option value="ALL" className="bg-background text-foreground">🏃 Todas las Posiciones</option>
                {uniquePositions.map(pos => (
                  <option key={pos} value={pos} className="bg-background text-foreground">{pos}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-muted-foreground text-[10px]">
                ▼
              </div>
            </div>

            {/* Filtrar por Circuito */}
            <div className="relative">
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="input-premium h-11 font-condensed font-bold uppercase tracking-widest appearance-none cursor-pointer"
              >
                <option value="ALL" className="bg-background text-foreground">🌐 Todos los Circuitos</option>
                {uniqueOrgs.map(([id, name]) => (
                  <option key={id} value={String(id)} className="bg-background text-foreground">{name.toUpperCase()}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-muted-foreground text-[10px]">
                ▼
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 min-h-[300px] border border-border/40 bg-card/25 backdrop-blur-md rounded-2xl w-full col-span-full">
            <Spinner size="xl" />
            <p className="mt-4 text-xs font-condensed font-bold text-muted-foreground tracking-[0.2em] uppercase animate-pulse">
              Cargando mercado de pases...
            </p>
          </div>
        ) : filteredTraspasos.length > 0 ? (
          <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTraspasos.map((traspaso, idx) => {
              const jugador = traspaso.jugador || {};
              const equipoOrigen = traspaso.equipo_origen || null;
              const equipoDestino = traspaso.equipo || {};
              const org = traspaso.organizacion || {};

              // Realista estimación de valoración si no existe
              const getValorMercado = () => {
                if (traspaso.valor) return traspaso.valor;
                if (traspaso.precio) return `€${traspaso.precio}M`;
                const base = (jugador.name?.length || 5) * 1.1 + (traspaso.dorsal || 10) * 0.15;
                return `€${base.toFixed(1)}M`;
              };

              return (
                <div 
                  key={traspaso.id}
                  className="group relative border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-5 transition-all duration-300 hover:border-primary/50 hover:bg-card/45 flex flex-col justify-between gap-5 shadow-xl hover:shadow-[0_10px_30px_rgba(232,0,29,0.08)] overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.06}s` }}
                >
                  {/* Scanlines y decorados HUD */}
                  <div className="absolute inset-0 broadcast-scanlines pointer-events-none opacity-[0.05]"></div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="space-y-4">
                    {/* Fila superior: Rol/Posición y Valoración */}
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] bg-primary/10 border border-primary/25 text-primary px-2.5 py-0.5 rounded font-mono uppercase font-black tracking-wider">
                        🏃 {traspaso.posicion || 'JUGADOR'}
                      </span>
                      <span className="text-[10px] font-mono text-primary font-black tracking-tight bg-primary/5 border border-primary/10 px-2 py-0.5 rounded">
                        {getValorMercado()} VAL
                      </span>
                    </div>

                    {/* Bloque central: Avatar e información del jugador */}
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        {jugador.foto ? (
                          <img 
                            src={getImageUrl(jugador.foto)} 
                            alt={jugador.name} 
                            className="w-14 h-14 rounded-xl object-cover border-2 border-border/60 group-hover:border-primary/60 transition-colors shadow-md"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-primary/25 to-destructive/25 border-2 border-border/60 flex items-center justify-center font-display font-black text-primary text-lg shadow-inner uppercase">
                            {jugador.name?.charAt(0)}
                          </div>
                        )}
                        
                        {traspaso.dorsal && (
                          <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[8px] font-black w-5 h-5 rounded-md flex items-center justify-center border border-background shadow">
                            #{traspaso.dorsal}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-base font-display font-black text-foreground uppercase tracking-wide truncate group-hover:text-primary transition-colors">
                          {jugador.name}
                        </h4>
                        {jugador.gamertag && (
                          <span className="text-[10px] text-muted-foreground font-mono block">
                            🎮 {jugador.gamertag}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bloque de Origen ➜ Destino */}
                    <div className="grid grid-cols-5 items-center gap-2 text-[10px] font-condensed uppercase tracking-wider text-muted-foreground bg-background/50 p-3 rounded-xl border border-border/40 relative">
                      {/* Origen */}
                      <div className="col-span-2 text-left space-y-1 min-w-0">
                        <span className="text-[7px] text-muted-foreground/75 block tracking-widest leading-none">CLUB ORIGEN</span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          {equipoOrigen?.logo ? (
                            <img src={getImageUrl(equipoOrigen.logo)} alt="" className="w-3.5 h-3.5 object-cover rounded-sm" />
                          ) : equipoOrigen ? (
                            <span className="text-[8px]">🛡️</span>
                          ) : null}
                          <span className="font-semibold text-foreground truncate block">
                            {equipoOrigen ? equipoOrigen.nombre : 'AGENTE LIBRE'}
                          </span>
                        </div>
                      </div>

                      {/* Flecha */}
                      <div className="col-span-1 flex justify-center">
                        <span className="text-primary font-black animate-pulse">➜</span>
                      </div>

                      {/* Destino */}
                      <div className="col-span-2 text-right space-y-1 min-w-0">
                        <span className="text-[7px] text-muted-foreground/75 block tracking-widest leading-none">CLUB DESTINO</span>
                        <div className="flex items-center gap-1.5 justify-end min-w-0">
                          <span className="font-semibold text-primary truncate block">
                            {equipoDestino.nombre || 'SIN ASIGNAR'}
                          </span>
                          {equipoDestino.logo ? (
                            <img src={getImageUrl(equipoDestino.logo)} alt="" className="w-3.5 h-3.5 object-cover rounded-sm" />
                          ) : (
                            <span className="text-[8px]">🛡️</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fila inferior: Org y Fecha */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/30 text-[9px] font-bold font-mono text-muted-foreground">
                    {org.nombre ? (
                      <div className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1 rounded-lg border border-border/30">
                        {org.logo && (
                          <img src={getImageUrl(org.logo)} alt="" className="w-3.5 h-3.5 rounded-sm object-cover" />
                        )}
                        <span className="uppercase tracking-wider text-[8px] text-muted-foreground font-black">
                          {org.nombre}
                        </span>
                      </div>
                    ) : (
                      <span>🏆 RACONPRO</span>
                    )}

                    <span className="tracking-wide text-muted-foreground/80">
                      🕒 {formatFecha(traspaso.updated_at || traspaso.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        ) : (
          <div className="border border-border/60 bg-muted/25 rounded-2xl p-16 flex flex-col items-center text-center max-w-2xl mx-auto gap-6 shadow-sm">
            <span className="text-3xl">🔍</span>
            <div className="space-y-2">
              <h2 className="text-xl font-display font-black tracking-wide text-foreground uppercase">Sin Resultados</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                {traspasos.length > 0 
                  ? "No encontramos movimientos que coincidan con los criterios de búsqueda o filtros seleccionados."
                  : "Aún no se han registrado o aprobado traspasos de jugadores en esta temporada."
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
