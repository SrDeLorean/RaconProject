import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '@/api/axios';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { useDebounce } from '@/hooks/useDebounce';
import { CardTilt } from '@/components/ui/PlayerCard';

import gkTemplate from '@/assets/images/cartas/gk.png';
import defTemplate from '@/assets/images/cartas/def.png';
import midTemplate from '@/assets/images/cartas/mid.png';
import delTemplate from '@/assets/images/cartas/del.png';

const rojoTemplate = '/images/carta-usuario/usuario-rojo.png';

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
    'DL': 'DC'
  };
  return map[p] || p;
};


export default function Jugadores() {
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJugadores, setTotalJugadores] = useState(0);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
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
            search: debouncedSearch || undefined,
            posicion: posicion !== 'todas' ? posicion : undefined
          }
        });
        const resData = response.data;
        setJugadores(resData.data || resData || []);
        setTotalPages(resData.meta?.last_page || resData.last_page || 1);
        setTotalJugadores(resData.meta?.total || resData.total || 0);
      } catch (error) {
        console.error("Error al obtener lista de jugadores:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJugadores();
  }, [currentPage, debouncedSearch, posicion]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);


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
          glow: 'group-hover:shadow-[0_0_22px_rgba(168,85,247,0.5)]',
          avatarBorder: 'border-purple-500/40 group-hover:border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.15)]',
          tagBg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
          accentText: 'text-purple-400',
          ratingColor: 'text-purple-400'
        };
      case 'DEF':
        return {
          glow: 'group-hover:shadow-[0_0_22px_rgba(59,130,246,0.5)]',
          avatarBorder: 'border-blue-500/40 group-hover:border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.15)]',
          tagBg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          accentText: 'text-blue-400',
          ratingColor: 'text-blue-400'
        };
      case 'MED':
        return {
          glow: 'group-hover:shadow-[0_0_22px_rgba(16,185,129,0.5)]',
          avatarBorder: 'border-emerald-500/40 group-hover:border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
          tagBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          accentText: 'text-emerald-400',
          ratingColor: 'text-emerald-400'
        };
      case 'DEL':
        return {
          glow: 'group-hover:shadow-[0_0_22px_rgba(249,115,22,0.5)]',
          avatarBorder: 'border-orange-500/40 group-hover:border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.15)]',
          tagBg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
          accentText: 'text-orange-400',
          ratingColor: 'text-orange-400'
        };
      default:
        return {
          glow: 'group-hover:shadow-[0_0_22px_rgba(239,68,68,0.5)]',
          avatarBorder: 'border-red-500/40 group-hover:border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.15)]',
          tagBg: 'bg-red-500/10 border-red-500/30 text-red-400',
          accentText: 'text-red-400',
          ratingColor: 'text-red-400'
        };
    }
  };

  const getCardTemplate = (pos) => {
    const p = (pos || '').toUpperCase();
    if (['POR', 'GK', 'PO', 'ARQ'].includes(p)) return midTemplate;
    if (['DFC', 'DFI', 'DFD', 'CB', 'LB', 'RB', 'DF', 'DEF'].includes(p)) return defTemplate;
    if (['MC', 'MCO', 'MCD', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MED'].includes(p)) return gkTemplate;
    if (['DEL', 'DC', 'EI', 'ED', 'ST', 'LW', 'RW', 'CF', 'DL'].includes(p)) return delTemplate;
    return rojoTemplate;
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
              {totalJugadores || 72}
            </div>

            <Badge 
              variant="primary" 
              className="animate-fade-in-up px-5 py-2 text-[10px] font-condensed tracking-[0.2em] text-primary border border-primary/30 bg-primary/10 rounded-full shadow-[0_0_20px_hsla(var(--primary),0.15)] uppercase animate-pulse shrink-0 z-10"
            >
              🔥 Salón de Competidores
            </Badge>

            <h1 className="animate-fade-in-up text-4xl sm:text-8xl md:text-9xl font-display font-black text-foreground uppercase tracking-[0.01em] leading-[0.82] drop-shadow-2xl z-10 mt-2 select-none" style={{ animationDelay: '0.1s' }}>
              DIRECTORIO DE <br />
              <span className="text-primary tracking-tight font-black shimmer-text">
                JUGADORES.
              </span>
            </h1>

            <p className="animate-fade-in-up text-xs md:text-sm text-muted-foreground font-sans max-w-xl leading-relaxed tracking-wide font-light z-10 mt-2" style={{ animationDelay: '0.2s' }}>
              Conoce a todos los competidores, agentes libres y estrellas de Clubes Pro inscritas en las ligas de Torneos Pro FC.
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
                  <span className="text-3xl font-display font-black text-foreground">{totalJugadores}</span>
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
        <div className="filter-panel max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
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
                const pos = (j.posicion || '').toUpperCase();
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                      {group.items.map((jugador, index) => {
                        const uniqueClubsMap = {};
                        if (jugador.equipos && jugador.equipos.length > 0) {
                          jugador.equipos.forEach(eq => {
                            if (!uniqueClubsMap[eq.id]) {
                              uniqueClubsMap[eq.id] = {
                                id: eq.id,
                                nombre: eq.nombre,
                                logo: eq.logo,
                                competencias: []
                              };
                            }
                            const orgName = eq.organizacion_nombre || eq.pivot?.organizacion_nombre || 'PRIMERA DIVISIÓN';
                            if (!uniqueClubsMap[eq.id].competencias.includes(orgName)) {
                              uniqueClubsMap[eq.id].competencias.push(orgName);
                            }
                          });
                        }
                        const uniqueClubs = Object.values(uniqueClubsMap);
                        
                        // Rating OVR calculation
                        const avgVal = Number(jugador.promedio_valoracion || 0);
                        const ovrRating = avgVal > 0 ? Math.round(avgVal * 10) : 75;

                        // Stats values
                        const pj = jugador.partidos_jugados || 0;
                        const goles = jugador.total_goles || 0;
                        const asist = jugador.total_asistencias || 0;
                        const mvp = jugador.total_mvp || 0;
                        const posStyles = getPosStyles(key);

                        return (
                          <Link 
                            to={`/jugadores/${jugador.id}`}
                            key={jugador.id} 
                            className="group block cursor-pointer max-w-[240px] sm:max-w-[260px] md:max-w-[280px] mx-auto w-full animate-fade-in-up"
                            style={{ animationDelay: `${index * 0.06}s` }}
                          >
                            <CardTilt 
                              className={`w-full aspect-[745/1024] relative select-none pointer-events-auto transition-all duration-500 rounded-[16px] overflow-hidden ${posStyles.glow} group-hover:-translate-y-2 group-hover:scale-[1.03]`}
                              style={{ containerType: 'inline-size' }}
                            >
                              {/* Background Card Template Image */}
                              <img 
                                src={getCardTemplate(jugador.posicion)} 
                                alt="Card Template" 
                                className="absolute inset-0 w-full h-full object-fill z-0 select-none pointer-events-none" 
                              />

                              {/* Overlay content */}
                              <div className="w-full h-full absolute inset-0 z-20 pointer-events-none select-none">
                                
                                {/* Top-Left: Club Logo & Name Info */}
                                <div className="absolute top-[3%] left-[8%] right-[8%] h-[9%] flex items-center pointer-events-none z-20">
                                  {uniqueClubs.length > 0 ? (
                                    <div className="flex items-center gap-[2.5cqi] w-full select-none pointer-events-none">
                                      {uniqueClubs.map((club) => (
                                        <div key={club.id} className="flex items-center gap-[1.5cqi] shrink-0 min-w-0">
                                          <div className="w-[10cqi] h-[10cqi] rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.6)] overflow-hidden">
                                            {club.logo ? (
                                              <img 
                                                src={club.logo.startsWith('http') ? club.logo : (typeof window.mediaUrl === 'function' ? window.mediaUrl(club.logo) : window.mediaUrl(club.logo))} 
                                                alt={club.nombre} 
                                                className="w-full h-full object-cover rounded-full"
                                                onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<span class="text-[4cqi] font-black text-white">${club.nombre?.charAt(0)}</span>`; }}
                                              />
                                            ) : (
                                              <span className="text-[4cqi] font-black text-white">{club.nombre?.charAt(0)}</span>
                                            )}
                                          </div>
                                          <div className="flex flex-col min-w-0 justify-center text-left">
                                            <span className="text-white text-[3.0cqi] font-display font-black uppercase tracking-wider leading-none truncate max-w-[45cqi]">
                                              {club.nombre}
                                            </span>
                                            <span className={`text-[2.0cqi] font-bold font-mono tracking-widest uppercase leading-none mt-[0.4cqi] truncate max-w-[45cqi] ${posStyles.accentText}`}>
                                              {club.competencias.join(' / ')}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-[2.5cqi] w-full select-none pointer-events-none">
                                      <div className="w-[10cqi] h-[10cqi] rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.6)]">
                                        <span className="text-[4cqi]">🤝</span>
                                      </div>
                                      <div className="flex flex-col min-w-0 justify-center text-left">
                                        <span className="text-white text-[3.0cqi] font-display font-black uppercase tracking-wider leading-none">
                                          LIBRE
                                        </span>
                                        <span className="text-white/40 text-[2.0cqi] font-bold font-mono tracking-widest uppercase leading-none mt-[0.4cqi]">
                                          SIN VINCULACIÓN
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Center: Player photo cutout inside central frame */}
                                <div className="absolute top-[13.5%] left-[21.5%] w-[57%] h-[47%] overflow-hidden z-10 flex items-end justify-center">
                                  {jugador.foto ? (
                                    <img 
                                      src={jugador.foto.startsWith('http') ? jugador.foto : (typeof window.mediaUrl === 'function' ? window.mediaUrl(jugador.foto) : window.mediaUrl(jugador.foto))} 
                                      alt={jugador.gamertag} 
                                      className="max-h-[100%] max-w-[110%] object-cover object-top drop-shadow-[0_6px_8px_rgba(0,0,0,0.7)] transition-transform duration-500 group-hover:scale-105"
                                      style={{
                                        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)',
                                        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)'
                                      }}
                                      onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<div class="opacity-[0.06] select-none text-[22cqi] font-black uppercase text-foreground leading-none">${(jugador.gamertag || jugador.name || '?').charAt(0)}</div>`; }}
                                    />
                                  ) : (
                                    <div className="opacity-[0.06] select-none text-[22cqi] font-black uppercase text-foreground leading-none">
                                      {(jugador.gamertag || jugador.name || '?').charAt(0)}
                                    </div>
                                  )}
                                </div>

                                {/* Five Stars & Valuation Text */}
                                <div className="absolute top-[61.5%] left-0 right-0 flex justify-center gap-[0.4cqi] z-20">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <svg 
                                      key={s} 
                                      viewBox="0 0 24 24" 
                                      className={`w-[4.2cqi] h-[4.2cqi] fill-current ${posStyles.ratingColor} drop-shadow-[0_0_4px_currentColor]`}
                                    >
                                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                  ))}
                                </div>
                                <div className="absolute top-[67.5%] left-[36%] right-[5%] z-20 text-left">
                                  <span className="text-white/50 text-[3.2cqi] font-black tracking-widest uppercase font-mono leading-none">
                                    VALORACIÓN GENERAL
                                  </span>
                                </div>

                                {/* Circular OVR Badge */}
                                <div className="absolute bottom-[6.5%] left-[3%] w-[28cqi] h-[28cqi] z-20 flex flex-col items-center justify-center pb-[5.5cqi] transform -translate-y-[20px]">
                                  <span className="text-white/50 text-[3.2cqi] font-mono font-black tracking-wider uppercase leading-none mb-[0.2cqi]">OVR</span>
                                  <strong className="text-white text-[15.5cqi] font-display font-black leading-none drop-shadow-[0_3px_5px_rgba(0,0,0,0.9)]">
                                    {ovrRating}
                                  </strong>
                                </div>

                                {/* Name, Real Name, and Position Banner (Bottom-Right) + Stats inside black trapezoid */}
                                <div className="absolute bottom-[5.5%] right-[2%] w-[64cqi] h-[28cqi] z-20 flex flex-col justify-center text-left pl-[4cqi] pr-[3cqi] select-none pointer-events-none">
                                  <div>
                                    <h3 className="text-white text-[6.8cqi] font-display font-black tracking-widest uppercase truncate max-w-[95%] leading-none drop-shadow-md">
                                      {jugador.gamertag || 'SIN GAMERTAG'}
                                    </h3>
                                    <div className="flex items-center justify-between mt-[1.5cqi]">
                                      <span className="text-[3.5cqi] font-bold font-sans text-white/60 uppercase truncate max-w-[70%] leading-none">
                                        {jugador.name}
                                      </span>
                                      <span className={`text-[4.5cqi] font-black font-mono tracking-widest uppercase leading-none mr-[4cqi] ${posStyles.accentText}`}>
                                        {translatePosition(jugador.posicion)}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="w-[95%] h-px bg-white/15 my-[2.0cqi]" />

                                  {/* Stats row inside the trapezoid */}
                                  <div className="flex items-center justify-between w-[100%] pr-[2cqi] ml-[-6cqi] transform -translate-y-[2px] pointer-events-none select-none">
                                    {/* PJ */}
                                    <div className="flex flex-col items-center">
                                      <span className="text-white/50 text-[3.0cqi] font-mono uppercase font-black leading-none">PJ</span>
                                      <span className="text-white text-[5.0cqi] font-mono font-black mt-[0.8cqi] leading-none drop-shadow-sm">{pj}</span>
                                    </div>
                                    
                                    {/* GOLES */}
                                    <div className="flex flex-col items-center">
                                      <span className="text-white/50 text-[3.0cqi] font-mono uppercase font-black leading-none">GOL</span>
                                      <span className="text-white text-[5.0cqi] font-mono font-black mt-[0.8cqi] leading-none drop-shadow-sm">{goles}</span>
                                    </div>

                                    {/* ASIST */}
                                    <div className="flex flex-col items-center">
                                      <span className="text-white/50 text-[3.0cqi] font-mono uppercase font-black leading-none">AST</span>
                                      <span className="text-white text-[5.0cqi] font-mono font-black mt-[0.8cqi] leading-none drop-shadow-sm">{asist}</span>
                                    </div>

                                    {/* MVP */}
                                    <div className="flex flex-col items-center">
                                      <span className="text-yellow-500/80 text-[3.0cqi] font-mono uppercase font-black leading-none">MVP</span>
                                      <span className="text-yellow-400 text-[5.0cqi] font-mono font-black mt-[0.8cqi] leading-none drop-shadow-sm">{mvp}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardTilt>
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
              <div className="flex justify-center items-center gap-2 sm:gap-3 pt-8 animate-fade-in-up flex-wrap">
                {/* Botón Anterior */}
                <button 
                  disabled={currentPage === 1 || loading}
                  onClick={() => {
                    setCurrentPage(prev => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }}
                  className="pagination-btn flex items-center gap-1.5 px-3 py-2 text-xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Anterior</span>
                </button>
                
                {/* Selector Numérico (1, 2, 3, 4 ... totalPages) */}
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  {pageNumbers[0] > 1 && (
                    <>
                      <button 
                        onClick={() => {
                          setCurrentPage(1);
                          window.scrollTo({ top: 350, behavior: 'smooth' });
                        }} 
                        className="px-3.5 py-2 text-xs font-bold uppercase rounded-xl border border-border/40 bg-card/30 text-muted-foreground hover:border-border hover:text-foreground transition-all duration-300 cursor-pointer"
                      >
                        1
                      </button>
                      {pageNumbers[0] > 2 && <span className="text-muted-foreground text-xs px-1 select-none font-mono">···</span>}
                    </>
                  )}

                  {pageNumbers.map(num => (
                    <button
                      key={num}
                      onClick={() => {
                        setCurrentPage(num);
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                      }}
                      className={`px-3.5 py-2 text-xs font-bold uppercase rounded-xl border transition-all duration-300 cursor-pointer ${
                        num === currentPage
                          ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_15px_hsla(var(--primary),0.2)] font-black scale-105'
                          : 'bg-card/30 border-border/40 text-muted-foreground hover:border-border hover:text-foreground'
                      }`}
                    >
                      {num}
                    </button>
                  ))}

                  {pageNumbers[pageNumbers.length - 1] < totalPages && (
                    <>
                      {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="text-muted-foreground text-xs px-1 select-none font-mono">···</span>}
                      <button 
                        onClick={() => {
                          setCurrentPage(totalPages);
                          window.scrollTo({ top: 350, behavior: 'smooth' });
                        }} 
                        className="px-3.5 py-2 text-xs font-bold uppercase rounded-xl border border-border/40 bg-card/30 text-muted-foreground hover:border-border hover:text-foreground transition-all duration-300 cursor-pointer"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                {/* Botón Siguiente */}
                <button 
                  disabled={currentPage === totalPages || loading}
                  onClick={() => {
                    setCurrentPage(prev => Math.min(prev + 1, totalPages));
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }}
                  className="pagination-btn flex items-center gap-1.5 px-3 py-2 text-xs"
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
              <h2 className="text-xl font-display font-black tracking-wide text-foreground uppercase">Sin Competidores</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Actualmente no figuran jugadores ni competidores registrados en el directorio de la liga.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
