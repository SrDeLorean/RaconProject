import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import Card from '@/components/shared/Card';
import Button from '@/components/ui/Button';
import api from '@/api/axios';
import Alert from '@/components/shared/Alert';

export default function DashboardJugador() {
  const { user } = useAuthStore();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isProcessing, setIsProcessing] = useState(null);

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/solicitudes-fichaje?tipo=recibidas');
      setSolicitudes(response.data || []);
    } catch (error) {
      console.error("Error al obtener solicitudes de fichaje:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const handleResponder = async (id, respuesta) => {
    setIsProcessing(id);
    try {
      const response = await api.post(`/solicitudes-fichaje/${id}/responder`, { respuesta });
      setNotification({ variant: 'success', text: response.data.message || 'Respuesta registrada con éxito.' });
      await fetchSolicitudes();
    } catch (error) {
      setNotification({ variant: 'error', text: error.response?.data?.message || 'Error al procesar la solicitud.' });
    } finally {
      setIsProcessing(null);
    }
  };

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
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black uppercase tracking-wider mb-1">
            Centro de <span className="text-primary text-glow-primary">Fichajes</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hola, <span className="font-bold text-foreground">{user?.gamertag || user?.name}</span>. Gestiona tus ofertas contractuales y administra tu carrera competitiva.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA PRINCIPAL (2/3): SOLICITUDES DE FICHAJE PENDIENTES */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h2 className="text-base font-bold uppercase text-foreground tracking-wide flex items-center gap-2">
              <span>✉️</span> Ofertas Recibidas ({solicitudes.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
              <span className="text-xs uppercase font-bold text-muted-foreground animate-pulse">Sincronizando buzón...</span>
            </div>
          ) : solicitudes.length > 0 ? (
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
                      className="flex-1 h-9 text-xs bg-primary text-primary-foreground font-bold shadow-[0_0_10px_hsla(var(--primary),0.3)]"
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

        {/* COLUMNA LATERAL (1/3): ESTADO DE AGENTE LIBRE */}
        <div className="border border-border/50 bg-card/30 p-5 rounded-2xl space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
          
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border/50 pb-2 flex items-center gap-2">
            <span>🛡️</span> Estado del Jugador
          </h3>
          
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border/40">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl shrink-0">🏃‍♂️</div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Estado Profesional</p>
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
                  {user?.status === 'suspendido' ? '❌ Suspendido' : '🟢 Activo (Agente Libre)'}
                </h4>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {user?.status === 'suspendido' 
                ? 'Estás suspendido de manera administrativa. No podrás aparecer en la bolsa de fichajes ni recibir nuevas ofertas de clubes.'
                : 'Apareces de forma oficial en la bolsa de contratación. Los entrenadores y mánagers del circuito oficial pueden ficharte.'
              }
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}