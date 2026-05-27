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
  
  // Base común para todos los botones
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-md font-bold uppercase tracking-[0.15em] transition-all duration-300 focus:outline-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Clases puras de Tailwind que reemplazan a las clases CSS personalizadas
  const variants = {
    primary: "bg-gradient-to-r from-[hsl(var(--primary))] to-[hsla(var(--primary),0.8)] text-[hsl(var(--primary-foreground))] shadow-[0_8px_25px_-8px_hsla(var(--primary),0.5)] hover:translate-y-[-2px] hover:shadow-[0_12px_30px_-8px_hsla(var(--primary),0.7)] border-none",
    
    secondary: "bg-[hsla(var(--primary),0.1)] border border-[hsla(var(--primary),0.3)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white hover:shadow-[0_0_20px_hsla(var(--primary),0.3)] hover:border-transparent backdrop-blur-sm",
    
    outline: "bg-transparent border-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary),0.1)]",
    
    ghost: "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
  };

  const sizes = {
    sm: "h-8 px-4 text-[10px]",
    md: "h-12 px-6 text-xs",
    lg: "h-14 px-8 text-sm"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2 animate-pulse">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          PROCESANDO...
        </span>
      ) : children}
    </button>
  );
}