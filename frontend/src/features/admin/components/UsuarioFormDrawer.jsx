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
          placeholder="juan@torneosprofc.com" 
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
            error={formErrors?.role?.[0]} 
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
            error={formErrors?.status?.[0]} 
            options={[
              { value: 'activo', label: 'Activo' }, 
              { value: 'inactivo', label: 'Inactivo' }, 
              { value: 'suspendido', label: 'Suspendido' }
            ]} 
          />
        </div>

        {/* --- DATOS EXCLUSIVOS DEL JUGADOR (SI ROL ES JUGADOR) --- */}
        {formData.role === 'jugador' && (
          <div className="space-y-6 mt-4 pt-4 border-t border-border/40 animate-fade-in">
            {/* Sección: Identidad Gamer */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-border/50 pb-2">Identidad E-Sports</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                  label="Gamertag (Apodo) *" 
                  placeholder="Ej. xX_ProGamer_Xx" 
                  value={formData.gamertag || ''} 
                  onChange={(e) => setFormData({ ...formData, gamertag: e.target.value })} 
                  disabled={isSaving} 
                  error={formErrors?.gamertag?.[0]} 
                  required
                />
                <Input 
                  label="EA ID (Cuenta Origin) *" 
                  placeholder="EA_NickName" 
                  value={formData.id_ea || ''} 
                  onChange={(e) => setFormData({ ...formData, id_ea: e.target.value })} 
                  disabled={isSaving} 
                  error={formErrors?.id_ea?.[0]} 
                  required
                />
              </div>
              <Select 
                label="Plataforma Principal" 
                value={formData.plataforma || 'crossplay'} 
                onChange={(e) => setFormData({ ...formData, plataforma: e.target.value })} 
                disabled={isSaving} 
                error={formErrors?.plataforma?.[0]} 
                options={[
                  { value: 'crossplay', label: 'Crossplay (Cualquiera)' }, 
                  { value: 'ps5', label: 'PlayStation 5' }, 
                  { value: 'xbox', label: 'Xbox Series X/S' },
                  { value: 'pc', label: 'PC (Origin/Steam)' }
                ]} 
              />
            </div>

            {/* Sección: Perfil Deportivo */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-2">Perfil Deportivo</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Input 
                  label="Nacionalidad" 
                  placeholder="Ej. Chile" 
                  value={formData.nacionalidad || ''} 
                  onChange={(e) => setFormData({ ...formData, nacionalidad: e.target.value })} 
                  disabled={isSaving} 
                  error={formErrors?.nacionalidad?.[0]} 
                />
                <Input 
                  label="Posición" 
                  placeholder="Ej. DFC, MC, DC" 
                  value={formData.posicion || ''} 
                  onChange={(e) => setFormData({ ...formData, posicion: e.target.value })} 
                  disabled={isSaving} 
                  error={formErrors?.posicion?.[0]} 
                />
                <Input 
                  label="Nacimiento" 
                  type="date"
                  value={formData.fecha_nacimiento || ''} 
                  onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })} 
                  disabled={isSaving} 
                  error={formErrors?.fecha_nacimiento?.[0]} 
                />
                <Input 
                  label="Altura (cm)" 
                  type="number"
                  placeholder="180" 
                  value={formData.altura || ''} 
                  onChange={(e) => setFormData({ ...formData, altura: e.target.value })} 
                  disabled={isSaving} 
                  error={formErrors?.altura?.[0]} 
                />
                <Input 
                  label="Peso (kg)" 
                  type="number"
                  placeholder="75" 
                  value={formData.peso || ''} 
                  onChange={(e) => setFormData({ ...formData, peso: e.target.value })} 
                  disabled={isSaving} 
                  error={formErrors?.peso?.[0]} 
                />
                <Input 
                  label="Teléfono / WhatsApp" 
                  placeholder="+56 9 1234 5678" 
                  value={formData.telefono || ''} 
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} 
                  disabled={isSaving} 
                  error={formErrors?.telefono?.[0]} 
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </Drawer>
  );
}