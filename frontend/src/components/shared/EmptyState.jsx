import React from 'react';
import Button from '../ui/Button';

export default function EmptyState({ 
  icon, 
  title = "No hay datos disponibles", 
  description = "Aún no se han registrado elementos en esta sección.", 
  actionText, 
  onAction,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-10 text-center animate-fade-in border border-dashed border-border/40 rounded-xl bg-background/20 backdrop-blur-sm ${className}`}>
      
      {/* Contenedor del Icono con efecto radar */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute w-24 h-24 bg-primary/5 rounded-full animate-ping"></div>
        <div className="absolute w-16 h-16 bg-primary/10 rounded-full"></div>
        <div className="relative z-10 w-16 h-16 flex items-center justify-center text-muted-foreground bg-card border border-border/50 rounded-full shadow-inner">
          {icon || (
            <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          )}
        </div>
      </div>

      {/* Textos */}
      <h3 className="text-title-pro text-xl mb-2 text-foreground">{title}</h3>
      <p className="text-description max-w-sm mx-auto mb-6">
        {description}
      </p>

      {/* Botón de Acción Opcional */}
      {actionText && onAction && (
        <Button variant="outline" onClick={onAction} className="border-primary/50 text-primary hover:bg-primary/10">
          + {actionText}
        </Button>
      )}
    </div>
  );
}