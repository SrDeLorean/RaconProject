import React, { useState } from 'react';
import Card from '@/components/shared/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import StatCard from '@/components/shared/StatCard';
import EmptyState from '@/components/shared/EmptyState';
import Table from '@/components/shared/Table'; 
import DeleteModal from '@/components/shared/DeleteModal';
import Drawer from '@/components/ui/Drawer';

export default function DesignSystemPreview() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Columnas de prueba para la Tabla
  const columns = [
    { header: 'Torneo', accessor: 'name' },
    { header: 'Categoría', accessor: 'category' },
    { 
      header: 'Estado', 
      render: (row) => <Badge variant={row.status === 'activo' ? 'success' : 'neutral'}>{row.status}</Badge> 
    }
  ];
  
  const data = [
    { name: 'Champions League FC26', category: 'Profesional', status: 'activo' },
    { name: 'Liga de Verano', category: 'Amateur', status: 'finalizado' }
  ];

  return (
    <div className="p-8 lg:p-12 space-y-16 animate-fade-in bg-background min-h-screen text-foreground">
      
      {/* 1. HEADER */}
      <div className="space-y-2 border-b border-border pb-8">
        <h1 className="text-amc-title text-5xl">UI KIT: SISTEMA TÁCTICO FC26</h1>
        <p className="text-description max-w-2xl">
          Previsualización unificada de componentes. Aquí conviven todos los elementos del ecosistema.
        </p>
      </div>

      {/* 2. MÉTRICAS */}
      <section className="space-y-6">
        <h2 className="text-technical text-primary tracking-[0.2em]">01. MÉTRICAS & WIDGETS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="TORNEOS ACTIVOS" value="12" trend={8} trendLabel="vs mes ant." />
          <StatCard title="TOTAL JUGADORES" value="2,840" />
          <StatCard title="MATCHES COMPLETADOS" value="854" trend={-2} trendLabel="vs mes ant." />
        </div>
      </section>

      {/* 3. FORMULARIOS Y ACCIONES */}
      <section className="space-y-6">
        <h2 className="text-technical text-primary tracking-[0.2em]">02. FORMULARIOS</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="space-y-6" withGlow>
            <Input label="Nombre del Torneo" placeholder="Ingresa el nombre del torneo..." />
            <Select label="Categoría" options={[{value: 'pro', label: 'Profesional'}, {value: 'amateur', label: 'Amateur'}]} />
            <div className="flex gap-4">
              <Button variant="primary">Guardar Configuración</Button>
            </div>
          </Card>
          
          <div className="flex flex-col gap-4">
            <Button variant="primary" fullWidth>BOTÓN ACCIÓN TÁCTICA</Button>
            <Button variant="secondary" fullWidth>BOTÓN SECUNDARIO</Button>
            <div className="flex gap-2">
              <Badge variant="success">ACTIVO</Badge>
              <Badge variant="error">ERROR</Badge>
              <Badge variant="neutral">FINALIZADO</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TABLAS Y ESTADOS */}
      <section className="space-y-6">
        <h2 className="text-technical text-primary tracking-[0.2em]">03. TABLAS & ESTADOS</h2>
        <div className="space-y-8">
          <Table columns={columns} data={data} onRowClick={(row) => console.log(row)} />
          
          <EmptyState 
            title="Sin Resultados" 
            description="No se han encontrado registros en esta vista."
            actionText="Limpiar Filtros"
            onAction={() => console.log('Limpiando...')}
          />
        </div>
      </section>

      {/* 5. OVERLAYS (MODAL Y DRAWER) */}
      <section className="flex gap-4">
        <Button variant="outline" onClick={() => setIsModalOpen(true)}>Probar Modal</Button>
        <Button variant="outline" onClick={() => setIsDrawerOpen(true)}>Probar Drawer</Button>
      </section>

      {/* Instancias de Overlays */}
      <DeleteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={() => setIsModalOpen(false)}
      />
      
      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title="Panel de Configuración"
        footer={<Button fullWidth onClick={() => setIsDrawerOpen(false)}>Aplicar Cambios</Button>}
      >
        <Input label="Descripción del Torneo" />
        <Select label="Modo" options={[{value: '1', label: 'Solo'}]} />
      </Drawer>
    </div>
  );
}