import React from 'react';

export default function GraficosColectivos({ stats, getImageUrl }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* Gráfico de Goles Colectivos */}
      <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-3xl p-6 space-y-4 shadow-lg glass-cyber text-left">
        <h3 className="text-xs font-display font-black text-foreground uppercase tracking-widest flex items-center gap-1.5 border-b border-border/40 pb-3">
          📊 Goles a Favor Colectivos por Escuadra
        </h3>
        {stats.equipos_goleadores && stats.equipos_goleadores.length > 0 ? (
          <div className="space-y-4 pt-2">
            {stats.equipos_goleadores.slice(0, 5).map((e, idx) => {
              const maxGoles = stats.equipos_goleadores[0]?.total_goles_favor || 100;
              const pct = (e.total_goles_favor / maxGoles) * 100;
              return (
                <div key={e.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-muted-foreground truncate max-w-[200px] font-bold">#{idx + 1} {e.nombre}</span>
                    <strong className="text-xs font-black text-primary">{e.total_goles_favor} GF</strong>
                  </div>
                  <div className="h-2 bg-muted/40 rounded-full overflow-hidden border border-border/10">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-destructive rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Sin reportes registrados.</p>
        )}
      </div>

      {/* Gráfico de Precisión de Pases Colectivo */}
      <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-3xl p-6 space-y-4 shadow-lg glass-cyber text-left">
        <h3 className="text-xs font-display font-black text-foreground uppercase tracking-widest flex items-center gap-1.5 border-b border-border/40 pb-3">
          📊 Precisión Media de Pases por Escuadra
        </h3>
        {stats.equipos_pases && stats.equipos_pases.length > 0 ? (
          <div className="space-y-4 pt-2">
            {stats.equipos_pases.slice(0, 5).map((e, idx) => {
              const pct = e.avg_precision_pases || 50;
              return (
                <div key={e.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-muted-foreground truncate max-w-[200px] font-bold">#{idx + 1} {e.nombre}</span>
                    <strong className="text-xs font-black text-emerald-400">{e.avg_precision_pases}%</strong>
                  </div>
                  <div className="h-2 bg-muted/40 rounded-full overflow-hidden border border-border/10">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Sin reportes registrados.</p>
        )}
      </div>

    </div>
  );
}
