import React from 'react';
import { useUsuarios } from '../hooks/useUsuarios';

// Componentes UI Transversales (Shared)
import DataTable from '@/components/shared/DataTable';
import CrudHeader from '@/components/shared/CrudHeader';
import DeleteModal from '@/components/shared/DeleteModal';
import Badge from '@/components/shared/Badge';
import Button from '@/components/shared/Button';
import Alert from '@/components/shared/Alert';

// Componentes de Dominio Único
import UsuarioFormDrawer from '../components/UsuarioFormDrawer';

export default function UsuariosCRUD() {
  const { data, ui, form, actions } = useUsuarios();

  const tabsConfig = [
    { id: 'todos', label: 'Todos', icon: '👥' },
    { id: 'administrador', label: 'Administradores', icon: '⚡' },
    { id: 'organizador', label: 'Organizadores', icon: '🏢' },
    { id: 'jugador', label: 'Jugadores', icon: '🎮' },
  ];

  const columnas = [
    { 
      header: 'Usuario', 
      render: (row) => (
        <div className="flex items-center gap-3">
          {/* Avatar dinámico estilo Producción */}
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-display font-bold text-lg shadow-sm shrink-0">
            {row.name ? row.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-sm">{row.name}</span>
            <span className="text-xs text-muted-foreground">{row.email}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Rol', 
      render: (row) => {
        // Estilos semánticos dependiendo del rol
        const roleStyles = {
          administrador: 'bg-destructive/10 text-destructive border-destructive/20',
          organizador: 'bg-primary/10 text-primary border-primary/20',
          jugador: 'bg-muted text-foreground border-border/50'
        };
        const currentStyle = roleStyles[row.role] || roleStyles.jugador;
        const roleName = row.role === 'administrador' ? '⚡ Admin' : row.role === 'organizador' ? '🏢 Org' : '🎮 Jugador';

        return (
          <span className={`px-2.5 py-1 rounded-md text-[11px] font-black tracking-wider uppercase border ${currentStyle}`}>
            {roleName}
          </span>
        );
      }
    },
    { 
      header: 'Estado', 
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
            Eliminar
          </Button>
        </div>
      )
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative">
      
      {/* Alertas Flotantes Globales */}
      {ui.notification && (
        <Alert variant={ui.notification.variant} className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" onClose={() => actions.setNotification(null)}>
          {ui.notification.text}
        </Alert>
      )}

      {/* Cabecera del CRUD (Aquí el CrudHeader debería tener bg-transparent o bg-card) */}
      <CrudHeader 
        title="Gestión de Usuarios"
        description="Administra los accesos y roles del sistema."
        buttonText="+ Nuevo Usuario"
        onAddClick={() => actions.openDrawer(null)}
        tabs={tabsConfig}
        activeTab={data.activeTab}
        onTabChange={(tabId) => { 
          actions.setActiveTab(tabId); 
          actions.setCurrentPage(1); 
        }}
      />

      {/* Contenedor de la Tabla con Skeleton/Loader Superpuesto */}
      <div className="relative">
        {ui.isFetching && data.usuarios.length > 0 && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-30 flex items-center justify-center rounded-xl transition-all duration-300">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              <span className="text-sm font-bold tracking-widest text-primary uppercase animate-pulse">Actualizando...</span>
            </div>
          </div>
        )}
        
        <DataTable 
          title={`Registros (${data.totalRecords})`}
          columns={columnas}
          data={data.usuarios} 
          searchPlaceholder="Buscar por nombre o correo..."
          onSearch={(value) => { 
            actions.setSearchTerm(value); 
            actions.setCurrentPage(1); 
          }} 
          currentPage={data.currentPage}
          totalPages={data.totalPages} 
          totalRecords={data.totalRecords}
          perPage={10}
          isLoading={ui.isFetching}
          onPageChange={(page) => actions.setCurrentPage(page)}
        />
      </div>

      <UsuarioFormDrawer 
        isOpen={ui.isDrawerOpen}
        onClose={actions.closeDrawer}
        onSave={actions.handleSave}
        isSaving={ui.isSaving}
        selectedUsuario={ui.selectedUsuario}
        formData={form.formData}
        setFormData={form.setFormData}
      />

      <DeleteModal
        isOpen={ui.isDeleteModalOpen}
        onClose={actions.closeDeleteModal}
        onConfirm={actions.executeDelete}
        isDeleting={ui.isDeleting}
        title="Eliminar Usuario"
        message={
          <>
            Estás a punto de eliminar a <strong className="text-foreground">{ui.userToDelete?.name}</strong>. Esta acción eliminará permanentemente su acceso y no se puede deshacer.
          </>
        }
      />
    </div>
  );
}