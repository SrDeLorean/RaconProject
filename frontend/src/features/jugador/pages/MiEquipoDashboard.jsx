import React, { useMemo } from 'react';
import { useMiEquipo } from '../hooks/useMiEquipo';

// Componentes UI de Uso Común (Shared)
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';
import DeleteModal from '@/components/shared/DeleteModal';

// Módulos Internos Especializados
import ResumenClub from './components/ResumenClub';
import PlantillaClub from './components/PlantillaClub';
import CompeticionClub from './components/CompeticionClub';
import OficinaClub from './components/OficinaClub';
import EquipoFormDrawer from '../components/EquipoFormDrawer';

export default function MiEquipoDashboard() {
  const { data, ui, form, actions } = useMiEquipo();

  // Menú Secundario de Operaciones
  const tabsConfig = useMemo(() => [
    { id: 'resumen', label: 'Resumen', icon: '📊' },
    { id: 'roster', label: 'Plantilla & Roster', icon: '👥' },
    { id: 'competencias', label: 'Competición', icon: '🏆' },
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
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/50 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-destructive/20 border border-primary/30 flex items-center justify-center font-display font-black text-primary text-xl shadow-inner">
                {data.equipo.abreviatura}
              </div>
              <div>
                <h1 className="text-2xl font-display font-black text-foreground tracking-wide uppercase flex items-center gap-2">
                  {data.equipo.nombre}
                  <Badge variant="success">Capitán</Badge>
                </h1>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">
                  Ecosistema: <span className="text-foreground font-semibold">{data.equipo.plataforma}</span>
                </p>
              </div>
            </div>

            {/* SELECCIÓN DE PESTAÑAS (MÓDULOS) */}
            <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border border-border/40 w-full md:w-auto overflow-x-auto">
              {tabsConfig.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => actions.setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    data.activeTab === tab.id 
                      ? 'bg-background text-primary shadow-sm border border-border/40' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
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
                onSearchChange={(val) => {
                  actions.setSearchJugadorTerm(val);
                  actions.buscarJugadoresLibres(val);
                }}
                onFichar={actions.handleFicharJugador}
                onDesvincular={actions.openDesvincular}
              />
            )}

            {data.activeTab === 'competencias' && (
              <CompeticionClub 
                competencias={data.competencias} 
                onInscribir={actions.handleInscribirCompetencia} 
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