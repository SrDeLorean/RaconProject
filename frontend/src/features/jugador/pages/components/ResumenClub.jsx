import React from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function ResumenClub({ equipo, roster, competencias, onTabChange }) {
  // Cálculo rápido del estado de la plantilla
  const totalJugadores = roster.length;
  const esPlantillaValida = totalJugadores >= 11;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* WIDGET 1: PRÓXIMO COMPROMISO */}
      <div className="border border-border/50 bg-background rounded-xl p-5 flex flex-col justify-between shadow-sm md:col-span-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest font-bold text-destructive animate-pulse">● En Vivo / Próximo</span>
            <Badge variant="neutral">Liga Oficial</Badge>
          </div>
          
          <div className="flex items-center justify-center gap-8 py-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-black text-primary text-sm shadow-sm">
                {equipo.abreviatura}
              </div>
              <span className="text-xs font-bold text-foreground truncate max-w-[100px]">{equipo.nombre}</span>
            </div>
            
            <div className="text-center space-y-1">
              <span className="text-2xl font-display font-black tracking-wider text-muted-foreground">VS</span>
              <p className="text-[10px] text-muted-foreground font-mono">21:30 HRS</p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-lg bg-muted border border-border/40 flex items-center justify-center font-display font-black text-muted-foreground text-sm shadow-sm">
                EVO
              </div>
              <span className="text-xs font-bold text-foreground truncate max-w-[100px]">Evolution FC</span>
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full h-9 text-xs font-bold border-border/60 mt-2"
          onClick={() => onTabChange('competencias')}
        >
          Ver Vestuario y Estrategia
        </Button>
      </div>

      {/* WIDGET 2: ESTADO OPERATIVO (ALERTAS) */}
      <div className="border border-border/50 bg-muted/10 rounded-xl p-5 flex flex-col justify-between shadow-sm">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border/50 pb-2">Estado del Club</h3>
          
          <div className="space-y-3">
            {/* Alerta de Roster */}
            <div className="flex items-start gap-3 text-xs">
              <span className="mt-0.5">{esPlantillaValida ? '🟢' : '⚠️'}</span>
              <div className="flex-1">
                <p className="font-bold text-foreground">Plantilla ({totalJugadores}/11)</p>
                <p className="text-muted-foreground text-[11px]">
                  {esPlantillaValida ? 'Dispones del mínimo legal para competir.' : 'Necesitas al menos 11 jugadores inscritos.'}
                </p>
              </div>
            </div>

            {/* Alerta de Inscripciones */}
            <div className="flex items-start gap-3 text-xs">
              <span className="mt-0.5">🏆</span>
              <div className="flex-1">
                <p className="font-bold text-foreground">Torneos Activos</p>
                <p className="text-muted-foreground text-[11px]">
                  {competencias.length > 0 ? `Inscrito en ${competencias.length} competencia(s).` : 'No registras torneos vigentes esta semana.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button 
          className="w-full h-9 text-xs font-bold bg-foreground text-background mt-4"
          onClick={() => onTabChange(esPlantillaValida ? 'competencias' : 'roster')}
        >
          {esPlantillaValida ? 'Buscar Torneos' : 'Completar Plantilla'}
        </Button>
      </div>

    </div>
  );
}