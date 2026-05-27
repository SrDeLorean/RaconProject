import React from 'react';
import { useOrganizaciones } from '../hooks/useOrganizaciones';

// Componentes UI Transversales (Shared)
import DataTable from '@/components/ui/DataTable';
import CrudHeader from '@/components/shared/CrudHeader';
import DeleteModal from '@/components/shared/DeleteModal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';

// Componente del Módulo
import OrganizacionFormDrawer from '../components/OrganizacionFormDrawer';

export default function OrganizacionesCRUD() {
  const { data, ui, form, actions } = useOrganizaciones();

  const tabsConfig = [
    { id: 'todas', label: 'Todas', icon: '🏢' },
    { id: 'activo', label: 'Activas', icon: '✅' },
    { id: 'inactivo', label: 'Inactivas', icon: '⚠️' },
    { id: 'suspendido', label: 'Suspendidas', icon: '🚫' },
  ];

  const columnas = [
    { 
      header: 'Organización', 
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.logo ? (
            <img src={row.logo} alt={row.nombre} className="w-10 h-10 rounded-xl object-cover border border-border/50" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/10 to-destructive/10 border border-primary/20 flex items-center justify-center text-primary font-display font-black text-lg shrink-0 shadow-sm">
              {row.nombre ? row.nombre.charAt(0).toUpperCase() : 'O'}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-sm">{row.nombre}</span>
            <span className="text-xs text-muted-foreground">/org/{row.slug}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Organizador (Dueño)', 
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground text-sm">{row.owner?.name || 'Sin asignar'}</span>
          <span className="text-xs text-muted-foreground">{row.owner?.email || '—'}</span>
        </div>
      )
    },
    { 
      header: 'Verificación', 
      render: (row) => (
        <Badge variant={row.is_verified ? 'success' : 'neutral'}>
          {row.is_verified ? '⚡ Verificada' : 'Estándar'}
        </Badge>
      )
    },
    { 
      header: 'Estado', 
      render: (row) => (
        <Badge variant={row.estado === 'activo' ? 'success' : row.estado === 'inactivo' ? 'neutral' : 'error'}>
          {row.estado || 'Activo'}
        </Badge>
      )
    },
    { 
      header: 'Acciones', 
      render: (row) => (
        <div className="flex items-center gap-2">
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
            Eliminar
          </Button>
        </div>
      )
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative">
      
      {ui.notification && (
        <Alert variant={ui.notification.variant} className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" onClose={() => actions.setNotification(null)}>
          {ui.notification.text}
        </Alert>
      )}

      <CrudHeader 
        title="Gestión de Organizaciones"
        description="Controla las ligas, comunidades y organizadores del sistema."
        buttonText="+ Nueva Organización"
        onAddClick={() => actions.openDrawer(null)}
        tabs={tabsConfig}
        activeTab={data.activeTab}
        onTabChange={(tabId) => { 
          actions.setActiveTab(tabId); 
          actions.setCurrentPage(1); 
        }}
      />

      <div className="relative">
        {ui.isFetching && data.organizaciones.length > 0 && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-30 flex items-center justify-center rounded-xl transition-all duration-300">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              <span className="text-sm font-bold tracking-widest text-primary uppercase animate-pulse">Sincronizando...</span>
            </div>
          </div>
        )}
        
        <DataTable 
          title={`Registros de Comunidades (${data.totalRecords})`}
          columns={columnas}
          data={data.organizaciones} 
          searchPlaceholder="Buscar por nombre o slug..."
          onSearch={(value) => { 
            actions.setSearchTerm(value); 
            actions.setCurrentPage(1); 
          }} 
          currentPage={data.currentPage}
          totalPages={data.totalPages} 
          totalRecords={data.totalRecords}
          perPage={10}
          isLoading={ui.isFetching && data.organizaciones.length === 0}
          onPageChange={(page) => actions.setCurrentPage(page)}
        />
      </div>

      <OrganizacionFormDrawer 
        isOpen={ui.isDrawerOpen}
        onClose={actions.closeDrawer}
        onSave={actions.handleSave}
        isSaving={ui.isSaving}
        selectedOrganizacion={ui.selectedOrganizacion}
        formData={form.formData}
        setFormData={form.setFormData}
        formErrors={form.formErrors} // 🔥 Propagamos el objeto de errores hacia el formulario
        usuariosOrganizadores={data.usuariosOrganizadores} 
      />

      <DeleteModal
        isOpen={ui.isDeleteModalOpen}
        onClose={actions.closeDeleteModal}
        onConfirm={actions.executeDelete}
        isDeleting={ui.isDeleting}
        title="Eliminar Organización"
        message={
          <>
            Estás a punto de eliminar permanentemente la organización <strong className="text-foreground">{ui.itemToDelete?.nombre}</strong>. Todos sus torneos asociados quedarán congelados.
          </>
        }
      />
    </div>
  );
}