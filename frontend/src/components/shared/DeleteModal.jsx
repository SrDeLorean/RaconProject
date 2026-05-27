import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function DeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isDeleting, 
  title = "Acción Destructiva", 
  message = "¿Estás completamente seguro de que deseas eliminar este registro? Esta acción no se puede deshacer." 
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="flex flex-col gap-6">
        
        <div className="text-center relative py-2 mt-4">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-destructive/20 rounded-full blur-xl animate-pulse pointer-events-none"></div>
          
          <div className="relative w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 text-destructive flex items-center justify-center text-2xl mx-auto mb-5 shadow-[0_0_15px_hsla(var(--destructive),0.2)]">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          
          <h4 className="text-xl font-display font-black text-foreground mb-2 uppercase tracking-wide">
            Confirmar Eliminación
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed px-2">
            {message}
          </p>
        </div>

        {/* Contenedor de Botones */}
        <div className="flex gap-3 mt-4 w-full">
          <Button 
            variant="outline" 
            className="flex-1 border-border/50 text-foreground hover:bg-muted" 
            onClick={onClose} 
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          
          {/* 🌟 AJUSTE: Clases explícitas para forzar el diseño destructivo (rojo) */}
          <Button 
            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[0_0_15px_hsla(var(--destructive),0.5)] border-transparent" 
            onClick={onConfirm} 
            isLoading={isDeleting}
          >
            Sí, Eliminar
          </Button>
        </div>
      </div>
    </Modal>
  );
}