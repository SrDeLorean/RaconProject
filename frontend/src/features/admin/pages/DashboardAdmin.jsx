import React from 'react';
import StatCard from '@/components/shared/StatCard';
import Table from '@/components/shared/Table';
import Badge from '@/components/shared/Badge';
import Card from '@/components/shared/Card';
import Button from '@/components/shared/Button';


export default function DashboardAdmin() {
  // ==========================================
  // 1. DATOS SIMULADOS (Luego vendrán de tu API/Zustand)
  // ==========================================

  const stats = [
    { title: 'Torneos Activos', value: '24', icon: '🏆', trend: 12, trendLabel: 'vs mes pasado' },
    { title: 'Organizaciones', value: '48', icon: '🏢', trend: 5, trendLabel: 'vs mes pasado' },
    { title: 'Jugadores', value: '1,420', icon: '👥', trend: 22, trendLabel: 'vs mes pasado' },
    { title: 'Partidas (Hoy)', value: '86', icon: '🎮', trend: -2, trendLabel: 'vs ayer' },
  ];

  const torneosRecientes = [
    { id: 1, nombre: 'Copa Racon Pro Series', juego: 'Valorant', org: 'Racon E-sports', estado: 'En Curso', variant: 'success' },
    { id: 2, nombre: 'Liga Nacional de Verano', juego: 'League of Legends', org: 'LVP Chile', estado: 'Inscripciones', variant: 'warning' },
    { id: 3, nombre: 'Torneo Relámpago 2v2', juego: 'Rocket League', org: 'Comunidad RL', estado: 'Finalizado', variant: 'neutral' },
    { id: 4, nombre: 'Clasificatorias Master', juego: 'CS:GO 2', org: 'Racon E-sports', estado: 'Pendiente', variant: 'primary' },
  ];

  const columnasTorneos = [
    { header: 'Torneo', render: (row) => <span className="font-bold">{row.nombre}</span> },
    { header: 'Juego', accessor: 'juego' },
    { header: 'Organización', accessor: 'org' },
    { 
      header: 'Estado', 
      render: (row) => <Badge variant={row.variant}>{row.estado}</Badge> 
    },
    { 
      header: 'Acción', 
      render: () => <Button variant="outline" size="sm" className="!py-1.5 !px-4 text-xs">Ver panel</Button> 
    },
  ];

  const actividadReciente = [
    { id: 1, mensaje: 'Nuevo equipo "Furious" registrado en Copa Racon.', tiempo: 'Hace 5 min', icon: '🛡️' },
    { id: 2, mensaje: 'Organización "LVP Chile" solicitó verificación.', tiempo: 'Hace 2 horas', icon: '🏢' },
    { id: 3, mensaje: 'El servidor de partidas reportó latencia alta.', tiempo: 'Hace 4 horas', icon: '⚠️' },
    { id: 4, mensaje: 'Torneo "Liga de Verano" configurado con éxito.', tiempo: 'Hace 1 día', icon: '✅' },
  ];

  // ==========================================
  // 2. RENDERIZADO DE LA VISTA
  // ==========================================
  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-main tracking-tight mb-1">
            Dashboard Global
          </h1>
          <p className="text-sm font-medium text-text-muted">
            Bienvenido de nuevo. Aquí tienes el resumen de tu ecosistema hoy.
          </p>
        </div>
        <Button variant="primary" className="shrink-0">
          + NUEVO TORNEO
        </Button>
      </div>

      {/* FILA DE MÉTRICAS (STAT CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <StatCard 
            key={idx}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            trendLabel={stat.trendLabel}
          />
        ))}
      </div>

      {/* CONTENIDO PRINCIPAL: TABLA + BARRA LATERAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: Tabla de Torneos (Ocupa 2/3 del espacio) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-text-main tracking-wide">
              Torneos Destacados
            </h2>
            <button className="text-sm font-bold text-brand-light hover:text-brand-primary transition-colors">
              Ver todos →
            </button>
          </div>
          
          <Table 
            columns={columnasTorneos} 
            data={torneosRecientes} 
            onRowClick={(row) => console.log('Clic en torneo:', row.nombre)}
          />
        </div>

        {/* COLUMNA DERECHA: Actividad Reciente (Ocupa 1/3 del espacio) */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-black text-text-main tracking-wide">
            Actividad Reciente
          </h2>
          
          <Card variant="glass" className="p-6 flex-1">
            <div className="flex flex-col gap-6 relative">
              {/* Línea conectora del timeline */}
              <div className="absolute left-[1.15rem] top-2 bottom-2 w-px bg-border-subtle z-0"></div>
              
              {actividadReciente.map((act) => (
                <div key={act.id} className="relative z-10 flex gap-4 group">
                  {/* Círculo del icono */}
                  <div className="w-10 h-10 rounded-full bg-bg-base border-2 border-bg-surface flex items-center justify-center text-sm shadow-sm group-hover:border-brand-primary/50 group-hover:scale-110 transition-all duration-300 shrink-0">
                    {act.icon}
                  </div>
                  {/* Texto */}
                  <div className="flex flex-col pt-1">
                    <p className="text-sm font-medium text-text-main leading-tight">
                      {act.mensaje}
                    </p>
                    <span className="text-xs font-bold text-text-muted mt-1">
                      {act.tiempo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <Button variant="secondary" fullWidth className="mt-8 text-xs !py-2.5">
              CARGAR MÁS
            </Button>
          </Card>
        </div>

      </div>
    </div>
  );
}