import React, { useEffect } from 'react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function TemporadaFormDrawer({ 
  isOpen, 
  onClose, 
  onSave, 
  isSaving, 
  selectedTemporada, 
  formData, 
  setFormData,
  formErrors = {} 
}) {

  // Generador de slugs inteligente
  useEffect(() => {
    if (!selectedTemporada && formData.nombre) {
      const generatedSlug = formData.nombre
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') 
        .replace(/\s+/g, '-');        
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.nombre, selectedTemporada, setFormData]);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={selectedTemporada ? "Modificar Parámetros de Temporada" : "Inaugurar Nueva Temporada"}
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
            {selectedTemporada ? "Guardar Cambios" : "Lanzar Temporada"}
          </Button>
        </div>
      }
    >
      <form className="flex flex-col gap-5 pt-2" onSubmit={(e) => e.preventDefault()}>
        
        <Input 
          label="Nombre de la Temporada *" 
          placeholder="Ej. Temporada 1 - Apertura" 
          value={formData.nombre} 
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
          disabled={isSaving} 
          error={formErrors?.nombre?.[0]}
          required
        />

        <Input 
          label="Identificador de URL (Slug) *" 
          placeholder="temporada-1-apertura" 
          value={formData.slug} 
          onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} 
          disabled={isSaving}
          error={formErrors?.slug?.[0]}
          required
          icon={<span className="text-xs font-mono opacity-50">/ciclo/</span>}
        />

        <Select 
          label="Estado del Mercado de Pases *" 
          value={formData.estado_mercado} 
          onChange={(e) => setFormData({ ...formData, estado_mercado: e.target.value })} 
          disabled={isSaving} 
          error={formErrors?.estado_mercado?.[0]}
          options={[
            { value: 'abierto', label: '🔓 Abierto (Libre tránsito de jugadores)' }, 
            { value: 'cerrado', label: '🔒 Cerrado (Requiere aprobación y pago administrativo)' }
          ]} 
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label="Fecha de Inicio" 
            type="date"
            value={formData.fecha_inicio} 
            onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })} 
            disabled={isSaving} 
            error={formErrors?.fecha_inicio?.[0]}
          />
          <Input 
            label="Fecha de Término" 
            type="date"
            value={formData.fecha_fin} 
            onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })} 
            disabled={isSaving} 
            error={formErrors?.fecha_fin?.[0]}
          />
        </div>

        <div className="mt-2 bg-muted/30 p-4 rounded-lg border border-border/50">
          <Select 
            label="Disponibilidad del Ciclo" 
            value={formData.activa} 
            onChange={(e) => setFormData({ ...formData, activa: e.target.value === 'true' })} 
            disabled={isSaving} 
            error={formErrors?.activa?.[0]}
            options={[
              { value: 'true', label: '🟢 Temporada Activa / Vigente' }, 
              { value: 'false', label: '⚫ Temporada Inactiva / Histórica' }
            ]} 
          />
        </div>

      </form>
    </Drawer>
  );
}