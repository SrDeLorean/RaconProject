import React from 'react';

export default function Badge({ children, variant = 'neutral', className = '' }) {
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
    error: 'bg-destructive/10 text-destructive-foreground border-destructive/20 shadow-[0_0_10px_hsla(var(--destructive),0.2)]',
    neutral: 'bg-white/5 text-muted-foreground border-white/10',
    primary: 'bg-primary/10 text-primary border-primary/20 neon-glow'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-technical border ${variants[variant]} ${className}`}>
      {/* LED de estado integrado para variantes success y error */}
      {(variant === 'success' || variant === 'error') && (
        <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${variant === 'success' ? 'bg-emerald-400 animate-pulse' : 'bg-destructive'}`}></span>
      )}
      {children}
    </span>
  );
}