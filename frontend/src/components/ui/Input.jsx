import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  label, 
  error, 
  icon,
  className = '', 
  ...props 
}, ref) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        // Tipografía técnica con ligera transparencia y sombra suave
        <label className="text-technical text-muted-foreground ml-1 drop-shadow-sm">
          {label}
        </label>
      )}
      
      <div className="relative group">
        {/* Contenedor del ícono con animación de color en el focus */}
        {icon && (
          <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-500 z-10 ${error ? 'text-destructive' : 'text-muted-foreground group-focus-within:text-primary group-focus-within:drop-shadow-[0_0_8px_rgba(255,0,46,0.5)]'}`}>
            {icon}
          </div>
        )}
        
        {/* Brillo dinámico trasero (Focus Ring Glow) */}
        <div className={`absolute -inset-0.5 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500 pointer-events-none ${error ? 'bg-destructive/40' : 'bg-primary/30'}`}></div>

        <input 
          ref={ref}
          className={`
            relative w-full text-foreground border rounded-xl px-4 py-3 
            transition-all duration-300 outline-none
            font-sans text-sm shadow-inner
            /* Glassmorphism Base */
            bg-card/40 backdrop-blur-md
            ${icon ? 'pl-11' : ''}
            /* Estados */
            ${error 
              ? 'border-destructive/60 focus:border-destructive/80 focus:bg-destructive/5' 
              : 'border-border/50 focus:border-primary/60 hover:border-border focus:bg-card/60'
            }
          `}
          {...props}
        />
      </div>
      
      {error && (
        <span className="text-xs text-destructive font-medium animate-fade-in-up ml-1 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;