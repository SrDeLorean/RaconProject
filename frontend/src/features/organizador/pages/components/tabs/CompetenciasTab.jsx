import React from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function CompetenciasTab({ stats, navigate }) {
  const competencias = stats?.audits?.competencias || [];

  return (
    <div className="space-y-4">
      <div className="border-b border-border/10 pb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c2.21 0 4-1.79 4-4V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v5c0 2.21 1.79 4 4 4zm0 0v6m-4 0h8M4 7h2m12 0h2" />
          </svg>
          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Estructura y Configuración de Competencias / Ligas</h4>
            <p className="text-xs text-muted-foreground">Monitoreo de configuraciones deportivas, logotipos y alineaciones.</p>
          </div>
        </div>
      </div>

      {competencias.length === 0 ? (
        <div className="text-xs text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Todas las competencias tienen una estructura deportiva y de branding completa.</span>
        </div>
      ) : (
        <div className="space-y-3">
          {competencias.map((comp) => (
            <div key={comp.id} className="p-5 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/30 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 shadow-md">
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-foreground uppercase tracking-wide">{comp.nombre}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">({comp.organizacion})</span>
                  <Badge variant="neutral" className="uppercase text-[8px] font-bold px-2 py-0.5 rounded-full">{comp.estado}</Badge>
                </div>
                <div className="space-y-2">
                  {comp.warnings.map((warn, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground leading-normal">
                      <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-[10px] font-bold shrink-0 h-8 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-all" 
                onClick={() => navigate(`/organizador/competencias/${comp.id}`)}
              >
                Gestionar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
