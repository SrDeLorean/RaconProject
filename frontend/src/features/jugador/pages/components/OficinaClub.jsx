import React from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ImageUploader from '@/components/ui/ImageUploader';
import Card from '@/components/shared/Card';

export default function OficinaClub({ formData, setFormData, formErrors, isSaving, onSave }) {
  return (
    <Card className="max-w-2xl" padding="p-6" withGlow={true}>
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wide border-b border-border/40 pb-3 mb-5">
        Identidad e Información del Club
      </h3>
      
      <form className="space-y-5" onSubmit={onSave}>
        
        {/* Cargador de multimedia del Club */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 border-b border-border/20">
          <ImageUploader 
            label="Logotipo del Club (Escudo)" 
            value={formData.logo} 
            onChange={(url) => setFormData({ ...formData, logo: url })}
            folder="equipos"
          />
          <ImageUploader 
            label="Banner de la Sede" 
            value={formData.banner} 
            onChange={(url) => setFormData({ ...formData, banner: url })}
            folder="equipos"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input 
            label="Nombre del Club *" 
            value={formData.nombre} 
            onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
            error={formErrors?.nombre?.[0]} 
            required
          />
          <Input 
            label="Abreviatura / TAG *" 
            maxLength={10}
            value={formData.abreviatura} 
            onChange={(e) => setFormData({...formData, abreviatura: e.target.value})} 
            error={formErrors?.abreviatura?.[0]} 
            required
          />
          <Input 
            label="ID de Club EA Sports (API)" 
            placeholder="Ej: 50846"
            value={formData.club_id_ea || ''} 
            onChange={(e) => setFormData({...formData, club_id_ea: e.target.value})} 
            error={formErrors?.club_id_ea?.[0]} 
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-foreground">Biografía o Presentación</label>
          <textarea 
            className="w-full flex min-h-[90px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Describe los objetivos o logros de tu club..."
            value={formData.descripcion} 
            onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
          />
          {formErrors?.descripcion?.[0] && <span className="text-xs text-destructive mt-1">{formErrors.descripcion[0]}</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label="Cuenta de Twitter / X" 
            placeholder="@NombreClub"
            value={formData.twitter} 
            onChange={(e) => setFormData({...formData, twitter: e.target.value})} 
          />
          <Input 
            label="Canal de Twitch" 
            placeholder="twitch.tv/Club"
            value={formData.twitch} 
            onChange={(e) => setFormData({...formData, twitch: e.target.value})} 
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={isSaving} className="bg-primary text-primary-foreground font-bold px-6 text-xs h-10 shadow-[0_0_15px_hsla(var(--primary),0.3)]">
            Actualizar Perfil Corporativo
          </Button>
        </div>
      </form>
    </Card>
  );
}