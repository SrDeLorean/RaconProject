import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import api from '@/api/axios';
import { useAuthStore } from '@/store/useAuthStore';

import Spinner from '@/components/ui/Spinner';

// Helper to get today's date in local YYYY-MM-DD format
function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to classify match state dynamically based on actual real date and database reports
function classifyMatch(p) {
  const today = getTodayStr();
  // 1. En vivo: Consiste en revisar la fecha del partido con la fecha real del pc/servidor. Si coincide, son en vivo.
  if (p.fecha && p.fecha === today) {
    return 'live';
  }
  // 2. Finalizados: son los partidos ya reportados en el sistema
  if (p.goles_local != null && p.goles_visitante != null) {
    return 'finished';
  }
  // 3. Próximos: todo el resto
  return 'upcoming';
}

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (typeof window.mediaUrl === 'function') {
    return window.mediaUrl(path);
  }
  const backendBaseUrl = api.defaults.baseURL?.replace(/\/api$/, '') ;
  return `${backendBaseUrl}${path}`;
};

export default function Partidos({ forOrganizer = false, forPlayer = false, forTeam = false, hideHero = false, playerId = null, teamId = null }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [allPartidos, setAllPartidos] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const targetUserId = playerId || user?.id;

  // Filters
  const [statusTab, setStatusTab] = useState('all');
  const [orgFiltro, setOrgFiltro] = useState(null); // org ID
  const [compFiltro, setCompFiltro] = useState(null); // comp ID
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [dateIndex, setDateIndex] = useState(0);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [sortedDates, setSortedDates] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ all: 0, live: 0, upcoming: 0, finished: 0 });

  const [organizaciones, setOrganizaciones] = useState([]);
  const [competencias, setCompetencias] = useState([]);

  // Debounce search query to prevent hammering the server
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Load organizations
  useEffect(() => {
    const params = { per_page: 100 };
    if (forOrganizer && user) {
      params.owner_id = user.id;
    } else if (forPlayer && targetUserId) {
      params.player_id = targetUserId;
    }
    api.get('/organizaciones', { params })
      .then(res => {
        const list = res.data.data || res.data || [];
        setOrganizaciones(list);
        if ((forOrganizer || forPlayer) && list.length > 0) {
          setOrgFiltro(list[0].id);
        }
      })
      .catch(err => console.error("Error loading organizations:", err));
  }, [forOrganizer, forPlayer, user, targetUserId]);

  // Load competitions based on organization selection
  useEffect(() => {
    if (orgFiltro) {
      api.get(`/organizaciones/${orgFiltro}`)
        .then(res => {
          setCompetencias(res.data?.temporadas?.flatMap(t => t.competencias || []) || []);
        })
        .catch(err => console.error("Error loading competitions:", err));
    } else {
      api.get('/competencias')
        .then(res => setCompetencias(res.data.data || res.data || []))
        .catch(err => console.error("Error loading all competitions:", err));
    }
  }, [orgFiltro]);

  // Fetch player profile data to obtain team contracts if user is a player
  useEffect(() => {
    if (targetUserId && forPlayer) {
      api.get(`/usuarios/${targetUserId}`)
        .then(res => {
          setProfileData(res.data || null);
        })
        .catch(err => console.error("Error al cargar perfil de jugador:", err));
    }
  }, [targetUserId, forPlayer]);

  // Fetch distinct calendar dates from backend matching filters
  useEffect(() => {
    if (forPlayer && !profileData) return;

    const fetchDates = async () => {
      try {
        const params = {};
        if (orgFiltro) params.organizacion_id = orgFiltro;
        if (compFiltro) params.competencia_id = compFiltro;
        if (debouncedSearchText) params.search = debouncedSearchText;
        if (forTeam && teamId) params.equipo_id = teamId;
        
        if (forOrganizer) {
          params.for_organizer = true;
        }
        if (forPlayer) {
          const equipoId = profileData?.contrato_activo?.equipo_id;
          if (equipoId) {
            params.equipo_id = equipoId;
          } else {
            setSortedDates([]);
            return;
          }
        }
        
        const response = await api.get('/partidos-fechas', { params });
        const fetchedDates = response.data || [];
        
        if (fetchedDates.length === 0) {
          const today = new Date();
          const fallback = [...Array(7)].map((_, i) => {
            const nextDay = new Date(today);
            nextDay.setDate(today.getDate() + i - 2);
            return nextDay.toISOString().split('T')[0];
          });
          setSortedDates(fallback);
        } else {
          setSortedDates(fetchedDates);
        }
      } catch (error) {
        console.error("Error al obtener fechas del servidor:", error);
      }
    };
    fetchDates();
  }, [orgFiltro, compFiltro, debouncedSearchText, forTeam, teamId, forOrganizer, forPlayer, profileData]);

  const activeDate = useMemo(() => {
    if (sortedDates.length === 0) return null;
    const item = sortedDates[dateIndex];
    return typeof item === 'string' ? item : item?.fecha;
  }, [sortedDates, dateIndex]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeDate, statusTab, orgFiltro, compFiltro, debouncedSearchText]);

  // Sync dateIndex when statusTab changes to 'live' or when dates load
  useEffect(() => {
    if (sortedDates.length > 0) {
      if (statusTab === 'live') {
        const today = getTodayStr();
        const datesArray = sortedDates.map(d => typeof d === 'string' ? d : d.fecha);
        const idx = datesArray.indexOf(today);
        if (idx !== -1) {
          setDateIndex(idx);
          return;
        }
      }
    }
  }, [statusTab, sortedDates]);

  // Set initial dateIndex to today's date (or closest) once dates load
  useEffect(() => {
    if (sortedDates.length > 0) {
      const today = getTodayStr();
      const datesArray = sortedDates.map(d => typeof d === 'string' ? d : d.fecha);
      const idx = datesArray.indexOf(today);
      if (idx !== -1) {
        setDateIndex(idx);
      } else {
        // Find closest date to today chronologically
        let closestIdx = 0;
        let minDiff = Infinity;
        const todayMs = new Date(today).getTime();
        datesArray.forEach((dStr, i) => {
          const diff = Math.abs(new Date(dStr).getTime() - todayMs);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = i;
          }
        });
        setDateIndex(closestIdx);
      }
    }
  }, [sortedDates]);

  // Fetch status counts matching current filter selection
  useEffect(() => {
    if (forPlayer && !profileData) return;

    const fetchCounts = async () => {
      try {
        const params = {
          today: getTodayStr(),
          fecha: activeDate
        };
        if (orgFiltro) params.organizacion_id = orgFiltro;
        if (compFiltro) params.competencia_id = compFiltro;
        if (debouncedSearchText) params.search = debouncedSearchText;
        if (forTeam && teamId) params.equipo_id = teamId;
        
        if (forOrganizer) {
          params.for_organizer = true;
        }
        if (forPlayer) {
          const equipoId = profileData?.contrato_activo?.equipo_id;
          if (equipoId) {
            params.equipo_id = equipoId;
          } else {
            setStatusCounts({ all: 0, live: 0, upcoming: 0, finished: 0 });
            return;
          }
        }
        
        const response = await api.get('/partidos-conteos', { params });
        setStatusCounts(response.data || { all: 0, live: 0, upcoming: 0, finished: 0 });
      } catch (error) {
        console.error("Error al obtener conteos de partidos:", error);
      }
    };
    fetchCounts();
  }, [activeDate, orgFiltro, compFiltro, debouncedSearchText, forTeam, teamId, forOrganizer, forPlayer, profileData]);

  // Lazy-load matches from backend based on active date or tab and active filters
  useEffect(() => {
    if (forPlayer && !profileData) return;

    if (statusTab === 'all' && !activeDate) {
      setAllPartidos([]);
      setLoading(false);
      return;
    }

    const fetchPartidos = async () => {
      setLoading(true);
      try {
        const params = {
          today: getTodayStr()
        };
        if (orgFiltro) params.organizacion_id = orgFiltro;
        if (compFiltro) params.competencia_id = compFiltro;
        if (debouncedSearchText) params.search = debouncedSearchText;
        
        if (forOrganizer && targetUserId) {
          params.for_organizer = true;
        }
        
        if (forPlayer && targetUserId) {
          const equipoId = profileData?.contrato_activo?.equipo_id;
          if (equipoId) {
            params.equipo_id = equipoId;
          } else {
            setAllPartidos([]);
            setLoading(false);
            return;
          }
        }
        
        if (forTeam && teamId) {
          params.equipo_id = teamId;
        }

        if (statusTab === 'all') {
          if (activeDate) {
            params.fecha = activeDate;
          }
        } else {
          params.status = statusTab;
        }

        const response = await api.get('/partidos', { params });
        setAllPartidos(response.data || []);
      } catch (error) {
        console.error('Error al traer partidos de la BD:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartidos();
  }, [activeDate, statusTab, orgFiltro, compFiltro, debouncedSearchText, forOrganizer, forPlayer, profileData, forTeam, teamId, targetUserId]);

  const partidos = allPartidos;
  const filteredMatches = allPartidos;

  // Get all unique hours present in the filtered matches list
  const uniqueHorarios = useMemo(() => {
    const set = new Set();
    let hasEmpty = false;
    filteredMatches.forEach(p => {
      if (p.hora && p.hora.trim() !== '') {
        const cleanHora = p.hora.substring(0, 5);
        set.add(cleanHora);
      } else {
        hasEmpty = true;
      }
    });
    const list = Array.from(set);
    list.sort((a, b) => a.localeCompare(b));

    if (hasEmpty) {
      list.push('Por definir');
    }
    return list;
  }, [filteredMatches]);

  const totalPages = uniqueHorarios.length;
  const activeHorario = uniqueHorarios[currentPage - 1] || null;

  const paginatedMatches = useMemo(() => {
    if (uniqueHorarios.length === 0) return filteredMatches;
    if (!activeHorario) return filteredMatches;
    
    return filteredMatches.filter(p => {
      if (activeHorario === 'Por definir') {
        return !p.hora || p.hora.trim() === '';
      }
      const cleanHora = p.hora ? p.hora.substring(0, 5) : '';
      return cleanHora === activeHorario;
    });
  }, [filteredMatches, activeHorario, uniqueHorarios]);

  // Auto scroll to keep selected date centered in viewport horizontally
  useEffect(() => {
    const activeEl = document.getElementById(`date-btn-${dateIndex}`);
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [dateIndex]);

  // Format dates for the broadcast strip (Spanish labels LUN/MAY, VIE/JUN, etc.)
  const formattedDates = useMemo(() => {
    const weekdays = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    
    return sortedDates.map(item => {
      const dateStr = typeof item === 'string' ? item : item.fecha;
      const count = typeof item === 'string' ? 0 : (item.count || 0);

      const d = new Date(`${dateStr}T00:00:00`);
      const weekdayStr = weekdays[d.getDay()].toLowerCase();
      const monthStr = months[d.getMonth()].toLowerCase();
      
      return {
        dateStr,
        dayNum: d.getDate(),
        label: `${weekdayStr}/${monthStr}`, // e.g. "vie/jun"
        count
      };
    });
  }, [sortedDates]);

  // Group matches inside organization node -> competition node
  const nestedGrouped = useMemo(() => {
    const map = {};
    paginatedMatches.forEach(p => {
      const org = p.competencia?.temporada?.organizacion;
      const orgId = org?.id || 0;
      const orgNom = org?.nombre || 'Circuito Independiente';
      const orgLogo = org?.logo || '';
      const comp = p.competencia;
      const compId = comp?.id || 0;
      const compNom = comp?.nombre || 'División General';

      if (!map[orgId]) {
        map[orgId] = {
          id: orgId,
          nombre: orgNom,
          logo: orgLogo,
          competencias: {}
        };
      }

      if (!map[orgId].competencias[compId]) {
        map[orgId].competencias[compId] = {
          id: compId,
          nombre: compNom,
          partidos: []
        };
      }

      map[orgId].competencias[compId].partidos.push(p);
    });

    return Object.values(map).map(orgGroup => ({
      ...orgGroup,
      competencias: Object.values(orgGroup.competencias)
    }));
  }, [paginatedMatches]);

  const activeFiltersCount = [((forOrganizer || forPlayer) ? null : orgFiltro), compFiltro, searchText.trim()].filter(Boolean).length;

  function resetFilters() {
    if ((forOrganizer || forPlayer) && organizaciones.length > 0) {
      setOrgFiltro(organizaciones[0].id);
    } else {
      setOrgFiltro(null);
    }
    setCompFiltro(null);
    setSearchText('');
    setDateIndex(0);
    setStatusTab('all');
  }

  return (
    <div className={hideHero ? "relative w-full text-foreground selection:bg-primary selection:text-primary-foreground transition-colors duration-300" : "relative min-h-screen bg-background pt-28 pb-16 overflow-hidden text-foreground selection:bg-primary selection:text-primary-foreground transition-colors duration-300"}>
      


      {/* Tácticos HUD overlays */}
      <div className="absolute inset-0 hud-noise pointer-events-none z-10 opacity-70"></div>
      
      {!hideHero && (
        <>
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
                PARTIDOS
              </span>
              <span className="absolute bottom-10 right-20 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[3px] float-brush-2">
                TRANSMISIÓN
              </span>
              <span className="absolute top-1/2 left-1/3 -translate-y-1/2 text-[10rem] md:text-[15rem] font-display font-black uppercase text-foreground/[0.01] dark:text-foreground/[0.02] blur-[4px]">
                JUEGO
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16 items-center relative z-10">
              
              {/* LADO IZQUIERDO — IMPACTO PRINCIPAL */}
              <div className="lg:col-span-7 relative flex flex-col items-start gap-4">
                
                {/* Número gigante transparente de fondo */}
                <div className="absolute -top-16 -left-12 text-[15rem] md:text-[23rem] font-display font-black text-foreground/[0.035] dark:text-foreground/[0.045] select-none leading-none pointer-events-none font-extrabold tracking-tighter">
                  {allPartidos.length || 90}
                </div>

                <Badge 
                  variant="primary" 
                  className="animate-fade-in-up px-5 py-2 text-[10px] font-condensed tracking-[0.2em] text-primary border border-primary/30 bg-primary/10 rounded-full shadow-[0_0_20px_hsla(var(--primary),0.15)] uppercase animate-pulse shrink-0 z-10"
                >
                  🔥 Centro Oficial de Torneos
                </Badge>

                <h1 className="animate-fade-in-up text-4xl sm:text-8xl md:text-9xl font-display font-black text-foreground uppercase tracking-[0.01em] leading-[0.82] drop-shadow-2xl z-10 mt-2 select-none" style={{ animationDelay: '0.1s' }}>
                  CENTRO DE <br />
                  <span className="text-primary tracking-tight font-black shimmer-text">
                    PARTIDOS.
                  </span>
                </h1>

                <p className="animate-fade-in-up text-xs md:text-sm text-muted-foreground font-sans max-w-xl leading-relaxed tracking-wide font-light z-10 mt-2" style={{ animationDelay: '0.2s' }}>
                  Sigue cada partido de Pro Clubs de todas las confederaciones. Estadísticas, fixtures, marcadores oficiales y streaming broadcast en directo en tiempo real.
                </p>
              </div>

              {/* DERECHA — INFORMACIÓN TÁCTICA */}
              <div className="lg:col-span-3 flex flex-col justify-center items-start lg:items-stretch gap-6 z-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                <div className="border border-border/40 bg-card/45 backdrop-blur-md rounded-2xl p-6 w-full space-y-4 shadow-xl">
                  
                  <div className="flex justify-between items-center border-b border-border/30 pb-3">
                    <span className="text-[9px] sm:text-[10px] font-condensed tracking-widest text-muted-foreground uppercase">TELEMETRÍA REAL</span>
                    <span className="text-[9px] sm:text-[10px] font-mono text-primary font-bold">LIVE MATCHES</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-[8px] sm:text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">EN VIVO</h4>
                      <span className="text-xl sm:text-2xl md:text-3xl font-display font-black text-foreground">{statusCounts.live}</span>
                    </div>
                    <div>
                      <h4 className="text-[8px] sm:text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">TOTAL PROGRAMADOS</h4>
                      <span className="text-xl sm:text-2xl md:text-3xl font-display font-black text-primary">{allPartidos.length}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed font-sans font-light">
                    Marcadores oficiales en directo, cronometraje sincronizado y retransmisión oficial de Pro Clubs.
                  </p>

                  <button 
                    onClick={resetFilters}
                    className="w-full py-4 text-xs font-condensed tracking-widest uppercase rounded-lg text-primary-foreground font-black cursor-pointer btn-glossy"
                  >
                    REINICIAR FILTROS
                  </button>
                </div>
              </div>

            </div>

          </section>
        </>
      )}

      {/* ========================================================================= */}
      {/* 3. TOURNAMENT & COMPETITION FILTERS (Dos niveles reales desde la BD)       */}
      {/* ========================================================================= */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 mb-6">
        <div className="flex flex-col gap-5 bg-white/90 dark:bg-card/85 border border-border/40 dark:border-white/[0.06] rounded-2xl p-5 shadow-lg backdrop-blur-md">
          
          {/* Fila de Búsqueda */}
          <div className="relative w-full">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar equipo, competencia o circuito eSports..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="input-premium pl-11 py-3.5"
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {/* Estado de Partido Filtros */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/20 dark:border-white/[0.05] pt-4.5">
            <div className="flex gap-1.5 bg-white/50 dark:bg-background/60 p-1 rounded-xl border border-border/40 dark:border-white/[0.06] overflow-x-auto">
              {[
                { id: 'all', label: 'Todos', icon: '🌐' },
                { id: 'live', label: 'En Vivo', icon: '🔴' },
                { id: 'upcoming', label: 'Próximos', icon: '📅' },
                { id: 'finished', label: 'Finalizados', icon: '🏁' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-condensed font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 cursor-pointer ${
                    statusTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-lg active-date-glow'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/80 dark:hover:bg-card'
                  }`}
                >
                  <span>{tab.icon}</span> {tab.label}
                  <span className={`text-[9px] px-2 py-0.5 rounded font-black font-mono ${statusTab === tab.id ? 'bg-white/20 text-white' : 'bg-muted/30 dark:bg-white/5'}`}>
                    {statusCounts[tab.id]}
                  </span>
                </button>
              ))}
            </div>

            {/* Limpiar Filtros */}
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs font-condensed font-black text-primary hover:text-red-400 transition-colors uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
              >
                ✕ Limpiar Filtros
              </button>
            )}
          </div>

          {/* PRIMER NIVEL: Circuitos / Organizaciones Habilitados */}
          {organizaciones.length > ((forOrganizer || forPlayer) ? 1 : 0) && (
            <div className="space-y-2.5 border-t border-border/20 dark:border-white/[0.05] pt-4.5 font-sans">
              <p className="text-[9px] font-condensed font-black uppercase tracking-[0.2em] text-muted-foreground">CIRCUITOS DISPONIBLES</p>
              <div className="flex flex-wrap gap-2">
                {!(forOrganizer || forPlayer) && (
                  <button
                    onClick={() => { setOrgFiltro(null); setCompFiltro(null); }}
                    className={`px-4.5 py-2 rounded-xl text-[10px] font-condensed font-black uppercase tracking-widest border transition-all duration-300 cursor-pointer ${
                      orgFiltro === null
                        ? 'bg-primary/15 text-primary border-primary/40'
                        : 'bg-white/60 dark:bg-card/40 text-muted-foreground border-border/30 dark:border-white/[0.06] hover:bg-white/95 dark:hover:bg-card/65 hover:border-primary/45 hover:text-foreground'
                    }`}
                  >
                    TODOS ({partidos.length})
                  </button>
                )}
                {organizaciones.map(org => (
                  <button
                    key={org.id}
                    onClick={() => { setOrgFiltro(org.id); setCompFiltro(null); }}
                    className={`px-4.5 py-2 rounded-xl text-[10px] font-condensed font-black uppercase tracking-widest border transition-all duration-300 cursor-pointer ${
                      orgFiltro === org.id
                        ? 'bg-primary/15 text-primary border-primary/40'
                        : 'bg-white/60 dark:bg-card/40 text-muted-foreground border-border/30 dark:border-white/[0.06] hover:bg-white/95 dark:hover:bg-card/65 hover:border-primary/45 hover:text-foreground'
                    }`}
                  >
                    {org.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SEGUNDO NIVEL: Competencias Directas del Circuito Seleccionado */}
          {competencias.length > 0 && (
            <div className="space-y-2.5 border-t border-border/20 dark:border-white/[0.05] pt-4.5 font-sans animate-fade-in">
              <p className="text-[9px] font-condensed font-black uppercase tracking-[0.2em] text-muted-foreground">
                {orgFiltro ? 'COMPETENCIAS DEL CIRCUITO' : 'COMPETENCIAS DISPONIBLES'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCompFiltro(null)}
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-condensed font-black uppercase tracking-widest border transition-all duration-300 cursor-pointer ${
                    compFiltro === null
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-white/50 dark:bg-card/30 text-muted-foreground border-border/30 dark:border-white/[0.05] hover:bg-white/80 dark:hover:bg-card/50 hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  TODAS LAS COMPETENCIAS
                </button>
                {competencias.map(comp => (
                  <button
                    key={comp.id}
                    onClick={() => setCompFiltro(comp.id)}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-condensed font-black uppercase tracking-widest border transition-all duration-300 cursor-pointer ${
                      compFiltro === comp.id
                        ? 'bg-primary/10 text-primary border-primary/30 shadow-sm'
                        : 'bg-white/50 dark:bg-card/30 text-muted-foreground border-border/30 dark:border-white/[0.05] hover:bg-white/80 dark:hover:bg-card/50 hover:border-primary/30 hover:text-foreground'
                    }`}
                  >
                    {comp.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. DATE NAVIGATION STRIP (Con Día/Mes en vie/jun y coloreando conteos)     */}
      {/* ========================================================================= */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 mb-10">
        <div className="flex items-center gap-3">
          
          {/* Flecha Izquierda */}
          <button
            disabled={dateIndex === 0}
            onClick={() => {
              setDateIndex(prev => Math.max(0, prev - 1));
              setStatusTab('all');
            }}
            className="p-3.5 rounded-xl border border-border/40 dark:border-white/[0.06] bg-white/90 dark:bg-card/85 text-muted-foreground hover:text-foreground disabled:opacity-20 hover:border-primary/40 transition-all duration-300 cursor-pointer shrink-0"
          >
            ◀
          </button>

          {/* Carrusel de Fechas */}
          <div className="flex-1 flex gap-3 overflow-x-auto pb-1.5 custom-scrollbar">
            {formattedDates.map((item, idx) => {
              const isActive = dateIndex === idx;
              return (
                <button
                  key={idx}
                  id={`date-btn-${idx}`}
                  onClick={() => {
                    setDateIndex(idx);
                    setStatusTab('all');
                  }}
                  className={`flex-1 min-w-[84px] py-3.5 px-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary active-date-glow scale-105'
                      : 'bg-white/60 dark:bg-card/50 text-muted-foreground border-border/45 dark:border-white/[0.06] hover:bg-white/90 dark:hover:bg-card/70 hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  {/* Etiqueta Día/Mes en español, ej: vie/jun */}
                  <span className="text-[9px] font-condensed font-black tracking-widest uppercase">{item.label}</span>
                  <span className="text-xl font-display font-black leading-none">{item.dayNum}</span>
                  
                  {/* Conteo de Partidos Coloreados */}
                  <span className={`text-[8px] font-condensed font-black px-1.5 py-0.5 rounded-full mt-1.5 transition-colors ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : Number(item.count) > 0 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {item.count} {Number(item.count) === 1 ? 'partido' : 'partidos'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Flecha Derecha */}
          <button
            disabled={dateIndex === sortedDates.length - 1}
            onClick={() => {
              setDateIndex(prev => Math.min(sortedDates.length - 1, prev + 1));
              setStatusTab('all');
            }}
            className="p-3.5 rounded-xl border border-border/40 dark:border-white/[0.06] bg-white/90 dark:bg-card/85 text-muted-foreground hover:text-foreground disabled:opacity-20 hover:border-primary/40 transition-all duration-300 cursor-pointer shrink-0"
          >
            ▶
          </button>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. MATCH LIST (Dynamic broadcast nested layout)                           */}
      {/* ========================================================================= */}
      <main className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 min-h-[300px] border border-border/40 dark:border-white/[0.06] bg-white/40 dark:bg-card/75 backdrop-blur-md rounded-2xl">
            <Spinner size="xl" />
            <p className="mt-4 text-xs font-condensed font-bold text-muted-foreground tracking-[0.2em] uppercase animate-pulse">
              Recuperando transmisiones de partidos...
            </p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="glass-hud-panel border border-primary/25 rounded-3xl p-20 flex flex-col items-center text-center max-w-2xl mx-auto gap-6 scanlines">
            <div className="absolute inset-0 hud-noise pointer-events-none z-10 opacity-30"></div>
            <span className="text-4xl animate-bounce">⚽</span>
            <div className="space-y-3">
              <h2 className="text-2xl font-display font-black tracking-wide text-foreground uppercase">Sin Partidos Programados</h2>
              <p className="text-xs text-muted-foreground max-w-md">
                No se registran duelos o transmisiones oficiales para la fecha elegida ({activeDate || 'Hoy'}) bajo los filtros aplicados.
              </p>
            </div>
            <button
              onClick={resetFilters}
              className="px-6 py-3 text-xs font-condensed font-black tracking-widest uppercase bg-primary/15 text-primary border border-primary/30 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
            >
              🔄 Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {nestedGrouped.map(orgGroup => (
              <div key={orgGroup.id} className="space-y-8 animate-fade-in relative z-10">
                
                {/* Organization Header */}
                <div className="flex items-center justify-between border-b border-border/20 dark:border-white/[0.08] pb-4">
                  <h2 className="text-2xl md:text-3xl font-display font-black text-foreground uppercase tracking-wider flex items-center gap-3">
                    {orgGroup.logo ? (
                      <img 
                        src={getImageUrl(orgGroup.logo)} 
                        alt={orgGroup.nombre} 
                        className="w-8 h-8 rounded-lg object-cover border border-border/40 bg-card"
                      />
                    ) : (
                      <span>🛡️</span>
                    )}
                    {orgGroup.nombre}
                  </h2>
                  <span className="text-[10px] font-condensed tracking-widest font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg uppercase">
                    {orgGroup.competencias.reduce((sum, c) => sum + c.partidos.length, 0)} ENCUENTROS
                  </span>
                </div>

                {/* Competitions */}
                <div className="space-y-8 pl-1 md:pl-4">
                  {orgGroup.competencias.map(compGroup => (
                    <div key={compGroup.id} className="space-y-4">
                      
                      {/* Competition Title */}
                      <div className="flex items-center gap-3 pl-3 border-l-2 border-primary">
                        <span className="text-xs font-condensed font-black text-muted-foreground tracking-widest uppercase">
                          🏆 {compGroup.nombre}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-border/40" />
                        <span className="text-[9px] font-mono text-primary font-bold">
                          FECHA: {activeDate}
                        </span>
                      </div>

                      {/* Matches Rows Grid */}
                      <div className="space-y-3.5">
                        {compGroup.partidos.map(p => {
                          const status = classifyMatch(p, activeDate);
                          const isFinished = status === 'finished';
                          const isLive = status === 'live';
                          const teamL = p.local?.nombre || 'Por definir';
                          const teamV = p.visitante?.nombre || 'Por definir';
                          const score = isFinished || isLive ? `${p.goles_local} – ${p.goles_visitante}` : 'VS';
                          const localWinner = isFinished && p.goles_local > p.goles_visitante;
                          const visitaWinner = isFinished && p.goles_visitante > p.goles_local;

                          return (
                            <React.Fragment key={p.id}>
                              {/* VERSION ESCRITORIO (md y mayores) */}
                              <div
                                className={`hidden md:flex relative overflow-hidden rounded-2xl glass-hud-panel p-5 justify-between items-center gap-10 border transition-all duration-300 scanlines select-none ${
                                  isLive ? 'live-match-flash border-primary/50 bg-primary/5' : 'border-border/45 dark:border-white/[0.06]'
                                }`}
                              >
                                <div className="absolute inset-0 hud-noise pointer-events-none opacity-40"></div>

                                {/* LEFT: Hora + Estado */}
                                <div className="flex flex-col items-start justify-between shrink-0 gap-2 border-r border-border/30 dark:border-white/[0.08] pr-8">
                                  <div className="text-left">
                                    <span className="text-[9px] font-condensed text-muted-foreground font-black tracking-widest block uppercase">HORA DE TRANSMISIÓN</span>
                                    <span className="text-xl font-display font-black text-foreground tracking-widest leading-none mt-1 block">
                                      {p.hora || 'Por definir'}
                                    </span>
                                  </div>
                                  <div className="mt-1">
                                    {isLive ? (
                                      <span className="inline-flex items-center gap-1.5 text-[9px] font-condensed font-black tracking-widest text-primary bg-primary/10 border border-primary/35 px-3 py-1 rounded">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" /> EN VIVO
                                      </span>
                                    ) : isFinished ? (
                                      <span className="inline-flex items-center gap-1.5 text-[9px] font-condensed font-black tracking-widest text-muted-foreground bg-muted border border-border/50 px-3 py-1 rounded">
                                        FINALIZADO
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 text-[9px] font-condensed font-black tracking-widest text-primary/95 bg-primary/5 border border-primary/20 px-3 py-1 rounded">
                                        PROGRAMADO
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* CENTER: Team A - Score - Team B */}
                                <div className="flex-1 flex items-center justify-between gap-10 min-w-0">
                                  {/* Local Team */}
                                  <div className="flex-1 flex items-center justify-end gap-3 min-w-0 text-right">
                                    <span className={`text-xs md:text-sm font-condensed font-black uppercase tracking-wider truncate ${localWinner ? 'text-primary' : 'text-foreground'}`}>
                                      {teamL}
                                    </span>
                                    {p.local?.logo ? (
                                      <img 
                                        src={getImageUrl(p.local.logo)} 
                                        alt={teamL} 
                                        className="w-9 h-9 rounded-xl object-cover border bg-background shadow-inner shrink-0" 
                                      />
                                    ) : (
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-background font-display font-black text-sm uppercase ${
                                        localWinner ? 'border-primary text-primary shadow-[0_0_10px_rgba(232,0,29,0.15)]' : 'border-border/50 text-muted-foreground'
                                      }`}>
                                        {p.local?.abreviatura || teamL.charAt(0)}
                                      </div>
                                    )}
                                  </div>

                                  {/* Score in Center */}
                                  <div className="shrink-0 min-w-[84px] text-center">
                                    <span className="text-2xl md:text-3xl font-display font-black tracking-widest leading-none block">
                                      <span className={localWinner ? 'text-primary' : 'text-foreground'}>{isFinished || isLive ? p.goles_local : ''}</span>
                                      <span className="text-muted-foreground/30 mx-2">{isFinished || isLive ? '–' : 'VS'}</span>
                                      <span className={visitaWinner ? 'text-primary' : 'text-foreground'}>{isFinished || isLive ? p.goles_visitante : ''}</span>
                                    </span>
                                    {p.jornada && (
                                      <span className="text-[8px] font-condensed font-bold text-muted-foreground uppercase tracking-widest mt-1 block">
                                        {p.jornada}
                                      </span>
                                    )}
                                  </div>

                                  {/* Visitante Team */}
                                  <div className="flex-1 flex items-center justify-start gap-3 min-w-0 text-left">
                                    {p.visitante?.logo ? (
                                      <img 
                                        src={getImageUrl(p.visitante.logo)} 
                                        alt={teamV} 
                                        className="w-9 h-9 rounded-xl object-cover border bg-background shadow-inner shrink-0" 
                                      />
                                    ) : (
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-background font-display font-black text-sm uppercase ${
                                        visitaWinner ? 'border-primary text-primary shadow-[0_0_10px_rgba(232,0,29,0.15)]' : 'border-border/50 text-muted-foreground'
                                      }`}>
                                        {p.visitante?.abreviatura || teamV.charAt(0)}
                                      </div>
                                    )}
                                    <span className={`text-xs md:text-sm font-condensed font-black uppercase tracking-wider truncate ${visitaWinner ? 'text-primary' : 'text-foreground'}`}>
                                      {teamV}
                                    </span>
                                  </div>
                                </div>

                                {/* RIGHT: Watch / Detalle Button */}
                                <div className="shrink-0 border-l border-border/30 dark:border-white/[0.08] pl-8 flex justify-center">
                                  <button
                                    onClick={() => navigate(`/partidos/${p.id}`)}
                                    className="w-32 py-3 px-6 text-[10px] font-condensed font-black tracking-widest uppercase bg-primary/15 text-primary border border-primary/35 rounded-xl hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_15px_rgba(232,0,29,0.45)] transition-all duration-300 cursor-pointer font-black"
                                  >
                                    {isLive ? '🔴 VER DUELO' : isFinished ? 'ANALIZAR' : 'VER DETALLES'}
                                  </button>
                                </div>
                              </div>

                              {/* VERSION MÓVIL (Menor que md) */}
                              <div
                                className={`flex md:hidden relative overflow-hidden rounded-2xl glass-hud-panel p-3.5 items-center justify-between gap-3 border transition-all duration-300 scanlines select-none ${
                                  isLive ? 'live-match-flash border-primary/50 bg-primary/5' : 'border-border/45 dark:border-white/[0.06]'
                                }`}
                              >
                                <div className="absolute inset-0 hud-noise pointer-events-none opacity-40"></div>

                                {/* LEFT: Hora + Estado */}
                                <div className="flex flex-col items-start gap-1 shrink-0 min-w-[65px] border-r border-border/20 dark:border-white/[0.05] pr-2.5">
                                  <span className="text-[11px] font-mono font-bold text-foreground leading-none">
                                    {p.hora || '00:00'}
                                  </span>
                                  <div>
                                    {isLive ? (
                                      <span className="inline-flex items-center gap-0.5 text-[7.5px] font-condensed font-black tracking-wider text-primary bg-primary/10 border border-primary/20 px-1 py-0.5 rounded uppercase leading-none">
                                        VIVO
                                      </span>
                                    ) : isFinished ? (
                                      <span className="inline-flex items-center gap-0.5 text-[7.5px] font-condensed font-black tracking-wider text-muted-foreground bg-muted border border-border/30 px-1 py-0.5 rounded uppercase leading-none">
                                        FIN
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-0.5 text-[7.5px] font-condensed font-black tracking-wider text-primary/80 bg-primary/5 border border-primary/15 px-1 py-0.5 rounded uppercase leading-none">
                                        PROG
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* CENTER: Team A - Score - Team B */}
                                <div className="flex-1 flex items-center justify-center gap-1.5 min-w-0">
                                  
                                  {/* Local */}
                                  <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0 text-right">
                                    <span className={`text-[10px] font-condensed font-black uppercase tracking-wider truncate ${localWinner ? 'text-primary' : 'text-foreground'}`}>
                                      {p.local?.abreviatura || (teamL.length > 5 ? teamL.substring(0, 3).toUpperCase() : teamL)}
                                    </span>
                                    {p.local?.logo ? (
                                      <img 
                                        src={getImageUrl(p.local.logo)} 
                                        alt={teamL} 
                                        className="w-7 h-7 rounded-lg object-cover border bg-background shrink-0" 
                                      />
                                    ) : (
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border bg-background font-display font-black text-[10px] uppercase ${
                                        localWinner ? 'border-primary text-primary' : 'border-border/50 text-muted-foreground'
                                      }`}>
                                        {p.local?.abreviatura?.substring(0, 2) || teamL.charAt(0)}
                                      </div>
                                    )}
                                  </div>

                                  {/* Marcador */}
                                  <div className="shrink-0 bg-background/60 dark:bg-black/40 border border-border/30 dark:border-white/[0.06] rounded-lg px-2 py-0.5 text-center min-w-[48px]">
                                    <span className="text-[11px] font-display font-black tracking-wider leading-none block">
                                      <span className={localWinner ? 'text-primary' : 'text-foreground'}>{isFinished || isLive ? p.goles_local : ''}</span>
                                      <span className="text-muted-foreground/30 mx-0.5">{isFinished || isLive ? '–' : 'VS'}</span>
                                      <span className={visitaWinner ? 'text-primary' : 'text-foreground'}>{isFinished || isLive ? p.goles_visitante : ''}</span>
                                    </span>
                                  </div>

                                  {/* Visitante */}
                                  <div className="flex-1 flex items-center justify-start gap-1.5 min-w-0 text-left">
                                    {p.visitante?.logo ? (
                                      <img 
                                        src={getImageUrl(p.visitante.logo)} 
                                        alt={teamV} 
                                        className="w-7 h-7 rounded-lg object-cover border bg-background shrink-0" 
                                      />
                                    ) : (
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border bg-background font-display font-black text-[10px] uppercase ${
                                        visitaWinner ? 'border-primary text-primary' : 'border-border/50 text-muted-foreground'
                                      }`}>
                                        {p.visitante?.abreviatura?.substring(0, 2) || teamV.charAt(0)}
                                      </div>
                                    )}
                                    <span className={`text-[10px] font-condensed font-black uppercase tracking-wider truncate ${visitaWinner ? 'text-primary' : 'text-foreground'}`}>
                                      {p.visitante?.abreviatura || (teamV.length > 5 ? teamV.substring(0, 3).toUpperCase() : teamV)}
                                    </span>
                                  </div>

                                </div>

                                {/* RIGHT: Ficha / Analizar Button */}
                                <div className="shrink-0 border-l border-border/20 dark:border-white/[0.05] pl-2.5 flex justify-end min-w-[72px]">
                                  <button
                                    onClick={() => navigate(`/partidos/${p.id}`)}
                                    className="w-full py-1.5 text-[9px] font-condensed font-black tracking-wider uppercase bg-primary/10 text-primary border border-primary/35 rounded-lg hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_10px_rgba(232,0,29,0.3)] transition-all duration-300 cursor-pointer text-center font-black"
                                  >
                                    {isFinished ? 'Analizar' : 'Ver Ficha'}
                                  </button>
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Paginador */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12 pt-6 border-t border-border/20 dark:border-white/[0.06]">
            <button
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage(prev => Math.max(1, prev - 1));
                window.scrollTo({ top: 350, behavior: 'smooth' });
              }}
              className="px-4 py-2 text-xs font-condensed font-black tracking-widest uppercase bg-white/60 dark:bg-card/50 hover:bg-primary/20 text-muted-foreground hover:text-primary disabled:opacity-20 border border-border/30 dark:border-white/[0.06] rounded-xl transition-all cursor-pointer shrink-0"
            >
              ◀ Anterior
            </button>

            {/* Desktop Horarios List */}
            <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto max-w-[500px] py-1 px-2 custom-scrollbar">
              {uniqueHorarios.map((horaName, idx) => {
                const pageNum = idx + 1;
                const isActive = currentPage === pageNum;
                return (
                  <button
                    key={horaName}
                    onClick={() => {
                      setCurrentPage(pageNum);
                      window.scrollTo({ top: 350, behavior: 'smooth' });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-condensed font-black uppercase tracking-wider transition-all border cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-primary text-white border-primary active-date-glow'
                        : 'bg-white/60 dark:bg-card/50 hover:bg-primary/10 text-muted-foreground border-border/30 dark:border-white/[0.06] hover:border-primary/30 hover:text-foreground'
                    }`}
                  >
                    ⏰ {horaName}
                  </button>
                );
              })}
            </div>

            {/* Mobile Horario Label */}
            <span className="flex sm:hidden text-xs font-condensed font-black text-primary uppercase tracking-widest px-4 truncate max-w-[160px]">
              ⏰ {activeHorario}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage(prev => Math.min(totalPages, prev + 1));
                window.scrollTo({ top: 350, behavior: 'smooth' });
              }}
              className="px-4 py-2 text-xs font-condensed font-black tracking-widest uppercase bg-white/60 dark:bg-card/50 hover:bg-primary/20 text-muted-foreground hover:text-primary disabled:opacity-20 border border-border/30 dark:border-white/[0.06] rounded-xl transition-all cursor-pointer shrink-0"
            >
              Siguiente ▶
            </button>
          </div>
        )}
      </main>

    </div>
  );
}
