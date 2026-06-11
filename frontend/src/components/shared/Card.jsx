import React from 'react';

export default function Card({ 
  children, 
  className = '', 
  padding = 'p-6',
  withGlow = false,    // Añade el brillo esférico de fondo (ideal para tarjetas destacadas)
  hoverLift = false,   // Activa la elevación e iluminación del borde al pasar el cursor
}) {
  return (
    <div className={`
      relative overflow-hidden rounded-3xl transition-all duration-500
      bg-card/40 backdrop-blur-xl border border-border/40 shadow-xl
      ${hoverLift ? 'hover:border-primary/50 hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5),0_0_30px_hsla(var(--primary),0.15)] hover:-translate-y-1.5' : ''}
      ${className}
    `}>
      {/* Resplandor decorativo opcional para tarjetas destacadas */}
      {withGlow && (
        <>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[60px] pointer-events-none transition-transform duration-700 group-hover:scale-150 z-0"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none transition-transform duration-700 delay-150 group-hover:scale-150 z-0"></div>
        </>
      )}
      
      {/* Línea superior táctica sutil (Cyber aesthetic) */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-60"></div>
      
      {/* Fondo texturizado muy suave */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none z-0"></div>

      <div className={`relative z-10 ${padding}`}>
        {children}
      </div>
    </div>
  );
}