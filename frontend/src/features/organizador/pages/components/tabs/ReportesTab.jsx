import React from 'react';
import Button from '@/components/ui/Button';

export default function ReportesTab({ stats, navigate }) {
  const partidos = stats?.audits?.partidos || [];

  return (
    <div className="space-y-4">
      <div className="border-b border-border/10 pb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Partidos Pendientes de Reporte Oficial</h4>
            <p className="text-xs text-muted-foreground">Listado de encuentros oficiales jugados que aún no tienen estadísticas o marcadores cargados.</p>
          </div>
        </div>
      </div>

      {partidos.length === 0 ? (
        <div className="text-xs text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Todos los partidos en curso están al día con sus reportes oficiales.</span>
        </div>
      ) : (
        <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
          {partidos.map((partido) => (
            <div key={partido.id} className="p-4 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="flex items-center gap-2 bg-background/40 px-3 py-1 rounded-xl border border-border/10 font-bold text-xs">
                    <span className="text-foreground font-semibold">{partido.local}</span>
                    <span className="text-[10px] text-amber-500/80 font-black">VS</span>
                    <span className="text-foreground font-semibold">{partido.visitante}</span>
                  </div>
                  <span className="text-[9px] bg-background/50 border border-border/30 text-muted-foreground px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">{partido.competencia}</span>
                </div>
                
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                  <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Programado: <strong className="text-foreground font-semibold">{partido.fecha} {partido.hora || 'Por definir'}</strong> ({partido.organizacion})</span>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 text-[10px] font-bold border-amber-500/30 text-amber-500 hover:bg-amber-500/10 shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.05)] transition-all" 
                onClick={() => navigate('/organizador/partidos')}
              >
                Reportar Resultado
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
