import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function CompeticionClub({ competencias = [], onInscribir }) {
  const navigate = useNavigate();

  // Separar en inscritas y disponibles
  const inscritas = useMemo(() => {
    return competencias.filter(comp => comp.estado_inscripcion !== null);
  }, [competencias]);

  const disponibles = useMemo(() => {
    return competencias.filter(comp => comp.estado_inscripcion === null);
  }, [competencias]);

  const yaInscrito = inscritas.length > 0;

  return (
    <div className="space-y-8">
      
      {/* SECCIÓN 1: COMPETENCIAS INSCRITAS (ASIGNADAS) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
            🏆 Mis Competencias Activas
          </h3>
          <p className="text-xs text-muted-foreground">Torneos en curso y ligas oficiales en las que está asignado tu club.</p>
        </div>

        {inscritas.length === 0 ? (
          <div className="p-8 border border-dashed border-border/50 bg-muted/5 rounded-2xl text-center text-xs text-muted-foreground py-10">
            🛡️ Tu club aún no cuenta con inscripciones activas aprobadas en este circuito.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inscritas.map((comp) => {
              const badgeVariant = comp.estado_inscripcion === 'pendiente' ? 'warning' : 'success';
              return (
                <div key={comp.id} className="p-5 border border-border/40 bg-card/25 rounded-2xl flex flex-col justify-between gap-4 shadow-md hover:border-primary/20 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={badgeVariant} className="uppercase text-[8px] font-black tracking-widest px-2 py-0.5">
                        {comp.estado_inscripcion === 'pendiente' ? 'Postulación Pendiente' : 'Inscrito y Activo'}
                      </Badge>
                      <span className="text-[9px] text-muted-foreground uppercase font-mono">{comp.plataforma}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm uppercase">{comp.nombre}</h4>
                      <p className="text-xs text-muted-foreground font-light mt-0.5">{comp.formato}</p>
                    </div>
                    {/* Detalles adicionales */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground border-t border-border/20 pt-2 font-mono">
                      <span>Prize Pool: <strong className="text-foreground">${comp.prize_pool || '0.00'}</strong></span>
                      <span>Inscripción: <strong className="text-foreground">${comp.entry_fee || '0.00'}</strong></span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-border/20">
                    <Button 
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-[10px] font-black uppercase tracking-wider whitespace-nowrap"
                      onClick={() => navigate(`/competencia-detalle/${comp.id}`)}
                    >
                      Ver Ficha de Liga
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECCIÓN 2: CONVOCATORIAS DISPONIBLES (PARA INSCRIPCIÓN) */}
      <div className="space-y-4 pt-6 border-t border-border/20">
        <div className="space-y-2">
          <div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
              📢 Convocatorias y Ligas Habilitadas
            </h3>
            <p className="text-xs text-muted-foreground">Torneos abiertos para la inscripción de nuevos clubes en este circuito.</p>
          </div>
          
          {yaInscrito && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-[11px] font-bold leading-relaxed flex items-center gap-2">
              <span>⚠️</span>
              <span>
                Participación limitada: Tu club ya está compitiendo en <strong>{inscritas[0].nombre}</strong>. El reglamento permite un máximo de una (1) competencia activa por circuito/organización.
              </span>
            </div>
          )}
        </div>

        {disponibles.length === 0 ? (
          <div className="p-8 border border-dashed border-border/50 bg-muted/5 rounded-2xl text-center text-xs text-muted-foreground py-10">
            📭 No hay nuevas convocatorias abiertas para inscripciones en este circuito en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {disponibles.map((comp) => (
              <div key={comp.id} className="p-5 border border-border/40 bg-card/25 rounded-2xl flex flex-col justify-between gap-4 shadow-md hover:border-primary/20 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="brand" className="uppercase text-[8px] font-black tracking-widest px-2 py-0.5">Inscripciones Abiertas</Badge>
                    <span className="text-[9px] text-muted-foreground uppercase font-mono">{comp.plataforma}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm uppercase">{comp.nombre}</h4>
                    <p className="text-xs text-muted-foreground font-light mt-0.5">{comp.formato}</p>
                  </div>
                  {/* Detalles adicionales */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground border-t border-border/20 pt-2 font-mono">
                    <span>Prize Pool: <strong className="text-foreground">${comp.prize_pool || '0.00'}</strong></span>
                    <span>Inscripción: <strong className="text-foreground">${comp.entry_fee || '0.00'}</strong></span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2 border-t border-border/20">
                  <Button 
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-[10px] font-black uppercase tracking-wider"
                    onClick={() => navigate(`/competencia-detalle/${comp.id}`)}
                  >
                    Ver Ficha
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1 bg-primary text-primary-foreground font-black text-[10px] uppercase h-8 px-4 shadow-lg hover:shadow-primary/25 disabled:opacity-40 disabled:hover:shadow-none"
                    onClick={() => onInscribir(comp.id)}
                    disabled={yaInscrito}
                  >
                    {yaInscrito ? 'Ocupado' : 'Inscribir'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}