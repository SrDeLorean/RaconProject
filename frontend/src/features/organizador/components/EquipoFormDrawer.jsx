import React from 'react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ImageUploader from '@/components/ui/ImageUploader';

export default function EquipoFormDrawer({
  isOpen, onClose, onSave, isSaving, selectedEquipo, formData, setFormData, formErrors = {},
  capitanesList = []
}) {
  const optionsCapitanes = capitanesList.map(c => ({
    value: c.id,
    label: `${c.name} (${c.email})`
  }));

  const handleRedSocialChange = (key, val) => {
    setFormData(prev => ({
      ...prev,
      redes_sociales: {
        ...prev.redes_sociales,
        [key]: val
      }
    }));
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={selectedEquipo ? "Editar Ficha de Club" : "Crear Club Deportivo"}
      footer={
        <div className="flex flex-col-reverse sm:flex-row gap-4 w-full mt-2">
          <Button variant="outline" className="flex-1 h-12 border-border/60 text-foreground" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={onSave} isLoading={isSaving} className="flex-1 h-12 bg-gradient-to-r from-primary to-destructive text-primary-foreground font-display font-black uppercase shadow-lg">
            {selectedEquipo ? "Guardar Ajustes" : "Crear Club"}
          </Button>
        </div>
      }
    >
      <form className="flex flex-col gap-6 pt-2 pb-8" onSubmit={(e) => e.preventDefault()}>
        
        {/* IDENTIDAD DEL CLUB */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-border/50 pb-1.5">Identidad Corporativa</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Nombre del Club *" 
              placeholder="Ej. Real Betis eSports" 
              value={formData.nombre} 
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
              error={formErrors?.nombre?.[0]} 
              disabled={isSaving} 
              required 
            />
            <Input 
              label="Tag / Abreviatura *" 
              placeholder="Ej. BET" 
              value={formData.abreviatura} 
              onChange={(e) => setFormData({ ...formData, abreviatura: e.target.value.toUpperCase() })} 
              error={formErrors?.abreviatura?.[0]} 
              disabled={isSaving} 
              required 
            />
          </div>
          
          <Input 
            label="Descripción del Club" 
            placeholder="Breve reseña histórica o lema..." 
            value={formData.descripcion} 
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} 
            error={formErrors?.descripcion?.[0]} 
            disabled={isSaving} 
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageUploader 
              label="Escudo / Logo Oficial" 
              value={formData.logo} 
              onChange={(url) => setFormData({ ...formData, logo: url })} 
              folder="equipos"
              disabled={isSaving}
            />
            <ImageUploader 
              label="Banner de Presentación" 
              value={formData.banner} 
              onChange={(url) => setFormData({ ...formData, banner: url })} 
              folder="equipos"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* PARÁMETROS DE JUEGO */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-1.5">Plataforma y EA Sports</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select 
              label="Plataforma de Juego *" 
              value={formData.plataforma} 
              onChange={(e) => setFormData({ ...formData, plataforma: e.target.value })} 
              disabled={isSaving} 
              options={[
                { value: 'crossplay', label: 'Crossplay' },
                { value: 'ps5', label: 'PlayStation 5' },
                { value: 'xbox', label: 'Xbox Series' },
                { value: 'pc', label: 'PC Windows' }
              ]} 
            />
            <Input 
              label="Club ID EA Sports" 
              placeholder="Ej. 18239023" 
              value={formData.club_id_ea} 
              onChange={(e) => setFormData({ ...formData, club_id_ea: e.target.value })} 
              error={formErrors?.club_id_ea?.[0]} 
              disabled={isSaving} 
            />
          </div>
        </div>

        {/* ROLES Y REDES */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-1.5">Representante y Redes</h3>
          <Select 
            label="Capitán / Manager *" 
            value={formData.id_capitan} 
            onChange={(e) => setFormData({ ...formData, id_capitan: e.target.value })} 
            error={formErrors?.id_capitan?.[0]} 
            disabled={isSaving} 
            options={[
              { value: '', label: 'Selecciona un capitán de club...' },
              ...optionsCapitanes
            ]} 
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Input 
              label="Enlace de Twitter (X)" 
              placeholder="Ej. realbetisesports" 
              value={formData.redes_sociales?.twitter || ''} 
              onChange={(e) => handleRedSocialChange('twitter', e.target.value)} 
              disabled={isSaving} 
            />
            <Input 
              label="Enlace de Twitch" 
              placeholder="Ej. realbetisesports" 
              value={formData.redes_sociales?.twitch || ''} 
              onChange={(e) => handleRedSocialChange('twitch', e.target.value)} 
              disabled={isSaving} 
            />
            <Input 
              label="Enlace de Instagram" 
              placeholder="Ej. realbetisesports" 
              value={formData.redes_sociales?.instagram || ''} 
              onChange={(e) => handleRedSocialChange('instagram', e.target.value)} 
              disabled={isSaving} 
            />
            <Input 
              label="Enlace de YouTube" 
              placeholder="Ej. youtube.com/@Club" 
              value={formData.redes_sociales?.youtube || ''} 
              onChange={(e) => handleRedSocialChange('youtube', e.target.value)} 
              disabled={isSaving} 
            />
            <Input 
              label="Enlace de TikTok" 
              placeholder="Ej. realbetisesports" 
              value={formData.redes_sociales?.tiktok || ''} 
              onChange={(e) => handleRedSocialChange('tiktok', e.target.value)} 
              disabled={isSaving} 
            />
            <Input 
              label="WhatsApp" 
              placeholder="Ej. +56912345678" 
              value={formData.redes_sociales?.whatsapp || ''} 
              onChange={(e) => handleRedSocialChange('whatsapp', e.target.value)} 
              disabled={isSaving} 
            />
          </div>
        </div>

        {/* ESTADO OPERATIVO */}
        <div className="bg-muted/30 p-4 rounded-lg border border-border/50 mt-2">
          <Select 
            label="Estado del Club" 
            value={formData.estado ? 'true' : 'false'} 
            onChange={(e) => setFormData({ ...formData, estado: e.target.value === 'true' })} 
            disabled={isSaving} 
            options={[
              { value: 'true', label: '🟢 Activo en Torneos' },
              { value: 'false', label: '🔴 Inactivo / Suspendido' }
            ]} 
          />
        </div>

      </form>
    </Drawer>
  );
}
