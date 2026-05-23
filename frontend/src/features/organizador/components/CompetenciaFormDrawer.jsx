import React from 'react';
import Drawer from '@/components/shared/Drawer';
import Button from '@/components/shared/Button';
import Input from '@/components/shared/Input';
import Select from '@/components/shared/Select';

export default function CompetenciaFormDrawer({ isOpen, onClose, onSave, formData, setFormData, isSaving, isEditing }) {
  
  // Generador de Slug simple al cambiar el nombre
  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    setFormData({ ...formData, nombre: name, slug });
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={isEditing ? "Editar Competencia" : "Nueva Competencia"}>
      <form className="space-y-5" onSubmit={onSave}>
        <Input label="Nombre de la Competencia" value={formData.nombre} onChange={handleNameChange} required placeholder="ej. Liga Pro FC26" />
        <Input label="URL Slug" value={formData.slug} readOnly className="bg-muted/50 cursor-not-allowed" />
        
        <div className="grid grid-cols-2 gap-4">
          <Input label="Premio ($)" type="number" value={formData.prize_pool} onChange={(e) => setFormData({...formData, prize_pool: e.target.value})} />
          <Input label="Costo ($)" type="number" value={formData.entry_fee} onChange={(e) => setFormData({...formData, entry_fee: e.target.value})} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select 
            label="Formato" 
            value={formData.formato} 
            onChange={(e) => setFormData({...formData, formato: e.target.value})} 
            options={[{value:'liga', label:'Liga'}, {value:'copa', label:'Copa'}, {value:'eliminatoria', label:'Eliminatoria'}]} 
          />
          <Input label="Cupos" type="number" value={formData.max_participantes} onChange={(e) => setFormData({...formData, max_participantes: e.target.value})} />
        </div>

        <Select 
            label="Estado" 
            value={formData.estado} 
            onChange={(e) => setFormData({...formData, estado: e.target.value})} 
            options={[
                {value:'borrador', label:'Borrador'},
                {value:'inscripciones', label:'Inscripciones'},
                {value:'en_curso', label:'En Curso'},
                {value:'finalizada', label:'Finalizada'}
            ]} 
        />

        <Button type="submit" disabled={isSaving} className="w-full h-12 mt-4">
          {isSaving ? "Guardando..." : "Guardar Competencia"}
        </Button>
      </form>
    </Drawer>
  );
}