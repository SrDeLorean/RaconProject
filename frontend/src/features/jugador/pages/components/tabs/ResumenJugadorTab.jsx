import React from 'react';
import Card from '@/components/shared/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function ResumenJugadorTab({ profileData, solicitudes, navigate, onTabChange }) {
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
    <div className="space-y-8 animate-fade-in">
      {/* Panel de Estado y Cumplimiento (Auditoría del Jugador) */}
      <div className="border border-border/40 bg-card/20 backdrop-blur-xl rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow Background */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-display font-black text-foreground uppercase tracking-wider">
              Estado y Cumplimiento
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Revisa tu situación reglamentaria y contractual actual.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
          {/* Identidad Deportiva */}
          <div className="p-5 bg-background/50 backdrop-blur-md hover:bg-background/80 border border-border/30 rounded-2xl flex flex-col justify-between gap-5 transition-all duration-300 shadow-sm group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Identidad Deportiva</span>
                <div className={`w-2 h-2 rounded-full ${missingFields.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
              </div>
              
              {missingFields.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-sm text-amber-500 font-bold flex items-center gap-1.5">
                    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Ficha Incompleta
                  </span>
                  <p className="text-xs text-muted-foreground">Falta configurar: <strong className="text-foreground font-semibold">{missingFields.join(', ')}</strong>.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-sm text-emerald-400 font-bold flex items-center gap-1.5">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Ficha Completa
                  </span>
                  <p className="text-xs text-muted-foreground">Tus datos reglamentarios están actualizados.</p>
                </div>
              )}
            </div>
            <Button size="sm" variant={missingFields.length > 0 ? "default" : "outline"} className={`text-[11px] font-bold w-full h-9 transition-all ${missingFields.length > 0 ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-none shadow-lg shadow-amber-500/30' : ''}`} onClick={() => navigate('/jugador/perfil')}>
              Editar mi Perfil
            </Button>
          </div>

          {/* Estado Contrato */}
          <div className="p-5 bg-background/50 backdrop-blur-md hover:bg-background/80 border border-border/30 rounded-2xl flex flex-col justify-between gap-5 transition-all duration-300 shadow-sm group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Vinculación Deportiva</span>
                <div className={`w-2 h-2 rounded-full ${contrato ? 'bg-emerald-500' : 'bg-cyan-500 animate-pulse'}`}></div>
              </div>

              {contrato ? (
                <div className="space-y-2">
                  <span className="text-sm text-emerald-400 font-bold flex items-center gap-1.5">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Contrato Activo
                  </span>
                  <p className="text-xs text-muted-foreground">Fichado en <strong className="text-foreground">{contrato.equipo_nombre}</strong> (Dorsal <strong className="text-primary font-mono font-bold">#{contrato.dorsal || 'N/A'}</strong>).</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-sm text-cyan-400 font-bold flex items-center gap-1.5">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Agente Libre
                  </span>
                  <p className="text-xs text-muted-foreground">No tienes contrato. Disponible en la bolsa de fichajes.</p>
                </div>
              )}
            </div>
            <Button size="sm" variant={contrato ? "outline" : "default"} className={`text-[11px] font-bold w-full h-9 transition-all ${!contrato ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-none shadow-lg shadow-cyan-500/30' : ''}`} onClick={() => navigate('/equipos')}>
              Buscar Clubes
            </Button>
          </div>

          {/* Ofertas Recibidas */}
          <div className="p-5 bg-background/50 backdrop-blur-md hover:bg-background/80 border border-border/30 rounded-2xl flex flex-col justify-between gap-5 transition-all duration-300 shadow-sm group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Propuestas y Fichajes</span>
                <div className={`w-2 h-2 rounded-full ${solicitudes.length > 0 ? 'bg-primary animate-ping' : 'bg-muted-foreground'}`}></div>
              </div>

              {solicitudes.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-sm text-primary font-bold flex items-center gap-1.5">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
                    </svg>
                    Nuevas Ofertas ({solicitudes.length})
                  </span>
                  <p className="text-xs text-muted-foreground">Tienes ofertas de contrato pendientes de aceptación en tu buzón.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground font-bold flex items-center gap-1.5">
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v2m16 4h-2a2 2 0 00-2 2v3a2 2 0 002 2h2a2 2 0 002-2v-3a2 2 0 00-2-2zM6 20h.01" />
                    </svg>
                    Buzón Vacío
                  </span>
                  <p className="text-xs text-muted-foreground">No tienes propuestas contractuales pendientes de respuesta.</p>
                </div>
              )}
            </div>
            <Button size="sm" variant={solicitudes.length > 0 ? "default" : "outline"} className={`text-[11px] font-bold w-full h-9 transition-all ${solicitudes.length > 0 ? 'bg-gradient-to-r from-primary to-destructive hover:opacity-90 text-white border-none shadow-lg shadow-primary/30' : ''}`} onClick={() => {
              if (onTabChange) {
                onTabChange('ofertas');
              } else {
                const el = document.getElementById('ofertas-seccion');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}>
              Revisar Ofertas
            </Button>
          </div>
        </div>
      </div>

      {/* Grid del Club Actual y Resumen de Estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">

        {/* Estadísticas Rápidas de Rendimiento */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center gap-2 border-b border-border/20 pb-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              Mis Métricas Históricas
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="p-5 flex flex-col items-center text-center shadow-lg border-border/20 bg-gradient-to-b from-card to-card/50 backdrop-blur-sm hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Partidos Jugados</span>
              <span className="text-3xl font-display font-black bg-clip-text text-transparent bg-gradient-to-br from-foreground to-muted-foreground mt-1">{careerStats.partidos_jugados}</span>
            </Card>

            <Card className="p-5 flex flex-col items-center text-center shadow-lg border-border/20 bg-gradient-to-b from-card to-card/50 backdrop-blur-sm hover:border-rose-500/40 hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 6a3 3 0 110 6 3 3 0 010-6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v6" />
                </svg>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Goles Acumulados</span>
              <span className="text-3xl font-display font-black bg-clip-text text-transparent bg-gradient-to-br from-rose-400 to-rose-600 mt-1">{careerStats.total_goles}</span>
            </Card>

            <Card className="p-5 flex flex-col items-center text-center shadow-lg border-border/20 bg-gradient-to-b from-card to-card/50 backdrop-blur-sm hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Asistencias</span>
              <span className="text-3xl font-display font-black bg-clip-text text-transparent bg-gradient-to-br from-emerald-400 to-emerald-600 mt-1">{careerStats.total_asistencias}</span>
            </Card>

            <Card className="p-5 flex flex-col items-center text-center shadow-lg border-border/20 bg-gradient-to-b from-card to-card/50 backdrop-blur-sm hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Valoración Media</span>
              <span className="text-3xl font-display font-black bg-clip-text text-transparent bg-gradient-to-br from-cyan-400 to-blue-500 mt-1">{Number(careerStats.promedio_valoracion || 0).toFixed(2)}</span>
            </Card>

            <Card className="p-5 flex flex-col items-center text-center shadow-lg border-border/20 bg-gradient-to-b from-card to-card/50 backdrop-blur-sm hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-300 group col-span-2 md:col-span-1">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c2.21 0 4-1.79 4-4V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v5c0 2.21 1.79 4 4 4zm0 0v6m-4 0h8M4 7h2m12 0h2" />
                </svg>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Premios MVP</span>
              <span className="text-3xl font-display font-black bg-clip-text text-transparent bg-gradient-to-br from-amber-400 to-amber-600 mt-1">{careerStats.total_mvp}</span>
            </Card>
          </div>
        </div>

        {/* Ficha del Club Activo */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 border-b border-border/20 pb-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              Club Actual
            </h3>
          </div>

          <div className="border border-border/30 bg-card/60 backdrop-blur-xl p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden text-center hover:border-primary/40 transition-all duration-500 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 delay-100"></div>
            
            {contrato ? (
              <div className="space-y-6 relative z-10">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-110"></div>
                    {contrato.equipo_logo ? (
                      <img 
                        src={contrato.equipo_logo.startsWith('http') ? contrato.equipo_logo : (typeof window.mediaUrl === 'function' ? window.mediaUrl(contrato.equipo_logo) : `http://localhost:8000${contrato.equipo_logo}`)} 
                        alt={contrato.equipo_nombre} 
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-primary/20 shadow-2xl bg-background relative z-10 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-muted border-2 border-primary/20 flex items-center justify-center relative z-10">
                        <svg className="w-12 h-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-display font-black text-foreground uppercase tracking-wide">{contrato.equipo_nombre}</h4>
                  <p className="text-[10px] text-primary/80 mt-1 uppercase font-bold tracking-[0.2em]">{contrato.organizacion_nombre}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-border/20 pt-5 text-xs text-left bg-background/30 p-3 rounded-2xl">
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Posición</span>
                    <span className="font-bold text-foreground text-sm">{contrato.posicion_bloque || 'Jugador'}</span>
                  </div>
                  <div className="flex flex-col items-center text-center border-l border-border/30">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Dorsal</span>
                    <span className="font-black text-primary font-mono text-xl leading-none">#{contrato.dorsal || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5 text-center py-8 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-lg shadow-emerald-500/10 group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em]">Estado Profesional</p>
                  <h4 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500 uppercase tracking-wider mt-2 drop-shadow-sm">Agente Libre</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed px-4">
                  Apareces de forma oficial en la bolsa de contratación. Los mánagers del circuito oficial pueden ficharte.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
