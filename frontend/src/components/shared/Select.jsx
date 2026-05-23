import React, { forwardRef } from 'react';

const Select = forwardRef(({ 
  label, 
  error, 
  icon,
  options = [], 
  className = '', 
  ...props 
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-technical text-muted-foreground ml-1">
          {label}
        </label>
      )}
      
      <div className="relative group">
        {icon && (
          <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${error ? 'text-destructive' : 'text-muted-foreground group-focus-within:text-primary'}`}>
            {icon}
          </div>
        )}
        
        <select 
          ref={ref}
          className={`
            w-full bg-background/50 backdrop-blur-sm text-foreground border border-border/80 rounded-md px-4 py-2.5 
            appearance-none transition-all duration-300 outline-none shadow-sm
            font-sans text-sm cursor-pointer
            ${icon ? 'pl-11' : ''}
            ${error 
              ? 'border-destructive/50 focus:border-destructive focus:ring-2 focus:ring-destructive/30 focus:shadow-[0_0_15px_rgba(220,38,38,0.2)]' 
              : 'focus:border-primary/80 focus:ring-2 focus:ring-primary/30 hover:border-primary/50 focus:shadow-[0_0_15px_hsla(var(--primary),0.2)]'
            }
          `}
          {...props}
        >
          {/* Opción por defecto oculta */}
          <option value="" disabled hidden className="text-muted-foreground">
            Selecciona una opción...
          </option>
          
          {/* Opciones (Forzamos bg-background para que no se vea blanco en Windows/Mac) */}
          {options.map((opt, index) => (
            <option key={index} value={opt.value} className="bg-background text-foreground py-2">
              {opt.label}
            </option>
          ))}
        </select>

        {/* Flecha personalizada (chevron) */}
        <div className={`absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none transition-colors duration-300 ${error ? 'text-destructive' : 'text-muted-foreground group-focus-within:text-primary'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {error && (
        <span className="text-xs text-destructive font-medium animate-pulse ml-1">
          {error}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;