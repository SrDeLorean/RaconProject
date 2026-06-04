import React from 'react';
import Button from '@/components/ui/Button';

export default function OfertasJugadorTab({ solicitudes, isProcessing, handleResponder }) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border/10 pb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
          </svg>
          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Propuestas Contractuales y Ofertas</h4>
            <p className="text-xs text-muted-foreground">Revisa y responde las ofertas de fichaje de los clubes del circuito.</p>
          </div>
        </div>
      </div>

      {solicitudes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {solicitudes.map((sol) => (
            <div key={sol.id} className="border border-border/40 bg-card/60 hover:bg-card p-6 flex flex-col justify-between gap-5 relative overflow-hidden rounded-2xl shadow-xl hover:border-primary/40 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {sol.organizacion?.nombre || 'E-sports Liga'}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground font-bold">Dorsal Ofrecido: <strong className="text-primary font-bold">#{sol.dorsal || 'N/A'}</strong></span>
                </div>

                <div>
                  <h4 className="font-display font-black text-lg text-foreground uppercase tracking-wide">
                    {sol.equipo?.nombre || 'Club Interesado'}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-normal mt-1">
                    Propuesta para jugar en la posición: <strong className="text-foreground font-semibold">{sol.posicion || 'Sin asignar'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-border/30 z-10">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 h-9 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 font-bold transition-all rounded-xl"
                  disabled={isProcessing === sol.id}
                  onClick={() => handleResponder(sol.id, 'rechazar')}
                >
                  Rechazar
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 h-9 text-xs bg-primary text-primary-foreground font-black shadow-[0_0_10px_hsla(var(--primary),0.3)] hover:shadow-[0_0_18px_hsla(var(--primary),0.5)] transition-all rounded-xl"
                  disabled={isProcessing === sol.id}
                  onClick={() => handleResponder(sol.id, 'aceptar')}
                >
                  {isProcessing === sol.id ? 'Procesando...' : 'Aceptar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 border border-dashed border-border/60 bg-muted/5 rounded-3xl flex flex-col items-center justify-center text-center gap-4 py-16 transition-all hover:border-primary/20 duration-300">
          <div className="w-12 h-12 rounded-full bg-muted/30 border border-border/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v2m16 4h-2a2 2 0 00-2 2v3a2 2 0 002 2h2a2 2 0 002-2v-3a2 2 0 00-2-2zM6 20h.01" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Sin ofertas pendientes</h3>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Tu buzón de traspasos está vacío. Los capitanes de clubes pueden enviarte ofertas si buscas un equipo en sus ligas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
