import React, { useEffect } from 'react';
import Button from './Button';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'max-w-md',
  zIndex = 'z-[100]'
}) {
  // Bloquear el scroll de la página de fondo cuando el modal esté abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4`}>

      {/* Telón de fondo oscuro translúcido con desenfoque (Glassmorphism Overlay) */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Contenedor del Modal usando tu armadura .glass-card */}
      <div className={`glass-card w-full ${maxWidth} p-6 relative z-10 transform transition-all duration-300 animate-fade-in flex flex-col gap-4 overflow-hidden`}>
        {/* Línea de escaneo decorativa sutil de fondo */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none animate-scanline"></div>

        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-border/30 pb-3 relative z-10">
          {title && (
            <h3 className="text-title-pro text-2xl tracking-wide">
              {title}
            </h3>
          )}
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-primary transition-colors text-lg p-1 font-bold"
          >
            
          </button>
        </div>

        {/* Cuerpo del Contenido */}
        <div className="relative z-10 font-sans text-sm text-foreground/90 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}