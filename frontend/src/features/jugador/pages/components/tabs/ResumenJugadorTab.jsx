import React from 'react';
import Card from '@/components/shared/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function ResumenJugadorTab({ profileData, solicitudes, navigate }) {
  const careerStats = profileData?.estadisticas || {
    partidos_jugados: 0,
    total_goles: 0,
    total_asistencias: 0,
    promedio_valoracion: 0,
    total_mvp: 0
  };
  const contrato = profileData?.contrato_activo;

  const missingFields = [];
  if (!profileData?.plataforma) missingFields.push('Plataforma');
  if (!profileData?.nacionalidad) missingFields.push('Nacionalidad');

  return (
    <div className="space-y-8">
      {/* Panel de Estado y Cumplimiento (Auditoría del Jugador) */}
      <div className="border border-border/40 bg-card/25 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <h2 className="text-sm font-display font-black text-foreground uppercase tracking-wider">
              Panel de Estado y Cumplimiento
            </h2>
            <p className="text-xs text-muted-foreground">
              Supervisa el estado reglamentario de tu ficha de deportista, contratos y ofertas de clubes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Identidad Deportiva */}
          <div className="p-4 bg-background/40 hover:bg-background/60 border border-border/30 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-300">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Identidad Deportiva</span>
              {missingFields.length > 0 ? (
                <div className="space-y-1.5">
                  <span className="text-xs text-amber-500 font-bold flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Ficha Incompleta
                  </span>
                  <p className="text-[11px] text-muted-foreground">Falta configurar: <strong className="text-foreground font-semibold">{missingFields.join(', ')}</strong>.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Ficha Completa
                  </span>
                  <p className="text-[11px] text-muted-foreground">Tus datos reglamentarios de jugador se encuentran actualizados.</p>
                </div>
              )}
            </div>
            <Button size="sm" variant="outline" className="text-[10px] font-bold w-full h-8" onClick={() => navigate('/organizador/perfil')}>
              Editar mi Perfil
            </Button>
          </div>

          {/* Estado Contrato */}
          <div className="p-4 bg-background/40 hover:bg-background/60 border border-border/30 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-300">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Vinculación Deportiva</span>
              {contrato ? (
                <div className="space-y-1.5">
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Contrato Activo
                  </span>
                  <p className="text-[11px] text-muted-foreground">Fichado en <strong className="text-foreground">{contrato.equipo_nombre}</strong> con dorsal <strong className="text-primary font-mono font-bold">#{contrato.dorsal || 'N/A'}</strong>.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <span className="text-xs text-amber-500 font-bold flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Agente Libre
                  </span>
                  <p className="text-[11px] text-muted-foreground">No tienes contrato activo. Disponible en la bolsa de fichajes.</p>
                </div>
              )}
            </div>
            <Button size="sm" variant="outline" className="text-[10px] font-bold w-full h-8" onClick={() => navigate('/equipos')}>
              Buscar Clubes
            </Button>
          </div>

          {/* Ofertas Recibidas */}
          <div className="p-4 bg-background/40 hover:bg-background/60 border border-border/30 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-300">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Propuestas y Fichajes</span>
              {solicitudes.length > 0 ? (
                <div className="space-y-1.5">
                  <span className="text-xs text-primary font-bold flex items-center gap-1.5 animate-pulse">
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
                    </svg>
                    Nuevas Ofertas ({solicitudes.length})
                  </span>
                  <p className="text-[11px] text-muted-foreground">Tienes ofertas de contrato pendientes de aceptación en tu buzón.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground font-bold flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v2m16 4h-2a2 2 0 00-2 2v3a2 2 0 002 2h2a2 2 0 002-2v-3a2 2 0 00-2-2zM6 20h.01" />
                    </svg>
                    Buzón Vacío
                  </span>
                  <p className="text-[11px] text-muted-foreground">No tienes propuestas contractuales pendientes de respuesta.</p>
                </div>
              )}
            </div>
            <Button size="sm" variant="outline" className="text-[10px] font-bold w-full h-8" onClick={() => {
              const el = document.getElementById('ofertas-seccion');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}>
              Revisar Ofertas
            </Button>
          </div>
        </div>
      </div>

      {/* Grid del Club Actual y Resumen de Estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        {/* Estadísticas Rápidas de Rendimiento */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              Mis Métricas Históricas
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="p-5 flex flex-col items-center text-center shadow-md border-border/40 hover:border-primary/40 hover:translate-y-[-2px] transition-all duration-300">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Partidos Jugados</span>
              <span className="text-3xl font-display font-black text-foreground mt-1.5">{careerStats.partidos_jugados}</span>
            </Card>

            <Card className="p-5 flex flex-col items-center text-center shadow-md border-border/40 hover:border-rose-500/30 hover:translate-y-[-2px] transition-all duration-300">
              <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 6a3 3 0 110 6 3 3 0 010-6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v6" />
                </svg>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Goles Acumulados</span>
              <span className="text-3xl font-display font-black text-rose-400 mt-1.5">{careerStats.total_goles}</span>
            </Card>

            <Card className="p-5 flex flex-col items-center text-center shadow-md border-border/40 hover:border-emerald-500/30 hover:translate-y-[-2px] transition-all duration-300">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Asistencias</span>
              <span className="text-3xl font-display font-black text-emerald-400 mt-1.5">{careerStats.total_asistencias}</span>
            </Card>

            <Card className="p-5 flex flex-col items-center text-center shadow-md border-border/40 hover:border-cyan-500/30 hover:translate-y-[-2px] transition-all duration-300">
              <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Valoración Media</span>
              <span className="text-3xl font-display font-black text-cyan-400 mt-1.5">{Number(careerStats.promedio_valoracion || 0).toFixed(2)}</span>
            </Card>

            <Card className="p-5 flex flex-col items-center text-center shadow-md border-border/40 hover:border-amber-500/30 hover:translate-y-[-2px] transition-all duration-300 col-span-2 md:col-span-1">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c2.21 0 4-1.79 4-4V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v5c0 2.21 1.79 4 4 4zm0 0v6m-4 0h8M4 7h2m12 0h2" />
                </svg>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Premios MVP</span>
              <span className="text-3xl font-display font-black text-amber-500 mt-1.5">{careerStats.total_mvp}</span>
            </Card>
          </div>
        </div>

        {/* Ficha del Club Activo */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              Club Actual
            </h3>
          </div>
          <div className="border border-border/50 bg-card p-6 rounded-3xl space-y-5 shadow-2xl relative overflow-hidden text-center hover:border-primary/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
            {contrato ? (
              <div className="space-y-5">
                <div className="flex justify-center">
                  {contrato.equipo_logo ? (
                    <img 
                      src={contrato.equipo_logo.startsWith('http') ? contrato.equipo_logo : `http://localhost:8000${contrato.equipo_logo}`} 
                      alt={contrato.equipo_nombre} 
                      className="w-20 h-20 rounded-2xl object-cover border border-border/40 shadow-xl bg-background"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-muted border border-border/40 flex items-center justify-center">
                      <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-display font-black text-foreground uppercase tracking-wide">{contrato.equipo_nombre}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-bold tracking-widest">{contrato.organizacion_nombre}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-border/30 pt-4 text-xs text-left">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Posición</span>
                    <span className="font-bold text-foreground">{contrato.posicion_bloque || 'Jugador'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Dorsal</span>
                    <span className="font-black text-primary font-mono text-sm">#{contrato.dorsal || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Estado Profesional</p>
                  <h4 className="text-sm font-black text-emerald-400 uppercase tracking-wider mt-1">🟢 Agente Libre</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed px-2">
                  Apareces de forma oficial en la bolsa de contratación. Los entrenadores y mánagers del circuito oficial pueden ficharte.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
