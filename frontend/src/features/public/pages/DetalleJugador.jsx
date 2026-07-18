import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/api/axios';
import Badge from '@/components/ui/Badge';
import Partidos from './Partidos';
import PlayerCard from '@/components/ui/PlayerCard';

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
      <path d="M9 8H7v3h2v9h3v-9h2.72l.4-3H12V6.5c0-.88.72-1 1-1h2V2h-3C9.76 2 9 3.5 9 5.5V8z" strokeWidth="0" />
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
  facebook: 'bg-blue-600/10 border-blue-600/30 text-blue-400 hover:bg-blue-600/25 hover:shadow-[0_0_12px_rgba(37,99,235,0.3)]'
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

export default function DetalleJugador() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resumen'); // 'resumen' | 'stats' | 'competencias' | 'traspasos' | 'calendario' | 'historia'
  const [selectedOrg, setSelectedOrg] = useState('todas');
  const [selectedComp, setSelectedComp] = useState('todas');
  const [activeStatSubTab, setActiveStatSubTab] = useState('ataque');

  const [allOrgs, setAllOrgs] = useState([]);
  const [selectedTraspasoOrg, setSelectedTraspasoOrg] = useState('todas');
  const [selectedHistoryOrg, setSelectedHistoryOrg] = useState('todas');
  const [selectedHistorySeason, setSelectedHistorySeason] = useState('todas');

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const response = await api.get('/organizaciones');
        setAllOrgs(response.data?.data || response.data || []);
      } catch (err) {
        console.error("Error al obtener organizaciones:", err);
      }
    };
    fetchOrgs();
  }, []);

  const selectedOrgContract = useMemo(() => {
    if (!data) return null;
    const contratos = data.contratos_activos || [];
    const active = data.contrato_activo;
    if (selectedOrg === 'todas') {
      return active || contratos[0] || null;
    }
    return contratos.find(c => String(c.organizacion_id) === selectedOrg) || 
           (active && String(active.organizacion_id) === selectedOrg ? active : null);
  }, [data, selectedOrg]);

  const uniqueHistoryOrgs = useMemo(() => {
    if (!data || !data.historial_torneos) return [];
    const map = {};
    data.historial_torneos.forEach(h => {
      if (h.organizacion_id) {
        map[h.organizacion_id] = h.organizacion_nombre;
      }
    });
    return Object.entries(map).map(([id, nombre]) => ({ id, nombre }));
  }, [data]);

  const uniqueHistorySeasons = useMemo(() => {
    if (!data || !data.historial_torneos || selectedHistoryOrg === 'todas') return [];
    const map = {};
    data.historial_torneos.forEach(h => {
      if (String(h.organizacion_id) === selectedHistoryOrg && h.temporada_id) {
        map[h.temporada_id] = h.temporada_nombre;
      }
    });
    return Object.entries(map).map(([id, nombre]) => ({ id, nombre }));
  }, [data, selectedHistoryOrg]);

  const filteredHistory = useMemo(() => {
    if (!data || !data.historial_torneos) return [];
    return data.historial_torneos.filter(h => {
      if (selectedHistoryOrg !== 'todas' && String(h.organizacion_id) !== selectedHistoryOrg) return false;
      if (selectedHistorySeason !== 'todas' && String(h.temporada_id) !== selectedHistorySeason) return false;
      return true;
    });
  }, [data, selectedHistoryOrg, selectedHistorySeason]);

  const handleHistoryOrgChange = (val) => {
    setSelectedHistoryOrg(val);
    setSelectedHistorySeason('todas');
  };

  useEffect(() => {
    if (data) {
      const rawPos = data.user?.posicion || data.contrato_activo?.posicion_bloque || 'MC';
      const pStr = rawPos.toUpperCase();
      if (['POR', 'GK', 'PO', 'GOALKEEPER'].includes(pStr)) {
        setActiveStatSubTab('porteria');
      } else if (['DFC', 'CB', 'LB', 'RB', 'DF', 'DEF', 'LI', 'LD', 'DD', 'DI', 'DEFENDER'].includes(pStr)) {
        setActiveStatSubTab('defensa');
      } else if (['MC', 'MCO', 'MCD', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MED', 'MCI', 'MCR', 'MDD', 'MDI', 'MOD', 'MOI', 'MIDFIELDER'].includes(pStr)) {
        setActiveStatSubTab('pase');
      } else {
        setActiveStatSubTab('ataque');
      }
    }
  }, [data]);

  useEffect(() => {
    const fetchJugador = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/usuarios/${id}`, {
          params: {
            organizacion_id: selectedOrg,
            competencia_id: selectedComp
          }
        });
        setData(response.data);
      } catch (error) {
        console.error("Error al obtener los detalles del jugador:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJugador();
  }, [id, selectedOrg, selectedComp]);

  const getImageUrl = (path, fallbackType) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (typeof window.mediaUrl === 'function') {
      return window.mediaUrl(path, fallbackType);
    }
    return window.mediaUrl(path, fallbackType);
  };

  const getAge = (birthdayStr) => {
    if (!birthdayStr) return '—';
    const today = new Date();
    const birthDate = new Date(birthdayStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} años`;
  };

  const getFlagEmoji = (nationality) => {
    if (!nationality) return '⚽';
    const n = nationality.toLowerCase().trim();
    if (n.includes('chil') || n.includes('chile')) return '🇨🇱';
    if (n.includes('arg') || n.includes('argentin')) return '🇦🇷';
    if (n.includes('bra') || n.includes('brasil')) return '🇧🇷';
    if (n.includes('uru') || n.includes('urugua')) return '🇺🇾';
    if (n.includes('col') || n.includes('colomb')) return '🇨🇴';
    if (n.includes('per') || n.includes('peru')) return '🇵🇪';
    if (n.includes('esp') || n.includes('españ')) return '🇪🇸';
    if (n.includes('mex') || n.includes('mexic')) return '🇲🇽';
    if (n.includes('ven') || n.includes('venez')) return '🇻🇪';
    if (n.includes('ecu') || n.includes('ecuad')) return '🇪🇨';
    return '⚽';
  };

  const getPosShort = (pos) => {
    const pStr = (pos || '').toUpperCase();
    if (['POR', 'GK', 'PO', 'GOALKEEPER'].includes(pStr)) return 'POR';
    if (['DFC', 'CB', 'LB', 'RB', 'DF', 'DEF', 'LI', 'LD', 'DD', 'DI', 'DEFENDER'].includes(pStr)) return 'DFC';
    if (['MC', 'MCO', 'MCD', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'CM', 'MED'].includes(pStr)) return 'MC';
    return 'DEL';
  };

  const getPosStyles = (pos) => {
    const pStr = (pos || '').toUpperCase();
    if (['POR', 'GK', 'PO', 'GOALKEEPER'].includes(pStr)) {
      return {
        glow: 'hover:border-amber-500/40 hover:shadow-[0_15px_40px_-12px_rgba(245,158,11,0.25)]',
        avatarGlow: 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.3)] shadow-[0_0_15px_rgba(245,158,11,0.3)] border-amber-500/30',
        bracketColor: 'border-amber-500/60',
        brackets: 'group-hover:border-amber-500/70',
        posColor: 'text-amber-500 bg-amber-500/10 border-amber-500/25 border-amber-500/30',
        barColor: 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]',
        accentText: 'text-amber-400',
        textColor: 'text-amber-500',
        label: 'Portero',
        tabActive: 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] border-amber-500/30',
        borderAccent: 'border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
        glowBg: 'bg-amber-500',
        glowRing: 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.4)]',
        pulseGlow: 'bg-amber-500',
        gradient: 'from-amber-600/20 via-amber-950/40 to-background',
        icon: '🧤'
      };
    }
    if (['DFC', 'CB', 'LB', 'RB', 'DF', 'DEF', 'LI', 'LD', 'DD', 'DI', 'DEFENDER'].includes(pStr)) {
      return {
        glow: 'hover:border-blue-500/40 hover:shadow-[0_15px_40px_-12px_rgba(59,130,246,0.25)]',
        avatarGlow: 'border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.3)] shadow-[0_0_15px_rgba(59,130,246,0.3)] border-blue-500/30',
        bracketColor: 'border-blue-500/60',
        brackets: 'group-hover:border-blue-500/70',
        posColor: 'text-blue-500 bg-blue-500/10 border-blue-500/25 border-blue-500/30',
        barColor: 'bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]',
        accentText: 'text-blue-400',
        textColor: 'text-blue-500',
        label: 'Defensa',
        tabActive: 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] border-blue-500/30',
        borderAccent: 'border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
        glowBg: 'bg-blue-500',
        glowRing: 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.4)]',
        pulseGlow: 'bg-blue-500',
        gradient: 'from-blue-600/20 via-blue-950/40 to-background',
        icon: '🛡️'
      };
    }
    if (['MC', 'MCO', 'MCD', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MED', 'MCI', 'MCR', 'MDD', 'MDI', 'MOD', 'MOI', 'MIDFIELDER'].includes(pStr)) {
      return {
        glow: 'hover:border-emerald-500/40 hover:shadow-[0_15px_40px_-12px_rgba(16,185,129,0.25)]',
        avatarGlow: 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)] shadow-[0_0_15px_rgba(16,185,129,0.3)] border-emerald-500/30',
        bracketColor: 'border-emerald-500/60',
        brackets: 'group-hover:border-emerald-500/70',
        posColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25 border-emerald-500/30',
        barColor: 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]',
        accentText: 'text-emerald-400',
        textColor: 'text-emerald-500',
        label: 'Mediocentro',
        tabActive: 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] border-emerald-500/30',
        borderAccent: 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
        glowBg: 'bg-emerald-500',
        glowRing: 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.4)]',
        pulseGlow: 'bg-emerald-500',
        gradient: 'from-emerald-600/20 via-emerald-950/40 to-background',
        icon: '🧠'
      };
    }
    return {
      glow: 'hover:border-rose-500/40 hover:shadow-[0_15px_40px_-12px_rgba(239,68,68,0.25)]',
      avatarGlow: 'border-rose-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)] shadow-[0_0_15px_rgba(239,68,68,0.3)] border-rose-500/30',
      bracketColor: 'border-primary/60',
      brackets: 'group-hover:border-rose-500/70',
      posColor: 'text-rose-500 bg-rose-500/10 border-rose-500/25 border-rose-500/30',
      barColor: 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]',
      accentText: 'text-rose-400',
      textColor: 'text-rose-500',
      label: 'Delantero',
      tabActive: 'bg-rose-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] border-rose-500/30',
      borderAccent: 'border-rose-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]',
      glowBg: 'bg-rose-500',
      glowRing: 'border-rose-500/50 shadow-[0_0_15px_rgba(239,68,68,0.4)]',
      pulseGlow: 'bg-rose-500',
      gradient: 'from-rose-600/20 via-rose-950/40 to-background',
      icon: '⚡'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 space-y-8">
          <div className="skeleton-shimmer h-60 rounded-2xl"></div>
          <div className="skeleton-shimmer h-14 rounded-2xl max-w-3xl mx-auto"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="skeleton-shimmer h-52 rounded-xl"></div>
            <div className="lg:col-span-2 skeleton-shimmer h-80 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center">
        <span className="text-4xl animate-bounce">👤</span>
        <h2 className="text-xl font-display font-black text-foreground uppercase tracking-wider">Competidor No Encontrado</h2>
        <Link to="/jugadores" className="text-xs text-primary font-bold uppercase hover:underline">Volver al Directorio</Link>
      </div>
    );
  }

  const { user, contrato_activo, traspasos, estadisticas, competencias = [], historial_torneos = [], comparativas = {}, filtros_disponibles = {} } = data;
  const rawPos = user.posicion || contrato_activo?.posicion_bloque || 'MC';
  const posStyles = getPosStyles(rawPos);

  // FUT Card Calculations
  const isGK = ['POR', 'GK', 'PO', 'GOALKEEPER'].includes((rawPos || '').toUpperCase());
  const isDelantero = ['DEL', 'DC', 'ST', 'EI', 'ED', 'LW', 'RW', 'ATA', 'DELANTERO'].includes((rawPos || '').toUpperCase());
  const isDefensa = ['DFC', 'CB', 'LB', 'RB', 'DF', 'DEF', 'LI', 'LD', 'DD', 'DI', 'DEFENDER'].includes((rawPos || '').toUpperCase());
  const isMedio = !isGK && !isDelantero && !isDefensa;

  const avgVal = Number(estadisticas?.promedio_valoracion || 0);
  const ovrRating = avgVal > 0 ? Math.round(avgVal * 10) : 75;
  const partidos = estadisticas?.partidos_jugados || 0;
  
  const heightVal = Number(user.altura) || 175;
  const weightVal = Number(user.peso) || 75;

  const pac = Math.round(
    Math.max(40, Math.min(99, 
      (isDelantero ? 82 : isMedio ? 74 : 67) + 
      Math.max(-8, Math.min(8, (178 - heightVal) * 0.4)) + 
      Math.max(-8, Math.min(8, (74 - weightVal) * 0.3))
    ))
  );

  const sho = Math.round(
    Math.max(40, Math.min(99,
      40 + 
      (Number(estadisticas?.avg_precision_tiro || 0) * 0.35) + 
      (partidos > 0 ? (Number(estadisticas?.total_goles || 0) / partidos) * 15 : 0) +
      (isDelantero ? 12 : isMedio ? 5 : 0)
    ))
  );

  const pas = Math.round(
    Math.max(40, Math.min(99,
      40 + 
      (Number(estadisticas?.avg_precision_pases || 0) * 0.4) + 
      (partidos > 0 ? (Number(estadisticas?.total_asistencias || 0) / partidos) * 20 : 0) +
      (isMedio ? 10 : isDelantero ? 4 : 2)
    ))
  );

  const dri = Math.round(
    Math.max(40, Math.min(99,
      (isDelantero ? 80 : isMedio ? 76 : 64) + 
      (avgVal * 1.5) +
      Math.max(-5, Math.min(5, (178 - heightVal) * 0.2))
    ))
  );

  const def = Math.round(
    Math.max(40, Math.min(99,
      (isDefensa ? 78 : isMedio ? 58 : 35) + 
      (Number(estadisticas?.avg_exito_entradas || 0) * 0.15) + 
      (partidos > 0 ? (Number(estadisticas?.total_entradas || 0) / partidos) * 2.5 : 0)
    ))
  );

  const phy = Math.round(
    Math.max(40, Math.min(99,
      50 + 
      Math.max(-10, Math.min(10, (weightVal - 68) * 0.4)) + 
      Math.max(-10, Math.min(10, (heightVal - 170) * 0.2)) + 
      (avgVal * 1.2) - 
      (Number(estadisticas?.total_rojas || 0) * 3)
    ))
  );

  // GK Attributes
  const div = Math.round(
    Math.max(40, Math.min(99,
      60 + 
      (Number(estadisticas?.total_atajadas_volada || 0) * 0.8) + 
      (avgVal * 1.5)
    ))
  );

  const han = Math.round(
    Math.max(40, Math.min(99,
      58 + 
      (Number(estadisticas?.total_centros_cortados || 0) * 1.2) + 
      (avgVal * 1.2)
    ))
  );

  const kic = Math.round(
    Math.max(40, Math.min(99,
      50 + 
      (Number(estadisticas?.avg_precision_pases || 0) * 0.4)
    ))
  );

  const ref = Math.round(
    Math.max(40, Math.min(99,
      62 + 
      (Number(estadisticas?.total_atajadas_reflejos || 0) * 1.0) + 
      (avgVal * 1.8)
    ))
  );

  const spd = Math.round(
    Math.max(40, Math.min(99,
      48 + 
      Math.max(-8, Math.min(8, (182 - heightVal) * 0.5))
    ))
  );

  const posStat = Math.round(
    Math.max(40, Math.min(99,
      58 + 
      (Number(estadisticas?.total_atajadas_buena_colocacion || 0) * 0.9) + 
      (avgVal * 1.4)
    ))
  );

  const {
    posicion_grupo: posGroup = 'MED',
    rank_global = null,
    total_global = 0,
    rank_liga = null,
    total_liga = 0,
    promedio_posicion = {},
    lider_posicion = {}
  } = comparativas || {};

  const getComparativaStats = () => {
    const partidos = estadisticas.partidos_jugados || 0;
    const getAvg = (total) => partidos > 0 ? (total / partidos) : 0;
    
    const statsList = [
      {
        label: 'Valoración Promedio',
        player: Number(estadisticas.promedio_valoracion || 0),
        avg: Number(promedio_posicion.avg_valoracion || 0),
        leader: Number(lider_posicion?.avg_valoracion || 0),
        max: 10,
        format: (val) => val.toFixed(2),
      },
      {
        label: 'Goles por Partido',
        player: getAvg(estadisticas.total_goles || 0),
        avg: Number(promedio_posicion.avg_goles || 0),
        leader: Number(lider_posicion?.avg_goles || 0),
        max: 3,
        format: (val) => val.toFixed(2),
      },
      {
        label: 'Asistencias por Partido',
        player: getAvg(estadisticas.total_asistencias || 0),
        avg: Number(promedio_posicion.avg_asistencias || 0),
        leader: Number(lider_posicion?.avg_asistencias || 0),
        max: 3,
        format: (val) => val.toFixed(2),
      }
    ];

    const pos = rawPos.toUpperCase();

    if (['POR', 'GK', 'PO', 'GOALKEEPER'].includes(pos)) {
      statsList.push(
        {
          label: 'Atajadas por Partido',
          player: getAvg(estadisticas.total_atajadas || 0),
          avg: Number(promedio_posicion.avg_atajadas || 0),
          leader: Number(lider_posicion?.avg_atajadas || 0),
          max: 8,
          format: (val) => val.toFixed(2),
        },
        {
          label: 'Goles Recibidos por Partido',
          player: getAvg(estadisticas.total_goles_recibidos || 0),
          avg: Number(promedio_posicion.avg_goles_recibidos || 0),
          leader: Number(lider_posicion?.avg_goles_recibidos || 0),
          max: 5,
          format: (val) => val.toFixed(2),
          invertColor: true,
        }
      );
    } else if (['DFC', 'DFI', 'DFD', 'CB', 'LB', 'RB', 'DF', 'DEF', 'LD', 'LI', 'DD', 'DI', 'DEFENDER'].includes(pos)) {
      statsList.push(
        {
          label: 'Entradas por Partido',
          player: getAvg(estadisticas.total_entradas || 0),
          avg: Number(promedio_posicion.avg_entradas || 0),
          leader: Number(lider_posicion?.avg_entradas || 0),
          max: 8,
          format: (val) => val.toFixed(2),
        },
        {
          label: 'Éxito de Entradas (%)',
          player: Number(estadisticas.avg_exito_entradas || 0),
          avg: Number(promedio_posicion.avg_exito_entradas || 0),
          leader: Number(lider_posicion?.avg_exito_entradas || 0),
          max: 100,
          format: (val) => `${Math.round(val)}%`,
        }
      );
    } else {
      statsList.push(
        {
          label: 'Precisión de Pases (%)',
          player: Number(estadisticas.avg_precision_pases || 0),
          avg: Number(promedio_posicion.avg_precision_pases || 0),
          leader: Number(lider_posicion?.avg_precision_pases || 0),
          max: 100,
          format: (val) => `${Math.round(val)}%`,
        },
        {
          label: 'Precisión de Tiros (%)',
          player: Number(estadisticas.avg_precision_tiro || 0),
          avg: Number(promedio_posicion.avg_precision_tiro || 0),
          leader: Number(lider_posicion?.avg_precision_tiro || 0),
          max: 100,
          format: (val) => `${Math.round(val)}%`,
        }
      );
    }

    return statsList;
  };

  const specItems = [
    { 
      label: 'Demarcación', 
      value: user.posicion || contrato_activo?.posicion_bloque || 'MC',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
      )
    },
    { 
      label: 'Nacionalidad', 
      value: user.nacionalidad || 'Chilena',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 100-18.008 9.004 9.004 0 000 18.008zm0 0V3m0 18c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m-9 9h18" />
        </svg>
      )
    },
    { 
      label: 'Estatura', 
      value: user.altura ? `${user.altura} cm` : '—',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 10.5V18M15 10.5V18M3 18.75V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25v13.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75z" />
        </svg>
      )
    },
    { 
      label: 'Peso', 
      value: user.peso ? `${user.peso} kg` : '—',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18" />
        </svg>
      )
    }
  ];

  const statsSections = [
    {
      id: 'ataque',
      title: '🎯 FASE OFENSIVA Y REMATES',
      color: 'text-rose-500',
      barColor: 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.45)]',
      items: [
        { label: 'Goles Totales', value: estadisticas?.total_goles || 0, max: 20 },
        { label: 'Tiros Totales', value: estadisticas?.total_tiros || 0, max: 80 },
        { label: 'Precisión de Tiro', value: `${Math.round(estadisticas?.avg_precision_tiro || 0)}%`, pct: Math.round(estadisticas?.avg_precision_tiro || 0) }
      ]
    },
    {
      id: 'pase',
      title: '🪄 FASE ASOCIATIVA Y DISTRIBUCIÓN',
      color: 'text-emerald-500',
      barColor: 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.45)]',
      items: [
        { label: 'Asistencias', value: estadisticas?.total_asistencias || 0, max: 15 },
        { label: 'Pases Completados', value: estadisticas?.total_pases_completados || 0, max: 400 },
        { label: 'Pases Intentados', value: estadisticas?.total_pases_intentados || 0, max: 500 },
        { label: 'Precisión de Pases', value: `${Math.round(estadisticas?.avg_precision_pases || 0)}%`, pct: Math.round(estadisticas?.avg_precision_pases || 0) }
      ]
    },
    {
      id: 'defensa',
      title: '🛡️ FASE DEFENSIVA Y PREVENCIÓN',
      color: 'text-blue-500',
      barColor: 'bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.45)]',
      items: [
        { label: 'Entradas Exitosas', value: estadisticas?.total_entradas || 0, max: 80 },
        { label: 'Entradas Intentadas', value: estadisticas?.total_entradas_intentadas || 0, max: 120 },
        { label: 'Éxito de Entradas', value: `${Math.round(estadisticas?.avg_exito_entradas || 0)}%`, pct: Math.round(estadisticas?.avg_exito_entradas || 0) },
        { label: 'Desvíos Totales', value: estadisticas?.total_desvios || 0, max: 40 }
      ]
    },
    {
      id: 'porteria',
      title: '🧤 REGISTRO DE ARCO Y ATAJADAS',
      color: 'text-amber-500',
      barColor: 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.45)]',
      items: [
        { label: 'Atajadas', value: estadisticas?.total_atajadas || 0, max: 100 },
        { label: 'Goles Recibidos', value: estadisticas?.total_goles_recibidos || 0, max: 50, isNegative: true },
        { label: 'Atajadas Colocación', value: estadisticas?.total_atajadas_buena_colocacion || 0, max: 40 },
        { label: 'Atajadas Volada', value: estadisticas?.total_atajadas_volada || 0, max: 40 },
        { label: 'Atajadas Reflejos', value: estadisticas?.total_atajadas_reflejos || 0, max: 40 },
        { 
          label: 'Despejes / Centros Cortados', 
          value: `${estadisticas?.total_despejes_punos || 0} / ${estadisticas?.total_centros_cortados || 0}`, 
          valForBar: (estadisticas?.total_despejes_punos || 0) + (estadisticas?.total_centros_cortados || 0), 
          max: 30 
        }
      ]
    },
    {
      id: 'fisico',
      title: '⏱️ TELEMETRÍA FÍSICA Y LATENCIA',
      color: 'text-purple-500',
      barColor: 'bg-gradient-to-r from-purple-600 to-fuchsia-400 shadow-[0_0_8px_rgba(168,85,247,0.45)]',
      items: [
        { label: 'Segundos Jugados', value: estadisticas?.total_segundos_jugados || 0, max: 15000 },
        { label: 'Tiempo Juego Motor', value: estadisticas?.total_tiempo_juego_motor || 0, max: 15000 },
        { label: 'Tiempo Inactivo', value: estadisticas?.total_tiempo_inactivo || 0, max: 5000 },
        { label: 'Tiempo Real Lag', value: estadisticas?.total_tiempo_real_lag || 0, max: 2000 },
        { label: 'Tarjetas Rojas', value: estadisticas?.total_rojas || 0, max: 5, isNegative: true }
      ]
    }
  ];

  const redesSociales = {
    whatsapp: user.whatsapp || user.telefono || '',
    instagram: user.instagram || '',
    twitter: user.twitter || '',
    twitch: user.twitch || '',
    youtube: user.youtube || '',
    tiktok: user.tiktok || '',
    facebook: user.facebook || '',
    discord: user.discord || '',
    website: user.website || ''
  };
  const hasSocials = Object.values(redesSociales).some(Boolean);

  return (
    <div className="relative min-h-screen bg-background pb-16 overflow-hidden">
      {/* Resplandores ambientales según posición */}
      <div className={`absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] opacity-[0.06] blur-[130px] rounded-full pointer-events-none z-10 bg-current ${posStyles.textColor}`}></div>
      <div className={`absolute bottom-1/3 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] opacity-[0.04] blur-[120px] rounded-full pointer-events-none z-10 bg-current ${posStyles.textColor}`}></div>

      {/* Banner Superior Inmersivo */}
      <div className="h-80 md:h-[460px] relative z-0 overflow-hidden bg-card">
        {contrato_activo?.equipo_banner ? (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${getImageUrl(contrato_activo.equipo_banner, 'team_banner')}')` }}
          />
        ) : (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-overlay"
            style={{ backgroundImage: `url('${getImageUrl('default-team-banner', 'team_banner')}')` }}
          />
        )}
        {/* position theme gradient fallback */}
        <div className={`absolute inset-0 bg-gradient-to-br ${posStyles.gradient} opacity-90 -z-10`} />
        
        {/* Grid and scanline tech layers */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent"></div>
        
        {/* Floating tech banner elements */}
        <div className="absolute top-1/3 left-10 text-[6rem] md:text-[10rem] font-display font-black uppercase text-foreground/[0.015] select-none leading-none pointer-events-none font-extrabold tracking-tighter">
          {translatePosition(rawPos) || 'JUGADOR'}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-10 relative z-10 -mt-20 md:-mt-28 space-y-8 animate-fade-in-up">
        
        {/* Cabecera del Jugador */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 pb-6 border-b border-border/40">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {user.foto ? (
              <img 
                src={getImageUrl(user.foto)} 
                alt={user.name} 
                className={`w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover border-[3.5px] border-background bg-card shadow-2xl shrink-0 transition-transform duration-500 hover:scale-105 ${posStyles.avatarGlow}`}
              />
            ) : (
              <div className={`w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-gradient-to-tr from-primary to-destructive border-[3.5px] border-background flex items-center justify-center font-display font-black text-primary-foreground text-4xl shadow-2xl uppercase shrink-0 transition-transform duration-500 hover:scale-105 ${posStyles.avatarGlow}`}>
                {user.name?.charAt(0)}
              </div>
            )}

            <div className="text-center md:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Badge variant="primary" className={`text-[10px] font-mono px-2.5 py-0.5 rounded-lg font-black tracking-wider border backdrop-blur-sm ${posStyles.posColor}`}>
                  <span>{posStyles.icon}</span>
                  <span className="ml-1">{posStyles.label}</span>
                </Badge>
                <Badge variant="muted" className="text-[10px] font-mono px-2.5 py-0.5 rounded font-black tracking-wider uppercase border border-border/40 text-muted-foreground bg-background/55">
                  {user.plataforma || 'CROSSPLAY'}
                </Badge>
                {contrato_activo?.dorsal && (
                  <span className="bg-muted/65 border border-border/40 px-2.5 py-0.5 rounded text-[10px] text-muted-foreground font-mono font-black">
                    N°{contrato_activo.dorsal}
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold uppercase tracking-tight text-foreground text-glow-primary select-none leading-none">
                {user.gamertag || 'SIN GAMERTAG'}
              </h1>
              <p className="text-xs text-muted-foreground font-semibold">
                👤 Nombre: <span className="text-foreground">{user.name}</span>
                {contrato_activo ? (
                  <>
                    <span className="mx-2 text-border">|</span>
                    🛡️ Club Activo: <Link to={`/equipos/${contrato_activo.equipo_id}`} className="text-foreground hover:text-primary transition-colors underline font-bold uppercase">{contrato_activo.equipo_nombre}</Link> <span className="text-primary font-mono font-bold">({contrato_activo.organizacion_nombre})</span>
                  </>
                ) : (
                  <>
                    <span className="mx-2 text-border">|</span>
                    🤝 Estado: <span className="text-amber-500 font-bold uppercase">Agente Libre</span>
                  </>
                )}
              </p>
              
              {/* Redes Sociales del Jugador */}
              {hasSocials && (
                <div className="flex flex-wrap items-center gap-2 mt-2 justify-center md:justify-start">
                  {Object.entries(redesSociales).map(([platform, value]) => {
                    if (!value) return null;
                    
                    if (platform === 'discord') {
                      return (
                        <a key="discord" href={getSocialLink('discord', value)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono font-bold uppercase transition-all duration-300 bg-[#5865F2]/10 border-[#5865F2]/30 text-[#5865F2] hover:bg-[#5865F2]/25" title={`Discord`}>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 127.14 96.36"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.73,67.73,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.33,46,96.22,53,91.08,65.69,84.69,65.69Z"/></svg>
                          <span>Discord</span>
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
                    const icon = SOCIAL_ICONS[platform.toLowerCase()] || <span>🔗</span>;
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
                        <span>{platform === 'twitter' ? 'X' : platform}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/jugadores" className="px-4 py-2 bg-muted border border-border/50 rounded-xl text-xs font-black uppercase text-foreground hover:bg-card transition-all">
              👤 Directorio
            </Link>
          </div>
        </div>

        {/* Tabulación de Secciones */}
        <div className="flex border border-border/40 p-1 bg-card/25 backdrop-blur-md rounded-2xl max-w-4xl mx-auto shadow-xl overflow-x-auto gap-1 mobile-scroll-indicator pb-2.5">
          {[
            { id: 'resumen', label: '👤 Resumen' },
            { id: 'stats', label: '📊 Rendimiento' },
            { id: 'competencias', label: '🏆 Torneos y Club' },
            { id: 'traspasos', label: '🔄 Traspasos' },
            { id: 'calendario', label: '📅 Calendario' },
            { id: 'historia', label: '📜 Historial' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[110px] py-2.5 px-3 sm:py-3 sm:px-4 text-[10px] sm:text-xs font-condensed tracking-widest font-black uppercase rounded-xl transition-all duration-300 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id 
                  ? posStyles.tabActive 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido Condicional por Secciones */}
        {activeTab === 'resumen' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* FUT-style player card */}
            <div className="lg:col-span-1 flex flex-col items-center space-y-4">
              <div className="w-full max-w-[290px] mx-auto cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:-translate-y-2 bg-transparent transform">
                <PlayerCard 
                  player={{
                    id: user.id,
                    rating: ovrRating,
                    position: rawPos,
                    pos: rawPos,
                    name: user.name || 'JUGADOR',
                    foto: user.foto,
                    nacionalidad: user.nacionalidad,
                    clubBadge: contrato_activo?.equipo_logo,
                    dorsal: contrato_activo?.dorsal,
                    theme: 'totw',
                    avg_atajadas: (Number(estadisticas?.total_atajadas || 0) + Number(estadisticas?.total_goles_recibidos || 0) > 0) 
                      ? Math.round((Number(estadisticas?.total_atajadas || 0) / (Number(estadisticas?.total_atajadas || 0) + Number(estadisticas?.total_goles_recibidos || 0))) * 100)
                      : 85,
                    avg_exito_entradas: Math.round(estadisticas?.avg_exito_entradas || 80),
                    avg_precision_pases: Math.round(estadisticas?.avg_precision_pases || 82),
                    avg_precision_tiro: Math.round(estadisticas?.avg_precision_tiro || 75),
                    estadisticas: estadisticas
                  }} 
                  variant="dynamic"
                  disableHover={false} 
                />
              </div>
            </div>

            {/* Right: Personal Dossier, Contract, and stats */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Dossier Card */}
              <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-5 space-y-4 shadow-md relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${posStyles.bracketColor} rounded-tl-sm pointer-events-none`}></div>
                <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${posStyles.bracketColor} rounded-br-sm pointer-events-none`}></div>
                <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2">
                  👤 EXPEDIENTE FÍSICO Y PERSONAL
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="bg-background/25 border border-border/20 p-3 rounded-xl shadow-inner text-left">
                    <span className="text-muted-foreground block text-[9px] font-bold uppercase">Edad</span>
                    <strong className="text-base text-foreground font-extrabold">{getAge(user.fecha_nacimiento)}</strong>
                  </div>
                  <div className="bg-background/25 border border-border/20 p-3 rounded-xl shadow-inner text-left">
                    <span className="text-muted-foreground block text-[9px] font-bold uppercase">Estatura</span>
                    <strong className="text-base text-foreground font-extrabold">{user.altura ? `${user.altura} cm` : '—'}</strong>
                  </div>
                  <div className="bg-background/25 border border-border/20 p-3 rounded-xl shadow-inner text-left">
                    <span className="text-muted-foreground block text-[9px] font-bold uppercase">Peso</span>
                    <strong className="text-base text-foreground font-extrabold">{user.peso ? `${user.peso} kg` : '—'}</strong>
                  </div>
                  <div className="bg-background/25 border border-border/20 p-3 rounded-xl shadow-inner text-left">
                    <span className="text-muted-foreground block text-[9px] font-bold uppercase">Nacionalidad</span>
                    <strong className="text-sm text-foreground font-extrabold uppercase flex items-center gap-1.5 mt-0.5">
                      <span>{getFlagEmoji(user.nacionalidad)}</span>
                      <span className="truncate">{user.nacionalidad || 'Chilena'}</span>
                    </strong>
                  </div>
                  <div className="bg-background/25 border border-border/20 p-3 rounded-xl shadow-inner text-left">
                    <span className="text-muted-foreground block text-[9px] font-bold uppercase">Pie Preferido</span>
                    <strong className="text-sm text-foreground font-extrabold uppercase mt-0.5">{user.pie_preferido || 'Derecho'}</strong>
                  </div>
                  <div className="bg-background/25 border border-border/20 p-3 rounded-xl shadow-inner text-left">
                    <span className="text-muted-foreground block text-[9px] font-bold uppercase">Plataforma</span>
                    <strong className="text-sm text-foreground font-extrabold uppercase mt-0.5">{user.plataforma || 'CROSSPLAY'}</strong>
                  </div>
                </div>
              </div>

              {/* Contract Card */}
              <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-5 space-y-4 shadow-md relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${posStyles.bracketColor} rounded-tl-sm pointer-events-none`}></div>
                <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${posStyles.bracketColor} rounded-br-sm pointer-events-none`}></div>
                <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2">
                  🛡️ VINCULACIÓN Y ESTADO CONTRACTUAL POR ORGANIZACIÓN
                </h3>
                
                <div className="space-y-3">
                  {allOrgs.map((org) => {
                    const contrato = (data.contratos_activos || []).find(
                      (c) => String(c.organizacion_id) === String(org.id)
                    ) || (contrato_activo && String(contrato_activo.organizacion_id) === String(org.id) ? contrato_activo : null);

                    return (
                      <div key={org.id} className="bg-background/25 border border-border/20 p-4 rounded-xl shadow-inner text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {contrato ? (
                            <>
                              {contrato.equipo_logo ? (
                                <img 
                                  src={getImageUrl(contrato.equipo_logo)} 
                                  alt={contrato.equipo_nombre} 
                                  className="w-12 h-12 rounded-xl object-cover border border-border/40 shrink-0 shadow" 
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-black text-primary text-lg uppercase shrink-0">
                                  {contrato.equipo_nombre?.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <Link to={`/equipos/${contrato.equipo_id}`} className="font-display font-black text-sm text-foreground hover:text-primary uppercase tracking-wide transition-colors block leading-tight truncate">
                                  {contrato.equipo_nombre}
                                </Link>
                                <span className="text-[9px] text-primary/80 font-bold uppercase mt-1 block truncate font-mono">
                                  🏆 LIGA: {org.nombre}
                                </span>
                                {contrato.dorsal && (
                                  <span className="inline-block bg-primary/10 text-primary border border-primary/20 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded mt-1">
                                    Dorsal N°{contrato.dorsal}
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 rounded-xl bg-muted/10 border border-border/30 flex items-center justify-center text-muted-foreground text-xl shrink-0 font-display">
                                🤝
                              </div>
                              <div className="min-w-0">
                                <strong className="font-display font-black text-sm text-muted-foreground uppercase tracking-wide block leading-tight">
                                  Jugador Libre
                                </strong>
                                <span className="text-[9px] text-muted-foreground font-bold uppercase mt-1 block truncate font-mono">
                                  🏢 ORGANIZACIÓN: {org.nombre}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="shrink-0 w-full sm:w-auto text-right">
                          {contrato ? (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black font-mono px-3 py-1.5 rounded-lg shadow-sm inline-block uppercase tracking-wide">
                              🛡️ Contrato Activo
                            </span>
                          ) : (
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black font-mono px-3 py-1.5 rounded-lg shadow-sm inline-block uppercase tracking-wide animate-pulse">
                              ⚡ Disponible
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {allOrgs.length === 0 && (
                    <div className="text-center p-4 italic text-xs text-muted-foreground">
                      Cargando organizaciones y contratos...
                    </div>
                  )}
                </div>
              </div>

              {/* Season Summary Stats */}
              <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-5 space-y-4 shadow-md relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${posStyles.bracketColor} rounded-tl-sm pointer-events-none`}></div>
                <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${posStyles.bracketColor} rounded-br-sm pointer-events-none`}></div>
                <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2">
                  📊 RESUMEN TÁCTICO DE LA TEMPORADA
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
                  <div className="bg-background/25 border border-border/20 p-3 rounded-xl shadow-inner">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block">Partidos Jugados</span>
                    <strong className="text-xl font-black text-foreground block mt-1">{estadisticas.partidos_jugados || 0}</strong>
                  </div>
                  <div className="bg-background/25 border border-border/20 p-3 rounded-xl shadow-inner">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block">Valoración OVR</span>
                    <strong className={`text-xl font-black block mt-1 ${posStyles.accentText}`}>{avgVal ? avgVal.toFixed(2) : '—'}</strong>
                  </div>
                  <div className="bg-background/25 border border-border/20 p-3 rounded-xl shadow-inner">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block">Goles Totales</span>
                    <strong className="text-xl font-black text-emerald-400 block mt-1">{estadisticas.total_goles || 0}</strong>
                  </div>
                  <div className="bg-background/25 border border-border/20 p-3 rounded-xl shadow-inner">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block">Asistencias</span>
                    <strong className="text-xl font-black text-primary block mt-1">{estadisticas.total_asistencias || 0}</strong>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Contenido Condicional por Secciones */}
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Filtros de Telemetría Táctica */}
            <div className="border border-border/40 bg-card/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-left space-y-1 shrink-0 w-full md:w-auto">
                <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest block">FILTROS DE TELEMETRÍA TÁCTICA</span>
                <h4 className="text-sm font-display font-black text-foreground uppercase tracking-wide">Ámbito de Rendimiento</h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:max-w-xl">
                {/* Selector de Organización */}
                <div className="relative">
                  <select
                    value={selectedOrg}
                    onChange={(e) => {
                      setSelectedOrg(e.target.value);
                      setSelectedComp('todas');
                    }}
                    className="w-full bg-background/55 border border-border/45 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/55 cursor-pointer uppercase select-none focus:ring-1 focus:ring-primary/25"
                  >
                    <option value="todas">🌍 Todas las Ligas</option>
                    {filtros_disponibles.organizaciones && filtros_disponibles.organizaciones.length > 0 ? (
                      filtros_disponibles.organizaciones.map((org) => (
                        <option key={org.id} value={org.id}>
                          🏆 {org.nombre}
                        </option>
                      ))
                    ) : (
                      allOrgs.map((org) => (
                        <option key={org.id} value={org.id}>
                          🏆 {org.nombre}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Selector de Competencia */}
                <div className="relative">
                  <select
                    value={selectedComp}
                    onChange={(e) => setSelectedComp(e.target.value)}
                    className="w-full bg-background/55 border border-border/45 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/55 cursor-pointer uppercase select-none focus:ring-1 focus:ring-primary/25"
                  >
                    <option value="todas">⚔️ Todas las Competencias</option>
                    {filtros_disponibles.competencias
                      ?.filter((comp) => selectedOrg === 'todas' || String(comp.organizacion_id) === String(selectedOrg))
                      .map((comp) => (
                        <option key={comp.id} value={comp.id}>
                          🎮 {comp.nombre}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Grid principal de Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Club Actual e Info Rápida */}
              <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
                <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-4 sm:p-5 space-y-4 shadow-md relative overflow-hidden group/club-box">
                  {/* Decortive hud corner frames */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-border/30 rounded-tl-sm pointer-events-none"></div>
                  <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-border/30 rounded-tr-sm pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-border/30 rounded-bl-sm pointer-events-none"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-border/30 rounded-br-sm pointer-events-none"></div>

                  <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2">
                    🛡️ VINCULACIÓN POR ORGANIZACIÓN
                  </h3>

                  {/* Selector de Organización dentro de la ficha de vinculación */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block font-mono">🏢 Seleccionar Organización</span>
                    <select 
                      value={selectedOrg}
                      onChange={(e) => {
                        setSelectedOrg(e.target.value);
                        setSelectedComp('todas');
                      }}
                      className="input-premium py-1.5 px-3 text-xs uppercase w-full font-mono font-bold"
                    >
                      <option value="todas">🌎 Todas las Ligas</option>
                      {filtros_disponibles.organizaciones && filtros_disponibles.organizaciones.length > 0 ? (
                        filtros_disponibles.organizaciones.map(org => (
                          <option key={org.id} value={org.id.toString()}>🏢 {org.nombre}</option>
                        ))
                      ) : (
                        allOrgs.map(org => (
                          <option key={org.id} value={org.id.toString()}>🏢 {org.nombre}</option>
                        ))
                      )}
                    </select>
                  </div>

                  {selectedOrgContract ? (
                    <div className="flex flex-col gap-4 pt-2">
                      <div className="flex items-center gap-3">
                        {selectedOrgContract.equipo_logo ? (
                          <img 
                            src={getImageUrl(selectedOrgContract.equipo_logo)} 
                            alt={selectedOrgContract.equipo_nombre} 
                            className="w-14 h-14 rounded-xl object-cover border border-border/40 shrink-0 shadow transition-transform duration-300 group-hover/club-box:scale-105" 
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center font-display font-black text-primary text-xl uppercase shrink-0 transition-transform duration-300 group-hover/club-box:scale-105">
                            {selectedOrgContract.equipo_nombre?.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link to={`/equipos/${selectedOrgContract.equipo_id}`} className="font-display font-black text-lg text-foreground hover:text-primary uppercase tracking-wide transition-colors truncate block">
                            {selectedOrgContract.equipo_nombre}
                          </Link>
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase mt-0.5 truncate font-mono">
                            🏆 LIGA: {selectedOrgContract.organizacion_nombre}
                          </span>
                        </div>
                      </div>
                      <div className="w-full text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black font-mono py-2.5 rounded-xl shadow-inner">
                        🛡️ CONTRATO VIGENTE
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 pt-2">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 text-2xl shrink-0 shadow animate-pulse">
                          🤝
                        </div>
                        <div className="min-w-0">
                          <strong className="font-display font-black text-lg text-amber-500 uppercase tracking-wide block truncate">
                            Jugador Libre
                          </strong>
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase mt-0.5 truncate">
                            {selectedOrg !== 'todas' 
                              ? `Sin club en esta liga` 
                              : 'Sin club asignado'}
                          </span>
                        </div>
                      </div>
                      <div className="w-full text-center bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-black font-mono py-2.5 rounded-xl animate-pulse shadow-sm">
                        ⚡ DISPONIBLE PARA FICHAJE
                      </div>
                    </div>
                  )}
                </div>

                {/* Carta OVR de Atributos */}
                <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden flex flex-col items-center justify-center text-center space-y-5">
                  <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-border/30 pointer-events-none"></div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-border/30 pointer-events-none"></div>
                  
                  <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest border-b border-border/20 pb-1.5 w-full">TELEMETRÍA GENERAL OVR</span>
                  
                  {/* HUD OVR Badge Gauge */}
                  <div className="relative flex items-center justify-center mt-3">
                    {/* SVG Gauge */}
                    <svg className="w-28 h-28 sm:w-32 sm:h-32 transform -rotate-90">
                      {/* Track circle */}
                      <circle
                        cx="56"
                        cy="56"
                        r="46"
                        className="stroke-muted/20"
                        strokeWidth="5"
                        fill="transparent"
                      />
                      {/* Progress circle with position color stroke */}
                      <circle
                        cx="56"
                        cy="56"
                        r="46"
                        className={`transition-all duration-1000 ease-out stroke-current ${posStyles.textColor} drop-shadow-[0_0_8px_currentColor]`}
                        strokeWidth="5"
                        strokeLinecap="round"
                        fill="transparent"
                        strokeDasharray="289"
                        strokeDashoffset={289 - (Math.min(10, Number(estadisticas.promedio_valoracion || 0)) / 10) * 289}
                      />
                    </svg>
                    
                    {/* Central Value */}
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] font-mono font-bold text-muted-foreground tracking-wider uppercase leading-none">OVR</span>
                      <strong className={`text-3xl sm:text-4xl font-display font-extrabold leading-none mt-1 ${posStyles.accentText}`}>
                        {estadisticas.promedio_valoracion ? Number(estadisticas.promedio_valoracion).toFixed(1) : '—'}
                      </strong>
                    </div>

                    {/* Dotted HUD outer ring */}
                    <div className="absolute inset-0 rounded-full border border-dashed border-border/20 scale-[1.08] animate-spin [animation-duration:25s] pointer-events-none"></div>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-sm font-black text-foreground uppercase block font-mono">
                      Valoración General
                    </strong>
                    <span className="text-[10px] text-muted-foreground font-medium block">
                      Calculado en {estadisticas.partidos_jugados || 0} partidos oficiales
                    </span>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-border/20 text-center font-mono">
                    <div className="bg-background/25 border border-border/20 rounded-xl p-2 hover:bg-background/40 transition-colors shadow-inner">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block">Goles</span>
                      <strong className="text-sm font-black text-emerald-400">{estadisticas.total_goles || 0}</strong>
                    </div>
                    <div className="bg-background/25 border border-border/20 rounded-xl p-2 hover:bg-background/40 transition-colors shadow-inner">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block">MVPs</span>
                      <strong className="text-sm font-black text-amber-500">{estadisticas.total_mvp || 0} ⭐</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas Detalladas */}
              <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
                
                {/* Rankings Tácticos HUD */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card Global */}
                  <div className="relative border border-border/40 bg-card/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 flex items-center justify-between overflow-hidden shadow-lg group/rank hover:border-primary/20 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
                    <div className="space-y-1 text-left z-10">
                      <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest block">RANGO GLOBAL POR POSICIÓN</span>
                      <h4 className="text-xs font-display font-black text-foreground uppercase tracking-wide">Clasificación Mundial</h4>
                      <p className="text-[10px] text-muted-foreground font-mono mt-1 font-bold">
                        Categoría: <span className={posStyles.accentText}>{posGroup}</span>
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end shrink-0 z-10">
                      {rank_global ? (
                        <>
                          <span className="text-3xl font-display font-extrabold text-foreground tracking-tighter">
                            #{rank_global}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono font-black uppercase mt-0.5">
                            de {total_global} jugadores
                          </span>
                          <span className="text-[8px] bg-primary/15 text-primary border border-primary/25 rounded px-1.5 py-0.5 font-mono font-bold mt-2 uppercase tracking-wide shadow-sm">
                            Top {Math.max(1, Math.round((rank_global / total_global) * 100))}%
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-3xl font-display font-extrabold text-muted-foreground/60 tracking-tighter">
                            #—
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono font-black uppercase mt-0.5">
                            Sin partidos
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card Liga */}
                  <div className="relative border border-border/40 bg-card/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 flex items-center justify-between overflow-hidden shadow-lg group/rank hover:border-emerald-500/20 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none"></div>
                    <div className="space-y-1 text-left z-10">
                      <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest block">RANGO CIRCUITO ACTIVO</span>
                      <h4 className="text-xs font-display font-black text-foreground uppercase tracking-wide">Clasificación en Liga</h4>
                      <p className="text-[10px] text-muted-foreground font-mono mt-1 font-bold truncate max-w-[150px]">
                        Liga: <span className="text-foreground">{contrato_activo?.organizacion_nombre || 'Ninguna'}</span>
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end shrink-0 z-10">
                      {rank_liga ? (
                        <>
                          <span className="text-3xl font-display font-extrabold text-foreground tracking-tighter">
                            #{rank_liga}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono font-black uppercase mt-0.5">
                            de {total_liga} en liga
                          </span>
                          <span className="text-[8px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded px-1.5 py-0.5 font-mono font-bold mt-2 uppercase tracking-wide shadow-sm">
                            Top {Math.max(1, Math.round((rank_liga / total_liga) * 100))}%
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-3xl font-display font-extrabold text-muted-foreground/60 tracking-tighter">
                            #—
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono font-black uppercase mt-0.5">
                            {contrato_activo ? 'Sin estadísticas' : 'Agente Libre'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Líder de la Posición */}
                {lider_posicion && lider_posicion.name && (
                  <div className="relative border border-amber-500/30 bg-amber-500/[0.02] backdrop-blur-md rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden shadow-lg group/leader hover:border-amber-500/50 hover:bg-amber-500/[0.04] transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none"></div>
                    <div className="flex items-center gap-4 text-center sm:text-left z-10">
                      {/* Leader Avatar */}
                      <div className="w-12 h-12 rounded-xl border border-amber-500/30 overflow-hidden bg-background/45 flex items-center justify-center shrink-0 shadow-md">
                        {lider_posicion.foto ? (
                          <img 
                            src={getImageUrl(lider_posicion.foto)} 
                            alt={lider_posicion.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-amber-500 text-lg font-black">{lider_posicion.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="space-y-0.5 text-left">
                        <span className="text-[8px] font-mono font-black text-amber-500 uppercase tracking-widest flex items-center justify-start gap-1">
                          ⭐ LÍDER DE LA POSICIÓN ({posGroup})
                        </span>
                        <h4 className="text-sm font-display font-black text-foreground uppercase tracking-wide">
                          {lider_posicion.name}
                        </h4>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          Mejor valoración en la base de datos de competidores.
                        </p>
                      </div>
                    </div>

                    {/* Right: Rating */}
                    <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto z-10">
                      <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-2 text-center w-full sm:w-auto">
                        <span className="text-[8px] font-bold text-amber-500 uppercase tracking-wider block font-mono">Valoración</span>
                        <strong className="text-base font-display font-black text-amber-400">{lider_posicion.avg_valoracion}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Panel Completo de Telemetría Avanzada (Todos los Atributos) */}
                <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-5 space-y-6 shadow-md relative overflow-hidden">
                  <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2 flex items-center justify-between">
                    <span>📋 HISTORIAL COMPLETO DE TELEMETRÍA TÁCTICA</span>
                    <span className={`text-[9px] font-mono font-bold ${posStyles.accentText}`}>{posStyles.label.toUpperCase()}</span>
                  </h3>

                  {/* Selector de sub-sección de Telemetría */}
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 border-b border-border/25 pb-3">
                    {[
                      { id: 'ataque', label: '🎯 Ofensiva', hoverColor: 'hover:text-rose-400' },
                      { id: 'pase', label: '🪄 Distribución', hoverColor: 'hover:text-emerald-400' },
                      { id: 'defensa', label: '🛡️ Defensa', hoverColor: 'hover:text-blue-400' },
                      { id: 'porteria', label: '🧤 Portería', hoverColor: 'hover:text-amber-400' },
                      { id: 'fisico', label: '⏱️ Físico', hoverColor: 'hover:text-purple-400' }
                    ].map((sTab) => (
                      <button
                        key={sTab.id}
                        onClick={() => setActiveStatSubTab(sTab.id)}
                        className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-mono font-bold uppercase transition-all duration-300 cursor-pointer ${
                          activeStatSubTab === sTab.id
                            ? `${posStyles.posColor} border shadow-[0_0_12px_rgba(255,255,255,0.02)]`
                            : `text-muted-foreground bg-background/35 border border-border/10 ${sTab.hoverColor}`
                        }`}
                      >
                        {sTab.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-6 pt-2">
                    {statsSections
                      .filter((sec) => sec.id === activeStatSubTab)
                      .map((sec, sIdx) => {
                        return (
                          <div key={sIdx} className="space-y-3">
                            <h4 className={`text-[10px] font-mono font-black ${sec.color} uppercase tracking-widest flex items-center gap-1.5`}>
                              {sec.title}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                              {sec.items.map((stat, idx) => {
                                const numValue = Number(stat.valForBar !== undefined ? stat.valForBar : (typeof stat.value === 'string' ? parseFloat(stat.value) : stat.value));
                                const barPct = stat.pct !== undefined ? stat.pct : Math.min((numValue / stat.max) * 100, 100);
                                return (
                                  <div key={idx} className="bg-background/35 border border-border/20 hover:border-primary/15 rounded-xl p-3 sm:p-3.5 relative overflow-hidden text-left group/stat shadow-sm transition-all duration-300 hover:bg-background/50 hover:-translate-y-0.5 animate-fade-in">
                                    <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-foreground/[0.015] to-transparent pointer-events-none rounded-tr-xl"></div>
                                    <span className="text-[8px] font-bold text-muted-foreground uppercase block font-mono">{stat.label}</span>
                                    <strong className="text-sm font-black text-foreground block mt-1 font-mono tracking-wide">{stat.value}</strong>
                                    <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden border border-border/10 mt-1.5">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${stat.isNegative ? 'bg-gradient-to-r from-red-600 to-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : sec.barColor}`} 
                                        style={{ width: `${barPct}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Comparativa Táctica (Visual Analytics / Triple Bars) */}
                <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-5 space-y-4 shadow-md relative overflow-hidden">
                  <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2 flex items-center justify-between">
                    <span>📊 COMPARATIVA TÁCTICA CON EL SERVIDOR</span>
                    <span className="text-[9px] font-mono font-bold text-amber-500">ANALYTICS HUD</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {getComparativaStats().map((stat, idx) => {
                      const playerPercent = Math.min((stat.player / stat.max) * 100, 100);
                      const avgPercent = Math.min((stat.avg / stat.max) * 100, 100);
                      const leaderPercent = Math.min((stat.leader / stat.max) * 100, 100);

                      return (
                        <div key={idx} className="space-y-4 bg-background/30 border border-border/20 hover:border-primary/20 rounded-xl p-3.5 sm:p-4 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group/comp shadow-sm">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/5 to-transparent pointer-events-none rounded-tr-xl"></div>
                          <div>
                            <span className="text-xs font-bold text-foreground uppercase tracking-wider font-mono block group-hover/comp:text-primary transition-colors">
                              {stat.label}
                            </span>

                            <div className="grid grid-cols-3 gap-2 font-mono text-[9px] bg-background/50 p-2 rounded-xl border border-border/10 mt-3 shadow-inner">
                              <div className="text-center border-r border-border/10">
                                <span className="text-muted-foreground font-black uppercase block text-[7px] tracking-wider">Tú</span>
                                <strong className={`text-sm font-black tracking-wide ${stat.invertColor ? 'text-rose-400' : posStyles.accentText}`}>
                                  {stat.format(stat.player)}
                                </strong>
                              </div>
                              <div className="text-center border-r border-border/10">
                                <span className="text-muted-foreground font-black uppercase block text-[7px] tracking-wider">Media</span>
                                <strong className="text-sm font-black text-muted-foreground tracking-wide">
                                  {stat.format(stat.avg)}
                                </strong>
                              </div>
                              <div className="text-center">
                                <span className="text-muted-foreground font-black uppercase block text-[7px] tracking-wider">Líder</span>
                                <strong className="text-sm font-black text-amber-400 tracking-wide">
                                  {stat.format(stat.leader)}
                                </strong>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 pt-1">
                            {/* Tú bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[7px] text-muted-foreground uppercase font-mono tracking-wider font-bold">
                                <span>Rendimiento Propio</span>
                                <span className={stat.invertColor ? 'text-rose-400' : posStyles.accentText}>{Math.round(playerPercent)}%</span>
                              </div>
                              <div className="h-2 bg-muted/40 rounded-full overflow-hidden border border-border/10 relative">
                                <div 
                                  className={`h-full rounded-full animate-fill-bar ${stat.invertColor ? 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : posStyles.barColor}`}
                                  style={{ width: `${playerPercent}%`, animationDelay: `${idx * 0.05}s` }}
                                ></div>
                              </div>
                            </div>

                            {/* Media bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[7px] text-muted-foreground uppercase font-mono tracking-wider font-bold">
                                <span>Media del Servidor</span>
                                <span>{Math.round(avgPercent)}%</span>
                              </div>
                              <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden border border-border/10">
                                <div 
                                  className="h-full bg-muted-foreground/30 rounded-full animate-fill-bar"
                                  style={{ width: `${avgPercent}%`, animationDelay: `${idx * 0.05 + 0.03}s` }}
                                ></div>
                              </div>
                            </div>

                            {/* Líder bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[7px] text-muted-foreground uppercase font-mono tracking-wider font-bold">
                                <span>Líder Posicional</span>
                                <span className="text-amber-400 font-bold">{Math.round(leaderPercent)}%</span>
                              </div>
                              <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden border border-border/10">
                                <div 
                                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)] rounded-full animate-fill-bar"
                                  style={{ width: `${leaderPercent}%`, animationDelay: `${idx * 0.05 + 0.06}s` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {activeTab === 'competencias' && (
          <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-5 space-y-4 shadow-md animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-border/30 rounded-tl-sm pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-border/30 rounded-br-sm pointer-events-none"></div>
            <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2">
              🏆 TORNEOS ACTIVOS DEL CLUB
            </h3>
            {competencias && competencias.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {competencias.map((comp) => (
                  <div key={comp.id} className="flex items-center gap-3.5 p-4 rounded-xl border border-border/30 bg-background/25 transition-all duration-300 hover:border-primary/30 hover:bg-background/45 hover:-translate-y-1 relative group shadow-sm">
                    <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none rounded-tr-xl"></div>
                    {comp.logo ? (
                      <img 
                        src={getImageUrl(comp.logo)} 
                        alt={comp.nombre} 
                        className="w-12 h-12 object-cover rounded-lg border border-border/40 shrink-0 shadow transition-transform duration-300 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                        🏆
                      </div>
                    )}
                    <div className="min-w-0 flex-1 z-10">
                      <Link to={`/organizaciones/${comp.id}`} className="font-display font-black text-sm text-foreground uppercase tracking-wide hover:text-primary transition-colors block truncate">
                        {comp.nombre}
                      </Link>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono mt-1 block truncate">
                        {comp.organizacion_nombre} • {comp.formato} ({comp.plataforma})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground font-medium bg-muted/20 p-4 rounded-xl text-center italic border border-border/30">El club de este jugador no se encuentra inscrito en competencias activas.</p>
            )}
          </div>
        )}

        {activeTab === 'traspasos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Expediente del Competidor (User details) */}
            <div className="lg:col-span-1 space-y-6">
              <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-5 space-y-5 shadow-md relative overflow-hidden">
                {/* Corners visual decoration */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary/45 rounded-tl-sm pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary/45 rounded-br-sm pointer-events-none"></div>
                
                <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2">
                  👤 EXPEDIENTE DEL COMPETIDOR
                </h3>
                
                <div className="space-y-4">
                  {/* Account status badge */}
                  <div className="flex justify-between items-center bg-background/25 border border-border/20 p-2.5 rounded-xl shadow-inner">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Estado del Perfil</span>
                    <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                      user.status === 'activo'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : user.status === 'suspendido'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {user.status || 'Activo'}
                    </span>
                  </div>

                  {/* Gamer credentials */}
                  <div className="space-y-2.5 bg-background/25 border border-border/20 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-bold uppercase">Gamertag</span>
                      <strong className="text-foreground font-extrabold">{user.gamertag || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-bold uppercase">ID EA</span>
                      <strong className="text-primary font-black">{user.id_ea || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-bold uppercase">Plataforma</span>
                      <strong className="text-foreground font-extrabold uppercase">{user.plataforma || 'Crossplay'}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-bold uppercase">Contacto</span>
                      <strong className="text-foreground font-extrabold truncate max-w-[120px]">{user.email || 'N/A'}</strong>
                    </div>
                    {user.fecha_nacimiento && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-bold uppercase">Nacimiento</span>
                        <strong className="text-foreground font-extrabold">{new Date(user.fecha_nacimiento).toLocaleDateString()}</strong>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-bold uppercase">Registro</span>
                      <strong className="text-foreground font-extrabold">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </strong>
                    </div>
                  </div>

                  {/* Biography section */}
                  <div className="space-y-1.5 bg-background/30 border border-border/20 p-4 rounded-xl text-left relative shadow-sm">
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-primary/30 rounded-tr-sm pointer-events-none"></div>
                    <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">BIOGRAFÍA TÁCTICA</span>
                    <p className="text-xs text-foreground/80 leading-relaxed font-sans font-light italic">
                      "{user.biografia || 'Sin biografía táctica declarada en el perfil del competidor.'}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Traspasos timeline */}
            <div className="lg:col-span-2">
              <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-5 space-y-4 shadow-md relative overflow-hidden">
                {/* Scanlines visual effect */}
                <div className="absolute inset-0 broadcast-scanlines pointer-events-none opacity-[0.02]"></div>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/20 pb-2.5 gap-3">
                  <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono">
                    🔄 CRONOLOGÍA DE FICHAJES Y TRANSFERENCIAS
                  </h3>
                  
                  {/* Selector de Organización para Traspasos */}
                  <div className="w-full sm:w-60">
                    <select
                      value={selectedTraspasoOrg}
                      onChange={(e) => setSelectedTraspasoOrg(e.target.value)}
                      className="input-premium py-1 px-2.5 text-[10px] uppercase w-full font-mono font-bold"
                    >
                      <option value="todas">🌎 Todas las organizaciones</option>
                      {allOrgs.map(org => (
                        <option key={org.id} value={org.id.toString()}>🏢 {org.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {(() => {
                  const filteredTraspasos = (traspasos || []).filter((t) => {
                    const orgId = String(t.organizacion?.id || t.organizacion_id || '');
                    if (selectedTraspasoOrg !== 'todas' && orgId !== selectedTraspasoOrg) {
                      return false;
                    }
                    return true;
                  });

                  if (filteredTraspasos.length === 0) {
                    return (
                      <div className="border border-border/30 bg-muted/10 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-2">
                        <span className="text-2xl animate-pulse">🔄</span>
                        <p className="text-xs text-muted-foreground font-medium italic font-sans">No se registran movimientos ni transferencias oficiales para esta organización.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="relative border-l border-dashed border-border/45 ml-4 pl-6 space-y-6 pt-2">
                      {filteredTraspasos.map((t) => (
                        <div key={t.id} className="relative">
                          {/* Database dot connection */}
                          <span className={`absolute -left-[9px] top-1.5 w-4.5 h-4.5 rounded-full border-4 border-background shadow-[0_0_12px_currentColor] bg-current ${posStyles.textColor}`}></span>
                          
                          <div className="space-y-2 bg-background/25 border border-border/30 p-3 sm:p-4 rounded-xl transition-all hover:border-primary/20 hover:bg-background/40 hover:-translate-y-0.5 duration-300 shadow-sm">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black px-2 py-0.5 rounded font-mono uppercase tracking-wide">
                                VINCULACIÓN APROBADA
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono font-bold">
                                {new Date(t.updated_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            
                            <p className="text-xs font-semibold text-foreground leading-relaxed pt-1 font-sans">
                              {t.equipo?.id ? (
                                <span>
                                  Fichaje oficial por <Link to={`/equipos/${t.equipo.id}`} className="text-primary hover:underline font-black">{t.equipo.nombre}</Link> procediendo desde <span className="text-muted-foreground font-bold">{t.equipo_origen?.nombre || 'Agente Libre'}</span>.
                                </span>
                              ) : (
                                <span>
                                  Desvinculación de <strong className="text-foreground">{t.equipo_origen?.nombre || 'su club'}</strong> quedando en condición de <strong className="text-primary">Agente Libre / Jugador Libre</strong>.
                                </span>
                              )}
                            </p>
                            
                            <div className="flex items-center justify-between border-t border-border/10 pt-2.5 mt-1 text-[9px] font-mono font-bold text-muted-foreground uppercase">
                              <span>LIGA / CIRCUITO: <span className="text-foreground font-black">{t.organizacion?.nombre || 'N/A'}</span></span>
                              {t.dorsal && <span className="text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 font-mono">Dorsal #{t.dorsal}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendario' && (
          <div className="border border-border/40 bg-card/15 backdrop-blur-md rounded-3xl p-5 shadow-2xl relative overflow-hidden transition-all duration-300 animate-fade-in">
            {/* Corners visual braces */}
            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-primary/45 rounded-tl-lg pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-primary/45 rounded-tr-lg pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-primary/45 rounded-bl-lg pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-primary/45 rounded-tr-lg pointer-events-none"></div>
            <Partidos forPlayer={true} hideHero={true} playerId={id} />
          </div>
        )}

        {activeTab === 'historia' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/20 pb-4">
                <div className="text-left">
                  <h3 className="text-xl font-display font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                    📜 ARCHIVO HISTÓRICO Y RESUMEN TÁCTICO
                  </h3>
                  <p className="text-xs text-muted-foreground font-light mt-1">
                    Estadísticas acumuladas e historial de torneos disputados por el jugador a lo largo de las temporadas en Torneos Pro FC.
                  </p>
                </div>

                {/* Selectores de Organización y Temporada */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:max-w-md">
                  <div>
                    <select
                      value={selectedHistoryOrg}
                      onChange={(e) => handleHistoryOrgChange(e.target.value)}
                      className="w-full bg-background/55 border border-border/45 px-3 py-2 rounded-xl text-xs font-mono font-bold text-foreground cursor-pointer uppercase"
                    >
                      <option value="todas">🏢 Todas las Ligas</option>
                      {uniqueHistoryOrgs.map((org) => (
                        <option key={org.id} value={org.id}>
                          🏆 {org.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={selectedHistorySeason}
                      onChange={(e) => setSelectedHistorySeason(e.target.value)}
                      disabled={selectedHistoryOrg === 'todas'}
                      className="w-full bg-background/55 border border-border/45 px-3 py-2 rounded-xl text-xs font-mono font-bold text-foreground cursor-pointer uppercase disabled:opacity-50"
                    >
                      <option value="todas">📅 Todas las Temporadas</option>
                      {uniqueHistorySeasons.map((seas) => (
                        <option key={seas.id} value={seas.id}>
                          ⏱️ {seas.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {filteredHistory && filteredHistory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  {filteredHistory.map((hist, idx) => (
                    <div key={idx} className="group border border-border/40 bg-background/20 backdrop-blur-md rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-all duration-300 hover:border-primary/30 hover:bg-background/30 flex flex-col gap-4 animate-fade-in-up shadow-sm hover:shadow-md" style={{ animationDelay: `${idx * 0.08}s` }}>
                      {/* Brackets decorativos HUD */}
                      <div className={`absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-transparent transition-colors duration-300 group-hover:${posStyles.brackets} rounded-tl-md pointer-events-none`}></div>
                      <div className={`absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-transparent transition-colors duration-300 group-hover:${posStyles.brackets} rounded-tr-md pointer-events-none`}></div>
                      <div className={`absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-transparent transition-colors duration-300 group-hover:${posStyles.brackets} rounded-bl-md pointer-events-none`}></div>
                      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-transparent transition-colors duration-300 group-hover:${posStyles.brackets} rounded-br-md pointer-events-none`}></div>
                      
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

                      <div className="flex items-center gap-3 z-10">
                        {hist.equipo_logo ? (
                          <img 
                            src={getImageUrl(hist.equipo_logo)} 
                            alt={hist.equipo_nombre} 
                            className="w-12 h-12 rounded-xl object-cover border border-border/40 shrink-0 shadow" 
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-black text-primary text-lg uppercase shrink-0">
                            🛡️
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-display font-black text-base text-foreground uppercase tracking-wide truncate group-hover:text-primary transition-colors font-extrabold">
                            {hist.equipo_nombre}
                          </h4>
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase truncate font-mono">
                            🏆 {hist.competencia_nombre} • {hist.temporada_nombre}
                          </span>
                          <span className="text-[9px] text-primary/70 block font-mono font-bold uppercase truncate">
                            💼 {hist.organizacion_nombre}
                          </span>
                        </div>
                      </div>

                      <div className="h-px bg-border/20 z-10"></div>

                      {/* Resumen táctico de la temporada */}
                      <div className="grid grid-cols-3 gap-2.5 font-mono text-center z-10">
                        <div className="bg-background/40 border border-border/25 rounded-xl p-2 hover:bg-background/60 transition-colors shadow-inner">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Partidos</span>
                          <strong className="text-sm font-black text-foreground">{hist.partidos_jugados}</strong>
                        </div>
                        <div className="bg-background/40 border border-border/25 rounded-xl p-2 hover:bg-background/60 transition-colors shadow-inner">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Goles</span>
                          <strong className="text-sm font-black text-emerald-400">{hist.total_goles}</strong>
                        </div>
                        <div className="bg-background/40 border border-border/25 rounded-xl p-2 hover:bg-background/60 transition-colors shadow-inner">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Asist.</span>
                          <strong className="text-sm font-black text-primary">{hist.total_asistencias}</strong>
                        </div>
                        <div className="bg-background/40 border border-border/25 rounded-xl p-2 hover:bg-background/60 transition-colors col-span-1.5 flex items-center justify-between px-3 shadow-inner">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">MVP</span>
                          <strong className="text-sm font-black text-amber-500">{hist.total_mvp} ⭐</strong>
                        </div>
                        <div className="bg-background/40 border border-border/25 rounded-xl p-2 hover:bg-background/60 transition-colors col-span-1.5 flex items-center justify-between px-3 shadow-inner">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Rating</span>
                          <strong className="text-sm font-black text-primary">{Number(hist.promedio_valoracion).toFixed(1)}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-border/50 bg-muted/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
                  <span className="text-2xl">📜</span>
                  <p className="text-sm text-muted-foreground font-medium italic">
                    No se registran datos ni participaciones para los filtros seleccionados.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
