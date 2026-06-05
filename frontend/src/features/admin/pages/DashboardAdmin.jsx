import React, { useEffect, useState } from 'react';
import StatCard from '@/components/shared/StatCard';
import Table from '@/components/shared/Table';
import Badge from '@/components/ui/Badge';
import Card from '@/components/shared/Card';
import Button from '@/components/ui/Button';
import api from '@/api/axios';
import Alert from '@/components/shared/Alert';

const getAdminTabIcon = (id, className = "w-4 h-4") => {
  switch (id) {
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
  const [activeTab, setActiveTab] = useState('jugadores');
  const [teamsAudit, setTeamsAudit] = useState([]);
  const [loadingTeamsAudit, setLoadingTeamsAudit] = useState(true);

  const fetchPlayersAudit = async () => {
    setLoadingAudit(true);
    try {
      const responsePlayers = await api.get('/usuarios', { params: { role: 'jugador', per_page: 1000 } });
      const allPlayers = responsePlayers.data?.data || responsePlayers.data || [];

      // Calcular auditoría de jugadores
      const missing = [];
      allPlayers.forEach(p => {
        const missingEa = !p.id_ea || p.id_ea.trim() === '';
        const missingGt = !p.gamertag || p.gamertag.trim() === '';
        if (missingEa || missingGt) {
          missing.push({
            ...p,
            missingEa,
            missingGt
          });
        }
      });

      // Agrupamiento por similitud
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
        if (dist <= 2 && Math.min(c1.length, c2.length) >= 4) {
          return true;
        }
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

      setPlayersAudit({
        missingData: missing,
        similarGroups: similarGroups
      });
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
        
        if (hasNoEaId) {
          warnings.push({
            id: team.id,
            nombre: team.nombre,
            mensaje: `El equipo no tiene registrado su EA Club ID.`,
            tipo: 'sin_club_id_ea'
          });
        }
        if (hasNoCapitan) {
          warnings.push({
            id: team.id,
            nombre: team.nombre,
            mensaje: `El equipo no cuenta con un capitán asignado.`,
            tipo: 'sin_capitan'
          });
        }
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
    { 
      title: 'Competencias / Divisiones', 
      value: realStats?.global?.competencias || '—', 
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c2.21 0 4-1.79 4-4V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v5c0 2.21 1.79 4 4 4zm0 0v6m-4 0h8M4 7h2m12 0h2" />
        </svg>
      ), 
      trend: 0, 
      trendLabel: 'en vivo' 
    },
    { 
      title: 'Organizaciones', 
      value: realStats?.global?.organizaciones || '—', 
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v12m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ), 
      trend: 0, 
      trendLabel: 'registradas' 
    },
    { 
      title: 'Jugadores Registrados', 
      value: realStats?.global?.jugadores || '—', 
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ), 
      trend: 0, 
      trendLabel: 'competidores' 
    },
    { 
      title: 'Partidos Totales', 
      value: realStats?.global?.partidos || '—', 
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ), 
      trend: 0, 
      trendLabel: 'programados' 
    },
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
    <div className="flex flex-col gap-8 animate-fade-in relative text-left">
      
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
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-lg font-black text-foreground tracking-wide">
            Traspasos Pendientes (Mercado Cerrado)
          </h2>
        </div>
        
        {loading ? (
          <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">Sincronizando aprobaciones...</div>
        ) : solicitudesAdmin.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {solicitudesAdmin.map((sol) => (
              <div key={sol.id} className="border border-border/40 bg-card/65 hover:bg-card p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-primary/40">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl"></div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-black text-primary uppercase tracking-wider">{sol.organizacion?.nombre}</span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full">
                    <svg className="w-3 h-3 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Mercado Cerrado
                  </span>
                </div>
                
                <div className="space-y-1.5 text-left mt-1">
                  <p className="text-xs text-muted-foreground leading-normal">
                    El club <strong className="text-foreground font-semibold">{sol.equipo?.nombre}</strong> solicita fichar a:
                  </p>
                  <h4 className="text-base font-display font-black text-foreground uppercase tracking-wide">
                    {sol.jugador?.gamertag || sol.jugador?.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-background/30 p-2 rounded-xl border border-border/10 w-fit">
                    <span>Posición: <strong className="text-foreground">{sol.posicion || 'MC'}</strong></span>
                    <span className="text-border/40">•</span>
                    <span>Dorsal: <strong className="text-primary font-bold">#{sol.dorsal || 'N/A'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2 pt-2.5 border-t border-border/30 z-10">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={isProcessing === sol.id}
                    className="flex-1 h-8 text-[11px] border-destructive/30 text-destructive hover:bg-destructive/10 font-bold transition-all rounded-xl"
                    onClick={() => handleDecidirAdmin(sol.id, 'rechazar')}
                  >
                    Rechazar
                  </Button>
                  <Button 
                    size="sm" 
                    disabled={isProcessing === sol.id}
                    className="flex-1 h-8 text-[11px] bg-primary text-primary-foreground font-black shadow-[0_0_10px_hsla(var(--primary),0.3)] hover:shadow-[0_0_15px_hsla(var(--primary),0.5)] transition-all rounded-xl"
                    onClick={() => handleDecidirAdmin(sol.id, 'aprobar')}
                  >
                    Aprobar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 border border-dashed border-border/60 bg-muted/5 rounded-3xl flex flex-col items-center justify-center text-center gap-4 py-10 transition-all hover:border-primary/20 duration-300">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <div className="space-y-1">
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Sin traspasos pendientes</h3>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                No hay solicitudes de traspaso pendientes de aprobación administrativa en este momento.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Centro de Control y Auditoría */}
      <div className="border border-border/40 bg-card/25 rounded-3xl p-6 shadow-xl space-y-6">
        <div>
          <h2 className="text-xl font-display font-black text-foreground uppercase tracking-wider flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Centro de Control y Auditoría
          </h2>
          <p className="text-xs text-muted-foreground">
            Supervisa el estado reglamentario, la validez de los perfiles y posibles duplicidades en el ecosistema.
          </p>
        </div>

        {/* Selector de pestañas */}
        <div className="flex flex-wrap gap-2 border-b border-border/20 pb-3">
          {[
            { id: 'jugadores', label: 'Auditoría Jugadores', count: playersAudit.missingData.length + playersAudit.similarGroups.length },
            { id: 'equipos', label: 'Auditoría Equipos', count: teamsAudit.length }
          ].map((tab) => {
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
                {getAdminTabIcon(tab.id, `w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`)}
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    isActive ? 'bg-primary-foreground text-primary' : 'bg-destructive/20 text-destructive border border-destructive/30 animate-pulse'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="bg-card/40 border border-border/30 rounded-2xl p-5 min-h-[200px]">
          {activeTab === 'jugadores' && (
            <div className="space-y-6">
              {loadingAudit ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider animate-pulse">Analizando perfiles...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tarjeta 1: Datos Faltantes */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Fichas Incompletas ({playersAudit.missingData.length})
                    </h5>
                    {playersAudit.missingData.length === 0 ? (
                      <div className="text-xs text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Todos los jugadores registrados tienen completo su GamerTAG y EA ID.</span>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {playersAudit.missingData.map((player) => (
                          <div key={player.id} className="p-3.5 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl flex items-center justify-between gap-3 transition-all duration-300">
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-foreground truncate">{player.name}</span>
                              <span className="text-[10px] text-muted-foreground truncate">{player.email}</span>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {player.missingGt && (
                                  <span className="text-[8px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full">
                                    Falta GamerTAG
                                  </span>
                                )}
                                {player.missingEa && (
                                  <span className="text-[8px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                    Falta EA ID
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tarjeta 2: Similitud / Duplicados */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-black text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-rose-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      GamerTAGs Similares ({playersAudit.similarGroups.length})
                    </h5>
                    {playersAudit.similarGroups.length === 0 ? (
                      <div className="text-xs text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>No se han detectado GamerTAGs sospechosamente similares o duplicados.</span>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {playersAudit.similarGroups.map((group, idx) => (
                          <div key={idx} className="p-4 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/30 rounded-2xl space-y-3 transition-all duration-300">
                            <p className="text-xs text-rose-400 font-black uppercase tracking-wide flex items-center gap-1.5">
                              <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Conflicto / Duplicado
                            </p>
                            <div className="divide-y divide-border/10">
                              {group.map((player) => (
                                <div key={player.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs gap-3">
                                  <div className="min-w-0">
                                    <span className="font-bold text-foreground block truncate">{player.gamertag}</span>
                                    <span className="text-[10px] text-muted-foreground block truncate">{player.name} ({player.email})</span>
                                  </div>
                                  <span className="text-[9px] bg-background/50 border border-border/30 text-muted-foreground px-2.5 py-0.5 rounded-full font-mono shrink-0 font-bold">
                                    UID: {player.id}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'equipos' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Auditoría de Equipos (Falta EA ID y Roles)</h4>
              </div>
              
              {loadingTeamsAudit ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider animate-pulse">Analizando equipos...</span>
                </div>
              ) : teamsAudit.length === 0 ? (
                <div className="text-xs text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Todos los equipos registrados cuentan con capitán asignado y EA ID registrado.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamsAudit.map((warning, idx) => (
                    <div key={idx} className="p-4 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/30 rounded-2xl flex items-center justify-between gap-3 transition-all duration-300 shadow-md">
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-black text-foreground uppercase tracking-wide">{warning.nombre}</span>
                        <span className="text-[11px] text-rose-400 mt-1 font-semibold flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          {warning.mensaje}
                        </span>
                      </div>
                      <Badge variant="error" className="uppercase text-[8px] font-black tracking-wider shrink-0 px-2 py-0.5 rounded-full">
                        {warning.tipo === 'sin_club_id_ea' ? 'Sin EA ID' : 'Sin Cap'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
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
            Ecosistema Torneos Pro FC
          </h2>
          <Card variant="glass" className="p-5 text-xs space-y-4">
            <div className="space-y-2 leading-relaxed text-muted-foreground text-left">
              <p>Como Administrador de la plataforma, controlas la configuración global de ligas, temporadas y el estado de traspasos.</p>
              <p>Cuando un mercado de fichajes se cierra, todos los traspasos aceptados por los jugadores requieren tu firma manual en este panel para completarse de forma reglamentaria.</p>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}