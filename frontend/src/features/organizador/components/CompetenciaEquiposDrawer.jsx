import React from 'react';
import Drawer from '@/components/ui/Drawer';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';
import { useCompetenciaEquipos } from '../hooks/useCompetenciaEquipos';

export default function CompetenciaEquiposDrawer({ isOpen, onClose, competencia }) {
  // Si no hay competencia seleccionada, pasamos null para evitar llamadas en falso
  const id = competencia?.id || null;
  const { data, ui, actions } = useCompetenciaEquipos(id);

  const maxCupos = competencia?.max_participantes || 0;
  const cuposActuales = data.equiposInscritos.length;
  const estaLleno = cuposActuales >= maxCupos;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={competencia ? `Roster Oficial: ${competencia.nombre}` : 'Equipos'}
    >
      <div className="flex flex-col h-full gap-6 pb-6 pt-2">
        
        {ui.notification && (
          <Alert variant={ui.notification.variant} onClose={() => actions.setNotification(null)}>
            {ui.notification.text}
          </Alert>
        )}

        {/* SECCIÓN 1: BUSCADOR Y ASIGNACIÓN (MERCADO) */}
        <div className="bg-muted/30 p-4 rounded-xl border border-border/50 shadow-inner">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-foreground">Añadir Clubes Participantes</h3>
            <Badge variant={estaLleno ? 'error' : 'brand'} className="font-mono font-bold">
              Cupos: {cuposActuales} / {maxCupos}
            </Badge>
          </div>
          
          <Input 
            placeholder="Buscar por nombre o TAG del club..." 
            value={data.searchTerm} 
            onChange={(e) => actions.setSearchTerm(e.target.value)}
            disabled={estaLleno}
          />
          
          {data.searchTerm && (
            <div className="mt-3 bg-background border border-border/50 rounded-lg max-h-48 overflow-y-auto shadow-sm">
              {ui.isSearching ? (
                <div className="p-4 text-center text-xs text-muted-foreground animate-pulse font-bold tracking-widest uppercase">
                  Buscando en la base de datos...
                </div>
              ) : data.equiposDisponibles.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No se encontraron clubes disponibles con ese nombre.
                </div>
              ) : (
                data.equiposDisponibles.map(equipo => (
                  <div key={equipo.id} className="flex justify-between items-center p-3 border-b border-border/30 last:border-0 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">{equipo.nombre}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-widest">{equipo.abreviatura}</span>
                    </div>
                    <Button 
                      size="sm" 
                      className="h-7 px-3 text-xs bg-foreground text-background"
                      onClick={() => actions.asignarEquipo(equipo.id)} 
                      disabled={estaLleno}
                    >
                      + Inscribir
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* SECCIÓN 2: LISTA DE EQUIPOS YA INSCRITOS */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1 border-b border-border/50 pb-2">
            Clubes Aprobados y en Espera
          </h3>

          {ui.isFetching ? (
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : data.equiposInscritos.length === 0 ? (
            <div className="text-center p-10 border border-dashed border-border/60 rounded-xl bg-muted/10">
              <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Aún no hay clubes en esta división</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {data.equiposInscritos.map(equipo => (
                <div key={equipo.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 bg-background border border-border/60 rounded-xl shadow-sm gap-4">
                  
                  {/* Info del Club */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-display font-black text-foreground border border-border/40 shrink-0">
                      {equipo.abreviatura || 'FC'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">{equipo.nombre}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        Mánager: {equipo.capitan?.gamertag || equipo.capitan?.name || 'S/A'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Operaciones de Estado y Expulsión */}
                  <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <Select
                      value={equipo.pivot.estado_inscripcion}
                      onChange={(e) => actions.cambiarEstado(equipo.id, e.target.value)}
                      className="h-9 text-xs py-1 min-w-[130px] font-bold"
                      options={[
                        { value: 'aprobado', label: '✅ Aprobado' },
                        { value: 'pendiente', label: '⏳ En Revisión' },
                        { value: 'rechazado', label: '🚫 Rechazado' }
                      ]}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 px-3 border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (window.confirm(`¿Seguro que deseas expulsar a ${equipo.nombre} de la división? Se perderán sus estadísticas si el torneo está en curso.`)) {
                          actions.removerEquipo(equipo.id);
                        }
                      }}
                    >
                      Expulsar
                    </Button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </Drawer>
  );
}