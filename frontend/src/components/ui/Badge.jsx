import React from 'react';

export default function Badge({ children, variant = 'neutral', className = '' }) {
  const variants = {
    // Éxito: Verde luminoso
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
    
    // Error/Peligro: Rojo intenso
    error: 'bg-destructive/15 text-destructive-foreground border-destructive/30 shadow-[0_0_12px_hsla(var(--destructive),0.3)]',
    
    // Advertencia: Dorado/Amarillo
    warning: 'bg-amber-500/15 text-amber-500 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
    
    // Información: Azul eléctrico
    info: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]',
    
    // Neutral: Gris claro transparente
    neutral: 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 transition-colors',
    
    // Primario: Color de la competencia con fuerte neón
    primary: 'bg-primary/15 text-primary border-primary/40 shadow-[0_0_15px_hsla(var(--primary),0.3)] backdrop-blur-sm'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-technical border backdrop-blur-md transition-all duration-300 ${variants[variant]} ${className}`}>
      {/* LED de estado integrado para variantes dinámicas */}
      {(variant === 'success' || variant === 'error' || variant === 'warning' || variant === 'info' || variant === 'primary') && (
        <span className={`mr-1.5 h-1.5 w-1.5 rounded-full shrink-0 shadow-lg ${
          variant === 'success' ? 'bg-emerald-400 shadow-emerald-500/50' : 
          variant === 'error' ? 'bg-destructive shadow-destructive/50 animate-pulse' : 
          variant === 'warning' ? 'bg-amber-400 shadow-amber-500/50' :
          variant === 'info' ? 'bg-cyan-400 shadow-cyan-500/50' :
          'bg-primary shadow-primary/50'
        }`}></span>
      )}
      <span className="mt-0.5 tracking-[0.1em]">{children}</span>
    </span>
  );
}