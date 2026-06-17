import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/shared/Card';

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
    <div className="space-y-8 animate-fade-in">
      
      {/* SECCIÓN 1: COMPETENCIAS INSCRITAS (ASIGNADAS) */}
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
            🏆 Mis Competencias Activas
          </h3>
          <p className="text-xs text-muted-foreground">Torneos en curso y ligas oficiales en las que está asignado tu club.</p>
        </div>

        {inscritas.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 border border-dashed border-border/40 bg-card/25 rounded-2xl text-center py-14 gap-3 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
            <div className="text-4xl text-muted-foreground/35 select-none animate-pulse">🛡️</div>
            <div className="space-y-1">
              <p className="text-xs font-black text-foreground uppercase tracking-widest">Sin Inscripciones Activas</p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Tu club aún no cuenta con postulaciones aprobadas en este circuito. Puedes explorar convocatorias disponibles e inscribirte abajo.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {inscritas.map((comp) => {
              return (
                <Card key={comp.id} className="flex flex-col justify-between gap-5 relative overflow-hidden group/comp" padding="p-6" withGlow={true} hoverLift={true}>
                  <div className="absolute top-4 right-4 w-12 h-12 bg-primary/5 rounded-full blur-md flex items-center justify-center font-display font-black text-primary/20 text-3xl select-none group-hover/comp:scale-110 transition-transform duration-300 pointer-events-none">
                    🏆
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {comp.estado_inscripcion === 'pendiente' ? (
                        <Badge variant="warning" className="uppercase text-[8px] font-black tracking-widest px-2.5 py-0.5 border border-amber-500/20 bg-amber-500/10 flex items-center gap-1.5 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          Postulación Pendiente
                        </Badge>
                      ) : (
                        <Badge variant="success" className="uppercase text-[8px] font-black tracking-widest px-2.5 py-0.5 border border-emerald-500/20 bg-emerald-500/10 flex items-center gap-1.5 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Inscrito y Activo
                        </Badge>
                      )}
                      <span className="text-[9px] text-primary uppercase font-black bg-primary/10 border border-primary/25 px-2.5 py-0.5 rounded-md">
                        {comp.plataforma}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-display font-black text-foreground text-base uppercase group-hover/comp:text-primary transition-colors tracking-wide">{comp.nombre}</h4>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider text-[9px] mt-0.5">{comp.formato}</p>
                    </div>
                    
                    {/* Detalles financieros */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/10">
                      <div className="flex flex-col bg-green-500/5 border border-green-500/10 p-2 rounded-xl text-center">
                        <span className="text-muted-foreground uppercase text-[8px] tracking-wider font-bold">Bolsa de Premios</span>
                        <span className="text-xs font-display font-black text-green-500">${comp.prize_pool || '0.00'}</span>
                      </div>
                      <div className="flex flex-col bg-card/60 border border-border/40 p-2 rounded-xl text-center">
                        <span className="text-muted-foreground uppercase text-[8px] tracking-wider font-bold">Costo Inscripción</span>
                        <span className="text-xs font-display font-black text-foreground">${comp.entry_fee || '0.00'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-3 border-t border-border/20">
                    <Button 
                      size="sm"
                      variant="outline"
                      className="flex-1 h-9 text-[10px] font-black uppercase tracking-widest bg-card/25 hover:bg-primary/10 hover:border-primary/40 transition-colors"
                      onClick={() => navigate(`/competencia-detalle/${comp.id}`)}
                    >
                      Ver Ficha de Liga
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* SECCIÓN 2: CONVOCATORIAS DISPONIBLES (PARA INSCRIPCIÓN) */}
      <div className="space-y-4 pt-6 border-t border-border/20">
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
              📢 Convocatorias y Ligas Habilitadas
            </h3>
            <p className="text-xs text-muted-foreground">Torneos abiertos para la inscripción de nuevos clubes en este circuito.</p>
          </div>
          
          {yaInscrito && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-500 text-[11px] font-bold leading-relaxed flex items-center gap-2 shadow-inner">
              <span>⚠️</span>
              <span>
                Participación limitada: Tu club ya está compitiendo en <strong>{inscritas[0].nombre}</strong>. El reglamento permite un máximo de una (1) competencia activa por circuito/organización.
              </span>
            </div>
          )}
        </div>

        {disponibles.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 border border-dashed border-border/40 bg-card/25 rounded-2xl text-center py-14 gap-3 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
            <div className="text-4xl text-muted-foreground/35 select-none">📭</div>
            <div className="space-y-1">
              <p className="text-xs font-black text-foreground uppercase tracking-widest">Convocatorias Agotadas</p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
                No hay nuevas ligas o torneos habilitados para inscripción en esta organización por el momento. ¡Vuelve pronto!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {disponibles.map((comp) => (
              <Card key={comp.id} className="flex flex-col justify-between gap-5 relative overflow-hidden group/comp" padding="p-6" withGlow={true} hoverLift={true}>
                <div className="absolute top-4 right-4 w-12 h-12 bg-primary/5 rounded-full blur-md flex items-center justify-center font-display font-black text-primary/20 text-3xl select-none group-hover/comp:scale-110 transition-transform duration-300 pointer-events-none">
                  🏆
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="brand" className="uppercase text-[8px] font-black tracking-widest px-2.5 py-0.5 border border-primary/30 bg-primary/10 text-primary">Inscripciones Abiertas</Badge>
                    <span className="text-[9px] text-muted-foreground uppercase font-black bg-muted/40 border border-border/40 px-2.5 py-0.5 rounded-md">{comp.plataforma}</span>
                  </div>
                  <div>
                    <h4 className="font-display font-black text-foreground text-base uppercase group-hover/comp:text-primary transition-colors tracking-wide">{comp.nombre}</h4>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider text-[9px] mt-0.5">{comp.formato}</p>
                  </div>
                  
                  {/* Detalles financieros */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/10">
                    <div className="flex flex-col bg-green-500/5 border border-green-500/10 p-2 rounded-xl text-center">
                      <span className="text-muted-foreground uppercase text-[8px] tracking-wider font-bold">Bolsa de Premios</span>
                      <span className="text-xs font-display font-black text-green-500">${comp.prize_pool || '0.00'}</span>
                    </div>
                    <div className="flex flex-col bg-card/60 border border-border/40 p-2 rounded-xl text-center">
                      <span className="text-muted-foreground uppercase text-[8px] tracking-wider font-bold">Costo Inscripción</span>
                      <span className="text-xs font-display font-black text-foreground">${comp.entry_fee || '0.00'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-3 border-t border-border/20">
                  <Button 
                    size="sm"
                    variant="outline"
                    className="flex-1 h-9 text-[10px] font-black uppercase tracking-widest bg-card/25 hover:bg-primary/10 hover:border-primary/40 transition-colors"
                    onClick={() => navigate(`/competencia-detalle/${comp.id}`)}
                  >
                    Ver Ficha
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1 bg-primary text-primary-foreground font-black text-[10px] uppercase h-9 px-4 shadow-lg hover:shadow-[0_0_15px_hsla(var(--primary),0.35)] disabled:opacity-40 disabled:hover:shadow-none transition-all"
                    onClick={() => onInscribir(comp.id)}
                    disabled={yaInscrito}
                  >
                    {yaInscrito ? 'Ocupado' : 'Inscribir Club'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}