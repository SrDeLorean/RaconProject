import React, { useEffect, useState } from 'react';
import StatCard from '@/components/shared/StatCard';
import Table from '@/components/shared/Table';
import Badge from '@/components/ui/Badge';
import Card from '@/components/shared/Card';
import Button from '@/components/ui/Button';
import api from '@/api/axios';
import Alert from '@/components/shared/Alert';

export default function DashboardAdmin() {
  const [solicitudesAdmin, setSolicitudesAdmin] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isProcessing, setIsProcessing] = useState(null);
  const [realStats, setRealStats] = useState(null);
  const [competenciasReales, setCompetenciasReales] = useState([]);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const response = await api.get('/solicitudes-fichaje');
      setSolicitudesAdmin(response.data?.data || response.data || []);
    } catch (error) {
      console.error("Error al obtener solicitudes pendientes de admin:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/analytics/dashboard-stats');
      setRealStats(response.data);
    } catch (error) {
      console.error("Error al obtener estadísticas del dashboard:", error);
    }
  };

  const fetchCompetenciasDestacadas = async () => {
    try {
      const response = await api.get('/competencias', { params: { per_page: 5 } });
      const dataArray = response.data.data ? response.data.data : (Array.isArray(response.data) ? response.data : []);
      setCompetenciasReales(dataArray);
    } catch (error) {
      console.error("Error al obtener competencias destacadas:", error);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
    fetchDashboardStats();
    fetchCompetenciasDestacadas();
  }, []);

  const handleDecidirAdmin = async (id, respuesta) => {
    setIsProcessing(id);
    try {
      const response = await api.post(`/solicitudes-fichaje/${id}/admin-decidir`, {
        respuesta,
        observaciones: respuesta === 'aprobar' ? 'Aprobado de manera administrativa' : 'Rechazado de manera administrativa por mercado cerrado'
      });
      setNotification({ variant: 'success', text: response.data.message || 'Operación registrada.' });
      await fetchPendingApprovals();
      await fetchDashboardStats();
    } catch (error) {
      setNotification({ variant: 'error', text: error.response?.data?.message || 'Error al procesar la decisión.' });
    } finally {
      setIsProcessing(null);
    }
  };

  const stats = [
    { title: 'Competencias / Divisiones', value: realStats?.global?.competencias || '—', icon: '🏆', trend: 0, trendLabel: 'en vivo' },
    { title: 'Organizaciones', value: realStats?.global?.organizaciones || '—', icon: '🏢', trend: 0, trendLabel: 'registradas' },
    { title: 'Jugadores Registrados', value: realStats?.global?.jugadores || '—', icon: '👥', trend: 0, trendLabel: 'competidores' },
    { title: 'Partidos Totales', value: realStats?.global?.partidos || '—', icon: '🎮', trend: 0, trendLabel: 'programados' },
  ];

  const columnasTorneos = [
    { header: 'División / Torneo', render: (row) => <span className="font-bold text-foreground">{row.nombre}</span> },
    { header: 'Formato', render: (row) => <span className="font-mono uppercase">{row.formato}</span> },
    { header: 'Plataforma', render: (row) => <span className="uppercase text-muted-foreground">{row.plataforma}</span> },
    { header: 'Premios', render: (row) => <span className="text-primary font-bold font-mono">${row.prize_pool}</span> },
    { 
      header: 'Estado', 
      render: (row) => {
        const variant = row.estado === 'en_curso' ? 'success' : row.estado === 'inscripciones' ? 'brand' : row.estado === 'finalizada' ? 'error' : 'neutral';
        return <Badge variant={variant} className="uppercase text-[10px]">{row.estado}</Badge>;
      }
    },
  ];

  return (
    <div className="flex flex-col gap-8 animate-fade-in relative">
      
      {notification && (
        <Alert 
          variant={notification.variant} 
          className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" 
          onClose={() => setNotification(null)}
        >
          {notification.text}
        </Alert>
      )}

      {/* HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight mb-1">
            Dashboard Global
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Bienvenido de nuevo. Aquí tienes el resumen y control administrativo del ecosistema.
          </p>
        </div>
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

      {/* SECCIÓN NUEVA: SOLICITUDES DE TRASPASOS EN MERCADO CERRADO */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-black text-foreground tracking-wide flex items-center gap-2">
          <span>🔒</span> Traspasos Pendientes (Mercado Cerrado)
        </h2>
        
        {loading ? (
          <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">Sincronizando aprobaciones...</div>
        ) : solicitudesAdmin.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {solicitudesAdmin.map((sol) => (
              <div key={sol.id} className="border border-border/50 bg-card p-4 rounded-xl flex flex-col justify-between gap-3 shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-primary uppercase">{sol.organizacion?.nombre}</span>
                  <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase font-bold border border-border/40">Mercado Cerrado</span>
                </div>
                
                <div className="space-y-1 mt-1">
                  <p className="text-xs text-muted-foreground leading-normal">
                    El club <strong className="text-foreground">{sol.equipo?.nombre}</strong> solicita fichar a:
                  </p>
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
                    {sol.jugador?.gamertag || sol.jugador?.name}
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    Posición sugerida: <span className="font-semibold">{sol.posicion}</span> • Dorsal: <span className="font-semibold">{sol.dorsal || 'N/A'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={isProcessing === sol.id}
                    className="flex-1 h-8 text-[11px] border-destructive/20 text-destructive hover:bg-destructive/10 font-bold"
                    onClick={() => handleDecidirAdmin(sol.id, 'rechazar')}
                  >
                    Rechazar
                  </Button>
                  <Button 
                    size="sm" 
                    disabled={isProcessing === sol.id}
                    className="flex-1 h-8 text-[11px] bg-primary text-primary-foreground font-bold shadow-[0_0_10px_hsla(var(--primary),0.3)]"
                    onClick={() => handleDecidirAdmin(sol.id, 'aprobar')}
                  >
                    Aprobar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 border border-dashed border-border/60 bg-muted/10 rounded-xl text-center text-xs text-muted-foreground py-8">
            No hay solicitudes de traspaso pendientes de aprobación administrativa en este momento.
          </div>
        )}
      </div>

      {/* CONTENIDO DE TORNEOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: Tabla de Torneos */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-foreground tracking-wide">
              Torneos Destacados
            </h2>
          </div>
          
          <Table 
            columns={columnasTorneos} 
            data={competenciasReales} 
            onRowClick={(row) => console.log('Clic en torneo:', row.nombre)}
          />
        </div>

        {/* COLUMNA DERECHA: Resumen de Circuito */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-black text-foreground tracking-wide">
            Ecosistema RaconPro
          </h2>
          <Card variant="glass" className="p-5 text-xs space-y-4">
            <div className="space-y-2 leading-relaxed text-muted-foreground">
              <p>Como Administrador de la plataforma, controlas la configuración global de ligas, temporadas y el estado de traspasos.</p>
              <p>Cuando un mercado de fichajes se cierra, todos los traspasos aceptados por los jugadores requieren tu firma manual en este panel para completarse de forma reglamentaria.</p>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}