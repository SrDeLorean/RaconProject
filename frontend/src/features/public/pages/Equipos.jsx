import React, { useEffect, useState } from 'react';
import api from '@/api/axios';
import Badge from '@/components/ui/Badge';

export default function Equipos() {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEquipos = async () => {
      try {
        const response = await api.get('/equipos');
        setEquipos(response.data?.data || response.data || []);
      } catch (error) {
        console.error("Error al obtener lista de clubes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEquipos();
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
            🔥 Directorio de Escuadras
          </Badge>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold uppercase tracking-tight leading-[0.85] text-foreground">
            CLUBES <span className="text-glow-primary bg-clip-text bg-gradient-to-r from-primary to-destructive text-transparent">VIGENTES</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-sans leading-relaxed">
            Conoce todas las organizaciones y plantillas de equipos que disputan los campeonatos de RaconPro.
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest animate-pulse">Sincronizando equipos...</span>
          </div>
        ) : equipos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipos.map((eq) => (
              <div 
                key={eq.id} 
                className="group border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden shadow-lg hover:border-primary/45 transition-all duration-300 flex items-center gap-5"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

                {eq.logo ? (
                  <img 
                    src={eq.logo} 
                    alt={eq.nombre} 
                    className="w-16 h-16 rounded-xl object-cover border border-border/40 bg-muted/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-destructive/20 border border-primary/20 flex items-center justify-center font-display font-black text-primary text-2xl shrink-0 shadow-inner">
                    {eq.abreviatura || eq.nombre?.charAt(0)}
                  </div>
                )}

                <div className="space-y-1 z-10">
                  <h3 className="font-display font-black text-2xl text-foreground uppercase tracking-wide group-hover:text-primary transition-colors leading-none">
                    {eq.nombre}
                  </h3>
                  <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground font-semibold">
                    <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-mono font-bold uppercase">
                      {eq.plataforma}
                    </span>
                    <span className="bg-muted/50 border border-border/60 px-2 py-0.5 rounded font-bold uppercase">
                      {eq.abreviatura}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-border/60 bg-muted/25 rounded-2xl p-16 flex flex-col items-center text-center max-w-2xl mx-auto gap-6 shadow-sm">
            <span className="text-3xl">🛡️</span>
            <div className="space-y-2">
              <h2 className="text-xl font-display font-black tracking-wide text-foreground uppercase">Sin Clubes Fundados</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Actualmente no figuran escuadras ni clubes oficiales registrados en el directorio de la liga.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
