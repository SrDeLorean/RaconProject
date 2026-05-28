import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function Organizaciones() {
  const [organizaciones, setOrganizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const response = await api.get('/organizaciones');
        setOrganizaciones(response.data?.data || response.data || []);
      } catch (error) {
        console.error("Error al cargar organizaciones públicas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgs();
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
            🔥 Estructura de Circuitos
          </Badge>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold uppercase tracking-tight leading-[0.85] text-foreground">
            NUESTRAS <span className="text-glow-primary bg-clip-text bg-gradient-to-r from-primary to-destructive text-transparent">ORGANIZACIONES</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-sans leading-relaxed">
            Explora los distintos circuitos competitivos y confederaciones que integran el ecosistema premium de RaconPro.
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest animate-pulse">Sincronizando confederaciones...</span>
          </div>
        ) : organizaciones.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {organizaciones.map((org) => (
              <div 
                key={org.id} 
                className="group border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between gap-6 relative overflow-hidden shadow-lg hover:border-primary/45 hover:shadow-[0_0_30px_rgba(var(--primary),0.05)] transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-4">
                    {org.logo ? (
                      <img 
                        src={org.logo} 
                        alt={org.nombre} 
                        className="w-14 h-14 rounded-xl object-cover border border-border/40 bg-muted/20"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-destructive/20 border border-primary/20 flex items-center justify-center font-display font-black text-primary text-xl">
                        {org.nombre?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-display font-black text-2xl text-foreground uppercase tracking-wide group-hover:text-primary transition-colors leading-none">
                        {org.nombre}
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-primary uppercase">Circuito ID: #{org.id}</span>
                    </div>
                  </div>

                  <div className="w-full h-px bg-border/40"></div>

                  <p className="text-xs text-muted-foreground leading-relaxed h-12 overflow-hidden">
                    {org.descripcion || 'Esta confederación organiza torneos de alto rendimiento deportivo e integración de clubes profesionales.'}
                  </p>
                </div>

                <Button 
                  onClick={() => navigate(`/organizaciones/${org.id}`)}
                  className="w-full h-10 text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-300 relative z-10"
                >
                  📅 Ver Temporadas Activas
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-border/60 bg-muted/25 rounded-2xl p-16 flex flex-col items-center text-center max-w-2xl mx-auto gap-6 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl">🏆</div>
            <div className="space-y-2">
              <h2 className="text-xl font-display font-black tracking-wide text-foreground uppercase">Sin Organizaciones Registradas</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Actualmente no se registran confederaciones competitivas públicas en nuestro centro de datos.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
