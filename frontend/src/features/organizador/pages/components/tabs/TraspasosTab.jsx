import React from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function TraspasosTab({ stats, navigate }) {
  const traspasos = stats?.audits?.traspasos || [];

  return (
    <div className="space-y-4">
      <div className="border-b border-border/10 pb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Traspasos y Solicitudes de Fichaje / Despido</h4>
            <p className="text-xs text-muted-foreground">Revisiones y firmas de contratos y bajas de la temporada.</p>
          </div>
        </div>
      </div>

      {traspasos.length === 0 ? (
        <div className="text-xs text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>No tienes solicitudes de fichaje o despido pendientes de firma.</span>
        </div>
      ) : (
        <div className="space-y-3">
          {traspasos.map((traspaso) => (
            <div key={traspaso.id} className="p-4 bg-card/50 hover:bg-card border border-border/40 hover:border-primary/30 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-sm font-black text-foreground">{traspaso.jugador}</span>
                  <Badge variant={traspaso.tipo === 'despido' ? 'error' : 'brand'} className="uppercase text-[8px] font-black px-2 py-0.5 rounded-full">
                    {traspaso.tipo === 'despido' ? 'Despido / Libre' : 'Fichaje'}
                  </Badge>
                  <span className="text-[9px] bg-background/50 border border-border/30 text-muted-foreground px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">{traspaso.organizacion}</span>
                </div>
                
                {/* Visual Transfer Road: Origen -> Destino */}
                <div className="flex items-center gap-3 text-xs bg-background/30 p-2 rounded-xl border border-border/10 w-fit">
                  <span className="text-muted-foreground font-semibold">Origen:</span>
                  <strong className="text-foreground">{traspaso.equipo_origen || 'Agente Libre'}</strong>
                  <svg className="w-4 h-4 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                  <span className="text-muted-foreground font-semibold">Destino:</span>
                  <strong className="text-foreground">{traspaso.equipo_destino || 'Agente Libre'}</strong>
                </div>
              </div>
              
              <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-background/45 px-2.5 py-1.5 rounded-lg border border-border/10">
                  <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{new Date(traspaso.fecha).toLocaleDateString()}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 text-[10px] font-bold border-primary/30 text-primary hover:bg-primary/10 transition-all shadow-[0_0_10px_rgba(var(--primary),0.05)]" 
                  onClick={() => navigate('/organizador/traspasos')}
                >
                  Firmar / Revisar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
