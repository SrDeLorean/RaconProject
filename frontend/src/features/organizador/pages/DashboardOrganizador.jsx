import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/shared/Card';
import PageHelp from '@/components/shared/PageHelp';
import api from '@/api/axios';

const ResumenTab = lazy(() => import('./components/tabs/ResumenTab'));
const EquiposTab = lazy(() => import('./components/tabs/EquiposTab'));
const JugadoresTab = lazy(() => import('./components/tabs/JugadoresTab'));
const TraspasosTab = lazy(() => import('./components/tabs/TraspasosTab'));
const ReportesTab = lazy(() => import('./components/tabs/ReportesTab'));
const TemporadasTab = lazy(() => import('./components/tabs/TemporadasTab'));
const CompetenciasTab = lazy(() => import('./components/tabs/CompetenciasTab'));
const CalendarioTab = lazy(() => import('./components/tabs/CalendarioTab'));

const getTabIcon = (id, className = "w-5 h-5") => {
  switch (id) {
    case 'resumen':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
    case 'equipos':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      );
    case 'jugadores':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'traspasos':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    case 'partidos':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'temporadas':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'competencias':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c2.21 0 4-1.79 4-4V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v5c0 2.21 1.79 4 4 4zm0 0v6m-4 0h8M4 7h2m12 0h2" />
        </svg>
      );
    case 'calendario':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    default:
      return null;
  }
};

export default function DashboardOrganizador() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [misCompetencias, setMisCompetencias] = useState([]);
  const [activeTab, setActiveTab] = useState('resumen');
  const [playersAudit, setPlayersAudit] = useState({ missingData: [], similarGroups: [] });

  useEffect(() => {
    const fetchStatsAndCompetencias = async () => {
      setLoading(true);
      try {
        const responseStats = await api.get('/analytics/dashboard-stats');
        setStats(responseStats.data?.organizador || null);

        const responseComp = await api.get('/competencias', { params: { per_page: 5, for_organizer: true } });
        const compArray = responseComp.data.data ? responseComp.data.data : (Array.isArray(responseComp.data) ? responseComp.data : []);
        setMisCompetencias(compArray);

        // Fetch de auditoría resumida
        try {
          const [resMissing, resSimilar] = await Promise.all([
            api.get('/usuarios/auditoria', { params: { type: 'missing', per_page: 4, page: 1 } }),
            api.get('/usuarios/auditoria', { params: { type: 'similar', per_page: 2, page: 1 } })
          ]);
          setPlayersAudit({
            missingData: resMissing.data?.data || [],
            similarGroups: resSimilar.data?.data || [],
            missingCount: resMissing.data?.total || 0,
            similarCount: resSimilar.data?.total || 0
          });
        } catch (errPl) {
          console.error("Error al obtener auditoría de jugadores:", errPl);
        }

      } catch (error) {
        console.error("Error al obtener estadísticas de organizador:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatsAndCompetencias();
  }, []);

  const perfilUsuarioCount = stats?.audits?.perfil?.usuario?.length || 0;
  const perfilOrgCount = stats?.audits?.perfil?.organizaciones?.reduce((acc, o) => acc + (o.campos_faltantes?.length || 0), 0) || 0;
  
  const playersMissingCount = playersAudit?.missingCount ?? playersAudit?.missingData?.length ?? 0;
  const playersSimilarCount = playersAudit?.similarCount ?? playersAudit?.similarGroups?.length ?? 0;

  const totalAlertasResumen = 
    (stats?.audits?.partidos?.length || 0) + 
    (stats?.audits?.equipos?.length || 0) + 
    (stats?.audits?.traspasos?.length || 0) + 
    (stats?.audits?.competencias?.length || 0) + 
    (playersMissingCount + playersSimilarCount) +
    (perfilUsuarioCount + perfilOrgCount);

  const activeSeasonsWarns = stats?.audits?.temporadas?.filter(t => !t.activa || (t.fecha_fin && new Date(t.fecha_fin) < new Date())).length || 0;

  const tabsConfig = [
    { id: 'resumen', label: 'Dashboard General', count: totalAlertasResumen, type: 'error' },
    { id: 'equipos', label: 'Equipos Inscritos', count: stats?.audits?.equipos?.length || 0, type: 'error' },
    { id: 'jugadores', label: 'Auditoría Jugadores', count: (playersMissingCount + playersSimilarCount), type: 'error' },
    { id: 'traspasos', label: 'Mesa de Traspasos', count: stats?.audits?.traspasos?.length || 0, type: 'warning' },
    { id: 'partidos', label: 'Reportes y Actas', count: stats?.audits?.partidos?.length || 0, type: 'error' },
    { id: 'temporadas', label: 'Gestión de Temporadas', count: activeSeasonsWarns, type: 'warning' },
    { id: 'competencias', label: 'Torneos / Ligas', count: stats?.audits?.competencias?.length || 0, type: 'error' },
    { id: 'calendario', label: 'Calendario Oficial', count: stats?.mis_partidos_pendientes || 0, type: 'info' },
  ];

  return (
    <div className="animate-fade-in space-y-8 min-h-screen">
      
      {/* Cabecera Táctica del Organizador */}
      <div className="relative overflow-hidden rounded-3xl bg-card/40 backdrop-blur-md border border-border/40 p-4 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-display font-black uppercase tracking-tight mb-2 text-foreground flex items-center gap-3">
              Mesa <span className="text-glow-primary bg-clip-text bg-gradient-to-r from-primary to-destructive text-transparent">Directiva</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl">
              Hola, <strong className="text-foreground">{user?.name}</strong>. Desde aquí controlas todas las operaciones de tus ligas: traspasos, calendarios, auditorías y disputas en Torneos Pro FC.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-background/50 p-4 rounded-2xl border border-border/50 backdrop-blur-sm">
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rol Activo</p>
              <p className="text-sm font-black text-primary uppercase tracking-wider">Presidente / Organizador</p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-full border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_15px_hsla(var(--primary),0.3)]">
              👑
            </div>
          </div>
        </div>
      </div>

      <PageHelp 
        title="Dashboard del Organizador"
        description="Centro de mando principal. Desde aquí puedes monitorear de un vistazo la salud y actividad reciente de todas tus ligas y organizaciones adscritas."
        steps={[
          {
            title: "Métricas Generales",
            description: "En la parte superior verás las tarjetas de resumen (Equipos Activos, Partidos, Jugadores y Torneos). Utiliza esto para saber el volumen de tráfico actual de la plataforma."
          },
          {
            title: "Accesos Rápidos",
            description: "Bajo las métricas tienes botones directos para operar. Usa 'Crear Competición' para abrir nuevos torneos rápidamente sin tener que navegar por los menús laterales."
          },
          {
            title: "Auditoría de Actividad",
            description: "Las listas inferiores te muestran los últimos partidos reportados y traspasos. Haz clic en 'Ver Todos' si necesitas realizar aprobaciones masivas o revisiones a detalle."
          }
        ]}
      />

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary shadow-[0_0_15px_hsla(var(--primary),0.5)]"></div>
          <span className="text-xs uppercase font-black text-primary tracking-widest animate-pulse">Sincronizando Base de Datos...</span>
        </div>
      ) : stats ? (
        <div className="flex flex-col xl:flex-row gap-4 md:gap-8 items-start relative">
          
          {/* SIDEBAR TÁCTICO (Navegación Organizador) */}
          <div className="w-full xl:w-80 shrink-0 flex flex-col gap-6 z-40">
            <Card padding="p-5" className="shadow-xl" hoverLift={false}>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4 ml-2">Panel de Control</h3>
              <nav className="flex flex-row xl:flex-col gap-2 overflow-x-auto xl:overflow-visible pb-3.5 xl:pb-0 mobile-scroll-indicator">
                {tabsConfig.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 cursor-pointer border group relative overflow-hidden shrink-0 xl:shrink w-full ${
                        isActive 
                          ? 'bg-primary/10 text-primary border-primary/40 shadow-inner' 
                          : 'bg-card/30 text-muted-foreground border-transparent hover:text-foreground hover:bg-card/60'
                      }`}
                    >
                      {isActive && <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none -z-10"></div>}
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_hsla(var(--primary),0.8)]"></div>}

                      <div className="flex items-center gap-3">
                        <span className={`transition-transform duration-300 ${isActive ? 'scale-110 text-primary' : 'group-hover:scale-110 text-muted-foreground'}`}>
                          {getTabIcon(tab.id)}
                        </span>
                        <span>{tab.label}</span>
                      </div>
                      
                      {tab.count > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                          isActive 
                            ? 'bg-primary-foreground text-primary shadow-sm' 
                            : tab.type === 'error'
                            ? 'bg-destructive/20 text-destructive border border-destructive/30 shadow-[0_0_8px_rgba(220,38,38,0.3)] animate-pulse'
                            : tab.type === 'warning'
                            ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.3)] animate-pulse'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </Card>

            {/* Grilla Mini de KPIs rápidos (Solo en Desktop) */}
            <div className="hidden xl:grid grid-cols-2 gap-4">
              <Card className="flex flex-col items-center justify-center p-4 text-center border-border/30 hover:border-primary/40 transition-colors cursor-pointer" onClick={() => navigate('/organizador/traspasos')}>
                <span className="text-2xl font-display font-black text-amber-500 mb-1">{stats.mis_traspasos_pendientes ?? 0}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Traspasos</span>
              </Card>
              <Card className="flex flex-col items-center justify-center p-4 text-center border-border/30 hover:border-primary/40 transition-colors">
                <span className="text-2xl font-display font-black text-primary mb-1">{stats.mis_partidos_pendientes ?? 0}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Actas Pend.</span>
              </Card>
            </div>
          </div>

          {/* CONTENIDO PRINCIPAL (Módulos Dinámicos) */}
          <div className="flex-1 w-full min-w-0 pb-12">
            <Card padding="p-6" className="min-h-[500px]" hoverLift={false} withGlow={true}>
              <Suspense fallback={
                <div className="py-24 flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest animate-pulse">Iniciando módulo de control...</span>
                </div>
              }>
                {activeTab === 'resumen' && <ResumenTab stats={stats} navigate={navigate} misCompetencias={misCompetencias} playersAudit={playersAudit} />}
                {activeTab === 'equipos' && <EquiposTab stats={stats} />}
                {activeTab === 'jugadores' && <JugadoresTab />}
                {activeTab === 'traspasos' && <TraspasosTab stats={stats} navigate={navigate} />}
                {activeTab === 'partidos' && <ReportesTab stats={stats} navigate={navigate} />}
                {activeTab === 'temporadas' && <TemporadasTab stats={stats} />}
                {activeTab === 'competencias' && <CompetenciasTab stats={stats} navigate={navigate} />}
                {activeTab === 'calendario' && <CalendarioTab />}
              </Suspense>
            </Card>
          </div>

        </div>
      ) : (
        <Card className="p-4 md:p-8 text-center border-destructive/30 bg-destructive/5 text-destructive font-bold uppercase tracking-widest">
          No se pudieron cargar las estadísticas de tu cuenta.
        </Card>
      )}
    </div>
  );
}