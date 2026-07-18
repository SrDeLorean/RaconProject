import React, { useEffect, useState } from 'react';
import StatCard from '@/components/shared/StatCard';
import Table from '@/components/shared/Table';
import Badge from '@/components/ui/Badge';
import Card from '@/components/shared/Card';
import Button from '@/components/ui/Button';
import api from '@/api/axios';
import Alert from '@/components/shared/Alert';

const getAdminTabIcon = (id, className = "w-5 h-5") => {
  switch (id) {
    case 'resumen':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'aprobaciones':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'jugadores':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'equipos':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      );
    case 'torneos':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    default:
      return null;
  }
};

export default function DashboardAdmin() {
  const [solicitudesAdmin, setSolicitudesAdmin] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isProcessing, setIsProcessing] = useState(null);
  const [realStats, setRealStats] = useState(null);
  const [competenciasReales, setCompetenciasReales] = useState([]);
  const [playersAudit, setPlayersAudit] = useState({ missingData: [], similarGroups: [] });
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [activeTab, setActiveTab] = useState('resumen');
  const [teamsAudit, setTeamsAudit] = useState([]);
  const [loadingTeamsAudit, setLoadingTeamsAudit] = useState(true);

  const fetchPlayersAudit = async () => {
    setLoadingAudit(true);
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
              matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
          }
        }
        return matrix[b.length][a.length];
      };

      const isSimilar = (gt1, gt2) => {
        if (!gt1 || !gt2) return false;
        const clean = (str) => str.toLowerCase().replace(/[\s\._\-]/g, '').replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't').replace(/8/g, 'b');
        const c1 = clean(gt1);
        const c2 = clean(gt2);
        if (c1 === c2) return true;
        const dist = getLevenshteinDistance(c1, c2);
        if (dist <= 2 && Math.min(c1.length, c2.length) >= 4) return true;
        return false;
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

      setPlayersAudit({ missingData: missing, similarGroups: similarGroups });
    } catch (error) {
      console.error("Error al obtener auditoría de jugadores:", error);
    } finally {
      setLoadingAudit(false);
    }
  };

  const fetchTeamsAudit = async () => {
    setLoadingTeamsAudit(true);
    try {
      const responseTeams = await api.get('/equipos', { params: { per_page: 1000 } });
      const allTeams = responseTeams.data?.data || responseTeams.data || [];
      
      const warnings = [];
      allTeams.forEach(team => {
        const hasNoEaId = !team.club_id_ea || team.club_id_ea.trim() === '';
        const hasNoCapitan = !team.id_capitan;
        
        if (hasNoEaId) warnings.push({ id: team.id, nombre: team.nombre, mensaje: `El equipo no tiene registrado su EA Club ID.`, tipo: 'sin_club_id_ea' });
        if (hasNoCapitan) warnings.push({ id: team.id, nombre: team.nombre, mensaje: `El equipo no cuenta con un capitán asignado.`, tipo: 'sin_capitan' });
      });
      setTeamsAudit(warnings);
    } catch (error) {
      console.error("Error al obtener auditoría de equipos:", error);
    } finally {
      setLoadingTeamsAudit(false);
    }
  };

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
    fetchPlayersAudit();
    fetchTeamsAudit();
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
    { title: 'Competencias / Divisiones', value: realStats?.global?.competencias || '—', icon: getAdminTabIcon('torneos'), trend: 0, trendLabel: 'en vivo' },
    { title: 'Organizaciones', value: realStats?.global?.organizaciones || '—', icon: getAdminTabIcon('equipos'), trend: 0, trendLabel: 'registradas' },
    { title: 'Jugadores Registrados', value: realStats?.global?.jugadores || '—', icon: getAdminTabIcon('jugadores'), trend: 0, trendLabel: 'competidores' },
    { title: 'Partidos Totales', value: realStats?.global?.partidos || '—', icon: getAdminTabIcon('resumen'), trend: 0, trendLabel: 'programados' },
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

  const tabsConfig = [
    { id: 'resumen', label: 'Dashboard General', count: 0 },
    { id: 'aprobaciones', label: 'Traspasos Restringidos', count: solicitudesAdmin.length, type: 'warning' },
    { id: 'jugadores', label: 'Auditoría Jugadores', count: playersAudit.missingData.length + playersAudit.similarGroups.length, type: 'error' },
    { id: 'equipos', label: 'Auditoría Equipos', count: teamsAudit.length, type: 'error' },
    { id: 'torneos', label: 'Ligas Oficiales', count: 0 },
  ];

  return (
    <div className="flex flex-col gap-8 animate-fade-in relative min-h-screen text-left">
      {notification && (
        <Alert variant={notification.variant} className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" onClose={() => setNotification(null)}>
          {notification.text}
        </Alert>
      )}

      {/* Cabecera Suprema del Admin */}
      <div className="relative overflow-hidden rounded-3xl bg-card/40 backdrop-blur-md border border-border/40 p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-display font-black uppercase tracking-tight mb-2 text-foreground flex items-center gap-3">
              Sistema <span className="text-glow-primary bg-clip-text bg-gradient-to-r from-primary to-destructive text-transparent">Global</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl">
              Bienvenido a la terminal de súper administración. Control total sobre el ecosistema, auditorías de integridad y aprobaciones manuales.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-background/50 p-4 rounded-2xl border border-border/50 backdrop-blur-sm">
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nivel de Acceso</p>
              <p className="text-sm font-black text-fuchsia-500 uppercase tracking-wider">Super Administrador</p>
            </div>
            <div className="w-12 h-12 bg-fuchsia-500/20 rounded-full border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-500 shadow-[0_0_15px_hsla(300,100%,50%,0.3)]">
              🛡️
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 items-start relative">
        
        {/* SIDEBAR TÁCTICO (Navegación Admin) */}
        <div className="w-full xl:w-80 shrink-0 flex flex-col gap-6 z-40">
          <Card padding="p-5" className="shadow-xl border-t-[3px] border-t-fuchsia-500/50" hoverLift={false}>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4 ml-2">Módulos Administrativos</h3>
            <nav className="flex flex-row xl:flex-col gap-2 overflow-x-auto xl:overflow-visible pb-2 xl:pb-0 no-scrollbar">
              {tabsConfig.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 cursor-pointer border group relative overflow-hidden shrink-0 xl:shrink w-full ${
                      isActive 
                        ? 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/40 shadow-inner' 
                        : 'bg-card/30 text-muted-foreground border-transparent hover:text-foreground hover:bg-card/60'
                    }`}
                  >
                    {isActive && <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 to-transparent pointer-events-none -z-10"></div>}
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.8)]"></div>}

                    <div className="flex items-center gap-3">
                      <span className={`transition-transform duration-300 ${isActive ? 'scale-110 text-fuchsia-500' : 'group-hover:scale-110 text-muted-foreground'}`}>
                        {getAdminTabIcon(tab.id)}
                      </span>
                      <span>{tab.label}</span>
                    </div>
                    
                    {tab.count > 0 && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        isActive 
                          ? 'bg-fuchsia-500 text-white shadow-sm' 
                          : tab.type === 'error'
                          ? 'bg-destructive/20 text-destructive border border-destructive/30 shadow-[0_0_8px_rgba(220,38,38,0.3)] animate-pulse'
                          : 'bg-amber-500/20 text-amber-500 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.3)] animate-pulse'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 w-full min-w-0 pb-12">
          
          {activeTab === 'resumen' && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                {stats.map((stat, idx) => (
                  <Card key={idx} className="hover:border-primary/50 transition-all shadow-md" withGlow={true}>
                    <div className="flex justify-between items-center p-2">
                      <div>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">{stat.title}</p>
                        <h3 className="text-4xl font-display font-black text-foreground">{stat.value}</h3>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                        {stat.icon}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="border border-border/40 bg-card/25 rounded-3xl p-6 shadow-xl">
                <h2 className="text-lg font-black text-foreground tracking-wide mb-4 flex items-center gap-2">
                  {getAdminTabIcon('resumen', 'w-5 h-5 text-primary')} Resumen de Operatividad
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Todos los sistemas se encuentran en línea. El módulo de administrador permite forzar decisiones sobre traspasos en mercados cerrados o analizar a nivel global posibles conflictos de identidad (GamerTAGs duplicados o similares).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'aprobaciones' && (
            <div className="animate-fade-in-up space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-black text-foreground tracking-wide flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Traspasos Pendientes (Mercado Cerrado)
                </h2>
              </div>
              
              {loading ? (
                <div className="py-24 text-center text-xs text-primary uppercase font-bold tracking-widest animate-pulse">Sincronizando aprobaciones...</div>
              ) : solicitudesAdmin.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {solicitudesAdmin.map((sol) => (
                    <Card key={sol.id} hoverLift={true} withGlow={true} padding="p-0" className="overflow-hidden">
                      <div className="p-5 flex flex-col justify-between gap-4 relative">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-black text-primary uppercase tracking-wider">{sol.organizacion?.nombre}</span>
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-amber-500/15 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">
                            Requiere Firma Admin
                          </span>
                        </div>
                        
                        <div className="space-y-1.5 text-left mt-1">
                          <p className="text-xs text-muted-foreground leading-normal">
                            El club <strong className="text-foreground font-semibold">{sol.equipo?.nombre}</strong> solicita fichar a:
                          </p>
                          <h4 className="text-xl font-display font-black text-foreground uppercase tracking-wide">
                            {sol.jugador?.gamertag || sol.jugador?.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-background/30 p-2 rounded-xl border border-border/10 w-fit">
                            <span>Posición: <strong className="text-foreground">{sol.posicion || 'MC'}</strong></span>
                            <span className="text-border/40">•</span>
                            <span>Dorsal: <strong className="text-primary font-bold">#{sol.dorsal || 'N/A'}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/30 z-10">
                          <Button 
                            variant="outline" 
                            disabled={isProcessing === sol.id}
                            className="flex-1 h-10 text-[11px] border-destructive/30 text-destructive hover:bg-destructive/10 font-bold transition-all rounded-xl"
                            onClick={() => handleDecidirAdmin(sol.id, 'rechazar')}
                          >
                            Rechazar
                          </Button>
                          <Button 
                            disabled={isProcessing === sol.id}
                            className="flex-1 h-10 text-[11px] bg-primary text-primary-foreground font-black shadow-[0_0_10px_hsla(var(--primary),0.3)] hover:shadow-[0_0_15px_hsla(var(--primary),0.5)] transition-all rounded-xl"
                            onClick={() => handleDecidirAdmin(sol.id, 'aprobar')}
                          >
                            Aprobar Excepción
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center text-muted-foreground border-dashed hover:border-primary/30 transition-all">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center text-2xl">✅</div>
                    <span className="font-bold uppercase tracking-widest text-sm">Sin pendientes</span>
                    <span className="text-xs max-w-sm">No hay solicitudes de traspaso que requieran validación manual administrativa en este momento.</span>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'jugadores' && (
            <div className="animate-fade-in-up space-y-6">
              <h2 className="text-lg font-black text-foreground tracking-wide flex items-center gap-2 mb-4">
                {getAdminTabIcon('jugadores', 'w-5 h-5 text-fuchsia-500')} Auditoría de Jugadores
              </h2>
              {loadingAudit ? (
                <div className="py-24 text-center text-xs text-primary uppercase font-bold tracking-widest animate-pulse">Analizando perfiles...</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tarjeta 1: Datos Faltantes */}
                  <Card className="space-y-4" padding="p-6">
                    <h5 className="text-sm font-black text-amber-500 uppercase tracking-wider flex items-center justify-between">
                      Fichas Incompletas
                      <Badge variant="warning">{playersAudit.missingData.length}</Badge>
                    </h5>
                    {playersAudit.missingData.length === 0 ? (
                      <p className="text-xs text-emerald-400 font-bold">Todos los jugadores registrados tienen completo su GamerTAG y EA ID.</p>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {playersAudit.missingData.map((player) => (
                          <div key={player.id} className="p-3.5 bg-background/50 border border-border/30 rounded-xl flex items-center justify-between gap-3">
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-foreground truncate">{player.name}</span>
                              <span className="text-[10px] text-muted-foreground truncate">{player.email}</span>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {player.missingGt && <span className="text-[8px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded-full">Falta GamerTAG</span>}
                                {player.missingEa && <span className="text-[8px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">Falta EA ID</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Tarjeta 2: Similitud / Duplicados */}
                  <Card className="space-y-4" padding="p-6">
                    <h5 className="text-sm font-black text-rose-500 uppercase tracking-wider flex items-center justify-between">
                      Conflictos GamerTAG
                      <Badge variant="error">{playersAudit.similarGroups.length}</Badge>
                    </h5>
                    {playersAudit.similarGroups.length === 0 ? (
                      <p className="text-xs text-emerald-400 font-bold">No se han detectado GamerTAGs sospechosamente similares o duplicados.</p>
                    ) : (
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {playersAudit.similarGroups.map((group, idx) => (
                          <div key={idx} className="p-4 bg-rose-500/5 border border-rose-500/30 rounded-xl space-y-3">
                            <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest border-b border-rose-500/20 pb-2">Posible Duplicidad Encontrada</p>
                            <div className="space-y-2 text-xs">
                              {group.map((player) => (
                                <div key={player.id} className="flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-foreground">{player.gamertag}</span>
                                    <span className="text-[10px] text-muted-foreground">{player.name}</span>
                                  </div>
                                  <span className="text-[9px] bg-background/80 text-muted-foreground px-2 py-1 rounded font-mono">ID: {player.id}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              )}
            </div>
          )}

          {activeTab === 'equipos' && (
            <div className="animate-fade-in-up space-y-6">
              <h2 className="text-lg font-black text-foreground tracking-wide flex items-center gap-2 mb-4">
                {getAdminTabIcon('equipos', 'w-5 h-5 text-fuchsia-500')} Auditoría de Equipos
              </h2>
              
              {loadingTeamsAudit ? (
                <div className="py-24 text-center text-xs text-primary uppercase font-bold tracking-widest animate-pulse">Analizando equipos...</div>
              ) : teamsAudit.length === 0 ? (
                <Card className="p-8 text-center text-emerald-400 font-bold uppercase tracking-widest border-emerald-500/20">
                  <div className="text-4xl mb-3">✅</div>
                  Todos los equipos están en regla.
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamsAudit.map((warning, idx) => (
                    <Card key={idx} padding="p-5" className="border-rose-500/20 bg-rose-500/5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-black text-foreground uppercase tracking-wide mb-1">{warning.nombre}</span>
                          <span className="text-[11px] text-rose-400 font-semibold">{warning.mensaje}</span>
                        </div>
                        <Badge variant="error" className="shrink-0">{warning.tipo === 'sin_club_id_ea' ? 'Sin EA ID' : 'Sin Cap'}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'torneos' && (
            <div className="animate-fade-in-up space-y-6">
              <h2 className="text-lg font-black text-foreground tracking-wide flex items-center gap-2 mb-4">
                {getAdminTabIcon('torneos', 'w-5 h-5 text-fuchsia-500')} Ligas Oficiales y Torneos
              </h2>
              <Card padding="p-0" className="overflow-hidden">
                <Table 
                  columns={columnasTorneos} 
                  data={competenciasReales} 
                  onRowClick={(row) => console.log('Clic en torneo:', row.nombre)}
                />
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}