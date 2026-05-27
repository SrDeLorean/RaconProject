import React, { useMemo } from 'react';
import { useJugadores } from '../hooks/useJugadores';

// Componentes UI Transversales (Shared)
import DataTable from '@/components/ui/DataTable';
import CrudHeader from '@/components/shared/CrudHeader';
import DeleteModal from '@/components/shared/DeleteModal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';

// Componentes de Dominio Único
import JugadorFormDrawer from '../components/JugadorFormDrawer';

export default function JugadoresCRUD() {
  const { data, ui, form, actions } = useJugadores();

  // 👥 Tabs adaptados al contexto del Organizador: Filtro por Estado
  const tabsConfig = useMemo(() => [
    { id: 'todos', label: 'Todos los Jugadores', icon: '🎮' },
    { id: 'activo', label: 'Activos', icon: '🟢' },
    { id: 'inactivo', label: 'Inactivos', icon: '⚫' },
    { id: 'suspendido', label: 'Suspendidos', icon: '🔴' },
  ], []);

  // 📊 Columnas optimizadas (Se elimina la columna de Rol por redundancia)
  const columnas = useMemo(() => [
    { 
      header: 'Jugador / Competidor', 
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-display font-bold text-lg shadow-sm shrink-0">
            {row.name ? row.name.charAt(0).toUpperCase() : 'J'}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-sm">{row.name}</span>
            <span className="text-xs text-muted-foreground">{row.email}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Estado de Membresía', 
      render: (row) => (
        <Badge variant={row.status === 'activo' || !row.status ? 'success' : row.status === 'inactivo' ? 'neutral' : 'error'}>
          {row.status || 'Activo'}
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
            Expulsar
          </Button>
        </div>
      )
    },
  ], [actions]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative">
      
      {ui.notification && (
        <Alert variant={ui.notification.variant} className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" onClose={() => actions.setNotification(null)}>
          {ui.notification.text}
        </Alert>
      )}

      <CrudHeader 
        title="Club de Jugadores"
        description="Inscribe y gestiona los competidores autorizados para tus torneos."
        buttonText="+ Inscribir Jugador"
        onAddClick={() => actions.openDrawer(null)}
        tabs={tabsConfig}
        activeTab={data.activeTab}
        onTabChange={(tabId) => { 
          actions.setActiveTab(tabId); 
          actions.setCurrentPage(1); 
        }}
      />

      <div className="relative">
        {ui.isFetching && data.jugadores.length > 0 && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-30 flex items-center justify-center rounded-xl transition-all duration-300">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              <span className="text-sm font-bold tracking-widest text-primary uppercase animate-pulse">Sincronizando...</span>
            </div>
          </div>
        )}
        
        <DataTable 
          title={`Lista de Competidores (${data.totalRecords})`}
          columns={columnas}
          data={data.jugadores} 
          searchPlaceholder="Buscar por gamertag o correo..."
          onSearch={(value) => { 
            actions.setSearchTerm(value); 
            actions.setCurrentPage(1); 
          }} 
          currentPage={data.currentPage}
          totalPages={data.totalPages} 
          totalRecords={data.totalRecords}
          perPage={10}
          isLoading={ui.isFetching && data.jugadores.length === 0}
          onPageChange={(page) => actions.setCurrentPage(page)}
        />
      </div>

      <JugadorFormDrawer 
        isOpen={ui.isDrawerOpen}
        onClose={actions.closeDrawer}
        onSave={actions.handleSave}
        isSaving={ui.isSaving}
        selectedJugador={ui.selectedJugador}
        formData={form.formData}
        setFormData={form.setFormData}
        formErrors={form.formErrors}
      />

      <DeleteModal
        isOpen={ui.isDeleteModalOpen}
        onClose={actions.closeDeleteModal}
        onConfirm={actions.executeDelete}
        isDeleting={ui.isDeleting}
        title="Eliminar Registro de Jugador"
        message={
          <>
            ¿Estás seguro de que deseas eliminar a <strong className="text-foreground">{ui.jugadorToDelete?.name}</strong>? Se perderá su historial de inscripciones inmediatas en tus competencias activas.
          </>
        }
      />
    </div>
  );
}