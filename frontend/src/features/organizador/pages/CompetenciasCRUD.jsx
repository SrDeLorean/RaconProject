import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompetencias } from '../hooks/useCompetencias';

// Componentes UI Compartidos
import DataTable from '@/components/ui/DataTable';
import CrudHeader from '@/components/shared/CrudHeader';
import DeleteModal from '@/components/shared/DeleteModal';
import PageHelp from '@/components/shared/PageHelp';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';
import Select from '@/components/ui/Select';

// Formulario de Creación/Edición
import CompetenciaFormDrawer from '../components/CompetenciaFormDrawer';

export default function CompetenciasCRUD() {
  const navigate = useNavigate();
  const { data, ui, form, actions } = useCompetencias();

  // Pestañas de filtrado rápido por estado
  const tabsConfig = useMemo(() => [
    { id: 'todos', label: 'Todas las Divisiones', icon: '🏆' },
    { id: 'borrador', label: 'Borrador', icon: '🛠️' },
    { id: 'inscripciones', label: 'Inscripciones', icon: '📝' },
    { id: 'en_curso', label: 'En Curso', icon: '⚽' },
    { id: 'finalizada', label: 'Concluidas', icon: '🏁' },
  ], []);

  // Mapeo dinámico de las temporadas para el Select del filtro superior
  const opcionesFiltroTemporadas = useMemo(() => {
    return data.temporadasList.map(t => ({
      value: t.id,
      label: t.nombre
    }));
  }, [data.temporadasList]);

  // Configuración de las columnas de la tabla
  const columnas = useMemo(() => [
    { 
      header: 'División', 
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
      header: 'Formato', 
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground text-sm uppercase font-mono">{row.formato}</span>
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
          
          {/* 🔥 BOTÓN MAESTRO: Navega al Dashboard de la Competencia */}
          <Button 
            variant="solid" 
            size="sm" 
            className="h-8 px-3 text-xs bg-foreground text-background font-bold shadow-sm hover:scale-[1.02] transition-transform"
            onClick={() => navigate(`/organizador/competencias/${row.id}`)}
          >
            ⚙️ Gestionar
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 text-xs border-border/50 text-foreground hover:bg-muted" 
            onClick={() => actions.openDrawer(row)}
          >
            Editar
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50" 
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
        title="Consola de Divisiones" 
        description="Estructura, supervisa y despliega las ligas globales creadas en tu comunidad." 
        buttonText="+ Nueva División" 
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
            actions.setCurrentPage(1); // Volvemos a la página 1 al filtrar
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
          title="Directorio de Competencias Activas" 
          columns={columnas} 
          data={data.competencias} 
          searchPlaceholder="Filtrar por nombre de liga..." 
          onSearch={(value) => { actions.setSearchTerm(value); actions.setCurrentPage(1); }} 
          currentPage={data.currentPage} 
          totalPages={data.totalPages} 
          totalRecords={data.totalRecords} 
          perPage={10} 
          isLoading={ui.isFetching && data.competencias.length === 0} 
          onPageChange={(page) => actions.setCurrentPage(page)} 
        />
      </div>

      {/* DRAWER: CREAR/EDITAR LA DIVISIÓN */}
      <CompetenciaFormDrawer 
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
        title="Eliminar Competencia"
        message="¿Estás seguro de eliminar esta competencia? Se borrarán inscripciones y partidos vinculados de manera permanente."
        isDeleting={ui.isDeleting}
      />

      <PageHelp 
        title="Torneos Clubes Pro (11v11)"
        description="Este es el motor de los torneos 11 contra 11. Aquí defines cómo, cuándo y por qué premio competirán los equipos."
        steps={[
          {
            title: "Alta del Torneo",
            description: "Haz clic en 'Crear' para configurar los reglamentos financieros (Prize Pool e Inscripción) y las plazas máximas que admitirás."
          },
          {
            title: "Fases del Torneo",
            description: "Selecciona el Formato: Liga Regular (todos contra todos), Playoffs (llaves eliminatorias directas) o Fase de Grupos + Eliminatorias."
          },
          {
            title: "Manejo de Estados",
            description: "El torneo inicia en 'Inscripciones' para recibir clubes. Una vez lleno, edítalo a 'En Curso' para bloquear inscripciones y permitir carga de partidos."
          },
          {
            title: "Botón de Acceso Profundo",
            description: "Haz clic en 'Gestionar' dentro de la tabla para entrar al panel profundo de esa liga y aceptar solicitudes."
          }
        ]}
      />
    </div>
  );
}