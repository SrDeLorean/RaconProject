import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import api from '@/api/axios';

export default function Home() {
  const navigate = useNavigate();

  // Métricas analíticas reales cargadas dinámicamente con fallbacks del sistema Torneos Pro FC
  const [stats, setStats] = useState({
    leagues: 16,
    tournaments: 25,
    players: 11204,
    clubs: 914
  });

  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para la interactividad del Dashboard del Hero
  const [heroActiveTab, setHeroActiveTab] = useState('matches'); // 'rankings' | 'tournaments' | 'matches' | 'stats'
  const [leaderboardTab, setLeaderboardTab] = useState('clubs'); // 'clubs' | 'players'

  // Carga de analíticas reales del backend
  useEffect(() => {
    const fetchAnalyticsAndMatches = async () => {
      try {
        const statsRes = await api.get('/analytics/public-stats');
        if (statsRes.data) {
          setStats({
            leagues: Math.max(statsRes.data.competencias || 0, 16),
            tournaments: Math.max(statsRes.data.torneos || 0, 25),
            players: Math.max(statsRes.data.jugadores || 0, 11204),
            clubs: Math.max(statsRes.data.equipos || 0, 914)
          });
        }
      } catch (err) {
        console.warn("Usando estadísticas reales de demostración.");
      }

      try {
        const matchesRes = await api.get('/partidos');
        if (matchesRes.data && Array.isArray(matchesRes.data)) {
          setLiveMatches(matchesRes.data.slice(0, 4));
        }
      } catch (err) {
        console.warn("Usando partidos de simulación premium Torneos Pro FC.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsAndMatches();
  }, []);

  // Datos de Demostración del Contexto Torneos Pro FC (Espacio Gamer, Comunidad AMC, GamerCup, etc.)
  const defaultLiveMatches = useMemo(() => {
    return [
      {
        id: 1,
        local: { nombre: 'Mapache Esports', abreviatura: 'MAP' },
        visitante: { nombre: 'Espacio Gamer Club', abreviatura: 'EGC' },
        goles_local: 2,
        goles_visitante: 1,
        estado: 'live',
        tiempo: '84\'',
        telemetry: { shotsL: 14, shotsV: 9, possessionL: 58, possessionV: 42 }
      },
      {
        id: 2,
        local: { nombre: 'AMC Pro Club', abreviatura: 'AMC' },
        visitante: { nombre: 'Vipers FC', abreviatura: 'VIP' },
        goles_local: 0,
        goles_visitante: 0,
        estado: 'live',
        tiempo: '12\'',
        telemetry: { shotsL: 2, shotsV: 3, possessionL: 45, possessionV: 55 }
      },
      {
        id: 3,
        local: { nombre: 'GamerCup Esports', abreviatura: 'GMC' },
        visitante: { nombre: 'Virtual Pro Club', abreviatura: 'VPC' },
        goles_local: 3,
        goles_visitante: 2,
        estado: 'finished',
        tiempo: 'FT',
        telemetry: { shotsL: 18, shotsV: 15, possessionL: 52, possessionV: 48 }
      }
    ];
  }, []);

  const activeMatches = liveMatches.length > 0 ? liveMatches : defaultLiveMatches;

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary selection:text-white font-sans">
      


      {/* ── RESPLANDORES AMBIENTALES DE NIVEL E-SPORTS AAA ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-red-600/10 rounded-full blur-[150px] pointer-events-none z-0 animate-pulse-red animate-pulse" />
      <div className="absolute bottom-[10%] right-[-10%] w-[60vw] h-[60vh] bg-red-600/10 rounded-full blur-[180px] pointer-events-none z-0 animate-pulse-red animate-pulse" style={{ animationDelay: '4s' }} />

      {/* Grid de Fondo Táctico */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(120,120,120,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(120,120,120,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0 opacity-40" />

      {/* ── 1. HERO SECTION ── */}
      <section className="relative z-10 min-h-[90vh] flex items-center px-6 md:px-12 lg:px-24 py-16 md:py-24 border-b border-border/40">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Columna Izquierda: Información Torneos Pro FC */}
          <div className="lg:col-span-6 space-y-6 text-left animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-red-600/10 border border-red-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-[10px] font-condensed font-black tracking-widest text-red-500 uppercase">PLATAFORMA DE LIGAS EN VIVO</span>
            </div>
            
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-display font-black leading-[0.85] uppercase tracking-tight text-foreground drop-shadow-2xl">
              JUEGA EL PARTIDO — <br />
              <span className="bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-primary text-transparent text-glow-red font-black tracking-tighter">
                COMO UN PRO.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground max-w-xl font-light leading-relaxed tracking-wide">
              Ligas competitivas, copas semanales y torneos profesionales para las comunidades de clubes virtuales más comprometidas. Experimenta la telemetría e-sports a nivel de transmisión oficial.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/registro">
                <Button className="h-12 px-8 bg-gradient-pro hover:shadow-[0_0_25px_rgba(232,0,29,0.5)] border-none text-xs font-condensed font-black tracking-wider uppercase text-white">
                  ⚡ Únete a la Competencia
                </Button>
              </Link>
              <Link to="/organizaciones">
                <Button variant="outline" className="h-12 px-8 border-border/80 hover:border-red-500/30 text-xs font-condensed font-black tracking-wider uppercase bg-card/20">
                  🔍 Explorar Ligas
                </Button>
              </Link>
              <Link to="/partidos">
                <Button variant="ghost" className="h-12 px-6 text-xs font-condensed font-black tracking-wider uppercase text-red-500 flex items-center gap-1.5 hover:bg-card/20">
                  🔴 Ver Partidos en Vivo
                </Button>
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Dashboard de Telemetría Táctica */}
          <div className="lg:col-span-6 w-full relative animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="absolute inset-0 bg-red-600/5 rounded-3xl filter blur-3xl pointer-events-none z-0" />
            
            {/* Panel Principal */}
            <div className="relative z-10 rounded-2xl border border-border/60 bg-card/95 p-6 shadow-2xl animate-scanline red-neon-glow">
              
              {/* Encabezado */}
              <div className="flex justify-between items-center border-b border-border/40 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-[10px] font-condensed font-black tracking-widest text-muted-foreground uppercase">TELEMETRÍA TORNEOS PRO FC v2.8</span>
                </div>
                <div className="flex gap-1.5 bg-muted/40 p-1 rounded border border-border/45">
                  <button 
                    onClick={() => setHeroActiveTab('matches')} 
                    className={`px-3 py-1 text-[9px] font-condensed font-black uppercase tracking-wider rounded transition-colors ${heroActiveTab === 'matches' ? 'bg-red-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Duelos
                  </button>
                  <button 
                    onClick={() => setHeroActiveTab('rankings')} 
                    className={`px-3 py-1 text-[9px] font-condensed font-black uppercase tracking-wider rounded transition-colors ${heroActiveTab === 'rankings' ? 'bg-red-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Posiciones
                  </button>
                  <button 
                    onClick={() => setHeroActiveTab('stats')} 
                    className={`px-3 py-1 text-[9px] font-condensed font-black uppercase tracking-wider rounded transition-colors ${heroActiveTab === 'stats' ? 'bg-red-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    MVP Semanal
                  </button>
                </div>
              </div>

              {/* Contenido Dinámico */}
              {heroActiveTab === 'matches' && (
                <div className="space-y-4">
                  <p className="text-[9px] font-condensed font-black tracking-widest text-red-500 uppercase">🔴 TELEMETRÍA EN TIEMPO REAL</p>
                  
                  {activeMatches.slice(0, 2).map((match, i) => (
                    <div key={i} className="bg-muted/10 border border-border/30 rounded-xl p-3.5 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] bg-red-600/25 border border-red-500/30 text-red-500 font-mono px-2 py-0.5 rounded font-black">
                          {match.goles_local !== null && match.goles_visitante !== null ? 'LIVE • 84\'' : 'PROGRAMADO'}
                        </span>
                        <span className="text-[8px] font-mono text-muted-foreground">División Profesional • Espacio Gamer</span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-4 py-1">
                        <div className="flex-1 flex items-center justify-end gap-2 text-right">
                          <span className="text-xs font-condensed font-black uppercase tracking-wide text-foreground">{match.local.nombre}</span>
                          <span className="w-6 h-6 rounded bg-card border border-border/50 flex items-center justify-center font-display font-black text-[10px] text-red-500 shrink-0">{match.local.abreviatura}</span>
                        </div>
                        <div className="px-3 py-1 rounded bg-background/80 border border-border/45 shrink-0">
                          <span className="font-mono font-black text-sm tracking-widest text-red-500">
                            {match.goles_local !== null ? match.goles_local : '0'} – {match.goles_visitante !== null ? match.goles_visitante : '0'}
                          </span>
                        </div>
                        <div className="flex-1 flex items-center justify-start gap-2 text-left">
                          <span className="w-6 h-6 rounded bg-card border border-border/50 flex items-center justify-center font-display font-black text-[10px] text-red-500 shrink-0">{match.visitante.abreviatura}</span>
                          <span className="text-xs font-condensed font-black uppercase tracking-wide text-foreground">{match.visitante.nombre}</span>
                        </div>
                      </div>

                      {/* Telemetry Progress Bars */}
                      <div className="space-y-1 pt-1 border-t border-border/30 text-[8px] text-muted-foreground font-condensed uppercase tracking-wider">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Tiros: {match.telemetry?.shotsL || 14}</span>
                          <span>Posesión: {match.telemetry?.possessionL || 55}% vs {match.telemetry?.possessionV || 45}%</span>
                          <span>Tiros: {match.telemetry?.shotsV || 9}</span>
                        </div>
                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden flex">
                          <div className="bg-red-600 h-full" style={{ width: `${match.telemetry?.possessionL || 55}%` }} />
                          <div className="bg-muted-foreground/20 h-full flex-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {heroActiveTab === 'rankings' && (
                <div className="space-y-3">
                  <p className="text-[9px] font-condensed font-black tracking-widest text-red-500 uppercase">🛡️ CLASIFICACIÓN DE ÉLITE</p>
                  <div className="divide-y divide-border/20">
                    {[
                      { rank: '01', club: 'Mapache Esports', points: 36, winrate: '88%' },
                      { rank: '02', club: 'Espacio Gamer Club', points: 31, winrate: '79%' },
                      { rank: '03', club: 'AMC Pro Club', points: 28, winrate: '71%' },
                      { rank: '04', club: 'Vipers eSports', points: 25, winrate: '65%' }
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center py-2 text-xs font-condensed tracking-wider font-semibold">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-red-500 font-black">{row.rank}</span>
                          <span className="uppercase text-foreground">{row.club}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-[10px] text-muted-foreground">WR: {row.winrate}</span>
                          <span className="font-mono font-black text-red-500">{row.points} PTS</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {heroActiveTab === 'stats' && (
                <div className="space-y-4">
                  <p className="text-[9px] font-condensed font-black tracking-widest text-red-500 uppercase">🔥 JUGADOR DESTACADO DEL CIRCUITO</p>
                  <div className="flex items-center gap-4 bg-muted/10 border border-border/30 p-3.5 rounded-xl">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-600/35 to-card border border-red-500/40 flex items-center justify-center font-display font-black text-3xl text-red-500 shrink-0">
                      MVP
                    </div>
                    <div className="flex-1 min-w-0 space-y-1 text-left">
                      <span className="text-[8px] bg-red-600/25 border border-red-500/30 text-red-500 font-mono px-2 py-0.5 rounded font-black">JUGADOR REGISTRADO</span>
                      <h4 className="text-base font-display font-black uppercase text-foreground truncate tracking-wide mt-1">Mapache_99</h4>
                      <p className="text-[9px] text-muted-foreground font-condensed uppercase tracking-wider">Club: Mapache Esports • Posición: DC</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Rating Global', value: '9.82' },
                      { label: 'Goles Oficiales', value: '18 Goles' },
                      { label: 'Asistencias', value: '12 Asist' }
                    ].map((card, i) => (
                      <div key={i} className="bg-muted/10 border border-border/30 p-2.5 rounded-lg text-center">
                        <span className="text-[8px] text-muted-foreground font-condensed uppercase block">{card.label}</span>
                        <span className="font-display text-lg font-black text-red-500 block tracking-wide">{card.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* ── 2. LIVE TICKER DE RESULTADOS (MOVIMIENTO LENTO) ── */}
      <div className="relative z-20 w-full bg-red-600 py-3.5 shadow-[0_0_30px_rgba(232,0,29,0.35)] overflow-hidden border-y border-border/40">
        <div className="animate-marquee-slow gap-14 font-condensed font-black text-[10px] text-white uppercase tracking-[0.25em]">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-14 shrink-0 items-center">
              <span>🏆 CIRCUITO DE LIGAS TORNEOS PRO FC — COPAS EN CURSO</span>
              <span>•</span>
              <span className="font-sans font-bold">Espacio Gamer: Mapache Esports 2–1 Espacio Gamer Club</span>
              <span>•</span>
              <span className="font-sans font-bold">Comunidad AMC: AMC Pro Club 0–0 Vipers FC</span>
              <span>•</span>
              <span className="font-sans font-bold">Champions Cup: GamerCup Esports 3–2 Virtual Pro Club</span>
              <span>•</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. ESTADÍSTICAS GLOBALES DEL SISTEMA ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { num: stats.leagues, label: 'LIGAS ACTIVAS' },
            { num: stats.tournaments, label: 'TORNEOS OFICIALES' },
            { num: stats.players + '+', label: 'JUGADORES COMPETITIVOS' },
            { num: stats.clubs, label: 'CLUBES REGISTRADOS' }
          ].map((item, i) => (
            <div key={i} className="bg-card/60 border border-border/50 p-6 rounded-2xl text-center space-y-1 shadow-lg relative overflow-hidden group hover:border-red-500/25 transition-all animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/2 rounded-full blur-2xl pointer-events-none" />
              <span className="font-display text-5xl md:text-6xl font-black bg-clip-text bg-gradient-to-b from-foreground to-muted-foreground tracking-wider">
                {item.num}
              </span>
              <span className="text-[10px] text-red-500 font-condensed font-black tracking-widest uppercase block">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. CIRCUITO DE COMPETENCIAS ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-24 space-y-12">
        <div className="text-center space-y-3">
          <Badge className="text-red-500 bg-red-500/10 border border-red-500/25 text-[10px] uppercase font-condensed tracking-widest px-4 py-1.5 rounded">
            ⚡ ESTRUCTURA DE TORNEOS PROFESIONALES
          </Badge>
          <h2 className="text-4xl sm:text-6xl font-display font-black uppercase text-foreground tracking-tight">
            CIRCUITOS DE <span className="bg-clip-text bg-gradient-to-r from-red-500 to-foreground text-transparent">COMPETICIÓN</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              num: '01',
              title: 'LIGAS OFICIALES',
              desc: 'Torneos divisionales de larga duración con gestión de plantillas completa, ascensos y descensos automáticos.'
            },
            {
              num: '02',
              title: 'COPAS RÁPIDAS',
              desc: 'Competiciones de eliminación directa con eventos semanales y alta exigencia competitiva.'
            },
            {
              num: '03',
              title: 'TORNEOS CORTOS',
              desc: 'Copas de comunidad y desafíos relámpago para mantener la química y ritmo de juego de tu plantilla.'
            },
            {
              num: '04',
              title: 'SISTEMA DRAFT',
              desc: 'Eventos de selección oficial de jugadores libres y armado de escuadras bajo reglas de fair play financiero.'
            }
          ].map((comp, i) => (
            <div key={i} className="glass-card-aaa p-6 rounded-2xl space-y-5 text-left relative overflow-hidden group select-none animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="absolute right-4 top-2 font-display text-8xl font-black text-foreground/[0.02] group-hover:text-red-500/[0.04] transition-colors pointer-events-none">
                {comp.num}
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center font-display font-black text-sm text-red-500">
                {comp.num}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-condensed font-black text-foreground tracking-wider uppercase group-hover:text-red-500 transition-colors">
                  {comp.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {comp.desc}
                </p>
              </div>
              <div className="h-0.5 w-full bg-border/40 group-hover:bg-red-500 transition-all rounded-full" />
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. ORGANIZACIONES OFICIALES DEL SISTEMA Torneos Pro FC ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-24 space-y-12 border-t border-border/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-2 text-left">
            <Badge className="text-red-500 bg-red-500/10 border border-red-500/25 text-[10px] uppercase font-condensed tracking-widest px-3 py-1">
              🏢 CIRCUITOS ACREDITADOS
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-display font-black uppercase tracking-tight text-foreground">
              ORGANIZACIONES <span className="text-glow-red text-red-500">ASOCIADAS</span>
            </h2>
          </div>
          <Link to="/organizaciones">
            <Button variant="outline" className="text-xs font-condensed font-black tracking-wider uppercase border-border/80 hover:border-red-500/30">
              Ver Directorio Completo
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Espacio Gamer', region: 'Sudamérica Norte', rank: '#01 Global', players: 412, trophies: 8, logo: 'EG' },
            { name: 'Comunidad AMC', region: 'Chile / Global', rank: '#02 Global', players: 388, trophies: 6, logo: 'AM' },
            { name: 'Virtual Pro Network', region: 'Internacional', rank: '#03 Global', players: 320, trophies: 5, logo: 'VP' }
          ].map((org, i) => (
            <div key={i} className="glass-card-aaa p-6 rounded-2xl flex items-start gap-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600/20 to-card border border-red-500/30 flex items-center justify-center font-display font-black text-lg text-red-500 shrink-0">
                {org.logo}
              </div>
              <div className="flex-1 min-w-0 space-y-2 text-left">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] uppercase tracking-wider font-mono text-muted-foreground">{org.region}</span>
                    <span className="text-[8px] bg-red-600/15 text-red-500 font-mono px-2 py-0.5 rounded font-bold">{org.rank}</span>
                  </div>
                  <h4 className="text-base font-display font-black text-foreground uppercase tracking-wide mt-1">{org.name}</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-2 border-t border-border/30 pt-2 text-[10px] font-condensed tracking-wider uppercase text-muted-foreground">
                  <div>
                    <span className="text-[8px] text-muted-foreground block">Miembros Activos</span>
                    <span className="font-semibold text-foreground">{org.players} Jugadores</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-muted-foreground block">Títulos y Copas</span>
                    <span className="font-semibold text-red-500 font-mono">🏆 {org.trophies} Copas</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. CENTRO DE PARTIDOS EN VIVO ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-24 space-y-12 border-t border-border/40">
        <div className="text-center space-y-2">
          <Badge className="text-red-500 bg-red-500/10 border border-red-500/25 text-[10px] uppercase font-condensed tracking-widest px-3 py-1">
            🔴 RETRANSMISIÓN Y TELEMETRÍA EN DIRECTO
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-display font-black uppercase text-foreground tracking-tight">
            CENTRO DE <span className="text-glow-red text-red-500">PARTIDOS EN VIVO</span>
          </h2>
        </div>

        <div className="space-y-4">
          {activeMatches.map((match) => {
            const isLive = match.estado === 'live';
            return (
              <div 
                key={match.id}
                className={`glass-card-aaa p-5 flex flex-col md:flex-row justify-between items-center gap-6 border rounded-2xl relative overflow-hidden ${
                  isLive ? 'border-red-500/30 shadow-[0_0_20px_rgba(232,0,29,0.05)]' : 'border-border/50'
                }`}
              >
                {/* TIME & STATE */}
                <div className="flex md:flex-col items-center md:items-start shrink-0 gap-2 border-b md:border-b-0 md:border-r border-border/30 pb-3 md:pb-0 md:pr-8 w-full md:w-auto justify-between md:justify-start text-left">
                  <div>
                    <span className="text-[8px] font-condensed font-black tracking-widest text-muted-foreground uppercase block">ESTADO BROADCAST</span>
                    <span className="text-lg font-display font-black text-foreground tracking-widest mt-0.5 block">
                      {isLive ? 'EN TRANSMISIÓN' : 'PARTIDO FINALIZADO'}
                    </span>
                  </div>
                  <div>
                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-condensed font-black tracking-widest text-red-500 bg-red-500/10 border border-red-500/25 px-2.5 py-1 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> {match.tiempo}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-condensed font-black tracking-widest text-muted-foreground bg-muted border border-border/40 px-2.5 py-1 rounded">
                        FT (FIN)
                      </span>
                    )}
                  </div>
                </div>

                {/* SQUADS & SCORE */}
                <div className="flex-1 flex items-center justify-between gap-6 md:gap-10 w-full min-w-0">
                  {/* Local Squad */}
                  <div className="flex-1 flex items-center justify-end gap-3 min-w-0 text-right">
                    <span className="text-xs md:text-sm font-condensed font-black uppercase tracking-wider truncate text-foreground">{match.local.nombre}</span>
                    <div className="w-8 h-8 rounded-lg bg-card border border-border/50 flex items-center justify-center font-display font-black text-xs text-red-500 shrink-0">
                      {match.local.abreviatura}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="shrink-0 text-center px-4 py-1.5 rounded bg-background border border-border/40">
                    <span className="text-xl md:text-2xl font-mono font-black tracking-widest text-foreground leading-none block">
                      {match.goles_local !== null ? match.goles_local : '0'} – {match.goles_visitante !== null ? match.goles_visitante : '0'}
                    </span>
                  </div>

                  {/* Visitante Squad */}
                  <div className="flex-1 flex items-center justify-start gap-3 min-w-0 text-left">
                    <div className="w-8 h-8 rounded-lg bg-card border border-border/50 flex items-center justify-center font-display font-black text-xs text-red-500 shrink-0">
                      {match.visitante.abreviatura}
                    </div>
                    <span className="text-xs md:text-sm font-condensed font-black uppercase tracking-wider truncate text-foreground">{match.visitante.nombre}</span>
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <div className="shrink-0 w-full md:w-auto border-t md:border-t-0 md:border-l border-border/30 pt-4 md:pt-0 md:pl-8 flex justify-center">
                  <Link to={`/partidos/${match.id}`} className="w-full">
                    <Button className="w-full md:w-32 h-10 text-[9px] font-condensed font-black tracking-widest uppercase bg-red-600/10 text-red-500 border border-red-500/25 hover:bg-red-600 hover:text-white transition-all">
                      {isLive ? '🔴 VER DETALLE' : 'VER AUDITORÍA'}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 7. LEADERBOARDS & TABLAS DE POSICIONES ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-24 space-y-12 border-t border-border/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-2 text-left">
            <Badge className="text-red-500 bg-red-500/10 border border-red-500/25 text-[10px] uppercase font-condensed tracking-widest px-3 py-1">
              📊 ÍNDICE DE RENDIMIENTO GLOBAL
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-display font-black uppercase tracking-tight text-foreground">
              TABLAS DE <span className="text-glow-red text-red-500">POSICIONES</span>
            </h2>
          </div>
          
          <div className="flex bg-card/60 p-1 rounded-xl border border-border/50">
            {[
              { id: 'clubs', label: '🏆 Mejores Clubes' },
              { id: 'players', label: '🏃‍♂️ Goleadores y MVP' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setLeaderboardTab(tab.id)}
                className={`px-4 py-2 text-[10px] font-condensed font-black uppercase tracking-wider rounded-lg transition-colors ${
                  leaderboardTab === tab.id ? 'bg-red-600 text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card-aaa overflow-hidden rounded-2xl border border-border/50">
          {leaderboardTab === 'clubs' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-condensed tracking-wider">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30 text-muted-foreground font-black uppercase text-[10px]">
                    <th className="py-4 px-6 text-center w-16">RANGO</th>
                    <th className="py-4 px-6">CLUB DE CLUBES VIRTUALES</th>
                    <th className="py-4 px-6 text-center">PARTIDOS</th>
                    <th className="py-4 px-6 text-center">VICTORIAS</th>
                    <th className="py-4 px-6 text-center">DIF. GOLES</th>
                    <th className="py-4 px-6 text-center text-red-500">PUNTOS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 font-semibold text-muted-foreground">
                  {[
                    { rank: '01', name: 'Mapache Esports', played: 14, won: 12, diff: '+28', pts: 36, tag: 'MAP' },
                    { rank: '02', name: 'Espacio Gamer Club', played: 14, won: 10, diff: '+19', pts: 31, tag: 'EGC' },
                    { rank: '03', name: 'AMC Pro Club', played: 14, won: 9, diff: '+12', pts: 28, tag: 'AMC' },
                    { rank: '04', name: 'Vipers eSports Club', played: 14, won: 8, diff: '+8', pts: 25, tag: 'VIP' },
                    { rank: '05', name: 'Infinity Crew Pro', played: 14, won: 7, diff: '+2', pts: 22, tag: 'INF' }
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/10 transition-colors">
                      <td className="py-4 px-6 text-center font-mono font-black text-red-500 text-sm">{row.rank}</td>
                      <td className="py-4 px-6 flex items-center gap-3">
                        <div className="w-7 h-7 rounded bg-card border border-border/50 flex items-center justify-center font-display font-black text-[10px] text-red-500 shrink-0">{row.tag}</div>
                        <span className="uppercase text-foreground font-bold">{row.name}</span>
                      </td>
                      <td className="py-4 px-6 text-center font-mono">{row.played}</td>
                      <td className="py-4 px-6 text-center font-mono">{row.won}</td>
                      <td className="py-4 px-6 text-center font-mono text-emerald-500">{row.diff}</td>
                      <td className="py-4 px-6 text-center font-mono font-black text-red-500 text-sm">{row.pts} PTS</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-condensed tracking-wider">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30 text-muted-foreground font-black uppercase text-[10px]">
                    <th className="py-4 px-6 text-center w-16">RANGO</th>
                    <th className="py-4 px-6">ESPORTS JUGADOR (GAMERTAG)</th>
                    <th className="py-4 px-6 text-center">GOLES</th>
                    <th className="py-4 px-6 text-center">ASISTENCIAS</th>
                    <th className="py-4 px-6 text-center">PARTIDOS</th>
                    <th className="py-4 px-6 text-center text-red-500">PROMEDIO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 font-semibold text-muted-foreground">
                  {[
                    { rank: '01', name: 'Mapache_99', goals: 18, assists: 12, played: 14, rating: '9.82', tag: 'MAP' },
                    { rank: '02', name: 'Sebastian_Pro', goals: 15, assists: 8, played: 14, rating: '9.45', tag: 'EGC' },
                    { rank: '03', name: 'AMC_Gamer1', goals: 12, assists: 14, played: 14, rating: '9.31', tag: 'AMC' },
                    { rank: '04', name: 'Viper_Striker', goals: 11, assists: 9, played: 14, rating: '8.98', tag: 'VIP' },
                    { rank: '05', name: 'Infinity_Mastro', goals: 10, assists: 11, played: 14, rating: '8.75', tag: 'INF' }
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/10 transition-colors">
                      <td className="py-4 px-6 text-center font-mono font-black text-red-500 text-sm">{row.rank}</td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col text-left">
                          <span className="uppercase text-foreground font-bold">{row.name}</span>
                          <span className="text-[8px] text-muted-foreground uppercase tracking-wider">Abreviatura Club: {row.tag}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center font-mono text-foreground font-bold">{row.goals}</td>
                      <td className="py-4 px-6 text-center font-mono text-muted-foreground">{row.assists}</td>
                      <td className="py-4 px-6 text-center font-mono">{row.played}</td>
                      <td className="py-4 px-6 text-center font-mono font-black text-red-500 text-sm">⭐ {row.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── 8. ANALÍTICA AVANZADA DE RENDIMIENTO DE JUGADORES ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-24 space-y-12 border-t border-border/40">
        <div className="text-center space-y-2">
          <Badge className="text-red-500 bg-red-500/10 border border-red-500/25 text-[10px] uppercase font-condensed tracking-widest px-3 py-1">
            ⚡ FICHA DE RENDIMIENTO TÁCTICO
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-display font-black uppercase text-foreground tracking-tight">
            ESTADÍSTICAS DEL <span className="text-glow-red text-red-500">JUGADOR DE LA SEMANA</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Card del Jugador */}
          <div className="lg:col-span-4 w-full">
            <div className="bg-gradient-to-b from-card to-background border border-red-500/20 p-6 rounded-2xl space-y-6 relative overflow-hidden red-neon-glow">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex justify-between items-start">
                <span className="text-[8px] bg-red-600/20 border border-red-500/30 text-red-500 font-mono px-2 py-0.5 rounded font-black">FICHA GOLD PRO</span>
                <span className="font-display text-4xl font-black text-foreground/10 tracking-wider">#01</span>
              </div>

              <div className="flex flex-col items-center text-center space-y-3 py-4 border-b border-border/40">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-card border-2 border-red-500 flex items-center justify-center font-display font-black text-3xl text-white shadow-xl">
                  MAP
                </div>
                <div>
                  <h3 className="text-xl font-display font-black text-foreground tracking-wide uppercase">Mapache_99</h3>
                  <p className="text-[10px] text-red-500 font-condensed font-black tracking-widest uppercase mt-0.5">SQUAD: MAPACHE ESPORTS</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-condensed tracking-wider uppercase text-muted-foreground text-left">
                <div>
                  <span className="text-[8px] text-muted-foreground block">Posición</span>
                  <span className="font-bold text-foreground">Delantero (DC)</span>
                </div>
                <div>
                  <span className="text-[8px] text-muted-foreground block">Nacionalidad</span>
                  <span className="font-bold text-foreground">Chile 🇨🇱</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fichas de Métricas */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
            {[
              { label: 'Win Rate % (Victorias)', value: '85.7%', desc: 'Porcentaje total de duelos ganados.', color: 'text-emerald-500' },
              { label: 'Goles Anotados', value: '18 Goles', desc: 'Total de anotaciones en liga oficial.', color: 'text-red-500' },
              { label: 'Asistencias Clave', value: '12 Pases', desc: 'Asistencias a gol completadas.', color: 'text-foreground' },
              { label: 'Partidos MVP', value: '7 MVP', desc: 'Elegido el mejor jugador del encuentro.', color: 'text-amber-500' },
              { label: 'Vallas Invictas (Porteros)', value: 'N/A', desc: 'Partidos con portería a cero.', color: 'text-muted-foreground' },
              { label: 'Valoración Promedio', value: '⭐ 9.82', desc: 'Rating general de desempeño del servidor.', color: 'text-red-500' }
            ].map((stat, i) => (
              <div key={i} className="glass-card-aaa p-5 rounded-2xl space-y-3 text-left">
                <span className="text-[9px] text-muted-foreground font-condensed font-black tracking-widest uppercase block">{stat.label}</span>
                <span className={`font-display text-2xl font-black ${stat.color} block tracking-wider`}>{stat.value}</span>
                <p className="text-[10px] text-muted-foreground leading-normal font-light">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. HISTORIAL DE FICHAJES EN TIEMPO REAL ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-24 space-y-12 border-t border-border/40">
        <div className="text-center space-y-2">
          <Badge className="text-red-500 bg-red-500/10 border border-red-500/25 text-[10px] uppercase font-condensed tracking-widest px-3 py-1">
            🔄 MOVIMIENTOS RECIENTES DEL MERCADO
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-display font-black uppercase text-foreground tracking-tight">
            MERCADO DE <span className="text-glow-red text-red-500">TRASPASOS</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { player: 'Mapache_99', from: 'Espacio Gamer Club', to: 'Mapache Esports', val: '€12.5M', role: 'Delantero' },
            { player: 'Seba_Pro', from: 'Agente Libre', to: 'Espacio Gamer Club', val: '€8.2M', role: 'Mediocampista' },
            { player: 'AMC_Gamer1', from: 'Vipers eSports', to: 'AMC Pro Club', val: '€10.0M', role: 'Portero' }
          ].map((item, i) => (
            <div key={i} className="glass-card-aaa p-5 rounded-2xl space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[8px] bg-muted/40 border border-border/50 text-muted-foreground px-2.5 py-0.5 rounded font-mono uppercase">{item.role}</span>
                <span className="text-[9px] font-mono text-red-500 font-black">{item.val} VAL</span>
              </div>
              <h4 className="text-base font-display font-black text-foreground uppercase tracking-wide">{item.player}</h4>
              
              <div className="flex justify-between items-center text-[10px] font-condensed uppercase tracking-wider text-muted-foreground bg-background/60 p-2.5 rounded-lg border border-border/40">
                <div className="text-left">
                  <span className="text-[7px] text-muted-foreground block">CLUB ORIGEN</span>
                  <span className="font-semibold text-foreground">{item.from}</span>
                </div>
                <span className="text-red-500 font-bold shrink-0">➜</span>
                <div className="text-right">
                  <span className="text-[7px] text-muted-foreground block">CLUB DESTINO</span>
                  <span className="font-semibold text-red-500">{item.to}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 10. CTA FINAL ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-32 text-center space-y-8 border-t border-border/40">
        <div className="absolute inset-0 bg-red-600/[0.02] rounded-full blur-[120px] pointer-events-none z-0" />
        
        <div className="relative z-10 space-y-4">
          <Badge className="text-red-500 bg-red-500/10 border border-red-500/25 text-[10px] uppercase font-condensed tracking-widest px-4 py-1.5 rounded">
            🎮 ENTRA A LA ARENA OFICIAL
          </Badge>
          <h2 className="text-5xl sm:text-7xl font-display font-black uppercase text-foreground tracking-tight leading-none">
            ¿LISTO PARA COMPETIR AL <br />
            <span className="bg-clip-text bg-gradient-to-r from-red-500 to-foreground text-transparent text-glow-red">MÁS ALTO NIVEL?</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Inscribe a tu club, sincroniza tus cuentas de EA Sports y lidera las tablas oficiales del circuito profesional Torneos Pro FC.
          </p>
        </div>

        <div className="relative z-10 pt-2">
          <Link to="/registro">
            <Button className="h-14 px-12 bg-gradient-pro hover:shadow-[0_0_35px_rgba(232,0,29,0.65)] border-none text-xs font-condensed font-black tracking-widest uppercase text-white">
              ⚡ UNIRSE A LA PLATAFORMA AHORA
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}