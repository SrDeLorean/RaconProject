import React from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/shared/Card';

export default function OfertasJugadorTab({ solicitudes, isProcessing, handleResponder }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-border/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
            <svg className="w-5 h-5 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-display font-black text-foreground uppercase tracking-wider">Propuestas Contractuales</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Gestiona y responde las ofertas de fichaje de los clubes del circuito.</p>
          </div>
        </div>
      </div>

      {solicitudes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {solicitudes.map((sol, index) => (
            <Card 
              key={sol.id} 
              className={`flex flex-col justify-between gap-6 stagger-${index + 1} animate-fade-in-up`}
              padding="p-6"
              hoverLift={true}
              withGlow={true}
            >
              <div className="space-y-4 text-left relative z-10">
                <div className="flex items-center justify-between">
                  <Badge variant="primary" className="text-[9px]">
                    {sol.organizacion?.nombre || 'E-sports Liga'}
                  </Badge>
                  <div className="bg-background/80 backdrop-blur-sm border border-border/50 px-3 py-1 rounded-lg">
                    <span className="text-[10px] font-mono text-muted-foreground font-bold uppercase tracking-wider">Dorsal Ofrecido: <strong className="text-primary font-black text-sm">#{sol.dorsal || 'N/A'}</strong></span>
                  </div>
                </div>

                <div>
                  <h4 className="font-display font-black text-2xl text-foreground uppercase tracking-wide">
                    {sol.equipo?.nombre || 'Club Interesado'}
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-xs text-muted-foreground leading-normal">
                      Puesto: <strong className="text-foreground font-semibold">{sol.posicion || 'Sin asignar'}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/20 relative z-10">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
                  disabled={isProcessing === sol.id}
                  onClick={() => handleResponder(sol.id, 'rechazar')}
                >
                  Rechazar
                </Button>
                <Button 
                  variant="primary"
                  size="sm" 
                  className="flex-1"
                  disabled={isProcessing === sol.id}
                  onClick={() => handleResponder(sol.id, 'aceptar')}
                >
                  {isProcessing === sol.id ? 'Procesando...' : 'Aceptar Fichaje'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="w-full border border-dashed border-border/60 bg-card/10 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center text-center gap-5 py-20 transition-all hover:border-primary/30 hover:bg-card/30 duration-500">
          <div className="w-16 h-16 rounded-2xl bg-muted/20 border border-border/30 flex items-center justify-center shadow-inner relative group-hover:scale-110 transition-transform">
            <div className="absolute inset-0 bg-primary/5 rounded-2xl animate-pulse"></div>
            <svg className="w-8 h-8 text-muted-foreground relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v2m16 4h-2a2 2 0 00-2 2v3a2 2 0 002 2h2a2 2 0 002-2v-3a2 2 0 00-2-2zM6 20h.01" />
            </svg>
          </div>
          <div className="space-y-2 max-w-sm">
            <h3 className="font-display font-black text-xl text-foreground uppercase tracking-widest">Buzón Vacío</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No tienes propuestas de fichaje en este momento. Los capitanes y directores técnicos pueden enviarte ofertas si figuras en la bolsa de agentes libres.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
