import React, { useMemo } from 'react';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function PlantillaClub({ roster, jugadoresLibres, searchTerm, onSearchChange, onFichar, onDesvincular }) {
  
  const columnasRoster = useMemo(() => [
    {
      header: 'Competidor',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0">
            {row.dorsal || '#'}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-sm">{row.gamertag || row.name}</span>
            <span className="text-xs text-muted-foreground">{row.id_ea || 'Sin cuenta vinculada'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Posición Táctica',
      render: (row) => (
        <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase font-bold border border-border/40">
          {row.posicion || 'Por asignar'}
        </span>
      )
    },
    {
      header: 'Acciones',
      render: (row) => (
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs border-destructive/20 text-destructive hover:bg-destructive/10" 
          onClick={() => onDesvincular(row)}
        >
          Dar de Baja
        </Button>
      )
    }
  ], [onDesvincular]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* LISTA DEL ROSTER ACTIVO */}
      <div className="lg:col-span-2">
        <DataTable 
          title={`Miembros Registrados (${roster.length})`}
          columns={columnasRoster}
          data={roster}
          isLoading={false}
          searchPlaceholder="Filtrar por Gamertag en plantilla..."
          perPage={11}
          showPagination={false}
        />
      </div>

      {/* PANEL LATERAL DE CONTRATACIONES */}
      <div className="border border-border/50 bg-muted/10 p-5 rounded-xl space-y-4 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Fichar Agentes Libres</h3>
          <p className="text-xs text-muted-foreground">Incorpora competidores sin club a tu plantilla de manera inmediata.</p>
        </div>
        
        <Input 
          placeholder="Escribe Gamertag o Nombre..." 
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        
        <div className="space-y-2 max-h-[250px] overflow-y-auto pt-1 pr-1">
          {jugadoresLibres.length > 0 ? (
            jugadoresLibres.map((jugador) => (
              <div key={jugador.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border/40 text-xs shadow-sm">
                <div className="flex flex-col max-w-[130px]">
                  <span className="font-bold text-foreground truncate">{jugador.gamertag || jugador.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase truncate">{jugador.posicion || 'Sin Demarcación'}</span>
                </div>
                <Button 
                  size="sm" 
                  className="h-7 text-[10px] px-3 bg-primary text-primary-foreground font-bold"
                  onClick={() => onFichar(jugador.id, { posicion: jugador.posicion })}
                >
                  Fichar
                </Button>
              </div>
            ))
          ) : searchTerm ? (
            <span className="text-xs text-muted-foreground block text-center py-4 bg-background rounded-lg border border-dashed border-border">
              No se encontraron jugadores disponibles.
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}