import React, { useEffect } from 'react';

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
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 sm:p-6`}>

      {/* Telón de fondo (Backdrop) altamente desenfocado para destacar el modal */}
      <div 
        className="absolute inset-0 bg-background/60 backdrop-blur-md transition-opacity duration-500"
        onClick={onClose}
      />

      {/* Contenedor del Modal: Glassmorphism Premium */}
      <div 
        className={`w-full ${maxWidth} relative z-10 transform transition-all duration-300 animate-fade-in-up`}
      >
        {/* Línea superior táctica brillante */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80 z-20 shadow-[0_0_20px_hsla(var(--primary),0.6)] rounded-t-3xl"></div>
        
        {/* Brillo de fondo centralizado */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-primary/10 rounded-full blur-[60px] pointer-events-none -z-10"></div>

        <div className="bg-card/40 backdrop-blur-2xl border border-border/40 shadow-2xl rounded-3xl overflow-hidden flex flex-col">
          
          {/* Línea de escaneo decorativa */}
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none animate-scanline"></div>

          {/* Cabecera del Modal */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/30 relative z-10 bg-gradient-to-b from-card/30 to-transparent">
            {title && (
              <h3 className="text-xl md:text-2xl font-display font-black uppercase tracking-wider text-foreground">
                {title}
              </h3>
            )}
            <button 
              onClick={onClose}
              className="group rounded-full p-2 bg-background/50 border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 text-muted-foreground hover:text-primary shrink-0"
              aria-label="Cerrar modal"
            >
              <svg className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cuerpo del Contenido */}
          <div className="p-6 relative z-10 font-sans text-sm text-muted-foreground leading-relaxed max-h-[80vh] overflow-y-auto no-scrollbar">
            {children}
          </div>
          
        </div>
      </div>
    </div>
  );
}