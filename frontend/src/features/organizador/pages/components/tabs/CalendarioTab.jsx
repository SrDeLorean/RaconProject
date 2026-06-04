import React from 'react';
import Partidos from '@/features/public/pages/Partidos';

export default function CalendarioTab() {
  return (
    <div className="space-y-4">
      <div className="border-b border-border/10 pb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Calendario Oficial de mis Competencias</h4>
            <p className="text-xs text-muted-foreground">Consulta de fechas, horarios y estado de encuentros en curso y futuros.</p>
          </div>
        </div>
      </div>

      <div className="bg-card/25 border border-border/40 rounded-3xl p-4 md:p-6 shadow-inner transition-all hover:border-primary/20">
        <Partidos forOrganizer={true} hideHero={true} />
      </div>
    </div>
  );
}
