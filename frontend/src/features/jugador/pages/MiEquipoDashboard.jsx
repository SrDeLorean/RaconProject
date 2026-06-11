import React, { useMemo } from 'react';
import { useMiEquipo } from '../hooks/useMiEquipo';
import api from '@/api/axios';

// Componentes UI de Uso Común (Shared)
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';
import DeleteModal from '@/components/shared/DeleteModal';
import Card from '@/components/shared/Card';

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
    { id: 'resumen', label: 'Resumen Táctico', icon: '📊' },
    { id: 'roster', label: 'Plantilla & Roster', icon: '👥' },
    { id: 'competencias', label: 'Competiciones', icon: '🏆' },
    { id: 'calendario', label: 'Calendario y Reportes', icon: '📅' },
    { id: 'configuracion', label: 'Oficina Directiva', icon: '⚙️' },
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
    <div className="flex flex-col gap-8 animate-fade-in relative min-h-screen">
      {ui.notification && (
        <Alert variant={ui.notification.variant} className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" onClose={() => actions.setNotification(null)}>
          {ui.notification.text}
        </Alert>
      )}

      {/* CASO 1: SIN EQUIPO REGISTRADO */}
      {!data.equipo ? (
        <Card className="flex flex-col items-center text-center max-w-2xl mx-auto mt-12 gap-8 shadow-2xl py-16 px-8 relative overflow-hidden group" hoverLift={true} withGlow={true}>
          {/* Brillo dinámico reactivo */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-0 pointer-events-none"></div>
          
          <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-5xl shadow-[0_0_30px_hsla(var(--primary),0.3)] relative z-10 group-hover:scale-110 transition-transform duration-500">
            🛡️
          </div>
          <div className="space-y-3 relative z-10">
            <h2 className="text-3xl font-display font-black tracking-widest text-foreground uppercase drop-shadow-md">
              Sin Club Registrado
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Para empezar a gestionar fichajes, organizar tácticas e inscribir competidores en torneos oficiales de eSports, debes fundar tu propio club y establecerte como Mánager Oficial.
            </p>
          </div>
          <Button 
            onClick={actions.openCrearOEditar} 
            size="lg"
            variant="primary"
            className="w-full sm:w-auto relative z-10 text-lg group"
          >
            <span className="mr-2 text-2xl group-hover:rotate-90 transition-transform duration-300 inline-block">+</span> 
            Fundar Nuevo Club
          </Button>
        </Card>
      ) : (
        /* CASO 2: CLUB ACTIVO (CENTRO DE OPERACIONES) */
        <div className="flex flex-col xl:flex-row gap-8 items-start relative">
          
          {/* SIDEBAR IZQUIERDO (HUD DEL MÁNAGER) */}
          <div className="w-full xl:w-72 shrink-0 xl:sticky xl:top-24 flex flex-col gap-6 z-40">
            
            {/* Tarjeta del Club */}
            <Card padding="p-0" className="overflow-hidden border border-border/40 shadow-xl" hoverLift={true}>
              <div className="relative p-6 flex flex-col items-center text-center gap-4 bg-gradient-to-b from-card/40 to-transparent">
                {/* Brillo trasero */}
                <div className="absolute top-0 w-full h-32 bg-primary/15 blur-3xl pointer-events-none -z-10"></div>
                
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-background to-card border border-primary/30 flex items-center justify-center font-display font-black text-primary text-3xl shadow-[0_0_20px_hsla(var(--primary),0.2)] overflow-hidden relative group">
                  {data.equipo.logo ? (
                    <img 
                      src={data.equipo.logo.startsWith('http') ? data.equipo.logo : `${api.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:8000'}${data.equipo.logo}`} 
                      alt="Escudo" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    data.equipo.abreviatura
                  )}
                  <div className="absolute inset-0 border-2 border-primary/50 rounded-2xl pointer-events-none"></div>
                </div>
                
                <div className="space-y-1">
                  <h1 className="text-xl font-display font-black text-foreground tracking-wider uppercase">
                    {data.equipo.nombre}
                  </h1>
                  <Badge variant="success" className="text-[10px]">Capitán Mánager</Badge>
                </div>
              </div>

              {/* Información Técnica del Club */}
              <div className="bg-background/50 border-t border-border/30 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground uppercase tracking-widest font-bold text-[10px]">Plataforma Base</span>
                  <strong className="text-foreground uppercase">{data.equipo.plataforma}</strong>
                </div>

                <div className="space-y-2">
                  <span className="text-muted-foreground uppercase tracking-widest font-bold text-[10px] block">Ligas / Organizaciones</span>
                  {data.organizaciones.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {data.organizaciones.map((org) => {
                        const isSelected = data.organizacionId === org.id;
                        return (
                          <button
                            key={org.id}
                            onClick={() => actions.selectOrganizacion(org.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider border transition-all duration-300 cursor-pointer flex items-center justify-between group ${
                              isSelected
                                ? 'bg-primary/10 text-primary border-primary/40 shadow-[0_0_10px_hsla(var(--primary),0.15)] font-bold'
                                : 'bg-card/40 text-muted-foreground border-border/30 hover:border-primary/30 hover:text-foreground hover:bg-card/60'
                            }`}
                          >
                            <span className="truncate pr-2">🏢 {org.nombre}</span>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsla(var(--primary),0.8)] animate-pulse shrink-0"></span>}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <Badge variant="error" className="w-full justify-center">Sin Ligas</Badge>
                  )}
                </div>
              </div>
            </Card>

            {/* Menú de Navegación Lateral (Sidebar) */}
            <nav className="flex flex-row xl:flex-col gap-2 overflow-x-auto xl:overflow-visible pb-2 xl:pb-0 no-scrollbar">
              {tabsConfig.map((tab) => {
                const isActive = data.activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => actions.setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 cursor-pointer border group relative overflow-hidden shrink-0 xl:shrink w-full ${
                      isActive 
                        ? 'bg-primary/10 text-primary border-primary/30 shadow-inner' 
                        : 'bg-card/40 text-muted-foreground border-border/30 hover:text-foreground hover:border-primary/30 hover:bg-card/60'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none -z-10"></div>
                    )}
                    <span className={`text-base transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                    
                    {/* Borde activo lateral */}
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_hsla(var(--primary),0.8)]"></div>}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* ÁREA DE CONTENIDO PRINCIPAL */}
          <div className="flex-1 w-full relative min-w-0 pb-12 min-h-[800px]">
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
                  onSearchChange={actions.setSearchJugadorTerm} 
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
          </div>

        </div>
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