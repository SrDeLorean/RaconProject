import React from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function CompeticionClub({ competencias, onInscribir }) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Ligas y Copas Disponibles</h3>
        <p className="text-xs text-muted-foreground">Inscribe a tu franquicia en los torneos del circuito oficial.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TARJETA DE TORNEO DE EJEMPLO */}
        <div className="p-5 border border-border/50 bg-background rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded uppercase">
                Inscripciones Abiertas
              </span>
            </div>
            <h4 className="font-bold text-foreground text-sm">Copa de Campeones 11v11</h4>
            <p className="text-xs text-muted-foreground">Fase de Grupos y Eliminación Directa • Servidores LATAM</p>
          </div>
          
          <Button 
            size="sm"
            className="bg-foreground text-background font-bold text-xs h-9 px-4 shrink-0"
            onClick={() => onInscribir(1)}
          >
            Inscribir Club
          </Button>
        </div>
      </div>
    </div>
  );
}