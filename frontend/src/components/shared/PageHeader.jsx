import React from 'react';
import Badge from '../ui/Badge';

export default function PageHeader({ 
  badge, 
  title, 
  titleHighlight, 
  subtitle, 
  actions 
}) {
  return (
    <div className="flex flex-col gap-5 text-left w-full border-b border-border/40 pb-6 mb-8 relative">
      
      {/* Badge Superior */}
      {badge && (
        <div className="flex">
          <Badge variant="primary" className="h-7 px-3 text-[9px] font-condensed tracking-widest font-black uppercase">
            ⚡ {badge}
          </Badge>
        </div>
      )}

      {/* Título Gigante con Estética eSports */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 w-full">
        <div className="space-y-3 max-w-4xl">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-black leading-[0.85] uppercase tracking-tight text-foreground drop-shadow-md">
            {title}
            {titleHighlight && (
              <>
                {' '}
                <span className="bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-primary text-transparent text-glow-red font-black tracking-tighter">
                  {titleHighlight}
                </span>
              </>
            )}
          </h1>

          {/* Subtítulo Outfit de alta legibilidad */}
          {subtitle && (
            <p className="text-sm md:text-base text-muted-foreground max-w-[680px] font-sans font-light leading-relaxed tracking-wide mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Acciones del Header */}
        {actions && (
          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0">
            {actions}
          </div>
        )}
      </div>

    </div>
  );
}
