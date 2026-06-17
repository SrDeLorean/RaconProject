import React from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ImageUploader from '@/components/ui/ImageUploader';
import Card from '@/components/shared/Card';

export default function OficinaClub({ formData, setFormData, formErrors, isSaving, onSave }) {
  return (
    <Card className="max-w-5xl w-full" padding="p-6" withGlow={true}>
      <div className="border-b border-border/30 pb-4 mb-6">
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
          <span>⚙️</span> Oficina Directiva y Ficha Técnica
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">Configura la identidad oficial y redes de comunicación de tu club competitivo.</p>
      </div>
      
      <form className="space-y-6" onSubmit={onSave}>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Columna Izquierda: Branding Multimedia (5/12 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card/40 border border-border/40 p-5 rounded-2xl space-y-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
              
              <h4 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-border/20 pb-2">
                Branding e Imagen Corporativa
              </h4>
              
              <div className="space-y-5">
                <div className="bg-background/40 p-4 rounded-xl border border-border/20 hover:border-primary/20 transition-colors">
                  <ImageUploader 
                    label="Escudo del Club (Logotipo)" 
                    value={formData.logo} 
                    onChange={(url) => setFormData({ ...formData, logo: url })}
                    folder="equipos"
                  />
                  <span className="text-[9px] text-muted-foreground block mt-2 leading-relaxed pl-1">
                    Recomendado: Imagen cuadrada (PNG transparente) de al menos 256x256 píxeles.
                  </span>
                </div>
                
                <div className="bg-background/40 p-4 rounded-xl border border-border/20 hover:border-primary/20 transition-colors">
                  <ImageUploader 
                    label="Banner de la Sede" 
                    value={formData.banner} 
                    onChange={(url) => setFormData({ ...formData, banner: url })}
                    folder="equipos"
                  />
                  <span className="text-[9px] text-muted-foreground block mt-2 leading-relaxed pl-1">
                    Recomendado: Relación de aspecto 16:9 o banner apaisado para la portada de la sede.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Identidad, API e Integración Social (7/12 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Ficha Básica */}
            <div className="bg-card/40 border border-border/40 p-5 rounded-2xl space-y-5 relative">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-border/20 pb-2">
                Identidad de Escuadra
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input 
                    label="Nombre del Club *" 
                    value={formData.nombre} 
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                    error={formErrors?.nombre?.[0]} 
                    className="focus:ring-primary/25"
                    required
                  />
                </div>
                
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

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Biografía o Manifiesto del Club</label>
                <textarea 
                  className="w-full flex min-h-[90px] rounded-lg border border-input bg-background/50 px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all leading-relaxed"
                  placeholder="Describe la filosofía, los objetivos deportivos o el palmarés histórico de tu club competitivo..."
                  value={formData.descripcion} 
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                />
                {formErrors?.descripcion?.[0] && <span className="text-[10px] text-destructive mt-1 font-bold">{formErrors.descripcion[0]}</span>}
              </div>
            </div>

            {/* Redes Sociales */}
            <div className="bg-card/40 border border-border/40 p-5 rounded-2xl space-y-4">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-border/20 pb-2">
                Canales Oficiales y Streaming
              </h4>
              
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
            </div>
          </div>
          
        </div>

        {/* Acciones del Formulario */}
        <div className="flex justify-end pt-4 border-t border-border/20">
          <Button 
            type="submit" 
            isLoading={isSaving} 
            className="bg-primary text-primary-foreground font-black uppercase tracking-widest px-8 text-xs h-10 shadow-[0_0_15px_hsla(var(--primary),0.3)] hover:shadow-[0_0_20px_hsla(var(--primary),0.55)] transition-all"
          >
            Actualizar Perfil Corporativo
          </Button>
        </div>
      </form>
    </Card>
  );
}