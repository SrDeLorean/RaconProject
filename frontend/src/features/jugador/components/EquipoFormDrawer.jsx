import React from 'react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ImageUploader from '@/components/ui/ImageUploader';

export default function EquipoFormDrawer({ 
  isOpen, 
  onClose, 
  onSave, 
  isSaving, 
  selectedEquipo, 
  formData, 
  setFormData,
  formErrors = {} 
}) {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={selectedEquipo ? "Modificar Perfil del Equipo" : "Registrar Nuevo Equipo"}
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
            {selectedEquipo ? "Guardar Cambios" : "Confirmar Registro"}
          </Button>
        </div>
      }
    >
      <form className="flex flex-col gap-6 pt-2 pb-6" onSubmit={(e) => e.preventDefault()}>
        
        {/* --- SECCIÓN 1: IDENTIDAD DEL CLUB --- */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-border/50 pb-2">Identidad del Club</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageUploader 
              label="Escudo del Club (Logo)" 
              value={formData.logo} 
              onChange={(url) => setFormData({ ...formData, logo: url })}
              folder="equipos"
            />
            <ImageUploader 
              label="Banner del Sede" 
              value={formData.banner} 
              onChange={(url) => setFormData({ ...formData, banner: url })}
              folder="equipos"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Nombre del Equipo *" 
              placeholder="Ej. Deportivo Pro" 
              value={formData.nombre} 
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
              disabled={isSaving} 
              error={formErrors?.nombre?.[0]} 
              required
            />
            <Input 
              label="Abreviatura (Tag) *" 
              placeholder="Ej. DEP" 
              maxLength={10}
              value={formData.abreviatura} 
              onChange={(e) => setFormData({ ...formData, abreviatura: e.target.value })} 
              disabled={isSaving} 
              error={formErrors?.abreviatura?.[0]} 
              required
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-foreground">Descripción / Bio</label>
            <textarea 
              className="w-full flex min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Historia del club, palmarés, visión..."
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              disabled={isSaving}
            />
            {formErrors?.descripcion?.[0] && <span className="text-xs text-destructive mt-1">{formErrors.descripcion[0]}</span>}
          </div>
        </div>

        {/* --- SECCIÓN 2: COMPETICIÓN Y REDES --- */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-2">Competición y Presencia</h3>
          
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

          <Input 
            label="ID de Club EA Sports (API)" 
            placeholder="Ej. 50846" 
            value={formData.club_id_ea || ''} 
            onChange={(e) => setFormData({ ...formData, club_id_ea: e.target.value })} 
            disabled={isSaving} 
            error={formErrors?.club_id_ea?.[0]} 
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Usuario de Twitter / X" 
              placeholder="Ej. @deportivo_fc" 
              value={formData.twitter} 
              onChange={(e) => setFormData({ ...formData, twitter: e.target.value })} 
              disabled={isSaving} 
            />
            <Input 
              label="Canal de Twitch" 
              placeholder="Ej. twitch.tv/equipo" 
              value={formData.twitch} 
              onChange={(e) => setFormData({ ...formData, twitch: e.target.value })} 
              disabled={isSaving} 
            />
          </div>
        </div>
        
        {/* --- SECCIÓN 3: ADMINISTRACIÓN --- */}
        <div className="mt-2 bg-muted/30 p-4 rounded-lg border border-border/50">
          <Select 
            label="Estado del Equipo" 
            value={formData.estado} 
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })} 
            disabled={isSaving} 
            error={formErrors?.estado?.[0]} 
            options={[
              { value: '1', label: '🟢 Activo / Compitiendo' }, 
              { value: '0', label: '🔴 Inactivo / Disuelto' }
            ]} 
          />
        </div>

      </form>
    </Drawer>
  );
}