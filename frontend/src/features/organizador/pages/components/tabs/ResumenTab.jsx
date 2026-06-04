import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function ResumenTab({ stats, navigate, misCompetencias = [], playersAudit }) {
  const audits = stats?.audits || {};
  const perfilUsuarioCount = audits.perfil?.usuario?.length || 0;
  const perfilOrgCount = audits.perfil?.organizaciones?.reduce((acc, o) => acc + (o.campos_faltantes?.length || 0), 0) || 0;
  const perfilTotal = perfilUsuarioCount + perfilOrgCount;

  const equiposCount = audits.equipos?.length || 0;
  const traspasosCount = audits.traspasos?.length || 0;
  const partidosCount = audits.partidos?.length || 0;
  const competenciasCount = audits.competencias?.length || 0;
  
  const playersMissingCount = playersAudit?.missingData?.length || 0;
  const playersSimilarCount = playersAudit?.similarGroups?.length || 0;
  const playersTotal = playersMissingCount + playersSimilarCount;

  const criticalCount = partidosCount + playersSimilarCount;
  const warningCount = equiposCount + playersMissingCount + competenciasCount;
  const hasAlerts = criticalCount > 0 || warningCount > 0 || traspasosCount > 0 || perfilTotal > 0;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border/10 pb-3">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">📢 Estado General y Novedades</h4>
          <p className="text-xs text-muted-foreground">Alertas críticas, reportes pendientes y avisos inusuales de la liga.</p>
        </div>
      </div>

      {/* Top Status Indicators Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 flex flex-col justify-between shadow-inner">
          <span className="text-[9px] font-mono text-destructive/80 font-black uppercase tracking-wider">Gravedad Alta</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-display font-black text-destructive">{criticalCount}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Incidencias</span>
          </div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-inner">
          <span className="text-[9px] font-mono text-amber-500/80 font-black uppercase tracking-wider">Gravedad Media</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-display font-black text-amber-500">{warningCount}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Alertas</span>
          </div>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col justify-between shadow-inner">
          <span className="text-[9px] font-mono text-primary/85 font-black uppercase tracking-wider">Por Firmar</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-display font-black text-primary">{traspasosCount}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Fichajes</span>
          </div>
        </div>
        <div className="bg-purple-500/5 border border-purple-500/25 rounded-2xl p-4 flex flex-col justify-between shadow-inner">
          <span className="text-[9px] font-mono text-purple-400/80 font-black uppercase tracking-wider">Branding Torneo</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-display font-black text-purple-400">{perfilTotal}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Campos</span>
          </div>
        </div>
      </div>

      {!hasAlerts ? (
        <div className="p-8 border border-dashed border-emerald-500/30 bg-emerald-500/5 rounded-2xl text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-xl">🛡️</div>
          <p className="text-sm font-bold text-emerald-400 mt-3">Todo en orden en tus circuitos</p>
          <p className="text-xs text-muted-foreground mt-1">No se registran reportes faltantes ni anomalías administrativas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Alerta de Reportes Faltantes */}
          {partidosCount > 0 && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-destructive uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  Reportes Faltantes / Atrasados ({partidosCount})
                </span>
                <Button size="xs" variant="outline" className="h-6 text-[9px] font-bold border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => navigate('/organizador/partidos')}>
                  Ver Partidos
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Existen partidos que ya pasaron su fecha oficial de juego pero siguen sin goles ni estadísticas reportadas. Esto congela la tabla general de posiciones.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {audits.partidos.slice(0, 4).map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-black/25 border border-border/20 p-2.5 rounded-xl text-xs">
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-foreground truncate">{p.local} vs {p.visitante}</span>
                      <span className="text-[9px] text-muted-foreground font-mono mt-0.5">{p.competencia} • {p.fecha}</span>
                    </div>
                    <Badge variant="error" className="text-[8px] uppercase tracking-wider font-black">Sin Reporte</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anomalías de Roster/Capitanes */}
          {equiposCount > 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
              <span className="text-xs font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                Anomalías en Plantillas / Capitanes ({equiposCount})
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Se detectaron clubes con rosters vacíos, sin capitán asignado o sin registrar su EA ID oficial. Esto impide la correcta sincronización automática de partidos.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {audits.equipos.slice(0, 4).map((eq, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-black/25 border border-border/20 p-2.5 rounded-xl text-xs">
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-foreground truncate">{eq.nombre}</span>
                      <span className="text-[9px] text-muted-foreground font-mono mt-0.5">{eq.organizacion}</span>
                    </div>
                    <Badge variant="error" className="text-[8px] uppercase tracking-wider font-black">
                      {eq.tipo === 'plantilla_vacia' ? 'Sin Roster' : eq.tipo === 'sin_capitan' ? 'Sin Capitán' : 'Sin EA ID'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fichas de Jugadores Incompletas */}
          {playersMissingCount > 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
              <span className="text-xs font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Fichas de Jugadores Incompletas ({playersMissingCount})
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Hay jugadores registrados en el sistema que no cuentan con GamerTAG o EA ID, impidiendo que participen reglamentariamente.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {playersAudit.missingData.slice(0, 4).map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-black/25 border border-border/20 p-2.5 rounded-xl text-xs">
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-foreground truncate">{p.name}</span>
                      <span className="text-[9px] text-muted-foreground font-mono mt-0.5">{p.email}</span>
                    </div>
                    <Badge variant="brand" className="text-[8px] uppercase tracking-wider font-black">
                      {p.missingGt ? 'Sin GamerTAG' : 'Sin EA ID'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conflictos de Similitud */}
          {playersSimilarCount > 0 && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl space-y-3">
              <span className="text-xs font-black text-destructive uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
                </svg>
                Conflictos de Similitud en GamerTAGs ({playersSimilarCount})
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Se detectaron registros de jugadores con GamerTAGs extremadamente similares en la base de datos, lo que podría indicar cuentas duplicadas o suplantaciones.
              </p>
              
              <div className="space-y-2 mt-2">
                {playersAudit.similarGroups.slice(0, 2).map((group, idx) => (
                  <div key={idx} className="bg-black/25 border border-border/20 p-3 rounded-xl space-y-2">
                    <span className="text-[9px] text-destructive font-mono font-black uppercase tracking-wider block">🚨 Conflicto #{idx + 1}</span>
                    <div className="flex flex-wrap gap-2">
                      {group.map(p => (
                        <div key={p.id} className="bg-card border border-border/40 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-foreground">
                          🎮 {p.gamertag} <span className="text-[9px] text-muted-foreground font-light">({p.name})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Traspasos Pendientes */}
          {traspasosCount > 0 && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                  Solicitudes de Fichaje en Espera ({traspasosCount})
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Hay firmas de traspaso de jugadores pendientes de aprobación administrativa.
                </p>
              </div>
              <Button size="sm" className="text-xs font-bold whitespace-nowrap bg-primary text-primary-foreground" onClick={() => navigate('/organizador/traspasos')}>
                Fichajes
              </Button>
            </div>
          )}

          {/* Branding y Perfil */}
          {perfilTotal > 0 && (
            <div className="p-4 bg-card border border-border/50 rounded-xl space-y-2">
              <span className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 100-18.008 9.004 9.004 0 000 18.008zm0 0V3m0 18c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m-9 9h18" />
                </svg>
                Datos de branding corporativo incompletos
              </span>
              <p className="text-[11px] text-muted-foreground">
                Tus organizaciones o perfil tienen campos obligatorios sin llenar. Completa logos, banners y correos de contacto para mejorar la presencia de la liga.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sección de Detalle: Divisiones Recientes y Consola Rápida */}
      <div className="border-t border-border/10 pt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Listado de Ligas en curso */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
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
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
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
    </div>
  );
}
