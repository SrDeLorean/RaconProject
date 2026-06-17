import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useScrollAnimations from '@/hooks/useScrollAnimations';

export default function Home() {
  useScrollAnimations();
  
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden font-sans flex flex-col md:flex-row">
      
      {/* Background Video Cinematográfico Global */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {isDesktop && (
          <iframe 
            className="w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-30 mix-blend-screen grayscale-[30%] pointer-events-none"
            src="https://www.youtube.com/embed/XhP3Xh4LMA8?autoplay=1&mute=1&controls=0&loop=1&playlist=XhP3Xh4LMA8" 
            title="EA FC Trailer" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen>
          </iframe>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background z-10" />
      </div>

      {/* 11v11 Pro Clubs Side */}
      <Link 
        to="/11v11" 
        className="relative flex-1 group overflow-hidden cursor-pointer flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-border/40 min-h-[50vh] md:min-h-screen"
      >
        {/* Background Image & Effects */}
        <div className="absolute inset-0 transition-all duration-[2000ms] ease-out mix-blend-luminosity group-hover:mix-blend-normal" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent md:bg-gradient-to-t md:from-transparent md:via-background/40 md:to-transparent" />
        <div className="absolute inset-0 bg-background/50 group-hover:bg-background/20 transition-all duration-700" />
        
        {/* Neon Glow */}
        <div className="absolute w-[60%] h-[60%] bg-red-600/20 rounded-full blur-[150px] pointer-events-none group-hover:bg-red-500/40 transition-all duration-1000" />
        
        {/* Content */}
        <div className="relative z-10 text-center p-8 transform group-hover:-translate-y-4 transition-transform duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/20 border border-red-500/30 mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-condensed font-black tracking-widest text-red-500 uppercase">MODO EQUIPO</span>
          </div>
          <h2 className="text-6xl md:text-8xl font-display font-black uppercase tracking-tighter text-foreground drop-shadow-2xl">
            11<span className="text-red-500">v</span>11
          </h2>
          <h3 className="text-2xl md:text-3xl font-display font-black uppercase tracking-widest text-foreground/90 mt-2 mb-6">
            CLUBES PRO
          </h3>
          <p className="text-sm md:text-base text-muted-foreground max-w-sm mx-auto font-light leading-relaxed">
            Gestión total de plantillas, ligas, mercado de fichajes y telemetría avanzada para tu comunidad competitiva.
          </p>
          <div className="mt-8 flex justify-center">
            <div className="px-8 py-3 rounded border border-red-500/50 text-foreground font-condensed font-black tracking-widest text-xs uppercase group-hover:bg-red-600 transition-colors duration-500 shadow-[0_0_20px_rgba(232,0,29,0)] group-hover:shadow-[0_0_30px_rgba(232,0,29,0.4)]">
              Ingresar al Hub 11v11
            </div>
          </div>
        </div>
      </Link>

      {/* 1v1 / 2v2 Ultimate Team Side */}
      <Link 
        to="/ut" 
        className="relative flex-1 group overflow-hidden cursor-pointer flex flex-col justify-center items-center min-h-[50vh] md:min-h-screen"
      >
        {/* Background Image & Effects */}
        <div className="absolute inset-0 transition-all duration-[2000ms] ease-out mix-blend-luminosity group-hover:mix-blend-normal" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent md:bg-gradient-to-t md:from-transparent md:via-background/40 md:to-transparent" />
        <div className="absolute inset-0 bg-background/50 group-hover:bg-background/20 transition-all duration-700" />
        
        {/* Glow */}
        <div className="absolute w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none group-hover:bg-blue-500/40 transition-all duration-1000" />
        
        {/* Content */}
        <div className="relative z-10 text-center p-8 transform group-hover:-translate-y-4 transition-transform duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-condensed font-black tracking-widest text-blue-500 uppercase">MODO INDIVIDUAL & DÚOS</span>
          </div>
          <h2 className="text-6xl md:text-8xl font-display font-black uppercase tracking-tighter text-foreground drop-shadow-2xl flex items-center justify-center gap-2">
            1<span className="text-blue-500">v</span>1 <span className="text-muted-foreground/30 font-light text-4xl">/</span> 2<span className="text-blue-500">v</span>2
          </h2>
          <h3 className="text-2xl md:text-3xl font-display font-black uppercase tracking-widest text-foreground/90 mt-2 mb-6">
            ULTIMATE TEAM
          </h3>
          <p className="text-sm md:text-base text-muted-foreground max-w-sm mx-auto font-light leading-relaxed">
            Formatos Division Rivals y FUT Champions. Conquista el meta y lidera los rankings mundiales.
          </p>
          <div className="mt-8 flex justify-center">
            <div className="px-8 py-3 rounded border border-blue-500/50 text-foreground font-condensed font-black tracking-widest text-xs uppercase group-hover:bg-blue-600 transition-colors duration-500 shadow-[0_0_20px_rgba(59,130,246,0)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]">
              Ingresar al Hub UT
            </div>
          </div>
        </div>
      </Link>

      {/* Central Logo Overlay */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none hidden md:flex flex-col items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-background border-4 border-border/50 flex items-center justify-center shadow-2xl backdrop-blur-md">
          <span className="font-display font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50">
            VS
          </span>
        </div>
      </div>

    </div>
  );
}