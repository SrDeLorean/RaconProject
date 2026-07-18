import React, { useMemo, useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Card from '@/components/shared/Card';

export default function PlantillaClub({ 
  roster, 
  jugadoresLibres, 
  searchTerm, 
  onSearchChange, 
  onFichar, 
  onDesvincular, 
  onUpdateRoster, 
  organizaciones = [],
  historialFichajes = [],
  transfersDisabled = false
}) {
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editDorsal, setEditDorsal] = useState('');
  const [editPosicion, setEditPosicion] = useState('');

  // Estados para enviar solicitud de fichaje
  const [signingPlayer, setSigningPlayer] = useState(null);
  const [signDorsal, setSignDorsal] = useState('');
  const [signPosicion, setSignPosicion] = useState('POR');
  const [selectedOrgs, setSelectedOrgs] = useState([]);

  const posicionesDisponibles = [
    { value: 'POR', label: 'Portero (GK)' },
    { value: 'DFC', label: 'Defensa Central (CB)' },
    { value: 'LD', label: 'Lateral Derecho (RB)' },
    { value: 'LI', label: 'Lateral Izquierdo (LB)' },
    { value: 'MCD', label: 'Pivote Defensivo (CDM)' },
    { value: 'MC', label: 'Mediocentro (CM)' },
    { value: 'MCO', label: 'Mediocentro Ofensivo (CAM)' },
    { value: 'ED', label: 'Extremo Derecho (RW)' },
    { value: 'EI', label: 'Extremo Izquierdo (LW)' },
    { value: 'DC', label: 'Delantero Centro (ST)' },
  ];

  const getPosBadgeClass = (pos) => {
    const p = (pos || '').toUpperCase();
    if (['POR', 'PO', 'GK', 'PORTERO'].some(x => p.includes(x))) {
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
    }
    if (['DF', 'DFC', 'LD', 'LI', 'CB', 'LB', 'RB', 'DEFENSA'].some(x => p.includes(x))) {
      return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
    }
    if (['MC', 'MCD', 'MCO', 'MI', 'MD', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MEDIO', 'VOLANTE'].some(x => p.includes(x))) {
      return 'bg-green-500/10 text-green-500 border-green-500/30';
    }
    if (['DC', 'ED', 'EI', 'ST', 'LW', 'RW', 'CF', 'DELANTERO', 'ATACANTE'].some(x => p.includes(x))) {
      return 'bg-primary/10 text-primary border-primary/30';
    }
    return 'bg-muted-foreground/10 text-muted-foreground border-border/30';
  };

  const handleOpenEdit = (player) => {
    setEditingPlayer(player);
    setEditDorsal(player.dorsal || '');
    setEditPosicion(player.posicion || 'POR');
  };

  const handleSaveTactical = async (e) => {
    e.preventDefault();
    if (!editingPlayer) return;
    await onUpdateRoster(editingPlayer.id, {
      dorsal: editDorsal,
      posicion: editPosicion,
    });
    setEditingPlayer(null);
  };

  const handleOpenSign = (player) => {
    setSigningPlayer(player);
    setSignDorsal('');
    setSignPosicion(player.posicion || 'POR');
    // Por defecto seleccionar todas las organizaciones donde el jugador aún no tiene contrato
    const alreadySignedOrgs = (player.contratos || []).map(c => c.organizacion);
    const availableOrgs = organizaciones.filter(o => !alreadySignedOrgs.includes(o.nombre)).map(o => o.id);
    setSelectedOrgs(availableOrgs);
  };

  const handleToggleOrg = (orgId) => {
    if (selectedOrgs.includes(orgId)) {
      setSelectedOrgs(selectedOrgs.filter(id => id !== orgId));
    } else {
      setSelectedOrgs([...selectedOrgs, orgId]);
    }
  };

  const handleSendSigningRequest = async (e) => {
    e.preventDefault();
    if (!signingPlayer) return;
    if (selectedOrgs.length === 0) {
      alert("Debes seleccionar al menos una organización / liga para enviar el fichaje.");
      return;
    }

    await onFichar(signingPlayer.id, {
      posicion: signPosicion,
      dorsal: signDorsal,
      organizacion_ids: selectedOrgs
    });

    setSigningPlayer(null);
  };

  const columnasRoster = useMemo(() => [
    {
      header: 'Competidor',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-card to-background border border-primary/30 shadow-[0_0_12px_rgba(232,0,29,0.2)] flex items-center justify-center font-display font-black text-primary text-base shrink-0 shadow-inner">
            {row.dorsal || '-'}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
              {row.gamertag || row.name}
            </span>
            <span className="text-xs text-muted-foreground">{row.name}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Ficha Táctica',
      render: (row) => {
        const badgeClass = getPosBadgeClass(row.posicion);
        return (
          <div className="flex flex-col gap-1">
            <span className={`text-[10px] font-mono px-2.5 py-1 rounded-lg uppercase font-bold border inline-block w-fit tracking-wide shadow-sm ${badgeClass}`}>
              {posicionesDisponibles.find(p => p.value === row.posicion)?.label || row.posicion || 'Por asignar'}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Operaciones',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs border-border hover:border-primary/40 text-foreground hover:text-primary transition-all flex items-center gap-1 bg-card/40 hover:bg-primary/10" 
            onClick={() => handleOpenEdit(row)}
          >
            <span>⚙️</span> Configurar
          </Button>
          {!transfersDisabled && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs border-border hover:border-destructive/40 text-muted-foreground hover:text-destructive transition-all flex items-center gap-1 bg-card/40 hover:bg-destructive/10" 
              onClick={() => onDesvincular(row)}
            >
              <span>❌</span> Dar de Baja
            </Button>
          )}
        </div>
      )
    }
  ], [onDesvincular, transfersDisabled]);

  const columnasHistorial = useMemo(() => [
    {
      header: 'Competidor',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground text-xs">{row.jugador?.gamertag || row.jugador?.name}</span>
          <span className="text-[10px] text-muted-foreground">{row.jugador?.name}</span>
        </div>
      )
    },
    {
      header: 'Organización / Liga',
      render: (row) => (
        <span className="font-bold text-xs text-foreground uppercase">{row.organizacion?.nombre || 'General'}</span>
      )
    },
    {
      header: 'Ficha Táctica',
      render: (row) => (
        <span className="text-[9px] font-mono bg-muted border border-border/40 px-2 py-0.5 rounded text-muted-foreground uppercase font-bold">
          {posicionesDisponibles.find(p => p.value === row.posicion)?.value || row.posicion || 'GK'} #{row.dorsal || '-'}
        </span>
      )
    },
    {
      header: 'Estado de Solicitud',
      render: (row) => {
        if (row.estado === 'pendiente_jugador') {
          return (
            <Badge variant="warning" className="uppercase text-[8px] font-black tracking-widest px-2.5 py-0.5 flex items-center gap-1.5 w-fit border border-amber-500/20 bg-amber-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Pendiente Jugador
            </Badge>
          );
        }
        if (row.estado === 'pendiente_admin') {
          return (
            <Badge variant="primary" className="uppercase text-[8px] font-black tracking-widest px-2.5 py-0.5 flex items-center gap-1.5 w-fit border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              Pendiente Admin
            </Badge>
          );
        }
        if (row.estado === 'aprobado') {
          return (
            <Badge variant="success" className="uppercase text-[8px] font-black tracking-widest px-2.5 py-0.5 flex items-center gap-1.5 w-fit border border-emerald-500/20 bg-emerald-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Aceptado
            </Badge>
          );
        }
        if (row.estado === 'rechazado') {
          return (
            <div className="flex flex-col gap-1">
              <Badge variant="destructive" className="uppercase text-[8px] font-black tracking-widest px-2.5 py-0.5 flex items-center gap-1.5 w-fit border border-destructive/20 bg-destructive/10">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive"></span>
                Rechazado
              </Badge>
              {row.observaciones_admin && (
                <span className="text-[9px] text-destructive/80 font-bold max-w-[150px] leading-tight break-words pl-1">
                  Motivo: {row.observaciones_admin}
                </span>
              )}
            </div>
          );
        }
        return <Badge variant="neutral">{row.estado}</Badge>;
      }
    },
    {
      header: 'Fecha Trámite',
      render: (row) => (
        <span className="text-[10px] text-muted-foreground font-mono">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      )
    }
  ], []);

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LISTA DEL ROSTER ACTIVO */}
        <div className="lg:col-span-2">
          <DataTable 
            title={`Miembros Registrados (${roster.length})`}
            columns={columnasRoster}
            data={roster}
            isLoading={false}
            searchPlaceholder="Filtrar por Gamertag en plantilla..."
            perPage={5}
            showPagination={true}
          />
        </div>

        {/* PANEL LATERAL DE CONTRATACIONES */}
        {transfersDisabled ? (
          <Card className="space-y-4 relative overflow-hidden h-fit text-center border-border/40 bg-card/35 p-6 rounded-2xl shadow-xl" padding="p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full blur-3xl pointer-events-none"></div>
            <span className="text-3xl block animate-pulse">🚫</span>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
              Fichajes Deshabilitados
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-light">
              Esta competencia se juega con plantillas cerradas. No se permite reclutar agentes libres ni procesar transferencias en esta división.
            </p>
          </Card>
        ) : (
          <Card className="space-y-4 relative overflow-hidden h-fit max-h-screen" padding="p-5" withGlow={true}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                <span>🛡️</span> Fichar Agentes
              </h3>
              <p className="text-xs text-muted-foreground">Busca competidores con rol de jugador e incorpóralos bajo contrato.</p>
            </div>
            
            <Input 
              placeholder="Escribe Gamertag o Nombre..." 
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            
            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pt-1 pr-1">
              {jugadoresLibres.filter(j => !j.role || j.role === 'jugador').length > 0 ? (
                jugadoresLibres.filter(j => !j.role || j.role === 'jugador').map((jugador) => (
                  <div key={jugador.id} className="flex flex-col p-3.5 rounded-xl bg-card/40 border border-border/40 text-xs shadow-md transition-all hover:border-primary/40 hover:shadow-[0_0_15px_rgba(232,0,29,0.06)] hover:bg-card/60 space-y-3 group/agent">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-bold text-foreground text-sm truncate group-hover/agent:text-primary transition-colors">{jugador.gamertag || jugador.name}</span>
                        <span className="text-[10px] text-muted-foreground truncate">{jugador.name} • {jugador.email}</span>
                      </div>
                      <Button 
                        size="sm" 
                        className="h-8 text-[10px] px-3.5 bg-primary text-primary-foreground font-black uppercase tracking-wider shadow-[0_0_10px_hsla(var(--primary),0.3)] hover:shadow-[0_0_15px_hsla(var(--primary),0.5)] transition-all shrink-0"
                        onClick={() => handleOpenSign(jugador)}
                      >
                        Fichar
                      </Button>
                    </div>
                    
                    {/* Detalles de Demarcación y Contratos en otras Ligas */}
                    <div className="pt-2.5 border-t border-border/20 flex flex-col gap-1.5 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground uppercase font-bold text-[9px] tracking-wider">Demarcación:</span>
                        <span className={`font-mono font-bold uppercase px-2.5 py-0.5 rounded border text-[9px] ${getPosBadgeClass(jugador.posicion)}`}>
                          {posicionesDisponibles.find(p => p.value === jugador.posicion)?.label || jugador.posicion || 'Sin Demarcación'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 mt-1">
                        <span className="text-muted-foreground font-bold uppercase tracking-wider text-[8px]">Contratos Activos en Otras Ligas:</span>
                        {jugador.contratos && jugador.contratos.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {jugador.contratos.map((c, idx) => (
                              <span key={idx} className="bg-muted/60 px-2 py-0.5 rounded text-[8px] border border-border/40 text-foreground font-mono font-bold">
                                🏢 {c.club} ({c.organizacion})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-[9px] pl-1 flex items-center gap-1">
                            🟢 Agente Libre Absoluto (Sin Contratos)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : searchTerm ? (
                <span className="text-xs text-muted-foreground block text-center py-6 bg-background rounded-xl border border-dashed border-border/60">
                  No se encontraron jugadores libres.
                </span>
              ) : null}
            </div>
          </Card>
        )}
      </div>

      {/* SECCIÓN NUEVA: SOLICITUDES EN REVISIÓN POR ADMINISTRADOR */}
      {historialFichajes.filter(f => f.estado === 'pendiente_admin').length > 0 && (
        <Card className="space-y-4 border-amber-500/20 bg-amber-500/[0.02]" padding="p-5" withGlow={true}>
          <div className="flex items-center justify-between border-b border-border/30 pb-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
              <span>⏳</span> Solicitudes en Revisión por Administrador
            </h3>
            <Badge variant="warning" className="uppercase text-[8px] font-black tracking-widest px-2.5 py-0.5 animate-pulse">
              En Espera de Aprobación
            </Badge>
          </div>

          <DataTable 
            columns={columnasHistorial}
            data={historialFichajes.filter(f => f.estado === 'pendiente_admin')}
            isLoading={false}
            perPage={5}
            showPagination={true}
            searchPlaceholder="Filtrar solicitudes en revisión..."
          />
        </Card>
      )}

      {/* TERCERA TABLA: LOG/HISTORIAL DE TRANSACCIONES */}
      <Card className="space-y-4" padding="p-5" withGlow={true}>
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
            <span>📜</span> Log de Transacciones e Historial de Fichajes
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Historial de Auditoría de Solicitudes</p>
        </div>

        <DataTable 
          columns={columnasHistorial}
          data={historialFichajes}
          isLoading={false}
          perPage={5}
          showPagination={true}
          searchPlaceholder="Filtrar historial de auditoría..."
        />
      </Card>

      {/* MODAL CONFIGURACIÓN FICHA TÁCTICA */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden animate-scale-up">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-display font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                ⚙️ Ficha Táctica
              </h3>
              <p className="text-xs text-muted-foreground">Configura los parámetros oficiales del jugador en tu organización.</p>
            </div>

            <form onSubmit={handleSaveTactical} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wide block">Competidor</label>
                <div className="p-3 bg-muted/40 border border-border/40 rounded-xl text-sm font-bold text-foreground flex items-center justify-between">
                  <span>{editingPlayer.gamertag || editingPlayer.name}</span>
                  <span className="text-xs text-muted-foreground">{editingPlayer.name}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 col-span-1">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wide block">Dorsal</label>
                  <Input 
                    type="text" 
                    placeholder="Nº"
                    maxLength={3}
                    value={editDorsal}
                    onChange={(e) => setEditDorsal(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wide block">Demarcación Táctica</label>
                  <select 
                    value={editPosicion}
                    onChange={(e) => setEditPosicion(e.target.value)}
                    className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none cursor-pointer"
                  >
                    {posicionesDisponibles.map((pos) => (
                      <option key={pos.value} value={pos.value}>{pos.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 h-10 text-xs border-border/60 font-bold"
                  onClick={() => setEditingPlayer(null)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-10 text-xs bg-primary text-primary-foreground font-bold shadow-[0_0_15px_hsla(var(--primary),0.3)]"
                >
                  Guardar Configuración
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ENVIAR SOLICITUD DE FICHAJE */}
      {signingPlayer && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden animate-scale-up">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-display font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                ✉️ Enviar Propuesta de Fichaje
              </h3>
              <p className="text-xs text-muted-foreground">Configura los detalles de la oferta para los circuitos correspondientes.</p>
            </div>

            <form onSubmit={handleSendSigningRequest} className="space-y-5">
              
              {/* Resumen del Jugador */}
              <div className="p-3.5 bg-muted/40 border border-border/40 rounded-xl space-y-1 text-xs">
                <span className="text-muted-foreground uppercase font-bold tracking-widest text-[9px]">Competidor Destino:</span>
                <div className="flex items-center justify-between mt-1 text-sm font-bold text-foreground">
                  <span>{signingPlayer.gamertag || signingPlayer.name}</span>
                  <span className="text-xs text-primary">{signingPlayer.email}</span>
                </div>
              </div>

              {/* Parámetros Sugeridos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 col-span-1">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wide block">Dorsal Sugerido</label>
                  <Input 
                    type="text" 
                    placeholder="Nº"
                    maxLength={3}
                    value={signDorsal}
                    onChange={(e) => setSignDorsal(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wide block">Demarcación Propuesta</label>
                  <select 
                    value={signPosicion}
                    onChange={(e) => setSignPosicion(e.target.value)}
                    className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none cursor-pointer"
                  >
                    {posicionesDisponibles.map((pos) => (
                      <option key={pos.value} value={pos.value}>{pos.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selección de Organizaciones / Ligas (Checkbox Checklist) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wide block">
                  Seleccionar Organizaciones / Ligas destino:
                </label>
                <div className="border border-border/40 bg-background/50 rounded-xl p-3.5 space-y-2 max-h-[150px] overflow-y-auto">
                  {organizaciones.length > 0 ? (
                    organizaciones.map((org) => {
                      const alreadyHasContract = (signingPlayer.contratos || []).some(c => c.organizacion === org.nombre);
                      return (
                        <label 
                          key={org.id} 
                          className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer border transition-colors ${
                            alreadyHasContract 
                              ? 'opacity-40 bg-muted/40 border-transparent cursor-not-allowed' 
                              : selectedOrgs.includes(org.id)
                              ? 'bg-primary/5 border-primary/40 text-foreground'
                              : 'bg-background border-border/40 text-muted-foreground hover:bg-muted/40'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              disabled={alreadyHasContract}
                              checked={selectedOrgs.includes(org.id)}
                              onChange={() => handleToggleOrg(org.id)}
                              className="rounded border-border focus:ring-primary text-primary h-4 w-4 shrink-0"
                            />
                            <span className="font-bold">{org.nombre}</span>
                          </div>
                          {alreadyHasContract && (
                            <span className="text-[9px] uppercase font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">Ya Fichado</span>
                          )}
                        </label>
                      );
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground block text-center py-2">No hay organizaciones configuradas en el sistema.</span>
                  )}
                </div>
              </div>

              {/* Botonera */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 h-10 text-xs border-border/60 font-bold"
                  onClick={() => setSigningPlayer(null)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={selectedOrgs.length === 0}
                  className="flex-1 h-10 text-xs bg-primary text-primary-foreground font-bold shadow-[0_0_15px_hsla(var(--primary),0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Enviar Ofertas ({selectedOrgs.length})
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}