import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompetenciasUt } from '../hooks/useCompetenciasUt';

// Componentes UI Compartidos
import DataTable from '@/components/ui/DataTable';
import CrudHeader from '@/components/shared/CrudHeader';
import DeleteModal from '@/components/shared/DeleteModal';
import PageHelp from '@/components/shared/PageHelp';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';
import Select from '@/components/ui/Select';

// Formulario de Creación/Edición UT
import CompetenciaUtFormDrawer from '../components/CompetenciaUtFormDrawer';

export default function CompetenciasUtCRUD() {
  const navigate = useNavigate();
  const { data, ui, form, actions } = useCompetenciasUt();

  const tabsConfig = useMemo(() => [
    { id: 'todos', label: 'Todos los Torneos UT', icon: '🏆' },
    { id: 'borrador', label: 'Borrador', icon: '🛠️' },
    { id: 'inscripciones', label: 'Inscripciones', icon: '📝' },
    { id: 'en_curso', label: 'En Curso', icon: '⚽' },
    { id: 'finalizada', label: 'Concluidos', icon: '🏁' },
  ], []);

  const opcionesFiltroTemporadas = useMemo(() => {
    return data.temporadasList.map(t => ({
      value: t.id,
      label: t.nombre
    }));
  }, [data.temporadasList]);

  const columnas = useMemo(() => [
    { 
      header: 'Torneo UT', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border border-border shadow-sm shrink-0" style={{ backgroundColor: row.color_tema || '#ef4444' }} />
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-sm uppercase">{row.nombre}</span>
            <span className="text-xs text-muted-foreground">{row.slug}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Temporada Vinc.', 
      render: (row) => (
        <span className="text-xs font-semibold text-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/40 uppercase tracking-wide">
          {row.temporada?.nombre || 'Sin ciclo'}
        </span>
      )
    },
    { 
      header: 'Tipo y Formato', 
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground text-sm uppercase font-mono">
            {row.tipo} — {row.formato}
          </span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{row.plataforma}</span>
        </div>
      )
    },
    { 
      header: 'Finanzas', 
      render: (row) => (
        <div className="flex flex-col text-xs font-mono">
          <span className="text-muted-foreground">Inscripción: ${row.entry_fee}</span>
          <span className="text-primary font-bold">Premio: ${row.prize_pool}</span>
        </div>
      )
    },
    { 
      header: 'Cupos', 
      render: (row) => (
        <Badge variant={row.equipos_count >= row.max_participantes ? 'error' : 'neutral'}>
          {row.equipos_count || 0} / {row.max_participantes}
        </Badge>
      )
    },
    { 
      header: 'Fase', 
      render: (row) => {
        const variant = row.estado === 'en_curso' ? 'success' : row.estado === 'inscripciones' ? 'brand' : row.estado === 'finalizada' ? 'error' : 'neutral';
        return <Badge variant={variant} className="uppercase text-[10px] tracking-wider font-bold">{row.estado}</Badge>;
      }
    },
    { 
      header: 'Acciones', 
      render: (row) => (
        <div className="flex items-center gap-2">
          
          <Button 
            variant="solid" 
            size="sm" 
            className="h-8 px-3 text-xs bg-foreground text-background font-bold shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
            onClick={() => navigate(`/organizador/competencias-ut/${row.id}`)}
          >
            ⚙️ Gestionar
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 text-xs border-border/50 text-foreground hover:bg-muted cursor-pointer" 
            onClick={() => actions.openDrawer(row)}
          >
            Editar
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 cursor-pointer" 
            onClick={() => actions.confirmDelete(row)}
          >
            Borrar
          </Button>
        </div>
      )
    },
  ], [actions, navigate]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative">
      
      {/* Alerta Global Flotante */}
      {ui.notification && (
        <Alert variant={ui.notification.variant} className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" onClose={() => actions.setNotification(null)}>
          {ui.notification.text}
        </Alert>
      )}

      {/* Cabecera del CRUD */}
      <CrudHeader 
        title="Consola de Torneos UT" 
        description="Estructura, supervisa y despliega las copas y ligas de Ultimate Team (1v1 y 2v2) creadas en tu comunidad." 
        buttonText="+ Nuevo Torneo UT" 
        onAddClick={() => actions.openDrawer(null)} 
        tabs={tabsConfig} 
        activeTab={data.activeTab} 
        onTabChange={(tabId) => { actions.setActiveTab(tabId); actions.setCurrentPage(1); }} 
      />

      {/* TOOLBAR SUPERIOR DE FILTRADO EXPRESS */}
      <div className="max-w-xs bg-background rounded-xl border border-border/40 p-1 -mb-2 shadow-sm">
        <Select
          value={data.filterTemporadaId}
          onChange={(e) => {
            actions.setFilterTemporadaId(e.target.value);
            actions.setCurrentPage(1);
          }}
          options={[
            { value: '', label: '🔍 Mostrar Todas las Temporadas' },
            ...opcionesFiltroTemporadas
          ]}
        />
      </div>

      {/* Tabla de Datos Principal */}
      <div className="relative">
        {ui.isFetching && data.competencias.length > 0 && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-30 flex items-center justify-center rounded-xl transition-all duration-300">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        <DataTable 
          title="Directorio de Torneos Ultimate Team" 
          columns={columnas} 
          data={data.competencias} 
          searchPlaceholder="Filtrar por nombre del torneo..." 
          onSearch={(value) => { actions.setSearchTerm(value); actions.setCurrentPage(1); }} 
          currentPage={data.currentPage} 
          totalPages={data.totalPages} 
          totalRecords={data.totalRecords} 
          perPage={10} 
          isLoading={ui.isFetching && data.competencias.length === 0} 
          onPageChange={(page) => actions.setCurrentPage(page)} 
        />
      </div>

      {/* DRAWER: CREAR/EDITAR EL TORNEO UT */}
      <CompetenciaUtFormDrawer 
        isOpen={ui.isDrawerOpen} 
        onClose={actions.closeDrawer} 
        onSave={actions.handleSave} 
        isSaving={ui.isSaving} 
        selectedCompetencia={ui.selectedCompetencia} 
        formData={form.formData} 
        setFormData={form.setFormData} 
        formErrors={form.formErrors} 
        temporadasList={data.temporadasList} 
      />

      {/* MODAL: CONFIRMAR ELIMINACIÓN */}
      <DeleteModal
        isOpen={ui.isDeleteModalOpen}
        onClose={actions.closeDeleteModal}
        onConfirm={actions.executeDelete}
        title="Eliminar Competencia UT"
        message="¿Estás seguro de eliminar esta competencia? Se borrarán inscripciones y partidos vinculados de manera irreversible."
        isDeleting={ui.isDeleting}
      />

      <PageHelp 
        title="Torneos Ultimate Team"
        description="Gestor oficial para modalidades reducidas (UT 1v1 y Co-op 2v2)."
        steps={[
          {
            title: "Configuración UT",
            description: "Configura si el campeonato se jugará de forma individual (1v1) o en parejas (2v2) mediante el menú Modalidad."
          },
          {
            title: "Estructuras de Juego",
            description: "Al igual que en Clubes Pro, puedes establecer Ligas o Copas Eliminatorias. Recuerda definir el cupo máximo para que las inscripciones se bloqueen solas."
          },
          {
            title: "Panel Específico",
            description: "Utiliza el botón 'Gestionar' en la tabla para acceder al cuadro de la liga, revisar los rosters UT y aprobar a los participantes."
          }
        ]}
      />
    </div>
  );
}
