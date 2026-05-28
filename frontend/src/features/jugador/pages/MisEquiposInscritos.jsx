import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/api/axios';
import Alert from '@/components/shared/Alert';
import Button from '@/components/ui/Button';

export default function MisEquiposInscritos() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const fetchMisEquipos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/user/mis-equipos');
      setEquipos(response.data || []);
    } catch (error) {
      console.error("Error al obtener mis equipos inscritos:", error);
      setNotification({ variant: 'error', text: 'No se pudo cargar la información de tus equipos.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMisEquipos();
  }, []);

  return (
    <div className="animate-fade-in relative min-h-[500px]">
      {notification && (
        <Alert 
          variant={notification.variant} 
          className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" 
          onClose={() => setNotification(null)}
        >
          {notification.text}
        </Alert>
      )}

      {/* HEADER PRINCIPAL */}
      <div className="mb-8 border-b border-border/50 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black uppercase tracking-wider mb-1">
            Mis Clubes <span className="text-primary text-glow-primary">& Contratos</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Visualiza tu estatus competitivo, dorsales sugeridos y torneos activos en cada organización.
          </p>
        </div>
        <Button 
          onClick={fetchMisEquipos} 
          disabled={loading}
          variant="outline" 
          className="h-10 px-4 text-xs font-bold border-border/60 hover:bg-muted/50 transition-all duration-200"
        >
          🔄 Actualizar Fichas
        </Button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
          <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest animate-pulse">
            Sincronizando contratos de jugador...
          </span>
        </div>
      ) : equipos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipos.map((contrato) => (
            <div 
              key={contrato.id} 
              className="group border border-border/50 bg-card/30 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between gap-6 relative overflow-hidden shadow-lg hover:border-primary/40 hover:shadow-[0_0_25px_rgba(var(--primary),0.05)] transition-all duration-300"
            >
              {/* Resplandor decorativo de fondo */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-destructive/5 rounded-full blur-3xl pointer-events-none group-hover:from-primary/20 transition-all duration-500"></div>
              
              <div className="space-y-4 relative z-10">
                {/* Cabecera de la Ficha: Organización & Estatus */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {contrato.organizacion?.logo ? (
                      <img 
                        src={contrato.organizacion.logo} 
                        alt={contrato.organizacion.nombre} 
                        className="w-5 h-5 rounded object-cover border border-border/40"
                      />
                    ) : (
                      <span className="text-xs">🏆</span>
                    )}
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate max-w-[120px]">
                      {contrato.organizacion?.nombre}
                    </span>
                  </div>

                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border tracking-wider ${
                    contrato.estado_fichaje === 'aprobado' || contrato.estado_fichaje === 'activo'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : contrato.estado_fichaje === 'pendiente_admin'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-primary/10 text-primary border-primary/20'
                  }`}>
                    {contrato.estado_fichaje === 'pendiente_admin' ? 'Pendiente Admin' : contrato.estado_fichaje || 'Activo'}
                  </span>
                </div>

                {/* Info del Club */}
                <div className="flex items-center gap-4 py-2">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-destructive/20 border border-primary/20 flex items-center justify-center font-display font-black text-primary text-lg shadow-inner group-hover:scale-105 transition-transform duration-300">
                    {contrato.equipo?.abreviatura || 'EQ'}
                  </div>
                  <div>
                    <h3 className="font-display font-black text-xl text-foreground uppercase tracking-wide group-hover:text-primary transition-colors">
                      {contrato.equipo?.nombre}
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                      <span>Plataforma:</span>
                      <span className="text-foreground uppercase">{contrato.equipo?.plataforma}</span>
                    </p>
                  </div>
                </div>

                <div className="h-px bg-border/40 my-3"></div>

                {/* Detalles del Rol / Ficha del Jugador */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-muted/20 border border-border/30 rounded-xl p-2.5 flex flex-col justify-center">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Dorsal</span>
                    <span className="text-base font-black text-primary tracking-wide">
                      #{contrato.dorsal ?? 'N/A'}
                    </span>
                  </div>
                  <div className="bg-muted/20 border border-border/30 rounded-xl p-2.5 flex flex-col justify-center">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Posición</span>
                    <span className="text-xs font-black text-foreground truncate uppercase">
                      {contrato.posicion || 'Sin asignar'}
                    </span>
                  </div>
                </div>

                {/* Capitán del Equipo */}
                {contrato.equipo?.capitan && (
                  <div className="bg-muted/10 border border-border/30 rounded-xl p-3 space-y-1.5">
                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">Líder de Escuadra</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1">
                        👑 {contrato.equipo.capitan.name} 
                        {contrato.equipo.capitan.gamertag && (
                          <span className="text-[10px] text-primary font-mono font-bold">({contrato.equipo.capitan.gamertag})</span>
                        )}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold font-mono truncate">{contrato.equipo.capitan.email}</span>
                    </div>
                  </div>
                )}

                {/* Torneos Inscritos */}
                <div className="space-y-2 pt-1">
                  <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">Competencias Inscritas</span>
                  {contrato.torneos && contrato.torneos.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {contrato.torneos.map((torneo) => (
                        <span 
                          key={torneo.id} 
                          className="text-[9px] bg-muted/40 text-foreground border border-border/60 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 hover:border-primary/50 transition-colors"
                        >
                          🏆 {torneo.nombre}
                          <span className="text-[8px] text-primary font-bold uppercase opacity-80 font-mono">({torneo.formato})</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground/60 italic font-medium">Ningún torneo activo registrado en este circuito.</p>
                  )}
                </div>
              </div>

              {/* Botón Detalles */}
              <Button 
                onClick={() => navigate(`/jugador/mis-equipos/${contrato.equipo?.id}`)}
                className="w-full h-9 text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-300 relative z-10"
              >
                🏟️ Ver Sede del Club
              </Button>

              {/* Pie de Ficha */}
              <div className="border-t border-border/40 pt-4 flex justify-between items-center text-[10px] text-muted-foreground font-semibold relative z-10">
                <span>Vinculado el:</span>
                <span className="text-foreground font-mono font-bold">
                  {contrato.fecha_vinculacion ? contrato.fecha_vinculacion : 'Fecha no registrada'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-border/60 bg-muted/20 rounded-2xl p-16 flex flex-col items-center text-center max-w-2xl mx-auto mt-8 gap-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl animate-pulse">🛡️</div>
          <div className="space-y-2">
            <h2 className="text-xl font-display font-black tracking-wide text-foreground uppercase">Sin Inscripciones Activas</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Actualmente no figuras como competidor activo en la plantilla de ningún club. Explora ofertas o ponte en contacto con entrenadores del ecosistema para registrar tu incorporación.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
