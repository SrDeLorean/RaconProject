import React from 'react';
import Card from './Card';

export default function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendLabel, 
  className = '' 
}) {
  return (
    <Card className={`group ${className}`} withGlow>
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          {/* Título técnico */}
          <h4 className="text-technical text-muted-foreground group-hover:text-foreground transition-colors">
            {title}
          </h4>
          
          {/* Número Gigante (Teko) */}
          <div className="text-amc-title text-4xl mt-1">
            {value}
          </div>

          {/* Tendencia (Ej: +5% este mes) */}
          {(trend !== undefined && trendLabel) && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-sm ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-destructive/10 text-destructive'}`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
              <span className="text-xs text-muted-foreground">{trendLabel}</span>
            </div>
          )}
        </div>

        {/* Icono Flotante con Glow */}
        {icon && (
          <div className="p-3 rounded-xl bg-primary/10 text-primary shadow-[0_0_15px_hsla(var(--primary),0.2)] border border-primary/20 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
            {icon}
          </div>
        )}
      </div>
      
      {/* Decoración inferior de scanline sutil */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-t from-primary/10 to-transparent"></div>
    </Card>
  );
}