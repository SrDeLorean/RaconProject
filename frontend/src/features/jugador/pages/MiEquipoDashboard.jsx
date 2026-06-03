import React, { useMemo } from 'react';
import { useMiEquipo } from '../hooks/useMiEquipo';
import api from '@/api/axios';

// Componentes UI de Uso Común (Shared)
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';
import DeleteModal from '@/components/shared/DeleteModal';

// Módulos Internos Especializados
import ResumenClub from './components/ResumenClub';
import PlantillaClub from './components/PlantillaClub';
import CompeticionClub from './components/CompeticionClub';
import PartidosReportesClub from './components/PartidosReportesClub';
import OficinaClub from './components/OficinaClub';
import EquipoFormDrawer from '../components/EquipoFormDrawer';

export default function MiEquipoDashboard() {
  const { data, ui, form, actions } = useMiEquipo();

  // Menú Secundario de Operaciones
  const tabsConfig = useMemo(() => [
    { id: 'resumen', label: 'Resumen', icon: '📊' },
    { id: 'roster', label: 'Plantilla & Roster', icon: '👥' },
    { id: 'competencias', label: 'Competición', icon: '🏆' },
    { id: 'calendario', label: 'Calendario y Reportes', icon: '📅' },
    { id: 'configuracion', label: 'Oficina', icon: '⚙️' },
  ], []);

  if (ui.isFetching) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <span className="text-sm font-bold tracking-widest text-primary uppercase animate-pulse">Sincronizando Sede...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative">
      {ui.notification && (
        <Alert variant={ui.notification.variant} className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" onClose={() => actions.setNotification(null)}>
          {ui.notification.text}
        </Alert>
      )}

      {/* CASO 1: SIN EQUIPO REGISTRADO */}
      {!data.equipo ? (
        <div className="border border-border/60 bg-muted/20 rounded-2xl p-12 flex flex-col items-center text-center max-w-2xl mx-auto mt-8 gap-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl">🛡️</div>
          <div className="space-y-2">
            <h2 className="text-xl font-display font-black tracking-wide text-foreground uppercase">Sin Club Registrado</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Para empezar a gestionar fichajes, organizar tácticas e inscribir competidores en torneos oficiales, debes fundar tu propio club.
            </p>
          </div>
          <Button onClick={actions.openCrearOEditar} className="h-12 px-8 bg-gradient-to-r from-primary to-destructive text-primary-foreground font-display font-black uppercase tracking-wider text-sm shadow-md">
            + Fundar Nuevo Club
          </Button>
        </div>
      ) : (
        /* CASO 2: CLUB ACTIVO (CENTRO DE OPERACIONES) */
        <>
          {/* BANNER PRINCIPAL DE MARCA */}
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 border-b border-border/40 pb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-destructive/10 border border-primary/20 flex items-center justify-center font-display font-black text-primary text-xl shadow-lg overflow-hidden shrink-0">
                {data.equipo.logo ? (
                  <img 
                    src={data.equipo.logo.startsWith('http') ? data.equipo.logo : `${api.defaults.baseURL?.replace('/api', '') || 'http://localhost:8000'}${data.equipo.logo}`} 
                    alt="Escudo" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  data.equipo.abreviatura
                )}
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-display font-black text-foreground tracking-wider uppercase flex items-center gap-2">
                  {data.equipo.nombre}
                  <Badge variant="success" className="text-[9px] uppercase tracking-widest font-bold">Capitán</Badge>
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-2 mt-1 text-xs text-muted-foreground">
                  <span>
                    Plataforma: <strong className="text-foreground uppercase">{data.equipo.plataforma}</strong>
                  </span>
                  
                  {/* Selector de Circuito / Organizaciones Premium */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[10px] uppercase tracking-wider">Circuito Competitivo:</span>
                    {data.organizaciones.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {data.organizaciones.map((org) => {
                          const isSelected = data.organizacionId === org.id;
                          return (
                            <button
                              key={org.id}
                              onClick={() => actions.selectOrganizacion(org.id)}
                              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all duration-300 cursor-pointer ${
                                isSelected
                                  ? 'bg-primary/15 text-primary border-primary/45 shadow-[0_0_10px_rgba(232,0,29,0.15)] font-bold'
                                  : 'bg-card/40 text-muted-foreground border-border/30 hover:border-primary/30 hover:text-foreground'
                              }`}
                            >
                              🏢 {org.nombre}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-destructive">Ninguna Organización</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SELECCIÓN DE PESTAÑAS (MÓDULOS) */}
            <div className="flex gap-1.5 p-1.5 bg-card/25 backdrop-blur-md rounded-2xl border border-border/40 w-full xl:w-auto overflow-x-auto">
              {tabsConfig.map((tab) => {
                const isActive = data.activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => actions.setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 cursor-pointer border ${
                      isActive 
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/15' 
                        : 'bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/30'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CONTROL DE VISTAS DINÁMICAS */}
          <div className="animate-fade-in">
            {data.activeTab === 'resumen' && (
              <ResumenClub 
                equipo={data.equipo} 
                roster={data.roster} 
                competencias={data.competencias} 
                onTabChange={actions.setActiveTab} 
              />
            )}

            {data.activeTab === 'roster' && (
              <PlantillaClub 
                roster={data.roster} 
                jugadoresLibres={data.jugadoresLibres} 
                searchTerm={data.searchJugadorTerm} 
                onSearchChange={actions.setSearchJugadorTerm} // 🔥 Solo actualiza el estado, el Debounce hace la petición solo.
                onFichar={actions.handleFicharJugador} 
                onDesvincular={actions.openDesvincular} 
                onUpdateRoster={actions.handleUpdateRosterJugador}
                organizaciones={data.organizaciones}
                historialFichajes={data.historialFichajes}
              />
            )}

            {data.activeTab === 'competencias' && (
              <CompeticionClub 
                competencias={data.competencias} 
                onInscribir={actions.handleInscribirCompetencia} 
              />
            )}

            {data.activeTab === 'calendario' && (
              <PartidosReportesClub 
                equipo={data.equipo} 
                roster={data.roster} 
              />
            )}

            {data.activeTab === 'configuracion' && (
              <OficinaClub 
                formData={form.formData}
                setFormData={form.setFormData}
                formErrors={form.formErrors}
                isSaving={ui.isSaving}
                onSave={actions.handleSaveEquipo}
              />
            )}
          </div>
        </>
      )}

      {/* DRAWER PARA CREACIÓN INICIAL */}
      <EquipoFormDrawer 
        isOpen={ui.isDrawerOpen && !data.equipo}
        onClose={actions.closeDrawer}
        onSave={actions.handleSaveEquipo}
        isSaving={ui.isSaving}
        selectedEquipo={null}
        formData={form.formData}
        setFormData={form.setFormData}
        formErrors={form.formErrors}
      />

      {/* DIÁLOGO DE BAJA DE MIEMBROS */}
      <DeleteModal
        isOpen={ui.isDeleteModalOpen}
        onClose={actions.closeDeleteModal}
        onConfirm={actions.executeDesvincular}
        isDeleting={ui.isSaving}
        title="Baja del Competidor"
        message={
          <>
            ¿Seguro que deseas rescindir el contrato de <strong className="text-foreground">{ui.jugadorSeleccionado?.gamertag || ui.jugadorSeleccionado?.name}</strong>? Pasará a la bolsa de agentes libres de forma inmediata.
          </>
        }
      />
    </div>
  );
}