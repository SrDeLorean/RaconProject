import React from 'react';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  isLoading = false, 
  className = '',
  ...props 
}) {
  
  // Base común: flex, uppercase, animaciones, ring de focus y diseño base.
  const baseStyles = "relative inline-flex items-center justify-center gap-2 rounded-xl font-bold uppercase tracking-[0.15em] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden group";
  
  // Variantes con diseño Premium
  const variants = {
    // Principal: Gradiente intenso, sombra glow, elevación al hover.
    primary: "bg-gradient-to-r from-[hsl(var(--primary))] to-[hsla(var(--primary),0.85)] text-[hsl(var(--primary-foreground))] shadow-[0_8px_20px_-6px_hsla(var(--primary),0.6)] hover:shadow-[0_15px_25px_-6px_hsla(var(--primary),0.7)] hover:-translate-y-0.5 border-none",
    
    // Peligro: Gradiente rojo profundo
    destructive: "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_8px_20px_-6px_rgba(220,38,38,0.5)] hover:shadow-[0_15px_25px_-6px_rgba(220,38,38,0.6)] hover:-translate-y-0.5 border-none",
    
    // Éxito: Verde esmeralda
    success: "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)] hover:shadow-[0_15px_25px_-6px_rgba(16,185,129,0.6)] hover:-translate-y-0.5 border-none",

    // Secundario: Transparente con borde luminoso
    secondary: "bg-primary/5 border border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60 hover:shadow-[0_0_15px_hsla(var(--primary),0.2)] backdrop-blur-md",
    
    // Outline: Borde grueso clásico
    outline: "bg-transparent border-2 border-border/80 text-foreground hover:bg-muted/50 hover:border-primary/50 hover:text-primary backdrop-blur-sm",
    
    // Fantasma: Invisible hasta el hover
    ghost: "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
  };

  const sizes = {
    sm: "h-9 px-4 text-[10px]",
    md: "h-11 px-6 text-xs",
    lg: "h-14 px-8 text-sm"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {/* Efecto de barrido (Shimmer) en hover para variantes con gradiente */}
      {(variant === 'primary' || variant === 'destructive' || variant === 'success') && (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
      )}

      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          CARGANDO...
        </span>
      ) : children}
    </button>
  );
}