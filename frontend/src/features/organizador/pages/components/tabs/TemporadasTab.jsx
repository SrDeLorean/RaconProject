import React from 'react';
import Badge from '@/components/ui/Badge';

export default function TemporadasTab({ stats }) {
  const temporadas = stats?.audits?.temporadas || [];

  return (
    <div className="space-y-4">
      <div className="border-b border-border/10 pb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Control de Temporadas y Mercados de Pases</h4>
            <p className="text-xs text-muted-foreground">Estado de plazos, mercados y vigencia en las organizaciones activas.</p>
          </div>
        </div>
      </div>

      {temporadas.length === 0 ? (
        <div className="text-xs text-muted-foreground bg-card/45 border border-border/40 p-4 rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>No hay temporadas registradas bajo tus organizaciones.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {temporadas.map((temp) => (
            <div key={temp.id} className="p-4 bg-card/50 hover:bg-card border border-border/40 hover:border-primary/30 rounded-2xl space-y-3 transition-all duration-300 shadow-md">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-foreground uppercase tracking-wide">{temp.nombre}</span>
                <Badge variant={temp.activa ? 'success' : 'neutral'} className="text-[8px] uppercase tracking-wider font-bold">
                  {temp.activa ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
              <p className="text-[9px] bg-background/50 border border-border/20 text-muted-foreground px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider w-fit">{temp.organizacion}</p>
              
              <div className="flex justify-between items-center text-xs pt-2 border-t border-border/20">
                <span className="text-muted-foreground font-semibold">Mercado de Fichajes:</span>
                {temp.estado_mercado === 'abierto' ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Abierto
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    Cerrado
                  </span>
                )}
              </div>
              
              <div className="text-[10px] text-muted-foreground flex justify-between items-center bg-background/30 p-2 rounded-xl border border-border/10 font-mono">
                <span>Vigencia:</span>
                <span className="text-foreground font-semibold">
                  {temp.fecha_inicio ? new Date(temp.fecha_inicio).toLocaleDateString() : 'N/A'} - {temp.fecha_fin ? new Date(temp.fecha_fin).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
