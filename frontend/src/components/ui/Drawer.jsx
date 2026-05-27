import React, { useEffect } from 'react';

export default function Drawer({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer 
}) {
  // Bloquear scroll de fondo
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <div className={`fixed inset-0 z-[90] ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Fondo atenuado translúcido */}
      <div 
        className={`fixed inset-0 bg-background/60 backdrop-blur-xs transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel lateral usando el acabado .glass-sidebar de tu main.css */}
      <div 
        className={`
          glass-sidebar fixed inset-y-0 right-0 w-full sm:max-w-md h-full 
          flex flex-col shadow-2xl transition-transform duration-500 ease-in-out z-10
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Efecto de escaneo láser decorativo de fondo */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none animate-scanline"></div>

        {/* HEADER DEL PANEL */}
        <div className="p-6 border-b border-border/30 flex items-center justify-between relative z-10">
          {title && (
            <h3 className="text-title-pro text-2xl tracking-wide">
              {title}
            </h3>
          )}
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-primary transition-colors font-bold text-base p-1"
          >
            ✕
          </button>
        </div>

        {/* CUERPO DEL FORMULARIO (Scroll con scrollbar táctica fina integrada) */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative z-10 flex flex-col gap-5">
          {children}
        </div>

        {/* FOOTER DEL PANEL (Acciones fijos en la parte inferior) */}
        {footer && (
          <div className="p-6 border-t border-border/30 bg-background/40 backdrop-blur-lg relative z-10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}