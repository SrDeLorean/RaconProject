import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import PageLoader from '@/components/ui/PageLoader';
import Card from '@/components/shared/Card';



const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const backendBaseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:8000';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${backendBaseUrl}${cleanPath}`;
};

function computeStandings(partidos, equipos) {
  const map = {};
  equipos.forEach(eq => {
    map[eq.id] = {
      id: eq.id, nombre: eq.nombre, abreviatura: eq.abreviatura, logo: eq.logo,
      pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0,
    };
  });
  partidos.forEach(p => {
    if (p.goles_local == null || p.goles_visitante == null) return;
    const gl = p.goles_local, gv = p.goles_visitante;
    const lid = p.equipo_local_id, vid = p.equipo_visitante_id;
    if (!map[lid] || !map[vid]) return;
    map[lid].pj++; map[vid].pj++;
    map[lid].gf += gl; map[lid].gc += gv;
    map[vid].gf += gv; map[vid].gc += gl;
    if (gl > gv)      { map[lid].pg++; map[lid].pts += 3; map[vid].pp++; }
    else if (gl < gv) { map[vid].pg++; map[vid].pts += 3; map[lid].pp++; }
    else              { map[lid].pe++; map[lid].pts++; map[vid].pe++; map[vid].pts++; }
  });
  return Object.values(map).sort(
    (a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf
  );
}

export default function Temporadas() {
  const { orgId } = useParams();
  const navigate = useNavigate();

  const [organizacion, setOrganizacion] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview'); // 'Overview' | 'Divisions' | 'Champions' | 'Schedule' | 'Stats'
  const [visibleMatchesCount, setVisibleMatchesCount] = useState(20);

  // Fetch only organization detail initially
  useEffect(() => {
    const fetchOrg = async () => {
      setLoading(true);
      try {
        const orgRes = await api.get(`/organizaciones/${orgId}`);
        setOrganizacion(orgRes.data);
      } catch (error) {
        console.error("Error al obtener detalles del circuito:", error);
      } finally {
        setLoading(false);
      }
    };
    if (orgId) {
      fetchOrg();
    }
  }, [orgId]);

  // Fetch matches lazily on Schedule tab click
  useEffect(() => {
    if (activeTab === 'Schedule' && !scheduleLoaded && !loadingSchedule && orgId) {
      const fetchMatches = async () => {
        setLoadingSchedule(true);
        try {
          const matchesRes = await api.get('/partidos', { params: { organizacion_id: orgId } });
          setPartidos(matchesRes.data || []);
          setScheduleLoaded(true);
        } catch (error) {
          console.error("Error al obtener partidos del circuito:", error);
        } finally {
          setLoadingSchedule(false);
        }
      };
      fetchMatches();
    }
  }, [activeTab, orgId, scheduleLoaded, loadingSchedule]);

  // Real database stats calculated on the fly from preloaded relations
  const orgStats = useMemo(() => {
    if (!organizacion) return { divisiones: 0, clubes: 0, partidos: 0, jugadores: 0 };
    
    let totalDivs = 0;
    const uniqueClubs = new Set();
    let totalMatches = scheduleLoaded ? partidos.length : 0;

    organizacion.temporadas?.forEach(temp => {
      temp.competencias?.forEach(comp => {
        totalDivs++;
        comp.equipos?.forEach(eq => {
          uniqueClubs.add(eq.id);
        });
      });
    });

    return {
      divisiones: totalDivs,
      clubes: uniqueClubs.size,
      partidos: totalMatches,
      jugadores: uniqueClubs.size * 12 // Estimated roster size
    };
  }, [organizacion, partidos, scheduleLoaded]);

  // Active Season
  const activeSeason = useMemo(() => {
    if (!organizacion?.temporadas) return null;
    return organizacion.temporadas.find(t => t.activa) || organizacion.temporadas[0];
  }, [organizacion]);

  // Active Divisions/Competencias
  const activeDivisions = useMemo(() => {
    if (!activeSeason?.competencias) return [];
    return activeSeason.competencias;
  }, [activeSeason]);

  // Statistics/Infographics per available division in activeSeason
  const divisionStats = useMemo(() => {
    if (!activeDivisions) return [];
    return activeDivisions.map(comp => {
      const compPartidos = comp.partidos || [];
      const compEquipos = comp.equipos || [];
      
      const standings = computeStandings(compPartidos, compEquipos);
      const leader = standings[0] || null;

      const totalMatches = compPartidos.length;
      const playedMatches = compPartidos.filter(p => p.goles_local != null && p.goles_visitante != null).length;
      const progressPercent = totalMatches > 0 ? Math.round((playedMatches / totalMatches) * 100) : 0;

      let totalGoals = 0;
      compPartidos.forEach(p => {
        if (p.goles_local != null && p.goles_visitante != null) {
          totalGoals += (p.goles_local + p.goles_visitante);
        }
      });
      const avgGoals = playedMatches > 0 ? (totalGoals / playedMatches).toFixed(2) : '0.00';

      return {
        id: comp.id,
        nombre: comp.nombre,
        banner: comp.banner,
        logo: comp.logo,
        totalMatches,
        playedMatches,
        progressPercent,
        totalGoals,
        avgGoals,
        leader,
        prizePool: comp.prize_pool || '0.00',
        entryFee: comp.entry_fee || 'Gratis',
        totalTeams: compEquipos.length,
        plataforma: comp.plataforma
      };
    });
  }, [activeDivisions]);

  // Find all finalized competencies from all seasons for the Champions Tab (Salón de la Fama)
  const finalizedCompetencias = useMemo(() => {
    if (!organizacion?.temporadas) return [];
    const list = [];
    organizacion.temporadas.forEach(t => {
      t.competencias?.forEach(c => {
        if (c.estado === 'finalizada') {
          const standings = computeStandings(c.partidos || [], c.equipos || []);
          list.push({
            id: c.id,
            nombre: c.nombre,
            temporadaNombre: t.nombre,
            top3: standings.slice(0, 3)
          });
        }
      });
    });
    return list;
  }, [organizacion]);

  // Aggregate all unique team logos of the active season's competencies
  const orgTeams = useMemo(() => {
    if (!activeSeason) return [];
    const unique = new Map();
    activeSeason.competencias?.forEach(comp => {
      comp.equipos?.forEach(eq => {
        if (!unique.has(eq.id)) {
          unique.set(eq.id, {
            id: eq.id,
            nombre: eq.nombre,
            abreviatura: eq.abreviatura,
            logo: eq.logo 
              ? (eq.logo.startsWith('http') ? eq.logo : `${api.defaults.baseURL?.replace('/api', '') || 'http://localhost:8000'}${eq.logo}`) 
              : null
          });
        }
      });
    });
    return Array.from(unique.values());
  }, [activeSeason]);

  const orgTeamsWithLogos = useMemo(() => {
    return orgTeams.filter(team => team.logo);
  }, [orgTeams]);

  const visibleMatches = useMemo(() => {
    return partidos.slice(0, visibleMatchesCount);
  }, [partidos, visibleMatchesCount]);

  if (loading) {
    return <PageLoader />;
  }

  if (!organizacion) {
    return (
      <div className="pt-32 pb-16 min-h-screen bg-background text-center flex flex-col items-center justify-center gap-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
        <div className="space-y-2 relative z-10">
          <h2 className="text-3xl font-display font-black text-foreground uppercase tracking-wider">ORGANIZACIÓN NO ENCONTRADA</h2>
          <p className="text-xs text-muted-foreground max-w-sm">El identificador de circuito proporcionado no corresponde a ninguna confederación oficial.</p>
        </div>
        <Button onClick={() => navigate('/organizaciones')} className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all relative z-10 px-8 py-3.5 text-xs font-condensed font-black tracking-widest uppercase">
          Volver al índice
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30 selection:text-primary font-sans">
      
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[550px] bg-primary/5 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-primary/3 blur-[110px] rounded-full pointer-events-none z-0"></div>

      {/* Sleek Navigation Back Button Row */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-28 md:pt-32 pb-4 flex justify-start items-center relative z-30">
        <button 
          onClick={() => navigate('/organizaciones')}
          className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-border/50 bg-card/35 backdrop-blur-md text-xs font-condensed tracking-wider font-bold text-muted-foreground hover:text-primary hover:border-primary/45 transition-all duration-300 shadow-md active:scale-95 group cursor-pointer"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-300">←</span>
          VOLVER AL CIRCUITO
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. HERO CENTRAL (Cinemático y Táctico - Estilo Organizaciones)            */}
      {/* ========================================================================= */}
      <section className="relative z-20 max-w-7xl mx-auto overflow-hidden rounded-3xl border border-border/40 bg-card/45 backdrop-blur-md shadow-2xl">
        
        {/* Banner image as header */}
        <div className="relative h-56 md:h-72 w-full overflow-hidden border-b border-border/40">
          {organizacion.banner ? (
            <img 
              src={getImageUrl(organizacion.banner)} 
              alt={organizacion.nombre} 
              className="w-full h-full object-cover opacity-85" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/10 via-background to-primary/5 flex items-center justify-center">
              <span className="text-muted-foreground text-xs uppercase tracking-widest font-condensed">Sin banner oficial</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent z-10"></div>
        </div>

        <div className="p-6 md:p-8 relative z-10 -mt-14 md:-mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-end">
            
            {/* LADO IZQUIERDO — IMPACTO PRINCIPAL */}
            <div className="lg:col-span-7 relative flex flex-col items-start gap-4">
              
              <div className="flex items-center gap-3 animate-fade-in-up">
                <Badge 
                  variant="primary" 
                  className="px-5 py-2 text-[10px] font-condensed tracking-[0.2em] text-primary border border-primary/30 bg-primary/10 rounded-full shadow-[0_0_20px_hsla(var(--primary),0.15)] uppercase animate-pulse shrink-0 z-10"
                >
                  🔴 CIRCUITO EN VIVO · REGIÓN {organizacion.pais || 'GLOBAL'}
                </Badge>
              </div>

              <div className="flex items-center gap-5 mt-2 z-10 animate-fade-in-up">
                {organizacion.logo ? (
                  <img 
                    src={getImageUrl(organizacion.logo)} 
                    alt={organizacion.nombre}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-4 border-card bg-card shadow-xl shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-background border-4 border-card flex items-center justify-center font-display font-black text-primary text-3xl shrink-0">
                    {organizacion.nombre?.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="text-4xl md:text-6xl font-display font-black text-foreground uppercase tracking-normal leading-tight drop-shadow-2xl">
                    {organizacion.nombre}
                  </h1>
                  <p className="text-xs md:text-sm text-muted-foreground mt-2 max-w-xl font-light leading-relaxed">
                    {organizacion.descripcion || 'American Club Leagues. Confederación líder en eSports Pro Clubs profesionales.'}
                  </p>
                </div>
              </div>
            </div>

            {/* DERECHA — INFORMACIÓN TÁCTICA */}
            <div className="lg:col-span-3 flex flex-col justify-center items-start lg:items-stretch gap-6 z-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="border border-border/40 bg-card/65 backdrop-blur-md rounded-2xl p-5 w-full space-y-4 shadow-xl">
                
                <div className="flex justify-between items-center border-b border-border/30 pb-2">
                  <span className="text-[10px] font-condensed tracking-widest text-muted-foreground uppercase">DETALLE ACTIVIDAD</span>
                  <span className="text-[10px] font-mono text-primary font-bold">INFO GENERAL</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">TEMPORADA ACTIVA</h4>
                    <span className="text-2xl font-display font-black text-foreground">{activeSeason?.nombre || 'S48'}</span>
                  </div>
                  <div>
                    <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">DIVISIONES</h4>
                    <span className="text-2xl font-display font-black text-primary">{orgStats.divisiones} Ligas</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed font-sans font-light">
                  Confederación deportiva que administra torneos Pro Clubs con reportes automatizados y control estricto de rosters.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. TABS DE NAVEGACIÓN (Horizontal premium eSports tabs)                     */}
      {/* ========================================================================= */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 my-4">
        <div className="border-b border-border/40 flex items-center gap-6 md:gap-10 overflow-x-auto pb-0.5 custom-scrollbar">
          {[
            { id: 'Overview', label: 'RESUMEN' },
            { id: 'Divisions', label: 'DIVISIONES' },
            { id: 'Champions', label: 'SALÓN DE LA FAMA' },
            { id: 'Stats', label: 'ESTADÍSTICAS' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 relative text-xs md:text-sm font-condensed font-black uppercase tracking-widest cursor-pointer whitespace-nowrap transition-colors duration-300 ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 inset-x-0 h-0.5 bg-primary tab-underline-glow"></div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CLUB SHIELDS TICKER (Slower scrolling dynamic team logos ticker)       */}
      {/* ========================================================================= */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 my-6">
        <div className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl py-5 overflow-hidden shadow-lg scanlines relative">
          <div className="flex gap-16 items-center animate-scroll-ticker" style={{ animationDuration: '350s' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-16 shrink-0 items-center">
                {orgTeamsWithLogos.length > 0 ? (
                  orgTeamsWithLogos.map((team, idx) => (
                    <div key={idx} className="flex items-center justify-center opacity-75 hover:opacity-100 transition-all duration-300 transform hover:scale-110 cursor-pointer" onClick={() => navigate(`/equipos/${team.id}`)} title={team.nombre}>
                      <img 
                        src={team.logo} 
                        alt={team.nombre} 
                        className="w-14 h-14 rounded-xl object-cover border border-border/40 bg-background shadow-inner shrink-0"
                      />
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground uppercase font-black tracking-widest">Sin logos de clubes registrados en el circuito aún</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. BARRA DE MÉTRICAS TÁCTICAS DEL CIRCUITO (eSports Stats Bar)            */}
      {/* ========================================================================= */}
      <section className="relative z-20 border-y border-border/40 bg-card/45 backdrop-blur-md max-w-7xl mx-auto px-6 lg:px-10 rounded-2xl py-8 my-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:divide-x md:divide-border/40 text-center">
          {[
            { num: String(organizacion.temporadas?.length || 0), label: 'TEMPORADAS REGISTRADAS' },
            { num: String(orgStats.divisiones), label: 'DIVISIONES ACTIVAS' },
            { num: String(orgStats.clubes), label: 'CLUBES INSCRITOS' },
            { num: orgStats.jugadores >= 1000 ? `${(orgStats.jugadores / 1000).toFixed(1)}K` : String(orgStats.jugadores), label: 'COMPETIDORES ESTIMADOS' }
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center gap-1 md:px-2">
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
      {/* 6. TAB CONTENT DIRECTORY (Dynamic and Premium in Spanish)                  */}
      {/* ========================================================================= */}
      <main className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 py-6 min-h-[400px]">

        {/* Overview Tab */}
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
            <div className="lg:col-span-1 space-y-6">
              <div className="border border-border/50 bg-card/25 backdrop-blur-md p-6 rounded-2xl space-y-4 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 tactical-noise pointer-events-none z-10 opacity-30"></div>
                <h3 className="font-display font-black text-2xl text-foreground uppercase tracking-widest border-b border-border/45 pb-2 relative z-20">
                  Detalles del Circuito
                </h3>
                <div className="space-y-4 text-xs font-sans relative z-20">
                  <div>
                    <span className="text-[9px] font-condensed text-muted-foreground font-bold tracking-widest uppercase block mb-1">Director Ejecutivo</span>
                    <p className="font-bold text-foreground">👔 {organizacion.owner?.name || 'Comisionado General'}</p>
                    <p className="font-mono text-muted-foreground mt-0.5">{organizacion.owner?.email || 'oficina@circuitos.net'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-condensed text-muted-foreground font-bold tracking-widest uppercase block mb-1">País Sede</span>
                    <p className="font-bold text-foreground">{organizacion.pais || 'Internacional (NA)'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-condensed text-muted-foreground font-bold tracking-widest uppercase block mb-1">Suscripción</span>
                    <p className="font-bold text-primary">Estatus: Circuito Público Verificado</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="border border-border/50 bg-card/25 backdrop-blur-md p-8 rounded-3xl space-y-4 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 tactical-noise pointer-events-none z-10 opacity-30"></div>
                <h2 className="font-display font-black text-4xl text-foreground uppercase tracking-wider leading-none relative z-20">
                  Estructura de la Temporada Habilitada
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans font-light relative z-20">
                  Bienvenido al apartado oficial de {organizacion.nombre}. Aquí podrás revisar las divisiones activas de la confederación, analizar los enfrentamientos del fixture oficial de partidos, consultar el salón de la fama y mantenerte al tanto de las estadísticas generales de goleo y pases.
                </p>

                <div className="border border-border/40 bg-muted/10 p-5 rounded-2xl space-y-3 font-sans relative z-20">
                  <h4 className="text-xs font-condensed text-primary font-black uppercase tracking-wider">TEMPORADAS CONFIGURADAS</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {organizacion.temporadas?.map(temp => (
                      <div key={temp.id} className="bg-card/40 p-4 border border-border/40 rounded-xl flex justify-between items-center cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate(`/organizaciones/${orgId}/temporadas/${temp.id}`)}>
                        <div>
                          <span className="text-[10px] font-condensed text-muted-foreground font-bold block">TEMPORADA ID: #{temp.id}</span>
                          <span className="text-sm font-black text-foreground uppercase">{temp.nombre}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border tracking-wider ${
                          temp.activa 
                             ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                             : 'bg-muted/20 text-muted-foreground border-border/50'
                        }`}>
                          {temp.activa ? 'ACTIVA' : 'FINALIZADA'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Divisions Tab */}
        {activeTab === 'Divisions' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center border-b border-border/40 pb-4">
              <h3 className="font-display font-black text-3xl text-foreground uppercase tracking-widest leading-none">
                DIVISIONES OFICIALES ({activeDivisions.length})
              </h3>
              <span className="text-[10px] font-mono text-muted-foreground">MOSTRANDO TODAS LAS LIGAS DE LA TEMPORADA ACTIVA</span>
            </div>

            {activeDivisions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activeDivisions.map((comp, index) => (
                  <div 
                    key={comp.id} 
                    className="group border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl flex flex-col justify-between overflow-hidden shadow-lg relative league-card-interactive scanlines animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    <div className="absolute inset-0 tactical-noise pointer-events-none z-10 opacity-[0.6]"></div>
                    
                    {/* Banner header for the division card */}
                    <div className="relative h-28 w-full overflow-hidden border-b border-border/30 bg-muted/20">
                      {comp.banner ? (
                        <img 
                          src={getImageUrl(comp.banner)} 
                          alt={comp.nombre} 
                          className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : organizacion.banner ? (
                        <img 
                          src={getImageUrl(organizacion.banner)} 
                          alt={comp.nombre} 
                          className="w-full h-full object-cover opacity-60 filter blur-[1px] group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-primary/10 to-primary/5"></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent"></div>
                    </div>

                    <div className="px-6 pb-6 pt-0 space-y-4 relative z-20 -mt-10">
                      {/* Logo and metadata row */}
                      <div className="flex items-end justify-between border-b border-border/40 pb-3">
                        {comp.logo ? (
                          <img 
                            src={getImageUrl(comp.logo)} 
                            alt={comp.nombre} 
                            className="w-16 h-16 rounded-xl object-cover border-2 border-card bg-card shadow-md shrink-0 z-20"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-background border-2 border-card flex items-center justify-center font-display font-black text-primary text-xl shrink-0 z-20">
                            {comp.nombre?.charAt(0)}
                          </div>
                        )}
                        <div className="flex flex-col items-end gap-1.5 text-right relative z-20">
                          <span className="text-[9px] font-condensed font-black px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest leading-none">
                            {comp.formato}
                          </span>
                          <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase leading-none">{comp.plataforma}</span>
                        </div>
                      </div>

                      <h3 className="font-display font-black text-2xl text-foreground uppercase tracking-wide group-hover:text-primary transition-colors leading-tight">
                        {comp.nombre}
                      </h3>

                      <div className="space-y-2 text-xs font-sans">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Equipos Registrados:</span>
                          <span className="text-foreground font-bold font-mono">{(comp.equipos?.length || 0)} / {comp.max_participantes} Clubes</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Prize Pool:</span>
                          <span className="text-primary font-bold font-mono">${comp.prize_pool || '0.00'}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Inscripción Fija:</span>
                          <span className="text-foreground font-bold font-mono">${comp.entry_fee || 'Gratis'}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Traspasos Habilitados:</span>
                          <span className={`font-bold ${comp.periodo_traspasos_abierto ? 'text-emerald-400' : 'text-primary'}`}>
                            {comp.periodo_traspasos_abierto ? 'ABIERTOS 🔓' : 'CERRADOS 🔒'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 pt-0 relative z-20">
                      <Button 
                        onClick={() => navigate(`/competencia-detalle/${comp.id}`)}
                        className="w-full h-10 text-[10px] font-sans font-bold uppercase tracking-wider bg-primary text-primary-foreground border border-transparent hover:bg-primary/90 hover:shadow-[0_0_15px_hsl(var(--primary)/0.35)] transition-all duration-300"
                      >
                        🏟️ FICHA DE LA DIVISIÓN
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-16 flex flex-col items-center text-center max-w-xl mx-auto gap-6 shadow-lg relative scanlines">
                <div className="absolute inset-0 tactical-noise pointer-events-none z-10 opacity-30"></div>
                <span className="text-4xl relative z-20">🏆</span>
                <div className="space-y-2 relative z-20">
                  <h3 className="text-xl font-display font-black uppercase tracking-wide text-foreground">Sin Divisiones Asignadas</h3>
                  <p className="text-xs text-muted-foreground">No hay ligas o campeonatos asignados a la temporada vigente en la base de datos.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Champions Tab */}
        {activeTab === 'Champions' && (
          <div className="border border-border/50 bg-card/25 backdrop-blur-md p-8 rounded-2xl shadow-lg relative overflow-hidden scanlines text-center max-w-4xl mx-auto animate-fade-in">
            <div className="absolute inset-0 tactical-noise pointer-events-none z-10 opacity-30"></div>
            <span className="text-5xl relative z-20">👑</span>
            <div className="space-y-3 mt-4 relative z-20">
              <h2 className="font-display font-black text-4xl text-foreground uppercase tracking-wider">
                SALÓN DE LA FAMA DE {organizacion.nombre}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-sans max-w-lg mx-auto">
                Los clubes que conquistaron la gloria táctica y dejaron su huella dorada en los registros del circuito oficial.
              </p>
            </div>

            {finalizedCompetencias.length > 0 ? (
              <div className="space-y-8 mt-6">
                {finalizedCompetencias.map((fc) => (
                  <div key={fc.id} className="border border-border/40 bg-muted/10 p-6 rounded-2xl space-y-4 font-sans relative z-20 text-left">
                    <div className="border-b border-border/30 pb-2 flex justify-between items-center">
                      <span className="font-display font-black text-lg text-primary uppercase">{fc.nombre}</span>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">{fc.temporadaNombre}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {fc.top3.map((team, idx) => {
                        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
                        const label = idx === 0 ? 'CAMPEÓN' : idx === 1 ? 'SUBCAMPEÓN' : '3ER LUGAR';
                        const colorClass = idx === 0 ? 'text-primary' : 'text-muted-foreground';
                        const borderClass = idx === 0 ? 'border-primary/20 hover:border-primary/45' : 'border-border/40 hover:border-primary/20';
                        return (
                          <div key={team.id} className={`bg-card/40 p-4 border rounded-xl transition-colors text-center ${borderClass}`}>
                            <span className="text-3xl">{medal}</span>
                            <h4 className="font-display font-black text-lg text-foreground uppercase mt-2 truncate">
                              {team.nombre}
                            </h4>
                            <span className={`text-[9px] font-condensed font-black uppercase tracking-widest block mt-1 ${colorClass}`}>
                              {label} ({team.pts} PTS)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-16 flex flex-col items-center text-center max-w-xl mx-auto gap-6 shadow-lg relative scanlines mt-6">
                <div className="absolute inset-0 tactical-noise pointer-events-none z-10 opacity-30"></div>
                <span className="text-4xl relative z-20">🏆</span>
                <div className="space-y-2 relative z-20">
                  <h3 className="text-xl font-display font-black uppercase tracking-wide text-foreground">Sin Ligas Finalizadas</h3>
                  <p className="text-xs text-muted-foreground">Aún no se han cerrado o finalizado torneos oficiales en la temporada actual para mostrar en el salón de la fama.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'Stats' && (
          <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/40 pb-4 gap-4">
              <div>
                <h3 className="font-display font-black text-3xl text-foreground uppercase tracking-widest leading-none">
                  📊 METRICS & INFOGRAFÍAS DE LIGAS
                </h3>
                <p className="text-[11px] font-mono text-muted-foreground mt-1.5 uppercase">
                  Análisis táctico y estado global de las divisiones disponibles
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => navigate('/clasificacion')}
                  className="bg-primary text-primary-foreground border-none hover:shadow-[0_0_15px_hsla(var(--primary),0.35)] transition-all px-5 py-2.5 text-[10px] font-condensed font-black tracking-widest uppercase"
                >
                  Ver Clasificación
                </Button>
                <Button 
                  onClick={() => navigate('/infografia')}
                  className="bg-muted/40 hover:bg-muted/60 text-foreground border border-border/40 px-5 py-2.5 text-[10px] font-condensed font-black tracking-widest uppercase"
                >
                  Líderes Individuales
                </Button>
              </div>
            </div>

            {divisionStats.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {divisionStats.map((ds) => (
                  <Card key={ds.id} className="border border-border/50 bg-card/25 backdrop-blur-md p-6 relative overflow-hidden flex flex-col justify-between" withGlow>
                    <div className="absolute inset-0 tactical-noise pointer-events-none opacity-[0.4] z-0"></div>
                    
                    <div className="relative z-10 space-y-5">
                      {/* Card Header with Banner background */}
                      <div className="relative h-20 w-full rounded-xl overflow-hidden border border-border/40 flex items-center px-4 justify-between bg-muted/20">
                        {ds.banner ? (
                          <img src={getImageUrl(ds.banner)} alt={ds.nombre} className="absolute inset-0 w-full h-full object-cover opacity-30" />
                        ) : organizacion.banner ? (
                          <img src={getImageUrl(organizacion.banner)} alt={ds.nombre} className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-[1px]" />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent"></div>
                        
                        <div className="relative z-15 flex items-center gap-3">
                          {ds.logo ? (
                            <img src={getImageUrl(ds.logo)} alt={ds.nombre} className="w-10 h-10 rounded-lg object-cover border border-border/40 bg-card shadow-sm" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-background border border-border/40 flex items-center justify-center font-display font-black text-primary text-sm">
                              {ds.nombre?.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-display font-black text-lg text-foreground uppercase tracking-wide leading-tight">{ds.nombre}</h4>
                            <span className="text-[9px] font-mono text-muted-foreground uppercase">{ds.plataforma}</span>
                          </div>
                        </div>

                        <Badge variant="primary" className="relative z-15 text-[8px] font-condensed font-bold tracking-widest text-primary border border-primary/20 bg-primary/5 px-2 py-0.5 rounded uppercase">
                          {ds.progressPercent}% COMPLETADO
                        </Badge>
                      </div>

                      {/* Táctico Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
                          <span>PROGRESO DE PARTIDOS</span>
                          <span>{ds.playedMatches} / {ds.totalMatches} ENCUENTROS</span>
                        </div>
                        <div className="w-full bg-border/20 h-2.5 rounded-full overflow-hidden border border-border/40 p-0.5">
                          <div 
                            className="bg-gradient-to-r from-primary to-destructive h-full rounded-full shadow-[0_0_8px_rgba(232,0,29,0.3)] transition-all duration-500"
                            style={{ width: `${ds.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Podio / Líder actual */}
                      <div className="bg-muted/10 border border-border/30 rounded-xl p-3.5 space-y-2">
                        <span className="text-[8px] font-mono text-primary font-black uppercase tracking-wider block">LÍDER PROVISIONAL</span>
                        {ds.leader ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {ds.leader.logo ? (
                                <img src={getImageUrl(ds.leader.logo)} alt={ds.leader.nombre} className="w-7 h-7 rounded-md object-cover border border-border/40 bg-card shadow-inner" />
                              ) : (
                                <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center font-display font-black text-xs text-muted-foreground border border-border/40">
                                  {ds.leader.abreviatura || ds.leader.nombre?.charAt(0)}
                                </div>
                              )}
                              <span className="font-display font-bold text-sm text-foreground uppercase tracking-wide truncate max-w-[180px]">{ds.leader.nombre}</span>
                            </div>
                            <Badge variant="outline" className="text-primary border-primary/30 text-xs font-mono font-black py-0.5 px-2">
                              {ds.leader.pts} PTS
                            </Badge>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic font-sans py-1">Sin partidos jugados para computar líder.</div>
                        )}
                      </div>

                      {/* Infographic mini grid metrics */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-muted/10 border border-border/30 rounded-xl p-3 text-center">
                          <span className="text-[8px] font-mono text-muted-foreground block uppercase">TOTAL GOLES</span>
                          <span className="text-xl font-display font-black text-foreground block mt-1">{ds.totalGoals}</span>
                          <span className="text-[7px] text-muted-foreground uppercase font-black tracking-widest mt-0.5 block">ANOTADOS</span>
                        </div>
                        <div className="bg-muted/10 border border-border/30 rounded-xl p-3 text-center">
                          <span className="text-[8px] font-mono text-muted-foreground block uppercase">PROM. GOLES</span>
                          <span className="text-xl font-display font-black text-primary block mt-1">{ds.avgGoals}</span>
                          <span className="text-[7px] text-primary/80 uppercase font-black tracking-widest mt-0.5 block">POR JUEGO</span>
                        </div>
                        <div className="bg-muted/10 border border-border/30 rounded-xl p-3 text-center">
                          <span className="text-[8px] font-mono text-muted-foreground block uppercase">PREMIOS</span>
                          <span className="text-base font-display font-black text-emerald-400 block mt-1.5 truncate">${ds.prizePool}</span>
                          <span className="text-[7px] text-emerald-500/80 uppercase font-black tracking-widest mt-0.5 block">BOLSA</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 relative z-10">
                      <Button 
                        onClick={() => navigate(`/competencia-detalle/${ds.id}`)}
                        className="w-full h-10 text-[10px] font-sans font-bold uppercase tracking-wider bg-primary text-primary-foreground border border-transparent hover:bg-primary/90 hover:shadow-[0_0_15px_hsl(var(--primary)/0.35)] transition-all duration-300"
                      >
                        📊 Ficha & Calendario
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-16 flex flex-col items-center text-center max-w-xl mx-auto gap-6 shadow-lg relative scanlines mt-6">
                <div className="absolute inset-0 tactical-noise pointer-events-none z-10 opacity-30"></div>
                <span className="text-4xl relative z-20">📊</span>
                <div className="space-y-2 relative z-20">
                  <h3 className="text-xl font-display font-black uppercase tracking-wide text-foreground">Sin Estadísticas Disponibles</h3>
                  <p className="text-xs text-muted-foreground">No se registran divisiones activas en esta temporada para procesar estadísticas.</p>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

    </div>
  );
}
