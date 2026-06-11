import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/api/axios';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';


export default function Organizaciones() {
  const [organizaciones, setOrganizaciones] = useState([]);
  const [competencias, setCompetencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tipoParam = searchParams.get('tipo') || 'todas';

  // Load organizations and competitions in parallel from backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [orgsRes, compsRes] = await Promise.all([
          api.get('/organizaciones', { params: { tipo: tipoParam, per_page: 100 } }),
          api.get('/competencias').catch(() => ({ data: [] }))
        ]);
        
        const orgsData = orgsRes.data?.data || orgsRes.data || [];
        const compsData = compsRes.data?.data || compsRes.data || [];
        
        setOrganizaciones(orgsData);
        setCompetencias(compsData);
      } catch (error) {
        console.error("Error al cargar datos públicos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tipoParam]);

  // Map dynamic organization and competition logos for the infinite scrolling ticker
  const tickerLogos = useMemo(() => {
    const items = [];
    
    // Pull logos from organizations and their active season competitions
    organizaciones.forEach(org => {
      // 1. Add organization logo if present
      if (org.logo) {
        const orgLogoUrl = org.logo.startsWith('http') 
          ? org.logo 
          : (typeof window.mediaUrl === 'function' 
              ? window.mediaUrl(org.logo) 
              : `${api.defaults.baseURL?.replace(/\/api$/, '') }${org.logo}`);
        
        if (!items.some(item => item.logo === orgLogoUrl)) {
          items.push({
            nombre: org.nombre,
            logo: orgLogoUrl
          });
        }
      }

      // 2. Add competition logos from active season
      const activeSeason = org.temporadas?.find(t => t.activa) || org.temporadas?.[0];
      if (activeSeason) {
        const isTodas = tipoParam === 'todas';
        const is11v11 = tipoParam === '11v11';
        const isUt = tipoParam === 'ut' || tipoParam === 'UT';

        if (isTodas || is11v11) {
          activeSeason.competencias?.forEach(comp => {
            if (comp.logo) {
              const compLogoUrl = comp.logo.startsWith('http') 
                ? comp.logo 
                : (typeof window.mediaUrl === 'function' 
                    ? window.mediaUrl(comp.logo) 
                    : `${api.defaults.baseURL?.replace(/\/api$/, '') }${comp.logo}`);
              
              if (!items.some(item => item.logo === compLogoUrl)) {
                items.push({
                  nombre: comp.nombre,
                  logo: compLogoUrl
                });
              }
            }
          });
        }

        if (isTodas || isUt) {
          const compsUt = activeSeason.competenciasUt || activeSeason.competencias_ut || [];
          compsUt.forEach(comp => {
            if (comp.logo) {
              const compLogoUrl = comp.logo.startsWith('http') 
                ? comp.logo 
                : (typeof window.mediaUrl === 'function' 
                    ? window.mediaUrl(comp.logo) 
                    : `${api.defaults.baseURL?.replace(/\/api$/, '') }${comp.logo}`);
              
              if (!items.some(item => item.logo === compLogoUrl)) {
                items.push({
                  nombre: comp.nombre,
                  logo: compLogoUrl
                });
              }
            }
          });
        }
      }
    });

    if (items.length === 0) {
      return [
        { nombre: 'Comunidad AMC', logo: '🛡️' },
        { nombre: 'Copa AMC Elite', logo: '🏆' },
        { nombre: 'Primera División', logo: '⚡' },
        { nombre: 'Segunda División', logo: '⚔️' },
        { nombre: 'Confederación Torneos Pro FC', logo: '🛡️' },
        { nombre: 'Playoffs de Ascenso', logo: '🔥' }
      ];
    }
    return items;
  }, [organizaciones, tipoParam]);

  // Map database organizations and augment with premium eSports stats & banners
  const mappedLeagues = useMemo(() => {
    return organizaciones.map((org, index) => {
      let totalDivisions = 0;
      const uniqueClubs = new Set();
      let totalMatches = 0;

      org.temporadas?.forEach(temp => {
        const isTodas = tipoParam === 'todas';
        const is11v11 = tipoParam === '11v11';
        const isUt = tipoParam === 'ut' || tipoParam === 'UT';

        if (isTodas || is11v11) {
          temp.competencias?.forEach(comp => {
            totalDivisions++;
            comp.equipos?.forEach(eq => {
              uniqueClubs.add(eq.id);
            });
            totalMatches += comp.partidos?.length || 0;
          });
        }

        if (isTodas || isUt) {
          const compsUt = temp.competenciasUt || temp.competencias_ut || [];
          compsUt.forEach(comp => {
            totalDivisions++;
            comp.equipos?.forEach(eq => {
              uniqueClubs.add(eq.id);
            });
            totalMatches += comp.partidos?.length || 0;
          });
        }
      });
      
      return {
        id: org.id,
        nombre: org.nombre || 'Confederación eSports',
        descripcion: org.descripcion || 'Esta confederación organiza torneos de alto rendimiento deportivo e integración de clubes profesionales.',
        logo: org.logo ? (org.logo.startsWith('http') ? org.logo : (typeof window.mediaUrl === 'function' ? window.mediaUrl(org.logo) : `${api.defaults.baseURL?.replace(/\/api$/, '') }${org.logo}`)) : '',
        region: org.pais ? org.pais.toUpperCase() : 'GLOBAL',
        clubs: uniqueClubs.size || 0,
        matches: totalMatches || 0,
        players: (uniqueClubs.size * 12) || 0, // Estimado realista de 12 jugadores por club inscrito
        divisions: totalDivisions || 0,
        bannerUrl: org.banner 
          ? (org.banner.startsWith('http') ? org.banner : (typeof window.mediaUrl === 'function' ? window.mediaUrl(org.banner) : `${api.defaults.baseURL?.replace(/\/api$/, '') }${org.banner}`))
          : (index % 3 === 0 
            ? 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop'
            : index % 3 === 1 
            ? 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600&auto=format&fit=crop'
            : 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop')
      };
    });
  }, [organizaciones, tipoParam]);

  // Calculate total stats for the top stats bar
  const totalStats = useMemo(() => {
    let totalLigas = mappedLeagues.length;
    let totalDivs = 0;
    const totalClubs = new Set();
    let totalMatches = 0;

    mappedLeagues.forEach(l => {
      totalDivs += l.divisions;
      totalMatches += l.matches;
    });

    // Accumulate total unique clubs across all organizations in DB
    organizaciones.forEach(org => {
      org.temporadas?.forEach(temp => {
        const isTodas = tipoParam === 'todas';
        const is11v11 = tipoParam === '11v11';
        const isUt = tipoParam === 'ut' || tipoParam === 'UT';

        if (isTodas || is11v11) {
          temp.competencias?.forEach(comp => {
            comp.equipos?.forEach(eq => {
              totalClubs.add(eq.id);
            });
          });
        }

        if (isTodas || isUt) {
          const compsUt = temp.competenciasUt || temp.competencias_ut || [];
          compsUt.forEach(comp => {
            comp.equipos?.forEach(eq => {
              totalClubs.add(eq.id);
            });
          });
        }
      });
    });

    return {
      ligas: totalLigas,
      divisiones: totalDivs,
      clubes: totalClubs.size,
      jugadores: totalClubs.size * 12
    };
  }, [mappedLeagues, organizaciones, tipoParam]);

  const scrollToDirectory = () => {
    const el = document.getElementById('directory-center');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden text-foreground selection:bg-primary selection:text-primary-foreground">




      {/* Resplandores ambientales e-sports */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-primary/8 blur-[130px] rounded-full pointer-events-none z-10"></div>
      <div className="absolute bottom-1/3 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-10"></div>

      {/* ========================================================================= */}
      {/* 1. HERO CENTRAL (Cinemático y Táctico - Todo en Español)                  */}
      {/* ========================================================================= */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 pt-32 md:pt-40 pb-16 overflow-hidden">
        
        {/* Palabras de fondo brush estilo editorial */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
          <span className="absolute top-10 left-10 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[2px] float-brush-1">
            LIGAS
          </span>
          <span className="absolute bottom-10 right-20 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[3px] float-brush-2">
            COMPETICIÓN
          </span>
          <span className="absolute top-1/2 left-1/3 -translate-y-1/2 text-[10rem] md:text-[15rem] font-display font-black uppercase text-foreground/[0.01] dark:text-foreground/[0.02] blur-[4px]">
            CLUBES
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16 items-center relative z-10">
          
          {/* LADO IZQUIERDO — IMPACTO PRINCIPAL */}
          <div className="lg:col-span-7 relative flex flex-col items-start gap-4">
            
            {/* Número gigante transparente de fondo */}
            <div className="absolute -top-16 -left-12 text-[15rem] md:text-[23rem] font-display font-black text-foreground/[0.035] dark:text-foreground/[0.045] select-none leading-none pointer-events-none font-extrabold tracking-tighter">
              {mappedLeagues.length || 11}
            </div>

            <Badge 
              variant="primary" 
              className="animate-fade-in-up px-5 py-2 text-[10px] font-condensed tracking-[0.2em] text-primary border border-primary/30 bg-primary/10 rounded-full shadow-[0_0_20px_hsla(var(--primary),0.15)] uppercase animate-pulse shrink-0 z-10"
            >
              🔥 Centro Oficial de Torneos
            </Badge>

            <h1 className="animate-fade-in-up text-4xl sm:text-8xl md:text-9xl font-display font-black text-foreground uppercase tracking-[0.01em] leading-[0.82] drop-shadow-2xl z-10 mt-2 select-none" style={{ animationDelay: '0.1s' }}>
              LIGAS. <br />
              <span className="text-primary tracking-tight font-black shimmer-text">
                UN SOLO MUNDO.
              </span>
            </h1>

            <p className="animate-fade-in-up text-xs md:text-sm text-muted-foreground font-sans max-w-xl leading-relaxed tracking-wide font-light z-10 mt-2" style={{ animationDelay: '0.2s' }}>
              Uniendo los circuitos eSports de mayor prestigio y federaciones en una sola plataforma global táctica. Vive las transferencias, divisiones competitivas y el broadcast arbitral de más alto calibre en tiempo real.
            </p>
          </div>

          {/* DERECHA — INFORMACIÓN TÁCTICA */}
          <div className="lg:col-span-3 flex flex-col justify-center items-start lg:items-stretch gap-6 z-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="border border-border/40 bg-card/45 backdrop-blur-md rounded-2xl p-6 w-full space-y-4 shadow-xl">
              
              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                <span className="text-[9px] sm:text-[10px] font-condensed tracking-widest text-muted-foreground uppercase">JORNADA OFICIAL</span>
                <span className="text-[9px] sm:text-[10px] font-mono text-primary font-bold">TRANSMISIÓN EN VIVO</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[8px] sm:text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">TEMPORADA</h4>
                  <span className="text-xl sm:text-2xl md:text-3xl font-display font-black text-foreground">TEMPORADA 45</span>
                </div>
                <div>
                  <h4 className="text-[8px] sm:text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">ETAPA ACTUAL</h4>
                  <span className="text-xl sm:text-2xl md:text-3xl font-display font-black text-primary">SEMANA 1</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed font-sans font-light">
                Circuitos profesionales integrados con ascensos, descensos directos y control de plantillas.
              </p>

              <button 
                onClick={scrollToDirectory}
                className="w-full py-4 text-xs font-condensed tracking-widest uppercase rounded-lg text-primary-foreground font-black cursor-pointer btn-glossy"
              >
                VER LIGAS
              </button>
            </div>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 2. BARRA DE MÉTRICAS TÁCTICAS (Stats Bar - En Español)                     */}
      {/* ========================================================================= */}
      <section className="relative z-20 border-y border-border/45 bg-card/25 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 md:divide-x md:divide-border/30 text-center">
          {[
            { num: String(totalStats.ligas), label: 'LIGAS ACTIVAS' },
            { num: String(totalStats.divisiones), label: 'DIVISIONES' },
            { num: String(totalStats.clubes), label: 'CLUBES REGISTRADOS' },
            { num: totalStats.jugadores >= 1000 ? `${(totalStats.jugadores / 1000).toFixed(1)}K` : String(totalStats.jugadores), label: 'JUGADORES COMPETIDORES' }
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center gap-1.5 md:px-4">
              <span className="text-4xl sm:text-5xl font-display font-black text-foreground tracking-tight hover:text-primary transition-colors duration-300 animate-count-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                {stat.num}
              </span>
              <span className="text-[9px] font-condensed font-black tracking-[0.2em] text-muted-foreground uppercase">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. LOGO TICKER DINÁMICO (Logos de las Organizaciones y Competencias Reales) */}
      {/* ========================================================================= */}
      <div className="relative z-20 border-b border-border/30 bg-muted/20 py-5 overflow-hidden">
        <div className="animate-scroll-ticker gap-16 font-condensed font-black text-xs uppercase tracking-[0.15em] items-center">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-16 shrink-0 items-center">
              {tickerLogos.map((badge, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-3.5 opacity-90 hover:opacity-100 transition-all duration-300 transform hover:scale-110 cursor-pointer"
                >
                  {badge.logo.startsWith('http') ? (
                    <img 
                      src={badge.logo} 
                      alt={badge.nombre} 
                      className="w-8 h-8 rounded-lg object-cover border border-border/40 shadow-inner bg-card"
                    />
                  ) : (
                    <span className="text-xl bg-card border border-border/40 p-2 rounded-lg flex items-center justify-center shadow-inner">
                      {badge.logo}
                    </span>
                  )}
                  <span className="font-display tracking-widest text-foreground font-black text-sm">{badge.nombre}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DIRECTORIO SIN FILTROS (Directory Center - En Español)                  */}
      {/* ========================================================================= */}
      <section id="directory-center" className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 py-24 space-y-12">
        
        {/* Encabezado del Directorio */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/30 pb-6">
          <div className="space-y-3">
            <span className="text-xs font-condensed font-black text-primary tracking-[0.25em] uppercase block">
              🛡️ COMPILACIÓN GENERAL
            </span>
            <h2 className="text-4xl md:text-6xl font-display font-black uppercase text-foreground leading-none tracking-tight">
              ÍNDICE DE LIGAS <span className="bg-clip-text bg-gradient-to-r from-primary to-foreground text-transparent shimmer-text">COMPETITIVAS.</span>
            </h2>
          </div>
          
          {/* Tabs Premium de Filtrado por Tipo */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex bg-muted/40 p-0.5 rounded-xl border border-border/40 gap-0.5 select-none shrink-0">
              <button
                onClick={() => setSearchParams({ tipo: 'todas' })}
                className={`px-3.5 py-2 rounded-lg text-[10px] font-condensed tracking-wider uppercase whitespace-nowrap transition-all duration-300 relative cursor-pointer font-black ${
                  tipoParam === 'todas'
                    ? 'text-white bg-gradient-to-r from-primary to-destructive shadow-[0_0_12px_rgba(232,0,29,0.3)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                🌐 Todas
              </button>
              <button
                onClick={() => setSearchParams({ tipo: '11v11' })}
                className={`px-3.5 py-2 rounded-lg text-[10px] font-condensed tracking-wider uppercase whitespace-nowrap transition-all duration-300 relative cursor-pointer font-black ${
                  tipoParam === '11v11'
                    ? 'text-white bg-gradient-to-r from-primary to-destructive shadow-[0_0_12px_rgba(232,0,29,0.3)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                🛡️ 11v11
              </button>
              <button
                onClick={() => setSearchParams({ tipo: 'ut' })}
                className={`px-3.5 py-2 rounded-lg text-[10px] font-condensed tracking-wider uppercase whitespace-nowrap transition-all duration-300 relative cursor-pointer font-black ${
                  tipoParam === 'ut' || tipoParam === 'UT'
                    ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                🎮 UT 1v1/2v2
              </button>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4.5 py-2 shrink-0">
              <span className="text-[10px] font-condensed tracking-widest font-black text-primary uppercase">
                🏆 {mappedLeagues.length} {tipoParam === 'ut' || tipoParam === 'UT' ? 'UT' : tipoParam === '11v11' ? '11v11' : 'ACTIVAS'}
              </span>
            </div>
          </div>
        </div>

        {/* Pequeña barra informativa */}
        <div className="flex items-center justify-between border-b border-border/10 pb-2">
          <span className="text-[10px] font-mono text-muted-foreground uppercase">
            Mostrando todos los circuitos y confederaciones habilitados en tiempo real
          </span>
        </div>

        {/* Grilla de ligas directas (Sin filtros de píldoras regionales) */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 min-h-[300px] border border-border/40 bg-card/25 backdrop-blur-md rounded-2xl">
            <Spinner size="xl" />
            <p className="mt-4 text-xs font-condensed font-bold text-muted-foreground tracking-[0.2em] uppercase animate-pulse">
              Sincronizando confederaciones y circuitos...
            </p>
          </div>
        ) : mappedLeagues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mappedLeagues.map((league) => (
              <div 
                key={league.id} 
                className="group border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl flex flex-col justify-between overflow-hidden shadow-lg relative league-card-interactive scanlines animate-fade-in-up"
                style={{ animationDelay: `${mappedLeagues.indexOf(league) * 0.08}s` }}
              >
                {/* Ruido digital y scanlines de fondo */}
                <div className="absolute inset-0 tactical-noise pointer-events-none z-10 opacity-[0.6]"></div>
                
                {/* BANNER DE CABECERA DE LA TARJETA */}
                <div className="relative h-44 w-full overflow-hidden border-b border-border/45">
                  <img 
                    src={league.bannerUrl} 
                    alt={league.nombre}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent z-10"></div>
                  
                  {/* Badge de región transparente de fondo */}
                  <div className="absolute right-4 top-4 text-8xl font-display font-black text-white/5 select-none leading-none z-10 pointer-events-none group-hover:scale-105 transition-transform duration-500">
                    {league.region}
                  </div>

                  <div className="absolute bottom-4 left-6 z-20 flex items-center gap-4">
                    {league.logo ? (
                      <img 
                        src={league.logo} 
                        alt={league.nombre} 
                        className="w-14 h-14 rounded-xl object-cover border-2 border-border bg-muted/20 shadow-xl"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-destructive/30 border-2 border-primary/40 flex items-center justify-center font-display font-black text-primary text-2xl shadow-xl">
                        {league.nombre?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <span className="text-[9px] font-condensed tracking-widest text-primary font-black uppercase">
                        CIRCUITO ID: #{league.id}
                      </span>
                      <h3 className="font-display font-black text-2xl text-foreground uppercase tracking-wide group-hover:text-primary transition-colors leading-tight">
                        {league.nombre}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* CONTENIDO ESTADÍSTICO DE LA TARJETA */}
                <div className="p-6 space-y-5 relative z-10">
                  <p className="text-[11px] text-muted-foreground leading-relaxed h-11 overflow-hidden font-sans font-light">
                    {league.descripcion}
                  </p>

                  <div className="w-full h-px bg-border/40"></div>

                  {/* CUADRO DE ESTADÍSTICAS TÁCTICAS */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-border/30 bg-muted/10 p-2.5 rounded-xl text-center">
                      <span className="text-2xl font-display font-black text-foreground block">
                        {league.clubs}
                      </span>
                      <span className="text-[8px] font-condensed text-muted-foreground uppercase font-bold tracking-widest">
                        CLUBES REGISTRADOS
                      </span>
                    </div>
                    <div className="border border-border/30 bg-muted/10 p-2.5 rounded-xl text-center">
                      <span className="text-2xl font-display font-black text-foreground block">
                        {league.players}
                      </span>
                      <span className="text-[8px] font-condensed text-muted-foreground uppercase font-bold tracking-widest">
                        COMPETIDORES
                      </span>
                    </div>
                    <div className="border border-border/30 bg-muted/10 p-2.5 rounded-xl text-center">
                      <span className="text-2xl font-display font-black text-foreground block">
                        {league.matches}
                      </span>
                      <span className="text-[8px] font-condensed text-muted-foreground uppercase font-bold tracking-widest">
                        PARTIDOS EN BASE DE DATOS
                      </span>
                    </div>
                    <div className="border border-border/30 bg-muted/10 p-2.5 rounded-xl text-center">
                      <span className="text-2xl font-display font-black text-primary block">
                        {league.divisions}
                      </span>
                      <span className="text-[8px] font-condensed text-primary uppercase font-bold tracking-widest">
                        DIVISIONES ACTIVAS
                      </span>
                    </div>
                  </div>
                </div>

                {/* PIE DE LA TARJETA */}
                <div className="px-6 pb-6 pt-2 relative z-10 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-t border-border/30 pt-4.5">
                    <span className="text-[9px] font-condensed font-black tracking-widest text-muted-foreground uppercase">
                      CANALES DE TRANSMISIÓN
                    </span>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <a href="https://twitch.tv" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors font-bold uppercase hover:underline hover:underline-offset-4">Twitch</a>
                      <span>•</span>
                      <a href="https://discord.gg" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors font-bold uppercase hover:underline hover:underline-offset-4">Discord</a>
                    </div>
                  </div>

                  <Button 
                    onClick={() => navigate(`/organizaciones/${league.id}`)}
                    className="w-full h-10 text-[10px] font-sans font-bold uppercase tracking-wider bg-primary text-primary-foreground border border-transparent hover:bg-primary/90 hover:shadow-[0_0_15px_hsl(var(--primary)/0.35)] transition-all duration-300"
                  >
                    📅 VER TEMPORADAS ACTIVAS
                  </Button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-16 flex flex-col items-center text-center max-w-xl mx-auto gap-6 shadow-lg relative scanlines">
            <div className="absolute inset-0 tactical-noise pointer-events-none z-10 opacity-30"></div>
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-4xl shadow-inner relative z-20">🏆</div>
            <div className="space-y-3 relative z-20">
              <h2 className="text-2xl font-display font-black tracking-wide text-foreground uppercase">Sin Organizaciones Registradas</h2>
              <p className="text-xs text-muted-foreground max-w-sm">
                Actualmente no se registran confederaciones competitivas públicas en la base de datos de Torneos Pro FC.
              </p>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
