import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/shared/Card';

export default function Temporadas() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const [organizacion, setOrganizacion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgDetail = async () => {
      try {
        const response = await api.get(`/organizaciones/${orgId}`);
        setOrganizacion(response.data);
      } catch (error) {
        console.error("Error al obtener detalles del circuito:", error);
      } finally {
        setLoading(false);
      }
    };
    if (orgId) {
      fetchOrgDetail();
    }
  }, [orgId]);

  if (loading) {
    return (
      <div className="pt-28 pb-16 min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <span className="text-sm font-bold tracking-widest text-primary uppercase animate-pulse">Cargando Temporadas...</span>
      </div>
    );
  }

  if (!organizacion) {
    return (
      <div className="pt-28 pb-16 text-center max-w-2xl mx-auto space-y-4">
        <h2 className="text-xl font-display font-black text-foreground uppercase">Organización No Encontrada</h2>
        <Button onClick={() => navigate('/organizaciones')}>Volver al listado</Button>
      </div>
    );
  }

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
        {/* Cabecera superior */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-border/50 pb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/organizaciones')}
              className="p-2.5 rounded-xl border border-border/60 hover:bg-muted/50 transition-all duration-200 active:scale-95 text-muted-foreground hover:text-foreground bg-card/40 backdrop-blur-md"
            >
              ⬅️ Atrás
            </button>
            <div>
              <Badge 
                variant="primary"
                className="px-2 py-0.5 text-[10px] font-condensed tracking-widest text-primary border-primary/30 bg-primary/10 rounded-full animate-pulse-glow"
              >
                {organizacion.nombre}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-display font-extrabold text-foreground tracking-wide uppercase mt-2 leading-[0.85]">
                TEMPORADAS <span className="text-glow-primary">OFICIALES</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Distribución en 2 columnas: Detalle Organizacion y Lista de Temporadas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Tarjeta lateral con TODO sobre la Organización */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 border border-border/50 backdrop-blur-md bg-card/25 shadow-lg relative overflow-hidden" withGlow>
              <div className="flex flex-col items-center text-center gap-4">
                {organizacion.logo ? (
                  <img 
                    src={organizacion.logo} 
                    alt={organizacion.nombre} 
                    className="w-20 h-20 rounded-2xl object-cover border border-border/40 bg-muted/20"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-destructive/20 border border-primary/20 flex items-center justify-center font-display font-black text-primary text-3xl shadow-inner">
                    {organizacion.nombre?.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="font-display font-black text-2xl text-foreground uppercase tracking-wide leading-none">{organizacion.nombre}</h2>
                  <Badge variant="success" className="mt-2">Circuito Activo</Badge>
                </div>
              </div>

              <div className="h-px bg-border/40 my-5"></div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block mb-1">Descripción del Circuito</span>
                  <p className="text-muted-foreground leading-relaxed">
                    {organizacion.descripcion || 'Este circuito administra y sanciona torneos Pro Clubes oficiales de alto rendimiento táctico.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-muted/10 border border-border/30 rounded-xl">
                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">País</span>
                    <span className="font-bold text-foreground">{organizacion.pais || 'Internacional'}</span>
                  </div>
                  <div className="p-2.5 bg-muted/10 border border-border/30 rounded-xl">
                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">Verificación</span>
                    <span className="font-bold text-primary">{organizacion.is_verified ? 'Verificada ✔️' : 'Estándar'}</span>
                  </div>
                </div>

                {organizacion.owner && (
                  <div className="p-3 bg-muted/10 border border-border/30 rounded-xl">
                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block mb-1">Director del Ecosistema</span>
                    <p className="font-bold text-foreground">👔 {organizacion.owner.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{organizacion.owner.email}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">Canales del Circuito</span>
                  {organizacion.discord_url && (
                    <a href={organizacion.discord_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground font-bold hover:text-primary transition-colors">
                      👾 Discord: <span className="text-primary font-mono truncate">{organizacion.discord_url}</span>
                    </a>
                  )}
                  {organizacion.twitter_url && (
                    <a href={organizacion.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground font-bold hover:text-primary transition-colors">
                      🐦 Twitter: <span className="text-primary font-mono truncate">{organizacion.twitter_url}</span>
                    </a>
                  )}
                  {organizacion.twitch_url && (
                    <a href={organizacion.twitch_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground font-bold hover:text-primary transition-colors">
                      📺 Twitch: <span className="text-primary font-mono truncate">{organizacion.twitch_url}</span>
                    </a>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Listado de Temporadas */}
          <div className="lg:col-span-2 space-y-6">
            {organizacion.temporadas && organizacion.temporadas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {organizacion.temporadas.map((temp) => (
                  <div 
                    key={temp.id} 
                    className="group border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between gap-6 relative overflow-hidden shadow-lg hover:border-primary/45 transition-all duration-300"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border tracking-wider ${
                          temp.activa 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-muted/20 text-muted-foreground border-border/50'
                        }`}>
                          {temp.activa ? 'En Curso' : 'Finalizada'}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">ID: #{temp.id}</span>
                      </div>

                      <h3 className="font-display font-black text-2xl text-foreground uppercase tracking-wide group-hover:text-primary transition-colors leading-none">
                        {temp.nombre}
                      </h3>

                      <p className="text-xs text-muted-foreground leading-relaxed h-12 overflow-hidden">
                        {temp.descripcion || 'Esta temporada define los ascensos y el circuito competitivo dentro del ecosistema.'}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground font-semibold font-mono">
                        <div>Inicio: {temp.fecha_inicio || 'N/A'}</div>
                        <div>Fin: {temp.fecha_fin || 'N/A'}</div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => navigate(`/organizaciones/${orgId}/temporadas/${temp.id}`)}
                      className="w-full h-10 text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    >
                      🏆 Ver Competencias y Ligas
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-border/60 bg-muted/25 rounded-2xl p-16 flex flex-col items-center text-center w-full gap-6 shadow-sm">
                <span className="text-3xl animate-bounce">📅</span>
                <div className="space-y-2">
                  <h2 className="text-xl font-display font-black tracking-wide text-foreground uppercase">Sin Temporadas Disponibles</h2>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Actualmente esta organización no cuenta con temporadas competitivas registradas en curso.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
