import React, { useMemo } from 'react';
import { useMiEquipo } from '../hooks/useMiEquipo';
import api from '@/api/axios';

// Componentes UI de Uso Común (Shared)
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';
import DeleteModal from '@/components/shared/DeleteModal';
import Card from '@/components/shared/Card';
import PageHelp from '@/components/shared/PageHelp';

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

  const transfersDisabled = useMemo(() => {
    return (data.competencias || []).some(c => 
      c.estado_inscripcion === 'aprobado' && 
      c.config?.sin_transferencias === true
    );
  }, [data.competencias]);

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
        <div className="flex flex-col gap-6 relative">
          
          {/* CABECERA PREMIUM: HUD DE IDENTIDAD DEL CLUB */}
          <div className="w-full relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-r from-card/90 via-card/75 to-transparent backdrop-blur-md p-6 shadow-xl group">
            {/* Brillo ambiental neón */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-transparent rounded-2xl blur-xl opacity-50 pointer-events-none -z-10"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
              {/* Bloque Izquierdo: Shield y Detalles del Club */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                {/* Escudo del Club */}
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-background to-card border border-primary/30 flex items-center justify-center font-display font-black text-primary text-3xl shadow-[0_0_20px_hsla(var(--primary),0.25)] overflow-hidden relative shrink-0 group-hover:scale-105 transition-transform duration-300">
                  {data.equipo.logo ? (
                    <img 
                      src={typeof window.mediaUrl === 'function' ? window.mediaUrl(data.equipo.logo, 'team_logo') : data.equipo.logo} 
                      alt="Escudo" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    data.equipo.abreviatura
                  )}
                  <div className="absolute inset-0 border-2 border-primary/50 rounded-2xl pointer-events-none"></div>
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-wider uppercase drop-shadow-[0_0_10px_rgba(0,0,0,0.4)]">
                      {data.equipo.nombre}
                    </h1>
                    <span className="font-display font-black text-primary text-sm uppercase bg-primary/15 border border-primary/30 px-3 py-0.5 rounded-lg w-fit mx-auto sm:mx-0">
                      [{data.equipo.abreviatura || 'S/T'}]
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <Badge variant="success" className="text-[9px] uppercase font-black tracking-widest px-2.5 py-0.5">Capitán Mánager</Badge>
                    <span className="text-muted-foreground font-mono text-[10px] uppercase font-bold bg-muted/40 border border-border/40 px-2 py-0.5 rounded">
                      🎮 Plataforma: <strong className="text-foreground uppercase">{data.equipo.plataforma}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Selector de Ligas a la Derecha */}
              <div className="w-full md:w-auto flex flex-col gap-1.5 shrink-0 bg-card/60 border border-border/40 p-4 rounded-xl max-w-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
                <span className="text-muted-foreground uppercase tracking-widest font-black text-[9px] block text-center md:text-left">Circuito Competitivo Activo</span>
                
                {data.organizaciones.length > 0 ? (
                  <div className="relative">
                    <select
                      value={data.organizacionId || ''}
                      onChange={(e) => actions.selectOrganizacion(Number(e.target.value))}
                      className="w-full h-10 px-3.5 pr-8 bg-background border border-border/50 rounded-lg text-xs font-black text-foreground uppercase tracking-wider focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none cursor-pointer appearance-none"
                    >
                      {data.organizaciones.map((org) => (
                        <option key={org.id} value={org.id} className="bg-card text-foreground">
                          🏢 {org.nombre}
                        </option>
                      ))}
                    </select>
                    {/* Flecha personalizada */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-muted-foreground text-[10px]">
                      ▼
                    </div>
                  </div>
                ) : (
                  <Badge variant="error" className="w-full justify-center text-[9px] font-black uppercase tracking-wider py-1.5">Sin Ligas Activas</Badge>
                )}
              </div>
            </div>
          </div>

          {/* BARRA DE NAVEGACIÓN HORIZONTAL */}
          <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 bg-background/95 backdrop-blur-md border-b border-border/30 shadow-[0_4px_20px_rgba(0,0,0,0.2)] py-1.5 transition-all">
            <nav className="flex items-center gap-2 overflow-x-auto mobile-scroll-indicator scroll-smooth pt-1.5 pb-2.5">
              {tabsConfig.map((tab) => {
                const isActive = data.activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => actions.setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 cursor-pointer border group relative overflow-hidden shrink-0 ${
                      isActive 
                        ? 'bg-primary/10 text-primary border-primary/30 shadow-[inset_0_0_15px_hsla(var(--primary),0.05)] font-black' 
                        : 'bg-card/40 text-muted-foreground border-white/5 hover:text-foreground hover:border-primary/20 hover:bg-card/60'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none -z-10"></div>
                    )}
                    <span className={`text-sm sm:text-base transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                    
                    {/* Borde activo inferior */}
                    {isActive && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary shadow-[0_0_10px_hsla(var(--primary),0.8)]"></div>}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* ÁREA DE CONTENIDO PRINCIPAL */}
          <div className="w-full relative min-w-0 pb-12 min-h-[calc(100vh-150px)] flex flex-col">
            <div className="animate-fade-in flex-1 flex flex-col" key={data.activeTab}>
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
                  transfersDisabled={transfersDisabled}
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

      <PageHelp 
        title="Centro de Operaciones del Club"
        description="Esta pantalla te permite administrar el club eSports que fundaste o del cual eres Mánager y Capitán. Puedes armar la cabecera, gestionar el roster, reportar resultados y ajustar la oficina."
        steps={[
          {
            title: "HUD Superior del Club",
            description: "Muestra la identidad oficial de tu club (logo, nombre, abreviatura y plataforma). En la esquina derecha encuentras el selector desplegable para cambiar de Liga u Organización y visualizar sus datos asociados."
          },
          {
            title: "Navegación por Pestañas (Sticky)",
            description: "Usa la barra horizontal para alternar rápidamente entre Resumen Táctico, Plantilla & Roster, Competiciones, Calendario/Reportes y la Oficina Directiva."
          },
          {
            title: "Resumen Táctico",
            description: "Visualiza de forma rápida las estadísticas acumuladas en la liga activa (PJ, victorias, empates, derrotas, goles favor/contra), el win rate, el próximo partido agendado, y la distribución de posiciones en tu roster."
          },
          {
            title: "Plantilla & Roster",
            description: "Administra a tus competidores inscritos con demarcación táctica colorizada. Aquí mismo puedes configurar sus números de camiseta, buscar y fichar agentes libres y ver el historial de solicitudes aprobadas/rechazadas."
          },
          {
            title: "Competiciones e Inscripciones",
            description: "Revisa en qué competencias oficiales está registrado tu club, o busca ligas disponibles para inscribir a tu escuadra de forma inmediata."
          },
          {
            title: "Oficina Directiva",
            description: "Gestiona de forma estructurada los recursos multimedia (escudo y banner) y la configuración técnica (nombre, TAG, ID EA Sports y redes sociales de Twitter/Twitch)."
          }
        ]}
      />
    </div>
  );
}