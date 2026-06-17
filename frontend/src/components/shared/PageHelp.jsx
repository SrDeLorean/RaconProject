import React, { useState } from 'react';
import Drawer from '@/components/ui/Drawer';

export default function PageHelp({ title, description, steps = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full bg-card/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-500 hover:scale-110 hover:shadow-[0_0_20px_hsla(var(--primary),0.5)] group"
        aria-label="Ayuda de la página"
      >
        <span className="text-2xl animate-pulse group-hover:animate-none">❓</span>
        {/* Glow dinámico */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>

      {/* Drawer de Ayuda */}
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          <div className="flex items-center gap-3 text-primary">
            <span className="text-2xl">📖</span>
            <span className="font-display tracking-widest uppercase">{title || 'Guía de Usuario'}</span>
          </div>
        }
        size="md"
      >
        <div className="space-y-6 mt-4 font-sans relative">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none"></div>

          {description && (
            <p className="text-sm text-foreground/90 leading-relaxed bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-md shadow-inner">
              {description}
            </p>
          )}

          <div className="space-y-6 mt-8 relative z-10">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-4 group">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-card border border-white/10 flex items-center justify-center font-black text-xs text-primary shadow-[0_4px_10px_rgba(0,0,0,0.2)] group-hover:bg-primary/10 group-hover:border-primary/40 transition-colors">
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-full bg-gradient-to-b from-primary/30 to-transparent group-hover:from-primary/60 transition-colors"></div>
                  )}
                </div>
                <div className="pb-6">
                  <h4 className="text-sm font-bold text-foreground mb-1 uppercase tracking-wide group-hover:text-primary transition-colors">
                    {step.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex justify-center text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Powered by Racon eSports Engine
            </p>
          </div>
        </div>
      </Drawer>
    </>
  );
}
