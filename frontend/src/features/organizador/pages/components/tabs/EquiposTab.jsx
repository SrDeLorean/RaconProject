import React from 'react';
import Badge from '@/components/ui/Badge';

export default function EquiposTab({ stats }) {
  const warnings = stats?.audits?.equipos || [];

  return (
    <div className="space-y-4 text-left">
      <div className="border-b border-border/10 pb-2">
        <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">👥 Auditoría de Equipos (Plantillas y Capitanes)</h4>
        <p className="text-xs text-muted-foreground">Verificación de plantillas, capitanes activos e IDs de EA Sports.</p>
      </div>

      {warnings.length === 0 ? (
        <div className="p-8 border border-dashed border-emerald-500/30 bg-emerald-500/5 rounded-2xl text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-xl">🛡️</div>
          <p className="text-sm font-bold text-emerald-400 mt-3">Rosters & Capitanes Verificados</p>
          <p className="text-xs text-muted-foreground mt-1">Todos los equipos participantes cuentan con plantillas, capitán asignado y EA ID registrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {warnings.map((warning, idx) => {
            const isCritical = warning.tipo === 'plantilla_vacia' || warning.tipo === 'sin_capitan';
            const iconSvg = 
              warning.tipo === 'sin_capitan' ? (
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              ) : warning.tipo === 'plantilla_vacia' ? (
                <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              );

            return (
              <div 
                key={idx} 
                className={`p-4 bg-card/45 border rounded-2xl flex items-start gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg shadow-sm ${
                  isCritical ? 'border-destructive/20 hover:border-destructive/40 hover:shadow-destructive/5' : 'border-amber-500/20 hover:border-amber-500/40 hover:shadow-amber-500/5'
                }`}
              >
                {/* Status Icon */}
                <div className={`p-2.5 rounded-xl shrink-0 bg-background border ${
                  isCritical ? 'border-destructive/20' : 'border-amber-500/20'
                }`}>
                  {iconSvg}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-foreground truncate">{warning.nombre}</span>
                    <Badge variant={isCritical ? 'error' : 'warning'} className="uppercase text-[8px] font-black tracking-wider shrink-0">
                      {warning.tipo === 'plantilla_vacia' ? 'Sin Roster' : warning.tipo === 'sin_capitan' ? 'Sin Cap' : 'Sin EA ID'}
                    </Badge>
                  </div>
                  <span className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider block">{warning.organizacion}</span>
                  <p className="text-[11px] text-muted-foreground leading-normal font-sans pt-1 font-light">{warning.mensaje}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
