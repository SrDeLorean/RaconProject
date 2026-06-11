import React, { useMemo } from 'react';
import { useEquipos } from '../hooks/useEquipos';

// Shared UI components
import DataTable from '@/components/ui/DataTable';
import CrudHeader from '@/components/shared/CrudHeader';
import DeleteModal from '@/components/shared/DeleteModal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';

// Domain components
import EquipoFormDrawer from '../components/EquipoFormDrawer';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return typeof window.mediaUrl === 'function' ? window.mediaUrl(path) : `http://localhost:8000${path.startsWith('/') ? path : '/' + path}`;
};

export default function EquiposCRUD() {
  const { data, ui, form, actions } = useEquipos();

  const tabsConfig = useMemo(() => [
    { id: 'todos', label: 'Todos los Equipos', icon: '🛡️' },
    { id: 'crossplay', label: 'Crossplay', icon: '🎮' },
    { id: 'ps5', label: 'PlayStation 5', icon: '🔵' },
    { id: 'xbox', label: 'Xbox Series', icon: '🟢' },
    { id: 'pc', label: 'PC Windows', icon: '💻' }
  ], []);

  const columnas = useMemo(() => [
    {
      header: 'Escudo / Club',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.logo ? (
            <img 
              src={getImageUrl(row.logo)} 
              alt={row.nombre} 
              className="w-10 h-10 rounded-xl object-cover border bg-background shrink-0" 
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-display font-black uppercase text-sm shrink-0">
              {row.abreviatura || row.nombre?.charAt(0)}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-sm uppercase tracking-wide">{row.nombre}</span>
            <span className="text-xs font-mono text-muted-foreground">TAG: {row.abreviatura}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Capitán / Manager',
      render: (row) => (
        <div className="flex flex-col text-xs text-foreground">
          {row.capitan ? (
            <>
              <span className="font-semibold text-foreground">{row.capitan.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono leading-tight">{row.capitan.email}</span>
              <span className="text-[9px] text-primary font-mono font-bold leading-none mt-0.5">{row.capitan.gamertag || 'Sin Gamertag'}</span>
            </>
          ) : (
            <span className="text-muted-foreground italic">Sin capitán asignado</span>
          )}
        </div>
      )
    },
    {
      header: 'Plataforma',
      render: (row) => (
        <span className="text-xs font-mono text-foreground uppercase px-2.5 py-1 rounded bg-muted border border-border/40">
          {row.plataforma || 'crossplay'}
        </span>
      )
    },
    {
      header: 'Estado',
      render: (row) => (
        <Badge variant={row.estado ? 'success' : 'error'}>
          {row.estado ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      header: 'Operaciones',
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
    }
  ], [actions]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative">
      
      {ui.notification && (
        <Alert variant={ui.notification.variant} className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" onClose={() => actions.setNotification(null)}>
          {ui.notification.text}
        </Alert>
      )}

      <CrudHeader
        title="Gestión de Clubes Deportivos"
        description="Revisa, actualiza y edita los datos generales de los equipos de la plataforma, así como sus capitanes y logos oficiales."
        buttonText="+ Nuevo Club"
        onAddClick={() => actions.openDrawer(null)}
        tabs={tabsConfig}
        activeTab={data.activeTab}
        onTabChange={(tabId) => {
          actions.setActiveTab(tabId);
          actions.setCurrentPage(1);
        }}
      />

      <div className="relative">
        {ui.isFetching && data.equipos.length > 0 && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-30 flex items-center justify-center rounded-xl transition-all duration-300">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              <span className="text-sm font-bold tracking-widest text-primary uppercase animate-pulse">Sincronizando Escuadras...</span>
            </div>
          </div>
        )}
        
        <DataTable
          title={`Listado de Equipos (${data.totalRecords})`}
          columns={columnas}
          data={data.equipos}
          searchPlaceholder="Buscar por nombre o abreviatura de club..."
          onSearch={(value) => {
            actions.setSearchTerm(value);
            actions.setCurrentPage(1);
          }}
          currentPage={data.currentPage}
          totalPages={data.totalPages}
          totalRecords={data.totalRecords}
          perPage={10}
          isLoading={ui.isFetching && data.equipos.length === 0}
          onPageChange={(page) => actions.setCurrentPage(page)}
        />
      </div>

      <EquipoFormDrawer
        isOpen={ui.isDrawerOpen}
        onClose={actions.closeDrawer}
        onSave={actions.handleSave}
        isSaving={ui.isSaving}
        selectedEquipo={ui.selectedEquipo}
        formData={form.formData}
        setFormData={form.setFormData}
        formErrors={form.formErrors}
        capitanesList={data.capitanesList}
      />

      <DeleteModal
        isOpen={ui.isDeleteModalOpen}
        onClose={actions.closeDeleteModal}
        onConfirm={actions.executeDelete}
        isDeleting={ui.isDeleting}
        title="Eliminar Club Deportivo"
        message={
          <>
            ¿Confirmas que deseas eliminar permanentemente a <strong className="text-foreground">{ui.itemToDelete?.nombre}</strong>? Esta acción borrará todas sus membresías y registros históricos.
          </>
        }
      />
    </div>
  );
}
