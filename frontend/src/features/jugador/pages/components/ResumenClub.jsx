import React, { useMemo } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function ResumenClub({ equipo, roster = [], competencias = [], onTabChange }) {
  const totalJugadores = roster.length;
  const esPlantillaValida = totalJugadores >= 11;

  // Distribution of positions
  const positionDistribution = useMemo(() => {
    const counts = { por: 0, df: 0, mc: 0, dl: 0, sin: 0 };
    roster.forEach(player => {
      const pos = (player.posicion || player.posicion_bloque || '').toUpperCase();
      if (['PO', 'POR', 'GK', 'PORTERO'].some(x => pos.includes(x))) {
        counts.por++;
      } else if (['DF', 'DFC', 'LD', 'LI', 'CB', 'LB', 'RB', 'DEFENSA'].some(x => pos.includes(x))) {
        counts.df++;
      } else if (['MC', 'MCO', 'MCD', 'MI', 'MD', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MEDIO', 'VOLANTE'].some(x => pos.includes(x))) {
        counts.mc++;
      } else if (['DC', 'EI', 'ED', 'ST', 'LW', 'RW', 'CF', 'DELANTERO', 'ATACANTE'].some(x => pos.includes(x))) {
        counts.dl++;
      } else {
        counts.sin++;
      }
    });
    return counts;
  }, [roster]);

  return (
    <div className="space-y-6">
      
      {/* Grilla Superior: Scoreboard y Estado Operativo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SCOREBOARD DE PRÓXIMO ENCUENTRO */}
        <div className="border border-border/40 bg-card/25 rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden lg:col-span-2 space-y-4">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-primary animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                Siguiente Encuentro Programado
              </span>
              <Badge variant="brand" className="uppercase text-[9px] font-black tracking-widest px-2 py-0.5">OFICIAL PRO</Badge>
            </div>
            
            <div className="flex items-center justify-center gap-8 py-6">
              
              {/* Local Team */}
              <div className="flex flex-col items-center gap-3 flex-1 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-destructive/10 border border-primary/20 flex items-center justify-center font-display font-black text-primary text-xl shadow-lg overflow-hidden shrink-0">
                  {equipo.logo ? (
                    <img 
                      src={equipo.logo.startsWith('http') ? equipo.logo : `http://localhost:8000${equipo.logo}`} 
                      alt={equipo.nombre} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    equipo.abreviatura
                  )}
                </div>
                <span className="text-xs font-black text-foreground uppercase tracking-wide truncate max-w-[130px]">{equipo.nombre}</span>
              </div>
              
              {/* VS Indicator */}
              <div className="text-center space-y-2 shrink-0">
                <span className="text-3xl font-display font-black tracking-widest text-muted-foreground/30">VS</span>
                <div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                  <p className="text-[9px] text-primary font-mono font-bold tracking-widest">TRANSMISIÓN LIVE</p>
                </div>
              </div>

              {/* Rival Team (Simulado o Próximo del calendario) */}
              <div className="flex flex-col items-center gap-3 flex-1 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted border border-border/40 flex items-center justify-center font-display font-black text-muted-foreground text-xl shadow-lg shrink-0">
                  RIV
                </div>
                <span className="text-xs font-black text-foreground uppercase tracking-wide truncate max-w-[130px]">Rival por sortear</span>
              </div>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full h-10 text-xs font-black uppercase tracking-widest border-border/50 hover:bg-primary/10 hover:border-primary/30 mt-2"
            onClick={() => onTabChange('calendario')}
          >
            📋 Abrir Calendario y Fechas
          </Button>
        </div>

        {/* ESTADO OPERATIVO / ALERTAS */}
        <div className="border border-border/40 bg-card/25 rounded-3xl p-6 flex flex-col justify-between shadow-xl space-y-4">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest border-b border-border/20 pb-2">Auditoría del Club</h3>
            
            <div className="space-y-4">
              {/* Alerta de Roster */}
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 border ${
                  esPlantillaValida ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse'
                }`}>
                  {esPlantillaValida ? '✓' : '⚠️'}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">Reglamento de Plantilla ({totalJugadores}/11)</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    {esPlantillaValida 
                      ? 'Roster con mínimo legal de inscripción completo.' 
                      : 'Faltan jugadores para alcanzar el mínimo reglamentario.'
                    }
                  </p>
                </div>
              </div>

              {/* Alerta de Inscripciones */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs shrink-0 text-primary">
                  🏆
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">Torneos y Fechas</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    {competencias.length > 0 
                      ? `Inscrito formalmente en ${competencias.length} divisiones de la liga.` 
                      : 'El club no se encuentra registrado en torneos esta semana.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button 
            className="w-full h-10 text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground hover:shadow-[0_0_15px_rgba(232,0,29,0.3)]"
            onClick={() => onTabChange(esPlantillaValida ? 'competencias' : 'roster')}
          >
            {esPlantillaValida ? '🏆 Buscar Torneos' : '👥 Fichar Jugadores'}
          </Button>
        </div>

      </div>

      {/* Grilla Inferior: Distribución de Tácticas / Posiciones */}
      <div className="border border-border/40 bg-card/25 rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Distribución de Posiciones en el Roster</h3>
          <p className="text-[11px] text-muted-foreground">Estructura táctica y balance de la plantilla activa.</p>
        </div>

        {totalJugadores === 0 ? (
          <p className="text-xs text-muted-foreground">Ficha jugadores para visualizar la distribución táctica.</p>
        ) : (
          <div className="space-y-4">
            {/* Barra de Distribución */}
            <div className="h-3.5 w-full bg-muted rounded-full overflow-hidden flex border border-border/30">
              {positionDistribution.por > 0 && <div className="h-full bg-yellow-500 transition-all hover:opacity-80" style={{ width: `${(positionDistribution.por / totalJugadores) * 100}%` }} title="Porteros" />}
              {positionDistribution.df > 0 && <div className="h-full bg-blue-500 transition-all hover:opacity-80" style={{ width: `${(positionDistribution.df / totalJugadores) * 100}%` }} title="Defensas" />}
              {positionDistribution.mc > 0 && <div className="h-full bg-green-500 transition-all hover:opacity-80" style={{ width: `${(positionDistribution.mc / totalJugadores) * 100}%` }} title="Mediocampistas" />}
              {positionDistribution.dl > 0 && <div className="h-full bg-red-500 transition-all hover:opacity-80" style={{ width: `${(positionDistribution.dl / totalJugadores) * 100}%` }} title="Delanteros" />}
              {positionDistribution.sin > 0 && <div className="h-full bg-muted-foreground/40 transition-all hover:opacity-80" style={{ width: `${(positionDistribution.sin / totalJugadores) * 100}%` }} title="Sin Asignar" />}
            </div>

            {/* Leyenda de Posiciones */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded bg-yellow-500 block shrink-0" />
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Porteros: <strong className="text-foreground">{positionDistribution.por}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded bg-blue-500 block shrink-0" />
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Defensas: <strong className="text-foreground">{positionDistribution.df}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded bg-green-500 block shrink-0" />
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Medios: <strong className="text-foreground">{positionDistribution.mc}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded bg-red-500 block shrink-0" />
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Delanteros: <strong className="text-foreground">{positionDistribution.dl}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded bg-muted-foreground/40 block shrink-0" />
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Sin Rol: <strong className="text-foreground">{positionDistribution.sin}</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}