import React from 'react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function UsuarioFormDrawer({ 
  isOpen, 
  onClose, 
  onSave, 
  isSaving, 
  selectedUsuario, 
  formData, 
  setFormData,
  formErrors = {} // 🔥 Nuevo prop con valor por defecto
}) {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={selectedUsuario ? "Editar Perfil de Usuario" : "Nuevo Usuario Competitivo"}
      footer={
        <div className="flex gap-4 w-full mt-2">
          <Button 
            variant="outline" 
            className="flex-1 h-12 border-border/60 text-foreground hover:bg-muted font-bold tracking-wide transition-colors duration-200" 
            onClick={onClose} 
            disabled={isSaving}
          >
            Cancelar
          </Button>
          
          <Button 
            type="button"
            onClick={onSave} 
            isLoading={isSaving}
            className="flex-1 h-12 bg-gradient-to-r from-primary to-destructive text-primary-foreground font-display font-black tracking-wider uppercase text-base border-transparent shadow-[0_0_15px_hsla(var(--primary),0.3)] hover:shadow-[0_0_25px_hsla(var(--primary),0.6)] transition-all duration-300"
          >
            {selectedUsuario ? "Guardar Cambios" : "Crear Usuario"}
          </Button>
        </div>
      }
    >
      <form className="flex flex-col gap-5 pt-2" onSubmit={(e) => e.preventDefault()}>
        <Input 
          label="Nombre Completo / Organización *" 
          placeholder="Ej. Clan Alpha o Juan Pérez" 
          value={formData.name} 
          onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
          disabled={isSaving} 
          error={formErrors?.name?.[0]} // 🔥 Muestra el error específico de Laravel
          required
        />
        <Input 
          label="Correo Electrónico *" 
          type="email" 
          placeholder="juan@raconpro.com" 
          value={formData.email} 
          onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
          disabled={isSaving} 
          error={formErrors?.email?.[0]} // 🔥
          required
        />
        <Input 
          label={selectedUsuario ? "Nueva Contraseña (Opcional)" : "Contraseña de Acceso *"} 
          type="password" 
          placeholder="••••••••" 
          value={formData.password} 
          onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
          disabled={isSaving} 
          error={formErrors?.password?.[0]} // 🔥
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
          <Select 
            label="Asignar Rol *" 
            value={formData.role} 
            onChange={(e) => setFormData({ ...formData, role: e.target.value })} 
            disabled={isSaving} 
            error={formErrors?.role?.[0]} // 🔥
            options={[
              { value: 'administrador', label: 'Administrador (⚡)' }, 
              { value: 'organizador', label: 'Organizador (🏢)' }, 
              { value: 'jugador', label: 'Jugador (🎮)' }
            ]} 
          />
          <Select 
            label="Estado del Sistema" 
            value={formData.status} 
            onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
            disabled={isSaving} 
            error={formErrors?.status?.[0]} // 🔥
            options={[
              { value: 'activo', label: 'Activo' }, 
              { value: 'inactivo', label: 'Inactivo' }, 
              { value: 'suspendido', label: 'Suspendido' }
            ]} 
          />
        </div>
      </form>
    </Drawer>
  );
}