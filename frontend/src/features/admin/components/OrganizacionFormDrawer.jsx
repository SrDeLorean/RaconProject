import React, { useEffect } from 'react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function OrganizacionFormDrawer({ 
  isOpen, 
  onClose, 
  onSave, 
  isSaving, 
  selectedOrganizacion, 
  formData, 
  setFormData,
  formErrors = {}, // 🔥 Recibimos los errores desde el orquestador
  usuariosOrganizadores = [] 
}) {

  // Auto-generación del slug reactivo
  useEffect(() => {
    if (!selectedOrganizacion && formData.nombre) {
      const generatedSlug = formData.nombre
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') 
        .replace(/\s+/g, '-');        
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.nombre, selectedOrganizacion, setFormData]);

  const ownerOptions = usuariosOrganizadores.map(user => ({
    value: user.id,
    label: `${user.name} (${user.email})`
  }));

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={selectedOrganizacion ? "Configurar Organización" : "Dar de Alta Organización"}
      footer={
        <div className="flex gap-4 w-full mt-2">
          <Button 
            variant="outline" 
            className="flex-1 h-12 border-border/60 text-foreground hover:bg-muted font-bold tracking-wide transition-colors" 
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
            {selectedOrganizacion ? "Guardar Cambios" : "Crear Estructura"}
          </Button>
        </div>
      }
    >
      <form className="flex flex-col gap-5 pt-2" onSubmit={(e) => e.preventDefault()}>
        
        {/* 1. Nombre con binding de errores */}
        <Input 
          label="Nombre de la Organización / Liga *" 
          placeholder="Ej. Torneos Pro Latam" 
          value={formData.nombre} 
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
          disabled={isSaving} 
          error={formErrors?.nombre?.[0]} // 🔥 Inyección visual
          required
        />

        {/* 2. Slug con binding de errores */}
        <Input 
          label="Slug de Identificación en URL *" 
          placeholder="ej-torneos-pro-latam" 
          value={formData.slug} 
          onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} 
          disabled={isSaving}
          error={formErrors?.slug?.[0]} // 🔥 Inyección visual
          required
          icon={<span className="text-xs font-mono opacity-50">/org/</span>}
        />

        {/* 3. Selección del Dueño */}
        <Select 
          label="Asignar Usuario Administrador / Dueño *" 
          value={formData.owner_id} 
          onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })} 
          disabled={isSaving} 
          error={formErrors?.owner_id?.[0]} // 🔥 Inyección visual
          options={[
            { value: '', label: 'Selecciona un usuario organizador...' },
            ...ownerOptions
          ]}
          required
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
          {/* 4. ¿Está verificada? */}
          <Select 
            label="Insignia Oficial" 
            value={formData.is_verified} 
            onChange={(e) => setFormData({ ...formData, is_verified: e.target.value === 'true' })} 
            disabled={isSaving} 
            error={formErrors?.is_verified?.[0]}
            options={[
              { value: 'false', label: 'Cuenta Estándar' }, 
              { value: 'true', label: 'Verificada (🏢)' }
            ]} 
          />

          {/* 5. Estado del servicio */}
          <Select 
            label="Estado Inicial" 
            value={formData.estado} 
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })} 
            disabled={isSaving} 
            error={formErrors?.estado?.[0]}
            options={[
              { value: 'activo', label: 'Activo / Operativo' }, 
              { value: 'inactivo', label: 'Inactivo' }, 
              { value: 'suspendido', label: 'Suspendido' }
            ]} 
          />
        </div>

        <p className="text-xs text-muted-foreground/80 leading-relaxed mt-4 bg-muted/30 p-3 rounded-lg border border-border/30">
          <strong>Nota de Producción:</strong> Los campos de personalización avanzada (banner, biografía, redes sociales y logotipos) quedan delegados para que el dueño asignado los configure desde su panel privado.
        </p>

      </form>
    </Drawer>
  );
}