import React, { useEffect } from 'react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ImageUploader from '@/components/ui/ImageUploader';

export default function OrganizacionFormDrawer({ 
  isOpen, 
  onClose, 
  onSave, 
  isSaving, 
  selectedOrganizacion, 
  formData, 
  setFormData,
  formErrors = {}, 
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
      <form className="flex flex-col gap-6 pt-2 pb-10 max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar px-1" onSubmit={(e) => e.preventDefault()}>
        
        {/* ========================================================================= */}
        {/* SECCIÓN 1: DATOS GENERALES                                                */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-border/30 pb-1.5 flex items-center gap-1.5">
            <span>🏢</span> Datos Generales de la Liga
          </h4>

          <Input 
            label="Nombre de la Organización / Liga *" 
            placeholder="Ej. Torneos Pro Latam" 
            value={formData.nombre} 
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
            disabled={isSaving} 
            error={formErrors?.nombre?.[0]} 
            required
          />

          <Input 
            label="Slug de Identificación en URL *" 
            placeholder="ej-torneos-pro-latam" 
            value={formData.slug} 
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} 
            disabled={isSaving}
            error={formErrors?.slug?.[0]} 
            required
            icon={<span className="text-xs font-mono opacity-50">/org/</span>}
          />

          <Select 
            label="Asignar Usuario Administrador / Dueño *" 
            value={formData.owner_id} 
            onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })} 
            disabled={isSaving} 
            error={formErrors?.owner_id?.[0]} 
            options={[
              { value: '', label: 'Selecciona un usuario organizador...' },
              ...ownerOptions
            ]}
            required
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
              Descripción / Presentación
            </label>
            <textarea 
              className="w-full bg-background/50 border border-border/80 rounded-md px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all custom-scrollbar min-h-[80px]"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Describe los objetivos, premios o historia de la comunidad..."
              disabled={isSaving}
            ></textarea>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 2: PERSONALIZACIÓN Y MULTIMEDIA                                   */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-border/30 pb-1.5 flex items-center gap-1.5">
            <span>🎨</span> Personalización & Branding
          </h4>

          <ImageUploader 
            label="Logotipo de la Organización" 
            value={formData.logo} 
            onChange={(url) => setFormData({ ...formData, logo: url })}
            folder="organizaciones"
          />

          <ImageUploader 
            label="Banner Oficial" 
            value={formData.banner} 
            onChange={(url) => setFormData({ ...formData, banner: url })}
            folder="organizaciones"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-technical text-muted-foreground ml-1">
              Color del Tema de la Marca
            </label>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                className="w-12 h-10 bg-background border border-border rounded-lg cursor-pointer p-1"
                value={formData.color_hex}
                onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                disabled={isSaving}
              />
              <Input 
                value={formData.color_hex}
                onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                placeholder="#ef4444"
                disabled={isSaving}
                className="flex-1 !gap-0"
                error={formErrors?.color_hex?.[0]}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 3: CONTACTO Y REDES SOCIALES                                      */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-border/30 pb-1.5 flex items-center gap-1.5">
            <span>🌐</span> Contacto & Redes Sociales
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Correo de Contacto" 
              type="email"
              placeholder="contacto@liga.com"
              value={formData.email_contacto} 
              onChange={(e) => setFormData({ ...formData, email_contacto: e.target.value })} 
              disabled={isSaving}
              error={formErrors?.email_contacto?.[0]}
            />
            
            <Input 
              label="País (Código de 2 letras)" 
              placeholder="Ej: CL, AR, ES"
              value={formData.pais} 
              onChange={(e) => setFormData({ ...formData, pais: e.target.value.toUpperCase().substring(0, 2) })} 
              disabled={isSaving}
              error={formErrors?.pais?.[0]}
            />
          </div>

          <Input 
            label="Sitio Web Oficial" 
            placeholder="https://tupagina.com"
            value={formData.website} 
            onChange={(e) => setFormData({ ...formData, website: e.target.value })} 
            disabled={isSaving}
            error={formErrors?.website?.[0]}
            icon={<span className="opacity-70">🔗</span>}
          />

          <Input 
            label="Invitación de Discord" 
            placeholder="https://discord.gg/invite"
            value={formData.discord_url} 
            onChange={(e) => setFormData({ ...formData, discord_url: e.target.value })} 
            disabled={isSaving}
            error={formErrors?.discord_url?.[0]}
            icon={<span className="opacity-70">💬</span>}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Twitter / X" 
              placeholder="https://twitter.com/tu_cuenta"
              value={formData.twitter_url} 
              onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })} 
              disabled={isSaving}
              error={formErrors?.twitter_url?.[0]}
              icon={<span className="opacity-70">🐦</span>}
            />

            <Input 
              label="Canal de Twitch" 
              placeholder="https://twitch.tv/tu_canal"
              value={formData.twitch_url} 
              onChange={(e) => setFormData({ ...formData, twitch_url: e.target.value })} 
              disabled={isSaving}
              error={formErrors?.twitch_url?.[0]}
              icon={<span className="opacity-70">🎮</span>}
            />
          </div>
        </div>

      </form>
    </Drawer>
  );
}