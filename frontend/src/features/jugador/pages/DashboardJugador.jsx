import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import Card from '@/components/shared/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import api from '@/api/axios';
import Alert from '@/components/shared/Alert';
import Partidos from '@/features/public/pages/Partidos';

export default function DashboardJugador() {
  const { user } = useAuthStore();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isProcessing, setIsProcessing] = useState(null);

  const fetchSolicitudesYPerfil = async () => {
    setLoading(true);
    try {
      // 1. Obtener solicitudes de fichaje recibidas
      const responseOffers = await api.get('/solicitudes-fichaje?tipo=recibidas');
      setSolicitudes(responseOffers.data?.data || responseOffers.data || []);

      // 2. Obtener estadísticas detalladas del jugador
      if (user?.id) {
        const responseProfile = await api.get(`/usuarios/${user.id}`);
        setProfileData(responseProfile.data || null);
      }
    } catch (error) {
      console.error("Error al obtener datos del jugador:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudesYPerfil();
  }, [user]);

  const handleResponder = async (id, respuesta) => {
    setIsProcessing(id);
    try {
      const response = await api.post(`/solicitudes-fichaje/${id}/responder`, { respuesta });
      setNotification({ variant: 'success', text: response.data.message || 'Respuesta registrada con éxito.' });
      await fetchSolicitudesYPerfil();
    } catch (error) {
      setNotification({ variant: 'error', text: error.response?.data?.message || 'Error al procesar la solicitud.' });
    } finally {
      setIsProcessing(null);
    }
  };

  const careerStats = profileData?.estadisticas || {
    partidos_jugados: 0,
    total_goles: 0,
    total_asistencias: 0,
    promedio_valoracion: 0,
    total_mvp: 0
  };

  const contrato = profileData?.contrato_activo;

  return (
    <div className="animate-fade-in relative min-h-[500px] space-y-8">
      
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black uppercase tracking-wider mb-1 text-foreground">
            Oficina de <span className="text-glow-primary bg-clip-text bg-gradient-to-r from-primary to-destructive text-transparent">Jugador</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hola, <span className="font-bold text-foreground uppercase">{user?.gamertag || user?.name}</span>. Gestiona tus ofertas contractuales y administra tu carrera competitiva.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          <span className="text-xs uppercase font-bold text-muted-foreground animate-pulse">Sincronizando buzón...</span>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Fila de Estadísticas de Rendimiento */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            
            <Card className="p-4 flex flex-col items-center text-center shadow-md border-border/40 hover:border-primary/30 transition-all">
              <span className="text-xl mb-1">⚽</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Partidos Jugados</span>
              <span className="text-2xl font-display font-black text-foreground mt-1">{careerStats.partidos_jugados}</span>
            </Card>

            <Card className="p-4 flex flex-col items-center text-center shadow-md border-border/40 hover:border-primary/30 transition-all">
              <span className="text-xl mb-1">🔥</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Goles Acumulados</span>
              <span className="text-2xl font-display font-black text-primary mt-1">{careerStats.total_goles}</span>
            </Card>

            <Card className="p-4 flex flex-col items-center text-center shadow-md border-border/40 hover:border-primary/30 transition-all">
              <span className="text-xl mb-1">👟</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Asistencias</span>
              <span className="text-2xl font-display font-black text-foreground mt-1">{careerStats.total_asistencias}</span>
            </Card>

            <Card className="p-4 flex flex-col items-center text-center shadow-md border-border/40 hover:border-primary/30 transition-all">
              <span className="text-xl mb-1">⭐</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Valoración Media</span>
              <span className="text-2xl font-display font-black text-foreground mt-1">{careerStats.promedio_valoracion}</span>
            </Card>

            <Card className="p-4 flex flex-col items-center text-center shadow-md border-border/40 hover:border-primary/30 transition-all col-span-2 md:col-span-1">
              <span className="text-xl mb-1">🏆</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Premios MVP</span>
              <span className="text-2xl font-display font-black text-amber-500 mt-1">{careerStats.total_mvp}</span>
            </Card>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUMNA PRINCIPAL (2/3): SOLICITUDES DE FICHAJE PENDIENTES */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-lg font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                ✉️ Ofertas Recibidas ({solicitudes.length})
              </h3>

              {solicitudes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {solicitudes.map((sol) => (
                    <div key={sol.id} className="border border-border/50 bg-card/40 backdrop-blur-md rounded-2xl p-5 flex flex-col justify-between gap-5 relative overflow-hidden shadow-lg hover:border-primary/40 transition-colors">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded uppercase">
                            {sol.organizacion?.nombre || 'E-sports Liga'}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground"># {sol.dorsal || 'N/A'}</span>
                        </div>

                        <div>
                          <h4 className="font-display font-black text-lg text-foreground uppercase tracking-wide">
                            {sol.equipo?.nombre || 'Club Interesado'}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-normal mt-0.5">
                            Propuesta para jugar en la posición: <strong className="text-foreground">{sol.posicion || 'Sin asignar'}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-border/30 z-10">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 h-9 text-xs border-destructive/20 text-destructive hover:bg-destructive/10 font-bold"
                          disabled={isProcessing === sol.id}
                          onClick={() => handleResponder(sol.id, 'rechazar')}
                        >
                          Rechazar
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 h-9 text-xs bg-primary text-primary-foreground font-bold shadow-[0_0_10px_hsla(var(--primary),0.3)] animate-pulse-glow"
                          disabled={isProcessing === sol.id}
                          onClick={() => handleResponder(sol.id, 'aceptar')}
                        >
                          {isProcessing === sol.id ? 'Procesando...' : 'Aceptar'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 border border-dashed border-border/60 bg-muted/10 rounded-2xl flex flex-col items-center justify-center text-center gap-3 py-16">
                  <span className="text-3xl">📭</span>
                  <div className="space-y-1">
                    <h3 className="font-bold text-foreground text-sm uppercase">Sin ofertas pendientes</h3>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Tu buzón de traspasos está vacío. Los capitanes de clubes pueden enviarte ofertas si buscas un equipo en sus ligas.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* COLUMNA LATERAL (1/3): FICHA DEL CLUB ACTIVO */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                🛡️ Club Actual
              </h3>
              
              <div className="border border-border/50 bg-card/30 p-5 rounded-2xl space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
                
                {contrato ? (
                  <div className="space-y-4 text-center">
                    <div className="flex justify-center">
                      {contrato.equipo_logo ? (
                        <img 
                          src={contrato.equipo_logo.startsWith('http') ? contrato.equipo_logo : `http://localhost:8000${contrato.equipo_logo}`} 
                          alt={contrato.equipo_nombre} 
                          className="w-20 h-20 rounded-2xl object-cover border border-border/40 shadow-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-muted border border-border/40 flex items-center justify-center text-3xl">🛡️</div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-display font-black text-foreground uppercase tracking-wide">{contrato.equipo_nombre}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">{contrato.organizacion_nombre}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-border/30 pt-3 text-xs text-left">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Posición</span>
                        <span className="font-semibold text-foreground">{contrato.posicion_bloque || 'Jugador'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Dorsal</span>
                        <span className="font-semibold text-primary font-mono">#{contrato.dorsal || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-center py-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl mx-auto">🏃‍♂️</div>
                    <div>
                      <p className="text-xs uppercase font-bold text-muted-foreground">Estado Profesional</p>
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-wide mt-1">
                        {user?.status === 'suspendido' ? '❌ Suspendido' : '🟢 Agente Libre'}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed px-2">
                      {user?.status === 'suspendido' 
                        ? 'Estás suspendido de manera administrativa. No podrás aparecer en la bolsa de fichajes ni recibir nuevas ofertas de clubes.'
                        : 'Apareces de forma oficial en la bolsa de contratación. Los entrenadores y mánagers del circuito oficial pueden ficharte.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Calendario de Mis Partidos */}
          <div className="border-t border-border/20 pt-8 space-y-4">
            <h3 className="text-xl font-display font-black text-foreground uppercase tracking-wider flex items-center gap-2">
              🏟️ Mi Calendario de Partidos Asignados
            </h3>
            <div className="bg-card/25 border border-border/40 rounded-3xl p-4 md:p-6 shadow-inner">
              <Partidos forPlayer={true} hideHero={true} />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}