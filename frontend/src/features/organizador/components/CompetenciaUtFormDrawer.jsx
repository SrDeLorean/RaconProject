import React, { useEffect } from 'react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ImageUploader from '@/components/ui/ImageUploader';

export default function CompetenciaUtFormDrawer({ 
  isOpen, onClose, onSave, isSaving, selectedCompetencia, formData, setFormData, formErrors = {}, 
  temporadasList = [] 
}) {

  useEffect(() => {
    if (!selectedCompetencia && formData.nombre) {
      const generatedSlug = formData.nombre.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');        
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.nombre, selectedCompetencia, setFormData]);

  const opcionesTemporadas = temporadasList.map(t => ({
    value: t.id,
    label: t.nombre
  }));

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={selectedCompetencia ? "Configurar Torneo UT" : "Crear Nuevo Torneo UT"}
      footer={
        <div className="flex gap-4 w-full mt-2">
          <Button variant="outline" className="flex-1 h-12 border-border/60 text-foreground" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button onClick={onSave} isLoading={isSaving} className="flex-1 h-12 bg-gradient-to-r from-primary to-destructive text-primary-foreground font-display font-black uppercase shadow-lg">
            {selectedCompetencia ? "Guardar Ajustes" : "Crear Torneo"}
          </Button>
        </div>
      }
    >
      <form className="flex flex-col gap-6 pt-2 pb-8" onSubmit={(e) => e.preventDefault()}>
        
        {/* VINCULACIÓN MAESTRA DE TEMPORADA */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-border/50 pb-1.5">Asignación de Ciclo</h3>
          <Select 
            label="Vincular a Temporada / Torneo Madre *" 
            value={formData.temporada_id} 
            onChange={(e) => setFormData({ ...formData, temporada_id: e.target.value })} 
            disabled={isSaving} 
            error={formErrors?.temporada_id?.[0]}
            options={[
              { value: '', label: 'Selecciona la temporada de destino...' },
              ...opcionesTemporadas
            ]}
            required
          />
        </div>

        {/* IDENTIDAD */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-1.5">Identidad del Torneo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre de Torneo *" placeholder="Ej. Torneo de Campeones UT" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} error={formErrors?.nombre?.[0]} disabled={isSaving} required />
            <Input label="Slug *" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} error={formErrors?.slug?.[0]} disabled={isSaving} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Color Tema (HEX)" type="color" className="h-10 p-1 cursor-pointer" value={formData.color_tema} onChange={(e) => setFormData({ ...formData, color_tema: e.target.value })} disabled={isSaving} />
            <Select label="Privacidad" value={formData.es_publico} onChange={(e) => setFormData({ ...formData, es_publico: e.target.value === 'true' })} disabled={isSaving} options={[{ value: 'true', label: '🌍 Público' }, { value: 'false', label: '🔒 Privado' }]} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageUploader 
              label="Logo de la Competencia" 
              value={formData.logo} 
              onChange={(url) => setFormData({ ...formData, logo: url })} 
              folder="competencias"
              disabled={isSaving}
            />
            <ImageUploader 
              label="Banner de la Competencia" 
              value={formData.banner} 
              onChange={(url) => setFormData({ ...formData, banner: url })} 
              folder="competencias"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* REGLAS Y FORMATO */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-1.5">Reglas y Formato</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Modalidad UT *" value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} disabled={isSaving} options={[{ value: '1vs1', label: '1vs1 UT' }, { value: '2vs2', label: '2vs2 UT' }]} />
            <Select label="Formato *" value={formData.formato} onChange={(e) => setFormData({ ...formData, formato: e.target.value })} disabled={isSaving} options={[{ value: 'liga', label: 'Liga (Todos vs Todos)' }, { value: 'copa', label: 'Copa (Grupos + Playoffs)' }, { value: 'eliminatoria', label: 'Eliminación Directa' }]} />
            <Select label="Plataforma *" value={formData.plataforma} onChange={(e) => setFormData({ ...formData, plataforma: e.target.value })} disabled={isSaving} options={[{ value: 'crossplay', label: 'Crossplay' }, { value: 'ps5', label: 'PlayStation 5' }, { value: 'xbox', label: 'Xbox Series' }, { value: 'pc', label: 'PC Windows' }]} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Inscripción ($)" type="number" value={formData.entry_fee} onChange={(e) => setFormData({ ...formData, entry_fee: e.target.value })} error={formErrors?.entry_fee?.[0]} disabled={isSaving} />
            <Input label="Premios ($)" type="number" value={formData.prize_pool} onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })} error={formErrors?.prize_pool?.[0]} disabled={isSaving} />
            <Input label="Cupos Max *" type="number" value={formData.max_participantes} onChange={(e) => setFormData({ ...formData, max_participantes: e.target.value })} error={formErrors?.max_participantes?.[0]} disabled={isSaving} required />
          </div>
        </div>

        {/* CONFIGURACIÓN AVANZADA DE FASES */}
        {(formData.formato === 'copa' || formData.formato === 'liga' || formData.formato === 'eliminatoria') && (
          <div className="space-y-4 bg-muted/20 p-4 rounded-lg border border-border/40">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-border/50 pb-1.5">Fases y Playoffs Dinámicos</h3>
            
            {formData.formato === 'copa' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select 
                  label="Cantidad de Grupos" 
                  value={formData.config?.cantidad_grupos || 1} 
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    config: { ...(formData.config || {}), cantidad_grupos: parseInt(e.target.value) } 
                  })} 
                  disabled={isSaving} 
                  options={[
                    { value: 1, label: '1 Grupo (Liga Única)' },
                    { value: 2, label: '2 Grupos' },
                    { value: 4, label: '4 Grupos' },
                    { value: 8, label: '8 Grupos' }
                  ]}
                />
                <Select 
                  label="Clasificados por Grupo" 
                  value={formData.config?.clasificados_por_grupo || 2} 
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    config: { ...(formData.config || {}), clasificados_por_grupo: parseInt(e.target.value) } 
                  })} 
                  disabled={isSaving} 
                  options={[
                    { value: 1, label: 'Top 1 (Solo el primero)' },
                    { value: 2, label: 'Top 2 Clasifican' },
                    { value: 3, label: 'Top 3 Clasifican' },
                    { value: 4, label: 'Top 4 Clasifican' }
                  ]}
                />
              </div>
            )}

            {formData.formato === 'liga' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select 
                  label="Clasificados a Playoffs" 
                  value={formData.config?.clasificados_por_grupo || 0} 
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    config: { ...(formData.config || {}), clasificados_por_grupo: parseInt(e.target.value) } 
                  })} 
                  disabled={isSaving} 
                  options={[
                    { value: 0, label: 'Sin Playoffs (Solo liga)' },
                    { value: 2, label: 'Top 2 (Final)' },
                    { value: 4, label: 'Top 4 (Semifinales)' },
                    { value: 8, label: 'Top 8 (Cuartos)' }
                  ]}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select 
                label="Modalidad de Playoffs" 
                value={formData.config?.modo_playoff || 'doble'} 
                onChange={(e) => setFormData({ 
                  ...formData, 
                  config: { ...(formData.config || {}), modo_playoff: e.target.value } 
                })} 
                disabled={isSaving} 
                options={[
                  { value: 'simple', label: 'Solo Ida (Partido único)' },
                  { value: 'doble', label: 'Ida y Vuelta (Doble partido)' }
                ]}
              />
              <div className="flex items-center gap-2 mt-6">
                <input
                  id="auto_avanzar_fase_ut"
                  type="checkbox"
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border bg-background"
                  checked={!!formData.config?.auto_avanzar_fase}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    config: { ...(formData.config || {}), auto_avanzar_fase: e.target.checked } 
                  })}
                  disabled={isSaving}
                />
                <label htmlFor="auto_avanzar_fase_ut" className="text-sm font-medium text-foreground cursor-pointer select-none">
                  Auto-avanzar Fase Automático
                </label>
              </div>
            </div>
          </div>
        )}

        {/* FECHAS */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-1.5">Calendario del Torneo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Apertura Inscripciones" type="datetime-local" value={formData.fecha_inicio_inscripciones} onChange={(e) => setFormData({ ...formData, fecha_inicio_inscripciones: e.target.value })} error={formErrors?.fecha_inicio_inscripciones?.[0]} disabled={isSaving} />
            <Input label="Cierre Inscripciones" type="datetime-local" value={formData.fecha_fin_inscripciones} onChange={(e) => setFormData({ ...formData, fecha_fin_inscripciones: e.target.value })} error={formErrors?.fecha_fin_inscripciones?.[0]} disabled={isSaving} />
          </div>
          <Input label="Kick-off (Inicio Torneo)" type="datetime-local" value={formData.fecha_inicio_competencia} onChange={(e) => setFormData({ ...formData, fecha_inicio_competencia: e.target.value })} error={formErrors?.fecha_inicio_competencia?.[0]} disabled={isSaving} />
        </div>

        {/* ESTADO */}
        <div className="bg-muted/30 p-4 rounded-lg border border-border/50 mt-2">
          <Select label="Estado Operativo" value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} disabled={isSaving} options={[{ value: 'borrador', label: '🛠️ En Borrador (No visible)' }, { value: 'inscripciones', label: '📝 Inscripciones Abiertas' }, { value: 'en_curso', label: '⚽ Torneo en Curso' }, { value: 'finalizada', label: '🏁 Torneo Finalizado' }]} />
        </div>

      </form>
    </Drawer>
  );
}
