import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/shared/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import api from '@/api/axios';
import Partidos from '@/features/public/pages/Partidos';

export default function DashboardOrganizador() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [misCompetencias, setMisCompetencias] = useState([]);

  useEffect(() => {
    const fetchStatsAndCompetencias = async () => {
      setLoading(true);
      try {
        const responseStats = await api.get('/analytics/dashboard-stats');
        setStats(responseStats.data?.organizador || null);

        const responseComp = await api.get('/competencias', { params: { per_page: 5, for_organizer: true } });
        const compArray = responseComp.data.data ? responseComp.data.data : (Array.isArray(responseComp.data) ? responseComp.data : []);
        setMisCompetencias(compArray);
      } catch (error) {
        console.error("Error al obtener estadísticas de organizador:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatsAndCompetencias();
  }, []);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            
            <Card className="hover:border-primary/50 transition-all shadow-md" withGlow>
              <div className="flex justify-between items-center p-2">
                <div>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Mis Organizaciones</p>
                  <h3 className="text-4xl font-display font-black text-foreground">{stats.mis_organizaciones}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl shadow-inner">🏢</div>
              </div>
            </Card>

            <Card className="hover:border-primary/50 transition-all shadow-md" withGlow>
              <div className="flex justify-between items-center p-2">
                <div>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Temporadas Pro</p>
                  <h3 className="text-4xl font-display font-black text-foreground">{stats.mis_temporadas}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl shadow-inner">📅</div>
              </div>
            </Card>

            <Card className="hover:border-primary/50 transition-all shadow-md" withGlow>
              <div className="flex justify-between items-center p-2">
                <div>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Competencias / Ligas</p>
                  <h3 className="text-4xl font-display font-black text-foreground">{stats.mis_competencias}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl shadow-inner">🏆</div>
              </div>
            </Card>

            <Card className="hover:border-primary/50 transition-all shadow-md" withGlow>
              <div className="flex justify-between items-center p-2">
                <div>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Partidos por Reportar</p>
                  <h3 className="text-4xl font-display font-black text-primary">{stats.mis_partidos_pendientes}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl shadow-inner">⚠️</div>
              </div>
            </Card>

          </div>

          {/* Sección de Detalle en el Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Listado de Ligas en curso */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                🏆 Divisiones Recientes
              </h3>
              
              {misCompetencias.length === 0 ? (
                <div className="p-8 border border-dashed border-border/60 bg-muted/10 rounded-2xl text-center text-xs text-muted-foreground">
                  Aún no has registrado competencias en tus organizaciones. ¡Comienza creando una nueva!
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {misCompetencias.map((comp) => {
                    const variant = comp.estado === 'en_curso' ? 'success' : comp.estado === 'inscripciones' ? 'brand' : comp.estado === 'finalizada' ? 'error' : 'neutral';
                    return (
                      <div key={comp.id} className="flex justify-between items-center p-4 bg-card/45 border border-border/50 rounded-xl hover:border-primary/30 transition-all shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: comp.color_tema || '#ef4444' }} />
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-sm uppercase">{comp.nombre}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-mono">{comp.formato} • {comp.plataforma}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={variant} className="uppercase text-[9px] tracking-wider font-bold">{comp.estado}</Badge>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs font-bold"
                            onClick={() => navigate(`/organizador/competencias/${comp.id}`)}
                          >
                            Gestionar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Accesos directos y guía */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                ⚡ Consola Rápida
              </h3>
              <div className="border border-border/50 bg-card p-5 rounded-2xl space-y-4 shadow-xl relative overflow-hidden">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Como Organizador de torneos, controlas el matchmaking, las inscripciones de equipos y el registro de marcadores oficiales (manual o sincronizado por EA API).
                </p>
                <div className="flex flex-col gap-2 pt-2 border-t border-border/30">
                  <Button 
                    className="w-full text-xs font-bold bg-primary text-primary-foreground"
                    onClick={() => navigate('/organizador/competencias')}
                  >
                    🏆 Consola de Divisiones
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full text-xs font-bold"
                    onClick={() => navigate('/organizador/partidos')}
                  >
                    🏟️ Reportar Partidos
                  </Button>
                </div>
              </div>
            </div>

          </div>

          {/* Calendario de Mis Competencias */}
          <div className="border-t border-border/20 pt-8 space-y-4">
            <h3 className="text-xl font-display font-black text-foreground uppercase tracking-wider flex items-center gap-2">
              🏟️ Calendario Oficial de mis Competencias
            </h3>
            <div className="bg-card/25 border border-border/40 rounded-3xl p-4 md:p-6 shadow-inner">
              <Partidos forOrganizer={true} hideHero={true} />
            </div>
          </div>

        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No se pudieron cargar las estadísticas de tu cuenta.</p>
      )}
    </div>
  );
}