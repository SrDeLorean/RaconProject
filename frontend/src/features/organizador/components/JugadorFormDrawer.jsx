import React from 'react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function JugadorFormDrawer({ 
  isOpen, 
  onClose, 
  onSave, 
  isSaving, 
  selectedJugador, 
  formData, 
  setFormData,
  formErrors = {} 
}) {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={selectedJugador ? "Modificar Ficha de Competidor" : "Inscribir Nuevo Jugador Pro"}
      footer={
        <div className="flex flex-col-reverse sm:flex-row gap-4 w-full mt-2">
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
            {selectedJugador ? "Guardar Cambios" : "Confirmar Registro"}
          </Button>
        </div>
      }
    >
      <form className="flex flex-col gap-6 pt-2 pb-6" onSubmit={(e) => e.preventDefault()}>
        
        {/* --- SECCIÓN 1: IDENTIDAD E-SPORTS --- */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-border/50 pb-2">Identidad E-Sports</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Gamertag (Apodo) *" 
              placeholder="Ej. xX_ProGamer_Xx" 
              value={formData.gamertag} 
              onChange={(e) => setFormData({ ...formData, gamertag: e.target.value })} 
              disabled={isSaving} 
              error={formErrors?.gamertag?.[0]} 
              required
            />
            <Input 
              label="EA ID (Cuenta Origin) *" 
              placeholder="EA_NickName" 
              value={formData.id_ea} 
              onChange={(e) => setFormData({ ...formData, id_ea: e.target.value })} 
              disabled={isSaving} 
              error={formErrors?.id_ea?.[0]} 
              required
            />
          </div>
          <Select 
            label="Plataforma Principal" 
            value={formData.plataforma} 
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

        {/* --- SECCIÓN 2: DATOS PERSONALES --- */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-2">Información de Contacto</h3>
          <Input 
            label="Nombre Real *" 
            placeholder="Juan Pérez" 
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
            disabled={isSaving} 
            error={formErrors?.name?.[0]} 
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Correo Electrónico *" 
              type="email" 
              placeholder="competidor@fc26.com" 
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              disabled={isSaving} 
              error={formErrors?.email?.[0]} 
              required
            />
            <Input 
              label="Teléfono / WhatsApp" 
              placeholder="+56 9 1234 5678" 
              value={formData.telefono} 
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} 
              disabled={isSaving} 
              error={formErrors?.telefono?.[0]} 
            />
          </div>
          <Input 
            label={selectedJugador ? "Nueva Contraseña (Opcional)" : "Contraseña Temporal *"} 
            type="password" 
            placeholder="••••••••" 
            value={formData.password} 
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
            disabled={isSaving} 
            error={formErrors?.password?.[0]} 
          />
        </div>

        {/* --- SECCIÓN 3: PERFIL DEPORTIVO (Opcional) --- */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-2">Perfil Deportivo</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Input 
              label="Nacionalidad" 
              placeholder="Ej. Chile" 
              value={formData.nacionalidad} 
              onChange={(e) => setFormData({ ...formData, nacionalidad: e.target.value })} 
              disabled={isSaving} 
              error={formErrors?.nacionalidad?.[0]} 
            />
            <Input 
              label="Posición" 
              placeholder="Ej. DFC, MC, DC" 
              value={formData.posicion} 
              onChange={(e) => setFormData({ ...formData, posicion: e.target.value })} 
              disabled={isSaving} 
              error={formErrors?.posicion?.[0]} 
            />
            <Input 
              label="Nacimiento" 
              type="date"
              value={formData.fecha_nacimiento} 
              onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })} 
              disabled={isSaving} 
              error={formErrors?.fecha_nacimiento?.[0]} 
            />
            <Input 
              label="Altura (cm)" 
              type="number"
              placeholder="180" 
              value={formData.altura} 
              onChange={(e) => setFormData({ ...formData, altura: e.target.value })} 
              disabled={isSaving} 
              error={formErrors?.altura?.[0]} 
            />
            <Input 
              label="Peso (kg)" 
              type="number"
              placeholder="75" 
              value={formData.peso} 
              onChange={(e) => setFormData({ ...formData, peso: e.target.value })} 
              disabled={isSaving} 
              error={formErrors?.peso?.[0]} 
            />
          </div>
        </div>
        
        {/* --- SECCIÓN 4: ADMINISTRACIÓN --- */}
        <div className="mt-2 bg-muted/30 p-4 rounded-lg border border-border/50">
          <Select 
            label="Estado del Jugador" 
            value={formData.status} 
            onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
            disabled={isSaving} 
            error={formErrors?.status?.[0]} 
            options={[
              { value: 'activo', label: '🟢 Activo / Habilitado' }, 
              { value: 'inactivo', label: '⚫ Inactivo' }, 
              { value: 'suspendido', label: '🔴 Suspendido' }
            ]} 
          />
        </div>

      </form>
    </Drawer>
  );
}