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
  const [activeTab, setActiveTab] = useState('perfil');
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

        // Obtener jugadores para la auditoría
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
            
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

            <Card className="hover:border-primary/50 transition-all shadow-md cursor-pointer" withGlow onClick={() => navigate('/organizador/traspasos')}>
              <div className="flex justify-between items-center p-2">
                <div>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Traspasos Pendientes</p>
                  <h3 className={`text-4xl font-display font-black ${stats.mis_traspasos_pendientes > 0 ? 'text-amber-500 animate-pulse' : 'text-foreground'}`}>
                    {stats.mis_traspasos_pendientes ?? 0}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl shadow-inner">🔁</div>
              </div>
            </Card>

          </div>

          {/* Centro de Control y Auditoría (6 Vistas) */}
          <div className="border border-border/40 bg-card/25 rounded-3xl p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-display font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                🛡️ Centro de Control y Auditoría
              </h2>
              <p className="text-xs text-muted-foreground">
                Supervisa el estado reglamentario, deportivo y de branding de tus ligas y organizaciones en tiempo real.
              </p>
            </div>

            {/* Selector de pestañas (7 vistas) */}
            <div className="flex flex-wrap gap-2 border-b border-border/20 pb-3">
              {[
                { id: 'perfil', label: '🏢 Perfil & Orgs', count: (stats.audits?.perfil?.usuario?.length || 0) + (stats.audits?.perfil?.organizaciones?.reduce((acc, o) => acc + (o.campos_faltantes?.length || 0), 0) || 0) },
                { id: 'equipos', label: '👥 Plantillas & Caps', count: stats.audits?.equipos?.length || 0 },
                { id: 'traspasos', label: '🔁 Traspasos', count: stats.audits?.traspasos?.length || 0 },
                { id: 'partidos', label: '🏟️ Falta Reporte', count: stats.audits?.partidos?.length || 0 },
                { id: 'temporadas', label: '📅 Temporadas', count: stats.audits?.temporadas?.length || 0 },
                { id: 'competencias', label: '🏆 Competencias', count: stats.audits?.competencias?.length || 0 },
                { id: 'jugadores', label: '🎮 Auditoría Jugadores', count: playersAudit.missingData.length + playersAudit.similarGroups.length },
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
              
              {/* VISTA 1: Perfil & Orgs */}
              {activeTab === 'perfil' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">🏢 Perfil y Datos Organizacionales</h4>
                  
                  {/* Usuario */}
                  {stats.audits?.perfil?.usuario?.length > 0 ? (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                      <p className="text-xs text-amber-500 font-bold flex items-center gap-1.5">
                        ⚠️ Tu perfil de organizador tiene campos incompletos
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Para mayor transparencia, completa los siguientes datos: <strong className="text-foreground">{stats.audits.perfil.usuario.join(', ')}</strong>.
                      </p>
                      <Button variant="outline" size="sm" className="text-xs border-amber-500/30 hover:bg-amber-500/10 text-amber-500" onClick={() => navigate('/organizador/perfil')}>
                        Completar Perfil
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-green-500 font-bold flex items-center gap-1">✅ Tu perfil de organizador está completo.</p>
                  )}

                  {/* Organizaciones */}
                  {stats.audits?.perfil?.organizaciones?.length > 0 ? (
                    <div className="space-y-3">
                      {stats.audits.perfil.organizaciones.map((org) => (
                        <div key={org.id} className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1">
                            <span className="text-xs font-black text-foreground uppercase">{org.nombre}</span>
                            <p className="text-[11px] text-muted-foreground">
                              Faltan cargar los siguientes datos: <strong className="text-foreground">{org.campos_faltantes.join(', ')}</strong>.
                            </p>
                          </div>
                          <Button size="sm" className="text-xs font-bold whitespace-nowrap bg-amber-600 text-white hover:bg-amber-700" onClick={() => navigate('/organizador/perfil')}>
                            Editar Organización
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-green-500 font-bold flex items-center gap-1">✅ Todas tus organizaciones tienen branding y datos de contacto completos.</p>
                  )}
                </div>
              )}

              {/* VISTA 2: Plantillas & Capitanes */}
              {activeTab === 'equipos' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">👥 Auditoría de Equipos (Plantillas y Capitanes)</h4>
                  {stats.audits?.equipos?.length === 0 ? (
                    <p className="text-xs text-green-500 font-bold flex items-center gap-1">✅ Todos los equipos participantes cuentan con plantillas, capitán asignado y EA ID registrado.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {stats.audits.equipos.map((warning, idx) => (
                        <div key={idx} className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">{warning.nombre}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-mono">{warning.organizacion}</span>
                            <span className="text-[11px] text-destructive/90 mt-1 font-medium">{warning.mensaje}</span>
                          </div>
                          <Badge variant="error" className="uppercase text-[8px] font-black tracking-wider shrink-0">
                            {warning.tipo === 'plantilla_vacia' ? 'Sin Roster' : warning.tipo === 'sin_capitan' ? 'Sin Cap' : 'Sin EA ID'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VISTA 3: Traspasos */}
              {activeTab === 'traspasos' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">🔁 Traspasos y Solicitudes de Fichaje / Despido</h4>
                  {stats.audits?.traspasos?.length === 0 ? (
                    <p className="text-xs text-green-500 font-bold flex items-center gap-1">✅ No tienes solicitudes de fichaje o despido pendientes de firma.</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.audits.traspasos.map((traspaso) => (
                        <div key={traspaso.id} className="p-3 bg-card border border-border/50 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-foreground">{traspaso.jugador}</span>
                              <Badge variant={traspaso.tipo === 'despido' ? 'error' : 'brand'} className="uppercase text-[8px] font-black">
                                {traspaso.tipo === 'despido' ? 'Despido / Libre' : 'Fichaje'}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-mono">{traspaso.organizacion}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Origen: <span className="text-foreground font-medium">{traspaso.equipo_origen}</span> → Destino: <span className="text-foreground font-medium">{traspaso.equipo_destino}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-muted-foreground font-mono">{new Date(traspaso.fecha).toLocaleDateString()}</span>
                            <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold" onClick={() => navigate('/organizador/traspasos')}>
                              Firmar / Revisar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VISTA 4: Falta Reporte */}
              {activeTab === 'partidos' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">🏟️ Partidos Pendientes de Reporte Oficial</h4>
                  {stats.audits?.partidos?.length === 0 ? (
                    <p className="text-xs text-green-500 font-bold flex items-center gap-1">✅ Todos los partidos en curso están al día con sus reportes oficiales.</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      {stats.audits.partidos.map((partido) => (
                        <div key={partido.id} className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-foreground">{partido.local} vs {partido.visitante}</span>
                              <span className="text-[10px] text-muted-foreground uppercase font-mono">{partido.competencia}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Programado: <strong className="text-foreground">{partido.fecha} {partido.hora || 'Por definir'}</strong> ({partido.organizacion})
                            </p>
                          </div>
                          <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold border-amber-500/30 text-amber-500 hover:bg-amber-500/10 shrink-0" onClick={() => navigate('/organizador/partidos')}>
                            Reportar Resultado
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VISTA 5: Temporadas */}
              {activeTab === 'temporadas' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">📅 Control de Temporadas y Mercados de Pases</h4>
                  {stats.audits?.temporadas?.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No hay temporadas registradas bajo tus organizaciones.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {stats.audits.temporadas.map((temp) => (
                        <div key={temp.id} className="p-4 bg-card border border-border/50 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-foreground uppercase">{temp.nombre}</span>
                            <Badge variant={temp.activa ? 'success' : 'neutral'} className="text-[8px] uppercase tracking-wider font-bold">
                              {temp.activa ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase font-mono">{temp.organizacion}</p>
                          <div className="flex justify-between items-center text-xs pt-1 border-t border-border/20">
                            <span className="text-muted-foreground">Mercado:</span>
                            <span className={`font-bold ${temp.estado_mercado === 'abierto' ? 'text-green-500' : 'text-destructive'}`}>
                              {temp.estado_mercado === 'abierto' ? '🟢 Abierto' : '🔴 Cerrado'}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground flex justify-between">
                            <span>Vigencia:</span>
                            <span>{temp.fecha_inicio ? new Date(temp.fecha_inicio).toLocaleDateString() : 'N/A'} - {temp.fecha_fin ? new Date(temp.fecha_fin).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VISTA 6: Competencias */}
              {activeTab === 'competencias' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">🏆 Estructura y Configuración de Competencias / Ligas</h4>
                  {stats.audits?.competencias?.length === 0 ? (
                    <p className="text-xs text-green-500 font-bold flex items-center gap-1">✅ Todas las competencias tienen una estructura deportiva y de branding completa.</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.audits.competencias.map((comp) => (
                        <div key={comp.id} className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-foreground uppercase">{comp.nombre}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">({comp.organizacion})</span>
                              <Badge variant="neutral" className="uppercase text-[8px] font-bold">{comp.estado}</Badge>
                            </div>
                            <ul className="list-disc pl-4 space-y-1">
                              {comp.warnings.map((warn, idx) => (
                                <li key={idx} className="text-xs text-muted-foreground">{warn}</li>
                              ))}
                            </ul>
                          </div>
                          <Button size="sm" variant="outline" className="text-xs font-bold shrink-0" onClick={() => navigate(`/organizador/competencias/${comp.id}`)}>
                            Gestionar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VISTA 7: Auditoría de Jugadores */}
              {activeTab === 'jugadores' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border/10 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">🎮 Auditoría y Control de Calidad de Jugadores</h4>
                      <p className="text-xs text-muted-foreground">Verificación de identificadores y detección de posibles cuentas similares o duplicadas.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tarjeta 1: Datos Faltantes */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5 text-amber-500">
                        ⚠️ Fichas Incompletas ({playersAudit.missingData.length})
                      </h5>
                      {playersAudit.missingData.length === 0 ? (
                        <p className="text-xs text-green-500 font-bold bg-green-500/5 border border-green-500/10 rounded-xl p-4">
                          ✅ Todos los jugadores registrados tienen completo su GamerTAG y EA ID.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                          {playersAudit.missingData.map((player) => (
                            <div key={player.id} className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between gap-3">
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-foreground truncate">{player.name}</span>
                                <span className="text-[10px] text-muted-foreground truncate">{player.email}</span>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {player.missingGt && (
                                    <span className="text-[8px] font-black uppercase tracking-wider bg-destructive/20 text-destructive border border-destructive/30 px-1.5 py-0.5 rounded">
                                      Falta GamerTAG
                                    </span>
                                  )}
                                  {player.missingEa && (
                                    <span className="text-[8px] font-black uppercase tracking-wider bg-destructive/20 text-destructive border border-destructive/30 px-1.5 py-0.5 rounded">
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
                      <h5 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5 text-destructive animate-pulse">
                        🚨 Advertencia de GamerTAGs Similares ({playersAudit.similarGroups.length})
                      </h5>
                      {playersAudit.similarGroups.length === 0 ? (
                        <p className="text-xs text-green-500 font-bold bg-green-500/5 border border-green-500/10 rounded-xl p-4">
                          ✅ No se han detectado GamerTAGs sospechosamente similares o duplicados.
                        </p>
                      ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                          {playersAudit.similarGroups.map((group, idx) => (
                            <div key={idx} className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl space-y-2">
                              <p className="text-xs text-destructive font-black uppercase tracking-wide flex items-center gap-1">
                                📢 Posible Conflicto / Duplicado
                              </p>
                              <div className="divide-y divide-border/10">
                                {group.map((player) => (
                                  <div key={player.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs gap-3">
                                    <div className="min-w-0">
                                      <span className="font-bold text-foreground block truncate">{player.gamertag}</span>
                                      <span className="text-[10px] text-muted-foreground block truncate">{player.name} ({player.email})</span>
                                    </div>
                                    <span className="text-[9px] bg-card border border-border/50 text-muted-foreground px-2 py-0.5 rounded uppercase font-mono shrink-0">
                                      ID: {player.id}
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
                </div>
              )}

            </div>
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
                  <Button 
                    variant="outline" 
                    className="w-full text-xs font-bold"
                    onClick={() => navigate('/organizador/traspasos')}
                  >
                    🔁 Gestionar Traspasos
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