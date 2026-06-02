import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '@/api/axios';
import Badge from '@/components/ui/Badge';


export default function Equipos() {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEquipos, setTotalEquipos] = useState(0);

  const [search, setSearch] = useState('');
  const [plataforma, setPlataforma] = useState('todas');

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchEquipos = async () => {
      setLoading(true);
      try {
        const response = await api.get('/equipos', {
          params: { 
            page: currentPage, 
            per_page: 9,
            search: search || undefined,
            plataforma: plataforma !== 'todas' ? plataforma : undefined
          }
        });
        const resData = response.data;
        setEquipos(resData.data || resData || []);
        setTotalPages(resData.meta?.last_page || resData.last_page || 1);
        setTotalEquipos(resData.meta?.total || resData.total || 0);
      } catch (error) {
        console.error("Error al obtener lista de clubes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEquipos();
  }, [currentPage, search, plataforma]);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8000${path}`;
  };

  const platformConfig = {
    PS5:  { label: 'PS5',  icon: '🎮', color: 'text-blue-400',   bg: 'bg-blue-500/10',  border: 'border-blue-500/25',  glow: 'shadow-[0_0_12px_rgba(59,130,246,0.2)]' },
    PS4:  { label: 'PS4',  icon: '🎮', color: 'text-blue-500',   bg: 'bg-blue-600/10',  border: 'border-blue-600/25',  glow: 'shadow-[0_0_12px_rgba(37,99,235,0.2)]' },
    XBOX: { label: 'XBOX', icon: '🟢', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.2)]' },
    PC:   { label: 'PC',   icon: '🖥️', color: 'text-amber-400',  bg: 'bg-amber-500/10', border: 'border-amber-500/25', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]' },
  };

  const getPlatConfig = (plat) => {
    const p = (plat || '').toUpperCase();
    if (p.includes('PS5')) return platformConfig.PS5;
    if (p.includes('PS4')) return platformConfig.PS4;
    if (p.includes('XBOX')) return platformConfig.XBOX;
    if (p.includes('PC')) return platformConfig.PC;
    return { label: plat || 'N/A', icon: '🌐', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/25', glow: '' };
  };

  const platforms = [
    { id: 'todas', label: 'Todos', icon: '🌎' },
    { id: 'PS5',   label: 'PS5',   icon: '🎮' },
    { id: 'PS4',   label: 'PS4',   icon: '🎮' },
    { id: 'XBOX',  label: 'Xbox',  icon: '🟢' },
    { id: 'PC',    label: 'PC',    icon: '🖥️' },
  ];

  // Pagination range
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  const activeFilters = plataforma !== 'todas' || search.length > 0;

  return (
    <div className="relative min-h-screen bg-background pb-16 overflow-hidden">
      {/* Resplandores ambientales e-sports */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-primary/8 blur-[130px] rounded-full pointer-events-none z-10"></div>
      <div className="absolute bottom-1/3 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-10"></div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 pt-32 md:pt-40 pb-16 overflow-hidden">
        
        {/* Background brush words */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
          <span className="absolute top-10 left-10 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[2px] float-brush-1">
            CLUBES
          </span>
          <span className="absolute bottom-10 right-20 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[3px] float-brush-2">
            ESCUADRAS
          </span>
          <span className="absolute top-1/2 left-1/3 -translate-y-1/2 text-[10rem] md:text-[15rem] font-display font-black uppercase text-foreground/[0.01] dark:text-foreground/[0.02] blur-[4px]">
            COMPETIR
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16 items-center relative z-10">
          
          {/* LEFT — Main impact */}
          <div className="lg:col-span-7 relative flex flex-col items-start gap-4 animate-fade-in-up">
            
            {/* Giant transparent number */}
            <div className="absolute -top-16 -left-12 text-[15rem] md:text-[23rem] font-display font-black text-foreground/[0.035] dark:text-foreground/[0.045] select-none leading-none pointer-events-none font-extrabold tracking-tighter">
              {totalEquipos || equipos.length || 24}
            </div>

            <Badge 
              variant="primary" 
              className="px-5 py-2 text-[10px] font-condensed tracking-[0.2em] text-primary border border-primary/30 bg-primary/10 rounded-full shadow-[0_0_20px_hsla(var(--primary),0.15)] uppercase animate-pulse shrink-0 z-10"
            >
              🔥 Directorio de Escuadras
            </Badge>

            <h1 className="text-6xl sm:text-8xl md:text-9xl font-display font-black text-foreground uppercase tracking-[0.01em] leading-[0.82] drop-shadow-2xl z-10 mt-2 select-none">
              CLUBES <br />
              <span className="text-primary tracking-tight font-black shimmer-text">
                VIGENTES.
              </span>
            </h1>

            <p className="text-xs md:text-sm text-muted-foreground font-sans max-w-xl leading-relaxed tracking-wide font-light z-10 mt-2">
              Conoce todas las organizaciones, clubes Pro Clubs de élite y plantillas oficiales que disputan los campeonatos de RaconPro.
            </p>
          </div>

          {/* RIGHT — Tactical Info Panel */}
          <div className="lg:col-span-3 flex flex-col justify-center items-start lg:items-stretch gap-6 z-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="border border-border/40 bg-card/45 backdrop-blur-md rounded-2xl p-6 w-full space-y-4 shadow-xl">
              
              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                <span className="text-[10px] font-condensed tracking-widest text-muted-foreground uppercase">TELEMETRÍA REAL</span>
                <span className="text-[10px] font-mono text-primary font-bold">CLUBS DIRECTORY</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">CLUBES</h4>
                  <span className="text-3xl font-display font-black text-foreground">{totalEquipos || equipos.length}</span>
                </div>
                <div>
                  <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">PLATAFORMA</h4>
                  <span className="text-3xl font-display font-black text-primary truncate max-w-[80px]" title={plataforma}>{plataforma.toUpperCase()}</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed font-sans font-light">
                Base de datos completa con historiales de escuadras vigentes y fichajes aprobados.
              </p>

              <button 
                onClick={() => { setSearch(''); setPlataforma('todas'); setCurrentPage(1); }}
                className="w-full py-4 text-xs font-condensed tracking-widest uppercase rounded-lg text-primary-foreground font-black cursor-pointer btn-glossy"
              >
                REINICIAR BÚSQUEDA
              </button>
            </div>
          </div>

        </div>

      </section>

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 space-y-10">

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* FILTERS                                                        */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="filter-panel space-y-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          
          {/* Search bar */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block font-mono">
              🔍 BUSCAR ESCUADRA
            </label>
            <div className="relative">
              <input 
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Escribe el nombre, abreviación o tag del club..."
                className="input-premium w-full pr-10"
              />
              {search && (
                <button 
                  onClick={() => { setSearch(''); setCurrentPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Platform chip filters */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block font-mono">
              🎮 PLATAFORMA / CONSOLA
            </label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setPlataforma(p.id); setCurrentPage(1); }}
                  className={`
                    px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all duration-300 cursor-pointer
                    ${plataforma === p.id
                      ? 'bg-primary/15 border-primary/40 text-primary shadow-[0_0_15px_hsla(var(--primary),0.15)]'
                      : 'bg-card/30 border-border/40 text-muted-foreground hover:border-border hover:text-foreground hover:bg-card/50'
                    }
                  `}
                >
                  <span className="mr-1.5">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active filter summary */}
          {activeFilters && (
            <div className="flex items-center justify-between border-t border-border/30 pt-3">
              <span className="text-[10px] text-muted-foreground">
                Mostrando <span className="text-foreground font-bold">{totalEquipos || equipos.length}</span> club(es)
                {plataforma !== 'todas' && <> en <span className="text-primary font-bold">{plataforma}</span></>}
                {search && <> que contienen "<span className="text-primary font-bold">{search}</span>"</>}
              </span>
              <button
                onClick={() => { setSearch(''); setPlataforma('todas'); setCurrentPage(1); }}
                className="text-[10px] font-bold text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* CONTENT                                                        */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {loading ? (
          /* Skeleton Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer rounded-2xl overflow-hidden" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="h-36 bg-muted/20"></div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-muted/30"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted/30 rounded w-3/4"></div>
                      <div className="h-3 bg-muted/20 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-muted/20 rounded w-full"></div>
                  <div className="h-3 bg-muted/15 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : equipos.length > 0 ? (
          <div className="space-y-10">
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {equipos.map((eq, index) => {
                const platCfg = getPlatConfig(eq.plataforma);
                const jugadoresCount = eq.jugadores_count || eq.jugadores?.length || 0;
                const orgName = eq.organizacion?.nombre || eq.competencia?.temporada?.organizacion?.nombre || null;

                return (
                  <Link 
                    to={`/equipos/${eq.id}`}
                    key={eq.id} 
                    className="group relative overflow-hidden flex flex-col cursor-pointer animate-fade-in-up rounded-2xl"
                    style={{ 
                      animationDelay: `${index * 0.06}s`,
                    }}
                  >
                    {/* Card wrapper with glassmorphism */}
                    <div className="relative h-full flex flex-col bg-card/20 backdrop-blur-md border border-border/40 rounded-2xl shadow-lg overflow-hidden transition-all duration-500 group-hover:border-primary/40 group-hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.4),0_0_30px_hsla(var(--primary),0.1)] group-hover:-translate-y-2 group-hover:scale-[1.01]">
                      
                      {/* Banner */}
                      <div className="relative h-36 w-full overflow-hidden">
                        {eq.banner ? (
                          <img 
                            src={getImageUrl(eq.banner)}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-card to-card"></div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent"></div>
                        
                        {/* Platform badge floating on banner */}
                        <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-mono font-black tracking-wider uppercase border backdrop-blur-sm ${platCfg.bg} ${platCfg.color} ${platCfg.border} ${platCfg.glow}`}>
                          <span>{platCfg.icon}</span>
                          {platCfg.label}
                        </div>

                        {/* Scan line effect on hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" style={{ animation: 'scanline 3s linear infinite' }}></div>
                        </div>
                      </div>

                      {/* Logo + Info */}
                      <div className="relative px-5 -mt-10 z-10">
                        <div className="flex items-end gap-4">
                          {/* Club shield */}
                          <div className="w-[4.5rem] h-[4.5rem] rounded-xl overflow-hidden border-[3px] border-background shadow-xl bg-card shrink-0 transition-all duration-500 group-hover:shadow-[0_0_20px_hsla(var(--primary),0.25)] group-hover:border-primary/40 group-hover:scale-105">
                            {eq.logo ? (
                              <img 
                                src={getImageUrl(eq.logo)} 
                                alt={eq.nombre} 
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-primary to-destructive flex items-center justify-center font-display font-black text-primary-foreground text-xl uppercase">${eq.abreviatura || eq.nombre?.charAt(0)}</div>`; }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary to-destructive flex items-center justify-center font-display font-black text-primary-foreground text-xl uppercase">
                                {eq.abreviatura || eq.nombre?.charAt(0)}
                              </div>
                            )}
                          </div>

                          {/* Name + abbreviation */}
                          <div className="flex-1 min-w-0 pb-1">
                            <h3 className="font-display font-black text-2xl text-foreground uppercase tracking-wide leading-none truncate group-hover:text-primary transition-colors duration-300">
                              {eq.nombre}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge className="bg-muted/50 border border-border/50 text-[9px] font-bold font-mono px-2 py-0.5">
                                {eq.abreviatura || 'CLUB'}
                              </Badge>
                              {orgName && (
                                <span className="text-[9px] text-muted-foreground font-condensed tracking-wider truncate">
                                  {orgName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Description + stats */}
                      <div className="px-5 pt-4 pb-5 flex-1 flex flex-col justify-between gap-3">
                        <p className="text-[11px] text-muted-foreground leading-relaxed font-sans line-clamp-2">
                          {eq.descripcion || 'Escuadra competitiva e-sports oficial inscrita en los circuitos de RaconPro.'}
                        </p>

                        {/* Stats row */}
                        <div className="flex items-center gap-3 border-t border-border/30 pt-3">
                          {jugadoresCount > 0 && (
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <svg className="w-3.5 h-3.5 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="font-bold">{jugadoresCount}</span> jugador{jugadoresCount !== 1 ? 'es' : ''}
                            </div>
                          )}
                          <div className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-primary font-mono tracking-widest uppercase group-hover:gap-3 transition-all duration-300">
                            <span>VER FICHA</span>
                            <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* PAGINATION                                                  */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-4 animate-fade-in-up">
                {/* Previous */}
                <button 
                  disabled={currentPage === 1 || loading}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="pagination-btn flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Anterior
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {pageNumbers[0] > 1 && (
                    <>
                      <button onClick={() => setCurrentPage(1)} className="pagination-btn !px-3.5 !py-2">1</button>
                      {pageNumbers[0] > 2 && <span className="text-muted-foreground text-xs px-1">···</span>}
                    </>
                  )}
                  {pageNumbers.map(num => (
                    <button
                      key={num}
                      onClick={() => setCurrentPage(num)}
                      className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all duration-300 cursor-pointer ${
                        num === currentPage
                          ? 'bg-primary/15 border-primary/40 text-primary shadow-[0_0_15px_hsla(var(--primary),0.15)] font-black'
                          : 'bg-card/30 border-border/40 text-muted-foreground hover:border-border hover:text-foreground'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  {pageNumbers[pageNumbers.length - 1] < totalPages && (
                    <>
                      {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="text-muted-foreground text-xs px-1">···</span>}
                      <button onClick={() => setCurrentPage(totalPages)} className="pagination-btn !px-3.5 !py-2">{totalPages}</button>
                    </>
                  )}
                </div>

                {/* Next */}
                <button 
                  disabled={currentPage === totalPages || loading}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="pagination-btn flex items-center gap-1.5"
                >
                  Siguiente
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="border border-border/50 bg-card/20 backdrop-blur-md rounded-2xl p-16 flex flex-col items-center text-center max-w-2xl mx-auto gap-6 shadow-lg animate-fade-in-up">
            <div className="w-20 h-20 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-center">
              <svg className="w-10 h-10 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-display font-black tracking-wide text-foreground uppercase">
                {search || plataforma !== 'todas' ? 'Sin resultados' : 'Sin Clubes Fundados'}
              </h2>
              <p className="text-sm text-muted-foreground max-w-md">
                {search || plataforma !== 'todas' 
                  ? 'No se encontraron clubes con los filtros seleccionados. Intenta ampliar tu búsqueda.'
                  : 'Actualmente no figuran escuadras ni clubes oficiales registrados en el directorio de la liga.'
                }
              </p>
            </div>
            {(search || plataforma !== 'todas') && (
              <button
                onClick={() => { setSearch(''); setPlataforma('todas'); setCurrentPage(1); }}
                className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border border-primary/30 text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground transition-all duration-300 cursor-pointer"
              >
                Limpiar filtros y ver todos
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
