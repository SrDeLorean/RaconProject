import React, { useEffect } from 'react';
import { useCompetencias } from '../hooks/useCompetencias';
import DataTable from '@/components/shared/DataTable';
import CrudHeader from '@/components/shared/CrudHeader';
import CompetenciaFormDrawer from '../components/CompetenciaFormDrawer';

export default function CompetenciasCRUD() {
  const { 
    competencias, isFetching, isDrawerOpen, setIsDrawerOpen, 
    selected, setSelected, formData, setFormData, 
    fetchCompetencias, saveCompetencia 
  } = useCompetencias();

  const handleEdit = (comp) => {
    setSelected(comp);
    setFormData(comp); // Asume que formData coincide con la estructura de la competencia
    setIsDrawerOpen(true);
  };

  const columns = [
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Formato', accessor: 'formato' },
    { header: 'Premio', render: (row) => <span className="font-mono text-primary">${row.prize_pool}</span> },
    { header: 'Estado', render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.estado === 'en_curso' ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-400'
        }`}>
            {row.estado}
        </span>
    )},
    { header: 'Acciones', render: (row) => (
        <button onClick={() => handleEdit(row)} className="text-primary hover:underline">Editar</button>
    )}
  ];

  return (
    <div className="space-y-6">
      <CrudHeader 
        title="Gestión de Competencias" 
        buttonText="Nueva Competencia" 
        onAddClick={() => { setSelected(null); setIsDrawerOpen(true); }} 
      />
      
      <div className="bg-bg-surface rounded-2xl border border-border shadow-sm">
        <DataTable columns={columns} data={competencias} isLoading={isFetching} />
      </div>

      <CompetenciaFormDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onSave={saveCompetencia}
        formData={formData}
        setFormData={setFormData}
        isEditing={!!selected}
      />
    </div>
  );
}