import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '@/api/axios';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import PageLoader from '@/components/ui/PageLoader';
import Card from '@/components/shared/Card';

const SOCIAL_ICONS = {
  whatsapp: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.966C16.59 1.988 14.113.96 11.48.96c-5.438 0-9.863 4.37-9.866 9.8.001 1.93.535 3.568 1.545 5.093L2.148 21.3l5.5-1.423-.001-.004-.002.001z" />
    </svg>
  ),
  instagram: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  twitter: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  x: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  twitch: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
    </svg>
  ),
  youtube: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.388.556a3.002 3.002 0 0 0-2.11 2.107C0 8.018 0 12 0 12s0 3.982.502 5.837a3.003 3.003 0 0 0 2.11 2.107C4.47 20.5 12 20.5 12 20.5s7.53 0 9.388-.556a3.003 3.003 0 0 0 2.11-2.107C24 15.982 24 12 24 12s0-3.982-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  tiktok: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.05 1.62 4.2 1.21 1.4 2.93 2.38 4.77 2.64v3.88c-1.51-.16-3-.8-4.14-1.85-.75-.69-1.3-1.57-1.6-2.52-.04 2.87-.03 5.75-.04 8.62-.05 1.56-.44 3.13-1.19 4.51-1.25 2.33-3.71 3.92-6.38 4.09-2.91.22-5.91-.98-7.46-3.48-1.54-2.43-1.39-5.85.38-8.11 1.34-1.74 3.44-2.79 5.66-2.83V12.7c-1.12.01-2.27.37-3.11 1.11-.96.86-1.4 2.21-1.16 3.48.24 1.33 1.25 2.47 2.53 2.82 1.43.4 3.07-.15 3.86-1.39.46-.72.63-1.59.6-2.43.02-5.45.01-10.9.02-16.35-.04.05-.08.06-.08.08z" />
    </svg>
  ),
  facebook: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
};

const SOCIAL_THEMES = {
  whatsapp: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]',
  instagram: 'bg-pink-500/10 border-pink-500/30 text-pink-400 hover:bg-pink-500/25 hover:shadow-[0_0_12px_rgba(236,72,153,0.3)]',
  twitter: 'bg-slate-300/10 border-slate-300/30 text-slate-300 hover:bg-slate-300/25 hover:shadow-[0_0_12px_rgba(203,213,225,0.3)]',
  x: 'bg-slate-300/10 border-slate-300/30 text-slate-300 hover:bg-slate-300/25 hover:shadow-[0_0_12px_rgba(203,213,225,0.3)]',
  twitch: 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/25 hover:shadow-[0_0_12px_rgba(168,85,247,0.3)]',
  youtube: 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/25 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]',
  tiktok: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 hover:shadow-[0_0_12px_rgba(6,182,212,0.3)]',
  facebook: 'bg-blue-600/10 border-blue-600/30 text-blue-500 hover:bg-blue-600/25 hover:shadow-[0_0_12px_rgba(37,99,235,0.3)]'
};

const getSocialLink = (platform, value) => {
  if (!value) return null;
  const cleanVal = value.trim();
  if (cleanVal.startsWith('http://') || cleanVal.startsWith('https://')) {
    return cleanVal;
  }
  
  switch (platform.toLowerCase()) {
    case 'whatsapp': {
      const phone = cleanVal.replace(/[+\s\-()]/g, '');
      return `https://wa.me/${phone}`;
    }
    case 'instagram':
      return `https://instagram.com/${cleanVal.replace('@', '')}`;
    case 'twitter':
    case 'x':
      return `https://x.com/${cleanVal.replace('@', '')}`;
    case 'twitch':
      return `https://twitch.tv/${cleanVal}`;
    case 'youtube':
      return cleanVal.startsWith('@') 
        ? `https://youtube.com/${cleanVal}` 
        : `https://youtube.com/@${cleanVal}`;
    case 'tiktok':
      return cleanVal.startsWith('@')
        ? `https://tiktok.com/${cleanVal}`
        : `https://tiktok.com/@${cleanVal}`;
    default:
      return cleanVal;
  }
};const getImageUrl = (path, fallbackType) => {
  if (!path) {
    if (fallbackType === 'user' || fallbackType === 'usuario') return '/images/users/default-user.png';
    if (fallbackType === 'org_logo' || fallbackType === 'organizacion_logo') return '/images/default-org-logo.svg';
    if (fallbackType === 'org_banner' || fallbackType === 'organizacion_banner') return '/images/default-org-banner.svg';
    if (fallbackType === 'team_logo' || fallbackType === 'equipo_logo') return '/images/default-team-logo.svg';
    if (fallbackType === 'team_banner' || fallbackType === 'equipo_banner') return '/images/default-team-banner.svg';
    return null;
  }
  if (path.startsWith('http')) return path;
  if (typeof window.mediaUrl === 'function') {
    return window.mediaUrl(path, fallbackType);
  }
  const backendBaseUrl = api.defaults.baseURL?.replace(/\/api$/, '') ;
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
    
    if (!lid || !vid || !map[lid] || !map[vid]) return;
    
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
  const [searchParams, setSearchParams] = useSearchParams();
  const tipoParam = searchParams.get('tipo') || 'todas';

  const [organizacion, setOrganizacion] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview'); // 'Overview' | 'Divisions' | 'Champions' | 'Schedule' | 'Stats'
  const [visibleMatchesCount, setVisibleMatchesCount] = useState(20);
  const [championsSubTab, setChampionsSubTab] = useState('equipos'); // 'equipos' | 'jugadores'

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
      const isTodas = tipoParam === 'todas';
      const is11v11 = tipoParam === '11v11';
      const isUt = tipoParam === 'ut' || tipoParam === 'UT';

      if (isTodas || is11v11) {
        temp.competencias?.forEach(comp => {
          totalDivs++;
          comp.equipos?.forEach(eq => {
            uniqueClubs.add(eq.id);
          });
        });
      }

      if (isTodas || isUt) {
        const compsUt = temp.competenciasUt || temp.competencias_ut || [];
        compsUt.forEach(comp => {
          totalDivs++;
          comp.equipos?.forEach(eq => {
            uniqueClubs.add(eq.id);
          });
        });
      }
    });

    return {
      divisiones: totalDivs,
      clubes: uniqueClubs.size,
      partidos: totalMatches,
      jugadores: uniqueClubs.size * 12 // Estimated roster size
    };
  }, [organizacion, partidos, scheduleLoaded, tipoParam]);

  // Active Season
  const activeSeason = useMemo(() => {
    if (!organizacion?.temporadas || organizacion.temporadas.length === 0) return null;
    const active = organizacion.temporadas.find(t => t.activa);
    if (active) return active;
    return [...organizacion.temporadas].sort((a, b) => b.id - a.id)[0];
  }, [organizacion]);

  // Active Divisions/Competencias
  const activeDivisions = useMemo(() => {
    if (!activeSeason) return [];
    const list = [];
    const isTodas = tipoParam === 'todas';
    const is11v11 = tipoParam === '11v11';
    const isUt = tipoParam === 'ut' || tipoParam === 'UT';

    if ((isTodas || is11v11) && activeSeason.competencias) {
      list.push(...activeSeason.competencias.map(c => ({ ...c, esUt: false })));
    }
    if ((isTodas || isUt) && (activeSeason.competenciasUt || activeSeason.competencias_ut)) {
      const compsUt = activeSeason.competenciasUt || activeSeason.competencias_ut;
      list.push(...compsUt.map(c => ({ ...c, esUt: true })));
    }
    return list;
  }, [activeSeason, tipoParam]);

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
        esUt: comp.esUt,
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
      const isTodas = tipoParam === 'todas';
      const is11v11 = tipoParam === '11v11';
      const isUt = tipoParam === 'ut' || tipoParam === 'UT';

      if (isTodas || is11v11) {
        t.competencias?.forEach(c => {
          if (c.estado === 'finalizada') {
            const campeon = c.campeon;
            const subcampeon = c.subcampeon;
            const tercerLugar = c.tercer_lugar || c.tercerLugar;

            const standings = computeStandings(c.partidos || [], c.equipos || []);
            const getTeamStats = (teamId, teamObj) => {
              const s = standings.find(x => x.id === teamId || (teamObj && x.nombre === teamObj.nombre));
              const logoVal = teamObj?.logo || teamObj?.logo_url || s?.logo;
              return {
                logo: logoVal ? getImageUrl(logoVal) : null,
                pj: s ? s.pj : 0,
                pg: s ? s.pg : 0,
                pe: s ? s.pe : 0,
                pp: s ? s.pp : 0,
                gf: s ? s.gf : 0,
                gc: s ? s.gc : 0,
                pts: s ? s.pts : 0,
                winRate: s && s.pj > 0 ? Math.round((s.pg / s.pj) * 100) : 0
              };
            };

            let podio = [];
            if (campeon) {
              podio.push({
                medal: '🥇',
                label: 'CAMPEÓN',
                id: campeon.id,
                nombre: campeon.nombre,
                abreviatura: campeon.abreviatura,
                ...getTeamStats(campeon.id, campeon)
              });
            }
            if (subcampeon) {
              podio.push({
                medal: '🥈',
                label: 'SUBCAMPEÓN',
                id: subcampeon.id,
                nombre: subcampeon.nombre,
                abreviatura: subcampeon.abreviatura,
                ...getTeamStats(subcampeon.id, subcampeon)
              });
            }
            if (tercerLugar) {
              podio.push({
                medal: '🥉',
                label: '3ER LUGAR',
                id: tercerLugar.id,
                nombre: tercerLugar.nombre,
                abreviatura: tercerLugar.abreviatura,
                ...getTeamStats(tercerLugar.id, tercerLugar)
              });
            }

            if (podio.length === 0) {
              standings.slice(0, 3).forEach((team, idx) => {
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
                const label = idx === 0 ? 'CAMPEÓN' : idx === 1 ? 'SUBCAMPEÓN' : '3ER LUGAR';
                podio.push({
                  medal,
                  label,
                  id: team.id,
                  nombre: team.nombre,
                  abreviatura: team.abreviatura,
                  ...getTeamStats(team.id, team)
                });
              });
            }

            list.push({
              id: c.id,
              nombre: c.nombre,
              esUt: false,
              temporadaNombre: t.nombre,
              podio,
              topStats: c.top_stats
            });
          }
        });
      }

      if (isTodas || isUt) {
        const compsUt = t.competenciasUt || t.competencias_ut || [];
        compsUt.forEach(c => {
          if (c.estado === 'finalizada') {
            const campeon = c.campeon;
            const subcampeon = c.subcampeon;
            const tercerLugar = c.tercer_lugar || c.tercerLugar;

            const standings = computeStandings(c.partidos || [], c.equipos || []);
            const getTeamStats = (teamId, teamObj) => {
              const s = standings.find(x => x.id === teamId || (teamObj && x.nombre === teamObj.nombre));
              const logoVal = teamObj?.logo || teamObj?.logo_url || s?.logo;
              return {
                logo: logoVal ? getImageUrl(logoVal) : null,
                pj: s ? s.pj : 0,
                pg: s ? s.pg : 0,
                pe: s ? s.pe : 0,
                pp: s ? s.pp : 0,
                gf: s ? s.gf : 0,
                gc: s ? s.gc : 0,
                pts: s ? s.pts : 0,
                winRate: s && s.pj > 0 ? Math.round((s.pg / s.pj) * 100) : 0
              };
            };

            let podio = [];
            if (campeon) {
              podio.push({
                medal: '🥇',
                label: 'CAMPEÓN',
                id: campeon.id,
                nombre: campeon.nombre,
                abreviatura: campeon.nombre?.slice(0, 3) || 'UT',
                ...getTeamStats(campeon.id, campeon)
              });
            }
            if (subcampeon) {
              podio.push({
                medal: '🥈',
                label: 'SUBCAMPEÓN',
                id: subcampeon.id,
                nombre: subcampeon.nombre,
                abreviatura: subcampeon.nombre?.slice(0, 3) || 'UT',
                ...getTeamStats(subcampeon.id, subcampeon)
              });
            }
            if (tercerLugar) {
              podio.push({
                medal: '🥉',
                label: '3ER LUGAR',
                id: tercerLugar.id,
                nombre: tercerLugar.nombre,
                abreviatura: tercerLugar.nombre?.slice(0, 3) || 'UT',
                ...getTeamStats(tercerLugar.id, tercerLugar)
              });
            }

            if (podio.length === 0) {
              standings.slice(0, 3).forEach((team, idx) => {
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
                const label = idx === 0 ? 'CAMPEÓN' : idx === 1 ? 'SUBCAMPEÓN' : '3ER LUGAR';
                podio.push({
                  medal,
                  label,
                  id: team.id,
                  nombre: team.nombre,
                  abreviatura: team.abreviatura,
                  ...getTeamStats(team.id, team)
                });
              });
            }

            list.push({
              id: c.id,
              nombre: c.nombre,
              esUt: true,
              temporadaNombre: t.nombre,
              podio,
              topStats: c.top_stats
            });
          }
        });
      }
    });
    return list;
  }, [organizacion, tipoParam]);

  // Aggregate all unique team logos of the active season's competencies
  const orgTeams = useMemo(() => {
    if (!activeSeason) return [];
    const unique = new Map();
    const isTodas = tipoParam === 'todas';
    const is11v11 = tipoParam === '11v11';
    const isUt = tipoParam === 'ut' || tipoParam === 'UT';

    if (isTodas || is11v11) {
      activeSeason.competencias?.forEach(comp => {
        comp.equipos?.forEach(eq => {
          if (!unique.has(eq.id)) {
            unique.set(eq.id, {
              id: eq.id,
              nombre: eq.nombre,
              abreviatura: eq.abreviatura,
              logo: getImageUrl(eq.logo)
            });
          }
        });
      });
    }

    if (isTodas || isUt) {
      const compsUt = activeSeason.competenciasUt || activeSeason.competencias_ut || [];
      compsUt.forEach(comp => {
        comp.equipos?.forEach(eq => {
          if (!unique.has(eq.id)) {
            unique.set(eq.id, {
              id: eq.id,
              nombre: eq.nombre,
              abreviatura: eq.abreviatura,
              logo: getImageUrl(eq.logo)
            });
          }
        });
      });
    }

    return Array.from(unique.values());
  }, [activeSeason, tipoParam]);

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
      


      {/* ========================================================================= */}
      {/* 2. HERO CENTRAL (Banner Inmersivo Estilo Detalle Equipo)                  */}
      {/* ========================================================================= */}
      {/* Banner Superior Inmersivo */}
      <div className="h-80 md:h-[460px] relative z-0 overflow-hidden bg-card border-b border-primary/20">
        {organizacion.banner ? (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-80"
            style={{ backgroundImage: `url('${getImageUrl(organizacion.banner, 'org_banner')}')` }}
          />
        ) : (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-overlay"
            style={{ backgroundImage: `url('${getImageUrl('default-org-banner', 'org_banner')}')` }}
          />
        )}
        {/* Gradient fallback */}
        {!organizacion.banner && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-card/50 to-background opacity-90 -z-10" />
        )}
        {/* Grid and scanline tech layers */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent"></div>
        
        {/* Floating tech banner elements */}
        <div className="absolute top-1/3 left-10 text-[6rem] md:text-[10rem] font-display font-black uppercase text-foreground/[0.025] select-none leading-none pointer-events-none font-extrabold tracking-tighter">
          {organizacion.abreviatura || 'ORG'}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10 -mt-20 md:-mt-28 space-y-8 animate-fade-in-up">
        
        {/* Cabecera de la Organización */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 pb-6 border-b border-border/40">
          
          <div className="flex flex-col items-center md:items-start gap-4">
            
            {/* Botón Volver Sobre el Logo */}
            <button 
              onClick={() => navigate('/organizaciones')}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-border/50 bg-card/65 backdrop-blur-md text-[10px] sm:text-xs font-condensed tracking-wider font-bold text-muted-foreground hover:text-primary hover:border-primary/45 transition-all duration-300 shadow-md active:scale-95 group cursor-pointer"
            >
              <span className="group-hover:-translate-x-1 transition-transform duration-300">←</span>
              VOLVER AL CIRCUITO
            </button>

            <div className="flex flex-col md:flex-row items-center gap-6">
              {organizacion.logo ? (
                <img 
                  src={getImageUrl(organizacion.logo, 'org_logo')} 
                  alt={organizacion.nombre} 
                  className="w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover border-[3.5px] border-background bg-card shadow-[0_0_20px_hsla(var(--primary),0.3)] shrink-0 transition-transform duration-500 hover:scale-105"
                  onError={(e) => window.handleImageError(e, 'org_logo')}
                />
              ) : (
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-gradient-to-tr from-primary to-destructive border-[3.5px] border-background flex items-center justify-center font-display font-black text-primary-foreground text-4xl shadow-[0_0_20px_hsla(var(--primary),0.3)] uppercase shrink-0 transition-transform duration-500 hover:scale-105">
                  {organizacion.abreviatura || organizacion.nombre?.charAt(0)}
                </div>
              )}

              <div className="text-center md:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <Badge variant="primary" className="text-[10px] font-mono px-2.5 py-0.5 rounded-lg font-black tracking-wider border backdrop-blur-sm bg-primary/10 text-primary border-primary/25 shadow-[0_0_15px_hsla(var(--primary),0.2)] uppercase">
                    <span>🔴</span>
                    <span className="ml-1">CIRCUITO EN VIVO · REGIÓN {organizacion.pais || 'GLOBAL'}</span>
                  </Badge>
                  {organizacion.abreviatura && (
                    <span className="bg-muted/65 border border-border/40 px-2.5 py-0.5 rounded text-[10px] text-muted-foreground font-mono font-black">
                      {organizacion.abreviatura}
                    </span>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-extrabold uppercase tracking-tight text-foreground text-glow-primary select-none drop-shadow-lg">
                  {organizacion.nombre}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-2 max-w-xl font-light leading-relaxed">
                  {organizacion.descripcion || 'American Club Leagues. Confederación líder en eSports Pro Clubs profesionales.'}
                </p>
                
                {/* Redes Sociales Usando Columnas Reales de Organizaciones */}
                {(organizacion.discord_url || organizacion.twitter_url || organizacion.twitch_url || organizacion.website || organizacion.email_contacto || organizacion.instagram_url || organizacion.facebook_url || organizacion.youtube_url || organizacion.tiktok_url || organizacion.whatsapp) && (
                  <div className="flex flex-wrap items-center gap-2 mt-3 justify-center md:justify-start">
                    {[
                      { platform: 'whatsapp', value: organizacion.whatsapp },
                      { platform: 'twitter', value: organizacion.twitter_url },
                      { platform: 'instagram', value: organizacion.instagram_url },
                      { platform: 'facebook', value: organizacion.facebook_url },
                      { platform: 'youtube', value: organizacion.youtube_url },
                      { platform: 'tiktok', value: organizacion.tiktok_url },
                      { platform: 'twitch', value: organizacion.twitch_url },
                      { platform: 'discord', value: organizacion.discord_url },
                      { platform: 'website', value: organizacion.website },
                      { platform: 'email', value: organizacion.email_contacto },
                    ].map(({ platform, value }) => {
                      if (!value) return null;
                      
                      if (platform === 'discord') {
                        return (
                          <a key="discord" href={getSocialLink('discord', value)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono font-bold uppercase transition-all duration-300 bg-[#5865F2]/10 border-[#5865F2]/30 text-[#5865F2] hover:bg-[#5865F2]/25" title={`Discord`}>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 127.14 96.36"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.73,67.73,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.33,46,96.22,53,91.08,65.69,84.69,65.69Z"/></svg>
                            <span>Discord</span>
                          </a>
                        );
                      }
                      if (platform === 'email') {
                        return (
                          <a key="email" href={`mailto:${value}`} className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono font-bold uppercase transition-all duration-300 bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/25" title={`Email: ${value}`}>
                            <span>✉️</span><span>Email</span>
                          </a>
                        );
                      }
                      if (platform === 'website') {
                        return (
                          <a key="website" href={getSocialLink('website', value)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono font-bold uppercase transition-all duration-300 bg-primary/10 border-primary/30 text-primary hover:bg-primary/25" title={`Website: ${value}`}>
                            <span>🌐</span><span>Web</span>
                          </a>
                        );
                      }

                      const url = getSocialLink(platform, value);
                      if (!url) return null;
                      const icon = SOCIAL_ICONS[platform] || <span>🔗</span>;
                      const theme = SOCIAL_THEMES[platform] || 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-card';
                      
                      return (
                        <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono font-bold uppercase transition-all duration-300 ${theme}`} title={`${platform}: ${value}`}>
                          {icon}
                          <span>{platform === 'twitter' ? 'X' : platform}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Info Cards (Optional right side) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex flex-col items-end border border-border/40 bg-card/65 backdrop-blur-md rounded-2xl p-4 shadow-xl">
              <span className="text-[10px] font-condensed tracking-widest text-muted-foreground uppercase">INFO GENERAL</span>
              <div className="flex gap-4 mt-2">
                <div className="text-right">
                  <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">TEMPORADA</h4>
                  <span className="text-xl font-display font-black text-foreground">{activeSeason?.nombre || 'S48'}</span>
                </div>
                <div className="text-right border-l border-border/30 pl-4">
                  <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">DIVISIONES</h4>
                  <span className="text-xl font-display font-black text-primary">{orgStats.divisiones} Ligas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TABS DE NAVEGACIÓN (Horizontal premium eSports tabs)                     */}
      {/* ========================================================================= */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 my-4">
        <div className="border-b border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 sm:pb-0">
          <div className="flex items-center gap-6 md:gap-10 overflow-x-auto pb-0.5 custom-scrollbar w-full sm:w-auto">
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

          {/* Tabs Premium de Filtrado por Tipo (11v11 vs UT) */}
          <div className="flex bg-muted/40 p-0.5 rounded-xl border border-border/40 gap-0.5 select-none shrink-0 self-start sm:self-auto mb-2 sm:mb-0">
            <button
              onClick={() => setSearchParams({ tipo: 'todas' })}
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-condensed tracking-wider uppercase whitespace-nowrap transition-all duration-300 relative cursor-pointer font-black ${
                tipoParam === 'todas'
                  ? 'text-white bg-gradient-to-r from-primary to-destructive shadow-[0_0_12px_rgba(232,0,29,0.3)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              🌐 Todas
            </button>
            <button
              onClick={() => setSearchParams({ tipo: '11v11' })}
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-condensed tracking-wider uppercase whitespace-nowrap transition-all duration-300 relative cursor-pointer font-black ${
                tipoParam === '11v11'
                  ? 'text-white bg-gradient-to-r from-primary to-destructive shadow-[0_0_12px_rgba(232,0,29,0.3)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              🛡️ 11v11
            </button>
            <button
              onClick={() => setSearchParams({ tipo: 'ut' })}
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-condensed tracking-wider uppercase whitespace-nowrap transition-all duration-300 relative cursor-pointer font-black ${
                tipoParam === 'ut' || tipoParam === 'UT'
                  ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              🎮 UT 1v1/2v2
            </button>
          </div>
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
                      <img 
                        src={getImageUrl(comp.banner || organizacion.banner, 'org_banner')} 
                        alt={comp.nombre} 
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" 
                        onError={(e) => window.handleImageError(e, 'org_banner')}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent"></div>
                    </div>

                    <div className="px-6 pb-6 pt-0 space-y-4 relative z-20 -mt-10">
                      {/* Logo and metadata row */}
                      <div className="flex items-end justify-between border-b border-border/40 pb-3">
                        <img 
                          src={getImageUrl(comp.logo, 'team_logo')} 
                          alt={comp.nombre} 
                          className="w-16 h-16 rounded-xl object-cover border-2 border-card bg-card shadow-md shrink-0 z-20"
                          onError={(e) => window.handleImageError(e, 'team_logo')}
                        />
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
                        onClick={() => navigate(comp.esUt ? `/competencia-ut-detalle/${comp.id}` : `/competencia-detalle/${comp.id}`)}
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
          <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            {/* Header del Salón de la Fama */}
            <div className="border border-border/50 bg-card/25 backdrop-blur-md p-8 rounded-2xl shadow-lg relative overflow-hidden text-center scanlines">
              <div className="absolute inset-0 tactical-noise pointer-events-none z-10 opacity-30"></div>
              <span className="text-5xl relative z-20">👑</span>
              <div className="space-y-3 mt-4 relative z-20">
                <h2 className="font-display font-black text-4xl text-foreground uppercase tracking-wider">
                  SALÓN DE LA FAMA DE {organizacion.nombre}
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-sans max-w-lg mx-auto">
                  La enciclopedia dorada del circuito oficial. Aquí se inmortalizan los clubes laureados y los héroes individuales de cada división.
                </p>
              </div>

              {/* Selector de Sub-pestañas */}
              <div className="flex justify-center gap-2 mt-8 bg-muted/20 p-1.5 rounded-xl border border-border/40 w-fit mx-auto relative z-20">
                <button
                  onClick={() => setChampionsSubTab('equipos')}
                  className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    championsSubTab === 'equipos'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  🛡️ Clubes Laureados
                </button>
                <button
                  onClick={() => setChampionsSubTab('jugadores')}
                  className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    championsSubTab === 'jugadores'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ⭐ Héroes de Élite
                </button>
              </div>
            </div>

            {/* Listado de Competencias Finalizadas */}
            {finalizedCompetencias.length > 0 ? (
              <div className="space-y-8">
                {finalizedCompetencias.map((fc) => (
                  <div key={fc.id} className="border border-border/40 bg-card/10 p-6 rounded-3xl space-y-6 font-sans relative z-20 text-left hover:border-primary/20 transition-all duration-300">
                    <div className="border-b border-border/30 pb-3 flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-primary" />
                        <span className="font-display font-black text-xl text-foreground uppercase tracking-wide">{fc.nombre}</span>
                        <Badge variant={fc.esUt ? "brand" : "primary"} className="text-[8px] uppercase tracking-widest font-mono">
                          {fc.esUt ? "ULTIMATE TEAM" : "MODO 11v11"}
                        </Badge>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider">{fc.temporadaNombre}</span>
                    </div>

                    {/* VISTA SUB-TAB: EQUIPOS (PODIO TÁCTICO) */}
                    {championsSubTab === 'equipos' && (
                      <div className="space-y-4">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                          🏆 CUADRO DE HONOR Y PODIO OFICIAL
                        </span>
                        
                        {/* Render del Podio Visual */}
                        {(() => {
                          const gold = fc.podio.find(p => p.label.includes('CAMPEÓN'));
                          const silver = fc.podio.find(p => p.label.includes('SUBCAMPEÓN'));
                          const bronze = fc.podio.find(p => p.label.includes('3ER LUGAR') || p.label.includes('3 PUESTO'));

                          return (
                            <div className="py-8 max-w-5xl mx-auto border border-border/30 bg-background/25 rounded-3xl pb-16 flex flex-col items-center relative overflow-hidden min-h-[320px]">
                              {/* Backdrop Glow */}
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                              <div className="flex flex-col md:flex-row items-end justify-center gap-6 w-full px-6 pt-10 pb-6 relative z-10">
                                
                                {/* 🥈 SEGUNDO LUGAR (SUBCAMPEÓN) */}
                                {silver ? (
                                  <div className="w-full md:w-1/3 order-2 md:order-1 flex flex-col items-center group mt-8 md:mt-0 animate-fade-in-up anim-breathing-card" style={{ animationDelay: '0.1s' }}>
                                    <Link 
                                      to={silver.id ? `/equipos/${silver.id}` : '#'} 
                                      className="relative w-24 h-24 mb-4 flex items-center justify-center shrink-0 hover:scale-105 transition-all duration-300 group/avatar z-10"
                                    >
                                      <div className="absolute inset-0 border border-dashed border-info/40 rounded-full anim-rotate-cw anim-pulse-ring"></div>
                                      <div className="absolute inset-1.5 border-2 border-double border-white/10 border-t-info border-b-info rounded-full anim-rotate-ccw"></div>
                                      {silver.logo ? (
                                        <img src={silver.logo} alt="" className="w-16 h-16 rounded-full object-cover border border-info/40 silver-glow relative z-10" />
                                      ) : (
                                        <div className="w-16 h-16 rounded-full bg-background border border-info/40 flex items-center justify-center font-display font-black text-xl text-info silver-glow uppercase relative z-10">
                                          {silver.abreviatura?.slice(0, 3) || 'SLV'}
                                        </div>
                                      )}
                                    </Link>
                                    
                                    <div className="text-center mb-3">
                                      <Link 
                                        to={silver.id ? `/equipos/${silver.id}` : '#'}
                                        className="hover:text-primary transition-colors block"
                                      >
                                        <h4 className="text-sm font-display font-black text-foreground uppercase tracking-wider truncate max-w-[180px] leading-tight hover:text-primary">{silver.nombre}</h4>
                                      </Link>
                                      <span className="text-[9px] font-mono text-info uppercase font-bold tracking-wider block mt-0.5">SUBCAMPEÓN</span>
                                    </div>
                                    
                                    {/* Pedestal Column */}
                                    <div className="w-full h-52 bg-gradient-to-t from-background via-card to-info/15 border-t-2 border-l border-r border-info/40 rounded-t-3xl relative flex flex-col items-center justify-start pt-6 px-4 gap-2 shadow-[0_-10px_30px_rgba(59,130,246,0.15)] group-hover:shadow-[0_-10px_40px_rgba(59,130,246,0.3)] group-hover:border-info/70 transition-all duration-500 overflow-hidden">
                                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-info to-transparent"></div>
                                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(59,130,246,0.05)_100%)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                      
                                      <span className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-info to-info/50 leading-none drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10">#2</span>
                                      
                                      <div className="w-full border-t border-border/20 my-1 z-10" />
                                      
                                      {/* Performance stats grid */}
                                      <div className="w-full text-center space-y-1.5 z-10 font-mono">
                                        <div className="flex justify-between items-center text-[10px]">
                                          <span className="text-muted-foreground font-bold">WIN RATE:</span>
                                          <span className="text-emerald-400 font-black">{silver.winRate}%</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                          <span className="text-muted-foreground font-bold">GOLES (F/C):</span>
                                          <span className="text-foreground font-black">{silver.gf} / {silver.gc}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                          <span className="text-muted-foreground font-bold">RECORD:</span>
                                          <span className="text-foreground font-black">{silver.pg}G-{silver.pe}E-{silver.pp}P</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                          <span className="text-muted-foreground font-bold">PJ / PTS:</span>
                                          <span className="text-info font-black">{silver.pj} PJ / {silver.pts} PTS</span>
                                        </div>
                                      </div>

                                      <span className="text-[8px] bg-info/20 text-info px-3 py-1 rounded-full font-mono uppercase font-black tracking-wider mt-auto mb-4 border border-info/30 shadow-[0_0_10px_rgba(59,130,246,0.3)] z-10">
                                        PLATA
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full md:w-1/3 order-2 md:order-1 flex flex-col items-center justify-end h-52 bg-muted/5 border border-dashed border-border/25 rounded-t-3xl p-6 text-center text-xs text-muted-foreground italic">
                                    Sin Subcampeón
                                  </div>
                                )}

                                {/* 🥇 PRIMER LUGAR (CAMPEÓN) */}
                                {gold ? (
                                  <div className="w-full md:w-1/3 order-1 md:order-2 flex flex-col items-center group -translate-y-4 animate-fade-in-up anim-breathing-card" style={{ animationDelay: '0.2s' }}>
                                    <Link 
                                      to={gold.id ? `/equipos/${gold.id}` : '#'} 
                                      className="relative w-28 h-28 mb-4 flex items-center justify-center shrink-0 hover:scale-105 transition-all duration-300 group/avatar z-10"
                                    >
                                      <div className="absolute inset-0 bg-warning/10 rounded-full blur-xl pointer-events-none animate-pulse"></div>
                                      <div className="absolute inset-0 border-2 border-dashed border-warning rounded-full anim-rotate-cw"></div>
                                      <div className="absolute inset-2 border border-dotted border-primary rounded-full anim-rotate-ccw" style={{ animationDuration: '6s' }}></div>
                                      {gold.logo ? (
                                        <img src={gold.logo} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-warning gold-glow relative z-10" />
                                      ) : (
                                        <div className="w-20 h-20 rounded-full bg-background border-2 border-warning flex items-center justify-center font-display font-black text-2xl text-warning gold-glow uppercase relative z-10">
                                          {gold.abreviatura?.slice(0, 3) || 'GLD'}
                                        </div>
                                      )}
                                    </Link>
                                    
                                    <div className="text-center mb-3">
                                      <Link 
                                        to={gold.id ? `/equipos/${gold.id}` : '#'}
                                        className="hover:text-primary transition-colors block"
                                      >
                                        <h4 className="text-base font-display font-black text-foreground uppercase tracking-wider truncate max-w-[200px] leading-tight hover:text-primary">{gold.nombre}</h4>
                                      </Link>
                                      <span className="text-[10px] font-mono text-warning uppercase font-black tracking-widest block mt-0.5">CAMPEÓN</span>
                                    </div>
                                    
                                    {/* Pedestal Column */}
                                    <div className="w-full h-64 bg-gradient-to-t from-background via-card to-warning/20 border-t-2 border-l border-r border-warning/50 rounded-t-[2.5rem] relative flex flex-col items-center justify-start pt-8 px-4 gap-2 shadow-[0_-15px_40px_rgba(245,158,11,0.25)] group-hover:shadow-[0_-15px_60px_rgba(245,158,11,0.4)] group-hover:border-warning/80 transition-all duration-500 overflow-hidden">
                                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-warning to-transparent opacity-80"></div>
                                      <div className="absolute top-0 inset-x-0 h-32 bg-warning/10 blur-xl pointer-events-none"></div>
                                      <div className="absolute -top-4 bg-gradient-to-r from-warning to-yellow-300 text-yellow-950 font-mono font-black text-[9px] px-4 py-1 rounded-full uppercase tracking-widest border border-warning/50 shadow-[0_0_15px_rgba(245,158,11,0.6)] z-20 animate-bounce-slow">
                                        👑 CAMPEÓN
                                      </div>
                                      
                                      <span className="text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-warning to-warning/40 leading-none drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] z-10 mt-2">#1</span>
                                      
                                      <div className="w-full border-t border-border/20 my-1 z-10" />
                                      
                                      {/* Performance stats grid */}
                                      <div className="w-full text-center space-y-1.5 z-10 font-mono">
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="text-muted-foreground font-bold">WIN RATE:</span>
                                          <span className="text-emerald-400 font-black">{gold.winRate}%</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="text-muted-foreground font-bold">GOLES (F/C):</span>
                                          <span className="text-foreground font-black">{gold.gf} / {gold.gc}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="text-muted-foreground font-bold">RECORD:</span>
                                          <span className="text-foreground font-black">{gold.pg}G-{gold.pe}E-{gold.pp}P</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="text-muted-foreground font-bold">PJ / PTS:</span>
                                          <span className="text-warning font-black">{gold.pj} PJ / {gold.pts} PTS</span>
                                        </div>
                                      </div>

                                      <span className="text-[9px] bg-warning/20 text-warning px-4 py-1 rounded-full font-mono uppercase font-black tracking-widest mt-auto mb-5 border border-warning/30 shadow-[0_0_12px_rgba(245,158,11,0.4)] z-10">
                                        ORO
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full md:w-1/3 order-1 md:order-2 flex flex-col items-center justify-end h-64 bg-muted/5 border border-dashed border-border/25 rounded-t-[2.5rem] p-6 text-center text-xs text-muted-foreground italic">
                                    Sin Campeón
                                  </div>
                                )}

                                {/* 🥉 TERCER LUGAR (3ER LUGAR) */}
                                {bronze ? (
                                  <div className="w-full md:w-1/3 order-3 md:order-3 flex flex-col items-center group mt-8 md:mt-0 animate-fade-in-up anim-breathing-card" style={{ animationDelay: '0.3s' }}>
                                    <Link 
                                      to={bronze.id ? `/equipos/${bronze.id}` : '#'} 
                                      className="relative w-24 h-24 mb-4 flex items-center justify-center shrink-0 hover:scale-105 transition-all duration-300 group/avatar z-10"
                                    >
                                      <div className="absolute inset-0 border border-dashed border-primary/45 rounded-full anim-rotate-cw anim-pulse-ring"></div>
                                      <div className="absolute inset-1.5 border-2 border-double border-white/10 border-t-primary border-b-primary rounded-full anim-rotate-ccw"></div>
                                      {bronze.logo ? (
                                        <img src={bronze.logo} alt="" className="w-16 h-16 rounded-full object-cover border border-primary/40 purple-glow relative z-10" />
                                      ) : (
                                        <div className="w-16 h-16 rounded-full bg-background border border-primary/40 flex items-center justify-center font-display font-black text-xl text-primary purple-glow uppercase relative z-10">
                                          {bronze.abreviatura?.slice(0, 3) || 'BRZ'}
                                        </div>
                                      )}
                                    </Link>
                                    
                                    <div className="text-center mb-3">
                                      <Link 
                                        to={bronze.id ? `/equipos/${bronze.id}` : '#'}
                                        className="hover:text-primary transition-colors block"
                                      >
                                        <h4 className="text-sm font-display font-black text-foreground uppercase tracking-wider truncate max-w-[180px] leading-tight hover:text-primary">{bronze.nombre}</h4>
                                      </Link>
                                      <span className="text-[9px] font-mono text-primary uppercase font-bold tracking-wider block mt-0.5">3ER LUGAR</span>
                                    </div>
                                    
                                    {/* Pedestal Column */}
                                    <div className="w-full h-44 bg-gradient-to-t from-background via-card to-primary/15 border-t-2 border-l border-r border-primary/40 rounded-t-3xl relative flex flex-col items-center justify-start pt-5 px-4 gap-2 shadow-[0_-10px_30px_rgba(139,92,246,0.15)] group-hover:shadow-[0_-10px_40px_rgba(139,92,246,0.3)] group-hover:border-primary/70 transition-all duration-500 overflow-hidden">
                                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                                      
                                      <span className="text-2xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary/50 leading-none drop-shadow-[0_0_10px_rgba(139,92,246,0.5)] z-10">#3</span>
                                      
                                      <div className="w-full border-t border-border/20 my-1 z-10" />
                                      
                                      {/* Performance stats grid */}
                                      <div className="w-full text-center space-y-1 z-10 font-mono">
                                        <div className="flex justify-between items-center text-[10px]">
                                          <span className="text-muted-foreground font-bold">WIN RATE:</span>
                                          <span className="text-emerald-400 font-black">{bronze.winRate}%</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                          <span className="text-muted-foreground font-bold">GOLES (F/C):</span>
                                          <span className="text-foreground font-black">{bronze.gf} / {bronze.gc}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                          <span className="text-muted-foreground font-bold">RECORD:</span>
                                          <span className="text-foreground font-black">{bronze.pg}G-{bronze.pe}E-{bronze.pp}P</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                          <span className="text-muted-foreground font-bold">PJ / PTS:</span>
                                          <span className="text-primary font-black">{bronze.pj} PJ / {bronze.pts} PTS</span>
                                        </div>
                                      </div>

                                      <span className="text-[8px] bg-primary/20 text-primary px-3 py-1 rounded-full font-mono uppercase font-black tracking-wider mt-auto mb-3 border border-primary/30 shadow-[0_0_10px_rgba(139,92,246,0.3)] z-10">
                                        BRONCE
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full md:w-1/3 order-3 md:order-3 flex flex-col items-center justify-end h-44 bg-muted/5 border border-dashed border-border/25 rounded-t-3xl p-6 text-center text-xs text-muted-foreground italic">
                                    Sin 3er Lugar
                                  </div>
                                )}

                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* VISTA SUB-TAB: JUGADORES (INFOGRAFÍA COMPACTA) */}
                    {championsSubTab === 'jugadores' && (
                      <div className="space-y-4">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                          ⭐ LÍDERES INDIVIDUALES (INFOGRAFÍA ESTADÍSTICA)
                        </span>

                        {fc.topStats && (fc.topStats.goleadores?.length > 0 || fc.topStats.asistentes?.length > 0 || fc.topStats.mvps?.length > 0) ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* GOLEADORES */}
                            {fc.topStats.goleadores?.length > 0 ? (
                              <div className="border border-border/30 bg-background/20 rounded-2xl p-4.5 space-y-3.5 relative overflow-hidden shadow-sm">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                                <div className="flex items-center justify-between border-b border-border/10 pb-2">
                                  <span className="text-[10px] font-black tracking-wider text-primary uppercase">⚽ GOLEADOR</span>
                                  <span className="text-[9px] font-bold text-muted-foreground">TOP 3</span>
                                </div>

                                {/* TOP 1 HIGHLIGHT */}
                                {(() => {
                                  const top1 = fc.topStats.goleadores[0];
                                  return (
                                    <div className="flex items-center justify-between bg-primary/5 border border-primary/25 rounded-xl p-3">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center font-display font-black text-primary text-sm shrink-0">
                                          1ST
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-black text-foreground truncate uppercase">{top1.gamertag || top1.name}</p>
                                          <p className="text-[9px] text-muted-foreground truncate">{top1.equipo_nombre}</p>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="text-lg font-display font-black text-primary text-glow-primary">{top1.total}</span>
                                        <span className="text-[8px] font-bold block text-muted-foreground">GOLES</span>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* TOP 2 & 3 LIST */}
                                <div className="space-y-2 pt-1">
                                  {fc.topStats.goleadores.slice(1, 3).map((p, idx) => (
                                    <div key={p.id || idx} className="flex justify-between items-center text-[11px] hover:bg-muted/10 p-1.5 rounded-lg transition-colors">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono text-muted-foreground font-black">{idx + 2}.</span>
                                        <div className="min-w-0">
                                          <span className="font-bold text-foreground truncate max-w-[90px] inline-block uppercase">{p.gamertag || p.name}</span>
                                          <span className="text-[8px] text-muted-foreground truncate block">{p.equipo_nombre}</span>
                                        </div>
                                      </div>
                                      <span className="font-mono font-bold text-primary shrink-0">{p.total} G</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="border border-border/20 bg-background/10 rounded-2xl p-4 text-center text-xs text-muted-foreground italic flex items-center justify-center animate-fade-in">Sin registros</div>
                            )}

                            {/* ASISTENTES */}
                            {fc.topStats.asistentes?.length > 0 ? (
                              <div className="border border-border/30 bg-background/20 rounded-2xl p-4.5 space-y-3.5 relative overflow-hidden shadow-sm">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                                <div className="flex items-center justify-between border-b border-border/10 pb-2">
                                  <span className="text-[10px] font-black tracking-wider text-emerald-400 uppercase">🎯 ASISTENTE</span>
                                  <span className="text-[9px] font-bold text-muted-foreground">TOP 3</span>
                                </div>

                                {/* TOP 1 HIGHLIGHT */}
                                {(() => {
                                  const top1 = fc.topStats.asistentes[0];
                                  return (
                                    <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-3">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-display font-black text-emerald-400 text-sm shrink-0">
                                          1ST
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-black text-foreground truncate uppercase">{top1.gamertag || top1.name}</p>
                                          <p className="text-[9px] text-muted-foreground truncate">{top1.equipo_nombre}</p>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="text-lg font-display font-black text-emerald-400 text-glow-emerald">{top1.total}</span>
                                        <span className="text-[8px] font-bold block text-muted-foreground">ASIST.</span>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* TOP 2 & 3 LIST */}
                                <div className="space-y-2 pt-1">
                                  {fc.topStats.asistentes.slice(1, 3).map((p, idx) => (
                                    <div key={p.id || idx} className="flex justify-between items-center text-[11px] hover:bg-muted/10 p-1.5 rounded-lg transition-colors">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono text-muted-foreground font-black">{idx + 2}.</span>
                                        <div className="min-w-0">
                                          <span className="font-bold text-foreground truncate max-w-[90px] inline-block uppercase">{p.gamertag || p.name}</span>
                                          <span className="text-[8px] text-muted-foreground truncate block">{p.equipo_nombre}</span>
                                        </div>
                                      </div>
                                      <span className="font-mono font-bold text-emerald-400 shrink-0">{p.total} A</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="border border-border/20 bg-background/10 rounded-2xl p-4 text-center text-xs text-muted-foreground italic flex items-center justify-center animate-fade-in">Sin registros</div>
                            )}

                            {/* MVPS */}
                            {fc.topStats.mvps?.length > 0 ? (
                              <div className="border border-border/30 bg-background/20 rounded-2xl p-4.5 space-y-3.5 relative overflow-hidden shadow-sm">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />
                                <div className="flex items-center justify-between border-b border-border/10 pb-2">
                                  <span className="text-[10px] font-black tracking-wider text-yellow-400 uppercase">⭐ MVP DE ORO</span>
                                  <span className="text-[9px] font-bold text-muted-foreground">TOP 3</span>
                                </div>

                                {/* TOP 1 HIGHLIGHT */}
                                {(() => {
                                  const top1 = fc.topStats.mvps[0];
                                  return (
                                    <div className="flex items-center justify-between bg-yellow-500/5 border border-yellow-500/25 rounded-xl p-3">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center font-display font-black text-yellow-400 text-sm shrink-0">
                                          1ST
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-black text-foreground truncate uppercase">{top1.gamertag || top1.name}</p>
                                          <p className="text-[9px] text-muted-foreground truncate">{top1.equipo_nombre}</p>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="text-lg font-display font-black text-yellow-400 text-glow-yellow">{Number(top1.total).toFixed(1)}</span>
                                        <span className="text-[8px] font-bold block text-muted-foreground">VALOR.</span>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* TOP 2 & 3 LIST */}
                                <div className="space-y-2 pt-1">
                                  {fc.topStats.mvps.slice(1, 3).map((p, idx) => (
                                    <div key={p.id || idx} className="flex justify-between items-center text-[11px] hover:bg-muted/10 p-1.5 rounded-lg transition-colors">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono text-muted-foreground font-black">{idx + 2}.</span>
                                        <div className="min-w-0">
                                          <span className="font-bold text-foreground truncate max-w-[90px] inline-block uppercase">{p.gamertag || p.name}</span>
                                          <span className="text-[8px] text-muted-foreground truncate block">{p.equipo_nombre}</span>
                                        </div>
                                      </div>
                                      <span className="font-mono font-bold text-yellow-400 shrink-0">{Number(p.total).toFixed(1)} ⭐</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="border border-border/20 bg-background/10 rounded-2xl p-4 text-center text-xs text-muted-foreground italic flex items-center justify-center animate-fade-in">Sin registros</div>
                            )}

                          </div>
                        ) : (
                          <div className="border border-border/20 border-dashed rounded-2xl p-6 text-center text-xs text-muted-foreground italic bg-muted/5">
                            No hay líderes estadísticos registrados en esta división.
                          </div>
                        )}
                      </div>
                    )}
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
                        <img 
                          src={getImageUrl(ds.banner || organizacion.banner, 'org_banner')} 
                          alt={ds.nombre} 
                          className="absolute inset-0 w-full h-full object-cover opacity-30" 
                          onError={(e) => window.handleImageError(e, 'org_banner')}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent"></div>
                        
                        <div className="relative z-15 flex items-center gap-3">
                          <img 
                            src={getImageUrl(ds.logo, 'team_logo')} 
                            alt={ds.nombre} 
                            className="w-10 h-10 rounded-lg object-cover border border-border/40 bg-card shadow-sm" 
                            onError={(e) => window.handleImageError(e, 'team_logo')}
                          />
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
                              <img 
                                src={getImageUrl(ds.leader.logo, 'team_logo')} 
                                alt={ds.leader.nombre} 
                                className="w-7 h-7 rounded-md object-cover border border-border/40 bg-card shadow-inner" 
                                onError={(e) => window.handleImageError(e, 'team_logo')}
                              />
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
                        onClick={() => navigate(ds.esUt ? `/competencia-ut-detalle/${ds.id}` : `/competencia-detalle/${ds.id}`)}
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
