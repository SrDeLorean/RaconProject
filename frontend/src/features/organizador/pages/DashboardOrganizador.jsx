import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/shared/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import api from '@/api/axios';

const ResumenTab = lazy(() => import('./components/tabs/ResumenTab'));
const EquiposTab = lazy(() => import('./components/tabs/EquiposTab'));
const JugadoresTab = lazy(() => import('./components/tabs/JugadoresTab'));
const TraspasosTab = lazy(() => import('./components/tabs/TraspasosTab'));
const ReportesTab = lazy(() => import('./components/tabs/ReportesTab'));
const TemporadasTab = lazy(() => import('./components/tabs/TemporadasTab'));
const CompetenciasTab = lazy(() => import('./components/tabs/CompetenciasTab'));
const CalendarioTab = lazy(() => import('./components/tabs/CalendarioTab'));

const getTabIcon = (id, className = "w-4 h-4") => {
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

        // Fetch de jugadores para realizar la auditoria
        try {
          const responsePlayers = await api.get('/usuarios', { params: { role: 'jugador', per_page: 1000 } });
          const allPlayers = responsePlayers.data?.data || responsePlayers.data || [];
          
          const missing = [];
          allPlayers.forEach(p => {
            const missingEa = !p.id_ea || p.id_ea.trim() === '';
            const missingGt = !p.gamertag || p.gamertag.trim() === '';
            if (missingEa || missingGt) {
              missing.push({ ...p, missingEa, missingGt });
            }
          });

          const playersWithGt = allPlayers.filter(p => p.gamertag && p.gamertag.trim() !== '');
          const visited = new Set();
          const similarGroups = [];

          const getLevenshteinDistance = (a, b) => {
            const matrix = [];
            for (let i = 0; i <= b.length; i++) matrix[i] = [i];
            for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
            for (let i = 1; i <= b.length; i++) {
              for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                  matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                  matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                  );
                }
              }
            }
            return matrix[b.length][a.length];
          };

          const isSimilar = (gt1, gt2) => {
            if (!gt1 || !gt2) return false;
            const clean = (str) => {
              return str
                .toLowerCase()
                .replace(/[\s\._\-]/g, '')
                .replace(/0/g, 'o')
                .replace(/1/g, 'i')
                .replace(/3/g, 'e')
                .replace(/4/g, 'a')
                .replace(/5/g, 's')
                .replace(/7/g, 't')
                .replace(/8/g, 'b');
            };
            const c1 = clean(gt1);
            const c2 = clean(gt2);
            if (c1 === c2) return true;
            
            const dist = getLevenshteinDistance(c1, c2);
            return dist <= 2 && Math.min(c1.length, c2.length) >= 4;
          };

          for (let i = 0; i < playersWithGt.length; i++) {
            const p1 = playersWithGt[i];
            if (visited.has(p1.id)) continue;

            const currentGroup = [p1];
            for (let j = i + 1; j < playersWithGt.length; j++) {
              const p2 = playersWithGt[j];
              if (visited.has(p2.id)) continue;

              if (isSimilar(p1.gamertag, p2.gamertag)) {
                currentGroup.push(p2);
              }
            }

            if (currentGroup.length > 1) {
              currentGroup.forEach(p => visited.add(p.id));
              similarGroups.push(currentGroup);
            }
          }

          setPlayersAudit({
            missingData: missing,
            similarGroups: similarGroups
          });
        } catch (errPl) {
          console.error("Error al auditar jugadores en dashboard principal:", errPl);
        }

      } catch (error) {
        console.error("Error al obtener estadísticas de organizador:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatsAndCompetencias();
  }, []);

  // Cálculos de alertas generales
  const perfilUsuarioCount = stats?.audits?.perfil?.usuario?.length || 0;
  const perfilOrgCount = stats?.audits?.perfil?.organizaciones?.reduce((acc, o) => acc + (o.campos_faltantes?.length || 0), 0) || 0;
  const totalAlertasResumen = 
    (stats?.audits?.partidos?.length || 0) + 
    (stats?.audits?.equipos?.length || 0) + 
    (stats?.audits?.traspasos?.length || 0) + 
    (stats?.audits?.competencias?.length || 0) + 
    (playersAudit.missingData.length + playersAudit.similarGroups.length) +
    (perfilUsuarioCount + perfilOrgCount);

  const activeSeasonsWarns = stats?.audits?.temporadas?.filter(t => !t.activa || (t.fecha_fin && new Date(t.fecha_fin) < new Date())).length || 0;

  const tabsConfig = [
    { id: 'resumen', label: 'Resumen', count: totalAlertasResumen, type: 'error' },
    { id: 'equipos', label: 'Plantillas & Caps', count: stats?.audits?.equipos?.length || 0, type: 'error' },
    { id: 'jugadores', label: 'Auditoría Jugadores', count: (playersAudit.missingData.length + playersAudit.similarGroups.length), type: 'error' },
    { id: 'traspasos', label: 'Traspasos', count: stats?.audits?.traspasos?.length || 0, type: 'warning' },
    { id: 'partidos', label: 'Falta Reporte', count: stats?.audits?.partidos?.length || 0, type: 'error' },
    { id: 'temporadas', label: 'Temporadas', count: activeSeasonsWarns, type: 'warning' },
    { id: 'competencias', label: 'Competencias', count: stats?.audits?.competencias?.length || 0, type: 'error' },
    { id: 'calendario', label: 'Calendario', count: stats?.mis_partidos_pendientes || 0, type: 'info' },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-extrabold uppercase tracking-tight mb-2 text-foreground">
          RESUMEN <span className="text-glow-primary bg-clip-text bg-gradient-to-r from-primary to-destructive text-transparent">DE LIGAS</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Hola, {user?.name}. Aquí tienes el control de tus circuitos, competencias y pases activos en RaconPro.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest animate-pulse">Sincronizando panel...</span>
        </div>
      ) : stats ? (
        <div className="space-y-8">
          {/* Grilla de Métricas en Vivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
            
            <Card className="hover:border-primary/50 transition-all shadow-md" withGlow>
              <div className="flex justify-between items-center p-2">
                <div>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Mis Organizaciones</p>
                  <h3 className="text-4xl font-display font-black text-foreground">{stats.mis_organizaciones}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v12m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="hover:border-primary/50 transition-all shadow-md" withGlow>
              <div className="flex justify-between items-center p-2">
                <div>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Temporadas Pro</p>
                  <h3 className="text-4xl font-display font-black text-foreground">{stats.mis_temporadas}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="hover:border-primary/50 transition-all shadow-md" withGlow>
              <div className="flex justify-between items-center p-2">
                <div>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Competencias / Ligas</p>
                  <h3 className="text-4xl font-display font-black text-foreground">{stats.mis_competencias}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c2.21 0 4-1.79 4-4V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v5c0 2.21 1.79 4 4 4zm0 0v6m-4 0h8M4 7h2m12 0h2" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="hover:border-primary/50 transition-all shadow-md" withGlow>
              <div className="flex justify-between items-center p-2">
                <div>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Partidos por Reportar</p>
                  <h3 className="text-4xl font-display font-black text-primary">{stats.mis_partidos_pendientes}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="hover:border-primary/50 transition-all shadow-md cursor-pointer" withGlow onClick={() => navigate('/organizador/traspasos')}>
              <div className="flex justify-between items-center p-2">
                <div>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Traspasos Pendientes</p>
                  <h3 className={`text-4xl font-display font-black ${stats.mis_traspasos_pendientes > 0 ? 'text-amber-500 animate-pulse' : 'text-foreground'}`}>
                    {stats.mis_traspasos_pendientes ?? 0}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
              </div>
            </Card>

          </div>

          {/* Centro de Control y Auditoría (6 Vistas) */}
          <div className="border border-border/40 bg-card/25 rounded-3xl p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-display font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Centro de Control y Auditoría
              </h2>
              <p className="text-xs text-muted-foreground">
                Supervisa el estado reglamentario, deportivo y de branding de tus ligas y organizaciones en tiempo real.
              </p>
            </div>

            {/* Selector de pestañas (8 vistas) */}
            <div className="flex flex-wrap gap-2 border-b border-border/20 pb-3">
              {tabsConfig.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-2 border ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                        : 'bg-card/65 text-muted-foreground border-border/50 hover:text-foreground hover:border-primary/30'
                    }`}
                  >
                    {getTabIcon(tab.id, `w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`)}
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                        isActive 
                          ? 'bg-primary-foreground text-primary' 
                          : tab.type === 'error'
                          ? 'bg-destructive/20 text-destructive border border-destructive/30 animate-pulse'
                          : tab.type === 'warning'
                          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse'
                          : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Contenido de la pestaña activa cargado on-demand */}
            <div className="bg-card/40 border border-border/30 rounded-2xl p-5 min-h-[200px]">
              <Suspense fallback={
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider animate-pulse">Cargando módulo de auditoría...</span>
                </div>
              }>
                {activeTab === 'resumen' && <ResumenTab stats={stats} navigate={navigate} misCompetencias={misCompetencias} playersAudit={playersAudit} />}
                {activeTab === 'equipos' && <EquiposTab stats={stats} />}
                {activeTab === 'jugadores' && <JugadoresTab playersAudit={playersAudit} />}
                {activeTab === 'traspasos' && <TraspasosTab stats={stats} navigate={navigate} />}
                {activeTab === 'partidos' && <ReportesTab stats={stats} navigate={navigate} />}
                {activeTab === 'temporadas' && <TemporadasTab stats={stats} />}
                {activeTab === 'competencias' && <CompetenciasTab stats={stats} navigate={navigate} />}
                {activeTab === 'calendario' && <CalendarioTab />}
              </Suspense>
            </div>
          </div>

        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No se pudieron cargar las estadísticas de tu cuenta.</p>
      )}
    </div>
  );
}