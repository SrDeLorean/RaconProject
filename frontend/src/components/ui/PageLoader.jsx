import React from 'react';
import Spinner from './Spinner';

export default function PageLoader() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center overflow-hidden relative hud-noise broadcast-scanlines font-sans">
      
      {/* Glow background effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse-glow"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-destructive/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

      {/* Cybernetic Tech Frame & Central Loading UI */}
      <div className="flex flex-col items-center gap-8 relative z-10 animate-fade-in">
        
        {/* Orbital tech structure */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Outer tech ring */}
          <div className="absolute inset-0 rounded-full border border-primary/20 border-t-primary border-b-primary anim-rotate-cw" />
          
          {/* Middle dashed compass/crosshair ring */}
          <div className="absolute w-[85%] h-[85%] rounded-full border border-dashed border-muted-foreground/30 anim-rotate-ccw" />
          
          {/* Inner tech bracket ring */}
          <div className="absolute w-[70%] h-[70%] rounded-full border border-destructive/30 border-l-destructive border-r-destructive anim-rotate-cw" />

          {/* Central Logo 'R' with primary-destructive gradient and neon drop shadow */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-primary to-destructive flex items-center justify-center text-primary-foreground font-display font-black text-3xl shadow-[0_0_25px_hsla(var(--primary),0.6)] animate-pulse">
            R
          </div>
        </div>

        {/* Loading text with high-tech details */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping"></span>
            <p className="text-xs font-bold text-foreground tracking-[0.4em] uppercase shimmer-text">
              Racon<span className="text-primary">Pro</span>
            </p>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Spinner size="sm" variant="primary" />
            <span className="text-[10px] font-condensed font-semibold text-muted-foreground tracking-[0.2em] uppercase">
              Inicializando interfaz de torneo...
            </span>
          </div>
        </div>
      </div>

      {/* Futuristic HUD crosshair lines in corner (subtle details) */}
      <div className="absolute top-8 left-8 border-t border-l border-muted-foreground/20 w-6 h-6 pointer-events-none"></div>
      <div className="absolute top-8 right-8 border-t border-r border-muted-foreground/20 w-6 h-6 pointer-events-none"></div>
      <div className="absolute bottom-8 left-8 border-b border-l border-muted-foreground/20 w-6 h-6 pointer-events-none"></div>
      <div className="absolute bottom-8 right-8 border-b border-r border-muted-foreground/20 w-6 h-6 pointer-events-none"></div>
    </div>
  );
}
