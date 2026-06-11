import React from 'react';
import PartidosUt from '@/features/public/pages/PartidosUt';

export default function CalendarioJugadorUtTab() {
  return (
    <div className="space-y-4">
      <div className="border-b border-border/10 pb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Mi Calendario UT (1v1 y 2v2)</h4>
            <p className="text-xs text-muted-foreground">Consulta de fechas, horarios, contrincantes y reporte de tus partidos de Ultimate Team.</p>
          </div>
        </div>
      </div>

      <div className="bg-card/25 border border-border/40 rounded-3xl p-4 md:p-6 shadow-inner transition-all hover:border-primary/20">
        <PartidosUt forPlayer={true} hideHero={true} />
      </div>
    </div>
  );
}
