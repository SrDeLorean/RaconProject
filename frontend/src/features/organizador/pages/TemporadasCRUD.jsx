import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemporadas } from '../hooks/useTemporadas';

// Componentes UI Comunes
import DataTable from '@/components/ui/DataTable';
import CrudHeader from '@/components/shared/CrudHeader';
import DeleteModal from '@/components/shared/DeleteModal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';

// Componente del Dominio
import TemporadaFormDrawer from '../components/TemporadaFormDrawer';

export default function TemporadasCRUD() {
  const navigate = useNavigate();
  const { data, ui, form, actions } = useTemporadas();

  const tabsConfig = useMemo(() => [
    { id: 'todas', label: 'Todo el Historial', icon: '⏳' },
    { id: 'activas', label: 'Ciclos Activos', icon: '🟢' },
    { id: 'inactivas', label: 'Finalizadas', icon: '⚫' },
  ], []);

  const columnas = useMemo(() => [
    { 
      header: 'Temporada / Ciclo', 
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground text-sm uppercase tracking-wide">{row.nombre}</span>
          <span className="text-xs text-muted-foreground">slug: {row.slug}</span>
        </div>
      )
    },
    { 
      header: 'Libro de Pases', 
      render: (row) => (
        <Badge variant={row.estado_mercado === 'abierto' ? 'success' : 'neutral'}>
          {row.estado_mercado === 'abierto' ? '🔓 Mercado Abierto' : '🔒 Mercado Regulado'}
        </Badge>
      )
    },
    { 
      header: 'Vigencia Cronológica', 
      render: (row) => (
        <span className="text-xs font-mono text-foreground">
          {row.fecha_inicio ? row.fecha_inicio : '—'} hasta {row.fecha_fin ? row.fecha_fin : '—'}
        </span>
      )
    },
    { 
      header: 'Estado', 
      render: (row) => (
        <Badge variant={row.activa ? 'success' : 'error'}>
          {row.activa ? 'Vigente' : 'Concluida'}
        </Badge>
      )
    },
    { 
      header: 'Operaciones de Liga', 
      render: (row) => (
        <div className="flex items-center gap-2">
          {/* 🔥 ENLACE CLAVE: Permite descender en la jerarquía hacia las competencias */}
          <Button 
            variant="solid" 
            size="sm" 
            className="h-8 px-3 text-xs bg-foreground text-background font-bold shadow-sm hover:scale-[1.02] transition-transform"
            onClick={() => navigate('/organizador/competencias', { state: { filterTemporadaId: row.id } })}
          >
            🏆 Divisiones
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
            Archivar
          </Button>
        </div>
      )
    },
  ], [actions, navigate]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative">
      
      {ui.notification && (
        <Alert variant={ui.notification.variant} className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" onClose={() => actions.setNotification(null)}>
          {ui.notification.text}
        </Alert>
      )}

      <CrudHeader 
        title="Temporadas de la Comunidad"
        description="Instancia ciclos competitivos anuales o semestrales y controla los periodos de fichajes."
        buttonText="+ Nueva Temporada"
        onAddClick={() => actions.openDrawer(null)}
        tabs={tabsConfig}
        activeTab={data.activeTab}
        onTabChange={(tabId) => { 
          actions.setActiveTab(tabId); 
          actions.setCurrentPage(1); 
        }}
      />

      <div className="relative">
        {ui.isFetching && data.temporadas.length > 0 && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-30 flex items-center justify-center rounded-xl transition-all duration-300">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              <span className="text-sm font-bold tracking-widest text-primary uppercase animate-pulse">Sincronizando Calendarios...</span>
            </div>
          </div>
        )}
        
        <DataTable 
          title={`Historial de Temporadas (${data.totalRecords})`}
          columns={columnas}
          data={data.temporadas} 
          searchPlaceholder="Buscar por nombre de ciclo..."
          onSearch={(value) => { 
            actions.setSearchTerm(value); 
            actions.setCurrentPage(1); 
          }} 
          currentPage={data.currentPage}
          totalPages={data.totalPages} 
          totalRecords={data.totalRecords}
          perPage={10}
          isLoading={ui.isFetching && data.temporadas.length === 0}
          onPageChange={(page) => actions.setCurrentPage(page)}
        />
      </div>

      <TemporadaFormDrawer 
        isOpen={ui.isDrawerOpen}
        onClose={actions.closeDrawer}
        onSave={actions.handleSave}
        isSaving={ui.isSaving}
        selectedTemporada={ui.selectedTemporada}
        formData={form.formData}
        setFormData={form.setFormData}
        formErrors={form.formErrors}
      />

      <DeleteModal
        isOpen={ui.isDeleteModalOpen}
        onClose={actions.closeDeleteModal}
        onConfirm={actions.executeDelete}
        isDeleting={ui.isDeleting}
        title="Archivar Ciclo Cronológico"
        message={
          <>
            ¿Confirmas que deseas archivar la <strong className="text-foreground">{ui.itemToDelete?.nombre}</strong>? Las ligas asociadas pasarán al archivo histórico de la plataforma de forma inmediata.
          </>
        }
      />
    </div>
  );
}