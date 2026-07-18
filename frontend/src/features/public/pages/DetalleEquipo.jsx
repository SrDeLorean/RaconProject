import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/api/axios';
import Badge from '@/components/ui/Badge';
import Partidos from './Partidos';

const translatePosition = (pos) => {
  if (!pos) return '—';
  const p = pos.toUpperCase();
  const map = {
    'GK': 'POR',
    'PO': 'POR',
    'CB': 'DFC',
    'LB': 'LI',
    'RB': 'LD',
    'LWB': 'CAR',
    'RWB': 'CAD',
    'CDM': 'MCD',
    'CM': 'MC',
    'CAM': 'MCO',
    'LM': 'MI',
    'RM': 'MD',
    'LW': 'EI',
    'RW': 'ED',
    'CF': 'SD',
    'ST': 'DC',
    'DF': 'DFC',
    'DL': 'DC',
    'DEFENDER': 'DFC',
    'MIDFIELDER': 'MC'
  };
  return map[p] || p;
};

function FilterChip({ label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap transition-all duration-200 border cursor-pointer ${
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
          : 'bg-card/25 text-muted-foreground border-border/40 hover:border-primary/40 hover:text-foreground backdrop-blur-sm'
      }`}
    >
      {label}
      {count != null && (
        <span className={`text-[8px] px-1.5 py-0.5 rounded font-black ${active ? 'bg-white/20' : 'bg-muted/50'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

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
  )
};

const SOCIAL_THEMES = {
  whatsapp: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]',
  instagram: 'bg-pink-500/10 border-pink-500/30 text-pink-400 hover:bg-pink-500/25 hover:shadow-[0_0_12px_rgba(236,72,153,0.3)]',
  twitter: 'bg-slate-300/10 border-slate-300/30 text-slate-300 hover:bg-slate-300/25 hover:shadow-[0_0_12px_rgba(203,213,225,0.3)]',
  x: 'bg-slate-300/10 border-slate-300/30 text-slate-300 hover:bg-slate-300/25 hover:shadow-[0_0_12px_rgba(203,213,225,0.3)]',
  twitch: 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/25 hover:shadow-[0_0_12px_rgba(168,85,247,0.3)]',
  youtube: 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/25 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]',
  tiktok: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 hover:shadow-[0_0_12px_rgba(6,182,212,0.3)]'
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
};



function computeStandings(partidos, equipos) {
    if (!partidos || !equipos) return [];
    const map = {};
    equipos.forEach(eq => {
      map[eq.id] = {
        id: eq.id,
        equipo_id: eq.id, 
        nombre: eq.nombre, 
        abreviatura: eq.abreviatura, 
        logo: eq.logo,
        pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0,
        ultimosCinco: []
      };
    });

    // Sort matches chronologically to calculate form order correctly
    const sortedPartidos = [...partidos].sort((a, b) => {
      const dateA = a.fecha || '';
      const dateB = b.fecha || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const timeA = a.hora || '';
      const timeB = b.hora || '';
      return timeA.localeCompare(timeB);
    });

    sortedPartidos.forEach(p => {
      if (p.goles_local == null || p.goles_visitante == null) return;
      const gl = p.goles_local, gv = p.goles_visitante;
      const lid = p.equipo_local_id || p.local?.id;
      const vid = p.equipo_visitante_id || p.visitante?.id;
      
      if (!lid || !vid || !map[lid] || !map[vid]) return;
      
      const tl = map[lid], tv = map[vid];
      tl.pj++; tv.pj++;
      tl.gf += gl; tl.gc += gv;
      tv.gf += gv; tv.gc += gl;
      if (gl > gv) {
        tl.pg++; tl.pts += 3; tv.pp++;
        tl.ultimosCinco.push('v');
        tv.ultimosCinco.push('x');
      } else if (gl < gv) {
        tv.pg++; tv.pts += 3; tl.pp++;
        tl.ultimosCinco.push('x');
        tv.ultimosCinco.push('v');
      } else {
        tl.pe++; tl.pts++; tv.pe++; tv.pts++;
        tl.ultimosCinco.push('-');
        tv.ultimosCinco.push('-');
      }
    });

    Object.values(map).forEach(t => {
      t.ultimosCinco = t.ultimosCinco.slice(-5);
    });

    const arr = Object.values(map).map(t => ({ ...t, dg: t.gf - t.gc }));
    return arr.sort(
      (a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf
    );
}

export default function DetalleEquipo() {
  const { id } = useParams();
  const [equipo, setEquipo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roster');
  
  // Traspasos filters & pagination
  const [traspasosSearch, setTraspasosSearch] = useState('');
  const [traspasosFiltro, setTraspasosFiltro] = useState('todos'); // 'todos' | 'alta' | 'baja'
  const [traspasosPage, setTraspasosPage] = useState(1);

  // New filters & loading states
  const [allOrgs, setAllOrgs] = useState([]);
  const [rosterOrg, setRosterOrg] = useState('todos');
  const [traspasosOrg, setTraspasosOrg] = useState('todos');
  const [statsOrg, setStatsOrg] = useState('');
  const [loadingStats, setLoadingStats] = useState(false);
  const [historyOrg, setHistoryOrg] = useState('todos');
  const [historySeason, setHistorySeason] = useState('todos');

  // --- Posiciones States ---
  const [posicionesOrg, setPosicionesOrg] = useState('todos');
  const [posicionesComp, setPosicionesComp] = useState(null);
  const [posicionesData, setPosicionesData] = useState(null);
  const [loadingPosiciones, setLoadingPosiciones] = useState(false);

  // Memoized list of filtered competencies for the team
  const teamCompetenciasFiltradas = useMemo(() => {
    if (!equipo || !equipo.competencias) return [];
    return equipo.competencias.filter(c => {
      if (posicionesOrg === 'todos') return true;
      const orgId = c.temporada?.organizacion?.id || c.temporada?.organizacion_id;
      return orgId?.toString() === posicionesOrg;
    });
  }, [equipo, posicionesOrg]);

  // Automatically select the first competition in the filtered list
  useEffect(() => {
    if (teamCompetenciasFiltradas.length > 0) {
      const exists = teamCompetenciasFiltradas.some(c => c.id === posicionesComp);
      if (!exists) {
        setPosicionesComp(teamCompetenciasFiltradas[0].id);
      }
    } else {
      setPosicionesComp(null);
    }
  }, [teamCompetenciasFiltradas, posicionesComp]);

  // Effect to fetch posiciones when selected competition changes or activeTab changes
  useEffect(() => {
    if (activeTab !== 'posiciones' || !equipo) return;
    if (!posicionesComp) {
      setPosicionesData(null);
      return;
    }

    const fetchPosiciones = async () => {
      setLoadingPosiciones(true);
      setPosicionesData(null);
      try {
        const res = await api.get(`/competencias/${posicionesComp}`);
        const compData = res.data.data || res.data;
        const tabla = computeStandings(compData.partidos, compData.equipos);
        setPosicionesData({ 
          id: compData.id,
          nombre: compData.nombre, 
          logo: compData.logo,
          formato: compData.formato,
          partidos: compData.partidos,
          tabla 
        });
      } catch (err) {
        console.error("Error fetching posiciones:", err);
      } finally {
        setLoadingPosiciones(false);
      }
    };
    fetchPosiciones();
  }, [activeTab, posicionesComp, equipo]);

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

  // Combined data fetching on mount
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const orgsResponse = await api.get('/organizaciones');
        const orgsData = orgsResponse.data?.data || orgsResponse.data || [];
        setAllOrgs(orgsData);

        let defaultOrgId = '';
        if (orgsData.length > 0) {
          defaultOrgId = orgsData[0].id.toString();
          setStatsOrg(defaultOrgId);
        }

        const teamResponse = await api.get(`/equipos/${id}`, {
          params: defaultOrgId ? { organizacion_id: defaultOrgId } : {}
        });
        setEquipo(teamResponse.data);
      } catch (error) {
        console.error("Error al obtener datos iniciales del equipo:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [id]);

  const handleStatsOrgChange = async (orgId) => {
    setStatsOrg(orgId);
    setLoadingStats(true);
    try {
      const response = await api.get(`/equipos/${id}`, {
        params: orgId ? { organizacion_id: orgId } : {}
      });
      setEquipo(prev => ({
        ...prev,
        estadisticas: response.data.estadisticas,
        goleadores: response.data.goleadores,
        asistentes: response.data.asistentes,
        mejores_arqueros: response.data.mejores_arqueros,
        mejores_defensores: response.data.mejores_defensores,
        mejores_medios: response.data.mejores_medios,
      }));
    } catch (err) {
      console.error("Error al cargar estadísticas filtradas:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Helper selectors for historical filters
  const uniqueHistoryOrgs = useMemo(() => {
    if (!equipo || !equipo.historial_club) return [];
    const map = {};
    equipo.historial_club.forEach(h => {
      if (h.organizacion_id) {
        map[h.organizacion_id] = h.organizacion_nombre;
      }
    });
    return Object.entries(map).map(([id, nombre]) => ({ id, nombre }));
  }, [equipo]);

  const uniqueHistorySeasons = useMemo(() => {
    if (!equipo || !equipo.historial_club || historyOrg === 'todos') return [];
    const map = {};
    equipo.historial_club.forEach(h => {
      if (h.organizacion_id?.toString() === historyOrg && h.temporada_id) {
        map[h.temporada_id] = h.temporada_nombre;
      }
    });
    return Object.entries(map).map(([id, nombre]) => ({ id, nombre }));
  }, [equipo, historyOrg]);

  const handleHistoryOrgChange = (val) => {
    setHistoryOrg(val);
    setHistorySeason('todos');
  };

  const filteredHistory = useMemo(() => {
    if (!equipo || !equipo.historial_club) return [];
    return equipo.historial_club.filter(h => {
      if (historyOrg !== 'todos' && h.organizacion_id?.toString() !== historyOrg) return false;
      if (historySeason !== 'todos' && h.temporada_id?.toString() !== historySeason) return false;
      return true;
    });
  }, [equipo, historyOrg, historySeason]);

  const getImageUrl = (path, fallbackType) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (typeof window.mediaUrl === 'function') {
      return window.mediaUrl(path, fallbackType);
    }
    return window.mediaUrl(path, fallbackType);
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
    <div className="relative min-h-screen bg-background pb-16 overflow-hidden">
      {/* Resplandores ambientales e-sports */}
      <div className={`absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] ${equipo.plataforma?.toUpperCase().includes('XBOX') ? 'bg-emerald-500/5' : equipo.plataforma?.toUpperCase().includes('PC') ? 'bg-amber-500/5' : 'bg-blue-500/5'} blur-[130px] rounded-full pointer-events-none z-10`}></div>
      <div className={`absolute bottom-1/3 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] ${equipo.plataforma?.toUpperCase().includes('XBOX') ? 'bg-emerald-500/3' : equipo.plataforma?.toUpperCase().includes('PC') ? 'bg-amber-500/3' : 'bg-blue-500/3'} blur-[120px] rounded-full pointer-events-none z-10`}></div>

      {/* Banner Superior Inmersivo */}
      <div className="h-80 md:h-[460px] relative z-0 overflow-hidden bg-card">
        {equipo.banner ? (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${getImageUrl(equipo.banner, 'team_banner')}')` }}
          />
        ) : (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-overlay"
            style={{ backgroundImage: `url('${getImageUrl('default-team-banner', 'team_banner')}')` }}
          />
        )}
        {/* platform theme gradient fallback */}
        {!equipo.banner && (
          <div className={`absolute inset-0 bg-gradient-to-br ${platCfg.gradient} opacity-90 -z-10`} />
        )}
        {/* Grid and scanline tech layers */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent"></div>
        
        {/* Floating tech banner elements */}
        <div className="absolute top-1/3 left-10 text-[6rem] md:text-[10rem] font-display font-black uppercase text-foreground/[0.015] select-none leading-none pointer-events-none font-extrabold tracking-tighter">
          {equipo.abreviatura || 'CLUB'}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-10 relative z-10 -mt-20 md:-mt-28 space-y-8 animate-fade-in-up">
        
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
              {equipo.redes_sociales && Object.values(equipo.redes_sociales).some(Boolean) && (
                <div className="flex flex-wrap items-center gap-2 mt-2 justify-center md:justify-start">
                  {Object.entries(equipo.redes_sociales).map(([platform, value]) => {
                    if (!value) return null;
                    const url = getSocialLink(platform, value);
                    if (!url) return null;
                    const icon = SOCIAL_ICONS[platform.toLowerCase()];
                    const theme = SOCIAL_THEMES[platform.toLowerCase()] || 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-card';
                    
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono font-bold uppercase transition-all duration-300 ${theme}`}
                        title={`${platform}: ${value}`}
                      >
                        {icon}
                        <span>{platform}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/equipos" className="px-4 py-2 bg-muted border border-border/50 rounded-xl text-xs font-black uppercase text-foreground hover:bg-card transition-all">
              🛡️ Directorio
            </Link>
          </div>
        </div>

        {/* Tabulación de Secciones */}
        <div className="flex border border-border/40 p-1 bg-card/25 backdrop-blur-md rounded-2xl max-w-4xl mx-auto shadow-xl overflow-x-auto gap-1 mobile-scroll-indicator pb-2.5">
          {[
            { id: 'roster', label: '👥 Plantilla' },
            { id: 'posiciones', label: '🏆 Posiciones' },
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
                  ? `${platCfg.bg} ${platCfg.color} ${platCfg.border} ${platCfg.glow}`
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
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
            <div className="space-y-8 animate-fade-in">
              {/* Selector de Organización para Roster */}
              <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-4.5 max-w-md mx-auto shadow-md flex flex-col gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-mono">🏢 FILTRAR POR ORGANIZACIÓN</span>
                <select 
                  value={rosterOrg}
                  onChange={(e) => setRosterOrg(e.target.value)}
                  className="input-premium uppercase"
                >
                  <option value="todos">🌎 Todas las organizaciones</option>
                  {allOrgs.map(org => (
                    <option key={org.id} value={org.id.toString()}>🏢 {org.nombre}</option>
                  ))}
                </select>
              </div>

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
                    if (rosterOrg !== 'todos' && (!p.organizacion || p.organizacion.id.toString() !== rosterOrg)) {
                      return;
                    }
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
                    <div className="border border-border/50 bg-muted/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 max-w-xl mx-auto shadow-md animate-fade-in-up">
                      <span className="text-2xl">👥</span>
                      <p className="text-xs text-muted-foreground font-medium italic">No hay jugadores registrados en el roster oficial con los filtros aplicados.</p>
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
                                      {(p.gamertag || p.name || '?').charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-display font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors duration-300">
                                    🎮 {p.gamertag || 'EA ID'}
                                  </h4>
                                  <span className="text-[10px] text-muted-foreground font-sans block mt-0.5 truncate">
                                    {p.name}
                                  </span>
                                  {rosterOrg === 'todos' && p.organizacion && (
                                    <span className="text-[9px] text-primary/80 font-mono block mt-1 truncate">
                                      🏢 {p.organizacion.nombre}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right shrink-0 z-10 flex flex-col items-end gap-1.5">
                                <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary font-black px-2 py-0.5 rounded-md font-mono shadow-sm">
                                  N° {p.dorsal || '—'}
                                </span>
                                <span className={`text-[9px] border font-black px-2 py-0.5 rounded-md uppercase font-mono ${posStyles.posColor}`}>
                                  {translatePosition(p.posicion)}
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

            {activeTab === 'posiciones' && (
            <div className="space-y-6 animate-fade-in">
              {/* ── FILTERS PANEL ── */}
              <div className="border border-border/40 bg-card/25 backdrop-blur-md rounded-2xl p-5 space-y-4 shadow-md">
                
                {/* Org chips */}
                {allOrgs.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground font-mono">Confederación / Organización</p>
                    <div className="flex flex-wrap gap-2">
                      <FilterChip 
                        label="Todas" 
                        active={posicionesOrg === 'todos'}
                        onClick={() => setPosicionesOrg('todos')} 
                      />
                      {allOrgs.map(org => {
                        const backendBaseUrl = api.defaults.baseURL?.replace(/\/api$/, '') ;
                        const logoUrl = org.logo 
                          ? (org.logo.startsWith('http') 
                              ? org.logo 
                              : (typeof window.mediaUrl === 'function' 
                                  ? window.mediaUrl(org.logo) 
                                  : `${backendBaseUrl}${org.logo}`)) 
                          : '';
                        return (
                          <FilterChip 
                            key={org.id} 
                            label={
                              <span className="flex items-center gap-1.5">
                                {logoUrl && (
                                  <img src={logoUrl} alt="" className="w-4.5 h-4.5 rounded object-cover" />
                                )}
                                <span>{org.nombre}</span>
                              </span>
                            } 
                            active={posicionesOrg === org.id.toString()}
                            onClick={() => setPosicionesOrg(org.id.toString())} 
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Competition chips */}
                {teamCompetenciasFiltradas.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground font-mono">Competencia del Equipo</p>
                    <div className="flex flex-wrap gap-2">
                      {teamCompetenciasFiltradas.map(c => {
                        const fmt = (c.formato || 'liga').toLowerCase();
                        const fmtIcon = fmt === 'copa' ? '🥇' : fmt.includes('playoff') ? '🏆' : '🏟️';
                        
                        const backendBaseUrl = api.defaults.baseURL?.replace(/\/api$/, '') ;
                        const logoUrl = c.logo 
                          ? (c.logo.startsWith('http') 
                              ? c.logo 
                              : (typeof window.mediaUrl === 'function' 
                                  ? window.mediaUrl(c.logo) 
                                  : `${backendBaseUrl}${c.logo}`)) 
                          : '';
                        
                        return (
                          <FilterChip 
                            key={c.id} 
                            label={
                              <span className="flex items-center gap-1.5">
                                {logoUrl ? (
                                  <img src={logoUrl} alt="" className="w-4.5 h-4.5 rounded object-cover" />
                                ) : (
                                  <span>{fmtIcon}</span>
                                )}
                                <span>{c.nombre}</span>
                              </span>
                            }
                            active={posicionesComp === c.id}
                            onClick={() => setPosicionesComp(c.id)} 
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── STANDINGS DISPLAY ── */}
              <div className="border border-border/40 bg-card/15 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
                {loadingPosiciones ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Calculando Posiciones...</span>
                  </div>
                ) : !posicionesData || !posicionesData.tabla || posicionesData.tabla.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground font-mono text-xs uppercase tracking-wide">
                    ⚠️ No hay competencias registradas o datos de posiciones en el filtro seleccionado.
                  </div>
                ) : (
                  <div>
                    <div className="px-5 py-3.5 bg-muted/20 border-b border-border/40 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-primary font-display flex items-center gap-2">
                        🏆 Clasificación: {posicionesData.nombre}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border/40 bg-muted/30 text-[9px] uppercase font-black text-muted-foreground tracking-widest font-mono">
                            <th className="px-4 py-3 text-center w-10">#</th>
                            <th className="px-4 py-3">Club</th>
                            <th className="px-4 py-3 text-center w-12">PJ</th>
                            <th className="hidden sm:table-cell px-4 py-3 text-center w-12 text-emerald-400">PG</th>
                            <th className="hidden sm:table-cell px-4 py-3 text-center w-12">PE</th>
                            <th className="hidden sm:table-cell px-4 py-3 text-center w-12 text-destructive">PP</th>
                            <th className="hidden md:table-cell px-4 py-3 text-center w-12">GF</th>
                            <th className="hidden md:table-cell px-4 py-3 text-center w-12">GC</th>
                            <th className="px-4 py-3 text-center w-14">DG</th>
                            <th className="px-4 py-3 text-center w-16 text-primary">Pts</th>
                            <th className="hidden lg:table-cell px-4 py-3 text-center w-36">Últimos 5</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30 font-semibold text-xs">
                          {(() => {
                            const hasResults = posicionesData.tabla.some(s => s.pj > 0);
                            return posicionesData.tabla.map((s, idx) => {
                              const isCurrentTeam = s.equipo_id === parseInt(id);
                              const dg = s.gf - s.gc;
                              const backendBaseUrl = api.defaults.baseURL?.replace(/\/api$/, '') ;
                              const logoUrl = s.logo 
                                ? (s.logo.startsWith('http') 
                                    ? s.logo 
                                    : (typeof window.mediaUrl === 'function' 
                                        ? window.mediaUrl(s.logo) 
                                        : `${backendBaseUrl}${s.logo}`)) 
                                : '';

                              return (
                                <tr
                                  key={s.equipo_id}
                                  className={`transition-colors duration-200 ${
                                    isCurrentTeam 
                                      ? 'bg-primary/20 border-y border-primary/45 shadow-[inset_4px_0_0_hsla(var(--primary),1)]' 
                                      : 'hover:bg-primary/5'
                                  } ${idx === 0 && hasResults ? 'bg-primary/5' : ''}`}
                                >
                                  <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded font-black font-mono text-[10px] shadow-sm ${
                                      idx === 0 && hasResults ? 'bg-gradient-to-tr from-amber-400 to-yellow-600 text-slate-950 shadow-amber-400/30' :
                                      idx === 1 && hasResults ? 'bg-gradient-to-tr from-slate-300 to-slate-500 text-slate-950 shadow-slate-400/20' :
                                      idx === 2 && hasResults ? 'bg-gradient-to-tr from-amber-700 to-amber-900 text-amber-100 shadow-amber-900/20' :
                                      'bg-muted/60 text-foreground'
                                    }`}>{idx + 1}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                      {logoUrl ? (
                                        <img 
                                          src={logoUrl} 
                                          alt={s.nombre} 
                                          className="w-8 h-8 rounded-lg object-cover border border-border/50 shadow-inner bg-card shrink-0"
                                        />
                                      ) : (
                                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-display font-black text-[9px] shadow-inner uppercase shrink-0 ${
                                          idx === 0 && hasResults ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-muted/40 border-border/50 text-foreground'
                                        }`}>{s.abreviatura || s.nombre?.substring(0,3)}</div>
                                      )}
                                      <span className={`font-black uppercase tracking-wide ${isCurrentTeam ? 'text-primary' : 'text-foreground'}`}>
                                        {s.nombre}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center font-mono">{s.pj}</td>
                                  <td className="hidden sm:table-cell px-4 py-3 text-center font-mono text-emerald-400">{s.pg}</td>
                                  <td className="hidden sm:table-cell px-4 py-3 text-center font-mono text-muted-foreground">{s.pe}</td>
                                  <td className="hidden sm:table-cell px-4 py-3 text-center font-mono text-destructive">{s.pp}</td>
                                  <td className="hidden md:table-cell px-4 py-3 text-center font-mono">{s.gf}</td>
                                  <td className="hidden md:table-cell px-4 py-3 text-center font-mono">{s.gc}</td>
                                  <td className={`px-4 py-3 text-center font-mono font-bold ${dg > 0 ? 'text-emerald-400' : dg < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                    {dg > 0 ? `+${dg}` : dg}
                                  </td>
                                  <td className="px-4 py-3 text-center font-mono text-primary font-black text-sm">{s.pts}</td>
                                  <td className="hidden lg:table-cell px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {s.ultimosCinco && s.ultimosCinco.length > 0 ? (
                                        s.ultimosCinco.map((res, rIdx) => {
                                          let bgColor = 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
                                          if (res === 'v') bgColor = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                                          if (res === 'x') bgColor = 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
                                          return (
                                            <span
                                              key={rIdx}
                                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black uppercase ${bgColor}`}
                                              title={res === 'v' ? 'Victoria' : res === 'x' ? 'Derrota' : 'Empate'}
                                            >
                                              {res}
                                            </span>
                                          );
                                        })
                                      ) : (
                                        <span className="text-muted-foreground/40 text-[10px] font-mono">—</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
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
              <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-4.5 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto shadow-md">
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
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-mono">🏢 ORGANIZACIÓN</span>
                  <select 
                    value={traspasosOrg}
                    onChange={(e) => { setTraspasosOrg(e.target.value); setTraspasosPage(1); }}
                    className="input-premium uppercase"
                  >
                    <option value="todos">🌎 Todas las organizaciones</option>
                    {allOrgs.map(org => (
                      <option key={org.id} value={org.id.toString()}>🏢 {org.nombre}</option>
                    ))}
                  </select>
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
                  if (traspasosOrg !== 'todos' && (!t.organizacion || t.organizacion.id.toString() !== traspasosOrg)) return false;
                  return nameMatch;
                });

                const perPage = 5;
                const totalTraspasosPages = Math.ceil(list.length / perPage);
                const paginatedList = list.slice((traspasosPage - 1) * perPage, traspasosPage * perPage);

                if (list.length === 0) {
                  return (
                    <div className="border border-border/50 bg-muted/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 max-w-xl mx-auto shadow-md">
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
                                    {(userF.gamertag || userF.name || '?').charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <Link to={`/jugadores/${userF.id}`} className="font-display font-black text-sm text-foreground hover:text-primary transition-colors uppercase tracking-wide truncate block">
                                  🎮 {userF.gamertag || 'EA ID'}
                                </Link>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-muted-foreground font-sans font-bold">
                                    {userF.name || 'Competidor'}
                                  </span>
                                  {userF.posicion && (
                                    <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded border ${posStyles.posColor}`}>
                                      {translatePosition(userF.posicion)}
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
                                🏢 Organización: {t.organizacion?.nombre || 'General'}
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
            <div className="space-y-8 animate-fade-in">
              {/* Selector de Organización para estadísticas */}
              <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-4.5 max-w-md mx-auto shadow-md flex flex-col gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-mono">🏢 FILTRAR POR ORGANIZACIÓN (EN CURSO)</span>
                <select 
                  value={statsOrg}
                  onChange={(e) => handleStatsOrgChange(e.target.value)}
                  className="input-premium uppercase"
                >
                  <option value="">🌎 Selecciona una organización</option>
                  {allOrgs.map(org => (
                    <option key={org.id} value={org.id.toString()}>🏢 {org.nombre}</option>
                  ))}
                </select>
              </div>

              {loadingStats ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                  <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Actualizando estadísticas...</span>
                </div>
              ) : (
                <div className="space-y-12">
                  {/* Bloque 1: Estadísticas Tácticas de Equipo */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-display font-black uppercase tracking-wider text-foreground border-b border-border/20 pb-2">
                      Estadísticas de Temporada (Equipo)
                    </h2>
                    {equipo.estadisticas && equipo.estadisticas.jugados > 0 ? (
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
                        <p className="text-xs text-muted-foreground font-medium italic">No hay estadísticas acumuladas en partidos finalizados para competencias en progreso de esta organización.</p>
                      </div>
                    )}
                  </div>

                  {/* Bloque 1.5: Estadísticas Avanzadas de Equipo */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-display font-black uppercase tracking-wider text-foreground border-b border-border/20 pb-2">
                      Rendimiento Avanzado
                    </h2>
                    {equipo.estadisticas && (equipo.estadisticas.total_tiros > 0 || equipo.estadisticas.total_pases > 0) ? (
                      (() => {
                        const stats = equipo.estadisticas || {};
                        return (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                              {[
                                { label: 'Posesión', value: `${stats.avg_posesion}%`, color: 'text-primary', bg: 'bg-primary/5 border-primary/20 hover:border-primary/45' },
                                { label: 'Tiros Totales', value: stats.total_tiros, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/45' },
                                { label: 'Pases', value: stats.total_pases, color: 'text-foreground', bg: 'bg-card/20 border-border/40' },
                                { label: 'Prec. Pases', value: `${stats.avg_precision_pases}%`, color: 'text-sky-400', bg: 'bg-sky-500/5 border-sky-500/20 hover:border-sky-500/45' },
                                { label: 'Entradas Ext.', value: stats.total_entradas_exitosas, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/45' },
                                { label: 'Atajadas', value: stats.total_atajadas, color: 'text-rose-500', bg: 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/45' },
                              ].map((stat, idx) => (
                                <div key={`adv-${idx}`} className={`relative overflow-hidden border backdrop-blur-md rounded-2xl p-3 sm:p-5 text-center space-y-1 shadow-md transition-all duration-300 hover:scale-[1.02] ${stat.bg}`}>
                                  <div className="absolute top-0 right-0 w-8 h-8 bg-foreground/[0.01] pointer-events-none"></div>
                                  <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-widest block leading-none font-mono">
                                    {stat.label}
                                  </span>
                                  <strong className={`text-xl sm:text-2xl font-display font-black block leading-none pt-1 ${stat.color} font-mono`}>
                                    {stat.value}
                                  </strong>
                                </div>
                              ))}
                            </div>
                        );
                      })()
                    ) : (
                      <div className="border border-border/50 bg-muted/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
                        <span className="text-2xl opacity-50">🤖</span>
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-medium italic">Sube reportes mediante Inteligencia Artificial para habilitar las estadísticas avanzadas del club.</p>
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
                                          {(g.gamertag || g.name || '?').charAt(0)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <Link to={`/jugadores/${g.id}`} className="font-display font-bold text-[11px] sm:text-xs text-foreground hover:text-primary transition-colors truncate block">
                                        🎮 {g.gamertag || 'EA ID'}
                                      </Link>
                                      <span className="text-[8px] sm:text-[9px] text-muted-foreground font-sans block truncate mt-0.5">
                                        {g.name}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0 z-10 flex flex-col items-end gap-1">
                                    <strong className="text-[11px] sm:text-xs font-black text-primary font-mono">
                                      {g.total_goles} {g.total_goles === 1 ? 'Gol' : 'Goles'}
                                    </strong>
                                    <span className={`text-[7px] sm:text-[8px] font-mono font-bold px-1 sm:px-1.5 py-0.2 rounded border ${posStyles.posColor}`}>
                                      {translatePosition(g.posicion)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground bg-muted/20 p-4 rounded-xl text-center italic border border-border/30">No se registran goles oficiales anotados.</p>
                        )}
                      </div>

                      {/* Ranking Asistentes del Club */}
                      <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-lg">
                        <h3 className="text-[10px] sm:text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2 flex items-center justify-between">
                          <span>🎯 LÍDERES DE ASISTENCIAS</span>
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
                                          {(a.gamertag || a.name || '?').charAt(0)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <Link to={`/jugadores/${a.id}`} className="font-display font-bold text-[11px] sm:text-xs text-foreground hover:text-primary transition-colors truncate block">
                                        🎮 {a.gamertag || 'EA ID'}
                                      </Link>
                                      <span className="text-[8px] sm:text-[9px] text-muted-foreground font-sans block truncate mt-0.5">
                                        {a.name}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0 z-10 flex flex-col items-end gap-1">
                                    <strong className="text-[11px] sm:text-xs font-black text-primary font-mono">
                                      {a.total_asistencias} {a.total_asistencias === 1 ? 'Asist.' : 'Asist.'}
                                    </strong>
                                    <span className={`text-[7px] sm:text-[8px] font-mono font-bold px-1 sm:px-1.5 py-0.2 rounded border ${posStyles.posColor}`}>
                                      {translatePosition(a.posicion)}
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
                                          {(r.gamertag || r.name || '?').charAt(0)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <Link to={`/jugadores/${r.id}`} className="font-display font-bold text-[11px] sm:text-xs text-foreground hover:text-primary transition-colors truncate block">
                                        🎮 {r.gamertag || 'EA ID'}
                                      </Link>
                                      <span className="text-[8px] sm:text-[9px] text-muted-foreground font-sans block truncate mt-0.5">
                                        {r.name}
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
                                          {(d.gamertag || d.name || '?').charAt(0)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <Link to={`/jugadores/${d.id}`} className="font-display font-bold text-[11px] sm:text-xs text-foreground hover:text-primary transition-colors truncate block">
                                        🎮 {d.gamertag || 'EA ID'}
                                      </Link>
                                      <span className="text-[8px] sm:text-[9px] text-muted-foreground font-sans block truncate mt-0.5">
                                        {d.name}
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
                                          {(m.gamertag || m.name || '?').charAt(0)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <Link to={`/jugadores/${m.id}`} className="font-display font-bold text-[11px] sm:text-xs text-foreground hover:text-primary transition-colors truncate block">
                                        🎮 {m.gamertag || 'EA ID'}
                                      </Link>
                                      <span className="text-[8px] sm:text-[9px] text-muted-foreground font-sans block truncate mt-0.5">
                                        {m.name}
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

              {/* Panel de Filtros para Historial */}
              <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-4.5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto shadow-md">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-mono">🏢 ORGANIZACIÓN</span>
                  <select 
                    value={historyOrg}
                    onChange={(e) => handleHistoryOrgChange(e.target.value)}
                    className="input-premium uppercase"
                  >
                    <option value="todos">🌎 Todas las organizaciones</option>
                    {uniqueHistoryOrgs.map(org => (
                      <option key={org.id} value={org.id}>🏢 {org.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-mono">🏆 TEMPORADA</span>
                  <select 
                    value={historySeason}
                    onChange={(e) => setHistorySeason(e.target.value)}
                    disabled={historyOrg === 'todos'}
                    className="input-premium uppercase disabled:opacity-50"
                  >
                    <option value="todos">🏆 Todas las temporadas</option>
                    {uniqueHistorySeasons.map(seas => (
                      <option key={seas.id} value={seas.id}>🏆 {seas.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredHistory && filteredHistory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredHistory.map((hist, idx) => {
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
                <div className="border border-border/50 bg-muted/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 max-w-xl mx-auto shadow-md">
                  <span className="text-2xl">📜</span>
                  <p className="text-sm text-muted-foreground font-medium italic">
                    No se registran datos ni participaciones de la escuadra con los filtros seleccionados.
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
