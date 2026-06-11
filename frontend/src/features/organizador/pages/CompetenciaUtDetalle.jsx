import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCompetenciaUtDetalle } from '../hooks/useCompetenciaUtDetalle';

import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';
import Card from '@/components/shared/Card';
import MatchmakerCalendarioUt from './components/MatchmakerCalendarioUt';

export default function CompetenciaUtDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, ui, actions } = useCompetenciaUtDetalle(id);
  
  const [activeTab, setActiveTab] = useState('roster');
  
  // States for manual enrollment form
  const [selectedUser, setSelectedUser] = useState(null);
  const [nombreEquipo, setNombreEquipo] = useState('');
  const [clubIdEa, setClubIdEa] = useState('');
  const [idCompanero, setIdCompanero] = useState('');

  if (ui.isFetchingInfo) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data.competencia) {
    return (
      <div className="p-8 text-center flex flex-col items-center gap-4">
        <h2 className="text-xl font-bold text-foreground">Torneo UT no encontrado</h2>
        <Button onClick={() => navigate('/organizador/competencias-ut')}>Volver al listado</Button>
      </div>
    );
  }

  const { competencia } = data;
  const maxCupos = competencia.max_participantes || 0;
  const cuposActuales = data.equiposInscritos.length;
  const estaLleno = cuposActuales >= maxCupos;
  const es2vs2 = competencia.tipo === '2vs2';

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setNombreEquipo(user.gamertag || user.name || '');
    // Reset partner selection
    setIdCompanero('');
  };

  const handleInscribirManualSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    actions.inscribirManual(
      selectedUser.id,
      null,
      es2vs2 ? idCompanero : null,
      clubIdEa || null
    );

    // Reset local form states
    setSelectedUser(null);
    setNombreEquipo('');
    setClubIdEa('');
    setIdCompanero('');
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative">
      {ui.notification && (
        <Alert variant={ui.notification.variant} className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" onClose={() => actions.setNotification(null)}>
          {ui.notification.text}
        </Alert>
      )}

      {/* HEADER DEL DASHBOARD DEL TORNEO UT */}
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => navigate('/organizador/competencias-ut')} 
          className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest flex items-center gap-1 w-fit cursor-pointer"
        >
          ← Volver a Torneos UT
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/50 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-5 h-5 rounded-full border border-border/50 shadow-sm" style={{ backgroundColor: competencia.color_tema || '#ef4444' }} />
              <Badge variant="neutral" className="uppercase font-semibold text-[10px]">{competencia.estado}</Badge>
              <Badge variant="brand" className="uppercase font-mono text-[10px]">{cuposActuales}/{maxCupos} Participantes</Badge>
              <Badge variant="error" className="uppercase font-mono text-[10px]">{competencia.tipo}</Badge>
            </div>
            <h1 className="text-3xl font-display font-black text-foreground uppercase tracking-wide">
              {competencia.nombre}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Formato: <strong className="text-foreground uppercase">{competencia.formato}</strong> • Plataforma: <strong className="text-foreground uppercase">{competencia.plataforma}</strong>
            </p>
          </div>
        </div>

        {/* NAVEGACIÓN INTERNA */}
        <div className="flex gap-2 bg-muted/30 p-1.5 rounded-lg border border-border/40 w-fit">
          <button 
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-colors cursor-pointer ${activeTab === 'roster' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            👥 Participantes
          </button>
          <button 
            onClick={() => setActiveTab('calendario')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-colors cursor-pointer ${activeTab === 'calendario' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            📅 Calendario y Fixture
          </button>
        </div>
      </div>

      {/* ========================================= */}
      {/* VISTA: PARTICIPANTES                      */}
      {/* ========================================= */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* PANEL IZQUIERDO: FORMULARIO DE REGISTRO MANUAL */}
          <div className="lg:col-span-1 bg-muted/20 p-5 rounded-xl border border-border/50 shadow-sm flex flex-col gap-4 sticky top-24">
            <div>
              <h3 className="text-sm font-bold text-foreground">Inscripción Manual</h3>
              <p className="text-xs text-muted-foreground mt-1">Busca un usuario en el sistema para inscribirlo en este torneo UT.</p>
            </div>
            
            {!selectedUser ? (
              <div className="space-y-3">
                <Input 
                  placeholder="Buscar usuario por Gamertag o Nombre..." 
                  value={data.searchTerm} 
                  onChange={(e) => actions.setSearchTerm(e.target.value)}
                  disabled={estaLleno}
                />

                <div className="bg-background border border-border/50 rounded-lg max-h-60 overflow-y-auto shadow-inner">
                  {ui.isSearching ? (
                    <div className="p-4 text-center text-xs text-muted-foreground font-bold uppercase animate-pulse">Buscando...</div>
                  ) : data.usuariosDisponibles.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">Escribe algo para buscar...</div>
                  ) : (
                    data.usuariosDisponibles.map(user => (
                      <div key={user.id} className="flex justify-between items-center p-3 border-b border-border/30 last:border-0 hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">{user.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-widest">{user.gamertag || 'Sin Gamertag'}</span>
                        </div>
                        <Button size="sm" className="h-7 px-3 text-[10px] bg-foreground text-background" onClick={() => handleSelectUser(user)} disabled={estaLleno}>
                          Seleccionar
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleInscribirManualSubmit} className="space-y-4">
                <div className="bg-background/80 p-3 rounded-lg border border-border/50 space-y-1">
                  <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Capitán / Jugador Seleccionado</span>
                  <div className="text-sm font-bold text-foreground">{selectedUser.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{selectedUser.gamertag || 'Sin Gamertag'}</div>
                </div>

                <Input 
                  label="EA Club ID (Opcional)" 
                  placeholder="Ej. 1294812"
                  value={clubIdEa} 
                  onChange={(e) => setClubIdEa(e.target.value)} 
                />

                {es2vs2 && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Seleccionar Compañero *</label>
                    <select
                      value={idCompanero}
                      onChange={(e) => setIdCompanero(e.target.value)}
                      required
                      className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="">-- Elige un compañero --</option>
                      {/* En una aplicación completa podríamos tener búsqueda para el compañero,
                          por simplicidad cargaremos todos los usuarios que coincidan con la búsqueda
                          o una lista de usuarios del sistema */}
                      {data.usuariosDisponibles
                        .filter(u => u.id !== selectedUser.id)
                        .map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.gamertag || 'Sin Gamertag'})
                          </option>
                        ))}
                    </select>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Escribe en el buscador de arriba para cargar más usuarios disponibles en esta lista.</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 text-xs" onClick={() => setSelectedUser(null)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 text-xs bg-primary text-primary-foreground font-bold">
                    Inscribir
                  </Button>
                </div>
              </form>
            )}

            {estaLleno && (
              <p className="text-xs text-destructive font-bold text-center bg-destructive/10 p-2 rounded-lg">
                Se ha alcanzado el límite de cupos ({maxCupos}).
              </p>
            )}
          </div>

          {/* PANEL DERECHO: EQUIPOS INSCRITOS */}
          <div className="lg:col-span-2 bg-background p-1 rounded-xl">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1 border-b border-border/50 pb-2">
              Participantes del Torneo
            </h3>

            {ui.isFetchingEquipos ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : data.equiposInscritos.length === 0 ? (
              <div className="text-center p-12 border border-dashed border-border/60 rounded-xl bg-muted/10">
                <span className="text-muted-foreground text-sm font-bold uppercase tracking-wider">Aún no hay inscritos en este torneo</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {data.equiposInscritos.map(equipo => (
                  <div key={equipo.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-background border border-border/60 rounded-xl shadow-sm gap-4 hover:border-primary/30 transition-colors">
                    
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center font-display font-black text-foreground border border-border/40 shrink-0 text-base uppercase">
                        {equipo.nombre?.slice(0, 3) || 'UT'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-foreground">{equipo.nombre}</span>
                        <div className="flex flex-wrap gap-x-2 text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                          <span>
                            J1: <strong className="text-foreground">{equipo.capitan?.gamertag || equipo.capitan?.name || 'Sin Asignar'}</strong>
                          </span>
                          {equipo.companero && (
                            <span>
                              • J2: <strong className="text-foreground">{equipo.companero?.gamertag || equipo.companero?.name}</strong>
                            </span>
                          )}
                          {equipo.club_id_ea && (
                            <span className="text-primary font-bold">
                              • EA Club: {equipo.club_id_ea}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <Select
                        value={equipo.pivot?.estado_inscripcion || 'aprobado'}
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
                          if (window.confirm(`¿Expulsar y eliminar la inscripción de "${equipo.nombre}"?`)) {
                            actions.removerEquipo(equipo.id);
                          }
                        }}
                      >
                        Baja
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* VISTA: CALENDARIO Y MATCHMAKING           */}
      {/* ========================================= */}
      {activeTab === 'calendario' && (
        <MatchmakerCalendarioUt 
          equipos={data.equiposInscritos.filter(e => e.pivot?.estado_inscripcion === 'aprobado')} 
          competenciaId={competencia.id} 
        />
      )}

    </div>
  );
}
