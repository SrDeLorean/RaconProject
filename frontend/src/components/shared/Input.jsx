import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  label, 
  error, 
  icon,
  className = '', 
  ...props 
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        // 🌟 Tipografía técnica para los labels
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
        
        <input 
          ref={ref}
          className={`
            w-full bg-background/50 backdrop-blur-sm text-foreground border border-border/80 rounded-md px-4 py-2.5 
            transition-all duration-300 outline-none shadow-sm
            font-sans text-sm
            ${icon ? 'pl-11' : ''}
            ${error 
              ? 'border-destructive/50 focus:border-destructive focus:ring-2 focus:ring-destructive/30 focus:shadow-[0_0_15px_rgba(220,38,38,0.2)]' 
              : 'focus:border-primary/80 focus:ring-2 focus:ring-primary/30 hover:border-primary/50 focus:shadow-[0_0_15px_hsla(var(--primary),0.2)]'
            }
          `}
          {...props}
        />
      </div>
      
      {error && (
        <span className="text-xs text-destructive font-medium animate-pulse ml-1">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;