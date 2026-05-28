import React, { useEffect, useState } from 'react';
import api from '@/api/axios';
import Badge from '@/components/ui/Badge';

export default function Jugadores() {
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJugadores = async () => {
      try {
        const response = await api.get('/users');
        setJugadores(response.data?.data || response.data || []);
      } catch (error) {
        console.error("Error al obtener lista de jugadores:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJugadores();
  }, []);

  return (
    <div className="relative min-h-screen bg-background pt-28 pb-16 overflow-hidden">
      
      {/* Fondo Inmersivo */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1920&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/70 to-background z-10"></div>
      </div>

      {/* Resplandor ambiental e-sports */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none z-10 animate-pulse-glow"></div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <Badge 
            variant="primary"
            className="px-4 py-1.5 text-xs font-condensed tracking-widest text-primary border-primary/30 bg-primary/10 rounded-full animate-pulse-glow"
          >
            🔥 Salón de Competidores
          </Badge>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold uppercase tracking-tight leading-[0.85] text-foreground">
            DIRECTORIO DE <span className="text-glow-primary bg-clip-text bg-gradient-to-r from-primary to-destructive text-transparent">JUGADORES</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-sans leading-relaxed">
            Conoce a todos los competidores, agentes libres y estrellas inscritas en las ligas de RaconPro.
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest animate-pulse">Cargando salón...</span>
          </div>
        ) : jugadores.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {jugadores.map((jugador) => (
              <div 
                key={jugador.id} 
                className="group border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-5 relative overflow-hidden shadow-lg hover:border-primary/45 transition-all duration-300 flex flex-col justify-between gap-4"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-xl pointer-events-none"></div>

                <div className="space-y-3 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/10 to-destructive/10 border border-border/40 flex items-center justify-center font-display font-black text-primary text-sm shadow-inner uppercase">
                      {jugador.name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {jugador.name}
                      </h3>
                      <span className="text-[10px] font-bold font-mono text-primary uppercase">
                        🎮 {jugador.gamertag || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-border/40"></div>

                  <div className="space-y-1.5 text-[11px] text-muted-foreground font-semibold">
                    <div className="flex justify-between">
                      <span>Estatus:</span>
                      <span className="text-foreground capitalize">{jugador.rol || 'Jugador'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contacto:</span>
                      <span className="text-foreground truncate max-w-[120px] font-mono">{jugador.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-border/60 bg-muted/25 rounded-2xl p-16 flex flex-col items-center text-center max-w-2xl mx-auto gap-6 shadow-sm">
            <span className="text-3xl">👤</span>
            <div className="space-y-2">
              <h2 className="text-xl font-display font-black tracking-wide text-foreground uppercase">Sin Competidores</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Actualmente no figuran jugadores ni competidores registrados en el sistema.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
