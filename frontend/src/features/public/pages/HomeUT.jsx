import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useScrollAnimations from '@/hooks/useScrollAnimations';

// Componentes UI Reutilizables
const Badge = ({ children, className }) => <span className={`inline-block rounded-full ${className}`}>{children}</span>;

export default function HomeUT() {
  useScrollAnimations();
  const [liveMatches, setLiveMatches] = useState([]);

  useEffect(() => {
    // Simulando carga de partidos en vivo para el HUD (formato 1v1)
    const timer = setTimeout(() => {
      setLiveMatches([
        { id: 1, home: 'xX_GamerPro_Xx', away: 'FC Elite', score: '3 - 3', time: "89'" },
        { id: 2, home: 'Toxic_Player99', away: 'NoobMaster69', score: '5 - 0', time: "45'" }
      ]);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-red-600 selection:text-white">
      
      {/* --- EFECTOS E-SPORTS AAA ROJO --- */}
      {/* Background Typography */}
      <div className="absolute top-20 left-0 w-full flex justify-center pointer-events-none z-0 opacity-[0.03]">
        <h1 className="text-[12rem] md:text-[20rem] font-display font-black text-red-600 leading-none tracking-tighter whitespace-nowrap select-none">
          ULTIMATE
        </h1>
      </div>

      {/* Resplandores y Partículas */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div 
            key={i} 
            className="absolute bg-red-500/80 rounded-full animate-ping"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDuration: Math.random() * 3 + 2 + 's',
              animationDelay: Math.random() * 2 + 's',
              boxShadow: '0 0 10px 2px rgba(232,0,29,0.8)'
            }}
          />
        ))}
      </div>
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-red-600/20 rounded-full blur-[150px] pointer-events-none z-0 animate-pulse" />
      <div className="absolute bottom-[10%] right-[-10%] w-[60vw] h-[60vh] bg-red-700/20 rounded-full blur-[180px] pointer-events-none z-0 animate-pulse" style={{ animationDelay: '4s' }} />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,0,0.05)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none z-0 opacity-70" />

      {/* ── 1. HERO SECTION ── */}
      <section className="relative min-h-[90vh] flex flex-col justify-center items-center px-6 text-center animate-drum-roll pt-20 overflow-hidden">
        {/* Background Video Cinematográfico */}
        <div className="absolute inset-0 z-0">
          <iframe 
            className="w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-30 mix-blend-screen grayscale-[10%] pointer-events-none"
            src="https://www.youtube.com/embed/XhP3Xh4LMA8?autoplay=1&mute=1&controls=0&loop=1&playlist=XhP3Xh4LMA8" 
            title="EA FC Trailer" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen>
          </iframe>
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background z-10" />
        </div>

        <div className="relative z-20 flex flex-col items-center">
          <Badge className="mb-6 animate-pulse px-4 py-1 text-xs font-condensed tracking-widest bg-red-600/20 text-red-500 border border-red-500/50">
            DIVISION RIVALS // INSCRIPCIONES ABIERTAS
          </Badge>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-black uppercase text-foreground tracking-tighter leading-[0.85] mb-6 drop-shadow-[0_0_30px_rgba(232,0,29,0.5)]">
            CONVIÉRTETE EN <br /><span className="text-red-500 neon-glow">LEYENDA</span> DE FUT
          </h1>
        <h2 className="text-xl md:text-2xl text-muted-foreground max-w-3xl font-light mb-10 font-sans">
          ¿Crees que tienes la mejor plantilla? Pon tu habilidad a prueba en torneos 1v1 y Dúos. Destroza el Meta, sube de rango y asegura tu lugar en FUT Champions.
        </h2>
        <div className="flex flex-col sm:flex-row gap-6 mt-4">
          <Link to="/register" className="btn-action-primary px-12 py-4 text-lg shadow-[0_0_20px_rgba(232,0,29,0.4)]">
            ENTRAR AL DRAFT
          </Link>
          <Link to="/contact" className="glass-card-hover px-10 py-4 text-foreground font-bold uppercase tracking-widest rounded-md text-sm flex items-center justify-center border border-red-500/30">
            VER RÁNKING GLOBAL
          </Link>
        </div>
        </div>
      </section>

      {/* ── 2. EL CAMPO DE BATALLA ── */}
      <section className="relative z-10 py-24 px-6 md:px-12 bg-background/60 backdrop-blur-md border-y border-red-500/20">
        <div className="max-w-6xl mx-auto text-center mb-16 animate-drum-roll" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-4xl md:text-6xl font-display font-black text-foreground uppercase tracking-tight">
            EL CAMPO DE <span className="text-red-500">BATALLA</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto font-sans">
            Compite en torneos semanales tipo FUT Champions. Enfrentamientos 1 contra 1 o Dúos Cooperativos en tu consola favorita. No hay bots, solo sudor puro.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {['PS5', 'XBOX SERIES X|S', 'PC', 'CROSSPLAY'].map((plat, idx) => (
            <div key={idx} className="glass-card-hover p-8 text-center neon-glow" style={{ animationDelay: `${idx * 0.1}s` }}>
              <h3 className="text-3xl font-display font-black text-red-500">{plat}</h3>
              <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest">Ligas Competitivas</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. ESTADÍSTICAS Y GLORIA ── */}
      <section className="relative z-10 py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-drum-roll" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-5xl md:text-7xl font-display font-black text-foreground uppercase tracking-tight leading-[0.9] mb-8">
                TUS STATS <br /><span className="text-red-500">TU LEGADO</span>
              </h2>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(232,0,29,0.4)]">
                    <span className="font-display text-2xl font-black text-red-500">1</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold uppercase tracking-wider mb-2">MMR DE COMPETICIÓN</h4>
                    <p className="text-muted-foreground font-sans text-sm">Nuestro sistema de Elo te empareja con rivales de tu nivel. Sube tu MMR aplastando a la competencia y alcanza el Rango Élite.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(232,0,29,0.4)]">
                    <span className="font-display text-2xl font-black text-red-500">2</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold uppercase tracking-wider mb-2">REGISTRO HISTÓRICO</h4>
                    <p className="text-muted-foreground font-sans text-sm">Guarda un registro detallado de tus Victorias/Derrotas, racha de partidos y promedio de goles. Construye un currículum que imponga respeto.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(232,0,29,0.4)]">
                    <span className="font-display text-2xl font-black text-red-500">3</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold uppercase tracking-wider mb-2">RECOMPENSAS Y GLORIA</h4>
                    <p className="text-muted-foreground font-sans text-sm">Gana torneos relámpago y ligas de temporada para desbloquear premios exclusivos, insignias de perfil y el reconocimiento de toda la comunidad.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative animate-scanline group perspective-1000">
               <div className="absolute inset-0 bg-red-600/10 blur-3xl rounded-full group-hover:bg-red-600/20 transition-all duration-700" />
               <div className="relative w-full max-w-[350px] mx-auto bg-gradient-to-b from-card to-background border-2 border-red-500/30 p-8 rounded-t-[30px] rounded-b-[40%] shadow-[0_0_50px_rgba(232,0,29,0.3)] transform group-hover:scale-105 group-hover:rotate-y-6 transition-all duration-500 overflow-hidden text-center">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="absolute top-6 left-6 text-left">
                    <span className="font-display text-5xl font-black text-foreground block leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">99</span>
                    <span className="text-xs font-condensed font-black tracking-widest text-red-500 uppercase">ÉLITE</span>
                  </div>
                  
                  <div className="w-28 h-28 mx-auto mt-4 rounded-full bg-gradient-to-br from-red-600 to-card border-2 border-red-500 flex items-center justify-center font-display font-black text-4xl text-white shadow-[0_0_20px_rgba(232,0,29,0.5)] z-10 relative">
                    PRO
                  </div>
                  
                  <h3 className="text-3xl font-display font-black text-foreground tracking-widest uppercase mt-6 z-10 relative drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">xX_GamerPro_Xx</h3>
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent my-4" />
                  
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs font-condensed tracking-widest uppercase text-foreground/80 z-10 relative w-4/5 mx-auto">
                    <div className="flex justify-between"><span>WIN</span><span className="font-bold text-red-500">145</span></div>
                    <div className="flex justify-between"><span>LOS</span><span className="font-bold text-red-500">12</span></div>
                    <div className="flex justify-between"><span>G/P</span><span className="font-bold text-red-500">3.8</span></div>
                    <div className="flex justify-between"><span>WR</span><span className="font-bold text-red-500">92%</span></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. EN VIVO (HUD TÁCTICO) ── */}
      <section className="relative z-10 py-16 bg-muted border-y border-red-500/30 overflow-hidden">
        <div className="broadcast-scanlines" />
        
        {/* Ticker de resultados */}
        <div className="absolute top-0 w-full bg-red-600/10 border-b border-red-500/20 py-2 z-20 flex overflow-hidden">
          <div className="animate-marquee-slow flex whitespace-nowrap gap-12 font-condensed tracking-widest text-red-500 text-sm">
            <span>TORNEO RÁPIDO: INSCRIPCIONES CERRANDO EN 30 MINUTOS</span>
            <span className="text-foreground">///</span>
            <span>DIVISION RIVALS: xX_GamerPro_Xx ALCANZA LA DIVISIÓN ÉLITE</span>
            <span className="text-foreground">///</span>
            <span>ALERTA: NUEVA ACTUALIZACIÓN DE EA FC AFECTA EL META ACTUAL</span>
            <span className="text-foreground">///</span>
            <span>TORNEO RÁPIDO: INSCRIPCIONES CERRANDO EN 30 MINUTOS</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 mt-12 animate-drum-roll" style={{ animationDelay: '0.4s' }}>
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-red-500/20 pb-4">
            <div>
              <h2 className="text-4xl md:text-5xl font-display font-black text-foreground uppercase">
                ARENA <span className="text-red-500">EN VIVO</span>
              </h2>
              <p className="text-muted-foreground font-condensed tracking-widest mt-2 text-sm">HUD COMPETITIVO // PARTIDOS 1V1 EN CURSO</p>
            </div>
            <div className="live-match-flash px-4 py-1 rounded bg-red-600/20 border border-red-500 text-red-500 font-condensed font-bold mt-4 md:mt-0 flex items-center gap-2 shadow-[0_0_15px_rgba(232,0,29,0.5)]">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              LIVE MATCHES
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {liveMatches.length > 0 ? liveMatches.map((match) => (
              <div key={match.id} className="glass-card-hover p-6 flex justify-between items-center border border-red-500/30 bg-background/80 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                <div className="text-center w-[40%]">
                  <span className="font-display text-xl md:text-2xl text-foreground truncate block">{match.home}</span>
                </div>
                <div className="text-center w-[20%] flex flex-col items-center">
                  <span className="text-red-500 font-condensed text-xs mb-1 animate-pulse">{match.time}</span>
                  <div className="bg-red-600/20 border border-red-500/50 px-4 py-2 rounded text-2xl font-display font-black text-foreground shadow-[0_0_10px_rgba(232,0,29,0.3)]">
                    {match.score}
                  </div>
                </div>
                <div className="text-center w-[40%]">
                  <span className="font-display text-xl md:text-2xl text-foreground truncate block">{match.away}</span>
                </div>
              </div>
            )) : (
              <div className="col-span-1 md:col-span-2 text-center py-16 border border-dashed border-red-500/30 bg-red-600/5">
                <span className="animate-pulse text-red-500 font-condensed tracking-widest text-lg">BUSCANDO OPONENTES EN EL SERVIDOR...</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 5. CIERRE Y REGISTRO ── */}
      <section className="relative z-10 py-32 px-6 text-center animate-drum-roll" style={{ animationDelay: '0.6s' }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-background to-background z-0 pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-5xl md:text-8xl font-display font-black text-foreground uppercase tracking-tighter leading-none mb-6">
            LLEGÓ TU HORA DE <br /><span className="text-red-500">HACER HISTORIA</span>
          </h2>
          <p className="text-muted-foreground font-sans max-w-2xl mx-auto mb-10 text-lg">
            Basta de jugar contra la IA o en Divisiones sin sentido. Mídete contra los mejores de la comunidad, escala el Ránking Global y reclama tu corona.
          </p>
          <Link to="/register" className="btn-action-primary px-16 py-5 text-xl mx-auto inline-flex shadow-[0_0_40px_rgba(232,0,29,0.6)]">
            REGISTRARME Y PELEAR
          </Link>
        </div>
      </section>

    </div>
  );
}